var map;
var slider;
var currYear = 2016;
let queryYears = false;
let pointLayer;
let pointGeoJSON;
window.onload = () => {
    initialize();
}
function initialize() {
    createMap();
    getData(map)
    loadSlider();
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
    $.getJSON("data/final_data.geojson", function(response){
            pointGeoJSON = response;
            pointLayer = loadPointLayer();
        });
    };
function loadPointLayer() {
    return L.geoJson(pointGeoJSON, {
        filter: function(feature, layer) {
            return !queryYears ? true : currYear == feature.properties.Year;
        },
        pointToLayer: function (feature, latlng){
            //console.log(latlng)
            return L.circleMarker(latlng, stylePoints(feature));
        },
        onEachFeature: (feature, layer) => {
            layer.bindPopup(`<h2> ${feature.properties.city}, ${feature.properties.STATE}</h2> <p> Place: ${feature.properties.place} </p> <p> ${feature.properties.date} </p>` , {
                closeButton: false,
                className: "popup"
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
        bindPopup: "Hello World"
    }; 
    return geojsonMarkerOptions;
}

