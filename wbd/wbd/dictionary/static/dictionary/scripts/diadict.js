var django = {
    "jQuery": jQuery.noConflict(true)
};
var jQuery = django.jQuery;
var $ = jQuery;

$(document).ready(function () {
  // Initialize Bootstrap popover
  // Note: this is used when hovering over the question mark button
  $('[data-toggle="popover"]').popover();
});

var oProgressTimer = null;

var loc_divErr = "diadict_err";

// ============================= MAP ======================================================
const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attribution =
'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors &copy; <a href="https://carto.com/attribution">CARTO</a>',
      tiles = L.tileLayer(tileUrl, { attribution });
var main_map_object = null;   // Leaflet map object
var loc_sWaiting = " <span class=\"glyphicon glyphicon-refresh glyphicon-refresh-animate\"></span>";
var loc_oms = null;
var loc_layerDict = {};
var loc_layerList = [];
var loc_overlayMarkers = {};
var loc_colorDict = {};
var loc_trefwoord = [];
var loc_colors = '#0fba62,#5aa5c4,black,#345beb,#e04eed,#ed4c72,#1e662a,#c92f04,#e39817'.split(',');
// Trial: for fontawesome *4*
const fontAwesomeIcon = L.divIcon({
  html: '<i class="fa fa-map-marker fa-alt" style="color: darkred;"></i>',
  iconSize: [20, 20],
  className: 'myDivIcon'
});
// ========================================================================================

