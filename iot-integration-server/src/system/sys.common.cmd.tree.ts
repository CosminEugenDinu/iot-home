import { CmdTreeAppCommon } from "../app_modules/cmd/cmd.common";
import { KEvent, TParsedMsgHandler, TRunScriptMsg } from "./sys.ws.types";
import { SysWsUtil } from "./sys.ws.util";

export class SysCommonCmdTree extends CmdTreeAppCommon {
  async runRemoteScript(scriptFilename: string): Promise<{
    stdout: string;
    stderr: string;
  }> {
    const TIMEOUT = 5000;
    const { sysClient } = this.app.modules.sysWs;

    return new Promise((resolve, reject) => {
      setTimeout(reject, TIMEOUT);
      if (!sysClient) return reject(new Error("Sys client is not connected"));

      const msg: TRunScriptMsg = {
        type: KEvent.RUN_SCRIPT,
        scriptFilename,
      };

      sysClient.send(JSON.stringify(msg));

      const responseHandler: TParsedMsgHandler = ({ obj }) => {
        if (!SysWsUtil.isScriptResponseMsg(obj)) return;
        if (obj.scriptFilename === scriptFilename) {
          const { stdout, stderr } = obj;
          return resolve({ stdout, stderr });
        }
      };

      this.app.modules.sysWs.subscribe(KEvent.RUN_SCRIPT_RESULT, responseHandler, responseHandler.name);
      this.app.modules.sysWs.sysClient?.once("error", reject);
    });
  }
}
