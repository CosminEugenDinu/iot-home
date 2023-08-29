import { Request as Req, Response as Res } from "express";
import { inspect } from "util";

export async function reqResLogger(req: Req, res: Res) {
  const end = new Promise(async (resolve, reject) => {
    // await new Promise((r) => setTimeout(r, 5000));
    const buf: Buffer[] = [];
    req.on("data", (d) => buf.push(d));
    const REQUEST = {
      method: req.method,
      headers: req.headers,
    };
    const RESPONSE = {
      headers: { ...res.getHeaders() },
    };
    req.on("end", () => {
      console.log(inspect({ REQUEST, RESPONSE }, { depth: 10 }));
      const data = Buffer.concat(buf).toString();
      const parsedData = JSON.parse(data);
      console.log({ data, parsedData });
      resolve(true);
    });
  });
  await end;
}
