import * as stateMap from "./states.js";
import * as countyMap from "./county.js";
export {
    infoBox
}
var map;
var slider;
let legend;
let sideBarCollapsed = false
var currYear = 2016;
let queryYears = false;
let showElectionData = false;
let queryPoints = false;

let pointFilterMenu;
let pointFilter = []
//MAP LAYERS
let pointLayer;
let countyLayer;
let currentLayer;
//JSON LAYERS
let pointGeoJSON;
let pointCities = {}
let pointFilters = {}
let allowedPointFilters = ['category of place', 'media', 'source', 'Nazi Reference']
//Page objects
let infoBox
let mapQuery;
window.onload = () => {
    initialize();
}

function initialize() {
    infoBox = $('.infoBox')
    infoBox.css({
        visibility: "hidden"
    })
    $('#year-text').css({
        visibility: 'hidden'
    })
    mapQuery = $('.map-query')
    sideBarCollapsed = true;
    createMap();

    getData(map)

    loadPanes();
    loadSlider();
    loadFilters();
    loadClickEvents();


}

function loadPanes() {
    map.createPane("locationMarker")
    map.getPane("locationMarker").style.zIndex = 400;
    map.createPane('popup');
    map.getPane("popup").style.zIndex = 500;
    map.createPane("pointFilter")
    map.getPane("pointFilter").style.zIndex = 450;
}

