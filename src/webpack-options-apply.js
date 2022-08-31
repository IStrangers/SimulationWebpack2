const EntryOptionPlugin = require("./entry-option-plugin.js")

class WebpackOptionsApply {

  constructor() {

  }

  process(compiler) {
    const { options,context,hooks } = compiler
    const entryOptionPlugin = new EntryOptionPlugin()
    entryOptionPlugin.apply(compiler)
    hooks.entryOption.call(context,options.entry)
  }

}

module.exports = WebpackOptionsApply