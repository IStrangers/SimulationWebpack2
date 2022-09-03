const path = require("path")

module.exports = {
  mode: "development",
  devtool: false,
  context: process.cwd(),
  entry: {
    page1: "./src/index1.js",
    page2: "./src/index2.js",
  },
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: "main.js",
  }
}