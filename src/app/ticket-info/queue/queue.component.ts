import { Component, OnInit, OnDestroy, Output, Input, HostListener, EventEmitter } from '@angular/core';
import { QueueEntity } from '../../entities/queue.entity';
import { TicketInfoService } from '../ticket-info.service';
// import { Observable } from 'rxjs/Rx';
import { Subscription,timer } from 'rxjs';
// import { timer } from 'rxjs/observable/TimerObservable';
import { RetryService } from '../../shared/retry.service';
import { Router, ActivatedRoute } from '@angular/router';
import { BranchEntity } from '../../entities/branch.entity';
import { TranslateService } from '@ngx-translate/core';
import { VisitState } from '../../util/visit.state';
import { Util } from '../../util/util';
import { Config } from '../../config/config';

declare var MobileTicketAPI: any;
declare var ga: Function;
@Component({
  selector: 'app-queue-container',
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.css', './queue.component-rtl.css', '../../shared/css/common-styles.css']
})
export class QueueComponent implements OnInit, OnDestroy {

  public visitPosition: number;
  public prevWaitingVisits: number;
  public waitingVisits: number;
  public queueName: string;
  public branchId: number;
  public visitId: number;
  public queueId: number;
  public checksum: number;
  public upperBound: number;
  public lowerBound: number;
  public queueLength: Array<number> = [];
  public timer;
  public subscription: Subscription;
  public routerSubscription: Subscription;
  public prevVisitPosition: number;
  public prevUpperBound: number;
  public prevLowerBound: number;
  public queueHeading: string;
  public queueItems: Array<QueueEntity>;
  public isTicketEndedOrDeleted: boolean;
  public ticketEndHeading: string;
  public welcomeback: string;
  public isRtl: boolean;
  private showNetWorkError: boolean;
  private queueIdPrev: number = -1;
  private visitState: VisitState;
  public prevVisitState: string;
  public showQueue: boolean;
  public showDelay: boolean =  false;
  public showAppTime: boolean;
  public queueIsLoaded: boolean = true;
  public appointmentTime: string;
  public expireTime: string;
  public delayTimeOut: any;
  public delayExpireTime: string;
  private util;
  public expireTimer: any;

  @Output() onUrlAccessedTicket: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onTciketNmbrChange = new EventEmitter();
  @Output() onServiceNameUpdate: EventEmitter<string> = new EventEmitter<string>();
  @Output() onBranchUpdate = new EventEmitter();
  @Output() onUrlVisitLoading: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onVisitNotFound: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onVisitStatusUpdate: EventEmitter<QueueEntity> = new EventEmitter<QueueEntity>();
  @Output() onNetworkErr: EventEmitter<boolean> = new EventEmitter<boolean>();
  public visitRecycleMsg: string;


  constructor(public ticketService: TicketInfoService, private retryService: RetryService,
    private activatedRoute: ActivatedRoute,
    public router: Router, private translate: TranslateService,
    private config: Config) {
    this.visitPosition = 0;
    this.isTicketEndedOrDeleted = false;
    this.visitState = new VisitState();
    this.util = new Util();
  }

