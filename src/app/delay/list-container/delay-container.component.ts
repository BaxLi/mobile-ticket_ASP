import { Component, OnInit } from '@angular/core';
import { BranchService } from '../../branch/branch.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ServiceEntity } from '../../entities/service.entity';
import { RetryService } from '../../shared/retry.service';
import { Util } from '../../util/util';
import { NavigationExtras } from '@angular/router';
import { AlertDialogService } from "../../shared/alert-dialog/alert-dialog.service";
import { Config} from '../../config/config';
import {BranchOpenHoursValidator} from '../../util/branch-open-hours-validator'
import { BranchScheduleService } from '../../shared/branch-schedule.service';
import { ServiceService } from 'app/service/service.service';
declare var MobileTicketAPI: any;
declare var ga: Function;

@Component({
    selector: 'delay-services-container',
    templateUrl: './delay-container-tmpl.html',
    styleUrls: ['./delay-container.css']
})

export class DelayContainerComponent implements OnInit {
    public subHeadingTwo;
    public showListShadow;
    public selectedDelay: any;
    private _showNetWorkError = false;
    public isDelayListEmpty: boolean = false;
    private isTakeTicketClickedOnce: boolean;
    public showLoader = false;
    public timeout: any;

    constructor(private branchService: BranchService, private serviceService: ServiceService, public router: Router,
        private translate: TranslateService, private retryService: RetryService, private alertDialogService: AlertDialogService,
        private config: Config, private openHourValidator: BranchOpenHoursValidator, private branchScheduleService: BranchScheduleService) {

        // serviceService.registerCountDownCompleteCallback(() => {
        //     this.router.navigate(['branches', { redirect: true }]);
        //     MobileTicketAPI.setServiceSelection(undefined);
        // }, branchService.isSingleBranch());

        // if (branchService.getSelectedBranch() === null) {
        //     this.router.navigate(['branches']);
        // }
        // else {
        //     this.translate.get('service.defaultTitle').subscribe((res: string) => {
        //         document.title = res;
        //     });

        //     this.translate.get('service.selectService').subscribe((res: string) => {
        //         this.subHeadingTwo = res + " " + branchService.getSelectedBranch() + ":";
        //     });
        // }

        var _thisObj = this;
        this.timeout = setTimeout(function(){
            _thisObj.onCancelDelay();
        }, 30000);
    }

    get showNetWorkError(): boolean { 
        return this._showNetWorkError; 
    }

    ngOnInit() {
        this.scrollPageToTop();
        this.getEntryPoint();
        MobileTicketAPI.openDelayView(false);
    }

    ngOnDestroy() {
        if (this.timeout){
            clearTimeout(this.timeout);
        }
    }

    scrollPageToTop() {
        window.scrollTo(0, 0);
    }

    getEntryPoint() {
        if (MobileTicketAPI.getEntryPointId() === undefined) {
            MobileTicketAPI.findEntrypointId(MobileTicketAPI.getSelectedBranch().id, (response) => {
            
            },
              (xhr, status, errorMessage) => {
                
              });
        }
    }

    showHideNetworkError(value: boolean) {
        this._showNetWorkError = value;
    }

    onServiceListHeightUpdate(boolShowListShadow: boolean) {
        this.showListShadow = boolShowListShadow;
    }

    saveSelectedDelay(selectedDelay: any) {
        this.selectedDelay = selectedDelay;
    }

    setDelayListEmpty(value: boolean) {
        this.isDelayListEmpty = true;
    }

    onCancelDelay() {
        let visitInfo = MobileTicketAPI.getCurrentVisit();
            if (visitInfo) {
                this.router.navigate(['ticket']);
            } else {
                this.router.navigate(['services']);
            }
    }

    onTakeTicket() {
        if(!this.selectedDelay){
            this.translate.get('service.selectDelay').subscribe((res: string) => {
                this.alertDialogService.activate(res);
            });
        }
        
        else {
            MobileTicketAPI.setDelayTime(this.selectedDelay.time * 60);
            let visitInfo = MobileTicketAPI.getCurrentVisit();
            if (visitInfo) {
                this.delayTicket();
            } else {
                this.takeTicket();
            }
        }
    }

