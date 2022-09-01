
class NormalModule {

  constructor(data) {
    const { name,context,rawRequest,resource,parser } = data
    this.name = name
    this.context = context
    this.rawRequest = rawRequest
    this.resource = resource
    this.parser = parser
    this.source = null
    this.ast = null
  }

  build(compilation,callback) {
    this.doBuild(compilation,err => {
      this.ast = this.parser.parse(this.source)
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