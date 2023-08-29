import dotenv from "dotenv";
import { promises as fs } from "node:fs";
import { Cmd } from "./app_modules/cmd/cmd.module";
import { App } from "./common_modules/app/App.module";
import { HttpServerModule } from "./common_modules/http-server/http-server.module";
import { DeviceModule } from "./device/device.module";
import { mainCmdTree } from "./main.cmd.tree";
import { DeviceNotifModule } from "./devnotif/devnotif.module";
import { HomePage } from "./app_modules/homepage/homepage.module";
import urlPaths from "./url-paths.json" assert { type: "json" };
import { WebSocketServerModule } from "./common_modules/ws-server/ws-server.module";
import { SysWsModule } from "./system/sys.ws.module";
import { HttpClientModule } from "./common_modules/http-client/http-client.module";
import { WebSocketClientModule } from "./common_modules/ws-client/ws-client.module";
import { PublicServerModule } from "./public-server/public-server.module";

[".env", ".env.local"].forEach((path) => {
  dotenv.config({ path, override: true });
});

export type TApp = App<typeof appModules>;

const appModules = {
  httpServer: new HttpServerModule<TApp>({ port: +(process.env.PORT ?? 3335) }).setConfigurator(
    async (thisInstance) => {
      thisInstance.expressApp.get("/ping", (req, res) => res.json({ pong: true }));
    }
  ),

  httpClient: new HttpClientModule(),

  wss: new WebSocketServerModule({}),

  devnotif: new DeviceNotifModule({
    apiMountPath: "/device-notifications",
  }),

  device: new DeviceModule(),

  sysWs: new SysWsModule(),

  wsc: new WebSocketClientModule<TApp>({
    wsServerAddr: process.env.WS_SERVER_URL ?? "ws://localhost:3335",
    autoConnectInterval: 1000,
  }),

  psm: new PublicServerModule({
    sendPulseMinInterval: 500,
  }),

  homepage: new HomePage({
    urlMountPath: urlPaths.paths.homepage.mountPath,
    urlApiMountPath: urlPaths.paths.homepage.apiMountPath,
    urlStaticFilesRelPath: urlPaths.paths.homepage.staticFilesRelPath,
    localStaticFilesPath: "dist/static/homepage-fe.alone/static",
  }),

  cmd: new Cmd({
    cmdFeStaticPath: "dist/static/cmd-fe.alone/static",
    cmdTree: mainCmdTree,
  }),
};

const app = new App(appModules);

async function main() {
  // process.on("uncaughtException", console.error);
  await fs.writeFile(process.env.PID_FILENAME ?? ".pid.local", `${process.pid}`);
  await app.init();
}

main();
