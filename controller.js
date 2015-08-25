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
 * shared logic for handling Feature Service requests
 * most providers will use this mehtod to figure out what request is being made
 *
 * @param {object} req
 * @param {object} res
 * @param {object} err
 * @param {object} data
 * @param {Function} callback
 */
function processFeatureServer (req, res, err, data, callback) {
  // TODO: why are we doing this here
  delete req.query.geometry

  if (err) return res.status(500).json(err)
  if (!data) return res.status(400).send('Missing data')

  // check for info requests and respond like ArcGIS Server would
  if (req._parsedUrl.pathname.substr(-4) === 'info') return res.status(200).send(arcServerInfo)

  // private function for handling data from featureServices methods
  function _handleFeatureData (err, data) {
    if (err) return res.status(400).send(err)

    // limit response to 1000
    if (data.features && data.features.length > 1000) {
      data.features = data.features.splice(0, 1000)
    }

    if (callback) return res.send(callback + '(' + JSON.stringify(data) + ')')

    res.json(data)
  }

  if (featureServices[req.params.layer]) {
    // requests for specific layers - pass data and the query string
    featureServices[req.params.layer](data, req.query || {}, _handleFeatureData)
  } else {
    // have a layer
    if (req.params.layer && data[req.params.layer]) {
      // pull out the layer data
      data = data[req.params.layer]
    } else if (req.params.layer && !data[req.params.layer]) {
      return res.status(404).send('Layer not found')
    }

    if (req.params.method && featureServices[req.params.method]) {
      // we have a method call like "/layers"
      featureServices[req.params.method](data, req.query || {}, _handleFeatureData)
    } else {
      // make a straight up feature service info request
      // we still pass the layer here to conform to info method, though its undefined
      featureServices.info(data, req.params.layer, req.query, function (err, d) {
        if (err) {
          if (callback) return callback(err)
          return res.status(500).send(err)
        }

        if (callback) return res.send(callback + '(' + JSON.stringify(d) + ')')

        res.json(d)
      })
    }
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
