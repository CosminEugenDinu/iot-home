import "./setup.js";
import path, { dirname } from "path";
import { getHostAlias, Machine, parseCmdArgs } from "./scripts-lib.js";

(async function cpuTemperature(cmdArgs) {
  const { filepath, args } = parseCmdArgs(cmdArgs);
  const hostAlias = await getHostAlias();
  const shellScriptsDir = path.join(dirname(filepath), `shell/${hostAlias}`);

  return new Machine({
    shellScriptsDir,
  }).getCpuTemperature();
})(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
