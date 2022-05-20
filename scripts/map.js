import * as stateMap from "./states.js";
import * as countyMap from "./county.js";
import * as pointLayer from './points.js'
import {
    handleSidebarCollapse,
    sideBarCollapsed
} from "./components/sidebar.js";
export {
    infoBox
}
var map;


var currYear = 2016;
let queryYears = false;

//point legend
let qualColors = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']
let categories = []
let selectedFilter = 'source'
let pointLegend = L.control({
    position: 'bottomright'
})

//legend changer
let stateLegendSelect = $('#legend-select-state')
let countyLegendSelect = $('#legend-select-county')
let legendSelectText = $('#legend-select-text')
//point layer
let pointDict = {}
let pointGeoJSON;
let pointFilterMenu;
let appliedFilters = {}
let filterColors = {}
let pointFilter = []
let pointCities = {}
let pointFilters = {}
let pointDisplay = []
let allowedPointFilters = ['category of place', 'media', 'source', 'Nazi Reference']



//Page objects
let infoBox
let mapQuery;

// Current Layer (defines current object) ! polygon
let currentLayer;

window.onload = () => {
    initialize();
}

async function initialize() {

    /* Perform initial hiding  and declaration of page objects */
    infoBox = $('.infoBox')
    infoBox.css({
        visibility: "hidden"
    })
    $('#year-text').css({
        visibility: 'hidden'
    })
    mapQuery = $('.map-query')
    /* End block */


    createMap(); // creates leaflet map
    loadPanes(); // creates panes (for z-indices) for leaflet map
    addCountyMapOptions();
    await addStateMapOptions(); //gets JSON with breaks and variables for statemap
    await getData(map) // asynchronous get data (gets data of state, county and point map)


    loadSlider(); // creates time slider
    loadFilters(); //load point filters
    loadClickEvents(); //click event functions
    console.log(categories)
    countyLegendSelect.hide()





}
/* ########################################################## */
/* ########################################################## */
/*                        MAP CREATION                            */
/* ######################### ################################ */
/* ########################################################## */
function createMap() {
    //create the map


    //add OSM base tilelayer
    map = L.map('map', {
        minZoom: 5,
        maxZoom: 9,
    }).setView([37.8, -96], 5);
    L.tileLayer('https://tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=iLuzn3MqdlZEZksWVEVXqX3SU6o5AWsC94JX05GU2IXGAFxHqFeTqHzSE6LwgKAJ', {}).addTo(map);

};
function loadPanes() {
    map.createPane("locationMarker")
    map.getPane("locationMarker").style.zIndex = 401;
    map.createPane('popup');
    map.getPane("popup").style.zIndex = 500;
    map.createPane("pointFilter")
    map.getPane("pointFilter").style.zIndex = 450;
    map.createPane("labels")
    map.getPane("labels").style.zIndex = 400;

};

async function getData(map) {

    $.getJSON('data/counties.json').then(function (response) {

        countyMap.storeData(response)
    }).then(
    //state layer, just to show state borders ! interactive:false
 
    $.getJSON('data/STATE_LAYER_WGS_REFAC.json').then(function (response) {

        stateMap.storeData(response)

        stateMap.loadLayer(map)
        currentLayer = stateMap;
        stateMap.setParent(this)

    })).then(
        $.getJSON('data/STATE_LAYER_WGS_REFAC.json').then(function (response) {



            L.geoJson(response, {
                style: {
                    fillOpacity: 0,
                    interactive: false,
                    weight: 1.0,
                    color: "#000",
                    pane: "labels"
                },
                onEachFeature: function (feature, layer) {
                    layer.on('mouseover', () => {
                        console.log(feature)
                    })
                }
            }).addTo(map);
        })).then(
    $.getJSON("data/swastika_geocoded.geojson").then(async function (response) {
        pointLayer.storeData(response)
        pointLayer.loadLayer(map)


    }));
};
function addCountyMapOptions() {
    const options = [12, 16, 20]
    let optionCont = $('#legend-select-county')
    options.forEach(option => {
        optionCont.append($('<option>', {
            value: option,
            text: `20${option} U.S. Presidential Election`
        }))
    })
    optionCont.change((e) => {
        let value = e.target.value
        countyMap.resetMapLayer(map, value)
    })

}
async function addStateMapOptions() {
    let options = await stateMap.loadBreaks()
    let optionKeys = Object.keys(options)
    let optionCont = $('#legend-select-state')
    optionKeys.forEach(option => {
        optionCont.append($('<option>', {
            value: option,
            text: options[option]['NAME']
        }))

    })
    optionCont.change((e) => {
        let value = e.target.value
        stateMap.resetMapLayer(map, value)
    })
    return

}


