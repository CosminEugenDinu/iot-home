import "./setup.js";
import path, { dirname } from "path";
import { Hotspot, parseCmdArgs } from "./scripts-lib.js";

const DEFAULT_HOTSPOT_SSID = process.env.DEFAULT_HOTSPOT_SSID;

async function hotspotOff(cmdArgs) {
  const { filepath, args } = parseCmdArgs(cmdArgs);

  if (!["on", "off"].includes(args[0])) {
    throw new Error("expected on or off instruction");
  }

  const hs = new Hotspot({
    shellScriptsDir: path.join(dirname(filepath), "shell/rpi"),
    hotspotSSID: DEFAULT_HOTSPOT_SSID,
  });

  switch (args[0]) {
    case "on":
      return await hs.on(process.env.SUDO_PASSWORD);
    case "off":
      return await hs.off(process.env.SUDO_PASSWORD);
  }
}

hotspotOff(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
