import { KEvent } from "../system/sys.ws.types";
import { TDeviceMacAddress } from "./device.types";

export type TControlDeviceIncomingMsg = {
  type: KEvent.CTRL_DEV;
  mac: TDeviceMacAddress;
  states: { pin: number; val: number }[];
};
