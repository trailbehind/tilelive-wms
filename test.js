var fs = require("fs");
var imageserver = require("./index");
var tilelive = require("@mapbox/tilelive");

new imageserver(
  "wms:///?source=http://wms.ess-ws.nrcan.gc.ca/wms/toporama_en&layers=limits,vegetation,builtup_areas,designated_areas,hydrography,hypsography,water_saturated_soils,landforms,constructions,road_network,railway,aeronautical_network,structures,power_network,boundaries,feature_names",
  function(error, r) {
    console.log(error, r);
    if (error) {
      return console.log(error);
    }
    console.log("got source");
    r.getTile(8, 42, 84, function(error, tile) {
      if (error) {
        return console.log(error);
      }
      console.log("got tile");
      var out = fs.createWriteStream(__dirname + "/test@1x.png");
      out.write(tile);
    });
  }
);
