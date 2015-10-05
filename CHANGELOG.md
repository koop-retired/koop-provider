# koop-provider change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.0-alpha.3] - 2015-10-05

### Changed
* Now returning API error messages as `{ error: { code: <number>, message: <string> } }`
* `provider.createController()` renamed to `provider.controller()`
* `provider.createModel()` renamed to `provider.model()`
* `fieldType()` broken out of `feature-services.js` and `query.js` into `field-type.js`

### Removed
* no more `err` parameter in `controller.processFeatureServer`
  * errors should be handled before passing anything to this function

## [1.0.0-alpha.2] - 2015-09-11

### Changed
* Updates from koop upstream in `controller`, `lib/feature-services`, `lib/query`

### Removed
* no more `callback` parameter in `controller.processFeatureServer`
  * do not delete `req.query.callback` (this is used automatically by express's `res.jsonp` method)

## [1.0.0-alpha.1] - 2015-09-02

### Changed
* Provider constructor throws error with informative message if no options object is passed
* Pattern option only gets set if it's present

### Added
* Provider constructor tests

### Fixed
* Add missing `model.plugin` function
* Revert `model.finishExport` to version in koop 2.7

## 1.0.0-alpha
* alpha release


[1.0.0-alpha.3]: https://github.com/koopjs/koop-provider/compare/v1.0.0-alpha.1...v1.0.0-alpha.3
[1.0.0-alpha.2]: https://github.com/koopjs/koop-provider/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/koopjs/koop-provider/compare/v1.0.0-alpha...v1.0.0-alpha.1
