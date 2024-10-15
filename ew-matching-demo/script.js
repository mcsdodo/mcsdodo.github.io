Lockr.prefix = "sygic";

var markers = L.layerGroup();
var matchedRouteLayer = L.layerGroup();
var segmentsLayer = L.layerGroup();
var allLayers = [markers, segmentsLayer];
var map = L.map("map");

L.control.layers(null, {
  "Markers": markers,
  "Continuous matched route": matchedRouteLayer,
  "Matched segments": segmentsLayer
}, {
  collapsed: false
}).addTo(map);

let splitters = {"roadclassdetailed":"", "roadclass":"", "roadnumber":""}
let colors = [
  "#009fff", // blue for no speeding (0%)
  "#fdff00", // yellow for 10% speeding
  "#ff7400", // orange for 20% speeding
  "#f00", // red for 30% speeding
  "#000" // black for more
];

for (const splitter in splitters) {
  if (splitters.hasOwnProperty(splitter)) {
    const checked = splitter == "tolls" || splitter == "roadnumber";
      map.addCheckBox(splitter, (checked) => {
          if (checked) {
              splitters[splitter]=1;
          } else {
              delete splitters[splitter];
          }
      }, checked);
      if (!checked)
        delete splitters[splitter];
  }
}

var apiKey = getApiKey();
let usedInput;

Data.get().then(examples => {
  usedInput = examples["ew-7"];

  var sygicTileLayer = L.TileLayer.sygic(apiKey);
  L.layerGroup([sygicTileLayer]).addTo(map);

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
    var tmpSplitters = [];
    input.splitting = "";
    for (const splitter in splitters) {
        if (splitters.hasOwnProperty(splitter)) {
          tmpSplitters.push(splitter);
        }
    }
    if (tmpSplitters.length > 0) {
      input.splitting = tmpSplitters.join("|");
    }

    input.include_estimated_segments = true;
    $.ajax({
      // url: "https://directions-testing.api.sygic.com/v1/api/speeding?key=" + apiKey,
      url: "http://localhost:10150/v1/api/matchingroadinfo?key=" + apiKey,
      method: "POST",
      dataType: "json",
      contentType: "application/json; charset=UTF-8",
      data: JSON.stringify(input)
    }).done(function (response) {
      let matchedRoute = createPolyline(response.route, "red");

      if (response.segments)
        response.segments.forEach(function (segment, index) {
          let colorIndex = Math.round(index % 4);
          let segmentPolyline = createPolyline(segment.route, colors[colorIndex > 4 ? 4 : colorIndex]);
          let originalColor = segmentPolyline.options.color;
          segmentPolyline.addTo(segmentsLayer);
          segmentPolyline.on('click', function(e){
            L.popup({ minWidth: 300, closeButton: false, className: 'xx', autoPanPaddingTopLeft: [0,100] })
                .setLatLng(e.latlng)
                .setContent(`<p>${segment.road_number}</p>`).openOn(map);
          })

          segmentPolyline.on('mouseover', e => e.target.setStyle({color: 'black'}));
          segmentPolyline.on('mouseout', e => e.target.setStyle({color: originalColor}));
        });
      matchedRoute.addTo(matchedRouteLayer);

      let bounds = matchedRoute.getBounds();
      map.fitBounds(bounds);
    });
  }

  init(usedInput);

  map.addDropdownFromObject(examples, function () {
    init(examples[this.value]);
  })

  map.addButton("Compute", function () {
    matchedRouteLayer.clearLayers();
    compute(usedInput);
  });
});

