import { TCommandTree, help } from "../common_modules/cmd-explorer";
import { SysFakeCmdTree } from "./sys.fake.cmd.tree";
import { SysNetCmdTree } from "./sys.net.cmd.tree";
import { SysResourcesCmdTree } from "./sys.resources.cmd.tree";

export const sysMainCmdTree: TCommandTree = {
  help,
  fake: new SysFakeCmdTree(),
  net: new SysNetCmdTree(),
  res: new SysResourcesCmdTree(),
};
