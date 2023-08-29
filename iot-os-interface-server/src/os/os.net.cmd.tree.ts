import { cmdInclude } from "../common_modules/cmd-explorer";
import { OsCommonCmdTree } from "./os.common.cmd.tree";

export class OsNetCmdTree extends OsCommonCmdTree {
  @cmdInclude()
  async ping() {
    return { pong: true };
  }
}
