import css from "./Device.css";
import { useState } from "react";
import Switch from "react-switch";
import { getWsService } from "../../services/ws-service";
import { KEvent, TControlDeviceOutgoingMsg, TDevice, TDevicePinState } from "../../services/ws-service.types";

type TPinSwitchChangeHandler = (args: { nextChecked: boolean; pin: TDevicePinState }) => void;

const pinStateBuf = new Map<number, number>();
export function Device(props: { device: TDevice }) {
  const wss = getWsService();
  const { device } = props;
  const {
    info: { displayName },
    isOnline,
  } = device;
  const [pinStateChanged, setPinStateChanged] = useState<number>(0);

  const pins: TDevicePinState[] = [];
  for (const [pinNo, pinDef] of Object.entries(device.info?.controls?.pins ?? {})) {
    const pin = Number(pinNo);
    const { devPinStates: pinStateObj = {} } = device;
    const state = pinStateObj[pin];

    const pinState: TDevicePinState = {
      pin,
      val: state?.val ?? -1,
      dir: state?.dir ?? 1,
      sta: state?.sta ?? 0,
      disabled: !isOnline,
    };
    pins.push(pinState);
  }

  for (const pinState of pins) {
    const prevPinState = pinStateBuf.get(pinState.pin);
    if (prevPinState !== pinState.sta) {
      setPinStateChanged(pinState.sta);
    }
    pinStateBuf.set(pinState.pin, pinState.sta);
  }

  const handleSwitchChange: TPinSwitchChangeHandler = ({ nextChecked, pin }) => {
    const pinNumber = pin.pin;
    const val = Number(!!nextChecked);
    const deviceStateOutMsg: TControlDeviceOutgoingMsg = {
      type: KEvent.CTRL_DEV,
      mac: device.mac,
      states: [{ pin: pinNumber, val }],
    };
    wss.ws?.send(JSON.stringify(deviceStateOutMsg));
  };

  return (
    <div className={css["device-wrapper"]}>
      <div className={css["device-header"]}>
        <DeviceStatusLed active={!!isOnline} />
        <span className={css["device-name"]}>{displayName}</span>
      </div>
      <div className={css["device-controls-wrapper"]}>
        {pins.map((p, i) => (
          <Pin key={i} pin={p} onChange={handleSwitchChange} />
        ))}
      </div>
    </div>
  );
}

export function DeviceStatusLed(props: { active: boolean }) {
  const { active } = props;
  const style = [css["device-led"], active ? css["device-led-active"] : ""].join(" ");
  return <span className={style}>•</span>;
}

export function Pin(props: { pin: TDevicePinState; onChange: TPinSwitchChangeHandler }) {
  const {
    pin,
    pin: { pin: pinNumber },
    onChange,
  } = props;
  const pinSta = pin.sta > 0;
  const pinDisabled = !!pin.disabled;
  const [disabled, setDisabled] = useState(pinDisabled);
  const [checked, setChecked] = useState(pinSta);
  if (pinSta !== checked) {
    setChecked(pinSta);
    setDisabled(false);
  }
  const buttonIsEnabled = !disabled;
  if (buttonIsEnabled && pinDisabled) {
    setDisabled(true);
  } else if (!pinDisabled && disabled) {
    setDisabled(false);
  }
  const handleChange = (nextChecked: boolean) => {
    onChange({ nextChecked, pin });
    setDisabled(true);
  };
  return (
    <div className={css["device-pin-switch-wrapper"]}>
      <span>{pinNumber}</span>
      <Switch onChange={handleChange} checked={pin.sta > 0} disabled={disabled} className={css["react-switch"]} />
      <span className={css["device-pin-switch-value"]}>{pin.sta}</span>
    </div>
  );
}
