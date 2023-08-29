import qs from "node:querystring";
import { Arg, cmdInclude } from "../common_modules/cmd-explorer";
import { DeviceCommonCmdTree } from "./device.common.cmd.tree";
import { Device } from "./device.module";

export class DeviceControlCmdTree extends DeviceCommonCmdTree {
  private _selectedDevice: Device | undefined;
  private _pins: string[] = ["2", "3", "4", "5", "6"];
  private _values: string[] = ["0", "1"];

  @cmdInclude({ help: true })
  async select() {
    const A = new Arg(arguments[0]);
    const argNeedHelp = A.getArgNeedHelp();
    let devList: Device[] | undefined;
    const selectedPins = A.getListValueOf("--pin");
    const selectedValues = A.getListValueOf("--val");
    if (argNeedHelp) {
      const lastArg = A.getLast();
      devList = this.app.modules.device.getDeviceList("*");
      const remainingPinsToSelectCmdlist = this._pins.filter((p) => !selectedPins.includes(p)).map((p) => `--pin=${p}`);
      return {
        " ": { cmdlist: devList.map((d) => `--dev-name=${d.mac}`) },
        "--dev-name": { cmdlist: ["set", "get"] },
        set: { cmdlist: remainingPinsToSelectCmdlist },
        "--pin": { cmdlist: A.has("set") ? this._values.map((v) => `--val=${v}`) : ["--dry-run"] },
        "--val": A.has("set") ? { cmdlist: remainingPinsToSelectCmdlist.concat("--dry-run") } : undefined,
        get: { cmdlist: remainingPinsToSelectCmdlist.concat("--dry-run") },
      }[argNeedHelp.name];
    }

    const selectedDeviceMac = A.getValueOf("--dev-name") ?? "";
    this._selectedDevice = this.app.modules.device.getDeviceList(selectedDeviceMac)[0];

    // set isOnline
    this._selectedDevice.isOnline = this._selectedDevice.checkIsOnline();

    const params: { pin?: string; val?: string }[] = selectedPins.map((pin, i) => {
      if (A.has("set")) {
        return { pin, val: selectedValues[i] };
      } else if (A.has("get")) {
        return { pin };
      } else {
        return {};
      }
    });

    const dev = this._selectedDevice;
    const query = params.map((p) => qs.stringify(p)).join("&");
    const url = `http://${dev.ip}:${dev.port}/api?${query}`;

    if (A.hasName("--dry-run")) {
      return {
        selected: this._selectedDevice,
        params,
        url,
      };
    }

    // TODO: add header connection close
    const { body } = await this.request({ url, method: "get" });
    return { body: body.parsed };
  }
}
