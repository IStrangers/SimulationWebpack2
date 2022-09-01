const { SyncHook } = require("tapable")
const neoAsync = require("neo-async")
const path = require("path")

class Compilation {

  constructor(compiler,params) {
    this.compiler = compiler
    this.params = params
    this.entries = []
    this.modules = []
    this.moduleMap = {}
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
    this.createModule({
      name,
      context,
      rawRequest: entry,
      parser: this.compiler.parser,
      resource: path.posix.join(context,entry),
    },entryModule => {
      this.entries.push(entryModule)
    },callback)
  }

  createModule(data,addEntry,callback) {
    const { normalModuleFactory } = this.params
    const entryModule = normalModuleFactory.create(data)
    this.moduleMap[entryModule.moduleId] = entryModule
    addEntry && addEntry(entryModule)
    this.modules.push(entryModule)
    
    const afterBuild = (err,module) => {
      if(module.dependencies.length > 0) {
        this.processModuleDependencies(module,err => {
          callback(err,module)
        })
      } else {
        callback(err,module)
      }
    }

    this.buildModule(entryModule,afterBuild)
  }

  buildModule(module,afterBuild) {
    module.build(this,err => {
      this.hooks.succeedModule.call(module)
      afterBuild(err,module)
    })
  }

  processModuleDependencies(module,callback) {
    const dependencies = module.dependencies
    neoAsync.forEach(dependencies,(dependency,done) => {
      const { name,context,rawRequest,resource,moduleId } = dependency
      this.createModule({
        name,
        context,
        rawRequest,
        parser: this.compiler.parser,
        resource,
        moduleId
      },null,callback)
    },callback)
  }

}

module.exports = Compilation