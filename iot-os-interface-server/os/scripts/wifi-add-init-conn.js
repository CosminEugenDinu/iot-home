import "./setup.js";
import { Netplan } from "./scripts-lib.js";
import path, { dirname } from "node:path";

const DEFAULT_WIFI_SSID = process.env.DEFAULT_WIFI_SSID;
const DEFAULT_WIFI_RENDERER = process.env.DEFAULT_WIFI_RENDERER;
const DEFAULT_WIFI_DEVICE = process.env.DEFAULT_WIFI_DEVICE;

async function addWifiInitialConnection(args) {
  const [__, filepath, ssid, password] = args;
  checkSSID(ssid);

  const shellScriptsDir = path.join(dirname(filepath), "shell/rpi");

  const npDefaultSettings = {
    shellScriptsDir,
    defaultWifiDevice: DEFAULT_WIFI_DEVICE,
    defaultWifiSSID: DEFAULT_WIFI_SSID,
    defaultWifiRenderer: DEFAULT_WIFI_RENDERER,
  };

  const np = new Netplan(npDefaultSettings);
  await np.addWifiConn(ssid, password);
  return await np.apply(process.env.SUDO_PASSWORD);
}

function checkSSID(ssid) {
  if (ssid === DEFAULT_WIFI_SSID) {
    throw new Error(`Default SSID ${ssid} cannot be changed`);
  }
}

addWifiInitialConnection(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
