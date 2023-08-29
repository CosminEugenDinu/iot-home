import { cmdDemoTree } from "./app_modules/cmd/cmd-demo.tree";
import { TCommandTree, help } from "./common_modules/cmd-explorer";
import { devMainCmdTree } from "./device/device.main.cmd.tree";
import { sysMainCmdTree } from "./system/sys.main.cmd.tree";

export const mainCmdTree: TCommandTree = {
  help,
  ping: async (args: string[]) => ({ pong: true }),
  demo: cmdDemoTree,
  sys: sysMainCmdTree,
  dev: devMainCmdTree,
};
