import { Config } from '../config/config';
import { Injectable } from '@angular/core';
import { GpsPositionCalculator } from '../util/gps-distance-calculator';
import { LocationService } from '../util/location';
import { PositionEntity } from '../entities/position.entity';
import { BranchEntity } from '../entities/branch.entity';

declare var MobileTicketAPI: any;

@Injectable()
export class LocationValidator {

    public currentPosition: PositionEntity;

    constructor(private config: Config, private currentLocation: LocationService) {

    }

    public isInLocation(branchId, success) {
        let radius = +(this.config.getConfig('branch_radius'));
        let geoFencing = this.config.getConfig('geo_fencing') === 'disable' ? false : true;
        if (location.protocol === 'https:' && radius > 0 && geoFencing) {
            this.currentLocation.watchCurrentPosition((currentPosition) => {
                this.currentLocation.removeWatcher();
                this.currentPosition = new PositionEntity(currentPosition.coords.latitude, currentPosition.coords.longitude);
                this.isNearBranch(branchId, this.currentPosition, radius, function(val){
                    success(val, true);
                });
            }, (error) => {
                success(false, false);
                this.currentLocation.removeWatcher();
            });
      } else {
          success(true);
      }
    }

    private isNearBranch(branchId, customerPosition, radius, callBack) {
        const successCallBack = function(res){
            const branch = res.find(branchObj => branchObj.id === +branchId);
            callBack(branch ? true : false);
        }
        const errorCallBack = function(error){
            callBack(false);
        }

        MobileTicketAPI.getBranchesNearBy(customerPosition.latitude, customerPosition.longitude, radius, successCallBack, errorCallBack);
    }
}
