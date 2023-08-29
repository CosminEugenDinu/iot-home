import { useState } from "react";
import css from "./Servers.css";
import { KWsServiceEvent, TServer, TServerHandler, TServerName } from "../../services/ws-service.types";
import { Server } from "../Server/Server";
import { getWsService } from "../../services/ws-service";

const serversBuf = new Map<TServerName, TServer>();

export function Servers() {
  const wss = getWsService();
  const [servers, setServers] = useState<TServer[]>([]);

  const serverIsActiveHandler: TServerHandler = (server: TServer) => {
    serversBuf.set(server.serverName, server);
    setServers(Array.from(serversBuf.values()));
  };

  const serverIsOfflineHandler: TServerHandler = (server: TServer) => {
    serversBuf.delete(server.serverName);
    setServers(Array.from(serversBuf.values()));
  };

  wss.subscribe(KWsServiceEvent.SERVER_IS_ACTIVE, serverIsActiveHandler, serverIsActiveHandler.name);
  wss.subscribe(KWsServiceEvent.SERVER_IS_OFFLINE, serverIsOfflineHandler, serverIsOfflineHandler.name);

  return (
    <>
      <div className={css.bg}>
        <h2>Servers:</h2>
        <div>
          {servers.map((s, i) => (
            <Server key={i} server={s} />
          ))}
        </div>
      </div>
    </>
  );
}
