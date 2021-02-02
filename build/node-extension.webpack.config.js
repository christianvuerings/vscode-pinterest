//@ts-check

"use strict";

const path = require("path");
const webpack = require("webpack");

/**@type {import('webpack').Configuration}*/
const config = {
  target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')
  optimization: {
    // Do not minimize our code, not even in production because of https://github.com/node-fetch/node-fetch/issues/784
    minimize: false,
  },
  entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "..", "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  plugins: [
    new webpack.ContextReplacementPlugin(/^\.$/, (context) => {
      if (/\/node_modules\/keyv/.test(context.context)) {
        //ensure we're only doing this for modules we know about
        context.regExp = /this_should_never_exist/;
        for (const d of context.dependencies) {
          if (d.critical) {
            d.critical = false;
          }
        }
      }
    }),
  ],
  devtool: "nosources-source-map",
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
module.exports = config;