function loadFilters() {
    $("input[name='layer']").click(function (e) {
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

function loadClickEvents() {
    let collapseBtn = $('#collapse-btn')
    let pointFilterBtn = $('#point-filter-btn')
    let mapQueryDiv = $('#query-container')

    collapseBtn.click(() => {
        handleSidebarCollapse();
    });

    pointFilterBtn.click(() => {
        if (sideBarCollapsed) {
            handleSidebarCollapse();
        }
        if (!pointFilterMenu) {
            pointFilterMenu = createPointFilters()

        }
        mapQueryDiv.html("")
        pointFilterMenu.appendTo(mapQueryDiv)


    })

}

function createPointFilters() {
    let div;
    let container = $('<div/>', {
        'class': "point-query-container",
    })
    let header = $('<div/>', {
        'class': 'point-query-header',
        html: '<h2> Filter Points By </h2>'
    });

    header.appendTo(container)
    allowedPointFilters.forEach((property_name) => {
        let itemDiv = $('<div/>', {
            'class': 'point-query-items',
            html: `<h4> ${property_name} </h4>`
        });
        pointFilters[property_name].forEach((property) => {
            let checkBox = $('<input/>', {
                type: 'checkbox',
                name: property_name,
                id: 'checkbox-' + property,
                value: property,
                html: `<label for="${property}"> ${property} </label>`,

            })
            checkBox.change(() => {
                filterPoints()
            })
            pointFilter.push(checkBox[0])
            let checkBoxLabel = $('<label/>', {
                for: 'checkbox-' + property,
                html: property

            })

            checkBox.appendTo(itemDiv)
            checkBoxLabel.appendTo(itemDiv)


        })
        itemDiv.appendTo(container)
        return itemDiv;

    })

    return container;

}

function filterPoints() {
    let currentFilter = {}
    pointFilter.forEach((filter) => {
        if ($(filter).prop("checked")) {
            if (typeof (currentFilter[filter.name]) === "undefined") {
                currentFilter[filter.name] = []

            }
            currentFilter[filter.name].push(filter.value)
        }
    })
    if (currentFilter !== {}) {
    applyPointFilter(currentFilter)
}
}

function applyPointFilter(filter) {
    pointLayer.eachLayer(function (layer) {
        let feature = layer.feature
        layer.setStyle(
            stylePointFilter(filter, feature))
    })
}
function stylePointFilter(filter, feature) {
    let filterKeys = Object.keys(filter)
    let style;
    filterKeys.forEach((key) => {
        if(filter[key].includes(feature.properties[key])) {
            style = {
                fillColor: "red",
                pane: "pointFilter"
            }
        }
    })
    if (!style) {
        style = stylePoints(feature)
    }
    
    return style;
}

function handleSidebarCollapse() {
    let collapseBtn = $('#collapse-btn')
    sideBarCollapsed = !sideBarCollapsed
    $('.map-query').toggleClass('collapsed')
    if (sideBarCollapsed) {
        collapseBtn.html("<-")
    } else {
        collapseBtn.html("->")
    }
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
    $("#show-all").click(() => {
        queryYears = !queryYears;
        map.removeLayer(pointLayer)
        pointLayer = loadPointLayer();
        let btnText = queryYears ? 'Show All Years' : 'Query Years'
        if (queryYears) {
            $('#year-text').html(`Year: ${currYear}`)
            $('.slider').css({
                'width': '30%',
                'visibility': 'visible'
            })
            $('#year-text').css({
                'visibility': 'visible'
            })
        } else {
            $('#year-text').html(`Year: 2016-2021`)
            $('#year-text').css({
                'visibility': 'hidden'
            })
            $('.slider').css({
                'width': '0%',
                'visibility': 'hidden'
            })
        }
        console.log(queryYears)
        $('#show-all').html(btnText)

    })

}

function updateSlider(e) {


}

function createMap() {
    //create the map


    //add OSM base tilelayer
    map = L.map('map').setView([37.8, -96], 5);
    L.tileLayer('https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=iLuzn3MqdlZEZksWVEVXqX3SU6o5AWsC94JX05GU2IXGAFxHqFeTqHzSE6LwgKAJ', {}).addTo(map);
    map.attributionControl.addAttribution("<a href=\"https://www.jawg.io\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors")
    //call getData function
};


async function getData(map) {
    $.getJSON("data/swastika_geocoded.geojson").then(function (response) {
        pointGeoJSON = response;
        pointLayer = loadPointLayer();

    });
    $.getJSON('data/counties_election.geojson').then(function (response) {

        countyMap.storeData(response)
    });
    $.getJSON('data/STATE_LAYER_WGS84MIN.json').then(function (response) {

        stateMap.storeData(response)
        stateMap.loadLayer(map)
        currentLayer = stateMap;
    });
};


function loadPointLayer() {
    return L.geoJson(pointGeoJSON, {
        filter: function (feature, layer) {
            return !queryYears ? true : currYear == feature.properties.year;
        },
        pointToLayer: function (feature, latlng) {
            //console.log(latlng)
            return L.circleMarker(latlng, stylePoints(feature));
        },
        onEachFeature: (feature, layer) => {
            let cityState = feature.properties.city_state;
            layer.bindPopup(`<h2> ${feature.properties.city_state}</h2> <p> Number of incidents: ${feature.properties.place} </p> <p> ${feature.properties.date} </p>`, {
                closeButton: false,
                className: "popup",
                pane: 'popup'
            });
            layer.on('mouseover', function () {
                layer.openPopup(),
                    layer._popup.setContent(`<h2> ${feature.properties.city_state}</h2> <p> Number of incidents: ${pointCities[cityState].length} </p>`)
            });
            layer.on('mouseout', function () {
                layer.closePopup();
            });
            layer.on('click', () => {

                let mapQueryDiv = $('#query-container')
                let html = `<div class='point-query-container'> <div class='point-query-header'> <h2> ${cityState} </h2> <h4> Reported Incidents: ${pointCities[cityState].length} </div> `
                html += populateQuery(pointCities[cityState])
                html += "</div>"
                mapQueryDiv.html(html)
                if (sideBarCollapsed) {
                    handleSidebarCollapse();

                }
            })
            addFeatureToQuery(feature)
            processPointProperties(feature.properties)

        }

    }).addTo(map);
}

function addFeatureToQuery(feature) {
    let cityState = feature.properties.city_state

    if (typeof (pointCities[cityState]) === 'undefined') {
        pointCities[cityState] = [];
    }
    pointCities[cityState].push(feature.properties)

}

function processPointProperties(properties) {
    let keys = Object.keys(properties)
    for (let property in Object.keys(properties)) {
        let propertyName = keys[property]
        if (typeof (pointFilters[propertyName]) === "undefined") {
            console.log(propertyName)
            pointFilters[propertyName] = []

        }
        if (!pointFilters[propertyName].includes(properties[propertyName])) {
            pointFilters[propertyName].push(properties[propertyName])
        }
    }


}

function populateQuery(features) {
    let div = ""
    features.forEach((properties) => {
        div += loadCard(properties)

    })
    return div;

}

function loadCard(properties) {
    return `<div class="query-card">
    <ul>
        <li> <b>Date of discovery or report:</b> ${properties['date of discovery or report']} </li>
        <li> <b>Website:</b> <a href="${properties['website']}"> ${properties['website'].substring(0, 25)}... </a> </li>
        <li> <b>Category of Place:</b> ${properties['category of place']} </li>
        <li> <b>Structure:</b> ${properties['structure']} </li>
        <li> <b>Media:</b> ${properties['media']} </li>
        <li> <b>Nazi Reference:</b> ${properties['Nazi Reference']}</li>
        <li> <b>Source:</b> ${properties['source']}</li>
        
    </ul>
</div>`
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