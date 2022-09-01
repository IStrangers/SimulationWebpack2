#!/usr/bin/env node

const webpack = require("../src/webpack.js")
const webpackConfigPath = process.cwd() + "/webpack.config.js"
console.log(webpackConfigPath)
const webpackOptions = require(webpackConfigPath)

webpack(webpackOptions,function(compiler) {
  //console.log(compiler)
}).run(function(err,stats) {
  console.log(err,stats)
})