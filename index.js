/**
 * A provider constructor that validates options and enforces requirements.
 * required: name, version, model, controller, routes
 * optional: hosts, pattern
 * @class
 *
 * @param {object} options
 */
function Provider (options) {
  if (!(this instanceof Provider)) return new Provider(options)
  if (!options) throw new Error('Missing options parameter')

  var requiredOptions = ['name', 'version', 'model', 'controller', 'routes']
  var missingOptions = []

  requiredOptions.forEach(function (option) {
    if (!options[option]) missingOptions.push(options)
  })

  if (missingOptions.length) {
    throw new Error('Missing required option(s): ' + missingOptions.join(', '))
  }

  // mandatory settings

  this.type = 'provider'

  // required settings

  this.name = options.name
  this.version = options.version
  this.model = options.model
  this.controller = options.controller
  this.routes = options.routes

  // optional settings

  // always set hosts
  this.hosts = !!options.hosts

  // only set pattern if it's there
  // TODO: document or deprecate
  if (options.pattern) this.pattern = options.pattern
}

module.exports = Provider
module.exports.model = require('./lib/model')
module.exports.controller = require('./lib/controller')
