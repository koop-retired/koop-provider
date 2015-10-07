var fs = require('fs')
var formatSpatialRef = require('format-spatial-ref')

/**
 * Exposes shared functionality across providers.
 * Typically this means things that require direct access to koop.
 * TODO: Refactor so that koop app isn't passed in at all.
 *       Properties currently needed from koop:
 *       - log
 *       - files
 *       - Cache
 *       - Exporter
 *       - thumbnail
 *       - tiles
 *
 * @param {Object} koop - instance of koop middleware app
 */
function model (koop) {
  // Expose central Koop log
  var log = koop.log

  // Expose interface for file access (either local fs or s3)
  var files = koop.files

  /**
   * returns configured data dir for the cache
   *
   * @return {string} data directory
   */
  function cacheDir () {
    return koop.Cache.data_dir
  }

  /**
   * Wrapper method that reduces the number of params passed to export functions.
   * Helps keep backward compatibility with the existing API.
   *
   * @param {object} params
   * @param {object} options
   * @param {Function} callback
   */
  function exportFile (params, options, callback) {
    if (options && options.large) {
      exportLarge(params.format, params.id, params.key, params.type, options, callback)
    } else {
      exportToFormat(params.format, params.dir, params.key, params.data, options, callback)
    }
  }

  /**
   * exports data to the given format
   *
   * @param {string} format
   * @param {string} dir
   * @param {string} key
   * @param {object} data
   * @param {object} options
   * @param {Function} callback
   */
  function exportToFormat (format, dir, key, data, options, callback) {
    options.rootDir = koop.files.localDir

    koop.Exporter.exportToFormat(format, dir, key, data, options, function (err, result) {
      if (err) return callback(err, null)
      finishExport(format, key, options, result, callback)
    })
  }

  /**
   * TODO: missing description
   *
   * @param {string} format
   * @param {string} id
   * @param {string} key
   * @param {string} type
   * @param {object} options
   * @param {Function} callback
   */
  function exportLarge (format, id, key, type, options, callback) {
    options.rootDir = koop.files.localDir

    koop.Exporter.exportLarge(koop, format, id, key, type, options, finishExport, callback)
  }

  /**
   * wrapper for calling koop.thumbnail.generate
   *
   * @param {string} data
   * @param {string} key
   * @param {object} options
   * @param {Function} callback
   */
  function generateThumbnail (data, key, options, callback) {
    if (!koop.thumbnail) {
      return callback(new Error('Thumbnail generation is not included in this instance of koop'))
    }

    options.dir = options.dir || koop.files.localDir

    koop.thumbnail.generate(data, key, options, callback)
  }

  /**
   * gets/creates a tile from the url params and data
   *
   * @param {object} params
   * @param {object} data
   * @param {Function} callback
   */
  function tileGet (params, data, callback) {
    if (!koop.tiles) {
      return callback(new Error('Tile generation is not included in this instance of koop'))
    }

    params.dir = params.dir || koop.files.localDir
    delete data.info

    koop.tiles.getTile(params, data, callback)
  }

  /**
   * gets a plugin from the koop object
   *
   * @param {string} name - plugin name
   * @return {function} plugin
   */
  function plugin (name) {
    return koop[name]
  }

  /**
   * wrapper for calling koop.tiles.getImageServiceTile
   *
   * @param {object} params
   * @param {Function} callback
   */
  function getImageServiceTile (params, callback) {
    if (!koop.tiles) {
      return callback(new Error('Tile generation is not included in this instance of koop'))
    }

    koop.tiles.getImageServiceTile(params, callback)
  }

  /**
   * wrapper for calling koop.tiles.getServiceTile
   *
   * @param {object} params
   * @param {object} info
   * @param {Function} callback
   */
  function getServiceTile (params, info, callback) {
    if (!koop.tiles) {
      return callback(new Error('Tile generation is not included in this instance of koop'))
    }

    koop.tiles.getServiceTile(params, info, callback)
  }

  /**
   * TODO: missing description
   *
   * @param {string} format
   * @param {string} key
   * @param {object} options
   * @param {object} result
   * @param {Function} callback
   */
  function finishExport (format, key, options, result, callback) {
    function sendFile (err, result) {
      if (err) return callback(err, null)

      if (koop.files.s3) {
        try {
          // try to clean up local FS
          fs.unlinkSync(result.paths.rootNewFile)
          fs.unlinkSync(result.paths.rootJsonFile)
        } catch (e) {
          koop.log.debug('Trying to remove non-existent file: %s', e)
        }

        koop.files.exists(result.paths.path + '/' + key, result.paths.newFile, function (exists, path) {
          if (!exists) return callback('File did not get created.', null)
          return callback(null, path)
        })
      } else {
        callback(null, result.file)
      }
    }

    if (koop.files.s3) {
      var stream = fs.createReadStream(result.file)

      koop.files.write(result.paths.path + '/' + key, result.paths.newFile, stream, function (err) {
        if (err) return callback(err, result)

        if (!options.isFiltered) {
          koop.files.write(result.paths.latestPath, result.paths.newFile, fs.createReadStream(result.file), function (err) {
            if (err) {
              koop.log.error('Error writing file to s3: %s', err)
            }

            try {
              // try to clean up local FS
              fs.unlinkSync(result.paths.rootNewFile)
            } catch (e) {
              koop.log.debug('Trying to remove non-existent file: %s', e)
            }
            sendFile(null, result)
          })
        } else {
          sendFile(null, result)
        }
      })
    } else {
      sendFile(null, result)
    }
  }

  /**
   * wrapper for calling koop.Cache.db.geoHashAgg
   *
   * @param {string} key
   * @param {object} options
   * @param {Function} callback
   */
  function getGeoHash (key, options, callback) {
    if (!koop.Cache.db.geoHashAgg) {
      return callback('Current koop cache does not support geohash aggregation')
    }

    var limit = options.limit || 100000
    var precision = options.precision || 8

    koop.Cache.db.geoHashAgg(key, limit, precision, options, callback)
  }

  function saveFile (path, file, data, callback) {
    koop.files.write(path, file, data, function (err) {
      if (err) return callback(err)
      return callback()
    })
  }

  return {
    log: log,
    files: files,
    cacheDir: cacheDir,
    exportToFormat: exportToFormat,
    exportLarge: exportLarge,
    exportFile: exportFile,
    finishExport: finishExport,
    parseSpatialReference: formatSpatialRef,
    tileGet: tileGet,
    plugin: plugin,
    generateThumbnail: generateThumbnail,
    getImageServiceTile: getImageServiceTile,
    getServiceTile: getServiceTile,
    getGeoHash: getGeoHash,
    saveFile: saveFile,
    getCount: koop.Cache.getCount,
    getExtent: koop.Cache.getExtent
  }
}

module.exports = model
