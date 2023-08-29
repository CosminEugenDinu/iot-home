import ws, { WebSocket } from "ws";
import { KWsHeader, TIdentity } from "./ws-client.types";

export type TAppModuleBase<App = { modules: any }> = {
  app: App;
  init: () => Promise<any>;
};

export class WebSocketClientModule<App> implements TAppModuleBase<App> {
  public app!: App;
  public ws?: WebSocket;
  public msgHandlers: ((msg: ws.RawData) => void)[] = [];
  private _terminate = false;
  async init() {
    process.on("SIGTERM", (sig) => {
      this._terminate = true;
      this.ws?.close();
      this.ws?.terminate();
    });
    this.autoConnect(this._config.autoConnectInterval);
  }
  constructor(
    private _config: {
      wsServerAddr: string;
      autoConnectInterval: number;
    }
  ) {}

  autoConnect = async (interval: number) => {
    while (true) {
      if (this._terminate) return;
      const { readyState } = this.ws ?? {};
      if (!readyState || readyState === ws.CLOSED) {
        try {
          const ws = await this.openWs();
          if (this._terminate) {
            ws.terminate();
            return ws.close();
          }
          ws.on("message", (data) => {
            this.msgLogger(data);
            this.msgHandlers.forEach((cb) => cb(data));
          });
          this.ws = ws;
        } catch (error) {
          console.error(error);
        }
      }
      this.ws?.send(new Date().toISOString());
      await new Promise((r) => setTimeout(r, interval));
    }
  };

  async msgLogger(msg: ws.RawData) {
    console.log("Received msg: %s", msg);
  }

  async openWs(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this._config.wsServerAddr, {
        headers: { [KWsHeader.WS_CLIENT_NAME]: TIdentity.SYSTEM_NAME },
      });
      ws.on("open", () => resolve(ws));
      ws.on("error", reject);
    });
  }
}
