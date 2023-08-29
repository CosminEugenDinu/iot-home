import path from "path";
import ws from "ws";
import { ModuleBase } from "../common_modules/module-base.class";
import { KEvent, TMsgPulse, TParsedMsgHandler, TParsedTypedMsg } from "../system/sys.ws.types";
import { TIdentity } from "../common_modules/ws-client/ws-client.types";
import { TDevicePinStates } from "../device/device.types";
import { isCtrlDevMsg } from "../device/device.ws.util";
import { TServerPulseMsg } from "./public-server.types";

export class PublicServerModule extends ModuleBase {
  constructor(
    private _config: {
      sendPulseMinInterval: number;
    }
  ) {
    super();
  }

  async init() {
    this.app.modules.wsc.msgHandlers.push(this._wscMsgHandler);
    this.app.modules.sysWs.subscribe(KEvent.PULSE, this._handleSysPulse, this.cb_id(this._handleSysPulse));
    // this._infiniteRunSendPulse();
  }

  cb_id(subscribeFn: Function) {
    return `${this.constructor.name}:${subscribeFn.name}`;
  }

  private _wscMsgHandler = async (msg: ws.RawData) => {
    const parsedMsg = this.parseMsg(msg);
    console.log({ parsedMsg });
    const devPinStates = await this._pubMsgMainHandler(parsedMsg);
    console.log({ devPinStates });
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
        console.log("No ws when trying to send pulse: %s.", JSON.stringify(pulse));
      } else {
        ws.send(JSON.stringify(pulse), console.error);
      }
    }
  }

  async getSysPulse() {
    const defaultPulse: TMsgPulse = {
      type: KEvent.PULSE,
      sysName: TIdentity.SYSTEM_NAME,
      cpuTemperature: NaN,
      netIfs: [],
      port: NaN,
      ts: NaN,
    };

    const pulse = this._lastSysPulse ?? defaultPulse;
    pulse.ts = +new Date();

    return pulse;
  }

  private _lastSysPulse: TMsgPulse | undefined;
  private _pubMsgMainHandler = async (parsedMsg: TParsedTypedMsg): Promise<TDevicePinStates | undefined> => {
    console.log("Got parsed msg from fe: ", parsedMsg);
    let devPinStates: TDevicePinStates | undefined;
    if (isCtrlDevMsg(parsedMsg.obj)) {
      const { mac, states } = parsedMsg.obj;
      const [device] = this.app.modules.device.getDeviceList(mac);
      if (device) {
        devPinStates = await device.setState(states);
        if (this._lastSysPulse) {
          const sysPulseMsg = this._lastSysPulse;
          const devices = this.app.modules.device.getDeviceList("*");
          // set isOnline

          await Promise.all(
            devices.map(async (dev) => {
              dev.isOnline = dev.checkIsOnline();
              try {
                await dev.queryState();
              } catch (error) {
                console.error(error);
              }
            })
          );

          sysPulseMsg.devices = devices;
          // sysPulseMsg.port = this.app.modules.httpServer.port;

          const pulseToPublicServer = this._adaptSysPulseToPublicServer(sysPulseMsg);
          this._sendPulseToPublicServer(pulseToPublicServer);
        }
      }
    }
    return devPinStates;
  };

  private _adaptSysPulseToPublicServer = (sysPulseMsg: TMsgPulse): TServerPulseMsg => {
    const pulseToPublicServer: TServerPulseMsg = {
      type: sysPulseMsg.type,
      sysName: sysPulseMsg.sysName,
      ipAddr: sysPulseMsg.netIfs.find((netIf) => netIf.ifName === "wlan0" || netIf.ifName === "eth0")?.ipAddr ?? "",
      port: sysPulseMsg.port,
      cpuTemperature: sysPulseMsg.cpuTemperature,
      devices: sysPulseMsg.devices,
      ts: sysPulseMsg.ts,
    };
    return pulseToPublicServer;
  };

  private _sysPulseHandlerBlock = false;
  private _handleSysPulse: TParsedMsgHandler = async (parsedMsg: TParsedTypedMsg) => {
    if (this._sysPulseHandlerBlock) return;
    this._sysPulseHandlerBlock = true;

    const { obj: sysPulseMsg, str } = parsedMsg;
    const devices = this.app.modules.device.getDeviceList("*");

    await Promise.all(
      devices.map(async (dev) => {
        try {
          dev.isOnline = dev.checkIsOnline();
          await dev.queryState();
        } catch (error) {
          console.error(error);
        }
      })
    );

    sysPulseMsg.devices = devices;
    sysPulseMsg.port = this.app.modules.httpServer.port;
    this._lastSysPulse = sysPulseMsg as TMsgPulse;

    // this._sendPulse(pulseMsg as TMsgPulse);

    const pulseToPublicServer = this._adaptSysPulseToPublicServer(this._lastSysPulse);
    this._sendPulseToPublicServer(pulseToPublicServer);

    this._sysPulseHandlerBlock = false;
  };

  private _sendPulse(pulseMsg: TMsgPulse) {
    this.app.modules.wsc.ws?.send(JSON.stringify(pulseMsg));
  }

  private _sendPulseToPublicServer(pulseMsg: TServerPulseMsg) {
    this.app.modules.wsc.ws?.send(JSON.stringify(pulseMsg));
  }

  parseMsg(msg: ws.RawData): {
    obj: any;
    str: string;
  } {
    const str = msg.toString();
    let obj = {};
    try {
      obj = JSON.parse(str);
    } catch (error) {}
    return { obj, str };
  }
}
