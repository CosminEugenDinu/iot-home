import { exec } from "node:child_process";
import path from "node:path";
import { promises as fs } from "fs";
import { parse, stringify } from "yaml";
import pty from "node-pty";

export class Cmd {
  constructor(shellScriptsDir) {
    this._shellScriptsDir = shellScriptsDir;
  }

  async runShellScript(
    args = {
      filepath: "",
    }
  ) {
    const { executor = "bash", filepath = "", commandArgs = [], sudo = false, password = "" } = args;
    if (executor === "bash" && sudo && password) {
      return await this._runBashSudo(password, filepath, commandArgs);
    }
    return new Promise((resolve, reject) => {
      exec(`${executor} ${filepath}`, (error, stdout, stderr) => {
        if (error) return reject(error);
        return resolve({ stdout: this.parseData(stdout), stderr });
      });
    });
  }

  async _runBashSudo(sudoPassword, filepath, commandArgs) {
    if (!sudoPassword) {
      throw new Error("no sudo password provided");
    }
    return new Promise((resolve, reject) => {
      try {
        const sh = pty.spawn("bash", [filepath, ...commandArgs], {});
        sh.onData((data) => {
          const stdout = this.parseData(data);
          if (stdout.obj.done) {
            return resolve({ stdout });
          }
          if (data.match(/password/)) {
            // process.stdout.write(password.replace(/./g, "*"));
            sh.write(`${sudoPassword}\n`);
          }
        });
        sh.onExit(() => resolve({ stdout: this.parseData("") }));
      } catch (error) {
        reject(error);
      }
    });
  }

  parseData(data) {
    if (!data) return;

    let obj = {};
    let raw = "";

    try {
      raw = data.toString().trim();
      obj = JSON.parse(raw ? raw : "{}");
    } catch (error) {}

    return { obj, raw };
  }
}

export class NetworkManager extends Cmd {
  wifi = {
    scan: async () => {
      const { stdout, stderr } = await this.runShellScript({
        filepath: path.join(this._shellScriptsDir, "nmcli-wifi-scan.sh"),
      });
      if (stderr) console.error(stderr);
      return stdout;
    },
  };

  dev = {
    list: async () => {
      const { stdout, stderr } = await this.runShellScript({
        filepath: path.join(this._shellScriptsDir, "nmcli-if-list.sh"),
      });
      if (stderr) console.error(stderr);
      return stdout;
    },
  };

  async scanWifiNets() {
    const stdout = await this.wifi.scan();
    return this._parseWifiListResponse(stdout);
  }

  async listDevices() {
    const stdout = await this.dev.list();
    return this._parse_dev_list(stdout);
  }

  _parseWifiListResponse(stdout) {
    const lines = stdout.raw.split("\n");
    const wifiList = [];
    for (const line of lines) {
      if (!line) continue;
      const [inUse, bssid, ssid, mode, chan, rate, signal, bars, security] = line.replace(/\\:/g, "###").split(":");
      wifiList.push({
        inUse: inUse === "*",
        bssid: bssid.replace(/###/g, ":"),
        ssid,
        mode,
        chan,
        rate,
        signal,
        bars,
        security,
      });
    }
    return wifiList;
  }

  _parse_dev_list(stdout) {
    const lines = stdout.raw.split("\n");
    const ifList = [];
    for (const line of lines) {
      if (!line) continue;
      // output like: (DEVICE, TYPE, STATE, CONNECTION)
      const [device, type, state, connection] = line.replace(/\\:/g, "###").split(":");
      ifList.push({ device, type, state, connection });
    }
    return ifList;
  }
}

export class Netplan extends Cmd {
  _settings = {
    shellScriptsDir: "",
    defaultWifiSSID: "",
    defaultWifiDevice: "",
    defaultWifiRenderer: "",
  };

  netplan = {
    apply: async (password) => {
      const filepath = path.join(this._settings.shellScriptsDir, "netplan-apply.sh");
      const { stdout, stderr } = await this.runShellScript({
        filepath,
        sudo: true,
        password,
      });
      if (stderr) {
        return console.error(stderr);
      }
      return stdout;
    },
  };

  constructor(settings) {
    super(settings.shellScriptsDir);
    this._validateSettings(settings);
    this._settings = settings;
  }

  get configFilePath() {
    return "/etc/netplan/50-cloud-init.yaml";
  }

  async apply(sudoPassword) {
    return this.netplan.apply(sudoPassword);
  }

  async getConfig() {
    const netplanConfigFile = await fs.readFile(this.configFilePath);
    const existingConfig = this._validateDefaultConfig(parse(netplanConfigFile.toString()));
    return existingConfig;
  }

  async setConfig(newConfig) {
    const existingConfig = await this.getConfig();
    this._validateNewConfig(newConfig, existingConfig);
    await this._writeConfig(newConfig);
  }

