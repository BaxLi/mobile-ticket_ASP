import { Component, AfterViewInit, Input, HostListener, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { ServiceService } from '../service.service';
import { ServiceEntity } from '../../entities/service.entity';
import { RetryService } from '../../shared/retry.service';
import { Util } from './../../util/util'
import { Config} from '../../config/config';
import { BranchOpenHoursValidator} from '../../util/branch-open-hours-validator';
import { ServiceGroupEntity } from '../../entities/service-group.entity';
import { TranslateService } from '@ngx-translate/core';

declare var MobileTicketAPI: any;

@Component({
  selector: 'app-services',
  templateUrl: './services-tmpl.html',
  styleUrls: ['./services.css']
})
export class ServicesComponent implements AfterViewInit {
  public services: Array<ServiceEntity>;
  public showListShadow: boolean;
  public isServiceGroupingEnabled: boolean;
  public isSingleGroup: boolean;
  public servicesWithoutGroup: Array<ServiceEntity> = [];
  public servicesGroups: Array<ServiceGroupEntity>;
  public tmpServicesGroups: Array<ServiceGroupEntity>;
  public hasServiceGroupId: boolean;

  private serviceGroupsLoaded = false;
  private serviceListLoaded = false;
  private filteredGroupId: string;

  @Output() onServiceListHeightUpdate: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() onServiceSelection: EventEmitter<number> = new EventEmitter<number>();
  @Output() onShowHideServiceFetchError = new EventEmitter<boolean>();
  @Output() onServiceListLoaded = new EventEmitter<boolean>();

  constructor(private serviceService: ServiceService, private retryService: RetryService, private router: Router,
              private config: Config, private openHourValidator: BranchOpenHoursValidator, private translate: TranslateService) {
    this.onShowHideServiceFetchError.emit(false);
    this.isServiceGroupingEnabled = this.config.getConfig('service_group').availability.value == 'enable' ? true : false;
    this.isSingleGroup = this.config.getConfig('service_group').single_selection.value == 'enable' ? true : false;
    this.filteredGroupId = MobileTicketAPI.getServiceGroupId();
    this.hasServiceGroupId = this.filteredGroupId && this.filteredGroupId.length > 0 ? true : false;
    serviceService.getServices((serviceList: Array<ServiceEntity>, error: boolean) => {
      if (error) {
        this.onShowHideServiceFetchError.emit(true);
        retryService.retry(() => {
          serviceService.getServices((serviceList: Array<ServiceEntity>, error: boolean) => {
            if (!error) {
              if (!this.serviceGroupsLoaded) {
                this.fetchServiceGroup();
              }
              this.serviceListLoaded = true;
              this.onServicesReceived(serviceList, serviceService)
              retryService.abortRetry();
              if (this.serviceGroupsLoaded){
                this.onListLoaded();
              }
            }
          });
        });
      } else {
        this.serviceListLoaded = true;
        this.onServicesReceived(serviceList, serviceService);
        if (this.serviceGroupsLoaded){
          this.onListLoaded();
        }
      }
    });

    this.fetchServiceGroup();  
  }

  private fetchServiceGroup(){
    if (this.isServiceGroupingEnabled) {
      this.serviceService.getServicesGroups((groups: ServiceGroupEntity[], error: boolean) => {
        this.serviceGroupsLoaded = true;
        this.tmpServicesGroups = groups || [];

        if (this.serviceListLoaded)
          this.onListLoaded();
      });
    }else{
      this.serviceGroupsLoaded = true;
    }
  }

  private onListLoaded() {
    this.onServiceListLoaded.emit(true);
    if(this.isServiceGroupingEnabled){
      this.groupServices();
    }
    this.setSelectedService(MobileTicketAPI.getSelectedService());
  }

  private onServicesReceived(serviceList, serviceService): void {
    this.onShowHideServiceFetchError.emit(false);
    if (serviceList.length === 0) {
      this.router.navigate(['open_hours']);
    } else if (serviceList.length === 1) {
      this.onServiceSelection.emit(serviceList[0].id);
      MobileTicketAPI.setServiceSelection(serviceList[0]);
    }
    new Util().sortArrayCaseInsensitive(serviceList, "name", "asc");
    this.services = serviceList;
    this.initListShadow();
  }

  ngAfterViewInit() {
    if(!this.openHourValidator.openHoursValid()) {
            this.router.navigate(['open_hours']);
    }
    window.addEventListener('orientationchange', this.setListShadow, true);
    window.addEventListener('resize', this.setListShadow, true);
    window.addEventListener('scroll', this.setListShadow, true);
  }

  setSelectedService(selectedService: ServiceEntity) {
    if (selectedService) {
      this.onServiceSelection.emit(selectedService.id);
      for (let i = 0; i < this.services.length; ++i) {
        if (selectedService.id === this.services[i].id) {
          this.services[i].selected = true;
        }
      }
    }
  }

  resetSelections(selectedService: ServiceEntity) {
    if (selectedService) {
      this.onServiceSelection.emit(selectedService.id);
      for (let i = 0; i < this.services.length; ++i) {
        if (selectedService.id !== this.services[i].id) {
          this.services[i].selected = false;
        }
      }
    }
    else {
      this.onServiceSelection.emit(undefined);
    }
  }

  setListShadow = () => {
    this.processListShadow();
  }

  initListShadow = () => {
    setTimeout(() => {
      this.processListShadow();
    }, 200);
  }

  processListShadow() {
    if ((document.getElementsByClassName('table-child-list')[0] && document.getElementsByClassName('table-child-list')[0].clientHeight +
      document.getElementsByClassName('table-child-list')[0].scrollTop
      >= document.getElementsByClassName('table-child-list')[0].scrollHeight - 5)) {
      this.showListShadow = false;
    }
    else {
      this.showListShadow = true;
    }
    this.onServiceListHeightUpdate.emit(this.showListShadow);
  }

  groupServices() {
    this.servicesWithoutGroup = this.services.slice(); 

    this.tmpServicesGroups.forEach(g => {
      g.services = [];
      g.serviceIds.forEach(serviceId => {
        //We should not replace services with servicesWithoutGroup, because one service could be present in multiple groups
        let service = this.services.find((service) => service.id == serviceId);
        if (service) {
          let index = this.servicesWithoutGroup.findIndex(s => s.id == service.id);
          if(index >= 0)
            this.servicesWithoutGroup.splice(index, 1);
          g.services.push(service);
        }
      })
    });

    this.servicesGroups = this.tmpServicesGroups.filter(x => x.services.length > 0)
    
    if (this.isServiceGroupingEnabled && this.hasServiceGroupId) {
      this.filterGroups();
    } 
  }

  filterGroups(){
    let filteredGroup = this.servicesGroups.find(s => s.id == this.filteredGroupId);
    if(filteredGroup) {
      this.services = filteredGroup.services;
    } else {
      this.router.navigate(['branches']);
    }
  }

  groupName(serviceGroup: ServiceGroupEntity){
     let lang = this.translate.store.currentLang;
     var names = serviceGroup.names;
    if(names[lang])
      return names[lang];
    else if(names["en"])
      return names["en"];
    for(var key in names){
      if(names[key])
        return names[key];
    }
      
    return serviceGroup.id;
  }

  selectGroup(selectedGroup: ServiceGroupEntity){
    if(selectedGroup){
      let newState = !selectedGroup.selected;
      if(this.isSingleGroup){
        this.servicesGroups.forEach(g => g.selected = false);
      }
      selectedGroup.selected = newState;
    }
  }

}
