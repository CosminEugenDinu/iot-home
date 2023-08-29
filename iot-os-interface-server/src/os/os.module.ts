import path from "path";
import ws from "ws";
import { exec } from "node:child_process";
import { ModuleBase } from "../common_modules/module-base.class";
import { OsWsUtil } from "./os.ws.util";
import { KEvent, TIdentity, TMsgPulse, TNetworkInterface, TScriptResultMsg } from "./os.ws.types";
import { KScriptFilename } from "./os.types";
import { networkInterfaces } from "os";
import { inspect } from "util";

export class OsModule extends ModuleBase {
  constructor(
    private _config: {
      sendPulseMinInterval: number;
    }
  ) {
    super();
  }
  async init() {
    this.app.modules.wsc.msgHandlers.push(this._wsMsgHandler);
    this._infiniteRunSendPulse();
  }

  private _wsMsgHandler = async (msg: ws.RawData) => {
    const { obj } = OsWsUtil.parseMsg(msg);
    if (OsWsUtil.isRunScriptMsg(obj)) {
      const { scriptFilename } = obj;
      const { ws } = this.app.modules.wsc;
      const msg: TScriptResultMsg = {
        type: KEvent.RUN_SCRIPT_RESULT,
        scriptFilename,
        stdout: "",
        stderr: "",
      };
      try {
        const result = await this.runScript(scriptFilename);
        msg.stdout = result.stdout;
        msg.stderr = result.stderr;
        ws?.send(JSON.stringify(msg));
      } catch (error: any) {
        msg.stderr = error?.message ?? "Unknown error";
        ws?.send(JSON.stringify(msg));
      }
    }
  };

  private async _infiniteRunSendPulse() {
    while (true) {
      const ts = +new Date();
      const pulse = await this.getSysPulse();
      const fin = +new Date() - ts;
      if (fin < this._config.sendPulseMinInterval) {
        const diff = this._config.sendPulseMinInterval - fin;
        await new Promise((r) => setTimeout(r, diff));
      }
      const ws = this.app.modules.wsc.ws;
      if (!ws) {
        console.log("No ws when trying to send pulse: %s.", pulse.str());
      } else {
        ws.send(pulse.str(), (error) => error && console.error({ error }));
      }
    }
  }

  async getSysPulse() {
    const pulse: TMsgPulse = {
      type: KEvent.PULSE,
      sysName: TIdentity.SYSTEM_NAME,
      cpuTemperature: NaN,
      netIfs: [],
      ts: NaN,
      str() {
        return JSON.stringify(this);
      },
    };

    pulse.cpuTemperature = await this.getCpuTemp();
    pulse.netIfs = await this.getNetworks();
    pulse.ts = +new Date();

    return pulse;
  }

  async getCpuTemp(): Promise<number> {
    const sensorsResult = await this.runScript(KScriptFilename.CPU_TEMPERATURE);
    const { obj, raw, error } = this.parseScriptResponse(sensorsResult);
    // console.log({ obj, raw, error: error?.message });
    let prop: any | undefined;
    prop = obj["cpu_thermal-virtual-0"];
    prop = prop && prop["temp1"];
    prop = prop && prop["temp1_input"];
    return Number(prop);
  }

  async getNetworks(): Promise<TNetworkInterface[]> {
    const netIfs: TNetworkInterface[] = [];
    const ifsInfo = networkInterfaces();
    for (const ifName in ifsInfo) {
      const nets = ifsInfo[ifName] ?? [];
      for (const net of nets) {
        if (!net.internal && net.family === "IPv4") {
          netIfs.push({ macAddr: net.mac, ifName, ipAddr: net.address });
        }
      }
    }
    return netIfs;
  }

  get scriptsDir() {
    return path.resolve("os/scripts");
  }

  async runScript(scriptFilename: KScriptFilename | string): Promise<{
    stdout: string;
    stderr: string;
  }> {
    const executor = "node";
    const filepath = path.join(this.scriptsDir, scriptFilename);
    return new Promise((resolve, reject) => {
      exec(`${executor} ${filepath}`, (error, stdout = "", stderr = "") => {
        if (error) return reject(error);
        return resolve({ stdout, stderr });
      });
    });
  }

  parseScriptResponse(response: { stdout: string; stderr: string }): {
    obj: any;
    raw: string;
    error?: Error;
  } & { [key: string]: any } {
    const { stdout, stderr } = response;
    let parsed: any | undefined;
    let obj = {};
    let raw = "";
    let error: Error | undefined;

    if (stderr) {
      error = new Error(stderr?.trim() ?? "");
    }

    try {
      parsed = JSON.parse(stdout);
      if (parsed?.obj) {
        obj = parsed.obj;
      } else {
        obj = parsed;
      }
      if (parsed.raw) {
        raw = parsed.raw;
      }
    } catch (error) {
      console.error(error);
      raw = stdout;
    }
    return { obj, raw, error };
  }
}
