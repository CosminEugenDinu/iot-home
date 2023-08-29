import { TCommandTree, help } from "../common_modules/cmd-explorer";
import { OsFakeCmdTree } from "./os.fake.cmd.tree";
import { OsNetCmdTree } from "./os.net.cmd.tree";

export const osMainCmdTree: TCommandTree = {
  help,
  fake: new OsFakeCmdTree(),
  net: new OsNetCmdTree(),
};
