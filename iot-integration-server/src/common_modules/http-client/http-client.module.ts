import http, { IncomingMessage, OutgoingHttpHeaders } from "node:http";
import https, { RequestOptions } from "node:https";
import { Readable } from "stream";
import { ModuleBase } from "../module-base.class";

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
  timeout?: number;
};

export class HttpClientModule extends ModuleBase {
  async init() {}
  async request(opts: TRequestOpts): Promise<{
    body: { raw: Buffer; str: string; parsed?: any };
  }> {
    return new Promise(async (resolve, reject) => {
      let res: http.IncomingMessage | undefined;
      try {
        res = await this.requestStream(opts);
      } catch (error) {
        return reject(error);
      }
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
      const { timeout = 1000 } = opts;
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
      setTimeout(() => {
        req.end();
        req.destroy();
        reject(new Error("timeout"));
      }, timeout);
      process.once("uncaughtException", (error: any) => {
        if (error?.code === "ECONNREFUSED") {
          req.end();
          req.destroy();
          reject(error);
        }
      });
      const { body } = opts;
      if (body) {
        return body.pipe(req, { end: true });
      }
      return req.end();
    });
  }
}
