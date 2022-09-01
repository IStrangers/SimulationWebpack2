const { SyncHook } = require("tapable")
const path = require("path")

class Compilation {

  constructor(compiler,params) {
    this.compiler = compiler
    this.params = params
    this.entries = []
    this.modules = []
    this.hooks = {
      succeedModule: new SyncHook(["module"])
    }
  }

  addEntry(context,entry,name,callback) {
    this.addModuleChain(context,entry,name,(err,module) => {
      callback(err,module)
    })
  }

  addModuleChain(context,entry,name,callback) {
    const { normalModuleFactory } = this.params
    const entryModule = normalModuleFactory.create({
      name,
      context: this.compiler.context,
      rawRequest: entry,
      resource: path.posix.join(context,entry),
      parser: this.compiler.parser,
    })
    this.entries.push(entryModule)
    this.modules.push(entryModule)

    function afterBuild(err) {
      return callback(err,entryModule)
    }

    this.buildModule(entryModule,afterBuild)
  }

  buildModule(module,afterBuild) {
    module.build(this,err => {
      this.hooks.succeedModule.call(module)
      afterBuild(err)
    })
  }

}

module.exports = Compilation