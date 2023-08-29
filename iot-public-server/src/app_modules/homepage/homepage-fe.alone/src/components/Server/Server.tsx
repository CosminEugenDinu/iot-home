import css from "./Server.css";
import { TServer } from "../../services/ws-service.types";
import { Device } from "../Device/Device";

export function Server(props: { server?: TServer }) {
  const { server } = props;
  if (!server) return null;
  const { serverName, uri, devices } = server;
  if (devices.length > 1) {
    devices?.sort((d1, d2) => {
      const dName1 = d1?.info?.displayName ?? "";
      const dName2 = d2?.info?.displayName ?? "";
      return dName1 > dName2 ? 1 : -1;
    });
  }
  return (
    <>
      <div className={css["server-wrapper"]}>
        <div>
          <a href={uri} target="_blank">
            {serverName}
          </a>
        </div>
        {devices.map((d, i) => (
          <Device key={i} device={d} />
        ))}
      </div>
      <p>{JSON.stringify(server)}</p>
    </>
  );
}
