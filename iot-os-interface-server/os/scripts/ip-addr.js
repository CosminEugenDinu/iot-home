import "./setup.js";

import path, { dirname } from "path";
import { HostInfo } from "./scripts-lib.js";

async function wifiScan(args) {
  const currDir = dirname(args[1]);
  const shellScriptsDir = path.join(currDir, "shell/rpi");
  const hostInfo = new HostInfo(shellScriptsDir);
  return await hostInfo.getIpAddress();
}

wifiScan(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