// GOOGLE TRACKING STATISTICS
(function (i, s, o, g, r, a, m) {
  i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
    (i[r].q = i[r].q || []).push(arguments)
  }, i[r].l = 1 * new Date(); a = s.createElement(o),
  m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
})(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

ga('create', 'UA-90924826-1', 'auto');
ga('send', 'pageview');
// ==================================

function errMsg(sMsg, ex) {
    var sHtml = "";
    if (ex === undefined) {
        sHtml = "Error: " + sMsg;
    } else {
        sHtml = "Error in [" + sMsg + "]<br>" + ex.message;
    }
    sHtml = "<code>" + sHtml + "</code>";
    $("#" + loc_divErr).html(sHtml);
}

function errClear() {
    $("#" + loc_divErr).html("");
}

/**
 * Goal: initiate a lemma search
 * Source: http://www.javascript-coder.com/javascript-form/javascript-reset-form.phtml
 *
 * @param {string} sName - one of 'lemma', 'entry', 'trefwoord'
 * @returns {bool}
 */
function clearForm(sName) {
    try {

        var f = $("#" + sName + "search").get(0);
        var elements = f.elements;

        var elements = $("#" + sName + "search .form-control");

        f.reset();

        for (i = 0; i < elements.length; i++) {

            field_type = elements[i].type.toLowerCase();

            switch (field_type) {

                case "text":
                case "password":
                case "textarea":
                case "hidden":

                    elements[i].value = "";
                    break;

                case "radio":
                case "checkbox":
                    if (elements[i].checked) {
                        elements[i].checked = false;
                    }
                    break;

                case "select-one":
                case "select-multiple":
                    elements[i].selectedIndex = -1;
                    break;

                default:
                    break;
            }
        }
        return (false);
    } catch (ex) {
        errMsg("clearForm", ex);
    }

}

/**
 * Goal: initiate a sort
 *
 * @param {string} field_name - name of the field to sort on
 * @param {string} action     - one of: desc, asc, del
 * @param {string} frmName    - name of the <form ...> that contains the 'sortOrder' <input> field
 * @returns {void}
 */
function do_sort_column(field_name, action, frmName) {
    try {
        // Combine @field_name and @action into [sOrder]
        var sOrder = field_name;
        if (action == 'desc') {
            // Descending sort order is signified by a '-' prefix
            sOrder = '-' + sOrder;
        } else if (action == 'del') {
            // "Deleting" (pressing 'x') the sort order of a column means: return to the default 'woord' sort order
            sOrder = 'woord';
        }

        // Set the value of the [sortOrder] field defined in dictionary/forms.py::EntrySearchForm
        $("#" + frmName + " input[name='sortOrder']").val(sOrder);

        // Submit the form with the indicated name
        $("#" + frmName).submit();

    } catch (ex) {
        errMsg("do_sort_column", ex);
    }
}

/**
 * Goal: initiate a search
 *
 * @param {node}   el     - the calling node
 * @param {string} sName  - this can be 'lemma', 'trefwoord' or 'entry'
 * @param {string} sType  - when 'Herstel', then 
 * @returns {bool}
 */
function do_search(el, sName, sType, pageNum) {
  var sSearch = 'search',
      data = null,          // Data to be sent
      sUrl = "",            // The URL we need to have
      elMsg = null,
      sMethod = "",         // The calling method
      elOview = null;       // Element of type [sName_list_oview]

  try {
        // Check if this is resetting
        if (sType === 'Herstel')
            return clearForm(sName);
        var f = $("#" + sName + "search");
        // var sSearchType = $(el).attr('value');
        var url_prefix = $(".container").attr("url_home");
        var sPath = url_prefix;
        switch (sName) {
            case "admin":
                sPath += "dictionary/" + sSearch + "/";
                break;
            default:
                sPath += sName + "/" + sSearch + "/";
                break;
        }
        f.attr('action', sPath);
        // Set the submit type
        $("#submit_type").attr('value', sType);

        // Get the calling method
        if ($(el).attr("m")) {
          sMethod = $(el).attr("m");
        }
        if (sMethod ==="") {sMethod = "get"}
        
        // Check if we are going to do a new page load or an ajax call
        elOview = "#" + sName + "_list_oview";
        elMsg = "#" + sName + "_list_msg";
        
        switch (sMethod) {
          case "get":
            // Load a new page
            document.getElementById(sName + 'search').submit();
            break;
          case "ajax":
            // Do an ajax call with the data we have
            data = $(f).serializeArray();
            // Possibly add a page number
            if (pageNum !== undefined) {
              data.push({ 'name': 'page', 'value': pageNum });
            }

            // Figure out what the path should be
            sUrl = sPath + "ajax/";
            $(f).attr("method", "POST");
            sSearch = $(f).attr("method");
            // Show a waiting message
            $(elMsg).html("<span><i>we zijn aan het zoeken...</i></span><span class=\"glyphicon glyphicon-refresh glyphicon-refresh-animate\"></span>");
            // De knoppen even uitschakelen

            // Now make the POST call
            $.post(sUrl, data, function (response) {
              // Sanity check
              if (response !== undefined) {
                if (response.status == "ok") {
                  if ('html' in response) {
                    $(elOview).html(response['html']);
                    $(elMsg).html("");
                  } else {
                    $(elMsg).html("Response is okay, but [html] is missing");
                  }
                  // Knoppen weer inschakelen

                } else {
                  if ("msg" in response) {
                    $(elMsg).html(response.msg);
                  } else {
                    $(elMsg).html("Could not interpret response " + response.status);
                  }
                }
              }
            });
            break;
        }

        // Make sure we return positively
        return true;
    } catch (ex) {
        errMsg("do_search", ex);
    }

}

function init_events() {
  // Events for input
  $(".search-input").keyup(function (e) {
    if (e.keyCode === 13) {
      $("#button_search").click();
    }
  });

  // Make modal draggable
  $(".modal-header, modal-dragpoint").on("mousedown", function (mousedownEvt) {
    var $draggable = $(this),
        cursor = null,
        x = mousedownEvt.pageX - $draggable.offset().left,
        y = mousedownEvt.pageY - $draggable.offset().top;

    // Set the cursor
    cursor = $draggable.css("cursor");
    $draggable.css("cursor", "grab");

    $("body").on("mousemove.draggable", function (mousemoveEvt) {
      $draggable.closest(".modal-dialog").offset({
        "left": mousemoveEvt.pageX - x,
        "top": mousemoveEvt.pageY - y
      });
      $draggable.css("cursor", "grab");
    });
    $("body").one("mouseup", function () {
      $("body").off("mousemove.draggable");
      $draggable.css("cursor", cursor);
    });
    $draggable.closest(".modal").one("bs.modal.hide", function () {
      $("body").off("mousemove.draggable");
    });
  });
}

/**
 * do_additional
 * Goal: show or hide additional locations
 * @returns {bool}
 */
function do_additional(el) {
    try {
        var bOptVal = $(el).is(":checked");
        if (bOptVal) {
            $(".lemma-word-dialect-additional").removeClass("hidden");
            $(".lemma-word-dialect-dots").addClass("hidden");
        } else {
            $(".lemma-word-dialect-additional").addClass("hidden");
            $(".lemma-word-dialect-dots").removeClass("hidden");
        }

        // Make sure we return positively
        return true;
    } catch (ex) {
        errMsg("do_additional", ex);
        return false;
    }
}

/**
 * Goal: change dialect choice
 * @returns {bool}
 */
function do_dialect(el) {
    try {
        // Get the value of this option
        var sOptVal = $(el).attr('value');
        // Adapt hidden elements
        switch (sOptVal) {
            case 'code':
                $(".lemma-word-dialect-code").removeClass("hidden");
                $(".lemma-word-dialect-space").addClass("hidden");
                $(".lemma-word-dialect-stad").addClass("hidden");
                break;
            case 'stad':
                $(".lemma-word-dialect-code").addClass("hidden");
                $(".lemma-word-dialect-space").addClass("hidden");
                $(".lemma-word-dialect-stad").removeClass("hidden");
                break;
            case 'alles':
                $(".lemma-word-dialect-code").removeClass("hidden");
                $(".lemma-word-dialect-stad").removeClass("hidden");
                $(".lemma-word-dialect-space").removeClass("hidden");
                break;
        }

        // Make sure we return positively
        return true;
    } catch (ex) {
        errMsg("do_dialect", ex);
        return false;
    }

}

function repair_start(sRepairType) {
    var sUrl = "";
    // Indicate that we are starting
    $("#repair_progress_" + sRepairType).html("Repair is starting: "+sRepairType);
    // Start looking only after some time
    var oJson = { 'status': 'started' };
    oRepairTimer = setTimeout(function () { repair_progress(sRepairType, oJson); }, 3000);

    // Make sure that at the end: we stop
    var oData = { 'type': sRepairType };
    sUrl = $("#repair_start_"+sRepairType).attr('repair-start');
    $.ajax({
    "url": sUrl,
    "dataType": "json",
    "data": oData,
    "cache": false,
    "success": function () { repair_stop(); }
    });
}

function repair_progress(sRepairType) {
    var sUrl = "";

    var oData = { 'type': sRepairType };
    sUrl = $("#repair_start_" + sRepairType).attr('repair-progress');
    $.ajax({
        "url": sUrl,
        "dataType": "json",
        "data": oData,
        "cache": false,
        "success": function (json) {
            repair_handle(sRepairType, json); }
    });
}

function repair_handle(sRepairType, json) {
  // Action depends on the status in [json]
  switch (json.status) {
    case 'error':
      // Show we are ready
      $("#repair_progress_" + sRepairType).html("Error repairing: " + sRepairType);
      // Stop the progress calling
      window.clearInterval(oRepairTimer);
      // Leave the routine, and don't return anymore
      return;
    case "done":
    case "finished":
      // Show we are ready
      $("#repair_progress_" + sRepairType).html("Ready repairing: " + sRepairType);
      // Stop the progress calling
      window.clearInterval(oRepairTimer);
      // Leave the routine, and don't return anymore
      return;
    default:
      // Default action is to show the status
      $("#repair_progress_" + sRepairType).html(json.status);
      oRepairTimer = setTimeout(function (json) { repair_progress(sRepairType); }, 1000);
      break;
  }
}

function repair_stop(sRepairType) {
  // Show we are ready
  $("#repair_progress_" + sRepairType).html("Finished repair: " + sRepairType);

  // Stop the progress calling
  window.clearInterval(oRepairTimer);
}

function import_start(bUseDbase) {
    var sUrl = "";

    // Clear previous errors
    errClear();

    try {
        // Retrieve the values Deel/Sectie/AflNum
        var sDeel = $("#id_deel").val();
        var sSectie = $("#id_sectie").val();
        var sAflnum = $("#id_aflnum").val();
        // Get the value of the CSV file
        var sCsvFile = $("#id_csv_file").val();
        if (sCsvFile === undefined || sCsvFile === "") {
            sCsvFile = $("#id_csv_file").parent().find('a').text();
        }
        if (sCsvFile === undefined || sCsvFile === "") {
            // It is no use to start--
            var sMsg = "Eerst dit record opslaan (SAVE) en dan hiernaartoe terugkeren";
            $("#info_progress").html(sMsg);
            $("#info_button").addClass("hidden");
            $("#info_button2").addClass("hidden");
            return;
        } else {
            $("#info_progress").html("Please wait...");
        }
        // Start looking only after some time
        oProgressTimer = setTimeout(function () { progress_request(); }, 3000);
        // Start reading this file
        sUrl = $("#info_button").attr('import-start');
        var oData = {
            'deel': sDeel, 'sectie': sSectie,
            'aflnum': sAflnum, 'filename': sCsvFile,
            'usedbase': bUseDbase
        };

        $.ajax({
            "url": sUrl,
            "dataType": "json",
            "data": oData,
            "cache": false,
            "success": function () { progress_stop(); }
        });
    } catch (ex) {
        errMsg("import_start", ex);
    }
}

function progress_request() {
    var sUrl = "";

    try {
        // Prepare an AJAX call to ask for the progress
        sUrl = $("#info_button").attr('import-progress');
        // Retrieve the values Deel/Sectie/AflNum
        var sDeel = $("#id_deel").val();
        var sSectie = $("#id_sectie").val();
        var sAflnum = $("#id_aflnum").val();
        // Try get a CSRF token from somewhere
        var sCsrf = $("#info_form input:hidden").val();
        // Prepare these values for the request
        var oData = {
            'csrfmiddlewaretoken': sCsrf,
            'deel': sDeel, 'sectie': sSectie,
            'aflnum': sAflnum
        };

        $.ajax({
            url: sUrl,
            dataType: "json",
            //type: "POST",
            data: oData,
            cache: false,
            success: function (json) {
                progress_handle(json);
            },
            failure: function () {
                errMsg("progress_request AJAX call failed");
            }
        });
    } catch (ex) {
        errMsg("progress_request", ex);
    }
}

function progress_handle(json) {
    try {
        // Handle the progress report
        var sStatus = json.status;
        var iRead = json.read;
        var iSkipped = json.skipped;
        var sProgress = "";
        var sMsg = json.msg;
        var sMethod = json.method;
        // Deal with error
        if (sStatus === "error") {
            // Stop the progress calling
            // window.clearInterval(oProgressTimer);
            sProgress = "An error has occurred - stopped";
        } else {
            if (sMsg === undefined || sMsg === "") {
                sProgress = sStatus + " " + sMethod + " (read=" + iRead + ", skipped=" + iSkipped + ")";
            } else {
                sProgress = sStatus + " " + sMethod + " (read=" + iRead + ", skipped=" + iSkipped + "): " + sMsg;
            }
            if (iRead > 0 || iSkipped > 0) {
                $("#id_read").val(iRead);
                $("#id_skipped").val(iSkipped);
            }
        }
        if (sStatus !== "idle") {
            $("#info_progress").html(sProgress);
        }
        switch (sStatus) {
            case "error":
                break;
            case "done":
                progress_stop();
                break;
            case "idle":
                // Make an additional request but wait longer
                oProgressTimer = setTimeout(function () { progress_request(); }, 5000);
                break;
            default:
                // Make an additional request in 1 second
                oProgressTimer = setTimeout(function () { progress_request(); }, 1000);
                break;
        }

    } catch (ex) {
        errMsg("progress_handle", ex);
    }

}

function progress_stop() {
    try {
        var currentdate = new Date();
        var sDateString = currentdate.getDate() + "/"
                      + (currentdate.getMonth() + 1) + "/"
                      + currentdate.getFullYear() + " @ "
                      + currentdate.getHours() + ":"
                      + currentdate.getMinutes() + ":"
                      + currentdate.getSeconds();
        var sMsg = "Processed on: " + sDateString;
        $("#id_processed").val(sMsg);
        $("#info_progress").html("The conversion is completely ready");
        // Stop the progress calling
        window.clearInterval(oProgressTimer);
    } catch (ex) {
        errMsg("progress_stop", ex);
    }
}

function set_search(sId) {
    try {
        var lSearchId = ['lemmasearch', 'locationsearch', 'dialectsearch', 'trefwoordsearch'];
        for (i = 0; i < lSearchId.length; i++) {
            $("#top" + lSearchId[i]).addClass("hidden");
        }
        $("#top" + sId).removeClass("hidden");
    } catch (ex) {
        errMsg("set_search", ex);
    }
}

// ============================= MAP ======================================================
/**
 * make_icon
 * 
 * @param {str}   name, representing category
 * @returns {bool}
 */
function make_icon(name) {
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
}

/**
 * make_marker
 * 
 * @param {entry}   entry object
 * @returns {bool}
 */
function make_marker(entry) {
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
    marker = L.marker(point, { icon: make_icon(trefwoord) });

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

function lemma_map(el) {
  var frm = "#lemmasearch",
      data = null,
      entries = null,
      lemma = "",
      map_title = "#map_view_title",
      map_id = "map_lemma",
      map_view = "#map_view",
      point = null,
      points = [],
      keywords = [],
      polyline = null,
      oOverlay = null,
      i = 0,
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
      // Sanity check
      if (response !== undefined) {
        if (response.status == "ok") {
          if ('entries' in response) {
            entries = response['entries'];
            lemma = response['lemma'];
            // Make sure the lemma shows
            $(map_title).html("Begrip: [" + lemma + "]");

            if (main_map_object == null) {
              // now get the first point
              for (i = 0; i < entries.length; i++) {
                if (entries[i].point !== null && entries[i].point !== "") {
                  // Add point to the array of points to find out the bounds
                  points.push(entries[i].point.split(",").map(Number));
                  // Create a marker for this point
                  make_marker(entries[i]);
                }
              }
              if (points.length > 0) {
                // Get the first point
                point = points[0];
                // CLear the map section from the waiting symbol
                $("#" + map_id).html();
                // Set the starting map
                main_map_object = L.map(map_lemma).setView([point[0], point[1]], 12);
                // Add it to my tiles
                tiles.addTo(main_map_object);
                // https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet to handle overlapping markers
                loc_oms = new OverlappingMarkerSpiderfier(main_map_object, { keepSpiderfied: true });

                // Convert layerdict into layerlist
                for (key in loc_layerDict) {
                  loc_layerList.push({key: key, value: loc_layerDict[key], freq: loc_layerDict[key].length});
                }
                // sort the layerlist
                loc_layerList.sort(function (a, b) {
                  return b.freq - a.freq;
                });

                // Make a layer of markers from the layerLIST
                for (idx in loc_layerList) {
                  var key = loc_layerList[idx].key;
                  var layername = '<span style="color: ' + loc_colorDict[key] + ';">' + key + '</span>' + ' (' + loc_layerList[idx].freq + ')';
                  value = loc_layerList[idx].value;
                  if (value.length > 0) {
                    try {
                      loc_overlayMarkers[layername] = L.layerGroup(value).addTo(main_map_object);
                    } catch (ex) {
                      i = 100;
                    }
                  }
                }
                L.control.layers({}, loc_overlayMarkers, { collapsed: false }).addTo(main_map_object);

                // Set map to fit the markers
                polyline = L.polyline(points);
                if (points.length > 1) {
                  main_map_object.fitBounds(polyline.getBounds());
                } else {
                  main_map_object.setView(points[0], 12);
                }

              }
            }

            // Make sure it is redrawn
            // main_map_object.invalidateSize();
            setTimeout(function () {
              main_map_object.invalidateSize();
              main_map_object.fitBounds(polyline.getBounds());
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
    errMsg("lemma_map", ex);
  }
}

