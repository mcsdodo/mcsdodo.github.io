(function () {
    const map = L.map("map");

    const yourApiKey = getApiKey();
    const optimizationUrl = "https://optimization.api.sygic.com/v0/api/optimization?key=" + yourApiKey;
    const routingUrl = "https://directions.api.sygic.com/v0/api/directions?key=" + yourApiKey;

    L.TileLayer.sygic(yourApiKey).addTo(map);

    // set initial map position - Bratislava
    map.setView([48.1459, 17.1071], 13);

    const colorPallet = [
        "#ed1b2f", "#51A351", "#EE8B1A", "#F5B72F", "#1F5B6D", "#1EA1DA", "#4E2960", "#891887", "#BB4A99",
        "#005E2B", "#9C262A", "#5EA72D", "#211E1F", "#FFFFFF"
    ];

    // leafconst custom control for input and submit file for optimization
    const customInput = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom transparent_white_container');

            const form = L.DomUtil.create('form', 'form', container);
            const group = L.DomUtil.create('div', 'form-group', form);
            const input = L.DomUtil.create('input', 'form-control input-file', group);
            input.type = 'file';
            input.id = 'selectFile';
            input.accept = '.json';
            input.style = 'margin:3px';
            const submit = L.DomUtil.create('input', 'form-control submit', form);
            submit.type = 'submit';
            submit.id = 'optimizeBtn'
            submit.style = 'margin:3px';
            const div = L.DomUtil.create('div', 'loader', form)
            div.style = 'display:none;'
            L.DomEvent.disableClickPropagation(container);


            $(container).on('paste', function (evt) {
                const input = evt.originalEvent.clipboardData.getData('text');
                setInputFormDisabled(true);
                optimize(JSON.parse(input));
            })

            return container;
        }
    });
    map.addControl(new customInput);

    // leafconst custom control for selecting concrete vehicle
    const vehiclesSelector = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function () {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom transparent_white_container');

            container.id = 'vehicleSelectorContainer';

            return container;
        }
    });
    map.addControl(new vehiclesSelector);

    $('.form').submit(function (ev) {
        ev.preventDefault();

        clearMap();

        const files = $("#selectFile")[0].files;

        if (files.length <= 0) {
            return false;
        }

        const fr = new FileReader();
        fr.onload = function (e) {
            const input = JSON.parse(e.target.result);
            setInputFormDisabled(true);
            optimize(input);
        }

        fr.readAsText(files.item(0));
    });

    function setInputFormDisabled(enable) {
        $("#selectFile").prop('disabled', enable);
        $("#optimizeBtn").prop('disabled', enable);
        if (enable) {
            $(".loader").show();
        } else {
            $(".loader").hide();
        }

    }

    let vehicles = [];

    function clearMap() {

        vehicles.forEach(function (vehicle) {
            map.removeLayer(vehicle.markers);
            if (typeof (vehicle.polyline) != 'undefined')
                map.removeLayer(vehicle.polyline);
        });
    }

    // post request for optimization
    function optimize(data) {
        $.ajax({
            type: 'POST',
            url: optimizationUrl,
            dataType: 'json',
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(data),
        }).done(function (data, textStatus, xhr) {
            // get url for result of optimization
            const location = xhr.getResponseHeader("location");
            getResults(location);
        }).fail(function (data, textStatus, xhr) {
            alert("FAILED!\r\n" + JSON.stringify(data, null, 2));
            setInputFormDisabled(false);
        });
    };

    // get result of optimization
    function getResults(url) {
        let retryAfter = 6000;
        $.ajax({
            type: "GET",
            url: url,
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
        }).done(function (data, textStatus, xhr) {
            // check state of optimization process 
            retryAfter = (xhr.getResponseHeader("Retry-After") || 1) * 1000;
            if (isWaitingForResults(data.state)) {
                setTimeout(function () {
                    getResults(url);
                }, retryAfter);
            } else {
                displayOptimizationResults(data);
            }
        }).fail(function (data, textStatus, xhr) {
            alert("FAILED!\r\n" + JSON.stringify(data, null, 2));
            setInputFormDisabled(false);
        });
    };

    function isWaitingForResults(state) {
        return state === "Waiting" || state === "Running";
    }

    // process results of optimization, display data on map
    function displayOptimizationResults(data) {
        const bounds = L.latLngBounds();
        const locations = {};
        vehicles = [];

        if (data.state === "Failed") {
            alert("FAILED!\r\n" + JSON.stringify(data, null, 2))
        } else {
            // create new combobox for selecting concrete vehicle
            $("#vehicleSelector").remove();
            const vehicleSelector = $("<select>", {
                id: "vehicleSelector"
            })
            const option = $('<option>', {
                id: "allVehicles",
                value: -1,
                text: "All Vehicles"
            })
            vehicleSelector.append(option);

            // create assoc. array of locations by ids for marker creation 
            data.locations.forEach(function (l) {
                locations[l.location_id] = l.coordinates.split(',');
            });

            // parse plans of tour
            data.plan.forEach(function (plan, vehicleIndex) {

                //create cluster group for markers
                const markerLayer = L.markerClusterGroup({
                    maxClusterRadius: 0.001,
                    spiderfyDistanceMultiplier: 2,
                    showCoverageOnHover: false,
                    zoomToBoundsOnClick: false
                });

                const originCoordinates = locations[plan.activities[0].location_id];
                const destinationCoordinates = locations[plan.activities[plan.activities.length - 1].location_id];
                const waypointsCoordinates = [];

                // parse activities from current plan
                plan.activities.forEach(function (activity, activityIndex) {
                    const coordinates = locations[activity.location_id];
                    if (activityIndex === 0) {
                        const origin = createMarker(coordinates, activity, 'O', 'black', plan.vehicle_id);
                        markerLayer.addLayer(origin);
                    } else if (activityIndex === plan.activities.length - 1) {
                        const destination = createMarker(coordinates, activity, 'D', 'black', plan.vehicle_id);
                        markerLayer.addLayer(destination);
                    } else {
                        const color = colorPallet[vehicleIndex % colorPallet.length];
                        const point = createMarker(coordinates, activity, activityIndex, color, plan.vehicle_id);
                        waypointsCoordinates.push(coordinates.join(','));
                        markerLayer.addLayer(point);
                    }
                });

                markerLayer.addTo(map);
                bounds.extend(markerLayer.getBounds());

                const data = {
                    origin: originCoordinates.join(','),
                    destination: destinationCoordinates.join(','),
                    waypoints: waypointsCoordinates.join('|')
                    // waypoints: waypointsCoordinates //TODO: toto zatial nepojde na produkcii (treba releasnut verziu kde post berie array namiesto | separated string)
                }

                const vehicle = {
                    id: plan.vehicle_id,
                    statistics: plan.statistics,
                    markers: markerLayer
                };

                vehicles.push(vehicle);

                getRoute(plan.vehicle_id, vehicleIndex, data);

                // add new option to created combobox
                const option = $("<option>", {
                    value: plan.vehicle_id,
                    text: "Vehicle " + (vehicleIndex + 1)
                });
                vehicleSelector.append(option);
            });

            // fit map to all markers
            map.fitBounds(bounds);

            $("#vehicleSelectorContainer").append(vehicleSelector);
            setInputFormDisabled(false);
        }

        // event listener for vehicleSelector - show markers for all vehicles or concrete vehicle
        $('#vehicleSelector').change(
            function () {
                const selected = this.value;
                clearMap();
                if (selected === "-1") {
                    vehicles.forEach(function (v) {
                        v.markers.addTo(map);
                        if (v.polyline)
                            v.polyline.addTo(map);
                    });
                    map.fitBounds(bounds);
                } else {
                    vehicles.forEach(function (v) {
                        if (v.id === selected) {
                            v.markers.addTo(map);
                            if (v.polyline)
                                v.polyline.addTo(map);
                            map.fitBounds(v.markers.getBounds());
                        }

                    });
                }
            });
    }

    function createMarker(coordinates, activity, number, color, vehicle_id) {
        const options = {
            isAlphaNumericIcon: true,
            borderColor: color,
            borderWidth: 0,
            backgroundColor: color,
            textColor: "white",
            text: number,
            iconShape: 'marker',
            // iconStyle: 'transform: rotate(45deg)',
            innerIconStyle: 'margin-top: 5px;'
        };
        const marker = new L.marker(coordinates, {
            icon: L.BeautifyIcon.icon(options)
        });
        marker.bindPopup("Vehicle: " + vehicle_id + " <br>Sequence: " + activity.sequence + "<br>Coordinates: " + coordinates.join(",") + "<br>Timestamp: " + activity.timestamp);

        return marker;
    }

    // get route of one vehicle
    function getRoute(vehicleId, vehicleIndex, data) {
        $.ajax({
            type: "POST",
            url: routingUrl,
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(data),
        }).done(function (data, textStatus, xhr) {
            parseRoutingResponse(vehicleId, vehicleIndex, data);
        }).fail(function (data, textStatus, xhr) {
            alert("FAILED!\r\n" + JSON.stringify(data, null, 2));
            setInputFormDisabled(false);
        });
    }

    // parse routing response and show route on map
    function parseRoutingResponse(vehicleId, vehicleIndex, data) {
        const encodedPolylineString = data.routes[0].route;
        if (typeof (encodedPolylineString) === 'undefined') return;
        const polyline = L.Polyline.fromEncoded(encodedPolylineString, {
            color: colorPallet[vehicleIndex % colorPallet.length],
            weight: 3,
            smoothFactor: 1
        });

        vehicles.forEach(function (v) {
            if (v.id == vehicleId) {
                v.polyline = polyline;
            }
        });

        polyline.addTo(map);
    }


    optimize(optimizationInput);
})();