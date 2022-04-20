var map;
var slider;
let legend;
var currYear = 2016;
let queryYears = false;
let showElectionData = false;
let queryPoints = false;
//MAP LAYERS
let pointLayer;
let countyLayer;
let currentPolyLayer;
//JSON LAYERS
let pointGeoJSON;
let election2020JSON;

//Page objects
let infoBox
let mapQuery;
window.onload = () => {
    initialize();
}
function initialize() {
    infoBox = $('.infoBox')
    infoBox.css({ visibility: "hidden"})
    mapQuery = $('.map-query')
    $('.map-query').toggleClass('collapsed')
    createMap();
    
    getData(map)
    loadPanes();
    loadSlider();
    loadFilters();
    loadQueries();
    legend.addTo(map);
}
function loadPanes() {
    map.createPane("locationMarker")
    map.getPane("locationMarker").style.zIndex = 400;
    map.createPane('popup');
    map.getPane("popup").style.zIndex = 500;
}
function loadFilters() {
    let electionBtn = $("#show-election-data")
    electionBtn.click( () => {
        console.log(election2020JSON)
        showElectionData = !showElectionData;
        if (showElectionData) {
            infoBox.css({ visibility: "visible"})
            countyLayer = loadElectionLayer(election2020JSON);
            electionBtn.html('Hide US County Elections')
        }else {
            infoBox.css({ visibility: "hidden"})
            map.removeLayer(countyLayer)
            electionBtn.html('Show US County Elections')
        }
    })
}
function loadQueries() {
    let queryPts = $('#show-point-query')
    queryPts.click( () => {
        $('#point-query').appendTo($('.map-query'))
        $('.map-query').toggleClass('collapsed')

    })
}
function loadSlider() {
    $('.slider').on('input', (e) => {
        if (queryYears) {
        console.log(e.target.value)
        currYear = e.target.value;
        map.removeLayer(pointLayer)
        pointLayer = loadPointLayer();
        $('#year-text').html(`Year: ${currYear}`)
    }

    });
    $("#show-all").click( () => {
        queryYears = !queryYears;
        map.removeLayer(pointLayer)
        pointLayer = loadPointLayer();
        let btnText = queryYears ? 'Show All Years' : 'Query Years'
        if (queryYears) {
            $('#year-text').html(`Year: ${currYear}`)
            $('.slider').css({'width': '30%', 'visibility': 'visible'})
        }else {
            $('#year-text').html(`Year: 2016-2021`)
            $('.slider').css({'width': '0%', 'visibility': 'hidden'})
        }
        console.log(queryYears)
        $('#show-all').html(btnText)

    })

}
function updateSlider(e) {
    
    
}
function createMap(){
    //create the map
    

    //add OSM base tilelayer
    map = L.map('map').setView([37.8, -96], 5);
        L.tileLayer('https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=iLuzn3MqdlZEZksWVEVXqX3SU6o5AWsC94JX05GU2IXGAFxHqFeTqHzSE6LwgKAJ', {}).addTo(map);
        map.attributionControl.addAttribution("<a href=\"https://www.jawg.io\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors")
    //call getData function
};


function getData(map){
    $.getJSON("data/swastika_geocoded.geojson").then( function(response){
            pointGeoJSON = response;
            pointLayer = loadPointLayer();
        });
    $.getJSON('data/counties_election.geojson').then( function(response) {

        election2020JSON = response;
        



    });
    };
function loadElectionLayer(county_data) {
    return L.geoJson(county_data, {
            style: style,
            onEachFeature: onEachFeature
    }).addTo(map);
}
function loadPointLayer() {
    return L.geoJson(pointGeoJSON, {
        filter: function(feature, layer) {
            return !queryYears ? true : currYear == feature.properties.year;
        },
        pointToLayer: function (feature, latlng){
            //console.log(latlng)
            return L.circleMarker(latlng, stylePoints(feature));
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<h2> ${feature.properties.city_state}</h2> <p> Place: ${feature.properties.place} </p> <p> ${feature.properties.date} </p>` , {
                closeButton: false,
                className: "popup",
                pane:'popup'
            });
            layer.on('mouseover', function() { layer.openPopup(); });
            layer.on('mouseout', function() { layer.closePopup(); });

        }
        
    }).addTo(map);
}
function stylePoints(feature) {
    var geojsonMarkerOptions = {
        radius: 4,
        fillColor: '#000',
        color: "transparent",   
        weight: 4,
        opacity: 1,
        fillOpacity: 0.8,
        bindPopup: "Hello World",
        pane: "locationMarker",
    }; 
    return geojsonMarkerOptions;
}
legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {

        var div = L.DomUtil.create('div', 'info legend'),
            quantile = ['100', '75', '50', '25', '0', '25', '50', '75'],
            grades = [-1.00, -0.75, -0.50, -0.25, 0.00, 0.25, 0.50, 0.75],
            labels = [],
            from, to;

        for (var i = 0; i < grades.length; i++) {
            from = grades[i];
            to = grades[i + 1];

            labels.push(
                '<i style="background:' + getColor(from + 0.01) + '"></i> ' +
                quantile[i] + (quantile[i+1] ? '&ndash;' + quantile[i+1] : '&ndash;100'));
        }

        div.innerHTML = labels.join('<br>');
        return div;
    };

    
function getColor(d) {
    return d > 0.750 ? '#C93135' :
              d > 0.500 ? '#DB7171' :
                d > 0.250 ? '#EAA9A9' :
                  d > 0.000 ? '#FCE0E0' :
                    d > -0.250 ? '#CEEAFD' :
                        d > -0.500 ? '#92BDE0' :
                            d > -0.750 ? '#5295CC' :
                                            '#1375B7';
}
function style(feature) {
    return {
        weight: 0.6,
        opacity: 0.8,
        color: 'white',
        fillOpacity: 1,
        fillColor: getColor(feature.properties.per_point_diff)
    };
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 2,
        color: '#ADFF2F',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
    updateInfoBox(layer.feature)


}
function clearInfoBox() {
    infoBox.html(`
    <h3> Hover over a county </h3>`)
}
function updateInfoBox(feature) {
    feature = feature.properties    
    infoBox.html(`
    <h3> ${feature.name_y}, ${feature.state_name}  </h3> 
    <ul>
    <li> Percent Democrat: ${feature.per_dem.toFixed(2)}</li>
    <li> Percent GOP: ${feature.per_gop.toFixed(2)} </li>
    <li> Normalized Difference: ${feature.per_dem.toFixed(2)} </li>
     </ul>
    `)
}
function resetHighlight(e) {
    countyLayer.resetStyle(e.target);
    clearInfoBox();
}

function zoomToFeature(e) {
    console.log(map)
    map.fitBounds(e.target.getBounds());
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}
