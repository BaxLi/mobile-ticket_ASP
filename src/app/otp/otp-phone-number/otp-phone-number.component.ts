import { LocationStrategy } from "@angular/common";
import { AfterViewInit, Component, EventEmitter, HostListener, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import { AlertDialogService } from "../../shared/alert-dialog/alert-dialog.service";
import { TranslateService } from "@ngx-translate/core";
import { Config } from "../../config/config";
import { CountryISO, SearchCountryField } from "ngx-intl-tel-input";
import { FormControl, FormGroup, Validators } from "@angular/forms";

declare var MobileTicketAPI: any;

@Component({
  selector: "app-otp-phone-number",
  templateUrl: "./otp-phone-number.component.html",
  styleUrls: ["./otp-phone-number.component.scss"],
})
export class OtpPhoneNumberComponent implements OnInit, AfterViewInit {
  public phoneNumber: string = '';
  public phoneNumberObject: any;
  public phoneNumberError: boolean;
  public countryCode: string;
  public showLoader = false;
  public counterTime: number = 180;
  private _showNetWorkError = false;
  private smsText: string;
  public seperateCountryCode = false;
  public changeCountry = false;
  public submitClicked = false;
  public countryCodePrefix: string;
  public SearchCountryField = SearchCountryField;
  public CountryISO = CountryISO;
  public selectedCountryISO = '';
  public preferredCountries: CountryISO[] = [];
  phoneForm = new FormGroup({
    phone: new FormControl(undefined, [Validators.required])
  });
  public prefferedCountryCodeList: string[];
  public prefferedCountries: string;
  @Output()
  showNetorkErrorEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private config: Config,
    private translate: TranslateService,
    private router: Router,
    private alertDialogService: AlertDialogService,
    private location: LocationStrategy
  ) {
    // preventing back button in browser
    history.pushState(null, null, window.location.href);
    this.location.onPopState(() => {
      history.pushState(null, null, window.location.href);
    });
    MobileTicketAPI.setOTPleftTime(undefined);
    this.translate.get('otp.smsText').subscribe((res: string) => {
        this.smsText = res;
    });
  }

  ngOnInit() {
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

    MobileTicketAPI.setSeparateCountryCode(this.seperateCountryCode);

    // prepare preferred country codes
    if (this.seperateCountryCode) {
      this.prefferedCountries = this.config.getConfig('preferred_country_list');
      this.prefferedCountryCodeList = this.prefferedCountries.split(',');
      this.prefferedCountryCodeList = [...new Set(this.prefferedCountryCodeList)];
      this.prefferedCountryCodeList = this.prefferedCountryCodeList.map(country => { return country.toLowerCase() });
      this.prefferedCountryCodeList = this.prefferedCountryCodeList.filter(country =>
        countryCodeValues.includes(country as CountryISO));
    }

    this.phoneNumber = MobileTicketAPI.getEnteredOtpPhoneNum()
      ? MobileTicketAPI.getEnteredOtpPhoneNum()
      : MobileTicketAPI.getEnteredPhoneNum();
    if (!this.phoneNumber) {
      this.phoneNumber = '';
    }

    if (this.seperateCountryCode) {
      // added a sepcial check to verify whether empty object or null
      this.phoneNumberObject = MobileTicketAPI.getEnteredOtpPhoneNumObj() &&
       Object.keys(MobileTicketAPI.getEnteredOtpPhoneNumObj()).length !== 0
      ? MobileTicketAPI.getEnteredOtpPhoneNumObj()
      : MobileTicketAPI.getEnteredPhoneNumObj();
    }
    if (this.phoneNumberObject && this.phoneNumberObject.countryCode) {
      this.selectedCountryISO = this.phoneNumberObject.countryCode;
    }

    // commented due to MOB-616
    // MobileTicketAPI.setOtpPhoneNumber('');
    // if (this.seperateCountryCode) { MobileTicketAPI.setOtpPhoneNumberObj({}) }
    this.phoneNumberError = false;
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

  phoneNumberFeildFocused() {
    if (this.phoneNumber === "" || this.phoneNumber === undefined) {
      this.phoneNumber = this.countryCode;
    }
  }

  phoneNumberFeildUnfocused() {
    if (this.phoneNumber === this.countryCode) {
      this.phoneNumber = "";
    }
  }

  onPhoneNumberEnter(event) {
    this.setPhoneNumber();
    if (this.phoneNumberError && event.keyCode !== 13) {
      if (this.phoneNumber.trim() !== "") {
        this.phoneNumberError = false;
      }
    }
    MobileTicketAPI.setOtpPhoneNumber(this.phoneNumber);
    if (this.seperateCountryCode) {
       MobileTicketAPI.setOtpPhoneNumberObj(this.phoneNumberObject)
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

  onPhoneNumberChanged() {
    this.phoneNumberError = false;
    this.submitClicked = false;
    MobileTicketAPI.setOtpPhoneNumber(this.phoneNumber);
    if (this.seperateCountryCode) {
       MobileTicketAPI.setOtpPhoneNumberObj(this.phoneNumberObject)
      }
  }

  phoneNumContinue() {
    this.setPhoneNumber();
    if (this.phoneNumber.trim().length > 5 &&
      this.phoneNumber.match(/^\(?\+?\d?[-\s()0-9]{6,}$/) &&
      this.phoneNumber !== this.countryCode && !this.phoneNumberError
    ) {
      this.showLoader = true;
      this.phoneNumber = this.phoneNumber.trim();
      if( this.phoneNumber[0]=='+'){
        this.phoneNumber = this.phoneNumber.slice(1);
      }
      if( this.phoneNumber.slice(0,2)=='00'){
        this.phoneNumber = this.phoneNumber.slice(2);
      }


      MobileTicketAPI.setOtpPhoneNumber(this.phoneNumber);
      if (this.seperateCountryCode) { MobileTicketAPI.setOtpPhoneNumberObj(this.phoneNumberObject) }
      MobileTicketAPI.sendOTP(
        this.phoneNumber, this.smsText,
        (data) => {
          this.showLoader = false;
          if (data == "OK") {
            this.router.navigate(["otp_pin"]);
          } else if (data.phoneNumber == this.phoneNumber) {
            if (data.attempts > 2) {
              this.translate.get('otp.pleaseWait').subscribe((res: string) => {
                this.alertDialogService.activate(res);
                this.router.navigate(["otp_number"]);
              });
            } else if (data.tries > 2) {
              this.translate.get('otp.pleaseWait').subscribe((res: string) => {
                this.alertDialogService.activate(res);
                this.router.navigate(["otp_number"]);
              });
            } else {
              const now = Date.now();
              const updatedAt = Date.parse(data.lastUpdated);   
              const timeDif = Math.ceil((now-updatedAt)/1000);
              if(timeDif <= this.counterTime) {
                MobileTicketAPI.setOTPleftTime(this.counterTime - timeDif);
                this.translate.get('otp.havePIN').subscribe((res: string) => {
                  this.alertDialogService.activate(res);
                  this.router.navigate(["otp_pin"]);
                });
              } else {
                MobileTicketAPI.deleteOTP(
                  data.phoneNumber,
                  (data) => {
                    this.translate.get('otp.pinExpired').subscribe((res: string) => {
                      this.alertDialogService.activate(res);
                      this.router.navigate(["otp_number"]);
                    });
                  },
                  (err) => {
                    this.translate.get('connection.issue_with_connection').subscribe((res: string) => {
                      this.alertDialogService.activate(res);
                      MobileTicketAPI.setOtpPhoneNumber("");
                      if (this.seperateCountryCode) { MobileTicketAPI.setOtpPhoneNumberObj({}) }
                      this.router.navigate(["branches"]);
                    });
                  }
                );
              }  
            } 
          } else {
            this.translate.get('connection.issue_with_connection').subscribe((res: string) => {
              this.alertDialogService.activate(res);
              MobileTicketAPI.setOtpPhoneNumber("");
              if (this.seperateCountryCode) { MobileTicketAPI.setOtpPhoneNumberObj({}) }
              this.router.navigate(["branches"]);
            });
          }
        },
        (err) => {
          this.translate.get('connection.issue_with_connection').subscribe((res: string) => {
            this.alertDialogService.activate(res);
            this.showLoader = false;
            MobileTicketAPI.setOtpPhoneNumber("");
            if (this.seperateCountryCode) { MobileTicketAPI.setOtpPhoneNumberObj({}) }
            this.router.navigate(["branches"]);
          });
        }
      );
    } else {
      this.phoneNumberError = true;
    }
  }

  showHideNetworkError(value: boolean) {
    this._showNetWorkError = value;
    this.showNetorkErrorEvent.emit(this._showNetWorkError);
  }

  get showNetWorkError(): boolean {
    return this._showNetWorkError;
  }

  @HostListener('window:beforeunload', ['$event'])
  showMessage($event) {
    $event.returnValue = 'Your data will be lost!';
  }

  // telInputObject(obj){
  //   if(MobileTicketAPI.getCountryFlag() !== undefined){
  //     obj.setCountry(MobileTicketAPI.getCountryFlag());
  //   } else {
  //     obj.setCountry(this.countryCode);
  //   }
  // }

  // hasError(e){
  //   console.log(e);
  //   this.phoneNumberError = e ? false:true;
  //   if(this.submitClicked){
  //     this.phoneNumberError = e ? false:true;
  //   }
  // }

  // getNumber(e){
  //   this.phoneNumber = e;
  //   // this.phoneNumContinue();

  //   if(this.submitClicked){ 
  //     this.phoneNumContinue();
  //   }
  // }

  // onCountryChange(e){
  //   this.phoneNumberError = false;
  //   this.submitClicked = false;
  // }

  // submitByBtn(e){
  //   if(this.phoneNumber.length === 0){
  //     this.phoneNumberError = true;
  //   }
  //   this.submitClicked = true;
  //   if(!this.phoneNumberError){
  //     this.phoneNumContinue();
  //   }
  //   // e.target.blur();
  // }

  // submitByKey(e){
  //   if(e.code === 'Enter'){
  //     this.submitClicked = true; 
  //   }
  // }
}
