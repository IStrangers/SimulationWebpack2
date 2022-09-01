const NormalModule = require("./normal-module")

class NormalModuleFactory {

  constructor() {

  }

  create(data) {
    return new NormalModule(data)
  }

}

module.exports = NormalModuleFactory