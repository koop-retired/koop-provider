# koop-provider change log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [1.0.0-alpha.2] - 2015-09-11

### Changed
* Updates from koop upstream in `controller`, `lib/feature-services`, `lib/query`

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


[1.0.0-alpha.2]: https://github.com/koopjs/koop-provider/compare/v1.0.0-alpha.1...v1.0.0-alpha.2
[1.0.0-alpha.1]: https://github.com/koopjs/koop-provider/compare/v1.0.0-alpha...v1.0.0-alpha.1
