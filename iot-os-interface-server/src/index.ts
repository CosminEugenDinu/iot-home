import dotenv from "dotenv";
import { promises as fs } from "fs";
import { Cmd } from "./app_modules/cmd/cmd.module";
import { App } from "./common_modules/app/App.module";
import { mainCmdTree } from "./main.cmd.tree";
import paths from "./url-paths.json" assert { type: "json" };
import { WebSocketClientModule } from "./common_modules/ws-client/ws-client.module";
import { OsModule } from "./os/os.module";
import { HttpServerModule } from "./common_modules/http-server/http-server.module";

[".env", ".env.local"].forEach((path) => {
  dotenv.config({ path, override: true });
});

export type TApp = App<typeof appModules>;

const appModules = {
  http: new HttpServerModule<TApp>({ port: +(process.env.PORT ?? 3331) }).setConfigurator(async (thisInstance) => {
    thisInstance.expressApp.get("/ping", (req, res) => res.json({ pong: true }));
    thisInstance.expressApp.get("/", (req, res) =>
      res.end(
        `<!doctype html><html><head><title>App</title></head><body><a href="/cmd/">Command interface</a></body></html>`
      )
    );
  }),

  wsc: new WebSocketClientModule<TApp>({
    wsServerAddr: process.env.WS_SERVER_URL ?? "ws://localhost:3335",
    autoConnectInterval: 500,
  }),

  os: new OsModule({
    sendPulseMinInterval: 1000,
  }),

  cmd: new Cmd({
    cmdFeStaticPath: "dist/static/cmd-fe.alone/static",
    cmdTree: mainCmdTree,
  }),
};

const app = new App(appModules);

async function main() {
  process.on("uncaughtException", console.error);
  await fs.writeFile(process.env.PID_FILENAME ?? ".pid.local", `${process.pid}`);
  await app.init();
}

main();
