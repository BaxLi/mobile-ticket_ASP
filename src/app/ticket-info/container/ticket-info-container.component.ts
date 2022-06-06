import { Component, ViewChild, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { QueueEntity } from '../../entities/queue.entity';
import { Util } from '../../util/util';
import { BranchEntity } from '../../entities/branch.entity';
import { TranslateService } from '@ngx-translate/core';
import { Config } from '../../config/config';
import { TicketInfoService } from '../ticket-info.service';
import { VisitState } from '../../util/visit.state';

declare var MobileTicketAPI: any;

@Component({
  selector: 'app-ticket-info-container',
  templateUrl: './ticket-info-container-tmpl.html',
  styleUrls: ['./ticket-info-container.css', './ticket-info-container-rtl.css', '../../shared/css/common-styles.css']
})
export class TicketInfoContainerComponent implements OnInit, OnDestroy {
  
  public branchEntity: BranchEntity;
  public isTicketFlashed: boolean;
  public isTicketEndedOrDeleted: boolean;
  public isDelayFuncAvailable: boolean;
  public isVisitCall: boolean;
  public isVisitRecycled: boolean;
  public visitCallMsg: string;
  public isRtl: boolean;
  public isNetworkErr: boolean;
  private notificaitonSound = new Audio();
  private visitState: VisitState;
  public isUrlAccessedTicket: boolean;
  private isSoundPlay: boolean;
  private isTicketEndPage: boolean;
  public prevVisitState: string;
  private _isAfterCalled: boolean;
  public isUrlVisitLoading: boolean;
  public visitCallMsgOne: string;
  public visitCallMsgThree: string;
  public visitRecycleMsg: string;
  public isCalled = false;
  public isVisitNotFound = false;
  private tmpBranchId: number;
  private tmpVisitId: number;
  public title1: string;
  public title2: string;
  public title3: string;
  public isMeetingAvailable: boolean;
  // private eventSub: Subscription;
  public redirectUrlLoading: boolean;
  public showQueue: boolean;
  public showAppTime: boolean;
  private checkedEvents: boolean = false;
  private userLanguage: string;
  public isTicketDeletedByUser: boolean;

  @ViewChild('ticketNumberComponent', {static: true}) ticketNumberComponent;
  @ViewChild('queueComponent', {static: true}) queueComponent;
  @ViewChild('cancelVisitComponent', {static: true}) cancelVisitComponent;

  constructor(private ticketService: TicketInfoService, public router: Router, private translate: TranslateService,
    private config: Config, private activatedRoute: ActivatedRoute) {
    this.isTicketFlashed = false;
    this.isTicketEndedOrDeleted = false;
    this.isDelayFuncAvailable = false;
    this.isVisitCall = false;
    this.visitCallMsg = undefined;
    this.visitCallMsgOne = undefined;
    this.visitCallMsgThree = undefined;
    this.isSoundPlay = false;
    this._isAfterCalled = false;
    this.isVisitRecycled = false;
    this.isUrlVisitLoading = true;
    this.visitState = new VisitState();
    this.isMeetingAvailable = false;
    this.redirectUrlLoading = false;

    this.router.onSameUrlNavigation ='reload';
    this.router.routeReuseStrategy.shouldReuseRoute = function(){
      return false;
   }
//    this.eventSub = this.router.events.subscribe((evt) => {
//     if (evt instanceof NavigationEnd) {
//        // trick the Router into believing it's last link wasn't previously loaded
//        this.router.navigated = false;
//     }
// });

    this.getSelectedBranch();
    this.userLanguage = navigator.language;
    if (typeof navigator !== 'undefined' && navigator) {
      this.userLanguage = navigator.language.split('-')[0];
    }
    

    /**
     * this is commented
     * Issue: once called and ended a ticket and next time issued a ticket
     * previosuly ticket called screen is shown for a while.
     */
    /**
    if (MobileTicketAPI.getCurrentVisitStatus() !== undefined) {
      this.onVisitStatusUpdate(MobileTicketAPI.getCurrentVisitStatus());
    }
    */

  }

  ngOnInit() {
    this.isTicketDeletedByUser = false;
    this.scrollPageToTop();
    this.loadNotificationSound();
    this.setRtlStyles();
    this.loadTranslations();

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

  }

  loadTranslations() {
    this.translate.get('ticketInfo.titleYourTurn').subscribe((res: string) => {
      this.title1 = res;
      this.translate.get('ticketInfo.ticketReady').subscribe((res: string) => {
        this.title2 = res;
      });
    });
    this.translate.get('ticketInfo.ticketReadyWithNoName').subscribe((res: string) => {
      this.title3 = res;
    });
  }

  get isAfterCalled(): boolean {
    return this._isAfterCalled;
  }


  loadNotificationSound() {
    let fileName = this.config.getConfig('notification_sound');
    this.notificaitonSound.src = './app/resources/' + fileName;
    this.notificaitonSound.load();
    this.isSoundPlay = false;
  }

  scrollPageToTop() {
    window.scrollTo(0, 0);
  }

  onUrlAccessedTicket(isUrl: boolean) {
    this.isUrlAccessedTicket = isUrl;
  }

  onUrlVisitLoading(isLoading: boolean) {
    this.isUrlVisitLoading = isLoading;
  }

  onVisitNotFound(isNotFound) {
    this.isVisitNotFound = isNotFound;
  }

  playNotificationSound() {
    this.isSoundPlay = true;
    this.notificaitonSound.play();
  }

  stopNotificationSound() {
    this.notificaitonSound.pause();
  }

  ngOnDestroy() {
    // if (this.eventSub) {
    //   this.eventSub.unsubscribe();
    // }
  }


  public setVisitCancelCalled(called) {
    this.isCalled = called;
  }

  public getVisitCancelCalled(): boolean {
    return this.isCalled;
  }

  isConfirmed(): boolean {
    return this.cancelVisitComponent.isConfirmed();

  }

  isVisitCanceledOnce(): boolean {
    return this.cancelVisitComponent.visitCancelled;
  }

  isVisitCanceledThroughLeaveLineBtn() {
    return this.cancelVisitComponent.visitCancelledViaBtn;
  }

  cancelVisit() {
    this.cancelVisitComponent.cancelVisitViaBrowserBack();
  }

  public getDelayTime() {
    let delay = MobileTicketAPI.getCurrentDelayInfo();
    if (delay === null || delay === undefined) {
      return 0;
    }
    let delayTime = delay * 1000;
    return delayTime;
  }

  getDelayVisitAvailability() {
    let delayStatus = this.config.getConfig('delay_visit').availability.value;
    if (delayStatus === 'enable' && MobileTicketAPI.getCurrentVisit() && (MobileTicketAPI.getCurrentVisit().appointmentId === null || MobileTicketAPI.getCurrentVisit().appointmentId === undefined)) {
      return true;
    } else {
      return false;
    }
  }
  

  getButtonStatus() {
    if (this.getDelayTime() > 0 && this.isDelayFuncAvailable && this.getDelayVisitAvailability() && !this.isTicketEndedOrDeleted && !this.isVisitCall ){
      return true
    } else {
      return false;
    }    
  }

  public onServiceNameUpdate(serviceName) {
    let serviceNme = undefined;
    if (serviceName === null) {
      serviceNme = 'null';
    }
    else {
      serviceNme = serviceName;
    }
    this.ticketNumberComponent.onServiceNameUpdate(serviceNme);
  }

  public onTciketNmbrChange(event) {
    this.ticketNumberComponent.onTicketIdChange();
  }

  onVisitStatusUpdate(visitStatus: QueueEntity) {
    this.isVisitRecycled = false;
    this.updateBrowserTitle(visitStatus);
    this.isDelayFuncAvailable = visitStatus.queueId && visitStatus.queueId > 0 ? true : false;
    if (visitStatus.status && visitStatus.status === this.visitState.CALLED) {
      this.prevVisitState = visitStatus.status;
      let currentEvent = MobileTicketAPI.getCurrentVisitStatus();
      let firstName = currentEvent.firstName;
	    let lastName = currentEvent.lastName;
      let servicePoint = currentEvent.servicePointName;
      this.updateVisitCallMsg(firstName, servicePoint, lastName);
      this.isVisitCall = true;
      if (MobileTicketAPI.meetingUrl !== 'Not present' && MobileTicketAPI.meetingUrl !== undefined) {
        this.isMeetingAvailable = true;
      } else {
        this.isMeetingAvailable = false;
      }
      if (this.isSoundPlay === false) {
        this.playNotificationSound();
      }

      this.tmpBranchId = MobileTicketAPI.getSelectedBranch().id;
      this.tmpVisitId = MobileTicketAPI.getCurrentVisit().visitId;
    }
    else if (visitStatus.status === this.visitState.DELAYED) {
      this.prevVisitState = this.visitState.DELAYED;
      this.isVisitCall = false;
      this.isVisitRecycled = true;
      this.queueComponent.onVisitRecycled(true);
      this.isMeetingAvailable = false;
    }
    else if (visitStatus.status === this.visitState.IN_QUEUE) {
      this.isSoundPlay = false;
      this.isTicketFlashed = false;
      this.prevVisitState = this.visitState.IN_QUEUE;
      this.isVisitCall = false;
      this.isVisitRecycled = false;
      this.queueComponent.onVisitRecycled(false);
      this.isMeetingAvailable = false;
    }
    else if (visitStatus.status === this.visitState.CACHED) {
      if (this.prevVisitState === this.visitState.CALLED) {
        this._isAfterCalled = true;
      }
      else {
        this._isAfterCalled = false;
      }

      if (!this.isUrlAccessedTicket) {
        MobileTicketAPI.clearLocalStorage();
      } else {
        MobileTicketAPI.updateCurrentVisitStatus();
      }
      MobileTicketAPI.resetAllVars();
      this.isTicketEndedOrDeleted = true;
      this.isVisitCall = false;
      this.isMeetingAvailable = false;
      MobileTicketAPI.resetCurrentVisitStatus();
      this.stopNotificationSound();
      this.openCustomerFeedback(this.tmpBranchId, this.tmpVisitId);
    }
    else if (visitStatus && visitStatus.visitPosition === null) {
      if (this.prevVisitState === this.visitState.CALLED) {
        this._isAfterCalled = true;
      }
      else {
        this._isAfterCalled = false;
      }

      if (!this.isUrlAccessedTicket) {
        MobileTicketAPI.clearLocalStorage();
      } else {
        MobileTicketAPI.updateCurrentVisitStatus();
      }
      MobileTicketAPI.resetAllVars();
      this.isTicketEndedOrDeleted = true;
      this.isVisitCall = false;
      this.isMeetingAvailable = false;
      MobileTicketAPI.resetCurrentVisitStatus();
      this.stopNotificationSound();
      this.openCustomerFeedback(this.tmpBranchId, this.tmpVisitId);
    }
  }

  onNetworkErr(isNetwrkErr: boolean) {
    this.isNetworkErr = isNetwrkErr;
  }

  openCustomerFeedback(branchId, visitId) {
    this.redirectUrlLoading = true;
    if (this.isTicketEndedOrDeleted === true && this.isAfterCalled) {
      let customerFeedBackUrl = this.config.getConfig('customer_feedback');
      if (new Util().isValidUrl(customerFeedBackUrl)){
        if (customerFeedBackUrl && customerFeedBackUrl.length > 0) {
          customerFeedBackUrl = customerFeedBackUrl + '?' + 'b=' + branchId + '&' + 'v=' + visitId;
          window.location.href = customerFeedBackUrl;
        } else {
          this.redirectUrlLoading = false;
        }
      } else {
        this.redirectUrlLoading = false;
      }
    } else {
      this.redirectUrlLoading = false;
    }
  }

  updateVisitCallMsg(firstName: string, servicePointName: string, lastName: string) {
    if (servicePointName !== '') {
      this.visitCallMsgOne = this.title1;
      if(firstName !== null && firstName !== '') {
        this.visitCallMsg = this.title2.replace('{firstName}', firstName );
        this.visitCallMsg = this.visitCallMsg.replace('{lastName}', lastName );
      } else {
        this.visitCallMsg = this.title3;
      }
      this.visitCallMsgThree = servicePointName;
      if (this.ticketNumberComponent && !this.isTicketFlashed) {
        this.isTicketFlashed = true;
        this.ticketNumberComponent.startFlashing();
      }
    }
  }

  updateBrowserTitle(visitStatus: QueueEntity) {
    let title = '';
    this.translate.get('ticketInfo.defaultTitle').subscribe((res: string) => {
      title = res;
    });
    if (visitStatus.visitPosition === null && visitStatus.status === 'CALLED') {
      this.translate.get('ticketInfo.titleYourTurn').subscribe((res: string) => {
        title = res;
      });
    }
    else if (visitStatus.visitPosition > 0) {
      this.translate.get('ticketInfo.titleInLine').subscribe((res: string) => {
        title = res + ' ' + visitStatus.visitPosition;
      });

    }
    let status = MobileTicketAPI.getCurrentVisitStatus();
    let appTime = null;
    if (status) {
      appTime = status.appointmentTime;
    } else {
      appTime = null;
    }
    if (this.showQueue && (((appTime === null)) || !this.showAppTime && (appTime !== null))){
      document.title = title;
    } 
  }

  public getSelectedBranch() {
    /**
     * if selected branch id is not equal to current ongoing
     * branch id in multiple tab scenario,
     * reset vars to fetch branchId from cache
     */
    let visitInfo = MobileTicketAPI.getCurrentVisit();
    if (!this.isUrlAccessedTicket && visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
      if (MobileTicketAPI.getCurrentVisit().branchId !== MobileTicketAPI.getSelectedBranch().id) {
        MobileTicketAPI.resetAllVars();
      }
    }
    if (MobileTicketAPI.getSelectedBranch() !== null) {
      this.branchEntity = MobileTicketAPI.getSelectedBranch();
    }
    

    // if (this.config.getConfig('service_translation') === 'enable' && this.userLanguage) {
      
    //   MobileTicketAPI.getBranchTranslation(
    //     (branchTranslations) => {
    //       // development env
    //       const branches = branchTranslations.branchList;
    //       const branchData = [];
    //       branches.forEach(branch => {
    //         let newBranch: any = {};
    //         newBranch.id = branch.qpId;
    //         newBranch.custom = branch.custom;
    //         branchData.push(newBranch);
    //       });

    //       if(branchData && branchData.length > 0) {
    //           let matchedBranch = (branchData.find((b) => b.id == this.branchEntity.id));
    //           if(matchedBranch && matchedBranch.custom !== null){
    //             const translatedValue = JSON.parse(matchedBranch.custom).names[this.userLanguage];  
    //             if(translatedValue){
    //               this.branchEntity.name = translatedValue;
    //             }  
    //           }
    //       }
    //   });
    // } else {
    //   if (MobileTicketAPI.getSelectedBranch() !== null) {
    //     this.branchEntity = MobileTicketAPI.getSelectedBranch();
    //   }
    // }
    
    this.sendStatEvents();
  }

  public onBranchUpdate(event) {
    this.getSelectedBranch();
  }

  setRtlStyles() {
    if (document.dir === 'rtl') {
      this.isRtl = true;
    } else {
      this.isRtl = false;
    }
  }

  applyTicketEndStyles() {
    this.isTicketEndPage = true;
  }

  async sendStatEvents() {
    // stat events
    if (MobileTicketAPI.getSelectedBranch() && MobileTicketAPI.getCurrentVisit() && 
    MobileTicketAPI.getCurrentVisit().visitStatus !== "DELETE" && !this.checkedEvents){
      await MobileTicketAPI.getVisitEvents(MobileTicketAPI.getSelectedBranch().id, MobileTicketAPI.getCurrentVisit().visitId, (res) => {
        this.checkedEvents = true;
        if (!res) {
          var eventData = {'param': "MT_VISIT"};
          var eventName = "OPEN_MT_VISIT";
          
          MobileTicketAPI.sendCustomStatEvent(MobileTicketAPI.getSelectedBranch().id, MobileTicketAPI.getCurrentVisit().visitId, eventName, eventData);
        }
        
      });
    }
  }
  deletedByUser($event) {
    this.isTicketDeletedByUser = $event;
    this.isTicketEndedOrDeleted = $event;
    // this.deletedByUserSuccessed.emit($event)
    // console.log($event);
  }
}
