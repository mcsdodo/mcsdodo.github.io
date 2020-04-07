Lockr.prefix = "sygic";

var apiKey = getApiKey();

var examples = getExamples();
let usedInput = examples["ew-1"];

var map = L.map("map");

var sygicTileLayer = L.TileLayer.sygic(apiKey);
L.layerGroup([sygicTileLayer]).addTo(map);

var markers = L.layerGroup();
var matchedRouteLayer = L.layerGroup();
var segmentsLayer = L.layerGroup();
var allLayers = [markers, matchedRouteLayer, segmentsLayer];

function clearAllLayers() {
  allLayers.forEach(l => l.clearLayers());
}
allLayers.forEach(l => l.addTo(map));

function init(input) {
  usedInput = input;
  let coordinates = usedInput.coordinates;
  clearAllLayers();

  if (coordinates) {
    var bounds = new L.LatLngBounds();
    coordinates.forEach(function (coordinate, index) {
      var latlng = coordsFromString(coordinate);
      addMarker(latlng, index + 1);
      bounds.extend(latlng);
    })
    map.fitBounds(bounds);
  } else {
    map.setView([48.146864, 17.105868], 14);
  }
}

function compute(input) {
  input.include_estimated_segments = true;
  $.ajax({
    url: "https://analytics.api.sygic.com/v1/api/speeding?key=" + apiKey,
    method: "POST",
    dataType: "json",
    contentType: "application/json; charset=UTF-8",
    data: JSON.stringify(input)
  }).done(function (response) {
    let matchedRoute = createPolyline(response.route, "red");

    if (response.speeding_segments)
    response.speeding_segments.forEach(function (segment, index) {
      let segmentPolyline = createPolyline(segment.route, "gray");
      segmentPolyline.addTo(segmentsLayer);
    });
    matchedRoute.addTo(matchedRouteLayer);

    let bounds = matchedRoute.getBounds();
    map.fitBounds(bounds);
  });
}

init(usedInput);

L.control.layers(null, {
  "Markers": markers,
  "Continuous matched route": matchedRouteLayer,
  "Matched segments": segmentsLayer
}, {
  collapsed: false
}).addTo(map);


map.addDropdownFromObject(examples, function () {
  init(examples[this.value]);
})

map.addButton("Compute", function () {
  matchedRouteLayer.clearLayers();
  compute(usedInput);
});

