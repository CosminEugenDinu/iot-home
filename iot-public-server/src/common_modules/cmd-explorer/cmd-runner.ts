import { KArgFlag, TCommandExecutor, TCommandHelp, TCommandTree } from "./cmd.types";

export class CmdRunner {
  constructor(private readonly _cmdTree: TCommandTree) {}

  public async run(args: string[]) {
    const { executor, args: executorArgs = [] } = this._getExecutor(args) ?? {};
    if (executor) {
      if (executorArgs.includes(KArgFlag.HELP)) {
        if (executor?.canBeCalledWithHelp) {
          return await executor(executorArgs);
        }
        return { cmdlist: [] };
      }
      return await executor(executorArgs);
    }
  }

  private _getExecutor(args: string[]):
    | undefined
    | {
        executor: TCommandExecutor;
        args: string[];
      } {
    let commands: TCommandTree | undefined = this._cmdTree;
    let i = 0;
    while (commands && i < args.length) {
      const commandsOrExecutor: any = commands[args[i++]];
      if (typeof commandsOrExecutor === "function") {
        const executor = commandsOrExecutor.bind(commands);
        // copy canBeCalledWithHelp etc.
        Object.assign(executor, commandsOrExecutor);
        return {
          executor,
          args: args.slice(i),
        };
      }
      commands = commandsOrExecutor;
    }
  }
}

export function help(this: any) {
  return {
    cmdlist: Object.keys(this).filter((k) => k !== "help"),
  };
}

export function getCommandTree(this: any) {
  const cmdTreeMap = new Map();
  cmdTreeMap.set("help", help);
  const properties = Object.getOwnPropertyNames(this);
  for (const propName of properties) {
    if (!this.hasOwnProperty(propName)) continue;
    if ("_" === propName[0]) continue;
    if (["prototype", "name"].includes(propName)) continue;
    let executor = (this as any)[propName];
    if (executor?.excludeMe) continue;
    if (!executor?.includeMe) continue;
    if (typeof executor === "function") {
      cmdTreeMap.set(propName, helpWrapper(this, executor));
    }
  }
  return Object.fromEntries(cmdTreeMap.entries());
}

export class CmdRunnerBase {
  public static getCommandTree = getCommandTree;
}

function helpWrapper(caller: any, executor: TCommandExecutor) {
  const docs = caller?.docs ?? new Map();
  const decorated = (args: string[]) => {
    if (args.includes(KArgFlag.HELP)) {
      const canBeCalledWithHelp = docs.has(executor) || executor?.canBeCalledWithHelp;
      if (canBeCalledWithHelp) {
        return executor.call(caller, args);
      }
      return { cmdlist: [] };
    }
    return executor.call(caller, args);
  };
  return decorated;
}

export function defaultHelp(): TCommandHelp {
  return { cmdlist: ["-h"] };
}

export function cmdInclude({ help }: { help: boolean } = { help: false }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    target[propertyKey].includeMe = true;
    if (help) {
      target[propertyKey].canBeCalledWithHelp = true;
    }
  };
}

export class CmdTreeBase {
  public help() {
    const executorNames = new Set<string>();
    for (let o = this; o && o != Object.prototype; o = Object.getPrototypeOf(o)) {
      for (let name of Object.getOwnPropertyNames(o)) {
        const property = (this as any)[name];
        if (typeof property !== "function") continue;
        if (["constructor", "help"].includes(name)) continue;
        if (!property.includeMe) continue;
        executorNames.add(name);
      }
    }
    return { cmdlist: Array.from(executorNames) };
  }
}
