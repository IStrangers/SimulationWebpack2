const path = require("path")

module.exports = {
  mode: "development",
  devtool: false,
  context: "",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: "main.js"
  }
}