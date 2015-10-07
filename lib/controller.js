var featureServices = require('./feature-services')
var arcServerInfo = {
  currentVersion: 10.21,
  fullVersion: '10.2.1',
  soapUrl: 'http://sampleserver6.arcgisonline.com/arcgis/services',
  secureSoapUrl: 'https://sampleserver6.arcgisonline.com/arcgis/services',
  authInfo: {
    isTokenBasedSecurity: true,
    tokenServicesUrl: 'https://sampleserver6.arcgisonline.com/arcgis/tokens/',
    shortLivedTokenValidity: 60
  }
}

/**
 * A base controller for koop providers.
 * Contains methods for handling API error responses and feature server requests.
 */
function baseController () {
  return Object.create(controller)
}

// controller prototype
var controller = {
  errorResponse: errorResponse,
  processFeatureServer: processFeatureServer
}

/**
 * Error response handler.
 *
 * @param {object} opts - code (default: 500), message (default: 'Internal Server Error'), *
 * @param {object} res - express response object
 */
function errorResponse (opts, res) {
  opts = opts || {}
  if (!opts.code) opts.code = 500
  if (!opts.message) opts.message = 'Internal Server Error'
  res.status(opts.code).jsonp({ error: opts })
}

/**
 * Shared logic for handling Feature Service requests.
 * Most providers will use this method to figure out what request is being made.
 *
 * @param {object} req - incoming server request
 * @param {object} res - outgoing server response
 * @param {object} data - some data to process
 */
function processFeatureServer (req, res, data) {
  // this is bad legacy code, leaving it here for now since it affects cache & query filtering
  delete req.query.geometry

  if (!data) return errorResponse({ code: 400, message: 'No data found' }, res)

  // check for info requests and respond like ArcGIS Server would
  // TODO: we should not be basing this off of a private express request variable
  var isInfoRequest = req._parsedUrl.pathname.substr(-4) === 'info'
  if (isInfoRequest) return res.jsonp(arcServerInfo)

  var layer = req.params.layer
  var method = req.params.method
  var query = req.query || {}

  // requests for specific layers - pass data and the query string
  if (featureServices[layer]) return featureServices[layer](data, query, _handleFeatureData)

  if (layer) {
    if (!data[layer]) return errorResponse({ code: 404, message: 'Layer not found' }, res)
    data = data[layer]
  }

  // we have a method call like "/layers"
  if (method && featureServices[method]) {
    return featureServices[method](data, query, _handleFeatureData)
  }

  // make a straight up feature service info request
  // we still pass the layer here to conform to info method, though it's undefined
  featureServices.info(data, layer, query, function (err, featureData) {
    if (err) return errorResponse({ code: 500, message: err.message }, res)
    res.jsonp(featureData)
  })

  /**
   * private function for handling data from featureServices methods
   *
   * @param {Error} err - error
   * @param {object} featureData - feature service data returned from featureServices method
   */
  function _handleFeatureData (err, featureData) {
    if (err) return errorResponse({ code: 400, message: err.message }, res)

    // limit response to 1000
    var over1000 = featureData.features && featureData.features.length > 1000
    if (over1000) featureData.features = featureData.features.splice(0, 1000)

    res.jsonp(featureData)
  }
}

module.exports = baseController
