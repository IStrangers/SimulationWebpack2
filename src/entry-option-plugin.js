const MultipleEntryPlugin = require("./multiple-entry-plugin")
const SingleEntryPlugin = require("./single-entry-plugin")
const { isObject } = require("./utils/common")

function itemToPlugin(context,entry,name) {
  if(isObject(entry)) {
    return new MultipleEntryPlugin(context,entry)
  }
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