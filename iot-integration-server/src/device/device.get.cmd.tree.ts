import { cmdInclude } from "../common_modules/cmd-explorer";
import { DeviceCommonCmdTree } from "./device.common.cmd.tree";

export class DeviceGetCmdTree extends DeviceCommonCmdTree {
  @cmdInclude()
  async all() {
    const devices = this.app.modules.device.getDeviceList("*");
    // set isOnline
    devices.forEach((dev) => {
      dev.isOnline = dev.checkIsOnline();
    });

    return devices;
  }
}
