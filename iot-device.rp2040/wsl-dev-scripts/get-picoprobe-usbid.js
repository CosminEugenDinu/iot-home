#!/usr/bin/env node

import path, { dirname } from "path";
import { exec } from "node:child_process";

(async function (args) {
  const currDir = dirname(args[1]);
  return new Promise((resolve, reject) => {
    const script = path.resolve(currDir, "wsl-usb-list-win");
    exec(script, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) console.error(error);
      let parsed;
      try {
        parsed = JSON.parse(stdout);
        const devices = parsed["Devices"];
        for (const device of devices) {
          const busId = device["BusId"];
          const description = device["Description"];
          const isPicoprobe = /picoprobe/i.test(description);
          if (isPicoprobe) {
            return resolve(busId);
          }
        }
      } catch (error) {
        console.error(error);
      }
    });
  });
})(process.argv)
  .then(console.log)
  .catch(console.error);
