
function isObject(obj) {
  return typeof obj === "object"
}

function isString(obj) {
  return typeof obj === "string"
}

module.exports = {
  isObject,
  isString
}