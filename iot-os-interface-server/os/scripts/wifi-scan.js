import "./setup.js";

// run on raspberrypi Ubuntu 20.04

import path, { dirname } from "path";
import { NetworkManager } from "./scripts-lib.js";

async function wifiScan(args) {
  const currDir = dirname(args[1]);
  const shellScriptsDir = path.join(currDir, "shell/rpi");
  const nm = new NetworkManager(shellScriptsDir);
  return await nm.scanWifiNets();
}

wifiScan(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
