function Provider (options) {
  if (!(this instanceof Provider)) {
    return new Provider(options)
  }

  if (!options.name) throw new Error('missing name')
  if (!options.model) throw new Error('missing model')
  if (!options.controller) throw new Error('missing controller')
  if (!options.routes) throw new Error('missing routes')
  if (!options.version) throw new Error('missing version')

  this.type = 'provider'
  this.name = options.name
  this.hosts = !!options.hosts
  this.pattern = options.pattern || null
  this.model = options.model
  this.controller = options.controller
  this.routes = options.routes
  this.version = options.version
}

module.exports = Provider
module.exports.createModel = require('./model')
module.exports.createController = require('./controller')
