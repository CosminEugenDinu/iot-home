import ws from "ws";
import { KEvent, TRunScriptMsg } from "./os.ws.types";
export class OsWsUtil {
  static parseMsg(msg: ws.RawData): {
    obj: any;
    str: string;
  } {
    const str = msg.toString();
    let obj = {};
    try {
      obj = JSON.parse(str);
    } catch (error) {}
    return { obj, str };
  }

  static isRunScriptMsg(msgObj: any): msgObj is TRunScriptMsg {
    return msgObj?.type === KEvent.RUN_SCRIPT;
  }
}
