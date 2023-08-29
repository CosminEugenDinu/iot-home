import http, { IncomingMessage } from "node:http";
import https from "node:https";
import { OutgoingHttpHeaders } from "node:http2";
import { RequestOptions } from "node:https";
import { Readable } from "node:stream";
import { CmdTreeAppCommon } from "../app_modules/cmd/cmd.common";

export function httpOrHttps(protocol: "http:" | "https:" | string) {
  if ("https:" === protocol) {
    return https;
  } else if ("http:" === protocol) {
    return http;
  } else {
    throw new Error(`Protocol ${protocol} not supported.`);
  }
}

type TRequestOpts = {
  url: string;
  method: "get" | "post";
  headers?: OutgoingHttpHeaders;
  body?: Readable;
};

export class DeviceCommonCmdTree extends CmdTreeAppCommon {
  async request(opts: TRequestOpts): Promise<{
    body: { raw: Buffer; str: string; parsed?: any };
  }> {
    return new Promise(async (resolve, reject) => {
      const res = await this.requestStream(opts);
      const buf: Buffer[] = [];
      res.on("error", reject);
      res.on("data", (chunk) => buf.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(buf);
        const str = raw.toString();
        let parsed = undefined;
        try {
          parsed = JSON.parse(str);
        } catch (error) {}
        return resolve({ body: { raw, str, parsed } });
      });
    });
  }
  async requestStream(opts: TRequestOpts) {
    return new Promise<IncomingMessage>((resolve, reject) => {
      const url = new URL(opts.url);
      const fullOpts: RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}?${url.searchParams}`,
        ...opts,
      };
      const req = httpOrHttps(url.protocol)
        .request(fullOpts, (res) => {
          res.on("end", () => req.end());
          resolve(res);
        })
        .on("error", reject);
      const { body } = opts;
      if (body) {
        return body.pipe(req, { end: true });
      }
      return req.end();
    });
  }
}
