import { TCommandTree, help } from "../common_modules/cmd-explorer";
import { DeviceControlCmdTree } from "./device.control.cmd.tree";
import { DeviceGetCmdTree } from "./device.get.cmd.tree";

export const devMainCmdTree: TCommandTree = {
  help,
  get: new DeviceGetCmdTree(),
  ctrl: new DeviceControlCmdTree(),
};
