// índices de búsqueda
var indiceDocumento = {};
var indiceMatricula = {};

// almacenar propietarios
var propietarios = {};

// leer CSV de propietarios
Papa.parse("data/propietarios.csv", {

download: true,
header: true,

complete: function(results){

results.data.forEach(function(row){

var npn = String(row["npn"]).trim();
var nombre = row["nombre persona"];
var apellido = row["apellido"];
var porcentaje = row["porcentaje derecho"];

var documento = row["documento"];
var matricula = row["matricula"];

// guardar propietarios
var propietario = nombre + " " + apellido + " (" + porcentaje + "%)";

if(!propietarios[npn]){
propietarios[npn] = [];
}

propietarios[npn].push(propietario);

// índices de búsqueda
if(documento){
indiceDocumento[String(documento).trim()] = npn;
}

if(matricula){
indiceMatricula[String(matricula).trim()] = npn;
}

});

}

});

// crear mapa
var map = L.map('map').setView([6.72, -75.91], 14);

// basemap OpenStreetMap
var osm = L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
maxZoom:19,
attribution:'© OpenStreetMap'
}
).addTo(map);

// basemap satelital
var esri = L.tileLayer(
'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
{
attribution:'Tiles © Esri'
}
);

// control de capas
var baseMaps = {
"OpenStreetMap":osm,
"Satelital":esri
};

L.control.layers(baseMaps).addTo(map);

// ubicación del usuario
function miUbicacion(){

map.locate({
setView:true,
maxZoom:17
});

}

map.on('locationfound', function(e){

L.marker(e.latlng)
.addTo(map)
.bindPopup("📍 Usted está aquí")
.openPopup();

});

// variable global para predios
var predios;
var predioSeleccionado = null;
var indicePredios = {};

// cargar predios
fetch("data/predios.geojson")
.then(response => response.json())
.then(data => {

predios = L.geoJSON(data, {

style:{
color:"#e74c3c",
weight:1.5,
fillColor:"#ffffff",
fillOpacity:0
},

onEachFeature:function(feature, layer){
    

var codigo = String(feature.properties.TERRENO_CODIGO).trim();

// guardar referencia directa al layer
indicePredios[codigo] = layer;

layer.on("click", function(){
    // quitar resaltado anterior
if(predioSeleccionado){
predioSeleccionado.setStyle({
color:"#e74c3c",
weight:1.5,
fillOpacity:0
});
}
layer.getBounds().getCenter()
// guardar nuevo predio seleccionado
predioSeleccionado = layer;

// resaltar predio
layer.setStyle({
color:"#f1c40f",
weight:3,
fillColor:"#f1c40f",
fillOpacity:0.3
});


var lista = propietarios[codigo];

var centro = layer.getBounds().getCenter();

var html = "<b>Predio:</b> " + codigo + "<br><br>";

html += "<button onclick='irRuta(" + centro.lat + "," + centro.lng + ")'>🚗 Cómo llegar</button><br><br>";

html += "<b>Propietarios:</b><br>";


if(lista){

var verDatos = false; // cambiar a true solo en local

lista.forEach(function(p){

if(verDatos){
html += "• " + p + "<br>";
}else{
html += "• Propietario<br>";
}

});

}else{

html += "Sin información";

}

document.getElementById("infoContenido").innerHTML = html;

});

}

}).addTo(map);

// zoom inicial
map.fitBounds(predios.getBounds());

});

// buscar por documento o matrícula
function buscarPropietario(){

var valor = document.getElementById("buscarValor").value.trim();

var npn = indiceDocumento[valor] || indiceMatricula[valor];

if(!npn){
alert("No se encontró el propietario");
return;
}

var layer = indicePredios[npn];

if(layer){

map.fitBounds(layer.getBounds());

layer.fire("click");

}

}

function irRuta(lat, lng){

var url = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng;

window.open(url, "_blank");

}
