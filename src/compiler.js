const { SyncBailHook,AsyncSeriesHook } = require("tapable")

class Compiler {

  constructor(options) {
    this.options = options
    this.context = options.context
    this.hooks = {
      entryOption: new SyncBailHook(["context","entry"]),
      done: new AsyncSeriesHook(["stats"]),
    }
  }

  run(callback) {



    callback && callback(null,{
      toJson() {
        return {
          entries: true,
          chunks: true,
          module: true,
          assets: true,
        }
      }
    })
  }

}

module.exports = Compiler