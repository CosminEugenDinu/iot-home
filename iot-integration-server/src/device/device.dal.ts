import devicesDb from "./device.db.json" assert { type: "json" };

export class DeviceDAL {
  static async getDeviceInfo(mac: string) {
    const deviceInfo = devicesDb[mac];
    return deviceInfo;
  }
}
