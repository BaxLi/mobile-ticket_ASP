import { connectDB } from "../data-module/database";
import { IOtp, IOtpDocument } from "../data-module/types/otp.type";
import { Request, Response } from "express";
import axios from "axios";
import * as fs from "fs";
import { OtpModel } from "../data-module/models/otp.model";

export default class OtpService {
  private db = connectDB();
  private configFile = "proxy-config.json";
  private userConfigFile = "mt-service/src/config/config.json";
  private authToken = "nosecrets";
  private validAPIGWCert = "1";
  private host = "localhost:9090";
  private smsEndpoint = "/rest/notification/sendSMS";
  private supportSSL = false;
  private hostProtocol = "http://";
  private configuration: any;
  private userConfig: any;
  private tenantId: string;
  private hasCertificate: string;

  constructor() {
    this.configuration = JSON.parse(
      fs.readFileSync(__dirname.split('mt-service')[0] + this.configFile).toString()
    );
    this.userConfig = JSON.parse(
      fs.readFileSync(__dirname.split('mt-service')[0] + this.userConfigFile).toString()
    );
   
    this.tenantId = this.userConfig.tenant_id.value;
    this.authToken = this.configuration.auth_token.value;
    this.validAPIGWCert =
      this.configuration.gateway_certificate_is_valid.value.trim() === "true"
        ? "1"
        : "0";
    this.host = this.configuration.apigw_ip_port.value;
    this.hasCertificate = this.configuration.hasCertificate;
    
    if ((this.host.trim().slice(0,5)=='http:') || (this.host.trim().slice(0,5)=='https')) {
      this.hostProtocol = "";
    } else if (this.hasCertificate) {
      this.hostProtocol = "https://";
    } else {
      this.hostProtocol = "http://";
    }
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = this.validAPIGWCert;
  }

  public async sendSMS(req: Request, res: Response, otpInstance: IOtpDocument, sms: string) {
    const url = this.hostProtocol + this.host + this.smsEndpoint;
    const phoneNumber = otpInstance.phoneNumber;
    // const message = otpInstance.otp;
    const message = sms.replace("0000", otpInstance.pin);
    let returnValue = "";
    await axios
      .post(url, null, {
        params: {
          phoneNumber,
          message,
        },
        headers: {
          "auth-token": this.authToken,
          "Content-Type": "application/json",
        },
      })
      .then(async function (response) {
        returnValue = response.data.code;
      })
      .catch(function (error) {
        returnValue = error;
      });

    return returnValue;
  }

  public async createOtp(otpInstance: IOtp) {
    // bind tenant ID
    otpInstance.tenantId = this.tenantId;

    try {
      return await OtpModel.createOtp(otpInstance);
    } catch (e) {
      return e;
    }
  }

  public async findByPhone(phone: string) {
    const tenantId = this.tenantId;
    try {
      return await OtpModel.findByPhoneNumber(tenantId, phone);
    } catch (e) {
      return e;
    }
  }
  public async deleteOtp(phone: string) {
    const tenantId = this.tenantId;
    try {
      return await OtpModel.deleteOne({tenantId: tenantId, phoneNumber: phone});
    } catch (e) {
      return e;
    }
  }

  public async updateTryOTP(phone: string, tries: number) {
    const tenantId = this.tenantId;
    let returnVal = 0;

    try {
      await OtpModel.updateOne(
        { tenantId: tenantId, phoneNumber: phone },
        { tries: tries }
      )
        .then((data) => {
          returnVal = data.n;
        })
        .catch((e) => {
         // console.log(e);
        });
    } catch (e) {
      //console.log(e);
    }
    return returnVal;
  }

  public async lockUpdate(phone: string, lock: number) {
    const tenantId = this.tenantId;
    let returnVal = 0;
    let curDate = new Date();

    curDate.setMinutes(curDate.getMinutes() + 3);

    const newDate = new Date(curDate);

    try {
      await OtpModel.updateOne(
        { tenantId: tenantId, phoneNumber: phone },
        { locked: lock, lastUpdated: newDate }
      )
        .then((data) => {
          returnVal = data.n;
        })
        .catch((e) => {
         // console.log(e);
        });
    } catch (e) {
      //console.log(e);
    }
    return returnVal;
  }

  public async updateResendOtp(phone: string, _otp: string) {
    const tenantId = this.tenantId;
    let returnVal = '';
    let curDate = new Date();
    curDate.setMinutes(curDate.getMinutes() + 10);
    const newDate = new Date(curDate);

    try {
      const otp = await OtpModel.findByPhoneNumber(tenantId, phone);
      const attempts = otp[0].attempts;
      if (attempts > 1) {
        //set lock
        const a = await OtpModel.updateOne(
          { tenantId: tenantId, phoneNumber: phone },
          { locked: 2, lastUpdated: newDate, attempts: (attempts+1) }
        )
          .then((data) => {
            returnVal = 'locked';
          })
          .catch((e) => {
            //console.log(e);
          });
      } else {
        // increase attempt count
        const a = await OtpModel.updateOne(
          { tenantId: tenantId, phoneNumber: phone },
          { lastUpdated: new Date(), attempts: (attempts+1), pin: _otp, tries: 0}
        )
          .then((data) => {
            returnVal = 'updated';
          })
          .catch((e) => {
            //  .log(e);
          });
      }
    } catch (e) {
      //console.log(e);
    }
    return returnVal;
  }

  public async checkTID() {
    let returnVal = false;
    if (this.tenantId.trim().length > 0) {
      returnVal = true;
    }
    return returnVal;
  }
}
