import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import pty from "node-pty";
import dotenv from "dotenv";

const CWD = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(CWD, "..");

[`${PROJECT_ROOT}/.env.development`].forEach((path) => {
  dotenv.config({ path });
});

main();

async function main() {
  await start_sudo_openocd(process.env.SUDOPASSPHRASE);
}

async function start_sudo_openocd(sudoPassword) {
  if (!sudoPassword) throw new Error("no password");
  return new Promise((resolve, reject) => {
    try {
      const sh = pty.spawn("bash", [`${CWD}/sudo-wsl-start-openocd`], {});
      sh.onData((data) => {
        process.stdout.write(data.toString());
        if (data.match(/password/)) {
          process.stdout.write(sudoPassword.replace(/./g, "*"));
          sh.write(`${sudoPassword}\n`);
        }
      });
      sh.onExit(() => resolve());
    } catch (error) {
      reject(error);
    }
  });
}
