var apiKey = getApiKey();

var segmentsLayer = L.layerGroup();
var matchedRouteLayer = L.layerGroup();
var sygicTileLayer = L.TileLayer.sygic(apiKey);
var allLayers = [segmentsLayer, matchedRouteLayer];
var map = L.map("map");
L.layerGroup([sygicTileLayer]).addTo(map);

L.control.layers(null, {
  "Matched segments": segmentsLayer,
  "Continuous matched route": matchedRouteLayer,
}, {
  collapsed: false
}).addTo(map);



map.setView([48.146864, 17.105868], 14);

let colorsCache = {};


function clearAllLayers() {
  allLayers.forEach(l => l.clearLayers());
}

Data.get().then(examples => {
  allLayers.forEach(l => l.addTo(map));

  function init(input) {
    clearAllLayers();
    let matchedRoute = createPolyline(input.route, "red");
    matchedRoute.addTo(matchedRouteLayer);
    input.segments.forEach((segment, index) => {
      if (segment.road_number && colorsCache[segment.road_number] === undefined) {
        let colorIndex = Math.round(index % colors.length);
        colorsCache[segment.road_number] = colors[colorIndex > colors.length ? colors.length : colorIndex];
      }
      let color = segment.road_number ? colorsCache[segment.road_number] : "black";
      let segmentPolyline = createPolyline(segment.route, color);
      segmentPolyline.addTo(segmentsLayer);
      segmentPolyline.on('click', function(e){
        L.popup({ minWidth: 300, closeButton: false, className: 'xx', autoPanPaddingTopLeft: [0,100] })
            .setLatLng(e.latlng)
            .setContent(`<p>${segment.road_number}</p>`).openOn(map);
      })
      segmentPolyline.on('mouseover', e => e.target.setStyle({color: 'black'}));
      segmentPolyline.on('mouseout', e => e.target.setStyle({color: originalColor}));
    })
    let bounds = matchedRoute.getBounds();
    map.fitBounds(bounds);
  }


  init(examples['0039D482D61A_sendPos-matched-0.json']);

  map.addDropdownFromObject(examples, function () {
    init(examples[this.value]);
  })
});

