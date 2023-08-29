export class App<M extends object> {
  constructor(public modules: M) {}
  public async init() {
    await this.initModules();
  }
  private async initModules() {
    const appModuleNames = Object.keys(this.modules);
    for (const moduleAs of appModuleNames) {
      const appModule = this.modules[moduleAs];
      appModule.app = this;
      const moduleName = appModule.constructor.name;
      try {
        await appModule.init();
      } catch (err) {
        console.error(err);
        throw new Error(
          `Failed to init module ${moduleName} as ${moduleAs}: ${err}`
        );
      }
    }
  }
}
