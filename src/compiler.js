const { SyncHook,SyncBailHook,AsyncSeriesHook,AsyncParallelHook } = require("tapable")
const Compilation = require("./compilation")
const NormalModuleFactory = require("./normal-module-factory")

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
      done: new AsyncSeriesHook(["stats"]),
    }
    this.running = false
  }

  run(callback) {

    function finalCallback(err,stats) {
      callback && callback(err,stats)
    }

    function onCompiled(err,compilation) {
      finalCallback(err,{
        entries: true,
        chunks: true,
        module: true,
        assets: true,
      })
    }

    this.running = true

    const { beforeRun,run } = this.hooks
    beforeRun.callAsync(this,err => {
      run.callAsync(this,err => {
        this.compile(onCompiled)
      })
    })

  }

  compile(callback) {
    const params = this.newCompilationParams()
    const { beforeCompile,compile,make } = this.hooks
    beforeCompile.callAsync(params, err => {
      compile.call(params)
      const compilation = this.newCompilation(params)
      make.callAsync(compilation,err => {
        callback && callback()
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
    const newCompilation = this.createCompilation()
    const { thisCompilation,compilation } = this.hooks
    thisCompilation.call(newCompilation,params)
    compilation.call(newCompilation,params)
    return newCompilation
  }

  createCompilation() {
    return new Compilation(this)
  }

}

module.exports = Compiler