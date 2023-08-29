import { isBrowserEnvironment } from "../lib/environment.util";
import {
  KEvent,
  KWsServiceEvent,
  KWsState,
  TDevice,
  THandlerId,
  TParsedMsg,
  TParsedMsgHandler,
  TServer,
  TServerHandler,
  TServerName,
  TServerPulseMsg,
} from "./ws-service.types";

const wsServerAddr = (() =>
  isBrowserEnvironment() ? `ws://${window.document.location.host}/fe-wss` : `ws://localhost:3335/fe-wss`)();
const defaultSettings = {
  wsServerAddr,
  autoConnectInterval: 1000,
  checkServerIsOfflineInterval: 1500,
  checkServerIsOfflineMaxLastSeenInterval: 2000,
};

class WebSocketService {
  serviceIsInitialized = false;
  ws?: WebSocket;
  initCalled = false;
  private _serviceEventHandlers = new Map<KWsServiceEvent, Map<THandlerId, TServerHandler>>();
  private _msgEventHandlers = new Map<KEvent, Map<THandlerId, TParsedMsgHandler>>();
  private _msgHandlers: ((msg: MessageEvent) => void)[] = [];
  private _servers = new Map<TServerName, TServer>();
  constructor(
    private _config: {
      wsServerAddr: string;
      autoConnectInterval: number;
      checkServerIsOfflineInterval: number;
      checkServerIsOfflineMaxLastSeenInterval: number;
    }
  ) {}

  init() {
    if (this.initCalled) return this;
    this.initCalled = true;

    if (isBrowserEnvironment()) {
      this._infiniteTryConnect();
      this._infiniteHandleOfflineServers({
        checkInterval: this._config.checkServerIsOfflineInterval,
        maxLastSeenInterval: this._config.checkServerIsOfflineMaxLastSeenInterval,
      });
    }

    this._setupMsgEventHandlers();
    this._msgHandlers.push(this.mainMsgHandler);

    return this;
  }

  subscribe(serviceEvent: KWsServiceEvent, serviceEventHandler: TServerHandler, handlerId: string) {
    (
      this._serviceEventHandlers.get(serviceEvent) ??
      this._serviceEventHandlers.set(serviceEvent, new Map()).get(serviceEvent)
    )?.set(handlerId, serviceEventHandler);
  }

  mainMsgHandler = (msg: MessageEvent) => {
    const parsed = this.parseMsg(msg.data);
    const msgEventHandlers = this._msgEventHandlers.get(parsed?.obj?.type);
    try {
      msgEventHandlers && msgEventHandlers.forEach((cb) => cb(parsed));
    } catch (error) {
      console.error(error);
    }
  };

  private async _infiniteHandleOfflineServers(opts: { checkInterval: number; maxLastSeenInterval: number }) {
    while (true) {
      await new Promise((r) => setTimeout(r, opts.checkInterval));
      try {
        const offlineServers = this._deleteOfflineServers(opts.maxLastSeenInterval);
        if (offlineServers.length) {
          const serverIsOfflineHandlers = this._serviceEventHandlers.get(KWsServiceEvent.SERVER_IS_OFFLINE) ?? [];
          offlineServers.forEach((offlineServer) => {
            serverIsOfflineHandlers.forEach((cb) => cb(offlineServer));
          });
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  private _deleteOfflineServers(maxLastSeenInterval: number): TServer[] {
    const offline: TServer[] = [];
    this._servers.forEach((server, serverName) => {
      const now = +new Date();
      if (now - server.lastSeen > maxLastSeenInterval) {
        offline.push(server);
      }
    });
    offline.forEach((server) => this._servers.delete(server.serverName));
    return offline;
  }

  private _setupMsgEventHandlers() {
    const pulseMainHandler = (parsedMsg: TParsedMsg) => {
      const intServerPulseMsg = this._parseIntegrationServerPulseMsg(parsedMsg);
      const { ts, sysName: serverName, ipAddr, port, cpuTemperature, devices } = intServerPulseMsg;
      const protocol = "http:";

      const intServer: TServer = {
        serverName,
        uri: `${protocol}//${ipAddr}:${port}`,
        pulse: { ts, cpuTemperature },
        lastSeen: +new Date(),
        devices,
      };

      this._servers.set(serverName, intServer);

      const serverIsActiveHandlers = this._serviceEventHandlers.get(KWsServiceEvent.SERVER_IS_ACTIVE) ?? [];
      const thisServer = this._servers.get(serverName);
      if (thisServer) {
        try {
          serverIsActiveHandlers.forEach((cb) => cb(thisServer));
        } catch (error) {
          console.error(error);
        }
      }
    };

    const pulseHandlers =
      this._msgEventHandlers.get(KEvent.PULSE) ??
      this._msgEventHandlers.set(KEvent.PULSE, new Map()).get(KEvent.PULSE)!;
    pulseHandlers.set("pulse-handler-id", pulseMainHandler);
  }

  private _parseIntegrationServerPulseMsg = (parsedMsg: TParsedMsg) => {
    const { obj } = parsedMsg;

    const intServerPulse: TServerPulseMsg & { ts: number; cpuTemperature: number; devices: TDevice[] } = {
      type: KEvent.PULSE,
      sysName: obj?.sysName ?? "",
      ts: Number(obj?.ts),
      ipAddr: obj?.ipAddr ?? "",
      port: obj?.port ?? NaN,
      cpuTemperature: Number(obj?.cpuTemperature),
      devices: [],
    };

    if ("devices" in obj) {
      const devices = obj.devices;
      if (Array.isArray(devices)) {
        intServerPulse.devices = [];
        for (const device of devices) {
          intServerPulse.devices.push(device);
        }
      }
    }

    return intServerPulse;
  };

  async _infiniteTryConnect() {
    if (this.serviceIsInitialized) return;
    while (true) {
      const { readyState } = this.ws ?? ({} as WebSocket);
      if (!this.ws || !readyState || readyState === KWsState.CLOSED) {
        try {
          const ws = await this.openWs();
          console.log("Ws connected to server %s.", this._config.wsServerAddr);
          this.ws = ws as any;
          ws.onmessage = (msg) => {
            this._msgLogger(msg);
            this._msgHandlers.forEach((cb) => cb(msg));
          };
          this.serviceIsInitialized = true;
        } catch (error) {
          console.error(error);
          this.serviceIsInitialized = false;
        }
      } else {
        this.serviceIsInitialized = false;
      }
      await new Promise((r) => setTimeout(r, this._config.autoConnectInterval));
    }
  }

  private async _msgLogger(msg: MessageEvent) {
    console.log("Received msg: %s", msg.data);
  }

  async openWs(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this._config.wsServerAddr);
      ws.onopen = (ev) => resolve(ws);
      ws.onerror = (ev) => reject(new Error("Ws open error"));
    });
  }

  parseMsg(raw?: any): {
    obj: any;
    str: string;
  } {
    const str = String(raw ?? "");
    let obj = {};
    try {
      obj = JSON.parse(str);
    } catch (error) {}
    return { obj, str };
  }
}

const _wss = new WebSocketService(defaultSettings);

export function getWsService() {
  return _wss.init();
}