  async removeWifiConn(ssid) {
    if (!ssid) {
      throw new Error("No ssid");
    }
    const netplanConfigStr = String(await fs.readFile(this.configFilePath));
    const existingConfig = this._validateDefaultConfig(parse(netplanConfigStr));
    const newConfig = parse(netplanConfigStr);
    const accPoints = this._getDefaultAccessPoints(newConfig);
    delete accPoints[ssid];
    this._validateNewConfig(newConfig, existingConfig);

    return await this._writeConfig(newConfig);
  }

  async addWifiConn(ssid, password) {
    if (!ssid) {
      throw new Error("No ssid");
    }
    if (!password || password.length < 4) {
      throw new Error("Invalid password");
    }
    const netplanConfigStr = String(await fs.readFile(this.configFilePath));
    const existingConfig = this._validateDefaultConfig(parse(netplanConfigStr));
    const newConfig = parse(netplanConfigStr);
    const accPoints = this._getDefaultAccessPoints(newConfig);
    accPoints[ssid] = { password };
    this._validateNewConfig(newConfig, existingConfig);

    return await this._writeConfig(newConfig);
  }

  async _writeConfig(newConfig) {
    const configStr = stringify(newConfig);
    await fs.writeFile(this.configFilePath, Buffer.from(configStr));
    return newConfig;
  }

  _getDefaultWifiDevice(config) {
    return config.network.wifis[this._settings.defaultWifiDevice];
  }

  _getDefaultAccessPoints(config) {
    return config.network.wifis[this._settings.defaultWifiDevice]["access-points"];
  }

  _validateSettings(settings) {
    if (!settings.defaultWifiSSID) {
      throw new Error("No DEFAULT_WIFI_SSID");
    }
    if (!settings.defaultWifiRenderer) {
      throw new Error("No DEFAULT_WIFI_RENDERER");
    }
  }

  _validateNewConfig(newConfig, existingConfig) {
    this._validateDefaultConfig(newConfig);
    const newDefaultWifiPass =
      newConfig.network.wifis[this._settings.defaultWifiDevice]["access-points"][this._settings.defaultWifiSSID]
        .password;
    const thisDefaultWifiPass =
      existingConfig.network.wifis[this._settings.defaultWifiDevice]["access-points"][this._settings.defaultWifiSSID]
        .password;
    if (newDefaultWifiPass !== thisDefaultWifiPass) {
      throw new Error("Default wifi password cannot be changed.");
    }
  }

  _validateDefaultConfig(config) {
    const renderer = config.network.wifis.renderer;
    const defaultWifiDevice = config.network.wifis[this._settings.defaultWifiDevice];
    if (!defaultWifiDevice) {
      throw new Error(`Default wifi device is not ${this._settings.defaultWifiDevice}`);
    }
    if (renderer !== this._settings.defaultWifiRenderer) {
      throw new Error(
        `Renderer is ${renderer} instead of ${this._settings.defaultWifiRenderer} in file ${this.configFilePath}.`
      );
    }
    return config;
  }
}

export class HostInfo extends Cmd {
  async getIpAddress() {
    const filepath = path.join(this._shellScriptsDir, "ip-addr.sh");
    const { stdout, stderr } = await this.runShellScript({ filepath });
    if (stderr) console.error(stderr);
    const ipList = stdout.raw.split(" ");
    stdout.obj = ipList;
    return stdout;
  }
}

export class Hotspot extends Cmd {
  constructor(
    config = {
      shellScriptsDir: "",
      hotspotSSID: "",
    }
  ) {
    const { shellScriptsDir } = config;
    super(shellScriptsDir);
    this._config = config;
  }

  async on(sudoPassword) {
    const { stdout, stderr } = await this.runShellScript({
      filepath: path.join(this._shellScriptsDir, "nmcli-hotspot-con-on.sh"),
      commandArgs: [this._config.hotspotSSID],
      sudo: true,
      password: sudoPassword,
    });
    if (stderr) console.error(stderr);
    return stdout;
  }

  async off(sudoPassword) {
    const { stdout, stderr } = await this.runShellScript({
      filepath: path.join(this._shellScriptsDir, "nmcli-hotspot-con-off.sh"),
      commandArgs: [this._config.hotspotSSID],
      sudo: true,
      password: sudoPassword,
    });
    if (stderr) console.error(stderr);
    return stdout;
  }
}

export function parseCmdArgs(cmdArgs) {
  const [__, filepath, ...args] = cmdArgs;
  return { filepath, args };
}

export class Machine extends Cmd {
  constructor(config) {
    const { shellScriptsDir } = config;
    super(shellScriptsDir);
  }
  async getCpuTemperature() {
    const osScript = path.join(this._shellScriptsDir, "cpu-temperature.sh");
    const { stdout, stderr } = await this.runShellScript({
      filepath: osScript,
    });
    if (stderr) console.error(stderr);
    return stdout.obj.value;
  }
}

export async function getHostAlias() {
  const WSL = "wsl";
  const RPI = "rpi";
  return process.env.HOST_ALIAS ?? RPI;
}
