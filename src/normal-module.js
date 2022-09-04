const path = require("path")
const babelTypes = require("babel-types")
const babelGenerate = require("babel-generator").default;
const babelTraverse = require("babel-traverse").default;
const neoAsync = require("neo-async").default;
const { runLoaders } = require("./loader-runner")

class NormalModule {

  constructor(data) {
    const { name,context,rawRequest,resource,parser,moduleId,async } = data
    this.moduleId = moduleId || `./${path.posix.relative(context,resource)}`
    this.name = name
    this.context = context
    this.rawRequest = rawRequest
    this.resource = resource
    this.parser = parser
    this.source = null
    this.ast = null
    this.dependencies = []
    this.blocks = []
    this.async = async
  }

  build(compilation,callback) {
    this.doBuild(compilation,err => {
      this.ast = this.parser.parse(this.source)
      babelTraverse(this.ast,{
        CallExpression: (nodePath) => {
          const node = nodePath.node
          if(node.callee.name === "require") {
            this.handlerRrequire(node,nodePath)
          } else if(node.callee.type === "Import") {
            this.handlerImport(node,nodePath)
          }
        }
      })
      const { code } = babelGenerate(this.ast)
      this.source = code
      neoAsync.forEach(this.blocks,(block,done) => {
        const { context,entry,name,async } = block
        compilation.addModuleChain(context,entry,name,async,done)
      },callback)
    })
  }

  getModuleParams(node) {
    let moduleName = node.arguments[0].value
    const extName = moduleName.split(path.posix.sep).pop().indexOf(".") === -1 ? ".js" : ""
    const depResource = path.posix.join(path.posix.dirname(this.resource),moduleName + extName)
    const depModuleId = `./${path.posix.relative(this.context,depResource)}`
    return {
      moduleName,
      extName,
      depResource,
      depModuleId
    }
  }

  handlerRrequire(node,nodePath) {
    node.callee.name = "__webpack_require__"
    let {  
      moduleName,
      depResource,
      depModuleId
    } = this.getModuleParams(node)
    if(!moduleName.startsWith(".")) {
      depResource = require.resolve(path.posix.join(this.context,"node_modules",moduleName))
      depResource = depResource.replace(/\\/g,"/")
      depModuleId = `.${depResource.slice(this.context.length)}`
    }
    node.arguments = [babelTypes.stringLiteral(depModuleId)]
    this.dependencies.push({
      name: this.name,
      context: this.context,
      rawRequest: moduleName,
      moduleId: depModuleId,
      resource: depResource,
    })
  }

  handlerImport(node,nodePath) {
    const {  
      depModuleId
    } = this.getModuleParams(node)
    let chunkName = "0"
    const leadingComments = node.arguments[0].leadingComments
    if(Array.isArray(leadingComments) && leadingComments.length > 0) {
      chunkName = /webpackChunkName:\s*['"]([^'"]+)['"]/.exec(leadingComments[0].value)[1]
    }
    
    nodePath.replaceWithSourceString(`
      __webpack_require__.e("${chunkName}")
      .then(__webpack_require__.t.bind(null,"${depModuleId}",7))
    `)

    this.blocks.push({
      context: this.context,
      entry: depModuleId,
      name: chunkName,
      async: true
    })
  }

  doBuild(compilation,callback) {
    this.getSource(compilation,(err,source) => {
      this.source = source
      callback()
    })
  }

  getSource(compilation,callback) {
    const { module } = compilation.compiler.options
    const { rules } = module
    let loaders = []
    for(let i = 0; i < rules.length; i++) {
      const rule = rules[i]
      if(rule.test.test(this.resource)) {
        loaders.push(...rule.use) 
      }
    }
    loaders = loaders.map((loader) => {
      const loaderPath = path.posix.join(this.context,"loaders",loader)
      return require.resolve(loaderPath)
    })
    if(loaders.length > 0) {
      runLoaders({
        resource: this.resource,
        loaders
      },(err,{ result }) => {
        callback(err,result.toString())
      })
    } else {
      const fs = compilation.compiler.inputFileSystem;
      fs.readFile(this.resource,"utf8",callback)
    }
  }

}

module.exports = NormalModule