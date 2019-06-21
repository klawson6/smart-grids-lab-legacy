"use strict"

var view = null;
var volGraph, powGraph, map;

function Home() {

    this.init = function () {
        window.console.log("Jess is always sick.");
        view.initGraphCanvas();
        view.updateGraphs();
        view.startMap();
    };

    this.startMap = function () {
        navigator.geolocation.getCurrentPosition(function (position) {
            map = new google.maps.Map(document.getElementById("mappane"), {
                center: {lat: -1.800876, lng: 30.062888},
                zoom: 14,
                mapTypeControl: false,
                streetViewControl: false
            });
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

    this.updateGraphs = function () {
        $.get("getLatestData.php", {data: "data"}, view.updateGraphsCallback, "json");
    };

    this.updateGraphsCallback = function (data) {
        // view.drawGraph($("#volgraphcanvas"), view.buildGraphData(data)[0], "Monitor Voltage Measurements", "Voltage / V");
        // view.drawGraph($("#powgraphcanvas"), view.buildGraphData(data)[1], "Monitor Power Measurements", "Power / W");
        window.console.log(data);
        var graphData = view.buildGraphData(data);
        volGraph.data.datasets = graphData[0];
        volGraph.update();
        powGraph.data.datasets = graphData[1];
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
            if (data[i] !== null && data[i] !== undefined){
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


    this.drawGraph = function (canvas, data, title, type) {
        window.console.log(data);
        new Chart(canvas, {
            type: 'line',
            data: {
                datasets: data
            },
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
}

view = new Home();
window.addEventListener('load',
    function (ev) {
        view.init();
    });