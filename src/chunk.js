
class Chunk {

  constructor(entryModule) {
    this.entryModule = entryModule
    this.files = []
    this.modules = []
  }

}

module.exports = Chunk