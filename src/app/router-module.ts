import { ModuleWithProviders, NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { BranchesContainerComponent } from './branch/list-container/branches-container.component';
import { ServicesContainerComponent } from './service/list-container/services-container.component';
import { DelayContainerComponent } from './delay/list-container/delay-container.component';
import { TicketInfoContainerComponent } from './ticket-info/container/ticket-info-container.component';
import { VisitNotfoundComponent } from './ticket-info/visit-notfound/visit-notfound.component';
import { VisitCancelLeavelineGuard } from './ticket-info/visit-cancel/visit-cancel.leaveline.guard';
import { BranchNotfoundComponent } from './branch/branch-notfound/branch-notfound.component';
import { NotSupportComponent } from './shared/not-support/not-support.component';
import {BranchOpenHoursComponent} from './shared/branch-open-hours/branch-open-hours.component';
import {AppointmentComponent} from './appointment/appointment.component';
import {PrivacyPolicyComponent} from "./privacy-policy/privacy-policy.component";

import { AuthGuard } from './guard/index';
import { CustomerDataComponent } from './customer-data/customer-data.component';
import { CustomerDataGuard } from './customer-data/customer-data-guard';
import { CookieContainerComponent } from './cookie-container/cookie-container.component';
import { UnautherizedComponent } from './ticket-info/unautherized/unautherized.component';
import { OtpPinComponent } from './otp/otp-pin/otp-pin.component';
import { OtpPhoneNumberComponent } from './otp/otp-phone-number/otp-phone-number.component';
import { TicketLoaderComponent } from './ticket-loader/ticket-loader.component';
import { DelayDataGuard } from './delay/delay-data-guard';

export const router: Routes = [
    
    { path: 'open_hours', component: BranchOpenHoursComponent, canActivate: [AuthGuard] },
    { path: 'appointment', component: AppointmentComponent, canActivate: [AuthGuard] },
    { path: 'branches', component: BranchesContainerComponent, canActivate: [AuthGuard] },
    { path: 'services', component: ServicesContainerComponent, canActivate: [AuthGuard] },
    { path: 'delays', component: DelayContainerComponent, canActivate:  [DelayDataGuard] },
    { path: 'no_visit', component: VisitNotfoundComponent, canActivate: [AuthGuard] },
    { path: 'privacy_policy', component: PrivacyPolicyComponent,  canActivate: [CustomerDataGuard] },
    { path: 'cookie_consent', component: CookieContainerComponent},
    { path: 'customer_data', component: CustomerDataComponent, canActivate: [AuthGuard, CustomerDataGuard] },
    { path: 'otp_pin', component: OtpPinComponent, canActivate: [AuthGuard] },
    { path: 'otp_number', component: OtpPhoneNumberComponent, canActivate: [AuthGuard]},
    { path: 'no_support', component: NotSupportComponent },
    { path: 'no_branch', component: BranchNotfoundComponent, canActivate: [AuthGuard] },
    { path: 'unauthorized', component: UnautherizedComponent },
    { path: 'ticket', component: TicketInfoContainerComponent, canActivate: [AuthGuard], canDeactivate: [VisitCancelLeavelineGuard]},    
    { path: 'ticket_loading', component: TicketLoaderComponent},    
    { path: '**', component: TicketInfoContainerComponent, canActivate: [AuthGuard] },
    
];

@NgModule(
    {
        imports: [
            RouterModule.forRoot(router, { relativeLinkResolution: 'legacy', onSameUrlNavigation: 'ignore' })
        ],
        exports: [
            RouterModule
        ]
    }

)

export class QmRouterModule { }
export const RoutingComponents = [BranchesContainerComponent, ServicesContainerComponent, DelayContainerComponent, TicketInfoContainerComponent, AppointmentComponent];
