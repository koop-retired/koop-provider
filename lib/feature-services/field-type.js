// maps common field type names to esri type names
var fieldTypes = {
  'string': 'esriFieldTypeString',
  'integer': 'esriFieldTypeInteger',
  'date': 'esriFieldTypeDate',
  'datetime': 'esriFieldTypeDate',
  'float': 'esriFieldTypeDouble'
}

/**
 * returns esri field type based on type of value passed
 *
 * @param {*} value - object to evaluate
 * @return {string} esri field type
 */
function fieldType (value) {
  var type = typeof value

  if (type === 'number') {
    type = isInt(value) ? 'integer' : 'float'
  }

  return fieldTypes[type]
}

/**
 * is the value an integer?
 *
 * @param  {number} value
 * @return {boolean}
 */
function isInt (value) {
  return Math.round(value) === value
}

module.exports = fieldType
