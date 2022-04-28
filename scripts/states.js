
export {loadLayer, clearLayer, storeData, data , legend}

let infoBox = $('.infoBox')
let map;
let map_layer;
let data;
infoBox.css({ visibility: "visible"})

function storeData(json) {
    data = json;
}
 function loadLayer(global_map) {
    map = global_map;
    map_layer =  L.geoJson(data, {
            style: style,
            onEachFeature: onEachFeature
    }).addTo(map);
   
    infoBox.css({ visibility: "visible"})
    legend.addTo(map);
    clearInfoBox();
}
function clearLayer(map) {
    map.removeControl(legend)
    map.removeLayer(map_layer)
    infoBox.css({ visibility: "hidden"})

}
function getColor(d) {
    return d > 134 ? '#3b3b3b' :
            d > 78 ? '#5e5e5e' :
                d > 30 ? '#838383':
                    d > 11 ? '#ababab':
                        d > 0 ? '#d4d4d4':
                            '#ffffff';
}
function style(feature) {
    return {
        weight: 0.6,
        opacity: 0.8,
        color: 'white',
        fillOpacity: 1,
        fillColor: getColor(feature.properties.NUMPOINTS)       
    }
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
    <h3> Hover over a state </h3>`)
}
function updateInfoBox(feature) {
    feature = feature.properties    
    infoBox.html(`
    <h3> ${feature.NAME10}  </h3> 
    <ul>
    <li> Number of Incidents: ${feature.NUMPOINTS}</li>
    <li> Jewish Population (%): ${(feature.PCT_JEW_TO * 100).toFixed(2)} </li>
    <li> Total Jewish Population: ${feature.POP_JEW_TO} </li>

     </ul>
    `)
}
function resetHighlight(e) {
    map_layer.resetStyle(e.target);
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

let legend = L.control({ position: 'bottomright' });

legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'info legend'),
        quantile = ['0', '12', '31', '79', '135', '211'],
        grades = [12, 31, 79, 135, 211],
        labels = [],
        from, to;

    for (var i = 0; i < grades.length; i++) {
        from = grades[i];
        to = grades[i + 1];

        labels.push(
            '<i style="background:' + getColor(from + 0.01) + '"></i> ' +
            quantile[i] + (quantile[i+1] ? ' &ndash; ' + quantile[i+1] : '&ndash;100'));
    }

    div.innerHTML = "<h3> Reported Incidents </h3>"  + labels.join('<br style="margin-bottom: 4px">');
    return div;
};