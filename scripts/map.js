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




//point legend
let stateMapOptions;
let selectedOption = 'PCT_JEW_TO'
//legend changer
let stateLegendSelect = $('#legend-select-state')
let countyLegendSelect = $('#legend-select-county')
let legendSelectText = $('#legend-select-text')
//point layer

let outlineLayer;



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

    loadPanes();
    // creates panes (for z-indices) for leaflet map
    stateMapOptions = await stateMap.loadBreaks();
    await getData(map) // asynchronous get data (gets data of state, county and point map)

    loadMainMenu();
    countyLegendSelect.hide()
    setPanes();
    pointLayer.loadClickEvents()
    reloadMap('state', selectedOption)





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
        maxZoom: 9
    }).setView([37.8, -96], 5);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd'}).addTo(map);

};
function loadPanes() {
    map.createPane("locationMarker")
    map.getPane("locationMarker").style.zIndex =3;
    map.createPane('popup');
    map.getPane("popup").style.zIndex = 4;
    map.createPane("pointFilter")
    map.getPane("pointFilter").style.zIndex = 3;
    map.createPane("labels")
    map.getPane("labels").style.zIndex = 10;
    map.createPane("map")
    map.getPane("map").style.zIndex = 1;

};
function setPanes() {
    map.getPane("locationMarker").style.zIndex =3;
    map.getPane("popup").style.zIndex = 4;
    map.getPane("pointFilter").style.zIndex = 3;
    map.getPane("map").style.zIndex = 5000;
    map.getPane("labels").style.zIndex = 4999;
    map.getPane("labels").style.pointerEvents = 'none';
    map.getPane("map").style.pointerEvents = 'unset';
    map.getPane("overlayPane").style.zIndex = 5001;

}

async function getData(map) {

    await $.getJSON('data/counties.json').then(function (response) {

        countyMap.storeData(response)
       
        return true
    }).then(
    //state layer, just to show state borders ! interactive:false
 
    await $.getJSON('data/STATES_JSON.json').then(function (response) {

        stateMap.storeData(response)

        stateMap.loadLayer(map)
        currentLayer = stateMap;
        stateMap.setParent(this)
        return true

    })).then( 
        setTimeout(() => {
            return true
        }, 100)
    )

    await $.getJSON("data/swastika_geocoded_final.geojson").then(async function (response) {
        console.log(response)
        pointLayer.storeData(response)
        pointLayer.loadLayer(map)
        return true


    });
    
};
function addCountyMapOptions() {
    const options = [12, 16, 20]
    let optionCont = $('<div>', {
        'class': 'label-menu',
        'html': '<h4> Electoral </h4>'
    })
    options.forEach(option => {
        let input = $('<input>', {
            type:'radio',
            name:'layers',
            value: option,
            id: option+'-radio',
            checked: option == selectedOption
            
        })
        optionCont.append(input)
        input.on('click', (e)=> {
            selectedOption = e.target.value;
            reloadMap('county', selectedOption)
        })
        optionCont.append($('<label>', {
            for:option+'-radio',
            'html': `20${option} Presidential Election`
        })
    )
})
    return optionCont;

}
function addStateMapOptions() {
    let options = stateMapOptions;
    let optionKeys = Object.keys(options)
    let optionCont = $('<div>', {
        'class': 'label-menu',
        'html': '<h4> Demographic </h4> '
    })
    optionKeys.forEach(option => {
        let input = $('<input>', {
            type:'radio',
            name:'layers',
            value: option,
            id: option+'-radio',
            checked: option == selectedOption
            
        })
        input.on('click', (e)=> {
            selectedOption = e.target.value;
            reloadMap('state', selectedOption)
        })
        optionCont.append(input)
        optionCont.append($('<label>', {
            for:option+'-radio',
            'html': options[option]['NAME']
        })
    )
})
    return optionCont;

}


/* ########################################################## */
/* ########################################################## */
/*                        --UI RELATED--                          */
/* ######################### ################################ */
/* ########################################################## */


function loadMainMenu() {
    let menu = $('#map-menu')
    menu.html('')
    let layerBtn = createMenuBtn('svg/layer-icon.svg', 'Layers')
    let pointBtn = createMenuBtn('svg/location.svg', 'Filter Incidents')
    let shareBtn = createMenuBtn('svg/share.svg', 'Share')
    let helpBtn = createMenuBtn('svg/faq.svg', 'Help')
    let helpShare = $('<div>', {
        css: {
            'width': '100%'
        }
    })
    helpShare.css({
        'flex':'none'
    })

    layerBtn.appendTo(menu)
    let stateOptions = addStateMapOptions();
    let electionOptions = addCountyMapOptions();
    let layerMenu = $('<div>', {
        'class': 'layer-menu-cont sub-collapsed'
    })
    layerMenu.append(stateOptions)
    layerMenu.append(electionOptions)
    
    layerBtn.append(layerMenu)

    layerBtn.on('click', () => {
        layerMenu.toggleClass('sub-collapsed')
    })

    pointBtn.appendTo(menu)
    pointBtn.attr('id', 'point-filter-btn')
    shareBtn.appendTo(helpShare)
    helpBtn.appendTo(helpShare)
    helpShare.appendTo(menu)
}

function createMenuBtn(icon, text) {
    let menuCont = $('<div>', {
        'class': 'menu-btn-cont'
    })
    let btnContainer = $('<div>', {
        'class': 'menu-btn',
    })
    let svg = $('<img>', {
        'class': 'icon',
        'src':icon
    })
    let btn = $('<div>', {
        'html':text,
        'class': 'menu-btn-text'
    })

    svg.appendTo(btnContainer)
    btn.appendTo(btnContainer)
    btnContainer.appendTo(menuCont)
    return menuCont;

}

function reloadMap(type, val) {
        clearCurrentLayer();
        pointLayer.refreshLegend();
        switch (type) {
            case 'county':

                countyMap.loadLayer(map)
                countyMap.resetMapLayer(map, val)
                
                currentLayer = countyMap;
                
                break;
            case 'state':
                stateMap.loadLayer(map)
                stateMap.resetMapLayer(map, val)
                currentLayer = stateMap;
                
                
                break;
            case 'none':
                console.log('no layer selected')
                break;
        }
        
;
}

function clearCurrentLayer() {
    if (currentLayer) {
        currentLayer.clearLayer(map);
        currentLayer = null;
    }
}


















