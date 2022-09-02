const Compiler = require("./compiler")
const NodeEnvironmentPlugin = require("./node/node-environment-plugin")
const WebpackOptionsApply = require("./webpack-options-apply")

function webpack(options) {
  const { plugins } = options
  const compiler = new Compiler(options)
  const nodeEnvironmentPlugin = new NodeEnvironmentPlugin()
  nodeEnvironmentPlugin.apply(compiler)
  if(plugins && Array.isArray(plugins)) {
    for(const plugin of plugins) {
      plugin.apply(compiler)
    }
  }
  const webpackOptionsApply = new WebpackOptionsApply()
  webpackOptionsApply.process(compiler)
  return compiler
}

module.exports = webpack