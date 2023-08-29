import { cmdInclude } from "../common_modules/cmd-explorer";
import { SysCommonCmdTree } from "./sys.common.cmd.tree";
import { SysWsUtil } from "./sys.ws.util";

export class SysNetCmdTree extends SysCommonCmdTree {
  @cmdInclude()
  async listDevices() {
    const fakeScriptFilename = "net-list-devices.js";
    const response = await this.runRemoteScript(fakeScriptFilename);
    return SysWsUtil.parseScriptResponse(response);
  }
}
