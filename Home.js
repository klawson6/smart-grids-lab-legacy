"use strict"

var view = null;
var volGraph, powGraph;
var devices = [];

function Home() {

    var map;

    this.init = function () {
        view.initGraphCanvas();
        view.startMap();
    };

    this.loadPins = function () {
        $.get("getDevices.php", view.loadPinsCallback, "json");
    };

    this.loadPinsCallback = function (data) {
        devices = data;
        for (var i = 0; i < devices.length; i++) {
            devices[i].marker = new google.maps.Marker({
                position: {lat: devices[i].Latitude, lng: devices[i].Longitude},
                animation: google.maps.Animation.DROP,
                map: map
            });
            devices[i].marker.addListener('click', view.updateData(i));
        }
        window.console.log(devices);
    };

    // TODO
    this.updateData = function (index) {
        return function () {
            $("#imei").text("IMEI: " + devices[index].IMEI);
            $("#latlng").text("Geolocation: " + devices[index].Latitude + ", " + devices[index].Longitude);
            $("#pendingcmd").text("Pending Command: " + devices[index].Command); // TODO change number to command
            $("#tuc").text("Time Until Command: " + view.calcTimeDiff(devices[index].LastActivity) + " seconds");
            view.updateGraphs(devices[index].IMEI);
            window.console.log(devices[index]);
        };
    };

    this.calcTimeDiff = function (time) {
        return Math.round(Math.abs(new Date().getTime() - new Date(time).getTime())/(60000));
    };

    this.startMap = function () {
        navigator.geolocation.getCurrentPosition(function (position) {
            map = new google.maps.Map(document.getElementById("mappane"), {
                center: {lat: position.coords.latitude, lng: position.coords.longitude},
                zoom: 14,
                mapTypeControl: false,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                streetViewControl: false
            });
            view.loadPins();
        });
    };

    this.initGraphCanvas = function () {
        $("#volgraphcanvas").width = $("#parent").width();
        $("#volgraphcanvas").height = $("#parent").height();
        $("#powgraphcanvas").width = $("#parent").width();
        $("#powgraphcanvas").height = $("#parent").height();
        volGraph = view.drawGraphTemplate($("#volgraphcanvas"), "Monitor Voltage Measurements", "Voltage / V");
        powGraph = view.drawGraphTemplate($("#powgraphcanvas"), "Monitor Power Measurements", "Power / W");
    };

    this.drawGraphTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'line',
            options: {
                title: {
                    display: true,
                    text: title
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        type: "time",
                        scaleLabel: {
                            display: true,
                            labelString: "Time - 5mins/4hr"
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: type
                        }
                    }]
                }
            }
        });
    };

    this.updateGraphs = function (imei) {
        $.get("getLatestData.php?imei=" + imei, view.updateGraphsCallback, "json");
    };

    this.updateGraphsCallback = function (data) {
        window.console.log(data);
        if (data.length) {
            var graphData = view.buildGraphData(data);
            volGraph.data.datasets = graphData[0];
            powGraph.data.datasets = graphData[1];
        } else {
            volGraph.data.datasets = {};
            powGraph.data.datasets = {};
        }
        volGraph.update();
        powGraph.update();
    };

    this.buildGraphData = function (data) {
        var bv = [48];
        var pi = [48];
        var px = [48];
        var dv = [48];
        var lb = [48];
        var rtn = [
            [
                {
                    data: bv,
                    label: "Battery Voltage",
                    borderColor: "#00cdcc",
                    fill: false
                },
                {
                    data: dv,
                    label: "Distribution Voltage",
                    borderColor: "#cdca00",
                    fill: false
                },
                {
                    data: lb,
                    label: "Load Busbar",
                    borderColor: "#cd00ca",
                    fill: false
                }
            ],
            [
                {
                    data: pi,
                    label: "Power Import",
                    borderColor: "#cd0006",
                    fill: false
                },
                {
                    data: px,
                    label: "Power Export",
                    borderColor: "#00cd03",
                    fill: false
                }
            ]];

        var dt;
        for (var i = 0; i < 48; i++) {
            if (data[i] !== null && data[i] !== undefined) {
                dt = new Date(data[i].DateTime);
                rtn[0][0].data[i] = {x: dt, y: data[i].BatteryVoltage / 100};
                rtn[0][1].data[i] = {x: dt, y: data[i].DistributionVoltage / 100};
                rtn[0][2].data[i] = {x: dt, y: data[i].LoadBusbar / 100};
                rtn[1][0].data[i] = {x: dt, y: data[i].PowerImport / 100};
                rtn[1][1].data[i] = {x: dt, y: data[i].PowerExport / 100};
            }
        }
        return rtn;
    };
}

view = new Home();
window.addEventListener('load',
    function (ev) {
        view.init();
    });