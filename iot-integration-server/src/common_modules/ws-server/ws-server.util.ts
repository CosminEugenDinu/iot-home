type TRawData = Buffer | ArrayBuffer | Buffer[];

export class WsUtil {
  static parseMsg(raw: TRawData): {
    obj: any;
    str: string;
  } {
    const str = raw.toString();
    let obj = {};
    try {
      obj = JSON.parse(str);
    } catch (error) {}
    return { obj, str };
  }
}
