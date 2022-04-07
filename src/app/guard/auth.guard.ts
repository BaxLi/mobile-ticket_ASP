import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Util } from '../util/util';
import { ServiceEntity } from '../entities/service.entity';
import { BranchService } from '../branch/branch.service';
import { BranchEntity } from '../entities/branch.entity';
import { AppointmentEntity } from '../entities/appointment.entity';
import { AlertDialogService } from '../shared/alert-dialog/alert-dialog.service';
import { Config } from '../config/config';
import { BranchOpenHoursValidator } from '../util/branch-open-hours-validator';
import { LocationValidator } from '../util/location-validator'
import { ServiceService } from '../service/service.service';
import { BranchScheduleService } from '../shared/branch-schedule.service';
import { TicketInfoService } from '../ticket-info/ticket-info.service';
import { isDevMode } from '@angular/core';

declare var System: any;
declare var MobileTicketAPI: any;
declare var ga: Function;
declare var require: any;

@Injectable()
export class AuthGuard implements CanActivate {

    private prevUrl = '/';
    private branchService: BranchService;
    private serviceService: ServiceService
    private isNoSuchBranch = false;
    private isNoSuchVisit = false;
    private isNoSuchVisitDirectToBranch = false;
    private branchId = 0;
    private directedBranch: BranchEntity = null;
    private aEntity: AppointmentEntity = null;

    constructor(private router: Router, private activatedRoute: ActivatedRoute, private branchSrvc: BranchService,
        private serviceSrvc: ServiceService, private alertDialogService: AlertDialogService,
        private translate: TranslateService, private config: Config, public ticketService: TicketInfoService,
        private branchScheduleService: BranchScheduleService, private locationValidator: LocationValidator,
        private openHourValidator: BranchOpenHoursValidator) {
        this.branchService = branchSrvc;
        this.serviceService = serviceSrvc;
        MobileTicketAPI.setTicketToken(this.config.getConfig('create_ticket_token')); 
    }

    createTicket(bEntity: BranchEntity, sEntity: ServiceEntity, resolve) {
        MobileTicketAPI.setServiceSelection(sEntity);
        MobileTicketAPI.setBranchSelection(bEntity);
        this.router.navigate(['ticket_loading']);
        resolve(false);
    }



    checkOpenHours(resolve) {
       if (!this.openHourValidator.openHoursValid()) {
            this.router.navigate(['open_hours']);
            resolve(false);
            return true;
        } else {
            return false;
        }
    }

    checkCreateTicketOption(resolve) {
        let createStatus = this.config.getConfig('create_new_ticket');
        if (createStatus === 'enable') {
            return false;
        } else {
            this.router.navigate(['no_support']);
            resolve(false);
            return true;
        }
    }
    redirectToUnautherized() {
        MobileTicketAPI.clearLocalStorage();
        MobileTicketAPI.resetAllVars();
        MobileTicketAPI.resetCurrentVisitStatus();

        this.router.navigate(['unauthorized']);
    }

