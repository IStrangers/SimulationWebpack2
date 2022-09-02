const { SyncHook } = require("tapable")
const neoAsync = require("neo-async")
const path = require("path")
const Chunk = require("./chunk")
const ejs = require("ejs")
const fs = require("fs")
const mainTemplate = fs.readFileSync(path.join(__dirname,"templates","main.ejs"),"utf8")
let mainRender = ejs.compile(mainTemplate)

class Compilation {

  constructor(compiler,params) {
    this.compiler = compiler
    this.params = params
    this.entries = []
    this.modules = []
    this.moduleMap = {}
    this.chunks = []
    this.assets = {}
    this.files = []
    this.hooks = {
      succeedModule: new SyncHook(["module"]),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(["chunks"]),
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

  seal(callback) {
    const { seal,beforeChunks,afterChunks } = this.hooks
    seal.call()
    beforeChunks.call()
    for(const entryModule of this.entries) {
      const chunk = new Chunk(entryModule)
      this.chunks.push(chunk)
      chunk.modules = this.modules.filter(module => module.name === entryModule.name)
    }
    afterChunks.call(this.chunks)
    this.createChunkAssets()
    callback && callback()
  }

  createChunkAssets() {
    for(let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const entryModule = chunk.entryModule
      const file = entryModule.name + ".js"
      chunk.files.push(file)
      const source = mainRender({
        entryId: entryModule.moduleId,
        modules: chunk.modules
      })
      this.emitAssets(file,source)
    }
  }

  emitAssets(file,source) {
    this.assets[file] = source
    this.files.push(file)
  }

}

module.exports = Compilation