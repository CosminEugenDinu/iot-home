import { cmdInclude } from "../common_modules/cmd-explorer";
import { SysCommonCmdTree } from "./sys.common.cmd.tree";
import { SysWsUtil } from "./sys.ws.util";

export class SysResourcesCmdTree extends SysCommonCmdTree {
  @cmdInclude()
  async cpuTemperature() {
    const fakeScriptFilename = "cpu-temperature.js";
    const response = await this.runRemoteScript(fakeScriptFilename);
    return SysWsUtil.parseScriptResponse(response);
  }
}