  ngOnInit() {
    this.setRtlStyles();
    if (this.config.getConfig('show_queue_position').trim() === 'enable') {
      this.showQueue = true;
    } else {
      this.showQueue = false;
    }
    if (this.config.getConfig('show_appointment_time').trim() === 'enable') {
      this.showAppTime = true;
    } else {
      this.showAppTime = false;
    }

    
    // subscribe to router event branchId=1&visitId=1&checksum=423434;
    this.routerSubscription = this.activatedRoute.queryParams.subscribe(
      (queryParams: any) => {
        let branchId = queryParams['branch'];
        let visitId = queryParams['visit'];
        let checksum = queryParams['checksum'];
        let visitInfo = MobileTicketAPI.getCurrentVisit();
        let isSameTicket = visitInfo && visitInfo !== null &&
             visitInfo.visitStatus === "DELETE" && visitInfo.branchId === branchId &&
              visitInfo.checksum === checksum && visitInfo.visitId === visitId ? true : false;
        if (visitInfo && visitInfo.visitStatus === "DELETE" && branchId && visitId && checksum && isSameTicket) {
          this.isTicketEndedOrDeleted = true;
          this.onUrlVisitLoading.emit(false);
          let queueInfo: QueueEntity = new QueueEntity();
          queueInfo.status = '';
          queueInfo.visitPosition = null;
          this.onUrlAccessedTicket.emit(true);
          this.onVisitStatusUpdate.emit(queueInfo);
        }
        else if (branchId && visitId && checksum) {
          this.onUrlVisitLoading.emit(true);
          this.ticketService.getBranchInformation(branchId, (success: boolean) => {
            if (!success) {
              this.onVisitNotFound.emit(true);
              this.router.navigate(['no_visit']);
            } else {
              // this.onBranchFetchSuccess(branch);
                MobileTicketAPI.setVisit(branchId, 0, visitId, checksum);
                this.ticketService.pollVisitStatus((queueInfo: QueueEntity, ticketId: any, queueId: any, appointmentId: any) => {
                MobileTicketAPI.setVisit(branchId, queueId, visitId, checksum, ticketId, appointmentId);
                this.onUrlVisitLoading.emit(false);
                
                const serviceTranstaltion = this.config.getConfig('service_translation');
                
                if(serviceTranstaltion === 'enable'){
                  MobileTicketAPI.setServiceSelection({ name: '' });
                  let userLanguage = 'en';
                  if (typeof navigator !== 'undefined' && navigator) {
                      userLanguage = navigator.language.split('-')[0];
                  }
                  try {
                    MobileTicketAPI.getServiceTranslation(
                      (serviceTranslations: any) => {

                          // development env
                          const services = serviceTranslations.serviceList;
                          const serviceData:any = [];
                          services.forEach(service => {
                              let newService:any = {};
                              newService.id = service.qpId;
                              newService.custom = service.custom;
                              newService.name = service.name;
                              serviceData.push(newService);
                          });
                          
                          let matchedService = (serviceData.find((s) => s.name == MobileTicketAPI.getCurrentVisitStatus().currentServiceName));
                          if(matchedService && matchedService.custom !== null){
                            let translatedValue = JSON.parse(matchedService.custom).names[userLanguage.toLowerCase()];
                            translatedValue = translatedValue !== null ? translatedValue : JSON.parse(matchedService.custom).names[userLanguage.toUpperCase()];
                              if(translatedValue){
                                MobileTicketAPI.setServiceSelection({ name: translatedValue });     
                              } else {
                                MobileTicketAPI.setServiceSelection({ name: MobileTicketAPI.getCurrentVisitStatus().currentServiceName });
                              }
                          }  
                      });
                  } catch (error) {
                    MobileTicketAPI.setServiceSelection({ name: MobileTicketAPI.getCurrentVisitStatus().currentServiceName });
                  } 
                  
                } else {
                  MobileTicketAPI.setServiceSelection({ name: MobileTicketAPI.getCurrentVisitStatus().currentServiceName });
                }
                
                
                this.onUrlAccessedTicket.emit(true);
                this.onBranchUpdate.emit();
                this.onTciketNmbrChange.emit();
                // this.onServiceNameUpdate.emit(MobileTicketAPI.getCurrentVisitStatus().currentServiceName);
                if(serviceTranstaltion === 'enable') {
                  const selectedService = MobileTicketAPI.getSelectedService();
                  if( selectedService && selectedService.name !== undefined) {
                    this.onServiceNameUpdate.emit(MobileTicketAPI.getSelectedService().name);  
                  }
                } else {
                  this.onServiceNameUpdate.emit(MobileTicketAPI.getCurrentVisitStatus().currentServiceName);
                }
                this.checkDelay();
                this.initPollTimer(this.visitPosition, this.ticketService);

                ga('send', {
                  hitType: 'event',
                  eventCategory: 'visit',
                  eventAction: 'open',
                  eventLabel: 'vist-open-url'
                });
              },
                (xhr, status, msg) => {
                  if (xhr.status === 404 || xhr.status === 401) {
                    MobileTicketAPI.resetAllVars();
                    MobileTicketAPI.clearLocalStorage();
                    this.onVisitNotFound.emit(true);
                    this.router.navigate(['no_visit']);
                  }
                }
              );
            }
          });
        }
        else {
          this.onUrlVisitLoading.emit(false);
          this.branchId = MobileTicketAPI.getCurrentVisit().branchId;
          this.visitId = MobileTicketAPI.getCurrentVisit().visitId;
          this.queueId = MobileTicketAPI.getCurrentVisit().queueId;
          this.checksum = MobileTicketAPI.getCurrentVisit().checksum;
          // MobileTicketAPI.setVisit(this.branchId, this.queueId, this.visitId);
          this.checkDelay();
          this.initPollTimer(this.visitPosition, this.ticketService);
        }
      });
  }

