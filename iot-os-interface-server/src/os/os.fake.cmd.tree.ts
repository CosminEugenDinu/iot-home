import { cmdInclude } from "../common_modules/cmd-explorer";
import { OsCommonCmdTree } from "./os.common.cmd.tree";

export class OsFakeCmdTree extends OsCommonCmdTree {
  @cmdInclude()
  async isReallyFake() {
    return { response: "yes" };
  }

  @cmdInclude()
  async runFakeScript() {
    const fakeScriptFilename = "fake-script.js";
    const response = await this.runOsScript(fakeScriptFilename);
    return this.app.modules.os.parseScriptResponse(response);
  }
}
