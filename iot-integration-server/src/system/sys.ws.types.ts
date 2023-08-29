import { TDevice } from "../device/device.types";

export enum KWsClient {
  RPI_LOCAL_SYSTEM = "rpi-local.system",
  FRONTEND = "FRONTEND",
}

export enum KEvent {
  UNKNOWN = "UNKNOWN",
  RUN_SCRIPT = "RUN_SCRIPT",
  RUN_SCRIPT_RESULT = "RUN_SCRIPT_RESULT",
  PULSE = "PULSE",
  CTRL_DEV = "CTRL_DEV",
}

export type TMsgBase = {
  type: KEvent;
};

export type TRunScriptMsg = TMsgBase & {
  type: KEvent.RUN_SCRIPT;
  scriptFilename: string;
};

export type TScriptResultMsg = TMsgBase & {
  type: KEvent.RUN_SCRIPT_RESULT;
  scriptFilename: string;
  stdout: string;
  stderr: string;
};

export type TParsedMsg = { obj: any; str: string };
export type TParsedTypedMsg = { obj: TMsgBase & { [key: string]: any }; str: string };

export type TParsedMsgHandler = (parsedTypedMsg: TParsedTypedMsg) => void;

export type TNetworkInterface = {
  ifName: string;
  ipAddr: string;
  macAddr: string;
};

export type TSysPulse = TMsgBase & {
  type: KEvent.PULSE;
  sysName: string;
  cpuTemperature: number;
  netIfs: TNetworkInterface[];
  port: number;
  ts: number;
};

export type TMsgPulse = TSysPulse & {
  devices?: TDevice[];
};
