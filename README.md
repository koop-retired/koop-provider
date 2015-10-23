# koop-provider

> Koop provider toolkit

[![npm][npm-image]][npm-url]
[![travis][travis-image]][travis-url]

[npm-image]: https://img.shields.io/npm/v/koop-provider.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/koop-provider
[travis-image]: https://img.shields.io/travis/koopjs/koop-provider.svg?style=flat-square
[travis-url]: https://travis-ci.org/koopjs/koop-provider

Use this to create a provider module for [Koop](https://github.com/koopjs/koop).

## Install

```
npm install -S koop-provider
```

## Usage

Provides methods for creating koop providers, models, and controllers.

### `provider(options)`

To create a koop provider:

```js
var pkg = require('./package')
var provider = require('koop-provider')

var myProvider = provider({
  name: 'providerName',
  version: pkg.version,
  model: require('./model'),
  controller: require('./controller'),
  routes: require('./routes')
})

module.exports = myProvider
```

A type of `'provider'` is automatically set (cannot be overridden).

Required settings:

* `name`: provider name
* `version`: provider version (from package.json)
* `model`: provider model method
* `controller`: provider controller method
* `routes`: provider routes module

Optional settings:

* `hosts`: boolean flag indicating whether or not this provider supports multiple instances (e.g. socrata data can be hosted in many socrata instances, github gist data is always on gist.github.com)

### `provider.model(koop)`

To create a model:

```js
var provider = require('koop-provider')

/**
 * creates new model with access to koop instance
 *
 * @param {Object} koop - instance of koop app
 */
function myModel (koop) {
  var model = provider.model(koop)
  var TABLE_NAME = 'my_table'

  model.config = koop.config

  // model methods, e.g.

  /**
   * Method for retrieving data by ID.
   *
   * @param {object} options - id (required), query (optional)
   * @param {function} callback - err, geojson
   */
  model.find = function (options, callback) {
    var id = options.id
    var query = options.query || {}

    koop.Cache.get(TABLE_NAME, id, query, function (err, entry) {
      if (!err) return callback(null, entry)

      // retrieve data, insert into cache, fire callback with `(err, geojson)`
    })
  }

  return model
}

module.exports = myModel
```

Methods inherited from base model:

* `log`
* `files`
* `cacheDir`
* `exportToFormat`
* `exportLarge`
* `exportFile`
* `finishExport`
* `parseSpatialReference`
* `tileGet`
* `plugin`
* `generateThumbnail`
* `getImageServiceTile`
* `getServiceTile`
* `getGeoHash`
* `saveFile`
* `getCount`
* `getExtent`

### `provider.controller()`

To create a controller:

```js
var provider = require('koop-provider')

/**
 * creates new controller
 *
 * @param {object} model - instance of model
 */
function myController (model) {
  var ctrl = provider.controller()

  // controller methods, e.g.

  /**
   * renders index view
   *
   * @param {object} req - incoming request object
   * @param {object} res - outgoing response object
   */
  ctrl.index = function (req, res) {
    res.render(__dirname + '/../views/index', {
      baseUrl: req.baseUrl
    })
  }

  return ctrl
}

module.exports = myController
```

Methods inherited from base controller:

* `errorResponse`
* `processFeatureServer`

### Routes

The routes file in a koop provider maps http verbs and routes to controller methods.

Example from [`koop-gist`](https://github.com/koopjs/koop-gist):

```js
module.exports = {
  'get /gist': 'index',
  'get /gist/rate_limit': 'rate_limit',
  'get /gist/raw/:id': 'find',
  'get /gist/raw/:id/:layer': 'find',
  'get /gist/:id': 'find',
  'get /gist/:id.:format': 'find',
  'get /gist/:id/preview': 'preview',
  'get /gist/:id/FeatureServer': 'featureservice',
  'get /gist/:id/FeatureServer/:layer': 'featureservice',
  'get /gist/:id/FeatureServer/:layer/:method': 'featureservice'
}
```

## Test

`koop-provider` uses [tape](https://github.com/substack/tape) for testing.

```
npm test
```

## License

[Apache 2.0](LICENSE)
