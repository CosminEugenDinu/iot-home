import { KArgFlag } from "../cmd.types";

export class Arg {
  private _flags: Map<string, number | undefined> = new Map();
  private _dashedWithValue: Map<string, string[]> = new Map();
  private _full = new Map<string, [number]>();
  constructor(public args: string[]) {
    for (let i = 0; i < args.length; i++) {
      const fullArg = args[i];
      const fullArgCount = this._full.get(fullArg);
      if (fullArgCount) {
        fullArgCount[0]++;
      } else {
        this._full.set(fullArg, [1]);
      }
      const argIndex = i;
      if (fullArg[0] === "-") {
        const [dashArg, currValue] = fullArg.split("=");
        if (currValue) {
          const prevValue = this._dashedWithValue.get(dashArg);
          if (!prevValue) {
            this._dashedWithValue.set(dashArg, [currValue]);
          } else {
            prevValue.push(currValue);
          }
          continue;
        }
        this._flags.set(dashArg, argIndex);
        continue;
      }
      this._flags.set(fullArg, argIndex);
    }
  }

  /**
   * @deprecated
   */
  public getDashed(argName: string) {
    const rawValue = this._dashedWithValue.get(argName);
    if (Array.isArray(rawValue)) {
      return rawValue.map((v) => JSON.parse(v));
    }
    return JSON.parse(rawValue ?? "");
  }

  public get(argName: string): any {
    if (argName[0] === "-") {
      return this._dashedWithValue.get(argName);
    }
    return this._flags.get(argName);
  }
  public getHelpIndex() {
    return this._flags.get(KArgFlag.HELP);
  }
  public getLastArgName() {
    const lastOne = this.getLastArgFull();
    if (lastOne[0] === "-") {
      return lastOne.split("=")[0];
    }
    return lastOne;
  }
  public getLastArgFull() {
    return this.args[this.args.length - 1];
  }
  public getLast() {
    return this.args[this.args.length - 1];
  }
  public helpFirst() {
    console.log(this._flags);
    return this.getHelpIndex() === 0;
  }
  public hasFull(arg: string) {
    return this._full.has(arg);
  }
  public has(arg: string) {
    return this._full.has(arg);
  }
  public hasName(argName: string) {
    return this._flags.has(argName) || this._dashedWithValue.has(argName);
  }
  public hasHelp() {
    return this._flags.has(KArgFlag.HELP);
  }
  private _getArgFullNeedHelp() {
    const helpIndex = this.getHelpIndex() ?? -1;
    if (helpIndex > -1) {
      return this.args[helpIndex - 1] ?? " ";
    }
  }
  public getArgNeedHelp() {
    const argFullThatNeedHelp = this._getArgFullNeedHelp();
    if (!argFullThatNeedHelp) return;
    const [name, value] = argFullThatNeedHelp.split("=");
    return { name, value };
  }
  /**
   *
   * @deprecated
   */
  public getArgValue(dashedArgName: string) {
    const value = this._dashedWithValue.get(dashedArgName);
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }

  public getValueOf(dashedArgName: string) {
    return (this._dashedWithValue.get(dashedArgName) ?? [])[0];
  }

  public getListValueOf(dashedArgName: string) {
    return this._dashedWithValue.get(dashedArgName) ?? [];
  }

  /**
   *
   * @deprecated use has("-n") instead
   */
  public hasDryRun() {
    return this._flags.has(KArgFlag.DRY_RUN);
  }
  public hasCache() {
    return this._flags.has(KArgFlag.CACHE);
  }
}
