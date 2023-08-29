import { cmdInclude } from "../common_modules/cmd-explorer";
import { SysCommonCmdTree } from "./sys.common.cmd.tree";
import { SysWsUtil } from "./sys.ws.util";

export class SysFakeCmdTree extends SysCommonCmdTree {
  @cmdInclude()
  async runFakeScript() {
    const fakeScriptFilename = "fake-script.js";
    const response = await this.runRemoteScript(fakeScriptFilename);
    return SysWsUtil.parseScriptResponse(response);
  }
}
