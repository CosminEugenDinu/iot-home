export type TServerName = string;

export type TServer = {
  serverName: TServerName;
  uri: string;
  pulse: {
    ts: number;
    cpuTemperature: number;
  };
  lastSeen: number;
  devices: TDevice[];
};

export type TDeviceMacAddress = string;
export type TDeviceIpAddress = string;
export type TDevicePinStates = { [key: number]: TDevicePinState };

export type TDevice = {
  mac: TDeviceMacAddress;
  ip: TDeviceIpAddress;
  port: number;
  lastSeen: Date;
  info: TDeviceInfo;
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
  disabled?: boolean;
};

export enum KEvent {
  PULSE = "PULSE",
  CTRL_DEV = "CTRL_DEV",
}

export type TServerPulseMsg = {
  type: KEvent.PULSE;
  sysName: string;
  cpuTemperature: number | null;
  ts: number | null;
  devices?: TDevice[];
  ipAddr: string;
  port: number;
};

export enum KWsServiceEvent {
  SERVER_IS_ACTIVE = "SERVER_IS_ACTIVE",
  SERVER_IS_OFFLINE = "SERVER_IS_OFFLINE",
}

export type THandlerId = string;

export type TServerHandler = (server: TServer) => void;

export type TParsedMsg = {
  obj: any;
  str: string;
};
export type TParsedMsgHandler = (msg: TParsedMsg) => void;

export enum KWsState {
  CLOSED = 3,
}

export type TControlDeviceOutgoingMsg = {
  type: KEvent.CTRL_DEV;
  mac: TDeviceMacAddress;
  states: { pin: number; val: number }[];
};