    checkBrowserSupport() {
        let util = new Util()
        let agent;
        if (typeof navigator !== 'undefined' && navigator) {
            agent = navigator.userAgent;
        }
        try {
            let browser = util.getDetectBrowser(agent)
            if (browser.name === 'chrome' || browser.name === 'safari' || browser.name === 'ios'
                || browser.name === 'opera' || browser.name === 'crios' || browser.name === 'firefox'
                || browser.name === 'fxios' || browser.name === 'edge' || browser.name === 'edgios') {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            return false;
        }
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.checkBrowserSupport()) {
                resolve(false);
            }
            let url = state.url;

            if (this.isNoSuchBranch && url.startsWith('/no_branch')) {
                this.isNoSuchBranch = false;
                resolve(true);
            } else if (url.startsWith('/open_hours')) {
                resolve(true);
            } else if (this.isNoSuchVisit && url.startsWith('/no_visit')) {
                this.isNoSuchVisit = false;
                resolve(true);
            } else if (this.config.getConfig('branch_schedule') === 'enable' && !route.queryParams['checksum'])  {
                let branchId = route.queryParams['branch'];
                let serviceId;
                if (route.url.length === 4 && route.url[1].path
                    && route.url[2].path === ('services') && route.url[3].path) {
                    branchId = route.url[1].path;
                    serviceId = route.url[3].path;
                } else if (url.startsWith('/branches/')) {
                    branchId = route.url[1].path;
                } else if (url.startsWith('/services')) {
                    const selectedBranch = MobileTicketAPI.getSelectedBranch();
                    branchId = selectedBranch ? selectedBranch.id : undefined;
                }

                if (branchId) {
                    const _thisObj = this;
                    console.log(route.url)
                    this.branchScheduleService.checkAvailability(branchId, serviceId, function (status) {
                        if (status) {
                            _thisObj.processRoute(state, route, resolve);
                        } else {
                            _thisObj.router.navigate(['open_hours']);
                            resolve(false);
                        }
                    });
                } else {
                    this.processRoute(state, route, resolve);
                }
            } else if (route.url.length === 4 && route.url[1].path
                && route.url[2].path === ('services') && route.url[3].path) {
                    let branchId = route.url[1].path;
                    let serviceId = route.url[3].path;
                    const _thisObj = this;
                    this.locationValidator.isInLocation(branchId, function (status, isLocationPermission) {
                        if (status) {
                            _thisObj.processRoute(state, route, resolve);
                        } else {
                            _thisObj.isNoSuchBranch = true;
                            _thisObj.router.navigate(['no_branch'], { queryParams: {branchId: branchId, serviceId: serviceId,
                                 locationPermission: isLocationPermission ? 'true' : 'false'}});
                            resolve(false);
                        }
                    });
            } else if (route.url.length === 2 && route.url[1].path
                && route.url[0].path === ('branches')) {
                    let branchId = route.url[1].path;
                    const _thisObj = this;
                    this.locationValidator.isInLocation(branchId, function (status, isLocationPermission) {
                        if (status) {
                            _thisObj.processRoute(state, route, resolve);
                        } else {
                            _thisObj.isNoSuchBranch = true;
                            _thisObj.router.navigate(['no_branch'], { queryParams: {branchId: branchId,
                                 locationPermission: isLocationPermission ? 'true' : 'false'}});
                            resolve(false);
                        }
                    });
            } else {
                this.processRoute(state, route, resolve);
            }
        });
    }

    processRoute(state, route, resolve) {
        let visitInfo = MobileTicketAPI.getCurrentVisit();
        let url = state.url;
        let branchId = route.queryParams['branch'];
        let visitId = route.queryParams['visit'];
        let checksum = route.queryParams['checksum'];
        let appointmentId = route.queryParams['appId'];
        let appointmentExtId = route.queryParams['external'];
        let queryParameter = this.config.getConfig('customer_data').additional_data.value.trim();

        if(queryParameter && queryParameter.length > 0) {
            let custom3 =  route.queryParams[queryParameter];
            if(custom3 && custom3.length > 0) {MobileTicketAPI.setCustom3(custom3);}  
        }

        if (url.startsWith('/branches/') || url.endsWith('/branches') || url.endsWith('/branches;redirect=true')) {
            /**
             * for qr-code format: System.import://XXXX/branches/{branchId}
             * Redirect user to services page for specific branchId
             */
            if (this.isNoSuchVisitDirectToBranch) {
                if (this.checkOpenHours(resolve)) {
                    return;
                }
                if (this.checkCreateTicketOption(resolve)) {
                    return;
                }
                this.isNoSuchVisitDirectToBranch = false;
                MobileTicketAPI.setBranchSelection(this.directedBranch);
                this.router.navigate(['services']);
                resolve(false);
            } else if (route.url.length === 2 && route.url[1].path) {
                let id = route.url[1].path;
                this.branchService.getBranchById(+id, (branchEntity: BranchEntity, isError: boolean, errorCode: string) => {
                    if (!isError) {
                        if (visitInfo && visitInfo.visitStatus !== "DELETE") {
                            let alertMsg = '';
                            this.translate.get('visit.onGoingVisit').subscribe((res: string) => {
                                alertMsg = res;
                                this.alertDialogService.activate(alertMsg).then(res => {
                                    resolve(true);
                                }, () => {

                                });
                            });

                        } else {
                            if (this.checkOpenHours(resolve)) {
                                return;
                            }
                            if (this.checkCreateTicketOption(resolve)) {
                                return;
                            }
                            MobileTicketAPI.setBranchSelection(branchEntity);
                            this.router.navigate(['services']);
                            resolve(false);
                        }

                    } else {
                        if (this.checkOpenHours(resolve)) {
                            return;
                        }
                        let e = 'error';
                        this.isNoSuchBranch = true;
                        this.router.navigate(['no_branch']);
                        resolve(true);
                    }
                });
            }
            /**
             * for qr-code format: System.://XXXX/branches/{branchId}/services/{serviceId}
             * Redirect user to ticket screen by creating a visit for the given branchId & serviceId
             */
            else if (route.url.length === 4 && route.url[1].path && route.url[2].path === ('services') && route.url[3].path) {
                let bEntity = new BranchEntity();
                bEntity.id = route.url[1].path;
                let sEntity = new ServiceEntity();
                sEntity.id = +route.url[3].path;

                if(this.config.getConfig('service_translation') === "enable"){
                    let userLanguage = 'en';
                    if (typeof navigator !== 'undefined' && navigator) {
                        userLanguage = navigator.language.split('-')[0];
                    }
                    MobileTicketAPI.getServiceTranslation(
                        (serviceTranslations: any) => {

                            // development env
                            const services = serviceTranslations.serviceList;
                            const serviceData:any = [];
                            services.forEach(service => {
                                let newService:any = {};
                                newService.id = service.qpId;
                                newService.custom = service.custom;
                                serviceData.push(newService);
                            });

                            let matchedService = (serviceData.find((s) => s.id ==  sEntity.id));
                            if(matchedService && matchedService.custom !== null){
                                let translatedValue = JSON.parse(matchedService.custom).names[userLanguage.toLowerCase()];
                                translatedValue = translatedValue !== null ? translatedValue : JSON.parse(matchedService.custom).names[userLanguage.toUpperCase()];
                                if(translatedValue){
                                    sEntity.name = translatedValue;         
                                } 
                            }      
                        });
                }

                this.branchService.getBranchById(+bEntity.id, (branchEntity: BranchEntity, isError: boolean, errorCode: string) => {
                    if (!isError) {
                        if (visitInfo && visitInfo.visitStatus !== "DELETE") {
                            let alertMsg = '';
                            this.translate.get('visit.onGoingVisit').subscribe((res: string) => {
                                alertMsg = res;
                                this.alertDialogService.activate(alertMsg).then(res => {
                                    resolve(true);
                                }, () => {

                                });
                            });
                        } else {
                            if (this.checkOpenHours(resolve)) {
                                return;
                            }
                            if (this.checkCreateTicketOption(resolve)) {
                                return;
                            }
                            let isCustomerPhoneNumDataEnabled = this.config.getConfig('customer_data').phone_number.value; 
                            let isCustomeIdDataEnabled = this.config.getConfig('customer_data').customerId.value; 
                            let isOTPEnabled = this.config.getConfig('otp_service');
                            if ((isCustomerPhoneNumDataEnabled === 'enable' || isCustomerPhoneNumDataEnabled === 'mandatory') || isCustomeIdDataEnabled === 'enable') {
                                MobileTicketAPI.setBranchSelection(branchEntity);
                                this.serviceService.fetchServices((serviceList: Array<ServiceEntity>, error: boolean) => {
                                    if (error) {
                                        this.isNoSuchVisit = true;
                                        this.router.navigate(['no_visit']);
                                        resolve(false);
                                    } else {
                                        let serviceFound = false;
                                        serviceList.forEach((service) => {
                                            if (service.id === sEntity.id) {
                                                serviceFound = true;
                                                sEntity.name = service.name;
                                                return;
                                            }
                                        });
                                        if (!serviceFound) {
                                            this.isNoSuchVisit = true;
                                            this.router.navigate(['no_visit']);
                                            resolve(false);
                                        } else {
                                            MobileTicketAPI.setServiceSelection(sEntity);
                                            this.router.navigate(['customer_data']);
                                            resolve(false);
                                        }
                                    }
                                });
                            } else if (isOTPEnabled === 'enable') {
                                MobileTicketAPI.setBranchSelection(branchEntity);
                                this.serviceService.fetchServices((serviceList: Array<ServiceEntity>, error: boolean) => {
                                    if (error) {
                                        this.isNoSuchVisit = true;
                                        this.router.navigate(['no_visit']);
                                        resolve(false);
                                    } else {
                                        let serviceFound = false;
                                        serviceList.forEach((service) => {
                                            if (service.id === sEntity.id) {
                                                serviceFound = true;
                                                sEntity.name = service.name;
                                                return;
                                            }
                                        });
                                        if (!serviceFound) {
                                            this.isNoSuchVisit = true;
                                            this.router.navigate(['no_visit']);
                                            resolve(false);
                                        } else {
                                            MobileTicketAPI.setServiceSelection(sEntity);
                                            this.router.navigate(['otp_number']);
                                            resolve(false);
                                        }
                                    }
                                });
                            } else {
                                // Creating ticket
                                let isDeviceBounded = this.config.getConfig('block_other_browsers');

                                if (isDeviceBounded === 'enable') {
                                    import('fingerprintjs2').then(Fingerprint2 => {
                                        let that = this;

                                        Fingerprint2.getPromise({
                                            excludes: {
                                                availableScreenResolution: true,
                                                adBlock: true,
                                                enumerateDevices: true
                                            }
                                        }).then(function (components) {
                                            let values = components.map(function (component) { return component.value });
                                            let murmur = Fingerprint2.x64hash128(values.join(''), 31);
                                            MobileTicketAPI.setFingerprint(murmur);
                                            that.createTicket(branchEntity, sEntity, resolve);
                                        });
                                    });
                                } else {
                                    // Creating ticket
                                    let isDeviceBounded = this.config.getConfig('block_other_browsers');
                                    if (isDeviceBounded === 'enable') {
                                        import('fingerprintjs2').then(Fingerprint2 => {
                                            let that = this;

                                            Fingerprint2.getPromise({
                                                excludes: {
                                                    availableScreenResolution: true,
                                                    adBlock: true,
                                                    enumerateDevices: true
                                                }
                                            }).then(function (components) {
                                                let values = components.map(function (component) { return component.value });
                                                let murmur = Fingerprint2.x64hash128(values.join(''), 31);
                                                MobileTicketAPI.setFingerprint(murmur);
                                                that.createTicket(branchEntity, sEntity, resolve);
                                            });
                                        });
                                    } else {
                                        this.createTicket(branchEntity, sEntity, resolve);
                                    }
                                }

                            }
                        }

                    } else {
                        if (this.checkOpenHours(resolve)) {
                            return;
                        }
                        let e = 'error';
                        this.isNoSuchBranch = true;
                        this.router.navigate(['no_branch']);
                        resolve(false);
                    }
                });
            } else if (route.url.length >= 3 && route.url[2].path !== ('services')) {
                this.isNoSuchVisit = true;
                this.router.navigate(['no_visit']);
                resolve(false);
            } else if (route.url.length === 3 && route.url[2].path === ('services')) {
                this.isNoSuchVisit = true;
                this.router.navigate(['no_visit']);
                resolve(false);
            } else if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE"  && this.router.url === '/ticket') {
                this.router.navigate(['/ticket']);
                resolve(false);
            } else if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.router.navigate(['/ticket']);
                resolve(false);
            } else {
                if (this.checkCreateTicketOption(resolve)) {
                    return;
                }
                resolve(true);
            }


        } else if (url.startsWith('/services')) {
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.router.navigate(['ticket']);
                resolve(false);
            } else if ((this.prevUrl.startsWith('/branches') ||
                this.prevUrl === '/' || this.prevUrl === '/services')) {
                if (!this.openHourValidator.openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            } else if (this.prevUrl.startsWith('/ticket') &&
                (!visitInfo || visitInfo === null)) {
                if (!this.openHourValidator.openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            }
        } else if (url.startsWith('/appointment')) { // if an appointment
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                let alertMsg = '';
                this.translate.get('visit.onGoingVisit').subscribe((res: string) => {
                    alertMsg = res;
                    this.alertDialogService.activate(alertMsg).then(res => {
                        this.router.navigate(['ticket']);
                        resolve(false);
                    }, () => {

                    });
                });

            } else {
                this.aEntity = new AppointmentEntity();

                if (appointmentExtId) {
                    MobileTicketAPI.findAppointmentByExtId(appointmentExtId, (response1) => {
                        if(response1 === 'No content') {
                            this.aEntity.status = 'NOTFOUND';
                            MobileTicketAPI.setAppointment(this.aEntity);
                            resolve(true);
                        } else {
                            this.aEntity.publicId = response1.properties.publicId;
                            this.aEntity.qpId = response1.id;
                            getAppointment(response1.id, this.aEntity);
                        }     
                    },
                        (xhr, status, errorMessage) => {
                            this.aEntity.status = 'NOTFOUND';
                            MobileTicketAPI.setAppointment(this.aEntity);
                            resolve(true);
                        });

                } else {
                    MobileTicketAPI.findAppointment(appointmentId, (response) => {
                        this.aEntity.publicId = appointmentId;
                        this.aEntity.branchName = response.branch.name;
                        this.aEntity.qpId = response.qpId;
                        // if (isDevMode()) {
                        getAppointment(response.qpId, this.aEntity);
                        // }
                    },
                        (xhr, status, errorMessage) => {
                            this.aEntity.status = 'NOTFOUND';
                            MobileTicketAPI.setAppointment(this.aEntity);
                            resolve(true);
                        });
                }

                const getAppointment = (id: string, entity: any) => {
                    if (!isDevMode()) {
                        // production mode : encrypted id
                        MobileTicketAPI.findCentralAppointmentByEId(id,
                            (response2) => {
                                entity.serviceId = response2.services[0].id;
                                entity.serviceName = response2.services[0].name;
                                entity.branchId = response2.branchId;
                                entity.status = response2.status;
                                entity.startTime = response2.startTime;
                                entity.endTime = response2.endTime;
                                entity.notes = response2.properties.notes;
                                entity.custom = response2.properties.custom;
                                if(this.config.getConfig('service_translation') === "enable"){
                                    let userLanguage = 'en';
                                    if (typeof navigator !== 'undefined' && navigator) {
                                        userLanguage = navigator.language.split('-')[0];
                                    }
                                    MobileTicketAPI.getServiceTranslation(
                                        (serviceTranslations: any) => {
                
                                            // development env
                                            const services = serviceTranslations.serviceList;
                                            const serviceData:any = [];
                                            services.forEach(service => {
                                                let newService:any = {};
                                                newService.id = service.qpId;
                                                newService.custom = service.custom;
                                                serviceData.push(newService);
                                            });
                                            
                                            let matchedService = (serviceData.find((s) => s.id ==  entity.serviceId));
                                            if(matchedService && matchedService.custom !== null){
                                                let translatedValue = JSON.parse(matchedService.custom).names[userLanguage.toLowerCase()];
                                                translatedValue = translatedValue !== null ? translatedValue : JSON.parse(matchedService.custom).names[userLanguage.toUpperCase()];
                                                if(translatedValue){
                                                    entity.serviceName = translatedValue; 
                                                } 
                                            }
                                            
                                        });
                                }
                                MobileTicketAPI.setAppointment(entity);
                                resolve(true);
                            },
                            (xhr, status, errorMessage) => {
                                entity.status = 'NOTFOUND';
                                MobileTicketAPI.setAppointment(entity);
                                resolve(true);
                            });
                    } else {
                        MobileTicketAPI.findCentralAppointment(id,
                            (response2) => {
                                entity.serviceId = response2.services[0].id;
                                entity.serviceName = response2.services[0].name;
                                entity.branchId = response2.branchId;
                                entity.status = response2.status;
                                entity.startTime = response2.startTime;
                                entity.endTime = response2.endTime;
                                entity.notes = response2.properties.notes;
                                entity.custom = response2.properties.custom;
                                if(this.config.getConfig('service_translation') === "enable"){
                                    let userLanguage = 'en';
                                    if (typeof navigator !== 'undefined' && navigator) {
                                        userLanguage = navigator.language.split('-')[0];
                                    }
                                    MobileTicketAPI.getServiceTranslation(
                                        (serviceTranslations: any) => {
                
                                            // development env
                                            const services = serviceTranslations.serviceList;
                                            const serviceData:any = [];
                                            services.forEach(service => {
                                                let newService:any = {};
                                                newService.id = service.qpId;
                                                newService.custom = service.custom;
                                                serviceData.push(newService);
                                            });
                                            
                                            let matchedService = (serviceData.find((s) => s.id ==  entity.serviceId));
                                            if(matchedService && matchedService.custom !== null){
                                                let translatedValue = JSON.parse(matchedService.custom).names[userLanguage.toLowerCase()];
                                                translatedValue = translatedValue !== null ? translatedValue : JSON.parse(matchedService.custom).names[userLanguage.toUpperCase()];
                                                if(translatedValue){
                                                    entity.serviceName = translatedValue; 
                                                } 
                                            }
                                            
                                        });
                                }
                                MobileTicketAPI.setAppointment(entity);
                                resolve(true);
                            },
                            (xhr, status, errorMessage) => {
                                entity.status = 'NOTFOUND';
                                MobileTicketAPI.setAppointment(entity);
                                resolve(true);
                            });
                    }
                  
                }
            }

        } else if (url.startsWith('/ticket') && (branchId && visitId && checksum)) { // if ticket is from view ticket url
            let isDeviceBounded = this.config.getConfig('block_other_browsers');
            let isSameTicket = visitInfo && visitInfo !== null &&
             visitInfo.visitStatus !== "DELETE" && visitInfo.branchId === branchId &&
              visitInfo.checksum === checksum && visitInfo.visitId === visitId ? true : false;
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE" && !isSameTicket) {
                let alertMsg = '';
                this.translate.get('visit.onGoingVisit').subscribe((res: string) => {
                    alertMsg = res;
                    this.alertDialogService.activate(alertMsg).then(res => {
                        this.router.navigate(['ticket']);
                        resolve(false);
                    }, () => {

                    });
                });

            } else if (visitInfo && visitInfo !== null && visitInfo.visitStatus === "DELETE") {
                resolve(true);
            }
             else if (isDeviceBounded === 'enable') {
                let branchId = route.queryParams['branch'];
                let visitId = route.queryParams['visit'];
                let checksum = route.queryParams['checksum'];
                this.ticketService.getBranchInformation(branchId, (success: boolean) => {
                    if (!success) {
                        this.router.navigate(['branches']);
                        resolve(false);
                    } else {
                        MobileTicketAPI.setVisit(branchId, 0, visitId, checksum);
                        MobileTicketAPI.getCustomParameters(
                            (visit: any) => {
                                if (visit) {
                                    import('fingerprintjs2').then(Fingerprint2 => {
                                        let that = this;
                                        Fingerprint2.getPromise({
                                            excludes: {
                                                availableScreenResolution: true,
                                                adBlock: true,
                                                enumerateDevices: true
                                            }
                                        }).then(function (components) {
                                            let values = components.map(function (component) { return component.value });
                                            let murmur = Fingerprint2.x64hash128(values.join(''), 31);
                                            console.log(murmur);
                                            if (visit === murmur) {
                                                resolve(true);
                                            } else {
                                                that.redirectToUnautherized();
                                                resolve(false);
                                            }
                                        })
                                    },);
                                } else {
                                    resolve(true);
                                }
                            }, 
                            (error) => {
                                resolve(false);
                                this.router.navigate(['branches']);
                            });
                    }
                });
            }

            else {
                resolve(true);

            }

        } else if (url.startsWith('/ticket') && ((visitInfo !== null && visitInfo)
            && visitInfo.branchId && visitInfo.visitId && visitInfo.checksum)) {
            resolve(true);
        } else if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
            MobileTicketAPI.getVisitStatus(
                (visitObj: any) => {
                    if (visitObj.status === 'CALLED' || visitObj.visitPosition !== null) {
                        this.router.navigate(['ticket']);
                        resolve(true);
                    } else {
                        this.router.navigate(['/branches']);
                        resolve(false);
                    }
                },
                (xhr, status, msg) => {
                    this.router.navigate(['/branches']);
                    resolve(false);
                }
            );
        } else if (url.startsWith('/customer_data')) {
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.router.navigate(['ticket']);
                resolve(false);
            } else if (this.prevUrl.startsWith('/services') ||
                this.prevUrl === '/' || this.prevUrl.startsWith('/branches') || this.prevUrl.startsWith('/privacy_policy')
                || this.prevUrl.startsWith('/customer_data')) {
                if (!this.openHourValidator.openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            } else if (this.prevUrl.startsWith('/ticket') &&
                (!visitInfo || visitInfo === null)) {
                if (!this.openHourValidator.openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            }
        } else if (url.startsWith('/otp_number')) {
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.router.navigate(['ticket']);
                resolve(false);
            } else if (this.prevUrl.startsWith('/customer_data') || this.prevUrl.startsWith('/services') ||
                this.prevUrl.startsWith('/branches') || this.prevUrl.startsWith('/otp_number')) {
                if (!(new BranchOpenHoursValidator(this.config)).openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            } else if (this.prevUrl.startsWith('/otp_pin')) {
                if (!(new BranchOpenHoursValidator(this.config)).openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            } else {
                this.router.navigate(['/branches']);
                resolve(false);
            }
        } else if (url.startsWith('/otp_pin')) {
            if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== "DELETE") {
                this.router.navigate(['ticket']);
                resolve(false);
            } else if (this.prevUrl.startsWith('/otp_number') || this.prevUrl.startsWith('/otp_pin')) {
                if (!(new BranchOpenHoursValidator(this.config)).openHoursValid()) {
                    this.router.navigate(['open_hours']);
                    resolve(false);
                } else {
                    if (this.checkCreateTicketOption(resolve)) {
                        return;
                    }
                    resolve(true);
                }
            } else {
                this.router.navigate(['/branches']);
                resolve(false);
            }
        } else {
            this.router.navigate(['/branches']);
            resolve(false);
        }

        if (!(this.prevUrl.startsWith('/branches') && url.startsWith('/ticket'))) {
            this.prevUrl = url;
        }

    }
}
