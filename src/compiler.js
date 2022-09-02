const { SyncHook,SyncBailHook,AsyncSeriesHook,AsyncParallelHook } = require("tapable")
const Compilation = require("./compilation")
const NormalModuleFactory = require("./normal-module-factory")
const Parser = require("./parser")
const Stats = require("./stats")
const path = require("path")
const mkdirp = require("mkdirp")

class Compiler {

  constructor(options) {
    this.options = options
    this.context = options.context
    this.hooks = {
      entryOption: new SyncBailHook(["context","entry"]),
      beforeRun: new AsyncSeriesHook(["compiler"]),
      run: new AsyncSeriesHook(["compiler"]),
      beforeCompile: new AsyncSeriesHook(["params"]),
      compile: new SyncHook(["params"]),
      make: new AsyncParallelHook(["compilation"]),
      thisCompilation: new SyncHook(["compilation","params"]),
      compilation: new SyncHook(["compilation","params"]),
      afterCompile: new AsyncSeriesHook(["compilation"]),
      emit: new AsyncSeriesHook(["compilation"]),
      done: new AsyncSeriesHook(["stats"]),
    }
    this.parser = new Parser()
    this.running = false
  }

  run(callback) {
    const { beforeRun,run,done } = this.hooks

    const onCompiled = (err,compilation) => {
      this.emitAssets(compilation,err => {
        const stats = new Stats(compilation)
        done.callAsync(stats,err => {
          callback && callback(err,stats)
        })
      })
    }

    this.running = true

    
    beforeRun.callAsync(this,err => {
      run.callAsync(this,err => {
        this.compile(onCompiled)
      })
    })

  }

  compile(callback) {
    const params = this.newCompilationParams()
    const { beforeCompile,compile,make,afterCompile } = this.hooks
    beforeCompile.callAsync(params, err => {
      compile.call(params)
      const compilation = this.newCompilation(params)
      make.callAsync(compilation,err => {
        compilation.seal(err => {
          afterCompile.callAsync(compilation,err => {
            callback && callback(err,compilation)
          })
        })
      })
    })
  }

  newCompilationParams() {
    const params = {
      normalModuleFactory: new NormalModuleFactory()
    }
    return params
  }

  newCompilation(params) {
    const newCompilation = this.createCompilation(params)
    const { thisCompilation,compilation } = this.hooks
    thisCompilation.call(newCompilation,params)
    compilation.call(newCompilation,params)
    return newCompilation
  }

  createCompilation(params) {
    return new Compilation(this,params)
  }

  emitAssets(compilation,callback) {
    const { emit } = this.hooks
    const outputPath = this.options.output.path
    emit.callAsync(compilation,() => {
      mkdirp(outputPath).then(() => {
        const assets = compilation.assets
        for(let file in assets) {
          const source = assets[file]
          const targetPath = path.posix.join(outputPath,file)
          this.outputFileSystem.writeFileSync(targetPath,source,"utf8")
        }
        callback && callback()
      })
    })
  }

}

module.exports = Compiler