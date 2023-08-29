import { TCommandTree, help } from "../../common_modules/cmd-explorer";
import { FakeCmdTree } from "./cmd-fake.class.tree";

export const cmdDemoTree: TCommandTree = {
  help,
  ping: {
    help,
    pong: {
      help,
      ping: async (args: string[]) => ({ pong: true }),
    },
  },
  fake: new FakeCmdTree(),
};
