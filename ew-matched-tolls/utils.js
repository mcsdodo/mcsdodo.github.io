L.Map.prototype.addDropdownFromObject = function(obj, callback) {
    let dropdown = L.Control.extend({
        options: {
          position: 'topright'
        },
        onAdd: function(map) {
          var container = L.DomUtil.create('select');
          var innerHTML = "";
          $.each(obj, function(key, value) {
            let option = '<option value=' + key + '>' + key + '</option>';
            innerHTML += option;
          });
  
          container.innerHTML = innerHTML;
          L.DomEvent.disableClickPropagation(container);
          container.onchange = callback;
          return container;
        },
      });
      map.addControl(new dropdown());
}

L.Map.prototype.addCheckBox = function(title, onChange, checked = true){
  var customInput = L.Control.extend({
      options: {
          position: 'topright'
      },
      onAdd: function() {
          var label = L.DomUtil.create('label', 'leaflet-bar leaflet-control leaflet-control-custom transparent_white_container cursor-pointer');
          label.innerHTML = title;
          var checkbox = L.DomUtil.create('input', 'input', label);
          checkbox.type="checkbox";
          checkbox.checked = checked;
          $(checkbox).on('change', (evt) => {
              onChange(evt.target.checked)
          });
          L.DomEvent.disableClickPropagation(label);
          return label;
      }
  });
  let control = new customInput;
  this.addControl(control);
  return control;
}

L.Map.prototype.addButton = function (value, callback) {
    let button = L.Control.extend({
      options: {
        position: 'topright'
      },
      onAdd: function(map) {
        var container = L.DomUtil.create('input');
        L.DomEvent.disableClickPropagation(container);
        container.type = "button";
        container.value = value;

        container.onclick = callback
        return container;
      },
    });
    this.addControl(new button());
  }


  function coordsToString(latlng) {
    return latlng.lat.toFixed(5) + "," + latlng.lng.toFixed(5);
  }

  function coordsFromString(latlngStr) {
    let split = latlngStr.split(',');
    return {
      lat: Number.parseFloat(split[0]),
      lng: Number.parseFloat(split[1])
    };
  }

  function addMarker(coords, forceIndex) {
    let marker = L.marker(coords, {
      icon: new L.NumberedDivIcon({
        number: forceIndex
      }),
      originalCoordinates: coords
    });
    marker.addTo(markers);
  }

  function createPolyline(line, color) {
    let polyline = L.Polyline.fromEncoded(line, {
      color: color,
      weight: 9,
      smoothFactor: 1
    });
    return polyline;
  }

function getApiKey() {
    var search = window.location.search.substr(1).split("=");
    if (search[0] == "key" && search[1]) {
        return search[1];
    } else {
        let apiKey = Lockr.get('api-key');
        if (apiKey)
            return apiKey;
        alert("Please provide your apikey in url like http://myurl.com/key=MY_API_KEY");
    }
}