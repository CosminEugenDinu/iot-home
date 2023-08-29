import { KEvent, TScriptResultMsg } from "./sys.ws.types";
export class SysWsUtil {
  static isScriptResponseMsg(msgObj: any): msgObj is TScriptResultMsg {
    return msgObj?.type === KEvent.RUN_SCRIPT_RESULT;
  }

  static parseScriptResponse(response: { stdout: string; stderr: string }): {
    obj: any;
    raw: string;
  } {
    const { stdout, stderr } = response;
    if (stderr) console.error(stderr);
    // assume stdout is json and is of type {obj: any, raw: string}
    return JSON.parse(stdout);
  }
}
