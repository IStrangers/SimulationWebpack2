const path = require("path")

module.exports = {
  mode: "development",
  devtool: false,
  context: process.cwd(),
  entry: "./src/index1.js",
  output: {
    path: path.resolve(__dirname,"dist"),
    filename: "main.js",
  },
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [
          "style-loader",
          "less-loader"
        ]
      }
    ]
  }
}