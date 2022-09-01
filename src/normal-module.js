const path = require("path")
const babelTypes = require("babel-types")
const babelGenerate = require("babel-generator").default;
const babelTraverse = require("babel-traverse").default;

class NormalModule {

  constructor(data) {
    const { name,context,rawRequest,resource,parser,moduleId } = data
    this.moduleId = moduleId || `./${path.posix.relative(context,resource)}`
    this.name = name
    this.context = context
    this.rawRequest = rawRequest
    this.resource = resource
    this.parser = parser
    this.source = null
    this.ast = null
    this.dependencies = []
  }

  build(compilation,callback) {
    this.doBuild(compilation,err => {
      this.ast = this.parser.parse(this.source)
      babelTraverse(this.ast,{
        CallExpression: (nodePath) => {
          const node = nodePath.node
          if(node.callee.name === "require") {
            node.callee.name = "__webpack_require__"
            let moduleName = node.arguments[0].value
            const extName = moduleName.split(path.posix.sep).pop().indexOf(".") === -1 ? ".js" : ""
            moduleName += extName
            const depResource = path.posix.join(path.posix.dirname(this.resource),moduleName)
            const depModuleId = `./${path.posix.relative(this.context,depResource)}`
            node.arguments = [babelTypes.stringLiteral(depModuleId)]
            this.dependencies.push({
              name: this.name,
              context: this.context,
              rawRequest: moduleName,
              moduleId: depModuleId,
              resource: depResource,
            })
          }
        }
      })
      const { code } = babelGenerate(this.ast)
      this.source = code
      callback()
    })
  }

  doBuild(compilation,callback) {
    this.getSource(compilation,(err,source) => {
      this.source = source
      callback()
    })
  }

  getSource(compilation,callback) {
    const fs = compilation.compiler.inputFileSystem;
    fs.readFile(this.resource,"utf8",callback)
  }

}

module.exports = NormalModule