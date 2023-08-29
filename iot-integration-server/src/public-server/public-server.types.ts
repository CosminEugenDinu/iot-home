import { TDevice } from "../device/device.types";
import { KEvent } from "../system/sys.ws.types";

export type TServerPulseMsg = {
  type: KEvent.PULSE;
  sysName: string;
  cpuTemperature: number | null;
  ts: number | null;
  devices?: TDevice[];
  ipAddr: string;
  port: number;
};
