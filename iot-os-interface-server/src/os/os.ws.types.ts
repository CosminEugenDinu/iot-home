export enum TIdentity {
  SYSTEM_NAME = "rpi-local.system",
}

export enum KEvent {
  RUN_SCRIPT = "RUN_SCRIPT",
  RUN_SCRIPT_RESULT = "RUN_SCRIPT_RESULT",
  PULSE = "PULSE",
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

export type TNetworkInterface = {
  ifName: string;
  ipAddr: string;
  macAddr: string;
};

export type TMsgPulse = TMsgBase & {
  type: KEvent.PULSE;
  sysName: TIdentity.SYSTEM_NAME;
  netIfs: TNetworkInterface[];
  cpuTemperature: number;
  ts: number;
  str: () => string;
};
