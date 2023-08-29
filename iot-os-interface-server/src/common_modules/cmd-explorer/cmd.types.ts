export type TPrimitive = bigint | boolean | null | number | string | symbol | undefined;

export type TPlainObject = { [key: string]: TPrimitive | TPlainObject };

export type TCommandHelp = { descr?: string; cmdlist: string[] };

export type TCommandExecutorResult = {
  result?: any;
  // result of calling with help
  cmdlist?: string[];
};

export type TCommandExecutor = {
  (args: string[]): TCommandExecutorResult | Promise<TCommandExecutorResult>;
  canBeCalledWithHelp?: boolean;
  excludeMe?: boolean;
};
export type TCommandHelpExecutor = () => TCommandHelp;

export type TCommandTree = {
  [key: string]: TCommandTree | TCommandExecutor | TCommandHelpExecutor | any;
} & { help: TCommandHelpExecutor };

export type TDocsMap = Map<TCommandExecutor, TCommandHelp>;

export type TExecutorsClass = Function & { docs: TDocsMap };

export enum KArgFlag {
  HELP = "help",
  DRY_RUN = "-n",
  CACHE = "-c",
}

export type TCmdArgHelper = { [key: string]: { cmdlist: string[] } };

// export type TCmdExecutorResult = {
//   result?: any;
//   cmdlist?: string[];
// };
