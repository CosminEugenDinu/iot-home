import { cmdDemoTree } from "./app_modules/cmd/cmd-demo.tree";
import { TCommandTree, help } from "./common_modules/cmd-explorer";

export const mainCmdTree: TCommandTree = {
  help,
  ping: async (args: string[]) => ({ pong: true }),
  demo: cmdDemoTree,
};
