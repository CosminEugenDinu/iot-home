import "./setup.js";
import { join, dirname } from "path";
import { Cmd } from "./scripts-lib.js";

async function fakeList(args) {
  const { stdout, stderr } = await new Cmd().runShellScript({
    filepath: join(dirname(args[1]), "shell/wsl/fake-list.sh"),
  });
  if (stderr) console.error(stderr);
  return stdout;
}

fakeList(process.argv)
  .then(JSON.stringify)
  .then(console.log)
  .catch(console.error);
