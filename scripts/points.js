export {storeData, loadLayer}


import {
    handleSidebarCollapse,
    sideBarCollapsed
} from "./components/sidebar.js";


let pointGeoJSON;
let pointCities = {}
let pointFilters = {}
let pointLayer;

let map;
let svg;
let filterApplied = false;
let pointRadius;
var currYear = 2016;
let queryYears = false;
let cityStateFilter;
let pointSingular = []; //data wrapper for individual cities
let filters = {"category of place": [], "source": [],  "media":[]}
function storeData(json) {
    pointGeoJSON = json
}
async function loadLayer(global_map) {
    await createPointFeatureDictionary();
    loadClickEvents();
    pointRadius = defineRadius();
    map = global_map
    L.svg({clickable:true}).addTo(map)
    pointLayer = d3Layer(pointSingular);
}
function createPointFeatureDictionary() { //subset of the point geojson, used to concactenate points dict[point] = [...incident]
    pointGeoJSON.features.forEach(feature => {
        addFeatureToQuery(feature)
    })
}
function loadClickEvents() {
    let pointFilterBtn = $('#point-filter-btn')
    let mapQueryDiv = $('#query-container')

    /*     collapseBtn.click(() => {
            mapQueryDiv.html('')
            handleSidebarCollapse();
        }); */

    pointFilterBtn.click(() => {
        if (sideBarCollapsed) {
            handleSidebarCollapse();
        }
        mapQueryDiv.html("")
        let groupTest = d3.group(pointGeoJSON.features, d => d.properties['category of place'])
        loadFilterMenu();


    })

}
function loadFilterMenu() {
    let availFilters = Object.keys(filters)
    let mapQueryDiv = $('#query-container')
    let checked = []
    const filterBtn = (filter, property) => {
        let id = ('button-' + filter + property).replaceAll(' ', '-')
        let btn = $('<button>', {
            html: property,
            id: id
        })
        btn.on('click', () => {
            let checkBoxId = ('checkbox-' + filter + property).replaceAll(' ', '-')
            let index = filters[filter].indexOf(property)
            filters[filter].splice(index, 1)
            $(`#${checkBoxId}`).prop('checked', false)
            let btnId = ('button-' + filter + property).replaceAll(' ', '-')
            $(`#${btnId}`).remove()
            filterPoints();
        })
        btn.on('mouseover', () => {
            highlightPoints(filter, property)
        })
        btn.on('mouseout', () => {
            filterPoints();
        })
        return btn
    }
    let container = $('<div/>', {
        'class': "point-query-container",
    })
    let header = $('<div/>', {
        'class': 'point-query-header',
        html: '<h2> Filter Incidents By </h2>'
    });
    let filterList = $('<div>', {
        'class': 'point-query-filters',
        html: 'Applied Filters:'
    })
    header.appendTo(container)
    
    container.appendTo(mapQueryDiv)
    availFilters.forEach( filter => {
        let group = d3.group(pointGeoJSON.features, d => d.properties[filter])
        
        let groupKeys = Array.from(group.keys())
        groupKeys.sort(function(a, b) {
            return group.get(b).length - group.get(a).length
        })
        let itemContainer = $('<div>', {
            'class': 'point-filter-item-container',
        })
        let btn = $('<h3>', {
            html: filter
        })
        let itemDiv = $('<div/>', {
            'class': 'point-filter-items',
        });
        btn.appendTo(itemContainer)
        itemDiv.appendTo(itemContainer)
        btn.on('click', () => {
            itemDiv.toggleClass('open')
        })
        groupKeys.forEach(property => {
            let propertyText = property === '' ? 'None' : property;
            let checkBoxId = ('checkbox-' + filter + property).replaceAll(' ', '-')
            let checkBox = $('<input/>', {
                type: 'checkbox',
                name: filter,
                id: checkBoxId,
                value: property,
                html: `<label for="${property}"> )</label>`,


            })

            checkBox.change(() => {
                if(checkBox.prop('checked')) {
                    filters[filter].push(property)
                    let newBtn = filterBtn(filter, property)
                    newBtn.appendTo(filterList)
                    console.log(newBtn)

                } else {
                    let index = filters[filter].indexOf(property)
                    filters[filter].splice(index, 1)
                    let btnId = ('button-' + filter + property).replaceAll(' ', '-')
                    $(`#${btnId}`).remove()
                    
                }
                filterPoints()
            })
            
            checkBox.prop('checked', () => {
                    if (filters[filter].includes(property)) {
                        let newBtn = filterBtn(filter, property)
                        newBtn.appendTo(filterList)                   
                        return true
                    }
                    return false
            })
            
            let checkBoxLabel = $('<label/>', {
                for: checkBoxId,
                html: `${propertyText} <b> (${group.get(property).length}) </b>`

            })
            checkBoxLabel.on('mouseover', () => {
                highlightPoints(filter, property)
            })
            checkBoxLabel.on('mouseout', () => {
                filterPoints();
            })
            checkBox.appendTo(itemDiv)
            checkBoxLabel.appendTo(itemDiv)
        })
        itemContainer.appendTo(container)
    })
    filterList.appendTo(container)
}
var tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10000000")
    .style("visibility", "hidden")
    .style("background", "#000")
    .attr('class', 'popup')
    .text("a simple tooltip");
