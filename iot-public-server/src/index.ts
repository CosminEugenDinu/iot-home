import dotenv from "dotenv";
import { promises as fs } from "node:fs";
import { Cmd } from "./app_modules/cmd/cmd.module";
import { App } from "./common_modules/app/App.module";
import { mainCmdTree } from "./main.cmd.tree";
import urls from "./url-paths.json" assert { type: "json" };
import { HttpServerModule } from "./common_modules/http-server/http-server.module";
import { WebSocketServerModule } from "./common_modules/ws-server/ws-server.module";
import { HomePage } from "./app_modules/homepage/homepage.module";
import { IntegrationSystemWsModule } from "./int-system/int-system.ws.module";

[".env", ".env.local"].forEach((path) => {
  dotenv.config({ path, override: true });
});

export type TApp = App<typeof appModules>;

const appModules = {
  httpServer: new HttpServerModule<TApp>({ port: +(process.env.PORT ?? 3336) }).setConfigurator(
    async (thisInstance) => {
      thisInstance.expressApp.get("/ping", (req, res) => res.json({ pong: true }));
    }
  ),

  wss: new WebSocketServerModule({}),

  intSysWs: new IntegrationSystemWsModule(),

  homepage: new HomePage({
    urlMountPath: urls.paths.homepage.mountPath,
    urlApiMountPath: urls.paths.homepage.apiMountPath,
    urlStaticFilesRelPath: urls.paths.homepage.staticFilesRelPath,
    localStaticFilesPath: "static.generated/homepage-fe.alone/static",
  }),

  cmd: new Cmd({
    cmdFeStaticPath: "static.generated/cmd-fe.alone/static",
    cmdTree: mainCmdTree,
  }),
};

const app = new App(appModules);

async function main() {
  await fs.writeFile(process.env.PID_FILENAME ?? ".pid.local", `${process.pid}`);
  await app.init();
}

main();
