import { CmdTreeAppCommon } from "../app_modules/cmd/cmd.common";

export class OsCommonCmdTree extends CmdTreeAppCommon {
  async runOsScript(scriptFilename): Promise<{
    stdout: string;
    stderr: string;
  }> {
    const result = this.app.modules.os.runScript(scriptFilename);
    return result;
  }
}
