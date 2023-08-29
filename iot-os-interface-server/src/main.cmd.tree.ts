import { cmdDemoTree } from "./app_modules/cmd/cmd-demo.tree";
import { TCommandTree, help } from "./common_modules/cmd-explorer";
import { osMainCmdTree } from "./os/os.main.cmd.tree";

export const mainCmdTree: TCommandTree = {
  help,
  ping: async (args: string[]) => ({ pong: true }),
  demo: cmdDemoTree,
  os: osMainCmdTree,
};
