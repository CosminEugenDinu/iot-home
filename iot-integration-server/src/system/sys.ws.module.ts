import ws from "ws";
import { ModuleBase } from "../common_modules/module-base.class";
import { KEvent, KWsClient, TParsedMsgHandler } from "./sys.ws.types";
import { KWsHeader } from "../common_modules/ws-server/ws-server.types";
import { WsUtil } from "../common_modules/ws-server/ws-server.util";
type THandlerId = string;

export class SysWsModule extends ModuleBase {
  public sysClient?: ws.WebSocket;
  public feClient?: ws.WebSocket;
  private _sysClienTParsedMsgHandlers = new Map<KEvent, Map<THandlerId, TParsedMsgHandler>>();
  public ws?: ws.WebSocket;
  async init() {
    const wss = this.app.modules.wss.wsServer;
    wss.on("connection", (ws, req) => {
      this.ws = ws;
      // TODO: change identification from header to path
      if (req.headers[KWsHeader.WS_CLIENT_NAME] === KWsClient.RPI_LOCAL_SYSTEM) {
        this.sysClient = ws;
        this.sysClient.on("message", (data) => {
          const parsed = WsUtil.parseMsg(data);
          const msgType: KEvent = parsed.obj?.type ?? KEvent.UNKNOWN;
          const msgHandlers = this._sysClienTParsedMsgHandlers.get(msgType);
          msgHandlers && msgHandlers.forEach((cb) => cb(parsed));
        });
      }
      ws.on("error", (error) => {
        console.error(error);
        ws.terminate();
      });
      ws.on("open", () => {
        if (req.headers[KWsHeader.WS_CLIENT_NAME] === KWsClient.RPI_LOCAL_SYSTEM) {
          this.sysClient = ws;
        }
      });
      ws.on("message", (data) => {
        console.log("Received data: %s", data);
      });
    });
  }

  subscribe(event: KEvent, handler: TParsedMsgHandler, handlerId: THandlerId) {
    (
      this._sysClienTParsedMsgHandlers.get(event) ?? this._sysClienTParsedMsgHandlers.set(event, new Map()).get(event)
    )?.set(handlerId, handler);
    console.log({ handlers: this._sysClienTParsedMsgHandlers });
  }
}