  public checkDelay() {
    if (MobileTicketAPI.getCurrentVisit().appointmentId === null ||  MobileTicketAPI.getCurrentVisit().appointmentId === undefined) {
      var _thisObj = this;
      MobileTicketAPI.getDelayInfo(MobileTicketAPI.getCurrentVisit().branchId, MobileTicketAPI.getCurrentVisit().visitId, function(){
        _thisObj.setDelayView();
      });
    }
  }


  public setDelayView() {
    let delayTime = this.getDelayTime();
    if (delayTime > 0) {
      this.showDelayTime();
      var _thisObj = this;
      if(this.delayTimeOut){
        clearTimeout(this.delayTimeOut);
      }
      this.delayTimeOut = setTimeout(function(){
        _thisObj.hideDelayTime();
      }, delayTime);
    }
  }


  public getDelayTime() {
    let delay = MobileTicketAPI.getCurrentDelayInfo();
    if (delay === null || delay === undefined) {
      return 0;
    }
    let delayTime = delay * 1000;
    this.delayExpireTime = delay;
    return delayTime;
  }

  public onVisitRecycled(isRecyled) {
    if (isRecyled) {
      this.translate.get('ticketInfo.visitRecycledMessage').subscribe((res: string) => {
        this.visitRecycleMsg = res;
      });
    }
    else {
      this.visitRecycleMsg = undefined;
    }
  }

  private onBranchFetchSuccess(branch) {
    MobileTicketAPI.setBranchSelection(branch);
  }

  private detectTransfer(currentQueueId: number) {
    return (this.queueIdPrev !== -1 && (this.queueIdPrev !== currentQueueId));
  }

  public initPollTimer(visitPosition, ticketService: TicketInfoService) {
    if (visitPosition > 5) {
      this.timer = timer(1000, 5000);
    }
    if (visitPosition <= 5) {
      this.timer = timer(1000, 1000);
    }
    this.subscription = this.timer.subscribe(visitPosition => {
      this.queuePoll(visitPosition, ticketService, false);
    });
  }

  public redirectToUnautherized() {
    MobileTicketAPI.clearLocalStorage();
    MobileTicketAPI.resetAllVars();
    MobileTicketAPI.resetCurrentVisitStatus();

    this.router.navigate(['unauthorized']);
  }

  public queuePoll(visitPosition, ticketService: TicketInfoService, onRetry: boolean) {
    this.doUnsubscribeForPolling();
    ticketService.pollVisitStatus((queueInfo: QueueEntity) => {
      this.doSubscribeForPolling();
      this.onQueuePollSuccess(queueInfo, ticketService);
      this.retryService.abortRetry();
      this.queueId = queueInfo.queueId;
      if (this.detectTransfer(this.queueId) === true) {
        if(this.config.getConfig('service_translation') === 'enable') {
          MobileTicketAPI.setServiceSelection({ name: MobileTicketAPI.getSelectedService().name });
        } else {
          MobileTicketAPI.setServiceSelection({ name: MobileTicketAPI.getCurrentVisitStatus().currentServiceName });
        } 
        this.onBranchUpdate.emit();
      }
      this.queueIdPrev = this.queueId;
    },
      (xhr, status, msg) => {
        this.doUnsubscribeForPolling();
        if (xhr === null) {
          let queueInfo: QueueEntity = new QueueEntity();
          queueInfo.status = '';
          queueInfo.visitPosition = null;
          this.isTicketEndedOrDeleted = true;
          this.onVisitStatusUpdate.emit(queueInfo);
        }
        else if (xhr.status !== 404 && !onRetry) {
          this.showHideNetworkError(true);
          this.retryService.retry(() => {
            this.queuePoll(visitPosition, ticketService, true);
          })
        } else if (xhr.status === 404) {
          /**
           * this is to try if initial polling failed
           */
          let queueInfo: QueueEntity = new QueueEntity();
          queueInfo.status = '';
          queueInfo.visitPosition = null;
          this.isTicketEndedOrDeleted = true;
          let payload = xhr.responseJSON;
          if (payload !== undefined &&
            payload.message.includes('New visits are not available until visitsOnBranchCache is refreshed') === true) {
            queueInfo.status = 'CACHED';
          }
          this.onVisitStatusUpdate.emit(queueInfo);
        }
      }
    );
  }

