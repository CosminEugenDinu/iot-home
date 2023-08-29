import { resolve } from "node:path";
import { exec } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pty from "node-pty";
import { ReadlineParser, SerialPort } from "serialport";
import dotenv from "dotenv";

const BAUD_RATE = 115200;
const CWD = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(CWD, "..");

[`${PROJECT_ROOT}/.env.development`].forEach((path) => {
  dotenv.config({ path });
});

if (!process.env.SUDOERUSER && !process.env.SUDOPASSPHRASE) {
  throw new Error(
    `You must provide SUDOERUSER (username in sudo group) and SUDOPASSPHRASE (user sudo password) in an .env.development file in order to run this script!`
  );
}

main();

async function main() {
  while (true) {
    try {
      const ttyDevFile = await setupPicoSerialMonitor();
      if (ttyDevFile) {
        await startSerialMonitor(ttyDevFile, BAUD_RATE);
      }
    } catch (error) {
      console.error(error);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function setupPicoSerialMonitor() {
  const ttyFileName = await attachPicoUsb();
  const list = await SerialPort.list();
  let ttyDevFile = "";
  for (const { path } of list) {
    if (path?.indexOf(ttyFileName) !== -1) {
      ttyDevFile = path;
    }
  }

  if (!ttyDevFile) {
    console.log({ ttyFileName }, "dev tty file not found");
    return;
  }

  console.log(await ls(ttyDevFile));
  await chown_tty(
    ttyDevFile,
    process.env.SUDOERUSER,
    process.env.SUDOPASSPHRASE
  );
  console.log(await ls(ttyDevFile));

  return ttyDevFile;
}

async function startSerialMonitor(ttyDevFile, baudRate) {
  return new Promise(async (resolve, reject) => {
    try {
      const serialPort = new SerialPort({
        path: ttyDevFile,
        baudRate,
      });
      const parser = serialPort.pipe(new ReadlineParser());
      parser.on("data", (chunk) => {
        console.log(chunk.toString());
      });
      parser.on("error", reject);
      parser.on("pause", () => console.log("pause"));
      parser.on("resume", () => console.log("resume"));
      parser.on("close", resolve);
      // await new Promise(() => setTimeout(resolve, 1000));
    } catch (error) {
      reject(error);
    }
  });
}

async function ls(file) {
  return new Promise((resolve, reject) => {
    exec(`ls -l ${file}`, (error, stdout, stderr) => {
      if (error) return reject(error);
      console.error(stderr);
      return resolve(stdout);
    });
  });
}

async function chown_tty(ttyFile, user, sudoPassword) {
  if (!sudoPassword) throw new Error("no password");
  return new Promise((resolve, reject) => {
    try {
      const sh = pty.spawn("bash", [`${CWD}/sudo-chown`, user, ttyFile], {});
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

async function attachPicoUsb() {
  return new Promise((resolve, reject) => {
    exec(`bash ${CWD}/wsl-attach-pico-usb`, (error, stdout, stderr) => {
      if (error) return reject(error);
      if (stderr) console.error(stderr);
      return resolve(stdout.trim());
    });
  });
}
