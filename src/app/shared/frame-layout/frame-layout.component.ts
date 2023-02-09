import { Component, OnInit } from '@angular/core';
import { Util } from './../../util/util';
import { TranslateService } from '@ngx-translate/core';
import { Config } from 'app/config/config';

@Component({
  selector: 'qm-frame-layout',
  templateUrl: './frame-layout.component.html',
  styleUrls: ['./frame-layout.component.scss']
})

export class FrameLayoutComponent implements OnInit {
  public onBrowserNotSupport: string;
  private _isBrowserSupport = false;
  private thisBrowser;
  public isApplePlatform = false;
  public isLogoFooterEnabled =  false; 
  public isCustomFooterEnabled =  false;
  public customText;
  public defautlDir: boolean;

  constructor(private translate: TranslateService, private config: Config) {

  }

  ngOnInit() {
    this.loadTranslations();
    this.doesBrowserSupport();
    if (this.config.getConfig('footer').logo.value.trim() === 'enable') {
      this.isLogoFooterEnabled = true; 
    } else {
      this.isLogoFooterEnabled = false;
      if (this.config.getConfig('footer').custom_text.value.trim().length > 0) {
        this.isCustomFooterEnabled = true;
        this.customText = this.config.getConfig('footer').custom_text.value.trim();
      } else {
        this.isCustomFooterEnabled = false;
      }
    }
    this.defautlDir = (document.dir == 'rtl') ? false : true;    
  }

  loadTranslations() {
    this.translate.get('support.this_browser').subscribe((res: string) => {
      this.thisBrowser = res;
    });
  }

  get isBrowserSupport(): boolean {
    return this._isBrowserSupport;
  }

  public doesBrowserSupport() {
    let util = new Util()
    var agent
    if (typeof navigator !== 'undefined' && navigator) {
      agent = navigator.userAgent;
    }
    this.isApplePlatform = util.isApplePlatform();
    try {
      let browser = util.getDetectBrowser(agent)
      // this.isBrowserSupport = true;

      if (browser.name === 'chrome' || browser.name === 'safari' || browser.name === 'ios'
          || browser.name === 'opera' || browser.name === 'crios' || browser.name === 'firefox'
          || browser.name === 'fxios' || browser.name === 'edge' || browser.name === 'edgios') {
        this._isBrowserSupport = true;
      } else if (browser.name !== '' && browser.name) {
        this.onBrowserNotSupport = browser.name;
      } else {
        this.onBrowserNotSupport = this.thisBrowser;
      }
    } catch (e) {
      this.onBrowserNotSupport = this.thisBrowser;
    }
  }
}
