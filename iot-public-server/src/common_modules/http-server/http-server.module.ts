import express, { Express, Request as Req, Response as Res } from "express";
import { Server, createServer } from "node:http";

export type TAppModuleBase<App = { modules: any }> = {
  app: App;
  init: () => Promise<any>;
};

export type TExpressServerConfigurator<T> = (instance: T) => Promise<unknown>;

export class HttpServerModule<App> implements TAppModuleBase<App> {
  public app!: App;
  private _configurator: TExpressServerConfigurator<HttpServerModule<App>> | undefined;
  public port: number;
  public expressApp: Express;
  public httpServer: Server;

  constructor(private _config: { port: number }) {
    this.port = _config.port;
    this.expressApp = express();
    this.httpServer = createServer(this.expressApp);
  }

  public async init() {
    if (this._configurator) {
      await this._configurator(this);
    }
    const { port } = this._config;
    await new Promise<void>((resolve) =>
      this.httpServer.listen(port, () => {
        console.error(`[${this.constructor.name}] 🚀 Http server listening on port ${port}.`);
        resolve();
      })
    );
    process.on("SIGTERM", (sig) => {
      this.httpServer.close();
    });
    return this;
  }

  public setConfigurator(configurator: TExpressServerConfigurator<HttpServerModule<App>>) {
    this._configurator = configurator;
    return this;
  }

  public async getFullReqBody(req: Req): Promise<{ raw: Buffer; json?: any }> {
    return new Promise((resolve, reject) => {
      const buf: Buffer[] = [];
      let json: any | undefined;
      req.on("data", (d) => buf.push(d));
      req.on("end", () => {
        const data = Buffer.concat(buf);
        try {
          json = JSON.parse(data.toString());
        } catch (error) {}
        resolve({ raw: data, json });
      });
    });
  }

  public end(controller: (req: Req, res: Res) => Promise<any>) {
    return async (req: Req, res: Res) => {
      const production = process.env.NODE_ENV === "production";
      try {
        await controller(req, res);
        if (!res.writableEnded) res.end();
      } catch (error: any) {
        const message = production ? undefined : error?.message;
        const type = production ? "ERROR" : error?.constructor?.name;
        return res.status(500).json({
          error: { message, type },
        });
      } finally {
        res.end();
      }
    };
  }
}
