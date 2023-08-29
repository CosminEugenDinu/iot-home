import { cmdExpressMiddleware, TCommandTree } from "../../common_modules/cmd-explorer";
import { cmdDemoTree } from "./cmd-demo.tree";
import { traverseObject } from "../../common_modules/cmd-explorer/util/traverse-object";
import { ModuleBase } from "../../common_modules/module-base.class";
import { CmdTreeAppCommon } from "./cmd.common";

export class Cmd extends ModuleBase {
  public mainCmdTree: TCommandTree;
  constructor(
    private _config: {
      cmdFeStaticPath: string;
      cmdTree?: TCommandTree;
    }
  ) {
    super();
    this.mainCmdTree = this._config.cmdTree ?? cmdDemoTree;
  }

  async init() {
    // ensure app on cmdTree instances
    traverseObject(this.mainCmdTree, (subTree) => {
      let stopRecursion = false;
      if (subTree instanceof CmdTreeAppCommon) {
        subTree.app = this.app;
        stopRecursion = true;
      }
      return stopRecursion;
    });
    // mount cmd fe express middleware
    this.app.modules.httpServer.expressApp.use(
      cmdExpressMiddleware({
        cmdFeStaticPath: this._config.cmdFeStaticPath,
        cmdTree: this.mainCmdTree,
      })
    );
  }
}
