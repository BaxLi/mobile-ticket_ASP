import { AfterViewInit, Component, HostListener, OnInit } from '@angular/core';
import { BranchEntity } from '../entities/branch.entity';
import { ServiceEntity } from '../entities/service.entity';
import { TranslateService } from '@ngx-translate/core';
import { RetryService } from '../shared/retry.service';
import { AlertDialogService } from '../shared/alert-dialog/alert-dialog.service';
import { Config } from '../config/config';
import { Router } from '@angular/router';
import { Util } from '../util/util';
import { TicketEntity } from '../entities/ticket.entity';
import { CountryISO, SearchCountryField } from 'ngx-intl-tel-input';
import { FormControl, FormGroup, NgControl, Validators } from '@angular/forms';
declare var MobileTicketAPI: any;
declare var ga: Function;

enum phoneSectionStates {
  INITIAL,
  PRIVACY_POLICY,
  EDIT_PHONE
}

export interface IPhoneNumberObject {
  number: string;
}

@Component({
  selector: 'app-customer-data',
  templateUrl: './customer-data.component.html',
  styleUrls: ['./customer-data.component.scss']
})
export class CustomerDataComponent implements OnInit, AfterViewInit {
  public selectedBranch: BranchEntity;
  public selectedService: ServiceEntity;
  private _showNetWorkError = false;
  private isTakeTicketClickedOnce: boolean;
  public phoneNumber: string;
  public phoneNumberObject: any;
  public customerId: string;
  public firstName: string = '';
  public firstNameError: boolean;
  public firstNameMandatoryError: boolean;
  public lastName: string = '';
  public lastNameError: boolean;
  public lastNameMandatoryError: boolean;
  public phoneNumberError: boolean;
  public PhoneNumberMandatoryError: boolean;
  public customerIdError: boolean;
  public customerIdMaxError: boolean;
  public phoneSectionState: phoneSectionStates;
  public phoneSectionStates = phoneSectionStates;
  public ticketEntity: TicketEntity;
  public documentDir: string;
  public countryCode: string;
  public prefferedCountryCodeList: string[];
  public prefferedCountries: string;
  public countryCodePrefix: string;
  public isPrivacyEnable = 'disable';
  public activeConsentEnable = 'disable';
  public showLoader = false;
  public seperateCountryCode = false;
  public changeCountry = false;
  public submitClicked = false;
  public isCustomerPhoneDataEnabled = false;
  public isCustomerIdEnabled = false;
  public SearchCountryField = SearchCountryField;
  public CountryISO = CountryISO;
  public selectedCountryISO = '';
  public preferredCountries: CountryISO[] = [CountryISO.SriLanka, CountryISO.Sweden];
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required])
  });
  private errorDiv;
  public isSkipVisible = true;
  public isPhoneNumberMandatory: boolean;
  public isPrivacyPolicyAgreed: boolean;
  public isFirstNameEnabled: boolean;
  public isFirstNameMandatory: boolean;
  public isLastNameEnabled: boolean;
  public isLastNameMandatory: boolean;

  constructor(
    private translate: TranslateService,
    public router: Router,
    private retryService: RetryService,
    private alertDialogService: AlertDialogService,
    private config: Config
  ) { }

  ngOnInit() {
    this.getSelectedBranch();
    this.getSelectedServices();
    this.countryCode = this.config.getConfig('country_code').trim();
    const countryCodeValues = Object.values(CountryISO);

    if (this.countryCode.match(/^[A-Za-z]+$/)) {
      this.countryCode = this.countryCode.toLowerCase();
      if (countryCodeValues.includes(this.countryCode as CountryISO)) {
        this.selectedCountryISO = this.countryCode;
      } else {
        this.selectedCountryISO = '';
      }
      this.seperateCountryCode = true;
    } else {
      if (this.countryCode === '') {
        this.countryCode = '+';
      }
    }
    // prepare preferred country codes
    if (this.seperateCountryCode) {
      this.prefferedCountries = this.config.getConfig('preferred_country_list');
      this.prefferedCountryCodeList = this.prefferedCountries.split(',');
      this.prefferedCountryCodeList = [...new Set(this.prefferedCountryCodeList)];
      this.prefferedCountryCodeList = this.prefferedCountryCodeList.map(country => { return country.toLowerCase() });
      this.prefferedCountryCodeList = this.prefferedCountryCodeList.filter(country =>
        countryCodeValues.includes(country as CountryISO));
    }

    this.phoneNumberError = false;
    this.PhoneNumberMandatoryError = false;
    this.customerIdError = false;
    this.customerIdMaxError = false;
    this.firstNameMandatoryError = false;
    this.firstNameError = false;
    this.lastNameMandatoryError = false;
    this.lastNameError = false;
    this.phoneSectionState = phoneSectionStates.INITIAL;
    this.isPrivacyEnable = this.config.getConfig('privacy_policy');
    this.activeConsentEnable = this.config.getConfig('active_consent');
    this.phoneNumber = MobileTicketAPI.getEnteredPhoneNum();
    try {
      this.phoneNumber.trim();
    } catch (error) { 
      this.phoneNumber = MobileTicketAPI.setPhoneNumber('');
      this.phoneNumber = MobileTicketAPI.getEnteredPhoneNum();
    }
    this.customerId = MobileTicketAPI.getEnteredCustomerId() ? MobileTicketAPI.getEnteredCustomerId() : '';


    // commented due to MOB-607
   // MobileTicketAPI.setPhoneNumber('');
    MobileTicketAPI.setCustomerId('');
    MobileTicketAPI.setFirstName('');
    MobileTicketAPI.setLastName('');
    this.isCustomerPhoneDataEnabled = (this.config.getConfig('customer_data').phone_number.value === 'enable' || this.config.getConfig('customer_data').phone_number.value === 'mandatory' ) ? true : false;
    this.isCustomerIdEnabled =  this.config.getConfig('customer_data').customerId.value === 'enable' ? true : false;
    this.isPhoneNumberMandatory =  this.config.getConfig('customer_data').phone_number.value === 'mandatory' ? true : false;
    this.isFirstNameEnabled = (this.config.getConfig('customer_data').first_name.value === 'enable'  || this.config.getConfig('customer_data').first_name.value === 'mandatory')? true : false;
    this.isFirstNameMandatory = this.config.getConfig('customer_data').first_name.value === 'mandatory' ? true : false;
    this.isLastNameEnabled = (this.config.getConfig('customer_data').last_name.value === 'enable' || this.config.getConfig('customer_data').last_name.value === 'mandatory')? true : false;
    this.isLastNameMandatory = this.config.getConfig('customer_data').last_name.value === 'mandatory' ? true : false;
    // if (this.phoneNumber && (this.phoneNumber !== this.countryCode) && this.activeConsentEnable === 'enable') {
    //   this.phoneSectionState = phoneSectionStates.PRIVACY_POLICY;
    // }
    if (document.dir === 'rtl') {
      this.documentDir = 'rtl';
    }

    if ((this.isCustomerPhoneDataEnabled && this.isPhoneNumberMandatory) 
    || (this.isFirstNameEnabled && this.isFirstNameMandatory)
    || (this.isLastNameEnabled && this.isLastNameMandatory)
    ) {
      this.isSkipVisible = false
    } else {
      this.isSkipVisible = true;
    }
  }
  ngAfterViewInit() {
    if (this.seperateCountryCode) {
      const phoneContainer = document.getElementsByClassName('customer-phone__number-container');
      for (const div of Object.keys(phoneContainer)) {
        phoneContainer[div].style.cssText = 'height:66px';
      }
    }
    this.dropDownClicked();
  }
  dropDownClicked() {
    const coutryDropDowns = document.getElementsByClassName('iti__country-list');
    const searchBox = document.getElementById('country-search-box');
    const dataContainer = document.getElementById('customer-data-container');
    const phoneInput = document.getElementById('phone');
    const phoneNumber = document.getElementById('phoneNum');
    const dropDownList = document.getElementsByClassName('dropdown-toggle');

    if (searchBox) {
      searchBox.style.cssText = 'padding: 6px 5px 6px 9px;font-size: 14px;';
    }
    if (phoneInput) {
      phoneInput.style.cssText = 'font-size: 16px;';
    }
    if (document.dir === 'rtl') {
      for (const dropDown of Object.keys(coutryDropDowns)) {
        coutryDropDowns[dropDown].style.cssText =
        'margin-left: 0px !important;margin-right: 0px !important;font-size: 10.85px;white-space:none !important;scrollbar-width: none;-ms-overflow-style: none;';
      }
    } else {
      for (const dropDown of Object.keys(coutryDropDowns)) {
        coutryDropDowns[dropDown].style.cssText =
        'margin-left: 0px !important;margin-right: 0px !important;font-size: larger;white-space:none !important;scrollbar-width: none;-ms-overflow-style: none;';
      }
    }

    let dropDownElement = null;
    for (const div of Object.keys(dropDownList)) {
      dropDownElement = dropDownList[div];
      const observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.attributeName === 'aria-expanded') {
            if (dropDownList[div].getAttribute('aria-expanded') === 'true') {
              phoneNumber.style.cssText = 'position:fixed';
              dataContainer.style.cssText = 'overflow-y:hidden';
            } else {
              phoneNumber.style.cssText = 'position:unset';
              dataContainer.style.cssText = 'overflow-y:auto';
            }
          }
        });
      });
      observer.observe(dropDownElement, {
        attributes: true,
      });
      break;
    }

  }


  // Press continue button for phone number
  CustomerInfoContinue() {
    if (this.isFirstNameEnabled && this.isFirstNameMandatory && this.firstName.trim() === '') {
      this.firstNameMandatoryError = true;
    } else if (this.isLastNameEnabled && this.isLastNameMandatory && this.lastName.trim() === '') {
      this.lastNameMandatoryError = true;
    }
    else if (this.isCustomerPhoneDataEnabled && this.isPhoneNumberMandatory && this.phoneNumber === '') {
      this.PhoneNumberMandatoryError = true;
    }  
    
    else if (this.isCustomerPhoneDataEnabled) {
      this.PhoneNumberMandatoryError = false;
      this.firstNameMandatoryError = false;
      this.lastNameMandatoryError = false;
      this.setPhoneNumber();
      // is phone matches
      if (this.phoneNumber.match(/^\(?\+?\d?[-\s()0-9]{6,}$/) && this.phoneNumber !== this.countryCode && !this.phoneNumberError) {
        MobileTicketAPI.setPhoneNumber(this.phoneNumber);
        let isPrivacyAgreed = this.isPrivacyPolicyAgreed;
        if (this.seperateCountryCode) {MobileTicketAPI.setPhoneNumberObj(this.phoneNumberObject)}
        if (this.customerId.trim() !== '' && this.customerId.length > 255) {
          this.customerIdMaxError = true;
        } else {
          if (this.customerId.trim() !== '') {
            MobileTicketAPI.setCustomerId((this.customerId.toString().trim()));
          }
          if (this.firstName !== '' || this.lastName !== '') {
            MobileTicketAPI.setFirstName(this.firstName.trim());
            MobileTicketAPI.setLastName(this.lastName.trim());
          }
          if (isPrivacyAgreed || this.isPrivacyEnable !== 'enable' || this.activeConsentEnable !== 'enable') {
            this.createVisit()
          } else {
            this.translate.get('customer_info.pleaseAcceptPrivacyPolicy').subscribe((res: string) => {
              let alertMsg = res;
              this.alertDialogService.activate(alertMsg).then(res => {     
              }, () => {
      
              });
            })
          }
        }

    // phone not matching phone and no phone number
    } else if ((this.customerId.trim() !== '' || this.firstName !== '' || this.lastName !== '') && this.phoneNumber.trim() === '') {

      if (this.customerId.length > 255) {
        this.customerIdMaxError = true;
      } else {
        if (this.customerId.trim() !== '') {
          MobileTicketAPI.setCustomerId((this.customerId.toString().trim()));
        }
        if (this.firstName !== '' || this.lastName !== '') {
          MobileTicketAPI.setFirstName(this.firstName.trim());
          MobileTicketAPI.setLastName(this.lastName.trim());
        }
      this.createVisit()
      }

    } else { // if not matching phone and phone number exists
      this.phoneNumberError = true;
      if (this.customerId.length > 255) {
        this.customerIdError = true;
      } else if (this.customerId.trim() === '' && this.phoneNumber.trim() === '' && this.firstName === '' || this.lastName === '' ) {
        this.customerIdError = true;
        this.firstNameError = true;
        this.lastNameError = true;
      }
    }
    } else if (this.customerId.trim() !== ''  || this.firstName !== '' || this.lastName !== '') { // If customer phone data is disabled and only customer id is enabled
      this.firstNameMandatoryError = false;
      this.lastNameMandatoryError = false;
      if (this.customerId.length > 255) {
          this.customerIdMaxError = true;
        } else {
          if (this.customerId.trim() !== '') {
            MobileTicketAPI.setCustomerId((this.customerId.toString().trim()));
          }
          if (this.firstName !== '' || this.lastName !== '') {
            MobileTicketAPI.setFirstName(this.firstName.trim());
            MobileTicketAPI.setLastName(this.lastName.trim());
          }
        this.createVisit()
        }
    } else { // if no customer id
      this.customerIdError = true;
      this.firstNameError = true;
      this.lastNameError = true;
    }
  }
  // Change phone number input feild
  onPhoneNumberChanged() {
   this.setErrorsFalse();
    this.PhoneNumberMandatoryError = false;
    // this.changeCountry = false;
    // this.submitClicked = false;
  }
  onCustomerIdChanged() {
    this.setErrorsFalse();
    this.customerIdMaxError = false;
  }

  onNameFieldsChanged(type) {
    this.setErrorsFalse();
    if (type = 'first-name') {
      this.firstNameMandatoryError = false;
    } else {
      this.lastNameMandatoryError = false;
    }
  }

  onCustomerIdChangedEnter(event) {
    if (this.customerId && event.keyCode !== 13) {
      this.setErrorsFalse();
      this.customerIdMaxError = false;
    }
  }
  setErrorsFalse() {
    this.phoneNumberError = false;
    this.customerIdError = false;
    this.firstNameError = false;
    this.lastNameError = false;
  }

  onPhoneNumberEnter(event) {
    this.setPhoneNumber();
    if (this.phoneNumberError && event.keyCode !== 13) {
      if (this.phoneNumber.trim() !== '') {
        this.setErrorsFalse();
        this.PhoneNumberMandatoryError = false;
        this.customerIdMaxError = false;
      }
    }
  }

  setPhoneNumber() {
    if (this.seperateCountryCode && this.phoneNumberObject) {
      this.phoneNumber = this.phoneNumberObject.e164Number;
      if (this.phoneNumber.length > 5) {
        this.phoneNumberError = !this.phoneForm.valid;
      }
    } else if (this.seperateCountryCode) {
      this.phoneNumber = '';
    }
  }
  // understood button pressed
  understoodPrivacyConsent() {
    localStorage.setItem('privacy_agreed', 'true');
    MobileTicketAPI.setPhoneNumber(this.phoneNumber);
    this.createVisit();
  }

  skipAndcreateVisit() {
    MobileTicketAPI.setPhoneNumber('');
    if (this.seperateCountryCode) {MobileTicketAPI.setPhoneNumberObj({})}
    if (this.customerId) {
      MobileTicketAPI.setCustomerId((this.customerId.toString().trim()));
      this.createVisit()
    } else {
      this.createVisit();
    }
  }


  getSelectedBranch() {
    this.selectedBranch = MobileTicketAPI.getSelectedBranch();

  }
  getSelectedServices() {
    this.selectedService = MobileTicketAPI.getSelectedService();
  }
  // creating  visit
  createVisit() {
    if (!this.isTakeTicketClickedOnce) {
      this.isTakeTicketClickedOnce = true;
      let visitInfo = MobileTicketAPI.getCurrentVisit();
      if (visitInfo && visitInfo !== null && visitInfo.visitStatus !== 'DELETE') {
        this.router.navigate(['ticket']);
      } else {
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
              that.createTicket();
            })
          });
        } else {
          this.createTicket();
        }
      }
    }
  }

  public createTicket() {
    let OtpService = this.config.getConfig('otp_service');
    if (OtpService === 'enable') {
      this.router.navigate(['otp_number']);
    } else {
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
          if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === '8042') {
            this.translate.get('error_codes.error_8042').subscribe((res: string) => {
              this.alertDialogService.activate(res);
            });
          } else if (util.getStatusErrorCode(xhr && xhr.getAllResponseHeaders()) === '11000') {
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
                  // Do nothing on error
                  this.router.navigate(['no_visit']);
                });
            });
          }
        }
      );
    }
  }

  phoneNumberFeildFocused() {
    if (this.phoneNumber === '' || this.phoneNumber === undefined ) {
      this.phoneNumber = this.countryCode;
    }
  }
  phoneNumberFeildUnfocused() {
    if (this.phoneNumber === this.countryCode) {
      this.phoneNumber = '';
    }
  }
  showHideNetworkError(value: boolean) {
    this._showNetWorkError = value;
  }
  privacyLinkButtonPressed() {
    let isLink = this.config.getConfig('privacy_policy_link');
    if (isLink !== '') {
      window.open(isLink, '_blank', '');
    } else {
      MobileTicketAPI.setPhoneNumber(this.phoneNumber);
      if (this.seperateCountryCode) {MobileTicketAPI.setPhoneNumberObj(this.phoneNumberObject)}
      this.router.navigate(['privacy_policy']);
    }
  }
  get showNetWorkError(): boolean {
    return this._showNetWorkError;
  }

  // telInputObject(obj){
  //   obj.setCountry(this.countryCode);
  // }

  // hasError(e){
  //   this.phoneNumberError = e ? false:true;
  //   if(this.submitClicked){
  //     this.phoneNumberError = e ? false:true;
  //   }
  // }

  // getNumber(e){
  //   this.phoneNumber = e;
  //   // this.phoneNumContinue();

  //   if(this.submitClicked){
  //     this.CustomerInfoContinue();
  //   }
  // }

  // onCountryChange(e){
  //   this.phoneNumberError = false;
  //   this.submitClicked = false;
  //   MobileTicketAPI.setCountryFlag(e.iso2);
  // }

  // submitByBtn(e){
  //   this.submitClicked = true;
  //   if(!this.phoneNumberError){
  //     this.CustomerInfoContinue();
  //   }
  //   // e.target.blur();
  // }

  // submitByKey(e){
  //   if(e.code === 'Enter'){
  //     this.submitClicked = true;
  //   }
  // }

}
