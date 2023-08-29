import { Request as Req, Response as Res, NextFunction as Next, Router } from "express";
import { ModuleBase } from "../common_modules/module-base.class";
import { TDevice } from "../device/device.types";

export class DeviceNotifModule extends ModuleBase {
  private _router: Router;
  constructor(
    private _config: {
      apiMountPath: string;
    }
  ) {
    super();
    this._router = Router();
  }
  async init() {
    const expressApp = this.app.modules.httpServer.expressApp;
    const _end = this.app.modules.httpServer.end;
    expressApp.use(this._config.apiMountPath, this._router);
    this._router.get("/ping", this.pong_ctrl);
    this._router.post("/set-is-online", _end(this._setIsOnline_ctrl));
  }

  pong_ctrl = async (req: Req, res: Res) => {
    res.json({ pong: true });
  };

  private async _getBody(req: Req) {
    return this.app.modules.httpServer.getFullReqBody(req);
  }

  private _setIsOnline_ctrl = async (req: Req, res: Res) => {
    const {
      mac = "",
      ip = "",
      port = "80",
    } = (await this._getBody(req)).json as {
      mac?: string;
      ip?: string;
      port?: string;
    };
    const remoteAddress = req.socket.remoteAddress;
    const device: TDevice = { mac, ip, port: Number(port), lastSeen: new Date() };

    await this.app.modules.device.setDevice(device);
    console.log({ device });

    return res.json(device);
  };
}
