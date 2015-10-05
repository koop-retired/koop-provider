var featureServices = require('./lib/feature-services')
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

  if (!data) {
    return res.status(400).jsonp({
      code: 400,
      message: 'No data found'
    })
  }

  // check for info requests and respond like ArcGIS Server would
  var isInfoRequest = req._parsedUrl.pathname.substr(-4) === 'info'
  if (isInfoRequest) return res.jsonp(arcServerInfo)

  var layer = req.params.layer
  var method = req.params.method
  var query = req.query || {}

  // requests for specific layers - pass data and the query string
  if (featureServices[layer]) return featureServices[layer](data, query, _handleFeatureData)

  if (layer) {
    if (!data[layer]) {
      return res.status(404).jsonp({
        code: 404,
        message: 'Layer not found'
      })
    }

    data = data[layer]
  }

  // we have a method call like "/layers"
  if (method && featureServices[method]) {
    return featureServices[method](data, query, _handleFeatureData)
  }

  // make a straight up feature service info request
  // we still pass the layer here to conform to info method, though it's undefined
  featureServices.info(data, layer, query, function (err, featureData) {
    if (err) {
      return res.status(500).jsonp({
        code: 500,
        message: err.message
      })
    }

    res.jsonp(featureData)
  })

  /**
   * private function for handling data from featureServices methods
   *
   * @param {Error} err - error
   * @param {object} featureData - feature service data returned from featureServices method
   */
  function _handleFeatureData (err, featureData) {
    if (err) {
      return res.status(400).jsonp({
        code: 400,
        message: err.message
      })
    }

    // limit response to 1000
    var over1000 = featureData.features && featureData.features.length > 1000
    if (over1000) featureData.features = featureData.features.splice(0, 1000)

    res.jsonp(featureData)
  }
}

/**
 * A base controller that can be used as a prototype.
 * Contains helper methods to process complex query structures for request routing.
 */
function controller () {
  return {
    processFeatureServer: processFeatureServer
  }
}

// expose for testing and to deprecate needless instantiation
controller.processFeatureServer = processFeatureServer

module.exports = controller
