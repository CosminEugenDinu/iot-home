import http from "http";
import { WebSocketServer } from "ws";

export type TAppModuleBase<App = { modules: any }> = {
  app: App;
  init: () => Promise<any>;
};

export class WebSocketServerModule implements TAppModuleBase {
  public app!: TAppModuleBase["app"];
  public wsServer!: WebSocketServer;
  public httpServer!: http.Server;
  public port: number = 8080;
  constructor(
    private _config: {
      port?: number;
      httpServer?: http.Server | null;
    }
  ) {}
  async init() {
    let newHttpServer = false;
    const appHttpModule = this.app.modules?.httpServer;
    const httpServerModule = appHttpModule?.httpServer as http.Server | undefined;
    if (this._config.httpServer) {
      this.httpServer = this._config.httpServer;
      this.port = this._config.port ?? this.port;
    } else if (httpServerModule) {
      this.httpServer = httpServerModule;
      this.port = appHttpModule?.port as number;
    } else {
      this.httpServer = http.createServer();
      this.port = this._config.port ?? this.port;
    }
    this.wsServer = new WebSocketServer({ server: this.httpServer });
    console.log("WebSocket server initialized. Port: %s", this.port);
    if (newHttpServer) {
      const port = this._config.port ?? this.port;
      await new Promise<void>((resolve) =>
        this.httpServer.listen(port, () => {
          console.error(`[${this.constructor.name}] 🚀 Http server listening on port ${port}.`);
          resolve();
        })
      );
    }
    process.on("SIGTERM", this.closeAll);
    return this;
  }

  closeAll = (sig: NodeJS.Signals) => {
    console.log("Received signal: %s", sig);
    this.httpServer.close();
    this.wsServer.clients.forEach((ws) => {
      ws.terminate();
    });
    this.wsServer.close();
  };
}