  private onQueuePollSuccess(queueInfo: QueueEntity, ticketService: TicketInfoService): void {
    this.showHideNetworkError(false);
    if (this.queueIsLoaded && MobileTicketAPI.getCurrentVisitStatus() && MobileTicketAPI.getCurrentVisitStatus().appointmentTime) {
      let appStart = new Date(MobileTicketAPI.getCurrentVisitStatus().appointmentTime.replace('T', ' ').replace(/-/g, '/'));
      this.appointmentTime = this.formatTime(appStart);
      this.queueIsLoaded = false;
    }
    this.prevWaitingVisits = this.waitingVisits;
    this.prevVisitPosition = this.visitPosition;
    this.visitPosition = queueInfo.visitPosition;
    this.waitingVisits = queueInfo.waitingVisits;
    this.prevUpperBound = ticketService.getQueueUpperBound(this.prevWaitingVisits, this.prevVisitPosition);
    this.prevLowerBound = ticketService.getQueueLowerBound(this.prevWaitingVisits, this.prevVisitPosition, this.prevUpperBound);
    /**
     * get selected service name from getCurrentVisitStatus() object instead
     * of getSelectedService()
     * because in multiple tab scenario, getSelectedService() returns the
     * value of the local variable which is not correct.
     */
    
    if(this.config.getConfig('service_translation') === 'enable') {
      const selectedService = MobileTicketAPI.getSelectedService();
      if( selectedService && selectedService.name !== undefined) {
        this.onServiceNameUpdate.emit(MobileTicketAPI.getSelectedService().name); 
      } else {
        this.onServiceNameUpdate.emit(MobileTicketAPI.getCurrentVisitStatus().currentServiceName);
      }
    } else {
      this.onServiceNameUpdate.emit(MobileTicketAPI.getCurrentVisitStatus().currentServiceName);
    }
    this.onVisitStatusUpdate.emit(queueInfo);
    this.prevVisitState = queueInfo.status;
    if (queueInfo.status === 'IN_QUEUE' || queueInfo.status === 'CALLED') {
      this.queueItems = ticketService.populateQueue(queueInfo, this.prevWaitingVisits,
        this.prevVisitPosition, this.prevUpperBound, this.prevLowerBound);
      this.updatePollTimer(this.visitPosition, ticketService);
    }
  }

  private formatTime(time) {


    let formatted = '';
    let format = this.config.getConfig('timeFormat');

    let min = time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes();
    let hours = '';

    if (format === 'HH:mm') {
      hours = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
      formatted = hours + ':' + min;
    }

    else if (format === 'hh:mm a') {
      if (time.getHours() > 12) {
        hours = (time.getHours() - 12) < 10 ? '0' + (time.getHours() - 12) : (time.getHours() - 12).toString();
        formatted = hours + ':' + min;
      }
      else {
        hours = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
        formatted = hours + ':' + min;
      }
      if (time.getHours() > 11) {
        formatted += ' pm';
      } else {
        formatted += ' am';
      }
    }
    else if (format === 'hh:mm') {
      if (time.getHours() > 12) {
        hours = (time.getHours() - 12) < 10 ? '0' + (time.getHours() - 12) : (time.getHours() - 12).toString();
      }
      else {
        hours = time.getHours() < 10 ? '0' + time.getHours() : time.getHours();
      }
      formatted = hours + ':' + min;
    }
    else if (format === 'h:mm') {
      if (time.getHours() > 12) {
        hours = '' + (time.getHours() - 12);
      }
      else {
        hours = time.getHours();
      }
      formatted = hours + ':' + min;
    }
    else if (format === 'h:mm a') {
      if (time.getHours() > 12) {
        hours = '' + (time.getHours() - 12);
        formatted = hours + ':' + min;
      }
      else {
        hours = time.getHours();
        formatted = hours + ':' + min;
      }
      if (time.getHours() > 11) {
        formatted += ' pm';
      } else {
        formatted += ' am';
      }
    }
    return formatted;
  }

