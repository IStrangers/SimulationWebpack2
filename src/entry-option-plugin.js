const SingleEntryPlugin = require("./single-entry-plugin")

function itemToPlugin(context,entry,name) {
  return new SingleEntryPlugin(context,entry,name)
}

class EntryOptionPlugin {

  constructor() {

  }

  apply(compiler) {
    const { hooks } = compiler
    hooks.entryOption.tap("EntryOptionPlugin",(context,entry) => {
      itemToPlugin(context,entry,"main").apply(compiler)
    })
  }

}

module.exports = EntryOptionPlugin