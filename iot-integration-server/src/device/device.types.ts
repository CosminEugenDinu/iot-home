export type TDeviceMacAddress = string;
export type TDeviceIpAddress = string;
export type TDevicePinStates = { [key: number]: TDevicePinState };

export type TDevice = {
  mac: TDeviceMacAddress;
  ip: TDeviceIpAddress;
  port: number;
  lastSeen: Date;
  info?: TDeviceInfo;
  isOnline?: boolean;
  devPinStates?: TDevicePinStates;
};

export type TDeviceInfo = {
  id: TDeviceMacAddress;
  displayName: string;
  controls: TDeviceControls;
};

export type TDeviceControls = {
  pins: {
    [key: number]: {
      modes: {
        in: boolean;
        out: boolean;
      };
      outRange: [number, number];
    };
  };
};

export type TDevicePinState = {
  pin: number;
  val: number;
  dir: number;
  sta: number;
};
