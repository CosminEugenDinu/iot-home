import { promises as fs } from "fs";
import mime from "mime";
import url from "url";
import ws from "ws";
import { Request as Req, Response as Res, NextFunction as Next, Router } from "express";
import path from "path";
import { ModuleBase } from "../../common_modules/module-base.class";
import { WsUtil } from "../../common_modules/ws-server/ws-server.util";
import { KEvent, TMsgPulse, TParsedMsgHandler, TParsedTypedMsg } from "../../int-system/int-system.ws.types";

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
        });

        this.app.modules.intSysWs.subscribe(KEvent.PULSE, this._handleSysPulse, this._handleSysPulse.name);
      }
    });
  }

  private _handleSysPulse: TParsedMsgHandler = async (parsedMsg: TParsedTypedMsg) => {
    const { obj: pulseMsg, str } = parsedMsg;
    this._sendPulse(pulseMsg as TMsgPulse);
  };

  private _feMsgMainHandler = async (parsedMsg: TParsedTypedMsg) => {
    console.log("Got parsed msg from fe: ", parsedMsg);
    this.app.modules.intSysWs.sysClient?.send(parsedMsg.str);
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
