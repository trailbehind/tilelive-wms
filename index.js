module.exports = WMSSource;

var request = require("retry-request", {
  request: require("request")
});
var url = require("url");
var tilelive = require("@mapbox/tilelive");

var SphericalMercator = require("@mapbox/sphericalmercator");

var retry_options = {
  retries: 4,
  factor: 1.7
};

var merc = new SphericalMercator({
  size: 256
});

var SUPPORTED_FORMATS = {
  jpg: {
    mime: "image/jpeg"
  },
  png: {
    mime: "image/png"
  }
};

function WMSSource(uri, callback) {
  var parsed_uri = url.parse(uri, true);

  this.name = "WMSSource";
  this.minzoom = parseInt(parsed_uri.query.minzoom || "0");
  this.maxzoom = parseInt(parsed_uri.query.maxzoom || "14");
  this.scale = parseInt(parsed_uri.query.scale || "1");
  this.tilesize = parseInt(parsed_uri.query.baseTileSize || "256");
  this.format = parsed_uri.query.format || "png";
  this.server_root = parsed_uri.query["source"];

  this.options = parsed_uri.query;
  delete this.options.source;
  delete this.options.minzoom;
  delete this.options.maxzoom;
  delete this.options.scale;
  delete this.options.baseTileSize;
  delete this.options.format;

  callback(null, this);
}

WMSSource.prototype.getTile = function(z, x, y, callback) {
  var tile_bbox = merc.bbox(x, y, z, callback, "900913");

  var tilesize = this.tilesize * this.scale;
  var format = this.format;

  var params = {
    width: tilesize,
    height: tilesize,
    format: SUPPORTED_FORMATS[format].mime,
    bbox: tile_bbox.join(","),
    srs: "EPSG:3857",
    service: "WMS",
    request: "GetMap",
    version: "1.1.1",
    layers: "",
    styles: "",
    transparent: false,
    ...this.options
  };

  request(
    {
      url: this.server_root,
      encoding: null,
      qs: params
    },
    retry_options,
    function(error, response, body) {
      if (error) {
        return callback(error);
      }

      switch (response.statusCode) {
        case 200:
          return callback(null, body, {
            "content-type": SUPPORTED_FORMATS[format].mime
          });
        default:
          console.warn(
            "WMS URL " +
              response.request.href +
              " returned HTTP status code " +
              response.statusCode +
              ", tile will be skipped"
          );
          return callback(new Error("Tile does not exist"));
      }
    }
  );
};

WMSSource.prototype.getInfo = function(callback) {
  callback(null, {
    name: this.name,
    minzoom: this.minzoom,
    maxzoom: this.maxzoom,
    center: [-119.4835, 37.8042, 12],
    bounds: [-180, -85.0511, 180, 85.0511],
    format: this.format
  });
};

WMSSource.registerProtocols = function(tilelive) {
  tilelive.protocols["wms:"] = WMSSource;
};

WMSSource.registerProtocols(tilelive);
