const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const projectRootDir = process.cwd();
const reactAppHtmlFilename = "react-app-html";
const reactAppHtmlPath = path.join(projectRootDir, ".generated", reactAppHtmlFilename);
const indexHtmlPath = path.join(projectRootDir, "dist/static", "index.html");

bundleSSR();

async function bundleSSR() {
  const reactAppHtml = await fs.promises.readFile(reactAppHtmlPath, "utf8");
  const indexHtml = await fs.promises.readFile(indexHtmlPath, "utf8");
  const ssrHtml = await injectHtml(indexHtml, reactAppHtml);
  await fs.promises.writeFile(indexHtmlPath, ssrHtml);
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
