import { Arg, cmdInclude, CmdTreeBase } from "../../common_modules/cmd-explorer";

export class FakeCmdTree extends CmdTreeBase {
  @cmdInclude()
  async isReallyFake() {
    return { response: "yes" };
  }

  @cmdInclude({ help: true })
  async getFakeHelp() {
    const A = new Arg(arguments[0]);
    const argNeedHelp = A.getArgNeedHelp();
    if (argNeedHelp) {
      return {
        // root function help
        " ": { cmdlist: ["--input=", "-n"] },
        // -n is shown on pressing tab after --input=5
        "--input": { cmdlist: ["-n"] },
      }[argNeedHelp.name];
    }

    const input = A.getValueOf("--input");
    const dryRun = A.hasName("-n");
    if (dryRun) {
      return { input };
    }

    return { input };
  }
}