    private takeTicket(): void {
        let customerPhoneData = this.config.getConfig('customer_data').phone_number.value;   
        let customerIdData = this.config.getConfig('customer_data').customerId.value;   
        let OtpService = this.config.getConfig('otp_service');   
        let isDeviceBounded  =  this.config.getConfig('block_other_browsers');
        let isFirstNameEnabled = this.config.getConfig('customer_data').first_name.value;
        let isLastNameEnabled = this.config.getConfig('customer_data').last_name.value;  
        if (!this.isTakeTicketClickedOnce) {
            let visitInfo = MobileTicketAPI.getCurrentVisit();
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.serviceService.stopBranchRedirectionCountDown();
                this.serviceService.stopServiceFetchTimer();
                this.router.navigate(['ticket']);
            }
            else {
                
                    this.serviceService.stopBranchRedirectionCountDown();
                    this.serviceService.stopServiceFetchTimer();
                    this.isTakeTicketClickedOnce = true;
                    let clientId;
                    ga(function (tracker) {
                        if (tracker.get('clientId')) {
                            clientId = tracker.get('clientId');
                        }
                        else {
                            clientId = '';
                        }
                    });
                    if ( (customerPhoneData === 'enable' || customerPhoneData === 'mandatory') 
                    || customerIdData === 'enable'
                    || (isFirstNameEnabled === 'enable' || isFirstNameEnabled === 'mandatory') 
                    || (isLastNameEnabled === 'enable' || isLastNameEnabled === 'mandatory')) {
                        MobileTicketAPI.setPhoneNumber('');
                        MobileTicketAPI.setCustomerId('');
                        MobileTicketAPI.setFirstName('');
                        MobileTicketAPI.setLastName('');
                        this.router.navigate(['customer_data']);
                    } else if (OtpService === 'enable'){
                        MobileTicketAPI.setOtpPhoneNumber('');
                        this.router.navigate(['otp_number']);
                    } else {
                        if ( isDeviceBounded === 'enable') {
                            import('fingerprintjs2').then(Fingerprint2 => {
                                var that = this;
                                Fingerprint2.getPromise({
                                  excludes: {
                                    availableScreenResolution: true,
                                    adBlock: true,
                                    enumerateDevices: true
                                  }
                                }).then(function (components) {
                                  var values = components.map(function (component) { return component.value });
                                  var murmur = Fingerprint2.x64hash128(values.join(''), 31);
                                  MobileTicketAPI.setFingerprint(murmur);
                                  that.createTicket();
                                })
                             });
                           

                        } else {
                            this.createTicket();
                        }
                    }
            }
        }
    }

    public delayTicket(){
        MobileTicketAPI.delayVisit((visitInfo) => {
            console.log(visitInfo);
            this.showLoader = false;
            this.router.navigate(['ticket']);
            this.isTakeTicketClickedOnce = false;
          }, (xhr, status, errorMessage) => {
            this.translate.get('service.delayVisitIssue').subscribe((res: string) => {
                this.alertDialogService.activate(res).then(res => {
                    this.router.navigate(['ticket']);
                  }, () => {
          
                  });
            });
          });
    }

    public createTicket() {
        this.showLoader = true;
        MobileTicketAPI.createVisit(
            (visitInfo) => {
                ga('send', {
                    hitType: 'event',
                    eventCategory: 'visit',
                    eventAction: 'create',
                    eventLabel: 'vist-create'
                });
                this.showLoader = false;
                this.router.navigate(['ticket']);
                this.isTakeTicketClickedOnce = false;
            },
            (xhr, status, errorMessage) => {
                this.showLoader = false;
                let util = new Util();
                this.isTakeTicketClickedOnce = false;
                if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "8042") {
                    this.translate.get('error_codes.error_8042').subscribe((res: string) => {
                        this.alertDialogService.activate(res);
                    });
                } else if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "11000") {
                    this.translate.get('ticketInfo.visitAppRemoved').subscribe((res: string) => {
                        this.alertDialogService.activate(res);
                    });
                } else if (errorMessage === 'Gateway Timeout') {
                    this.translate.get('connection.issue_with_connection').subscribe((res: string) => {
                        this.alertDialogService.activate(res);
                    });
                } else {
                    this.showHideNetworkError(true);
                    this.retryService.retry(() => {

                        /**
                        * replace this function once #140741231 is done
                        */
                        MobileTicketAPI.getBranchesNearBy(0, 0, 2147483647,
                            () => {
                                this.retryService.abortRetry();
                                this.showHideNetworkError(false);
                            }, () => {
                                //Do nothing on error
                            });
                    });
                }
            }
        );
    }


}
