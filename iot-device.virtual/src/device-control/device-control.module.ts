import { Request as Req, Response as Res, Router } from "express";
import { ModuleBase } from "../common_modules/module-base.class";

export type TDevicePinState = {
  pin: number;
  val: number;
  dir: number;
  sta: number;
};

export type TDeviceControlParam = { pin: number; val?: number };

export class DeviceControl extends ModuleBase {
  private _router: Router;

  private _defaultState: TDevicePinState = { pin: NaN, val: 0, dir: 0, sta: 0 };
  private _state = new Map<number, TDevicePinState>();

  public availablePins = [2, 3];

  constructor(
    private _config: {
      apiMountPath: string;
    }
  ) {
    super();
    this._router = Router();
  }

  async init() {
    await this._initPins();
    const _end = this.app.modules.httpServer.end;
    this.app.modules.httpServer.expressApp.use(this._config.apiMountPath, this._router);
    // this._router.get("", _end(this.pin_ctrl));
    this._router.get("/", this.pin_ctrl);
    this._router.post("", this.pin_ctrl);
    this._router.use("/ping", (req, res) => res.end(JSON.stringify({ pong: true })));
  }

  pin_ctrl = async (req: Req, res: Res) => {
    const controlParams = this._getControlParams(req);
    const states: TDevicePinState[] = [];
    for (const { pin, val } of controlParams) {
      if (val === undefined) {
        const currentState = await this.getState(pin);
        states.push(currentState);
      } else {
        const newState = await this.setState(pin, { pin, val });
        states.push(newState);
      }
    }
    res.end(JSON.stringify(states));
  };

  async setState(pinNumber: number, inState: Partial<TDevicePinState>) {
    const sta = Number(inState.val) > 0 ? 1 : 0;
    const defaultState = { ...this._defaultState, pin: pinNumber };
    const currentState = (this._state.get(pinNumber) ?? this._state.set(pinNumber, defaultState).get(pinNumber))!;
    const newState = { ...currentState, ...inState, sta };
    this._state.set(pinNumber, newState);
    return newState;
  }

  async getState(pinNumber: number) {
    const defaultState = { ...this._defaultState, pin: pinNumber };
    const currentState = (this._state.get(pinNumber) ?? this._state.set(pinNumber, defaultState).get(pinNumber))!;
    return currentState;
  }

  private async _initPins() {
    for (const pinNumber of this.availablePins) {
      const defaultState = { ...this._defaultState, pin: pinNumber };
      this._state.set(pinNumber, defaultState);
    }
  }

  private _getControlParams(req: Req): TDeviceControlParam[] {
    const params: TDeviceControlParam[] = [];

    const pinQuery = req.query["pin"];
    const pinQueryArr = Array.isArray(pinQuery) ? pinQuery : [pinQuery];
    const valQuery = req.query["val"];
    const valQueryArr = Array.isArray(valQuery) ? valQuery : [valQuery];

    for (const [i, pinQuery] of pinQueryArr.entries()) {
      const pinNumber = Number(pinQuery);
      if (Number.isInteger(pinNumber)) {
        const valQuery = valQueryArr[i];

        const pin = pinNumber;
        const val = valQuery ? Number(valQuery) : undefined;

        params.push({ pin, val });
      }
    }
    return params;
  }
}
