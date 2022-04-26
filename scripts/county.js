let legend = L.control({ position: 'bottomright' });
let data;
let map_layer;
let infoBox = $('.infoBox')

export {loadLayer, storeData, clearLayer, data }
function storeData(json) {
    data = json;
}
function loadLayer(map) {
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

        div.innerHTML = "<h3> Normalized Difference (Election 2020) </h3>" + labels.join('<br style = "margin-bottom:3px">');
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
