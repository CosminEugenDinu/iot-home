import { TApp } from "..";

export abstract class ModuleBase {
  public app!: TApp;
  abstract init(app?: TApp): Promise<any>;
}
