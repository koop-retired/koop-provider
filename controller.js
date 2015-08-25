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
 * @param {object} err - a possible error for some reason
 * @param {object} data - some data to process
 * @param {string} callback - (?) possibly name of client-side callback function for jsonp
 */
function processFeatureServer (req, res, err, data, callback) {
  // TODO: why are we doing this here
  delete req.query.geometry

  if (err) return res.status(500).json(err)
  if (!data) return res.status(400).send('Missing data')

  // check for info requests and respond like ArcGIS Server would
  var isInfoRequest = req._parsedUrl.pathname.substr(-4) === 'info'
  if (isInfoRequest) return res.status(200).send(arcServerInfo)

  var layer = req.params.layer
  var method = req.params.method
  var query = req.query

  // requests for specific layers - pass data and the query string
  if (featureServices[layer]) {
    return featureServices[layer](data, query || {}, _handleFeatureData)
  }

  if (layer) {
    // pull out the layer data
    if (data[layer]) data = data[layer]
    else return res.status(404).send('Layer not found')
  }

  // we have a method call like "/layers"
  if (method && featureServices[method]) {
    return featureServices[method](data, query || {}, _handleFeatureData)
  }

  // make a straight up feature service info request
  // we still pass the layer here to conform to info method, though it's undefined
  featureServices.info(data, layer, query, function (err, responseData) {
    if (err) {
      if (callback) return callback(err)
      return res.status(500).send(err)
    }

    if (callback) return res.send(callback + '(' + JSON.stringify(responseData) + ')')

    res.json(responseData)
  })

  // private function for handling data from featureServices methods
  function _handleFeatureData (err, featureData) {
    if (err) return res.status(400).send(err)

    // limit response to 1000
    var over1000 = featureData.features && featureData.features.length > 1000
    if (over1000) featureData.features = featureData.features.splice(0, 1000)

    if (callback) return res.send(callback + '(' + JSON.stringify(featureData) + ')')

    res.json(featureData)
  }
}

/**
 * A base controller that can be used as a prototype
 * contains helper methods to process complex query structures for request routing
 */
function controller () {
  return {
    processFeatureServer: processFeatureServer
  }
}

// expose for testing and to deprecate needless instantiation
controller.processFeatureServer = processFeatureServer

module.exports = controller
