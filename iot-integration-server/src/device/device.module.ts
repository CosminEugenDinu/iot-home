import qs from "node:querystring";
import { ModuleBase } from "../common_modules/module-base.class";
import { DeviceDAL } from "./device.dal";
import { TDevice, TDeviceInfo, TDeviceMacAddress, TDevicePinState, TDevicePinStates } from "./device.types";
import { HttpClientModule } from "../common_modules/http-client/http-client.module";

export class Device implements TDevice {
  public mac: string;
  public ip: string;
  public port: number;
  public info?: TDeviceInfo;
  public lastSeen: Date;
  public isOnline?: boolean;
  public devPinStates?: TDevicePinStates;
  constructor(plainDevice: TDevice) {
    this.mac = plainDevice.mac;
    this.ip = plainDevice.ip;
    this.port = plainDevice.port;
    this.info = plainDevice.info;
    this.lastSeen = plainDevice.lastSeen;
    this.devPinStates = plainDevice.devPinStates;
  }

  checkIsOnline(ping?: boolean) {
    // TODO: implement ping
    const now = +new Date();
    const timePassed = 2000;
    return now - +this.lastSeen < timePassed;
  }

  async getDeviceInfo(): Promise<TDeviceInfo> {
    if (this.info) return this.info;
    const info = await DeviceDAL.getDeviceInfo(this.mac);
    this.info = info;
    return info;
  }

  async setState(inStates: { pin: number; val: number }[]): Promise<TDevicePinStates | undefined> {
    const httpClient = new HttpClientModule();
    const query = inStates.map(({ pin, val }) => qs.stringify({ pin, val })).join("&");
    const url = `http://${this.ip}:${this.port}/api?${query}`;

    const { body } = await httpClient.request({ url, method: "get" });

    const outStates: TDevicePinState[] = body.parsed;
    if (!Array.isArray(outStates)) return;

    const pinStateMap = new Map<number, TDevicePinState>();
    outStates.forEach((state) => pinStateMap.set(state.pin, state));
    this.devPinStates = Object.fromEntries(pinStateMap.entries());

    return this.devPinStates;
  }

  async queryState(pins?: number[]) {
    const isOnline = this.checkIsOnline();
    if (!isOnline) return;

    const _pins: number[] = [];
    if (!pins) {
      const info = await this.getDeviceInfo();
      for (const pin in info.controls.pins) {
        _pins.push(Number(pin));
      }
    }

    const httpClient = new HttpClientModule();
    const query = _pins.map((pin) => qs.stringify({ pin })).join("&");
    const url = `http://${this.ip}:${this.port}/api?${query}`;

    // TODO: add header connection close
    const { body } = await httpClient.request({ url, method: "get" });
    const states: TDevicePinState[] = body.parsed;
    if (!Array.isArray(states)) return;

    const pinStateMap = new Map<number, TDevicePinState>();
    states.forEach((state) => pinStateMap.set(state.pin, state));
    this.devPinStates = Object.fromEntries(pinStateMap.entries());

    return this.devPinStates;
  }
}

export class DeviceModule extends ModuleBase {
  static deviceStore = new Map<TDeviceMacAddress, Device>();
  async init() {}

  async setDevice(plainDevice: TDevice) {
    const device = new Device(plainDevice);
    await device.getDeviceInfo();
    DeviceModule.deviceStore.set(plainDevice.mac, device);
  }

  getDeviceList(mac: string | "*"): Device[] {
    if (mac === "*") {
      return Array.from(DeviceModule.deviceStore.values());
    } else {
      const device = DeviceModule.deviceStore.get(mac);
      const devices = device ? [device] : [];
      return devices;
    }
  }
}