  public updatePollTimer(visitPosition: number, ticketService: TicketInfoService) {
    if ((this.prevVisitPosition > 5 && this.visitPosition <= 5) ||
      (this.prevVisitPosition <= 5 && this.visitPosition > 5)) {
      this.doUnsubscribeForPolling();

      if (visitPosition > 5) {
        this.timer = timer(5000, 5000);
      }
      if (visitPosition <= 5) {
        this.timer = timer(1000, 1000);
      }
      this.doSubscribeForPolling();
    }
  }

  ngOnDestroy() {
    this.doUnsubscribeForPolling();
    this.routerSubscription.unsubscribe();

    if(this.delayTimeOut){
      clearTimeout(this.delayTimeOut);
    }
  }

  public doUnsubscribeForPolling() {
    if (this.subscription !== undefined && this.subscription.closed === false) {
      this.subscription.unsubscribe();
    }
  }

  public doSubscribeForPolling() {
    if (this.subscription.closed === true) {
      this.subscription = this.timer.subscribe(visitPosition => this.queuePoll(visitPosition, this.ticketService, false));
      // console.log(MobileTicketAPI.getCurrentVisitStatus());
      if (!MobileTicketAPI.getCurrentVisitStatus()) {
        console.log(MobileTicketAPI.getCurrentVisitStatus());
      }
    }
  }

  public showDelayTime() {
    this.prepareDelayTime();
    this.showQueue = false;
    this.showAppTime = false;
    this.showDelay  = true;
  }

  public hideDelayTime() {
    this.showDelay  = false;
    MobileTicketAPI.resetDelayInfo();
    if (this.config.getConfig('show_queue_position').trim() === 'enable') {
      this.showQueue = true;
    } 
    if (this.config.getConfig('show_appointment_time').trim() === 'enable') {
      this.showAppTime = true;
    }
  }

  @HostListener("document:visibilitychange", ["$event"])
  visibilitychange() {
    if (!document.hidden) {
      try {
        let browser = this.util.getDetectBrowser(navigator.userAgent);
        if (
          /iPhone|iPad|iPod/i.test(
            navigator.userAgent
          ) ||
          browser.name === "edgios" ||
          browser.name === "fxios" ||
          browser.name === "crios"
        ) {
          this.checkDelay();
        }
      } catch (e) {
        console.log(e);
      }
    }
  }

  public prepareDelayTime() {
    var _thisObj = this;
    var distance = _thisObj.getDelayTime() / 1000;
    if (this.expireTimer){
      clearInterval(this.expireTimer);
    }
    this.expireTimer = setInterval(function() {
    
      //var distance = _thisObj.getDelayTime();
    
      var hours = Math.floor((distance % (60 * 60 * 24)) / (60 * 60));
      var minutes = Math.floor((distance % (60 * 60)) / (60));
      var seconds = Math.floor((distance % (60)));
    
      _thisObj.expireTime = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
 
      if (distance < 0) {
        clearInterval(this.expireTimer);
      }
      distance = distance - 1;
    }, 1000);
  }

  setRtlStyles() {
    if (document.dir === 'rtl') {
      this.isRtl = true;
    } else {
      this.isRtl = false;
    }
  }

  showHideNetworkError(value: boolean) {
    this.showNetWorkError = value;
    this.onNetworkErr.emit(this.showNetWorkError);
  }
}
