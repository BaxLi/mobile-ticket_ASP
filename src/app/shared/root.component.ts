import { Component} from '@angular/core';
import { Config } from '../config/config';

declare var ga: Function;

@Component({
  selector: 'app-root',
  templateUrl: './root-tmpl.html'
})
export class RootComponent {
  public showLoader = true;
  constructor(private config: Config) {
    let track_id = config.getConfig('ga_track_id');
    let is_cookie_consent_enabled = config.getConfig('cookie_consent');
    const isCookieCosentAccepted = localStorage.getItem('cookie_consent');
    if (track_id && track_id !== '' && (isCookieCosentAccepted === 'true' || is_cookie_consent_enabled === 'disable')) {
      ga('create', track_id, 'auto');
      ga('send', 'pageview');
    }
    window.addEventListener('resize', this.appHeight)
    this.appHeight()
  }

  public appHeight()  {
    const doc = document.documentElement
    doc.style.setProperty('--app-height', `${window.innerHeight}px`)
  }
}
