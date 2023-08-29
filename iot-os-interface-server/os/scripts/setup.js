const expectedVer = 18;
const currentVer = +process.version.slice(1, 3);
if (currentVer !== expectedVer) throw new Error(`expected node v${expectedVer}`);

import dotenv from "dotenv";
import { exec } from "node:child_process";

const projectDir = "../..";

[(`${projectDir}/.env`, `${projectDir}/.env.local`)].forEach((path) => {
  dotenv.config({ path });
});

export async function getHostAlias() {
  const WSL = "wsl";
  const RPI = "rpi";
  return new Promise((resolve, reject) => {
    exec("grep -i microsoft.* /proc/version", (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) console.error(error);
      if (stdout) {
        return resolve(WSL);
      }
      return resolve(RPI);
    });
  });
}
