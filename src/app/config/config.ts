import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Locale } from '../locale/locale';
import { map, catchError } from 'rxjs/operators';
@Injectable()
export class Config {
    private config: Object = null;

    constructor(private http: HttpClient, private locale: Locale) {
        locale.setLocale();
    }
    load() {
        return new Promise((resolve, reject) => {
            this.http.get('./app/config/config.json').pipe(map( res => res)).pipe(catchError((error: any):any => {
                console.log('Configuration file "config.json" could not be read');
                resolve(true);
                return Observable.throw(error.json().error || 'Server error');
            })).subscribe((responseData) => {
                this.config = responseData;
                resolve(true);
            });

        });
    }
    public getConfig(key: any) {
        return (this.config[key]) ? this.config[key].value : false;
    }
}