function showTooltip(d) {
    let cityState = d.properties.city_state
    let html = `<h2> ${cityState}</h2> <p> Number of incidents: <b> ${cityStateFilter.get(cityState).length} </b> <br> <br> <b> Click </b>for more info</p>`
    tooltip.html(html)
    .style('visibility', 'visible')
}
function hideTooltip() {
    tooltip.html('')
    .style('visibility', 'hidden')
}
function showPointData(d) {
    let mapQueryDiv = $('#query-container')
    
    let cityState = d.properties.city_state
    let data = cityStateFilter.get(cityState)
    let html = `<div class='point-query-container'> <div class='point-query-header' id='point-query-header-id'> <h3> ${cityState} </h3> <h4> Reported Incidents: ${data.length} </div> `
    html += populateQuery(data)
    html += "</div>"
    mapQueryDiv.html(html)
    if (sideBarCollapsed) {
            console.log(sideBarCollapsed)
            handleSidebarCollapse();

            
            }
    if (filterApplied && data.length < pointCities[cityState].length) {
        let filterNotifier = $('<div>', {
            html:'This is displaying the filtered incidents'
        })
        let showAllDataBtn = $('<button>', {
            html:'Show All Data for ' + cityState
        })
        showAllDataBtn.on('click', () => {
            showAllPointData(cityState)
        })
        showAllDataBtn.appendTo(filterNotifier)
        filterNotifier.appendTo('#point-query-header-id')
    }
}
function showAllPointData(cityState) {
    let mapQueryDiv = $('#query-container')
    
    let data = pointCities[cityState]
    let html = `<div class='point-query-container'> <div class='point-query-header' id='point-query-header-id'> <h3> ${cityState} </h3> <h4> Reported Incidents: ${data.length} </div> `
    html += populateQuery(data)
    html += "</div>"
    mapQueryDiv.html(html)
    if (sideBarCollapsed) {
            console.log(sideBarCollapsed)
            handleSidebarCollapse();

            
            }
}
function highlightPoints(filter, property) {
    let filteredData = pointGeoJSON.features.filter( (d) => {
        return d.properties[filter] == property
    }).filter( (d) => {
        if(timeFilter.length == 0) {
            return true
        } else {

        if (timeFilter.includes(d.properties.date)) {
            return true
        }
    }
    return false
    })
    let filterCityGroup = d3.group(filteredData, d => d.properties.city_state)
    let filterCityGroupKeys = Array.from(filterCityGroup.keys())
    
    svg.selectAll('circle').attr('opacity', 0.2)
    .attr('visibility', 'hidden')
    .attr('fill', 'white').filter( (d) => {
        if(timeFilter.length == 0) {
            return true
        } else {

        if (timeFilter.includes(d.properties.date)) {
            return true
        }
    }
    return false
    })
    .attr('visibility', 'visible')
    .filter( (d) => {
        return filterCityGroupKeys.includes(d.properties.city_state)
    })
    .attr('opacity', 1)
    .attr('fill', 'gold')
    .transition()
    .duration(200)
    .attr("r", function(d) {
        return pointRadius(filterCityGroup.get(d.properties.city_state).length)
    })

}
function filterPoints() {
    let filterKeys = Object.keys(filters)
    filterApplied = false
    const applyFilter = () => {
        let bool = false
        filterKeys.forEach( filter => {
            if(filters[filter].length > 0) {
                bool = true
            }
        })
        return bool
    }

    let fil = svg.selectAll('circle')
    .attr('visibility', 'hidden')


    let filteredData = pointGeoJSON.features.filter( (d) => {
        if(timeFilter.length == 0) {
            return true
            
        } else {

        if (timeFilter.includes(d.properties.date)) {
            filterApplied = true
            return true
        }
    }
    return false
    })

    if (applyFilter()) {
        filterApplied = true
        filteredData = filteredData.filter( (d) => {
            let bool = false
            filterKeys.forEach( filter => {
                if (filters[filter].includes(d.properties[filter])) {
                    bool = true
                }
            })
            return bool
        })
    }

    cityStateFilter = d3.group(filteredData, d => d.properties.city_state)
    let cityKeys = Array.from(cityStateFilter.keys())

    fil.filter( (d) => {
        return cityKeys.includes(d.properties.city_state)
    })
    .attr('visibility', 'visible')
    .attr('fill', 'white')
    .attr('opacity', 1)
    .transition()
    .duration(100)
    .attr("r", function(d) {
        return pointRadius(cityStateFilter.get(d.properties.city_state).length)
    })
    

    
    

}
function d3Layer(data) {
    map.getPane("overlayPane").style.zIndex = 401;
    const overlay = d3.select(map.getPanes().overlayPane)
    console.log(map.getPanes().locationMarker)

    svg = overlay.select('svg').attr("pointer-events", "auto")
    const featureByPlace = d3.group(pointGeoJSON.features, d => d.properties['category of place'])
    console.log(featureByPlace)
    const Dots = svg.selectAll('circle')
                    .attr("class", "Dots")
                    .data(data)
                    .enter()
                    .append('circle')
                        .attr("id", "dotties")
                        .attr("fill", "#F6F6F4") //#F6F6F4 #252323
                        .attr("stroke", "#252323")
                        .attr('stroke-width', 2.0)
                        .attr('stroke-opacity', 0.6)
                        .attr('z-index', 100000)
/*                         .filter((d) => {
                            if(d.properties['year'] == 2016) {
                                return true
                            }
                        }) */
                        
                        //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
                        //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
                        .attr("cx", d => map.latLngToLayerPoint([d.geometry.coordinates[1],d.geometry.coordinates[0]]).x)
                        .attr("cy", d => map.latLngToLayerPoint([d.geometry.coordinates[1],d.geometry.coordinates[0]]).y) 
                        .attr("r", function(d) {
                            return pointRadius(pointCities[d.properties.city_state].length)
                        })
                        
                        .on('mouseover', function(e, d ) { //function to add mouseover event
                            showTooltip(d)
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('300') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", "red") //change the fill //change radius
                            
                          })
                          .on('mouseout', function() {
                              hideTooltip();
                              d3.select(this)
                              .attr('fill', 'white') //reverse the action based on when we mouse off the the circle
                            d3.select(this).transition()
                              .duration('150')
                              .attr("fill", "white")

                          })
                          .on("mousemove", function() {
                            return tooltip.style("top", (event.pageY + 15) + "px")
                              .style("left", (event.pageX + 15) + "px");
                          })
                          .on('click', (e, d)=> {
                              showPointData(d)
                          });
    const update = () => Dots
            .attr("cx", d => map.latLngToLayerPoint([d.geometry.coordinates[1],d.geometry.coordinates[0]]).x)
            .attr("cy", d => map.latLngToLayerPoint([d.geometry.coordinates[1],d.geometry.coordinates[0]]).y) 
    cityStateFilter = pointGeoJSON.features;
    cityStateFilter = d3.group(cityStateFilter, d => d.properties.city_state)
    console.log(cityStateFilter)
    sortCirlces();
    map.on("zoomend", update)
}
function sortCirlces() {
    let sort = svg.selectAll("circle")
    .sort( (a, b) => {
        return pointCities[b.properties.city_state].length - pointCities[a.properties.city_state].length
    })
  console.log(sort)
}
function addFeatureToQuery(feature) {
    let cityState = feature.properties.city_state

    if (typeof (pointCities[cityState]) === 'undefined') {
        pointCities[cityState] = [];
        pointSingular.push(feature)
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
    // let pointColor = getPointColor(feature.properties[selectedFilter])
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

// time query
let timeFilter = []
 //for getting points in filter by city and state
const timeQuery = d3.select("#time-query"),
    margin = {top: 10, right: 20, bottom: 30, left: 20},
    width = +timeQuery.attr("width") - margin.left - margin.right,
    height = +timeQuery.attr("height") - margin.top - margin.bottom;

/* $('#time-query').on('mouseover', (e) => {
    let extent = d3.brushSelection(d3.select(".brush").node())
    if (extent) {
        showSliderTooltip(extent)
    }
    
}) */

function applyTimeFilter() {
    sortCirlces();
    filterPoints();
/*     svg.selectAll('circle')
    .attr('r', function(d) {
        return pointRadius(filterGroup.get(d.properties.city_state).length)
    }) */
    


}
function defineRadius() {
    var length = pointGeoJSON.features.length;
	var numbers = [];
	for (var mug=0; mug<length; mug++) {
		var num = pointCities[pointGeoJSON.features[mug].properties.city_state].length
		numbers.push(Number(num));
	}
    var min = Math.min.apply(Math, numbers);
	var max = Math.max.apply(Math, numbers);
	
	var r = d3.scaleSqrt()
		.domain([min, max])
		.range([5, 25]);
    return r
}
function showSliderTooltip(extent) {
    let timeExtent = extent.map(x.invert)
    let from = formatMonth(timeExtent[0])
    let to = formatMonth(timeExtent[1])
    let range = d3.timeMonths(timeExtent[0], timeExtent[1])
    let filteredTime = []
    range.forEach(time => {
        time = String(formatMonth(time))
        time = time.split('-')
        time[1] = time[1].substring(2)
        time = time[0] + '-' + time[1]
        filteredTime.push(time)
    })
    timeFilter = filteredTime
    applyTimeFilter();
    let toolTipLeft = extent[0] > extent[1] - 100 ? extent[1] - 100 : extent[0]
    $('#tooltip-from').css({left: toolTipLeft}).html(from)
    $('#tooltip-to').css({left: extent[1]}).html(to)
}
const tParser = d3.timeParse("%m/%Y")
const x = d3.scaleTime().domain([new Date(2015, 12, 1), new Date(2021, 4, 1) - 1]).range([0, width]);

const xAxis = d3.axisBottom(x)        
.tickFormat(d3.timeFormat('%Y'))//%Y-for year boundaries, such as 2011
.ticks(5); //5 year data range

const brush = d3.brushX()
    .extent([[0, 0], [width -30 , height]])
    .on("brush", brushed)


const context = timeQuery.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

context.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

context.append("g")
    .attr("class", "brush")
    .call(brush)
const formatMonth = d3.timeFormat('%b-%Y');
const interval = d3.timeMonth.every(1)
function brushed(event) {
    
    if (!event.sourceEvent) return;
    if (!event.selection) return;
    
    const d0 = event.selection.map(x.invert);
    const d1 = d0.map(interval.round);

    // If empty when rounded, use floor instead.
    if (d1[0] >= d1[1]) {
      d1[0] = interval.floor(d0[0]);
      d1[1] = interval.offset(d1[0]);
    }
    
    d3.select(this).call(brush.move, d1.map(x));
    showSliderTooltip(d1.map(x))
    

  return timeQuery.node();
  
}