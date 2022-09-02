#!/usr/bin/env node

const webpack = require("../src/webpack.js")
const webpackConfigPath = process.cwd() + "/webpack.config.js"
const webpackOptions = require(webpackConfigPath)

webpack(webpackOptions,function(compiler) {
}).run(function(err,stats) {
  console.log(stats.toJson())
})