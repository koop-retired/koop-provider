var test = require('tape')
var featureServices = require('../lib/feature-services')
var snowFixture = require('./fixtures/snow1.geojson')
var polygonFixture = require('./fixtures/polygon.geojson')

test('lib/feature-services', function (t) {
  t.test('determining esri field types', function (st) {
    var strType = featureServices.fieldType('a string')
    var dblType = featureServices.fieldType(10.1)
    var intType = featureServices.fieldType(10)

    st.equal(strType, 'esriFieldTypeString', 'returns esriFieldTypeString for string')
    st.equal(dblType, 'esriFieldTypeDouble', 'returns esriFieldTypeDouble for float')
    st.equal(intType, 'esriFieldTypeInteger', 'returns esriFieldTypeInteger for integer')
    st.end()
  })

  t.test('building esri fields', function (st) {
    var input = {
      propInt: 10,
      propFloat: 10.1,
      propString: 'Awesome',
      propDate: 'Wed Jun 24 2015 08:18:24'
    }
    var fieldObj = featureServices.fields(input)
    var fields = fieldObj.fields

    st.equal(Object.prototype.toString(fieldObj), '[object Object]', 'featureServices.fields() returns object')
    st.ok(Array.isArray(fields), 'fields is array')
    st.equal(fieldObj.oidField, 'id', 'oid field is "id"')

    fields.forEach(function (f, i) {
      st.ok(f.type, 'field ' + i + ' has type property')
      st.ok(f.name, 'field ' + i + ' has name property')
      st.ok(f.alias, 'field ' + i + ' has alias property')
    })

    st.equal(fields[0].type, 'esriFieldTypeInteger', 'attributes contain int')
    st.equal(fields[1].type, 'esriFieldTypeDouble', 'attributes contain double')
    st.equal(fields[2].type, 'esriFieldTypeString', 'attributes contain string')
    st.equal(fields[3].type, 'esriFieldTypeDate', 'attributes contain date')

    st.end()
  })

  t.test('getting featureserver info from geojson', function (st) {
    st.plan(4)

    featureServices.info(polygonFixture, 0, {}, function (err, service) {
      st.error(err)
      st.equal(service.geometryType, 'esriGeometryPolygon', 'returns feature service with correct geometry type')
    })

    polygonFixture.extent = [1, 2, 3, 4]

    featureServices.info(polygonFixture, 0, {}, function (err, service) {
      st.error(err)
      st.equal(service.fullExtent[0], 1)
    })
  })

  t.test('getting feature counts from a given count', function (st) {
    featureServices.query({ count: 100 }, { returnCountOnly: true }, function (err, json) {
      st.error(err)
      st.equal(json.count, 100, 'returns correct count')
      st.end()
    })
  })

  t.test('overriding params in a feature service', function (st) {
    var name = 'MyTestName'
    var desc = 'MyTestDesc'
    var params = {
      overrides: {
        name: name,
        description: desc
      }
    }

    featureServices.info(snowFixture, 0, params, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.equal(service.name, name, 'name is overriden')
      st.equal(service.description, desc, 'description is overriden')
      st.end()
    })
  })

  t.test('getting featureserver features from geojson', function (st) {
    st.comment('returns valid features')

    featureServices.query(snowFixture, {}, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.ok(Array.isArray(service.fields), 'service.fields is array')
      st.ok(Array.isArray(service.features), 'service.features is array')

      service.features.forEach(function (feature, i) {
        st.ok(feature.geometry, 'feature ' + i + ' has geometry property')
        st.ok(feature.attributes, 'feature ' + i + ' has attributes property')
      })

      st.end()
    })
  })

  t.test('getting featureserver features by id queries', function (st) {
    st.comment('returns proper features')

    featureServices.query(snowFixture, { objectIds: '1,2,3' }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.ok(Array.isArray(service.fields), 'service.fields is array')
      st.equal(service.features.length, 3, 'service.features has length of 3')
      st.end()
    })
  })

  t.test('getting features with returnCountOnly', function (st) {
    st.comment('returns only count of features')

    featureServices.query(snowFixture, { returnCountOnly: true, objectIds: '1,2,3' }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.ok(service.count, 'service has count property')
      st.equal(service.count, 3, 'count is 3')
      st.end()
    })
  })

  t.test('getting features with returnIdsOnly', function (st) {
    st.comment('returns only ids of features')

    featureServices.query(snowFixture, { returnIdsOnly: true, objectIds: '1,2,3' }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.ok(service.objectIds, 'service has objectIds property')
      st.equal(service.objectIds.length, 3, 'service.objectIds has length of 3')
      st.end()
    })
  })

  t.test('filtering features with a geometry', function (st) {
    featureServices.query(snowFixture, {
      geometry: '-110,30,-106,50',
      geometryType: 'esriGeometryEnvelope'
    }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.equal(service.features.length, 100, 'returns contained geometries')
      st.end()
    })
  })

  t.test('filtering features with a geometry and outSR', function (st) {
    featureServices.query(snowFixture, {
      geometry: {
        xmin: -110,
        ymin: 30,
        xmax: -106,
        ymax: 50,
        spatialReference: {
          wkid: 4326
        }
      },
      geometryType: 'esriGeometryEnvelope'
    }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.equal(service.features.length, 100, 'returns contained geometries')
      st.end()
    })
  })

  t.test('filtering features with a geometry and outSR + spatialRel (?)', function (st) {
    featureServices.query(snowFixture, {
      geometry: {
        xmin: -110,
        ymin: 30,
        xmax: -106,
        ymax: 50,
        spatialReference: {
          wkid: 4326
        }
      },
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelContains'
    }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.equal(service.features.length, 100, 'returns contained geometries')
      st.end()
    })
  })

  t.test('filtering polygon features with a geometry', function (st) {
    featureServices.query(polygonFixture, {
      geometry: {
        xmin: -180,
        ymin: -90,
        xmax: 180,
        ymax: 90,
        spatialReference: {
          wkid: 4326
        }
      },
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelContains'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, 1, 'returns geometries contained by given bounds')
      st.end()
    })
  })

  t.test('filtering features with where clauses', function (st) {
    st.plan(6)

    featureServices.query(snowFixture, {
      where: 'latitude < 39.9137'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, 261, 'returns filtered features with less than')
    })

    featureServices.query(snowFixture, {
      where: 'latitude > 39.9137'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, 144, 'returns filtered features with greater than')
    })

    featureServices.query(snowFixture, {
      where: 'latitude = 39.9137'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features.length, 1, 'returns filtered features with equal')
    })
  })

  t.test('querying features with false outStatistics params', function (st) {
    featureServices.query(snowFixture, {
      outStatistics: '{}'
    }, function (err, service) {
      st.ok(err, 'returns an error when an empty json string is passed')
      st.notOk(service, 'no service object returned')
      st.end()
    })
  })

  t.test('querying for statistics', function (st) {
    st.plan(23)

    st.comment('returns correct fields and features for one stat')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "min", "onStatisticField": "total precip","outStatisticFieldName":"min_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(service.fields.length, 1)
      st.equal(service.features.length, 1)
      st.equal(service.features[0]['attributes']['min_precip'], 0)
    })

    st.comment('returns correct number of fields and features for 2 stats')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "min", "onStatisticField": "total precip","outStatisticFieldName":"min_precip"},{"statisticType": "max", "onStatisticField": "total precip","outStatisticFieldName":"max_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(service.fields.length, 2)
      st.equal(service.features.length, 1)
      st.equal(service.features[0]['attributes']['min_precip'], 0)
      st.equal(service.features[0]['attributes']['max_precip'], 1.5)
    })

    st.comment('returns correct number of fields and features for 2 stats')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "count", "onStatisticField": "total precip","outStatisticFieldName":"count_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(service.fields.length, 1)
      st.equal(service.features.length, 1)
      st.notEqual(service.features[0]['attributes']['count_precip'], 0)
    })

    st.comment('returns correct number of fields and features for sum stats')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "sum", "onStatisticField": "total precip","outStatisticFieldName": "sum_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(Object.prototype.toString(service), '[object Object]', 'service is object')
      st.equal(service.fields.length, 1)
      st.equal(service.features.length, 1)
      st.equal(service.features[0]['attributes']['sum_precip'], 135.69000000000003)
    })

    st.comment('returns correct number of fields and features for avg stats')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "avg", "onStatisticField": "total precip","outStatisticFieldName": "avg_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features[0]['attributes']['avg_precip'], 0.3253956834532375)
    })

    st.comment('returns correct number of fields and features for var/stddev stats')

    featureServices.query(snowFixture, {
      outStatistics: '[{"statisticType": "var", "onStatisticField": "total precip","outStatisticFieldName": "var_precip"},{"statisticType": "stddev", "onStatisticField": "total precip","outStatisticFieldName": "stddev_precip"}]'
    }, function (err, service) {
      st.error(err)
      st.equal(service.features[0]['attributes']['var_precip'], 0.07643107844659537)
      st.equal(service.features[0]['attributes']['stddev_precip'], 0.27646171244242007)
    })
  })
})
