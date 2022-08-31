#!/usr/bin/env node
const webpack = require("../src/webpack.js")
webpack({
  context: {

  }
},function(compiler) {
  console.log(compiler)
})