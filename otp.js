var map;
var result;
var polylines = [];

$(function() {
  var center = new google.maps.LatLng(34.66021726845927, 133.94503203644524);
  var gmap_options = {
    zoom: 14,
    center: center,
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
  var now = moment();
  var url = $('#endpoint').val() + 'otp/routers/default/plan?fromPlace=' + $('#fromPlace').val() + '&toPlace=' + $('#toPlace').val() + '&time=' + now.format('hh:mma') + '&date=' + now.format('MM-DD-YYYY') + '&mode=TRANSIT,WALK&maxWalkDistance=50000&arriveBy=false&numItineraries=5';
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
    "routeLongName",
  ]);
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
