const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const webpack = require("webpack");
const webpackConfigWeb = require("./webpack.config.web.js");
const webpackConfigSSR = require("./webpack.config.ssr.js");
const { JSDOM } = require("jsdom");

const projectRootDir = path.resolve(__dirname);
const reactAppHtmlFilename = "react-app-html";
const reactAppHtmlPath = path.join(projectRootDir, ".generated", reactAppHtmlFilename);
const printReactAppHtmlScriptName = "print-react-app-html.js";
const printReactAppHtmlScriptPath = path.join(projectRootDir, "scripts.generated", printReactAppHtmlScriptName);
const indexHtmlPath = path.join(projectRootDir, "dist/static", "index.html");

main();

async function main() {
  const compiler = webpack([webpackConfigSSR, webpackConfigWeb]);

  compiler.hooks.watchRun.tap("Dev", (compiler) => {
    console.log(`Compiling ${compiler.name} ...`);
  });

  compiler.watch({}, async (err, stats) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(stats?.toString("minimal"));
    const compiledSuccessfully = !stats?.hasErrors();
    console.log({ compilerName: compiler.name, compiledSuccessfully });
    // compilation done
    if (compiledSuccessfully) {
      try {
        const reactAppHtml = await getReactAppHtml(printReactAppHtmlScriptPath);
        saveReactAppHtml(reactAppHtmlPath, reactAppHtml);
        const indexHtml = await fs.promises.readFile(indexHtmlPath, "utf8");
        const ssrHtml = await injectHtml(indexHtml, reactAppHtml);
        fs.promises.writeFile(indexHtmlPath, ssrHtml);
      } catch (error) {
        console.error(error);
      }
    }
  });
}

async function injectHtml(targetHtml, sourceHtml) {
  const dom = new JSDOM(targetHtml);
  const document = dom.window.document;
  const rootDiv = document.getElementById("root");
  rootDiv.innerHTML = sourceHtml;
  const injectedHtml = dom.serialize();
  dom.window.close();
  return injectedHtml;
}

async function saveReactAppHtml(reactAppHtmlPath, reactAppHtml) {
  await fs.promises.writeFile(reactAppHtmlPath, reactAppHtml, "utf8");
  console.log(`Written file: ${reactAppHtmlPath}`);
}

async function getReactAppHtml(printReactAppHtmlScriptPath) {
  return new Promise((resolve, reject) => {
    exec(`node ${printReactAppHtmlScriptPath}`, (error, stdout, stderr) => {
      if (error) reject(error);
      if (stderr) console.error(stderr);
      return resolve(stdout);
    });
  });
}
