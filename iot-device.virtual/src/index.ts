import { promises as fs } from "fs";
import dotenv from "dotenv";
import { HttpServerModule } from "./common_modules/http-server/http-server.module";
import { App } from "./common_modules/app/App.module";
import { DeviceNotifClient } from "./device-notif-client/device-notif-client.module";
import { DeviceControl } from "./device-control/device-control.module";

[".env", ".env.local"].forEach((path) => {
  dotenv.config({ path, override: true });
});

export type TApp = App<typeof appModules>;

const appModules = {
  httpServer: new HttpServerModule({ port: +(process.env.PORT ?? 7777) }).setConfigurator(async (thisInstance) => {
    thisInstance.expressApp.get("/ping", (req, res) => res.json({ pong: true }));
    thisInstance.expressApp.get("/", (req, res) =>
      res.end(
        `<!doctype html><html><head><title>App</title></head><body><a href="/cmd/">Command interface</a></body></html>`
      )
    );
  }),

  devNotifClient: new DeviceNotifClient({
    integrationServerDeviceNotifUrl:
      process.env.INTEGRATION_SERVER_NOTIF_URL ?? "http://localhost:3334/device-notifications/set-is-online",
    integrationServerDeviceNotifInterval: +(process.env.INTEGRATION_SERVER_NOTIF_INTERVAL ?? 1000),
    deviceDeclaredMacAddress: process.env.MAC ?? "VI:RT:UA:LD:EV:CE",
    deviceDeclaredIpAddress: process.env.IP ?? "127.0.0.1",
    deviceDeclaredPort: process.env.PORT ?? "7777",
  }),

  devCtrl: new DeviceControl({
    apiMountPath: "/api",
  }),
};

const app = new App(appModules);

async function main() {
  await fs.writeFile(process.env.PID_FILENAME ?? ".pid.local", `${process.pid}`);
  await app.init();
}

main();
