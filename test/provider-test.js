var test = require('tape')
var Provider = require('../')
var requiredOptions = ['name', 'version', 'model', 'controller', 'routes']

function noop () {}

test('provider errors', function (t) {
  t.throws(Provider, /Missing options parameter/, 'throws error if no options')
  t.throws(function () { return new Provider({}) }, /Missing required option/, 'throws error if missing required option')
  t.end()
})

test('provider instantiation', function (t) {
  t.plan(7)

  var testOptions = {
    name: 'test',
    version: '0.0.0',
    model: noop,
    controller: noop,
    routes: noop
  }

  var testProvider = new Provider(testOptions)
  var noNewProvider = Provider(testOptions)

  t.ok(testProvider instanceof Provider, 'is instance of provider constructor')
  t.ok(noNewProvider instanceof Provider, 'works fine without new keyword')

  requiredOptions.forEach(function (option) {
    t.ok(testProvider[option] && noNewProvider[option], 'has required option: ' + option)
  })
})
