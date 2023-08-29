import { KEvent, TParsedTypedMsg } from "../system/sys.ws.types";
import { TControlDeviceIncomingMsg } from "./device.ws.types";

export function isCtrlDevMsg(obj: TParsedTypedMsg["obj"]): obj is TControlDeviceIncomingMsg {
  return KEvent.CTRL_DEV === obj?.type;
}
