const SingleEntryPlugin = require("./single-entry-plugin")

class MultipleEntryPlugin {

  constructor(context,entry) {
    this.context = context
    this.entry = entry
  }

  apply(compiler) {
    for(let entryName in this.entry) {
      const singleEntryPlugin = new SingleEntryPlugin(this.context,this.entry[entryName],entryName)
      singleEntryPlugin.apply(compiler)
    }
  }

}

module.exports = MultipleEntryPlugin