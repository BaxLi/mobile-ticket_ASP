import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Util } from '../../util/util';
import { PlatformLocation } from '@angular/common';
import { ConfirmDialogService } from "../../shared/confirm-dialog/confirm-dialog.service";
import { AlertDialogService } from "../../shared/alert-dialog/alert-dialog.service";
import { Config } from '../../config/config';

declare var MobileTicketAPI: any;

@Component({
  selector: 'app-visit-cancel',
  templateUrl: './visit-cancel.component.html',
  styleUrls: ['./visit-cancel.component.scss', '../../shared/css/common-styles.css']
})
export class VisitCancelComponent {

  @Input() isTicketEndedOrDeleted: boolean;
  @Input() isDelayFuncAvailable: boolean;
  @Input() isUrlAccessedTicket: boolean;
  @Input() isVisitCall: boolean;

  public btnTitleLeaveLine: string;
  public btnTitleChangeDelay: string;
  public btnTitleDelayVisit: string;
  public btnTitleArrive: string;
  public btnTitleNewTicket: string;
  public btnTitleOpenMeeting: string;
  public confirmMsg: string;
  public currentHash;
  public visitCancelled: boolean = false;
  public visitCancelledViaBtn: boolean = false;
  public delayInfo: any;

  constructor(location: PlatformLocation, private config: Config,
     public router: Router, private translate: TranslateService,
     private confirmDialogService: ConfirmDialogService, private alertDialogService: AlertDialogService) {
    this.translate.get('ticketInfo.btnTitleLeaveLine').subscribe((res: string) => {
      this.btnTitleLeaveLine = res;
    });
    this.translate.get('ticketInfo.btnTitleArrive').subscribe((res: string) => {
      this.btnTitleArrive = res;
    });
    this.translate.get('ticketInfo.btnTitleChangeDelay').subscribe((res: string) => {
      this.btnTitleChangeDelay = res;
    });
    this.translate.get('ticketInfo.delayVisitBtnText').subscribe((res: string) => {
      this.btnTitleDelayVisit = res;
    });
    this.translate.get('ticketInfo.btnTitleNewTicket').subscribe((res: string) => {
      this.btnTitleNewTicket = res;
    });
    this.translate.get('ticketInfo.leaveVisitConfirmMsg').subscribe((res: string) => {
      this.confirmMsg = res;
    });
    this.translate.get('ticketInfo.btnOpenMeeting').subscribe((res: string) => {
      this.btnTitleOpenMeeting = res;
    });
  }

  public getDelayTime() {
    let delay = MobileTicketAPI.getCurrentDelayInfo();
    if (delay === null || delay === undefined) {
      return 0;
    }
    let delayTime = delay * 1000;
    return delayTime;
  }

