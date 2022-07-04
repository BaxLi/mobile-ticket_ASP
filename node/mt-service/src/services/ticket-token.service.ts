import { connectDB } from "../data-module/database";
// import { IOtp, IOtpDocument } from "../data-module/types/otp.type";
// import { Request, Response } from "express";
// import axios from "axios";
import * as fs from "fs";
import { ITicketToken } from "../data-module/types/ticket-token.type";
import { TicketTokenModel } from "../data-module/models/ticket-token.model";

export default class TicketTokenService {
  private userConfigFile = "mt-service/src/config/config.json";
  private userConfig: any;
  private tenantId: string;

  constructor() {    
    connectDB();
    this.userConfig = JSON.parse(
      fs.readFileSync(__dirname.split('mt-service')[0] + this.userConfigFile).toString()
    );
    this.tenantId = this.userConfig.tenant_id.value;
  }

  public async createToken(ticketTokenInstance: ITicketToken) {
    // bind tenant ID
    ticketTokenInstance.tenantId = this.tenantId;
    try {
      return await TicketTokenModel.createToken(ticketTokenInstance);
    } catch (e) {
      return e;
    }
  }

  public async findByToken(token: string) {
    const tenantId = this.tenantId;
    try {
      return await TicketTokenModel.findByToken(tenantId, token);
    } catch (e) {
      return e;
    }
  }

  public async deleteToken(token: string) {
    const tenantId = this.tenantId;
    try {
      return await TicketTokenModel.deleteOne({tenantId: tenantId, token: token});
    } catch (e) {
      return e;
    }
  }
}
