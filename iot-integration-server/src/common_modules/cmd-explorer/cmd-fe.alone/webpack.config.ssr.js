const path = require("path");
const nodeExternals = require("webpack-node-externals");
const K = require("./src/CONST.json");
const { ProvidePlugin } = require("webpack");

const production = process.env.NODE_ENV === "production";

const projectRootDir = path.resolve(__dirname);
const publicPath = path.join(K.mountPath, K.staticFilesRelPath);
const outputPath = path.join(projectRootDir, "scripts.generated");

module.exports = {
  target: "node",
  name: "ssr",
  entry: {
    ssr: path.join(projectRootDir, "src/scripts.ssr/print-react-app-html.tsx"),
  },
  mode: "production",
  output: {
    path: outputPath,
    filename: "print-react-app-html.js",
    publicPath,
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"],
  },
  node: {
    __dirname: false,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig.json",
        },
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "css-loader",
            options: {
              modules: {
                exportOnlyLocals: true,
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
  ],
};
