
import * as stateMap from "./states.js";
import * as countyMap from "./county.js";
export {infoBox}
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
let currentLayer;
//JSON LAYERS
let pointGeoJSON;

//Page objects
let infoBox
let mapQuery;
window.onload = () => {
    initialize();
}
function initialize() {
    infoBox = $('.infoBox')
    infoBox.css({ visibility: "hidden"})
    $('#year-text').css({visibility: 'hidden'})
    mapQuery = $('.map-query')
    $('.map-query').toggleClass('collapsed')
    createMap();
    
    getData(map)
    loadPanes();
    loadSlider();
    loadFilters();
    loadQueries();
    
}
function loadPanes() {
    map.createPane("locationMarker")
    map.getPane("locationMarker").style.zIndex = 400;
    map.createPane('popup');
    map.getPane("popup").style.zIndex = 500;
}

function loadFilters() {
    $("input[name='layer']").click(function(e){
        clearCurrentLayer();
        switch (e.target.value) {
            case 'countyLayer':
                countyMap.loadLayer(map)
                currentLayer = countyMap;
                break;
            case 'stateLayer':
                stateMap.loadLayer(map)
                currentLayer = stateMap;
                break;
            case 'noLayer':
                console.log('no layer selected')
                break;
        }
    });
}
function clearCurrentLayer() {
    if (currentLayer) {
    currentLayer.clearLayer(map);
    currentLayer = null;
    }
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
            $('#year-text').css({'visibility': 'visible'})
        }else {
            $('#year-text').html(`Year: 2016-2021`)
            $('#year-text').css({'visibility': 'hidden'})
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

        countyMap.storeData(response)
    });
    $.getJSON('data/STATE_LAYER_WGS84MIN.json').then( function(response) {

        stateMap.storeData(response)
        stateMap.loadLayer(map)
        currentLayer = stateMap;
    });
    };


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
        fillColor: '#FFF',
        color: "#000",   
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8,
        pane: "locationMarker",
    }; 
    return geojsonMarkerOptions;
}
