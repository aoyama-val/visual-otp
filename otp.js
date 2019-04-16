var STORAGE_SAVED = 'saved';

var map;
var result;
var polylines = [];
var originMarker;
var destinationMarker;

$(function() {
  var saved = localStorage.getItem(STORAGE_SAVED);
  if (saved) {
    try {
      saved = JSON.parse(saved);
    } catch (err) {
      saved = {};
    }
  } else {
      saved = {};
  }

  if (saved.endpoint) {
    $('#endpoint').val(saved.endpoint);
  }

  var urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('endpoint')) {
    $('#endpoint').val(urlParams.get('endpoint'));
  }

  var center = new google.maps.LatLng(saved.center_lat || 34.66021726845927, saved.center_lng || 133.94503203644524);
  var gmap_options = {
    zoom: saved.zoom || 14,
    center: center,
    clickableIcons: false,
    gestureHandling: 'greedy',
  };
  map = new google.maps.Map(document.getElementById("gmap"), gmap_options);
  map.addListener("click", function(e) {
    var latlng = e.latLng.lat() + "," + e.latLng.lng();
    if (confirm("どっちにセットする？\nOK→fromPlace\nキャンセル→toPlace")) {
      $('#fromPlace').val(latlng);
    } else {
      $('#toPlace').val(latlng);
    }
  });
});

function search_onclick() {
  var endpoint = $('#endpoint').val();

  localStorage.setItem(STORAGE_SAVED, JSON.stringify({
    center_lat: map.getCenter().lat(),
    center_lng: map.getCenter().lng(),
    zoom: map.getZoom(),
    endpoint: endpoint,
  }));

  var now = moment();
  var modes = [];
  $('.mode').each(function() {
    var $this = $(this);
    if ($this.is(':checked')) {
      modes.push($this.val());
    }
  });
  //var modes = ['CAR'];
  var url = $('#endpoint').val() + 'otp/routers/default/plan?fromPlace=' + $('#fromPlace').val() + '&toPlace=' + $('#toPlace').val() + '&time=' + now.format('hh:mma') + '&date=' + now.format('MM-DD-YYYY') + '&mode=' + modes.join(',') + '&arriveBy=false&numItineraries=1';
  $('#url').val(url);
  console.log(url);
  $.getJSON(url)
  .then(function(res) {
    setResult(res);
  })
  .catch(function(err) {
    alert("getJSONエラー");
    console.error(err);
  });
}

function setResult(res) {
  result = res;

  if (result.error) {
    alert(result.error.msg);
    return;
  }
  $('#json').val(JSON.stringify(res));
  var links = '';
  for (var i = 0; i < result.plan.itineraries.length; i++) {
    links += '<a href="#" onclick="visualize(' + i + ')">経路' + i + '</a>';
  }
  $("#links").html(links);
  if (result.plan.itineraries.length > 0) {
    visualize(0);
  } else {
    alert('経路が見つからなかったようです');
  }
}

function visualize_onclick() {
  var json = $('#json').val();
  setResult(JSON.parse(json));
}

function visualize(itineraryIndex) {
  var itinerary = result.plan.itineraries[itineraryIndex];
  var colors = {
    "WALK": "#0000ff",
    "BUS": "#ff0000",
  };
  var routeForDebug = [];
  routeForDebug.push([
    "mode",
    "from",
    "to",
    "departure",
    "arrival",
    "routeLongName",
  ]);
  if (originMarker) { originMarker.setMap(null); }
  if (destinationMarker) { destinationMarker.setMap(null); }
  originMarker = new google.maps.Marker({
    map: map,
    position: {
      lat: parseFloat(result.requestParameters.fromPlace.split(',')[0]),
      lng: parseFloat(result.requestParameters.fromPlace.split(',')[1]),
    }
  });
  destinationMarker = new google.maps.Marker({
    map: map,
    position: {
      lat: parseFloat(result.requestParameters.toPlace.split(',')[0]),
      lng: parseFloat(result.requestParameters.toPlace.split(',')[1]),
    }
  });
  map.setCenter({ lat: parseFloat(result.requestParameters.fromPlace.split(',')[0]), lng: parseFloat(result.requestParameters.fromPlace.split(',')[1]) });
  polylines.forEach(function(poly) {
    poly.setMap(null);
  });
  polylines = [];
  itinerary.legs.forEach(function(leg, i) {
    var path = google.maps.geometry.encoding.decodePath(leg.legGeometry.points);
    var poly = new google.maps.Polyline({
      strokeColor: colors[leg.mode] || "#000000",
      strokeOpacity: 1,
      strokeWeight: 3,
      path: path,
      map: map
    });
    polylines.push(poly);
    routeForDebug.push([
      leg.mode,
      leg.from.name,
      leg.to.name,
      moment(leg.from.departure).format('HH:mm'),
      moment(leg.to.arrival).format('HH:mm'),
      leg.routeLongName,
    ]);
  });
  createTable(routeForDebug);
}

function createTable(tableData) {
  var tableBody = document.createElement("tbody");

  tableData.forEach(function(rowData) {
    var row = document.createElement("tr");

    rowData.forEach(function(cellData) {
      var cell = document.createElement("td");
      cell.appendChild(document.createTextNode(cellData));
      row.appendChild(cell);
    });

    tableBody.appendChild(row);
  });

  $("table.route").empty().append(tableBody);
}
