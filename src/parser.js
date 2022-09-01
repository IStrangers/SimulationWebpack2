const babylon = require("babylon")

class Parser {

  constructor() {

  }

  parse(source) {
    return babylon.parse(source,{
      sourceType: "module",
      plugins: ["dynamicImport"]
    })
  }

}

module.exports = Parser