export type TServerName = string;

export enum KEvent {
  UNKNOWN = "UNKNOWN",
  PULSE = "PULSE",
  CTRL_DEV = "CTRL_DEV",
}

export enum KWsClient {
  RPI_LOCAL_INTEGRATION_SYSTEM = "rpi-local.integration.system",
  FRONTEND = "FRONTEND",
}

export type TServer = {
  serverName: TServerName;
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

export type TServerPulseMsg = {
  type: KEvent.PULSE;
  sysName: string;
  cpuTemperature: number | null;
  ts: number | null;
  devices?: TDevice[];
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

export type TMsgBase = {
  type: KEvent;
};

export type TParsedTypedMsg = { obj: TMsgBase & { [key: string]: any }; str: string };

export type TSysPulse = TMsgBase & {
  type: KEvent.PULSE;
  sysName: string;
  cpuTemperature: number;
  ts: number;
};

export type TMsgPulse = TSysPulse & {
  devices?: TDevice[];
};
