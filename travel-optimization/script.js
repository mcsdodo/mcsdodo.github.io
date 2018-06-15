L.NumberedDivIcon = L.Icon.extend({
    options: {
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
        number: '',
        shadowUrl: null,
        iconSize: new L.Point(25, 41),
        iconAnchor: new L.Point(13, 41),
        popupAnchor: new L.Point(0, -33),
    },

    createIcon: function () {
        var div = document.createElement('div');
        var img = this._createImg(this.options['iconUrl']);
        img.setAttribute('class', 'hidden-fucker');
        var numdiv = document.createElement('div');
        numdiv.setAttribute("class", "number");
        numdiv.innerHTML = this.options['number'] || '';
        div.appendChild(img);
        div.appendChild(numdiv);
        this._setIconStyles(div, 'icon');
        return div;
    },
});


var createPolyline = function (line, color) {
    var polyline = L.Polyline.fromEncoded(line, {
        color: color,
        weight: 5,
        smoothFactor: 1
    });
    return polyline;
}

var bounds = new L.LatLngBounds();

var apiKey = getApiKey();

//initialization of sygic maps
var map = L.map("map");

var resultsLayer = L.layerGroup([]);
resultsLayer.addTo(map);

map.on('contextmenu',
    function (evt) {
        alert(evt.latlng.lat.toFixed(5) + "," + evt.latlng.lng.toFixed(5));
    });

map.setView([51.50344, -0.12224], 13);
var sygicTileLayer = L.TileLayer.sygic(apiKey);
L.layerGroup([sygicTileLayer]).addTo(map);

var input1 = {
    "locations": [{
            "id": "hotel",
            "coordinates": "51.49818,-0.11345"
        },
        {
            "id": "london-eye",
            "coordinates": "51.503304,-0.119618",
            "time_spent": "01:00:00",
            "preferred_times": [{
                "start": "2018-06-08T18:00:00.000Z",
                "end": "2018-06-08T20:00:00.000Z"
            }]
        },
        {
            "id": "mall",
            "coordinates": "51.504019,-0.135395",
            "time_spent": "01:00:00"
        },
        {
            "id": "big-ben",
            "coordinates": "51.500823,-0.124433",
            "time_spent": "00:30:00",
        },
        {
            "id": "westminster-abbey",
            "coordinates": "51.499734,-0.127877",
            "time_spent": "00:30:00",
            "opening_hours": [{
                "start": "2018-06-08T09:00:00.000Z",
                "end": "2018-06-08T10:00:00.000Z"
            }]
        },
        {
            "id": "trafalgar-sq",
            "coordinates": "51.50776,-0.12791"
        },
        {
            "id": "restaurant",
            "coordinates": "51.50580,-0.12600",
            "time_spent": "01:00:00",
            "preferred_times": [{
                "start": "2018-06-08T12:00:00.000Z",
                "end": "2018-06-08T13:00:00.000Z"
            }]
        },
        {
            "id": "national-gallery",
            "coordinates": "51.50855,-0.12830",
            "time_spent": "02:00:00",
        }
    ]
};

var input2 = {
    "locations": [{
            "id": "hotel",
            "coordinates": "51.49818,-0.11345"
        },
        {
            "id": "london-eye",
            "coordinates": "51.503304,-0.119618",
            "time_spent": "01:00:00"
        },
        {
            "id": "mall",
            "coordinates": "51.504019,-0.135395",
            "time_spent": "01:00:00"
        },
        {
            "id": "big-ben",
            "coordinates": "51.500823,-0.124433",
            "time_spent": "00:30:00",
        },
        {
            "id": "westminster-abbey",
            "coordinates": "51.499734,-0.127877",
            "time_spent": "00:30:00"
        },
        {
            "id": "trafalgar-sq",
            "coordinates": "51.50776,-0.12791"
        },
        {
            "id": "restaurant",
            "coordinates": "51.50580,-0.12600",
            "time_spent": "01:00:00"
        },
        {
            "id": "national-gallery",
            "coordinates": "51.50855,-0.12830",
            "time_spent": "02:00:00",
        }
    ]
};

var inputs = {"original" : input2, "optimized" : input1};
init("original");

(function () {
    let dropdown = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function (map) {
            var container = L.DomUtil.create('select');
            var innerHTML = "";
            $.each(inputs, function (key, value) {
                let option = '<option value=' + key + '>' + key + '</option>';
                innerHTML += option;
            });

            container.innerHTML = innerHTML;
            L.DomEvent.disableClickPropagation(container);
            container.onchange = function (a, b, c) {
                resultsLayer.clearLayers();
                
                if (this.value) {
                    init(this.value);
                } else {
                    // init();
                }
                console.log(this.value);
            }
            return container;
        },
    });
    map.addControl(new dropdown());
})();

function init(key){
    let input = inputs[key];
    let locationsObj = _.reduce(input.locations, function (memo, item) {
        memo[item.id] = item.coordinates;
        return memo;
    }, {});

    $.ajax({
        type: "POST",
        url: "http://platformtest:4567/api/optimization",
        // url: "https://localhost:44328/api/optimization",
        // url: "http://platformtest:7496/api/optimization",
        contentType: "application/json",
        data: JSON.stringify(input),
        success: function (result) {
            if (result.plan) {
                console.log(result);
                for (let index = 0; index < result.plan.length; index++) {
                    const element = result.plan[index];
    
                    var layers = [];
    
                    if (index < result.plan.length - 1) {
                        var marker = new L.marker(locationsObj[element.id].split(','), {
                            icon: new L.NumberedDivIcon({
                                number: element.id + " " + (index + 1),
                                iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-black.png',
                            }),
                            title: element.id
                        });
    
                        layers.push(marker);
                    }
    
                    if (index > 0) {
                        var polyline = L.Polyline.fromEncoded(element.path, {
                            color: 'blue',
                            weight: 3,
                            smoothFactor: 1
                        });
                        var coords = polyline.getLatLngs();
    
                        bounds.extend(coords);
    
                        layers.push(polyline);
                    }
    
                    
                    L.layerGroup(layers).addTo(resultsLayer);
                }
                map.fitBounds(bounds);
            }
        }
    });
}


const markerSizes = {
    popularMarkerSize: 58,
    bigMarkerSize: 44,
    mediumMarkerSize: 20,
    smallMarkerSize: 8,
    customMarkerSize: 40,
  };

const createMarker = (place, addToTripCallback) => {
    let size = markerSizes.mediumMarkerSize;
    let className = 'marker-medium';
  
    if (place.thumbnailUrl) {
      size = markerSizes.popularMarkerSize;
      className = 'marker-popular';
    }
  
    const icon = L.divIcon({
      className,
      html: getHtml(place, size),
      popupAnchor: [0, (-1 * size) / 2],
    });
  
    const markerOptions = {
      place,
      icon,
      clicable: true,
      timeout: null,
    };
    const marker = L.marker([place.location.lat, place.location.lng], markerOptions);
    // setMarkerListeners(marker, addToTripCallback);
    return marker;
  };

  const getHtml = (place, size) => {
    if (size === markerSizes.bigMarkerSize || size === markerSizes.popularMarkerSize) {
      return `<span><img alt="${place.name}" src="${place.thumbnailUrl}" /></span>`;
    }
  
    return '<span class="marker-place"></span>';
  };

//   var array = [];

 var markers = travelData.map(item => {
      var marker = createMarker(item);
      marker.addTo(map);
  });