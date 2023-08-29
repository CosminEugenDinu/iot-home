import http from "http";
import path from "path";
import fs from "fs/promises";
import { CMD_URL_PATH } from "./cmd.const";

const mime: { [ext: string]: string } = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export async function serveStaticCmdUi(
  fileStaticPath: string,
  req: http.IncomingMessage,
  res: http.OutgoingMessage
): Promise<any> {
  const url = new URL(req?.url ?? "", `http://localhost`);
  const { pathname } = url;
  let { base, ext } = path.parse(pathname);
  const filename = ext ? base : ((ext = ".html"), "index.html");
  const searchedFile = path.join(fileStaticPath, filename);
  if (pathname.indexOf(CMD_URL_PATH + "/") > -1) {
    let file;
    try {
      file = await fs.open(searchedFile, "r");
    } catch (err) {
      res.end();
      return;
    }
    const content = await fs.readFile(file);
    res.setHeader("Content-Type", mime[ext] ?? "application/octet-stream");
    file?.close();
    res.end(content);
    return;
  }
  return;
}
