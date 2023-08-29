import http from "node:http";
import { ModuleBase } from "../common_modules/module-base.class";
import { TDeviceNotifMsg } from "./device-notif-client.types";

export class DeviceNotifClient extends ModuleBase {
  constructor(
    private _config: {
      integrationServerDeviceNotifUrl: string;
      integrationServerDeviceNotifInterval: number;
      deviceDeclaredMacAddress: string;
      deviceDeclaredIpAddress: string;
      deviceDeclaredPort: string;
    }
  ) {
    super();
  }
  async init() {
    this._infiniteNotify();
  }

  private async _infiniteNotify() {
    const interval = this._config.integrationServerDeviceNotifInterval;
    const notifUrl = this._config.integrationServerDeviceNotifUrl;
    const mac = this._config.deviceDeclaredMacAddress;
    const ip = this._config.deviceDeclaredIpAddress;
    const port = this._config.deviceDeclaredPort;
    const notifMsg: TDeviceNotifMsg = { mac, ip, port };
    while (true) {
      await new Promise((r) => setTimeout(r, interval));
      try {
        const response = await this._postHttpRequest(notifUrl, notifMsg);
        console.log("Integration server notified", { notifUrl, request: notifMsg, response });
      } catch (error) {
        console.error(error);
      }
    }
  }

  private async _postHttpRequest(url: string, body: TDeviceNotifMsg): Promise<string> {
    return new Promise((resolve, reject) => {
      const resBuf: Buffer[] = [];
      const parsedUrl = new URL(url);
      const req = http.request(
        {
          method: "post",
          protocol: parsedUrl.protocol,
          hostname: parsedUrl.hostname,
          port: parsedUrl.port,
          path: parsedUrl.pathname,
        },
        (res) => {
          res.on("error", reject);
          res.on("end", () => resolve(Buffer.concat(resBuf).toString()));
          res.on("data", (chunk) => resBuf.push(chunk));
        }
      );
      req.on("error", reject);
      req.write(JSON.stringify(body));
      req.end();
    });
  }
}