  public cancelVisitViaBrowserBack() {
    let util = new Util();
    MobileTicketAPI.cancelVisit(
      () => {
        if (!this.isUrlAccessedTicket) {
          MobileTicketAPI.clearLocalStorage();
        } else {
          MobileTicketAPI.updateCurrentVisitStatus();
        }
        MobileTicketAPI.resetAllVars();
        this.router.navigate(['**']);
      },
      (xhr, status, errorMsg) => {
        if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "11000") {
          this.translate.get('ticketInfo.visitAppRemoved').subscribe((res: string) => {
            this.alertDialogService.activate(res);
          });
        }
      });
  }

  // isConfirmed(): boolean {
    // this.confirmDialogService.activate(this.confirmMsg).then(res => {
    //   if (res === true) {
    //     this.visitCancelled = true;
    //     return true;
    //   }
    //   else {
    //     this.visitCancelled = false;
    //     return false;
    //   }
    // });
    // return;
    // if (confirm(this.confirmMsg)) {
    //   this.visitCancelled = true;
    //   return true;
    // }
    // else {
    //   this.visitCancelled = false;
    //   return false;
    // }

  // }


  cancelVisit() {
    let util = new Util();
    this.confirmDialogService.activate(this.confirmMsg).then(res => {
      if (res === true) {
        // Confirm Success Callback
        this.visitCancelled = true;
        this.visitCancelledViaBtn = true;
        MobileTicketAPI.cancelVisit(
          () => {
            if (!this.isUrlAccessedTicket) {
              MobileTicketAPI.clearLocalStorage();
            } else {
              MobileTicketAPI.updateCurrentVisitStatus();
            }
            MobileTicketAPI.resetAllVars();
            // 168477572 : Always route to thank you page
            // this.router.navigate(['branches']);
          },
          (xhr, status, errorMsg) => {
            if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "11000") {
              this.translate.get('ticketInfo.visitAppRemoved').subscribe((res: string) => {
                this.alertDialogService.activate(res);
              });
            }
          });
      } else {
        // Confirm fail Callback
        this.visitCancelledViaBtn = false;
        this.visitCancelled = false;
      }
    });


  }

  getButtonTitle(): string {
    return (this.isTicketEndedOrDeleted ? this.btnTitleNewTicket : (this.isVisitCall ? this.btnTitleOpenMeeting : this.btnTitleLeaveLine));
  }

  showButton(): boolean {
    return (!this.isTicketEndedOrDeleted ? true : (this.isUrlAccessedTicket) ? false : (this.getNewTicketAvailability()));
  }

  getNewTicket() {
    this.router.navigate(['branches']);
  }

  getNewTicketAvailability() {
    let createStatus = this.config.getConfig('create_new_ticket');
    if (createStatus === 'enable') {
      return true;
    } else {
      return false;
    }
  }

  getDelayVisitAvailability() {
    let delayStatus = this.config.getConfig('delay_visit').availability.value;
    if (delayStatus === 'enable' && MobileTicketAPI.getCurrentVisit() && (MobileTicketAPI.getCurrentVisit().appointmentId === null || MobileTicketAPI.getCurrentVisit().appointmentId === undefined)) {
      return true;
    } else {
      return false;
    }
  }
  
  openMeeting () {
    window.open(MobileTicketAPI.meetingUrl);
  }

  // onArrviceButtonClick() {
  //   MobileTicketAPI.delayVisit((visitInfo) => {
  //     console.log(visitInfo);
  //   }, (xhr, status, errorMessage) => {

  //   }, 0);
  // }

  onDelayButtonClick() {
    MobileTicketAPI.openDelayView(true);
    this.router.navigate(['delays']);
    // this.showLoader = true;
    //     MobileTicketAPI.createVisit(
    //         (visitInfo) => {
    //             ga('send', {
    //                 hitType: 'event',
    //                 eventCategory: 'visit',
    //                 eventAction: 'create',
    //                 eventLabel: 'vist-create'
    //             });
    //             this.showLoader = false;
    //             this.router.navigate(['ticket']);
    //             this.isTakeTicketClickedOnce = false;
    //         },
    //         (xhr, status, errorMessage) => {
    //             this.showLoader = false;
    //             let util = new Util();
    //             this.isTakeTicketClickedOnce = false;
    //             if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "8042") {
    //                 this.translate.get('error_codes.error_8042').subscribe((res: string) => {
    //                     this.alertDialogService.activate(res);
    //                 });
    //             } else if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === "11000") {
    //                 this.translate.get('ticketInfo.visitAppRemoved').subscribe((res: string) => {
    //                     this.alertDialogService.activate(res);
    //                 });
    //             } else if (errorMessage === 'Gateway Timeout') {
    //                 this.translate.get('connection.issue_with_connection').subscribe((res: string) => {
    //                     this.alertDialogService.activate(res);
    //                 });
    //             } else {
    //                 this.showHideNetworkError(true);
    //                 this.retryService.retry(() => {

    //                     /**
    //                     * replace this function once #140741231 is done
    //                     */
    //                     MobileTicketAPI.getBranchesNearBy(0, 0, 2147483647,
    //                         () => {
    //                             this.retryService.abortRetry();
    //                             this.showHideNetworkError(false);
    //                         }, () => {
    //                             //Do nothing on error
    //                         });
    //                 });
    //             }
    //         }, 60
    //     );
  }

  onArriveButtonClick() {
    MobileTicketAPI.setDelayTime(0);
    if (MobileTicketAPI.getEntryPointId() === undefined) {
      MobileTicketAPI.findEntrypointId(MobileTicketAPI.getSelectedBranch().id, (response) => {

        this.callDelayVisit();
      },
        (xhr, status, errorMessage) => {
          
        });
  } else {
    this.callDelayVisit();
  }
    
  }

  callDelayVisit() {
    MobileTicketAPI.delayVisit((visitInfo) => {
      console.log(visitInfo);
      
      this.router.navigate(['ticket']);
      
    }, (xhr, status, errorMessage) => {

    });
  }

  onButtonClick() {
    if (!this.isTicketEndedOrDeleted) {
      if (!this.isVisitCall) {
        this.cancelVisit();
      } else {
        this.openMeeting();
      }
    } else {
      this.getNewTicket();
    }
  }

}
