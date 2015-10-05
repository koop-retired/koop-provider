var test = require('tape')
var query = require('../lib/feature-services/query')
var fixture1 = require('./fixtures/snow1.geojson')
var fixture2 = require('./fixtures/snow2.geojson')
var fixture3 = require('./fixtures/snow3.geojson')

test('lib/query', function (t) {
  t.test('when returning count only', function (st) {
    query.filter(fixture1, { returnCountOnly: true }, function (err, service) {
      st.error(err)
      st.equal(service.count, fixture1.features.length, 'returns the count')
      st.end()
    })
  })

  t.test('when returning ids only', function (st) {
    query.filter(fixture1, { returnIdsOnly: true, idField: 'station' }, function (err, service) {
      st.error(err)
      st.ok(Array.isArray(service.objectIds), 'returns an array of object ids')
      st.equal(service.objectIdField, 'station', 'has correct object id field')
      st.equal(service.objectIds.length, fixture1.features.length, 'length matches source geojson')
      st.end()
    })
  })

  t.test('when not returning geometries', function (st) {
    query.filter(fixture1, { returnGeometry: false }, function (err, service) {
      st.error(err)
      st.notOk(service.features[0].geometry, 'returns an array of features with no geometries')
      st.end()
    })
  })

  t.test('when filtering outFields', function (st) {
    query.filter(fixture1, { outFields: 'station' }, function (err, service) {
      st.error(err)
      st.ok(service.features[0].properties.station)
      st.notOk(service.features[0].properties.latitude, 'returns features with only given outFields')
      st.end()
    })
  })

  t.test('when filtering via where', function (st) {
    st.plan(4)

    query.filter(fixture1, { where: '1=1' }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, fixture1.features.length, 'matches with 1=1')
    })

    query.filter(fixture1, { where: 'latitude > 39.9', outFields: '*' }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, fixture1.features.length, 'matches with latitute > 39.9')
    })
  })

  t.test('when requesting data with outStatistics', function (st) {
    st.plan(5)

    query.filter(fixture1, {
      outStatistics: 'xx11xx'
    }, function (err, service) {
      st.ok(err, 'returns an error when outStatistics params fails')
      st.notOk(service)
    })

    query.outStatistics(fixture2[0], {
      outStatistics: '[{"statisticType":"min","onStatisticField":"total precip","outStatisticFieldName":"min_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.ok(Array.isArray(service.fields))
      st.ok(Array.isArray(service.features), 'returns json when outStatistics params is proper')
    })
  })

  t.test('when grouping stats', function (st) {
    query.outStatistics(fixture3[0], {
      groupByFieldsForStatistics: 'total precip',
      outStatistics: '[{"statisticType":"count","onStatisticField":"total precip","outStatisticFieldName":"total_precip_COUNT"}]'
    }, function (err, service) {
      st.error(err)
      st.ok(Array.isArray(service.fields))
      st.ok(Array.isArray(service.features), 'returns json when grouping stats by a field')
      st.end()
    })
  })
})
