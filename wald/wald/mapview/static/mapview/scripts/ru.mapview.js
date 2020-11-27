var django = {
  "jQuery": jQuery.noConflict(true)
};
var jQuery = django.jQuery;
var $ = jQuery;

String.prototype.format = function () {
  var formatted = this;
  for (var arg in arguments) {
    formatted = formatted.replace("{" + arg + "}", arguments[arg]);
  }
  return formatted;
};


var ru = (function ($, ru) {
  "use strict";

  ru.mapview = (function ($, config) {
    // Local variables for ru.mapview
    const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' +
                      ' contributors &copy; <a href="https://carto.com/attribution">CARTO</a>',
        tiles = L.tileLayer(tileUrl, { attribution }),
        // Trial: for fontawesome *4*
        fontAwesomeIcon = L.divIcon({
          html: '<i class="fa fa-map-marker fa-alt" style="color: darkred;"></i>',
          iconSize: [20, 20],
          className: 'myDivIcon'
        });
    var main_map_object = null,   // Leaflet map object
        loc_sWaiting = " <span class=\"glyphicon glyphicon-refresh glyphicon-refresh-animate\"></span>",
        loc_oms = null,
        loc_divErr = "diadict_err",
        loc_layerDict = {},
        loc_layerList = [],
        loc_overlayMarkers = {},
        loc_colorDict = {},
        loc_trefwoord = [],
        loc_colors = '#0fba62,#5aa5c4,black,#345beb,#e04eed,#ed4c72,#1e662a,#c92f04,#e39817'.split(',');
    
    // Private methods specifiction
    var private_methods = {
      errMsg: function(sMsg, ex) {
        var sHtml = "";
        if (ex === undefined) {
          sHtml = "Error: " + sMsg;
        } else {
          sHtml = "Error in [" + sMsg + "]<br>" + ex.message;
        }
        sHtml = "<code>" + sHtml + "</code>";
        $("#" + loc_divErr).html(sHtml);
      },

      errClear: function() {
        $("#" + loc_divErr).html("");
      },

      /**
       * make_icon
       * 
       * @param {str}   name, representing category
       * @returns {bool}
       */
      make_icon: function(name) {
        var oBack = {};

        try {
          oBack = {
            className: name,
            // Note: for fontawesome *4*
            // html: '<i class="fa fa-map-marker fa-alt" style="font-size: 24px; color: '+loc_colorDict[name]+';"></i>',
            // Note: for fontawesome *5*
            html: '<i class="fas fa-map-marker-alt" style="color: ' + loc_colorDict[name] + ';"></i>',
            iconAncor: [3, 15]
          };
          return L.divIcon(oBack);
        } catch (ex) {
          errMsg("make_icon", ex);
        }
      },

      /**
       * make_marker
       * 
       * @param {entry}   entry object
       * @returns {bool}
       */
      make_marker: function(entry) {
        var point,    // Latitude, longitude array
            trefwoord = "",
            popup = "",
            idx = -1,
            marker;

        try {
          // Validate
          if (entry.point === null || entry.point === "") { return false; }
          // Get the trefwoord
          trefwoord = entry.trefwoord;
          if (loc_trefwoord.indexOf(trefwoord) < 0) {
            // Add it
            loc_trefwoord.push(trefwoord);
            // Set the color table
            idx = loc_trefwoord.indexOf(trefwoord);
            loc_colorDict[trefwoord] = loc_colors[idx % 10];
          }
          // Get to the point
          point = entry.point.split(",").map(Number);

          // Create marker for this point
          marker = L.marker(point, { icon: private_methods.make_icon(trefwoord) });

          // Add a popup to the marker
          //popup = entry.woord + "\n (" + entry.kloeke + ": " + entry.stad + ")";
          popup = entry.pop_up;
          marker.bindPopup(popup, { maxWidth: 200, closeButton: false });

          // Add to OMS
          if (loc_oms !== null) { loc_oms.addMarker(marker); }
          // Add marker to the trefwoord collectionlayer
          if (loc_layerDict[trefwoord] === undefined) {
            loc_layerDict[trefwoord] = [];
          }
          loc_layerDict[trefwoord].push(marker);
        } catch (ex) {
          errMsg("make_marker", ex);
        }
      }
    }

    // Public methods
    return {
      /**
       * lemma_map
       * 
       * @param {dom}   where this request starts from
       * @returns {void}
       */
      lemma_map(el) {
        var frm = "#lemmasearch",
            map_title = "#map_view_title",
            map_id = "map_lemma",
            map_view = "#map_view",
            data = null,
            entries = null,
            lemma = "",
            label = "",
            point = null,
            points = [],
            keywords = [],
            polyline = null,
            oOverlay = null,
            i = 0,
            idx = 0,
            targeturl = "",
            targetid = "";

        try {
          // Get the form data
          //frm = $("form").first();
          data = $(frm).serializeArray();
          targeturl = $(el).attr("targeturl");
          targetid = $(el).attr("targetid");

          // Show the modal
          $(map_view).modal("toggle");

          // Possibly remove what is still there
          if (main_map_object !== null) {
            // Remove tile layer from active map
            tiles.remove()
            // Remove the actual map
            try {
              main_map_object.remove();
            } catch (ex) {
              i = 0;
            }
            main_map_object = null;
            // Reset the 
          }
          // Indicate we are waiting
          $("#" + map_id).html(loc_sWaiting);
          if (points.length > 0) points.clear();
          // Other initializations
          loc_layerDict = {};
          loc_layerList = [];
          loc_trefwoord = [];
          loc_colorDict = {};
          loc_overlayMarkers = {};

          // Post the data to the server
          $.post(targeturl, data, function (response) {
            var key, layername, kvalue;

            // Sanity check
            if (response !== undefined) {
              if (response.status == "ok") {
                if ('entries' in response) {
                  entries = response['entries'];
                  label = response['label'];
                  // Make sure the label shows
                  $(map_title).html("Begrip: [" + label + "]");

                  if (main_map_object == null) {
                    // now get the first point
                    for (i = 0; i < entries.length; i++) {
                      if (entries[i].point !== null && entries[i].point !== "") {
                        // Add point to the array of points to find out the bounds
                        points.push(entries[i].point.split(",").map(Number));
                        // Create a marker for this point
                        private_methods.make_marker(entries[i]);
                      }
                    }
                    if (points.length > 0) {
                      // Get the first point
                      point = points[0];
                      // CLear the map section from the waiting symbol
                      $("#" + map_id).html();
                      // Set the starting map
                      main_map_object = L.map(map_id).setView([point[0], point[1]], 12);
                      // Add it to my tiles
                      tiles.addTo(main_map_object);
                      // https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet to handle overlapping markers
                      loc_oms = new OverlappingMarkerSpiderfier(main_map_object, { keepSpiderfied: true });

                      // Convert layerdict into layerlist
                      for (key in loc_layerDict) {
                        loc_layerList.push({ key: key, value: loc_layerDict[key], freq: loc_layerDict[key].length });
                      }
                      // sort the layerlist
                      loc_layerList.sort(function (a, b) {
                        return b.freq - a.freq;
                      });

                      // Make a layer of markers from the layerLIST
                      for (idx in loc_layerList) {
                        key = loc_layerList[idx].key;
                        layername = '<span style="color: ' + loc_colorDict[key] + ';">' + key + '</span>' + ' (' + loc_layerList[idx].freq + ')';
                        kvalue = loc_layerList[idx].value;
                        if (kvalue.length > 0) {
                          try {
                            loc_overlayMarkers[layername] = L.layerGroup(kvalue).addTo(main_map_object);
                          } catch (ex) {
                            i = 100;
                          }
                        }
                      }
                      L.control
                        .layers({}, loc_overlayMarkers, { collapsed: false })
                        .addTo(main_map_object)

                      // Set map to fit the markers
                      polyline = L.polyline(points);
                      if (points.length > 1) {
                        main_map_object.fitBounds(polyline.getBounds());
                      } else {
                        main_map_object.setView(points[0], 12);
                      }

                      if ($("section.leaflet-control-layers-list")[0].scrollHeight > 300) {
                        $("section.leaflet-control-layers-list").addClass("leaflet-control-layers-scrollbar");
                        $("section.leaflet-control-layers-list")[0].style.height = '300px';
                      }

                    }
                  }

                  // Make sure it is redrawn
                  // main_map_object.invalidateSize();
                  setTimeout(function () {
                    main_map_object.invalidateSize();
                    if (points.length > 1) {
                      main_map_object.fitBounds(polyline.getBounds());
                    } else {
                      main_map_object.setView(points[0], 12);
                    }

                    if ($("section.leaflet-control-layers-list")[0].scrollHeight > 300) {
                      $("section.leaflet-control-layers-list").addClass("leaflet-control-layers-scrollbar");
                      $("section.leaflet-control-layers-list")[0].style.height = '300px';
                    }

                  }, 200);
                  // Debug  break point
                  i = 100;
                } else {
                  errMsg("Response is okay, but [html] is missing");
                }
                // Knoppen weer inschakelen

              } else {
                if ("msg" in response) {
                  errMsg(response.msg);
                } else {
                  errMsg("Could not interpret response " + response.status);
                }
              }
            }
          });
        } catch (ex) {
          private_methods.errMsg("lemma_map", ex);
        }
      }
    };

  }($, ru.config));

  return ru;
}(jQuery, window.ru || {})); // window.ru: see http://stackoverflow.com/questions/21507964/jslint-out-of-scope

// ============================= MAP ======================================================



