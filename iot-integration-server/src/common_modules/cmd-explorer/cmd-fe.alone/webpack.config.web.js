const path = require("path");
const fs = require("fs");
const { ProvidePlugin } = require("webpack");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const K = require("./src/CONST.json");

const production = process.env.NODE_ENV === "production";

const projectRootDir = path.resolve(__dirname);
const publicPath = path.join(K.mountPath, K.staticFilesRelPath);
const outputPath = path.join(projectRootDir, "dist/static");
const pageTitle = "SPA-SSR";
const favicon = path.join(projectRootDir, "src/favicon.ico");
const indexTemplate = path.join(projectRootDir, "src/index.ejs");

module.exports = {
  target: "web",
  name: "spa-fe",
  entry: {
    "spa-fe": path.join(projectRootDir, "src/index.tsx"),
  },
  mode: production ? "production" : "development",
  devtool: production ? undefined : "source-map",
  output: {
    path: outputPath,
    filename: production ? "[name].[contenthash].js" : "[name].js",
    publicPath,
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
        exclude: [path.join(projectRootDir, "src/scripts.ssr/")],
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                localIdentName: "[local]--[hash:base64:5]",
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jse?g|svg|gif)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              // outputPath: "img",
              publicPath,
              name: production ? "[name].[hash].[ext]" : "[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new ProvidePlugin({
      React: "react",
    }),
    new WebpackManifestPlugin(),
    new MiniCssExtractPlugin({
      filename: production ? "[name].[contenthash].css" : "[name].css",
    }),
    // workaround to preserver favicon.ico after second compile run: https://github.com/jantimon/html-webpack-plugin/issues/1639
    new CleanWebpackPlugin({
      cleanAfterEveryBuildPatterns: ["!**/favicon.ico"],
    }),
    new HtmlWebpackPlugin({
      template: indexTemplate,
      title: pageTitle,
      favicon,
      templateParameters: {
        publicPath,
        TITLE: pageTitle,
        SSR: "",
      },
    }),
  ],
};
