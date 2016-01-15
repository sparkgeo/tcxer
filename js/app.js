/**
 * Created by willcadell on 16-01-14.
 */

var map, geoWorkout, geoSplits, options, zone, trailGreen, fileName;

trailGreen = "#008E00";

function secondsToTime(secs) {
    "use strict";
    var hours, minutes, seconds, divisor_for_minutes, divisor_for_seconds, out;
    secs = Math.round(secs);
    hours = Math.floor(secs / (60 * 60));
    divisor_for_minutes = secs % (60 * 60);
    minutes = Math.floor(divisor_for_minutes / 60);
    divisor_for_seconds = divisor_for_minutes % 60;
    seconds = Math.ceil(divisor_for_seconds);
    out = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return out;
}

function calcKmPerHour(distance, time) {
    //distance in km, time in seconds
    "use strict";
    return ((distance / time) * 3600).toFixed(1);
}

function addData(result) {
    "use strict";
    var splits, geom, i, workout, deviceDistance, deviceSpeed, geoDistance, geoSpeed, time, splitM;
    $('#upload-zone').attr("rows", "3");
    $('#upload-zone').text("Nice, now try another...");
    $('#data').css("display", "block");
    $('.filename').text(fileName);

    if (map === undefined) {
      map = L.map('map').setView([54, -122.75], 10);
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
        maxZoom: 18,
        id: 'willcadell.43a18a09',
        accessToken: 'pk.eyJ1Ijoid2lsbGNhZGVsbCIsImEiOiJKbjZwckU0In0.ET9f2IdpUPpsmZsOc_0T-w'
      }).addTo(map);
    }

    workout = tcxParse(result);

    splits = {
        "type": "FeatureCollection",
        "features": []
    };

    geom = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": []
        }
    };

    for (var f in workout.features[0].geometry.coordinates){
        if (!isNaN(parseFloat(workout.features[0].geometry.coordinates[f]))){
            geom.geometry.coordinates.push(workout.features[0].geometry.coordinates[f]);
        }
    }

    deviceDistance = (workout.properties.totalMeters / 1000).toFixed(1)
    geoDistance = turf.lineDistance(geom, 'kilometers').toFixed(1)
    deviceSpeed = calcKmPerHour(deviceDistance, workout.properties.totalSeconds);
    geoSpeed = calcKmPerHour(geoDistance, workout.properties.totalSeconds);
    time = secondsToTime(workout.properties.totalSeconds);

    if (geoDistance > 100){
        splitM = 10;
    } else if (geoDistance > 20){
        splitM = 5;
    } else {
        splitM = 1;
    }

    i = splitM;
    while (geoDistance - i > 0) {
        splits.features.push(turf.along(geom, i, 'kilometers'));
        i += splitM;
    }

    $('#td-sport').html(workout.properties.sport);
    $('#td-time').html(time.h + ":" + time.m + ":" + time.s);
    $('#td-rDist').html(deviceDistance + "km");
    $('#td-rSpeed').html(deviceSpeed + "kph");
    $('#td-gDist').html(geoDistance + "km");
    $('#td-gSpeed').html(geoSpeed + "kph");


    if (map.hasLayer(geoWorkout)) {
      map.removeLayer(geoWorkout);
      map.removeLayer(geoSplits);
    }

    if (isNaN(parseFloat(workout.properties.altitude[0]))) {
      $('#chart_altitude').html("<p class='center-block bg-success'>Sorry, no altitude data detected</p>");
    } else {
      $('#chart_altitude').html('');
      var mmAlt = barChart(workout.properties.altitude, "altitude");
      $('#mm-alt').html("(" +mmAlt[0] + "m - " + mmAlt[1] + "m)");
    }

    if (isNaN(parseFloat(workout.properties.heartrate[0]))) {
      $('#chart_heartrate').html("<p class='center-block bg-success'>Sorry, no heart rate data detected</p>");
    } else {
      $('#chart_heartrate').html('')
      var mmHrt = barChart(workout.properties.heartrate, "heartrate");
      $('#mm-hrt').html("(" + mmHrt[0] + "bpm - " + mmHrt[1] + "bpm)");
    }

    geoWorkout = L.geoJson(geom, {
      weight: 4,
      color: trailGreen,
      opacity: 1
    }).addTo(map);

    geoSplits = L.geoJson(splits, {
      pointToLayer: function (feature, latlng) {
        var content = ((splits.features.indexOf(feature) + 1)*splitM).toString();
        return L.circleMarker(latlng, {
          color: trailGreen,
          fillColor: trailGreen,
          radius: 8,
          fillOpacity:1,
          opacity: 1
        }).bindLabel(content, {
          noHide:true,
          offset:[-8, -10]
        });
      }
    }).addTo(map);

    map.fitBounds(geoWorkout);
}

options = {input: false, type: 'text/xml'};
zone = new FileDrop('upload-zone', options);
zone.event('send', function (files) {
    "use strict";
    files.each(function (file) {
      fileName = file.name;
      file.readData(
        function (xhr){addData($.parseXML(xhr));},
        function (e) {console.log('Terrible error!');},
        'text/xml'
      );
    });
})
