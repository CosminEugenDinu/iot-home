import http from "http";
import { CmdRunner } from "./cmd-runner";
import { CMD_URL_PATH } from "./cmd.const";
import { TCommandTree } from "./cmd.types";
import { serveStaticCmdUi } from "./cmd.ui";
import { serializeObject } from "./util";

export async function cmdCtrl(
  req: http.IncomingMessage,
  res: http.OutgoingMessage,
  cmdTree: TCommandTree,
  errVerb?: "v" | "vv"
): Promise<any> {
  const { pathname, searchParams } = new URL(req?.url ?? "", `http://localhost`);
  if (pathname !== CMD_URL_PATH) return;
  const args = JSON.parse(searchParams.get("args") ?? "[]");
  const cmd = new CmdRunner(cmdTree);
  let result;
  try {
    result = await cmd.run(args);
  } catch (err: any) {
    console.error(err);
    const name = err?.constructor?.name;
    const message = err?.message;
    const stack = err?.stack;
    if (errVerb === "v") {
      res.end(JSON.stringify({ name, message }));
    } else if (errVerb === "vv") {
      res.end(JSON.stringify({ name, message, stack }));
    }
  }
  res.end(serializeObject(result));
}

export function cmdExpressMiddleware(opts: { cmdFeStaticPath: string; cmdTree: TCommandTree }) {
  return async (req: http.IncomingMessage, res: http.OutgoingMessage) => {
    const forward = (await serveStaticCmdUi(opts.cmdFeStaticPath, req, res)) ?? (await cmdCtrl(req, res, opts.cmdTree));
    return forward;
  };
}
