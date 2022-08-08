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
        minZoom: 4,
        maxZoom: 9
    }).setView([37.8, -96], 4);
    L.tileLayer('https://tile.jawg.io/83630003-7ed6-4e40-a284-d12ba35b033f/{z}/{x}/{y}{r}.png?access-token=iLuzn3MqdlZEZksWVEVXqX3SU6o5AWsC94JX05GU2IXGAFxHqFeTqHzSE6LwgKAJ', {
        attribution: '&copy; <a href=\"https://www.jawg.io\" target=\"_blank\">&copy; Jawg</a> - <a href=\"https://www.openstreetmap.org\" target=\"_blank\">&copy; OpenStreetMap</a>&nbsp;contributors',
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
    loadHelpMenu();
    let menu = $('#map-menu')
    let notifierActive = false
    menu.html('')
    let layerBtn = createMenuBtn('svg/layer-icon.svg', 'Layers')
    let pointBtn = createMenuBtn('svg/location.svg', 'Filter Incidents')
    let shareBtn = createMenuBtn('svg/share.svg', 'Share')
    let helpBtn = createMenuBtn('svg/faq.svg', 'Help')
    let layersCont = $('<div>', {
        class:'layers-cont sub-collapsed'
    })

    layerBtn.appendTo(menu)
    let stateOptions = addStateMapOptions();
    let electionOptions = addCountyMapOptions();
    let layerMenu = $('<div>', {
        'class': 'layer-menu-cont'
    })
    layerMenu.append(stateOptions)
    layerMenu.append(electionOptions)
    
    layerMenu.appendTo(layersCont)
    layersCont.appendTo(menu)

    layerBtn.on('click', () => {
        layersCont.toggleClass('sub-collapsed')
        $('#menu').toggleClass('selected')
        pointBtn.toggleClass('mobile-btn-hide')
        shareBtn.toggleClass('mobile-btn-hide')
        helpBtn.toggleClass('mobile-btn-hide')
    })
    helpBtn.on('click', ()=> {
        $('#help-menu').toggleClass('menu-collapsed')
        $('#map-menu').toggleClass('menu-collapsed')
        $('#menu').toggleClass('extended')  
    })

    pointBtn.appendTo(menu)
    pointBtn.attr('id', 'point-filter-btn')
    shareBtn.appendTo(menu)
    helpBtn.appendTo(menu)

    let shareBtnNotfier = () => {
        let cont = $('<div>', {
            'class':'share-btn-notifier-cont'
        })
        let notifier = $('<div>', {
            'class':'share-btn-notifier hide',
            'id':'share-notification',
            'active': 'false'
        })
        let tooltip = $('<div>', {
            'class':'notifier-tooltip'
        })
        tooltip.appendTo(notifier)
        notifier.appendTo(cont)
        return cont
    }
    shareBtn.on('click', ()=> {
        navigator.clipboard.writeText('https://seriousmapper.github.io/SwastikaCounter/');
        if(notifierActive == false) {
            $('#share-notification').toggleClass('hide')
            notifierActive = true
            setTimeout( ()=> {
                $('#share-notification').toggleClass('hide') 
                notifierActive = false
            }, 2000)
        }

    })
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

function loadHelpMenu() {
    let mapQueryDiv = $('#help-menu')
    let header = $('<div/>', {
        'class': 'point-query-header',
        html: '<h2> Frequently Asked Questions </h2>'
    });
    let backBtn = $('<button>', {
        html: 'Go Back'
    })
    let container = $('<div/>', {
        'class': "point-query-container",
        
    })
    let window = $('<div>', {
        'class':'point-filter-window'
    })

    backBtn.on('click', ()=> {
        $('#help-menu').toggleClass('menu-collapsed')
        $('#map-menu').toggleClass('menu-collapsed')
        $('#menu').toggleClass('extended')      
    })
    backBtn.appendTo(header)
    container.appendTo(mapQueryDiv)
    header.appendTo(container)
    window.appendTo(container)
    let questions =["How do I view info for a certain city?",
    
    "Can I see the demographic data for a county or state?",
    "Where did all of the points (reported incidents) go?",
    "How do I change the legend so that I can see different patterns?", 
    "How can I change or remove the base map layer?",
    "How can I filter the reported incidents?",
    "How can I change the time range for the reported incidents?"]
    let answers = ["You can view the info for a certain city by simply clicking on a city within the map. You can view the date of discovery, the website linked to the sighting, and information such as the place and source of publication.",
"Yes, you can! By clicking on a state you can view more detailed demographic data such as the population characteristics.",
"You may have applied a filter that has no visible point data. There is also currently a bug in which the points are drawn below the other layers. Try refreshing the page.",
"You can change the legend by hover over the 'Change Legend' menu on the left side of the screen, then you may select a different legend in the dropdown menu. Legends are represented by quantiles.",
"You can change the displayed layer by hovering over the 'Layers' menu on the left side of the screen. After doing so, you may select the Elecotral Map (by county), Demographic Map (by state) or clear the layers, and display just the reported incidents.",
"You may filter the reported incidents by clicking the 'Filter Incidents' button on the left side of the screen. After doing so, a menu will appear in this panel. You can add the desired filters and remove them as well.",
"On the bottom-left side of the map, there is a time range slider in which you may select your desired time range. You can click the left and right handles to filter the reported incidents in monthly increments. You can also click on the center of the bar to move the selected time range around."]
    for(let i=0; i<questions.length; i ++) {
        var questionCard = $("<div/>", {
            className: 'questionCard',
            css: {
                'text-align':'left',
                'padding':'10px'
            }
        })
        var question = $('<h4>', {
            html:questions[i]
        })
        var answer = $('<p>', {
            html:answers[i]
        })
        question.appendTo(questionCard)
        answer.appendTo(questionCard)
        questionCard.appendTo(window)
    }

}
