/* ########################################################## */
/* ########################################################## */
/*                        --UI RELATED--                          */
/* ######################### ################################ */
/* ########################################################## */

function createPointFilters() {
    let div;
    let filterArray = []
    let container = $('<div/>', {
        'class': "point-query-container",
    })
    let header = $('<div/>', {
        'class': 'point-query-header',
        html: '<h2> Filter Incidents By </h2>'
    });

    header.appendTo(container)
    allowedPointFilters.forEach((property_name) => {
        let itemContainer = $('<div>', {
            'class': 'point-filter-item-container',
        })
        let btn = $('<h3>', {
            html: property_name
        })
        let itemDiv = $('<div/>', {
            'class': 'point-filter-items',
        });
        btn.appendTo(itemContainer)
        itemDiv.appendTo(itemContainer)
        btn.on('click', () => {
            itemDiv.toggleClass('open')
        })
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
            checkBox.prop('checked', () => {
                if (typeof (appliedFilters[property_name]) !== 'undefined') {
                    if (appliedFilters[property_name].includes(property)) {
                        return true
                    }



                    return false
                }
            })
            filterArray.push(checkBox[0])
            let checkBoxLabel = $('<label/>', {
                for: 'checkbox-' + property,
                html: property

            })

            checkBox.appendTo(itemDiv)
            checkBoxLabel.appendTo(itemDiv)


        })
        itemContainer.appendTo(container)
        return itemContainer;

    })
    pointFilter = filterArray
    return container;

}
function createPointLegend() {
    map.removeControl(pointLegend)
    pointLegend.addTo(map)



}
function loadSlider() {
    $('.slider').on('input', (e) => {
        if (queryYears) {
            console.log(e.target.value)
            currYear = e.target.value;

            map.removeLayer(pointLayer)
            pointLayer = loadPointLayer();
            $('#year-text').html(`Year: ${currYear}`)
            filterPoints();
        }

    });
    $("#show-all").click(() => {
        queryYears = !queryYears;
        map.removeLayer(pointLayer)
        pointLayer = loadPointLayer();
        let btnText = queryYears ? 'Show All Years' : 'Change Years'
        filterPoints();
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



pointLegend.onAdd = () => {
    let filterKeys = Object.keys(filterColors)
    var div = L.DomUtil.create('div', 'info legend')
    var divHTML = `<h3> Incidents (by filter) </h3>` + '<div class="legend-flex">'
    filterKeys.forEach(key => {
        divHTML += '<div class="legend-body"> <h4>' + key + '</h4>'
        let values = Object.keys(filterColors[key])
        values.forEach(value => {
            divHTML += '<br> <i style="background:' + qualColors[filterColors[key][value]] + '"></i> ' + value;
        })
        divHTML += '</div>'
    })
    divHTML += '</div>'
    div.innerHTML = divHTML

    return div;



}
function loadFilters() {
    $("input[name='layer']").click(function (e) {
        clearCurrentLayer();
        stateLegendSelect.hide()
        countyLegendSelect.hide()
        legendSelectText.html('')
        switch (e.target.value) {
            case 'countyLayer':
                legendSelectText.html('Change County Legend:')
                countyMap.loadLayer(map)
                currentLayer = countyMap;
                countyLegendSelect.show()
                break;
            case 'stateLayer':
                legendSelectText.html('Change State Legend:')
                stateMap.loadLayer(map)
                currentLayer = stateMap;
                stateLegendSelect.show()
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





function getPointColor(property) {
    if (categories.length < qualColors.length) {
        if (!categories.includes(property)) {
            categories.push(property)

        }
        let index = categories.indexOf(property)
        return qualColors[index]
    }
    return 'undefined';
}

function filterPoints() {
    map.removeControl(pointLegend)
    let currentFilter = {}
    filterColors = {}
    let colorIndex = 0
    let legendDiv = '';
    pointFilter.forEach((filter) => {
        if ($(filter).prop("checked")) {
            if (typeof (currentFilter[filter.name]) === "undefined") {
                currentFilter[filter.name] = []
                filterColors[filter.name] = {}

            }
            currentFilter[filter.name].push(filter.value)
            filterColors[filter.name][filter.value] = colorIndex
            colorIndex += 1
        }
    })
    if (currentFilter !== {}) {
        applyPointFilter(currentFilter)
        appliedFilters = currentFilter
        if (colorIndex > 0) {
            createPointLegend();
        }

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
    let colorIndex = 0;
    filterKeys.forEach((key) => {
        if (filter[key].includes(feature.properties[key])) {
            style = {
                fillColor: qualColors[filterColors[key][feature.properties[key]]],
                pane: "pointFilter"
            }
        }
    })
    if (!style) {
        style = stylePoints(feature)
    }

    return style;
}






function createPointFeatureDictionary() { //subset of the point geojson, used to concactenate points dict[point] = [...incident]
    pointGeoJSON.features.forEach(feature => {
        addFeatureToQuery(feature)
    })
}

function loadPointLayer() {
    return L.geoJson(pointGeoJSON, {

        filter: function (feature, layer) {
            return !queryYears ? true : currYear == feature.properties.year;
        },
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, stylePoints(feature));

        },
        onEachFeature: (feature, layer) => {
            let cityState = feature.properties.city_state;
            layer.bindPopup(`<h2> ${feature.properties.city_state}</h2>`, {
                closeButton: false,
                className: "popup",
                pane: 'popup'
            });
            layer.on('mouseover', function () {
                layer.openPopup(),
                    layer._popup.setContent(`<h2> ${feature.properties.city_state}</h2> <p> Number of incidents: <b> ${pointCities[cityState].length} </b> <br> <br> <b> Click </b>for more info</p>`)
                /*  displayText(feature.properties.city_state,`<p> Number of incidents: <b> ${pointCities[cityState].length} </b> <br> <br> <b> Click </b>for more info</p>` ) */
            });
            layer.on('mouseout', function () {
                layer.closePopup();
                hideBox();
            });
            layer.on('click', () => {

                let mapQueryDiv = $('#query-container')
                let html = `<div class='point-query-container'> <div class='point-query-header'> <h2> ${cityState} </h2> <h4> Reported Incidents: ${pointCities[cityState].length} </div> `
                html += populateQuery(pointCities[cityState])
                html += "</div>"
                mapQueryDiv.html(html)
                if (sideBarCollapsed) {
                    console.log(sideBarCollapsed)
                    handleSidebarCollapse();

                }
            })
            
            processPointProperties(feature.properties)

        }

    }).addTo(map);
}

function addFeatureToQuery(feature) {
    let cityState = feature.properties.city_state

    if (typeof (pointCities[cityState]) === 'undefined') {
        pointCities[cityState] = [];
    }
    pointCities[cityState].push(feature)

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
    features.forEach((feature) => {
        div += loadCard(feature.properties)

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
        <li> <b>Source:</b> ${properties['source']}</li>
        
    </ul>
</div>`
}

function stylePoints(feature) {
    let pointColor = getPointColor(feature.properties[selectedFilter])
    var geojsonMarkerOptions = {
        radius: 5,
        fillColor: '#FFF',
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 1.0,
        pane: 'locationMarker',
    };
    return geojsonMarkerOptions;
}