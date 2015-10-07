var test = require('tape')
var ctrl = require('../lib/controller')()

test('controller: instantiation', function (t) {
  t.ok(ctrl.processFeatureServer, 'has processFeatureServer method')
  t.ok(ctrl.errorResponse, 'has errorResponse method')
  t.end()
})

// mock res object
function mockRes (cb) {
  var res = {}
  res.jsonp = function (opt) { cb(opt) }
  res.json = res.jsonp
  res.send = res.jsonp
  res.status = function () { return res }
  return res
}

test('controller.errorResponse: default', function (t) {
  var res = mockRes(function (response) {
    t.ok(response.error, 'error exists')
    t.equal(response.error.code, 500, 'code is correct')
    t.equal(response.error.message, 'Internal Server Error', 'message is correct')
    t.end()
  })

  ctrl.errorResponse(null, res)
})

test('controller.errorResponse: custom status code', function (t) {
  var res = mockRes(function (response) {
    t.ok(response.error, 'error exists')
    t.equal(response.error.code, 404, 'code is correct')
    t.equal(response.error.message, 'Internal Server Error', 'message is correct')
    t.end()
  })

  ctrl.errorResponse({ code: 404 }, res)
})

test('controller.errorResponse: custom error message', function (t) {
  var res = mockRes(function (response) {
    t.ok(response.error, 'error exists')
    t.equal(response.error.code, 500, 'code is correct')
    t.equal(response.error.message, 'I dunno', 'message is correct')
    t.end()
  })

  ctrl.errorResponse({ message: 'I dunno' }, res)
})

test('controller.errorResponse: extra error content', function (t) {
  var res = mockRes(function (response) {
    t.ok(response.error, 'error exists')
    t.equal(response.error.code, 500, 'code is correct')
    t.equal(response.error.message, 'Internal Server Error', 'message is correct')
    t.equal(response.error.prop, 'xyz', 'extra property is correct')
    t.end()
  })

  ctrl.errorResponse({ prop: 'xyz' }, res)
})

test('controller.processFeatureServer: no data found', function (t) {
  var req = { query: { geometry: null } }
  var res = mockRes(function (response) {
    t.ok(response.error, 'error exists')
    t.equal(response.error.code, 400, 'code is correct')
    t.equal(response.error.message, 'No data found', 'message is correct')
    t.end()
  })

  ctrl.processFeatureServer(req, res, null)
})
