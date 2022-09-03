const { SyncHook } = require("tapable")
const neoAsync = require("neo-async")
const path = require("path")
const Chunk = require("./chunk")
const ejs = require("ejs")
const fs = require("fs")
const mainTemplate = fs.readFileSync(path.join(__dirname,"templates","defer-main.ejs"),"utf8")
let mainRender = ejs.compile(mainTemplate)
const chunkTemplate = fs.readFileSync(path.join(__dirname,"templates","chunk.ejs"),"utf8")
let chunkRender = ejs.compile(chunkTemplate)

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
    this.vendors = []
    this.commons = []
    this.moduleRefCountMap = {}
    this.hooks = {
      succeedModule: new SyncHook(["module"]),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(["chunks"]),
    }
  }

  addEntry(context,entry,name,callback) {
    this.addModuleChain(context,entry,name,false,(err,module) => {
      callback(err,module)
    })
  }

  addModuleChain(context,entry,name,async,callback) {
    this.createModule({
      name,
      context,
      rawRequest: entry,
      parser: this.compiler.parser,
      resource: path.posix.join(context,entry),
      async
    },entryModule => {
      this.entries.push(entryModule)
    },callback)
  }

  createModule(data,addEntry,callback) {
    const { normalModuleFactory } = this.params
    const entryModule = normalModuleFactory.create(data)
    addEntry && addEntry(entryModule)
    this.moduleMap[entryModule.moduleId] = entryModule
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

    for(const module of this.modules) {
      const { moduleId } = module
      if(/node_modules/.test(moduleId)) {
        module.name = "vendors"
        if(!this.vendors.find(item => item.moduleId === module.moduleId)) {
          this.vendors.push(module)
        }
        continue
      } 
      const moduleRef = this.moduleRefCountMap[moduleId]
      if(moduleRef) {
        this.moduleRefCountMap[moduleId].count++
      } else {
        this.moduleRefCountMap[moduleId] = {module,count: 1}
      }
    }
    for(const moduleId in this.moduleRefCountMap) {
      const { module,count } = this.moduleRefCountMap[moduleId]
      if(count >= 2) {
        module.name = "commons"
        this.commons.push(module)
      }
    }
    const deferrenModuleIds = [...this.vendors,...this.commons].map(module => module.moduleId)
    this.modules = this.modules.filter(module => !deferrenModuleIds.includes(module.moduleId))
    
    for(const entryModule of this.entries) {
      const chunk = new Chunk(entryModule)
      this.chunks.push(chunk)
      chunk.modules = this.modules.filter(module => module.name === entryModule.name)
    }

    if(this.vendors.length > 0) {
      const chunk = new Chunk(this.vendors[0])
      chunk.entryModule.async = true
      this.chunks.push(chunk)
      chunk.modules = this.vendors
    }

    if(this.commons.length > 0) {
      const chunk = new Chunk(this.commons[0])
      chunk.entryModule.async = true
      this.chunks.push(chunk)
      chunk.modules = this.commons
    }

    afterChunks.call(this.chunks)
    this.createChunkAssets()
    callback && callback()
  }

  createChunkAssets() {
    for(let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]
      const { name,moduleId,async } = chunk.entryModule
      const file = name + ".js"
      chunk.files.push(file)
      const deferredChunks = []
      if(this.vendors.length > 0) {
        deferredChunks.push("vendors")
      }
      if(this.commons.length > 0) {
        deferredChunks.push("commons")
      }
      const data = {
        entryId: async ? name : moduleId,
        modules: chunk.modules,
        deferredChunks
      }
      const source = async ? chunkRender(data) : mainRender(data)
      this.emitAssets(file,source)
    }
  }

  emitAssets(file,source) {
    this.assets[file] = source
    this.files.push(file)
  }

}

module.exports = Compilation