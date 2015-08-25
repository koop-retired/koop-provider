/**
 * A provider constructor that validates options and enforces requirements.
 * required: name, version, model, controller, routes
 * optional: hosts, pattern
 * @class
 *
 * @param {object} options
 */
function Provider (options) {
  if (!(this instanceof Provider)) {
    return new Provider(options)
  }

  var requiredOptions = ['name', 'version', 'model', 'controller', 'routes']

  requiredOptions.forEach(function (option) {
    if (!options[option]) throw new Error('Missing required option: ' + option)
  })

  // mandatory
  this.type = 'provider'

  // required
  this.name = options.name
  this.version = options.version
  this.model = options.model
  this.controller = options.controller
  this.routes = options.routes

  // optional
  this.hosts = !!options.hosts
  this.pattern = options.pattern || null
}

module.exports = Provider
module.exports.createModel = require('./model')
module.exports.createController = require('./controller')
