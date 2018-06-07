    var apiKey = getApiKey();

    //initialization of sygic maps
    var map = L.map("map");
    map.setView([48.146864, 17.105868], 13);
    var sygicTileLayer = L.TileLayer.sygic(apiKey);
    L.layerGroup([sygicTileLayer]).addTo(map);

    var parsedInput = _.reduce(input, function(memo, elm){
        memo.coordinates.push(elm.latitude + "," + elm.longitude);
        memo.timestamps.push((+ new Date(elm.timestamp)) / 1000);
        memo.accuracies.push(elm.accuracy)
        return memo;
    }, {
        timestamps: [],
        coordinates : [],
        accuracies: []
    });

    console.log(parsedInput);

    var createPolyline = function (line, color) {
        var polyline = L.Polyline.fromEncoded(line, {
            color: color,
            weight: 5,
            smoothFactor: 1
        });
        return polyline;
    }

    $.post("https://directions.api.sygic.com/v1/api/matching?key=" + apiKey, parsedInput).done(function (response) {
        var matchedRoute = createPolyline(response.route, "blue");

        map.addLayer(matchedRoute);
        var bounds = matchedRoute.getBounds();
        map.fitBounds(bounds);
    });