import { promises as fs } from "fs";
import mime from "mime";
import url from "url";
import ws from "ws";
import { Request as Req, Response as Res, NextFunction as Next, Router } from "express";
import path from "path";
import { ModuleBase } from "../../common_modules/module-base.class";
import { KEvent, TMsgBase, TMsgPulse, TParsedMsgHandler, TParsedTypedMsg } from "../../system/sys.ws.types";
import { WebSocketServerModule } from "../../common_modules/ws-server/ws-server.module";
import { SysWsUtil } from "../../system/sys.ws.util";
import { isCtrlDevMsg } from "../../device/device.ws.util";
import { TDevicePinStates } from "../../device/device.types";
import { WsUtil } from "../../common_modules/ws-server/ws-server.util";

export class HomePage extends ModuleBase {
  private _router: Router;
  private _apiRouter: Router;
  private _feWs: ws.WebSocket | undefined;
  constructor(
    private _config: {
      urlMountPath: string;
      urlApiMountPath: string;
      urlStaticFilesRelPath: string;
      localStaticFilesPath: string;
    }
  ) {
    super();
    this._router = Router();
    this._apiRouter = Router();
  }

  async init() {
    const _end = this.app.modules.httpServer.end;
    const express = this.app.modules.httpServer.expressApp;
    express.use(this._config.urlApiMountPath, this._apiRouter);
    express.use(this._config.urlMountPath, this._router);

    this._router.get("/", _end(this._getPageHtml_ctrl));
    this._router.get(
      path.join("/", this._config.urlStaticFilesRelPath, "/:filename"),
      _end(this._getPageStaticFiles_ctrl)
    );

    const wss = this.app.modules.wss.wsServer;
    wss.on("connection", (ws, req) => {
      console.log("Homepage, ws connected");
      const { pathname } = url.parse(req.url ?? "");
      if (pathname === "/fe-wss") {
        // this request comes from browser
        this._feWs = ws;
        ws.on("message", async (data) => {
          console.log("Got msg from fe: %s", data);
          const parsedMsg = WsUtil.parseMsg(data);
          const devPinStates = await this._feMsgMainHandler(parsedMsg);
          console.log({ devPinStates });
        });

        this.app.modules.sysWs.subscribe(KEvent.PULSE, this._handleSysPulse, this._handleSysPulse.name);
      }
    });
  }

  private _lastSysPulse: TMsgPulse | undefined;
  private _feMsgMainHandler = async (parsedMsg: TParsedTypedMsg): Promise<TDevicePinStates | undefined> => {
    console.log("Got parsed msg from fe: ", parsedMsg);
    let devPinStates: TDevicePinStates | undefined;
    if (isCtrlDevMsg(parsedMsg.obj)) {
      const { mac, states } = parsedMsg.obj;
      const [device] = this.app.modules.device.getDeviceList(mac);
      if (device) {
        devPinStates = await device.setState(states);
        if (this._lastSysPulse) {
          const pulseMsg = this._lastSysPulse;
          const devices = this.app.modules.device.getDeviceList("*");
          // set isOnline

          await Promise.all(
            devices.map(async (dev) => {
              dev.isOnline = dev.checkIsOnline();
              try {
                await dev.queryState();
              } catch (error) {
                console.error(error);
              }
            })
          );

          pulseMsg.devices = devices;
          // pulseMsg.sysName = "wsl.system";

          await this._sendPulse(pulseMsg);
        }
      }
    }
    return devPinStates;
  };

  private _sysPulseHandlerBlock = false;
  private _handleSysPulse: TParsedMsgHandler = async (parsedMsg: TParsedTypedMsg) => {
    if (this._sysPulseHandlerBlock) return;
    this._sysPulseHandlerBlock = true;

    const { obj: pulseMsg, str } = parsedMsg;
    this._lastSysPulse = pulseMsg as TMsgPulse;
    const devices = this.app.modules.device.getDeviceList("*");

    await Promise.all(
      devices.map(async (dev) => {
        try {
          dev.isOnline = dev.checkIsOnline();
          await dev.queryState();
        } catch (error) {
          console.error(error);
        }
      })
    );

    pulseMsg.devices = devices;

    this._sendPulse(pulseMsg as TMsgPulse);

    this._sysPulseHandlerBlock = false;
  };

  private _sendPulse(pulseMsg: TMsgPulse) {
    this._feWs?.send(JSON.stringify(pulseMsg));
  }

  private _getPageHtml_ctrl = async (req: Req, res: Res) => {
    const indexHtmlFilePath = path.join(this._config.localStaticFilesPath, "index.html");
    const indexHtmlBuff = await fs.readFile(indexHtmlFilePath);
    return res.end(indexHtmlBuff);
  };

  private _getPageStaticFiles_ctrl = async (req: Req, res: Res) => {
    const filename = path.basename(req.params?.filename);
    const filepath = path.join(this._config.localStaticFilesPath, filename);
    const contentType = mime.getType(filepath);
    res.setHeader("Content-Type", contentType ?? "application/octet-stream");
    const fileBuff = await fs.readFile(filepath);
    return res.end(fileBuff);
  };
}
