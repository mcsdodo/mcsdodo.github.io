var apiKey = getApiKey();

//initialization of sygic maps
var map = L.map("map");
map.setView([48.146864, 17.105868], 13);
var sygicTileLayer = L.TileLayer.sygic(apiKey);
L.layerGroup([sygicTileLayer]).addTo(map);

var controls = {};

for (var key in inputs) {
    var matchKey = key.replace("source", "match");
    controls[key] = L.layerGroup();
    controls[matchKey] = L.layerGroup();
}

L.control.layers(null, controls, {
    collapsed: false
}).addTo(map);

var createPolyline = function (line, color) {
    var polyline = L.Polyline.fromEncoded(line, {
        color: color,
        weight: 5,
        smoothFactor: 1
    });
    return polyline;
}

var addRoute = function (response, key, color) {
    var matchKey = key.replace("source", "match");
    var matchLayer = controls[matchKey];
    var matchedRoute = createPolyline(response.route, color || "blue");
    var bounds = matchedRoute.getBounds();
    map.fitBounds(bounds);
    matchedRoute.addTo(matchLayer);

    var sourceLayer = controls[key];
    var input = inputs[key];
    for (var i = 0; i < input.length; i++) {
        var element = input[i].split(',');
        var marker = L.marker(element, {
            icon: new L.NumberedDivIcon({
                number: i
            })
        });
        marker.addTo(sourceLayer);
    }
}

//load and store results to localstorage
for (var key in inputs) {
    var response = Lockr.get(key);
    var matchedKey = key.replace("source", "match");
    if (response) {
        addRoute(response, key);
    } else {
        var input = {
            coordinates: inputs[key]
        };
        (function (objectKey) {
            $.post("https://directions.api.sygic.com/v1/api/matching?key=" + apiKey, input).done(function (response) {
                Lockr.set(objectKey, response);
                addRoute(response, objectKey);
            });
        })(key);
    }
}