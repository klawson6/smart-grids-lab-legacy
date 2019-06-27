"use strict"

var home = null;
var volGraph, powGraph, bvGraph, piGraph, pxGraph, dvGraph, lbGraph, barGraph;
var devices = [];

// TODO fill with all commands
var val2cmd = {
    1: "Disconnect From Network",
    2: "Disable Power Import"
};

// TODO fill with all commands
var cmd2val = {
    Disconnect: 1,
    BlockImport: 2
};
var homeVal;

function Home() {

    var map;

    this.init = function () {
        home.initGraphCanvas();
        home.startMap();
        home.initListeners();
    };

    this.initListeners = function () {
        $("#issue").on('click', function () {
            if ($("#commands").val() !== null)
                $.get("putCommand.php?imei=" + devices[homeVal].IMEI + "&cmd=" + cmd2val[$("#commands").val()], home.issueCallback);
        });
        $("#viewReport").on('click', function () {
            home.divSwitch("#report")();
            $("#list" + devices[homeVal].IMEI).click();
            $("#deviceList").animate({scrollTop: $("#list" + devices[homeVal].IMEI).offset().top}, 500);
        });
        $("#browsetag").on('click', home.divSwitch("#browse"));
        $("#reporttag").on('click', home.divSwitch("#report"));
        $("#imeiSearch").on('click', function () {
            $("#list" + $("#imeiField").val()).click();
            $("#deviceList").animate({scrollTop: $("#list" + $("#imeiField").val()).offset().top}, 500);
        });
    };

    this.divSwitch = function (type) {
        return function () {
            $(".menutags").css({"border-color": "#3d7679"});
            $(type + "tag").css({"border-color": "white"});
            $(".infoPane").css({"display": "none"});
            $(type + "Div").css({"display": "unset"});
        };
    };

    this.issueCallback = function () {
        devices[homeVal].Command = cmd2val[$("#commands").val()];
        home.updateData(homeVal)();
    };

    this.loadDevices = function () {
        $.get("getDevices.php", home.loadDevicesCallback, "json");
    };

    this.loadDevicesCallback = function (data) {
        devices = data;
        for (var i = 0; i < devices.length; i++) {
            devices[i].marker = new google.maps.Marker({
                position: {lat: devices[i].Latitude, lng: devices[i].Longitude},
                animation: google.maps.Animation.DROP,
                map: map
            });
            devices[i].marker.addListener('click', home.updateData(i));
            $("#listDiv").append("  <div id=\"list" + devices[i].IMEI + "\" class=\"listItem\">\n" +
                "                    <p>" + devices[i].IMEI + "</p>\n" +
                "                </div>");
        }
        $(".listItem").on('click', function () {
            $(".listItem").css({"background-color": "#ffffff"});
            $(this).css({"background-color": "rgba(116, 215, 218, 0.28)"});
            home.reportGraph($(this).children().text());
        });
    };

    // TODO
    this.updateData = function (index) {
        return function () {
            homeVal = index;
            $(".hiddenInfo").removeAttr("hidden");
            $("#imei").text("IMEI: " + devices[index].IMEI);
            $("#latlng").text("Geolocation: " + devices[index].Latitude + ", " + devices[index].Longitude);
            $("#pendingcmd").text("Pending Command: " + val2cmd[devices[index].Command]);
            $("#tuc").text("Time Until Command: " + home.calcTimeDiff(devices[index].LastActivity) + " minutes");
            home.updateGraphs(devices[index].IMEI);
        };
    };

    this.calcTimeDiff = function (time) {
        return Math.round(Math.abs(new Date().getTime() - new Date(time).getTime()) / (60000));
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
            home.loadDevices();
        });
    };

    this.initGraphCanvas = function () {
        $("#volgraphcanvas").width = $("#parent").width();
        $("#volgraphcanvas").height = $("#parent").height();
        $("#powgraphcanvas").width = $("#parent").width();
        $("#powgraphcanvas").height = $("#parent").height();
        volGraph = home.drawGraphTemplate($("#volgraphcanvas"), "Monitor Voltage Measurements", "Voltage / V");
        powGraph = home.drawGraphTemplate($("#powgraphcanvas"), "Monitor Power Measurements", "Power / W");
        $(".reportGraphCanvas").width = $("#parent").width();
        $(".reportGraphCanvas").height = $("#parent").height();
        bvGraph = home.drawGraphTemplate($("#bvGraphCanvas"), "Battery Voltage", "Voltage / V");
        piGraph = home.drawGraphTemplate($("#piGraphCanvas"), "Power Imported", "Power / W");
        pxGraph = home.drawGraphTemplate($("#pxGraphCanvas"), "Power Exported", "Power / W");
        dvGraph = home.drawGraphTemplate($("#dvGraphCanvas"), "Distribution Voltage", "Voltage / V");
        lbGraph = home.drawGraphTemplate($("#lbGraphCanvas"), "Load Busbar", "Voltage / V");
        barGraph = home.drawBarTemplate($("#powerGraphCanvas"), "Total Power Imported and Exported", "Power / W");
    };

    this.drawBarTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'horizontalBar',
            data: {
                labels: ["Import", "Export"]
            },
            options: {
                legend: {display: false},
                title: {
                    display: true,
                    text: title
                },
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: type
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
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

    this.reportGraph = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.reportGraphCallback, "json");
    };

    this.reportGraphCallback = function (data) {
        if (data.length) {
            var graphData = home.buildReportData(data);
            bvGraph.data.datasets = graphData[0];
            piGraph.data.datasets = graphData[1];
            pxGraph.data.datasets = graphData[2];
            dvGraph.data.datasets = graphData[3];
            lbGraph.data.datasets = graphData[4];
            barGraph.data.datasets = graphData[5];
        } else {
            bvGraph.data.datasets = {};
            piGraph.data.datasets = {};
            pxGraph.data.datasets = {};
            dvGraph.data.datasets = {};
            lbGraph.data.datasets = {};
            barGraph.data.datasets = {};
        }
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
        barGraph.update();
    };

    this.updateGraphs = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.updateGraphsCallback, "json");
    };

    this.updateGraphsCallback = function (data) {
        if (data.length) {
            var graphData = home.buildGraphData(data);
            volGraph.data.datasets = graphData[0];
            powGraph.data.datasets = graphData[1];
        } else {
            volGraph.data.datasets = {};
            powGraph.data.datasets = {};
        }
        volGraph.update();
        powGraph.update();
    };

    this.buildReportData = function (data) {
        var bv = [48];
        var pi = [48];
        var px = [48];
        var dv = [48];
        var lb = [48];
        var rtn = [
            [{
                data: bv,
                label: "Battery Voltage",
                borderColor: "#00cdcc"
            }],
            [{
                data: dv,
                label: "Power Import",
                borderColor: "#cdca00"
            }],
            [{
                data: lb,
                label: "Power Export",
                borderColor: "#cd00ca"
            }],
            [{
                data: pi,
                label: "Distribution Voltage",
                borderColor: "#cd0006"
            }],
            [{
                data: px,
                label: "Load Busbar",
                borderColor: "#00cd03"
            }],
            [{
                backgroundColor: ["#3e95cd", "#c45850"],
                data: [2]
            }]
        ];

        var dt;
        var piSum = 0;
        var pxSum = 0;
        for (var i = 0; i < 48; i++) {
            if (data[i] !== null && data[i] !== undefined) {
                dt = new Date(data[i].DateTime);
                rtn[0][0].data[i] = {x: dt, y: data[i].BatteryVoltage / 100};
                rtn[1][0].data[i] = {x: dt, y: data[i].PowerImport / 100};
                rtn[2][0].data[i] = {x: dt, y: data[i].PowerExport / 100};
                rtn[3][0].data[i] = {x: dt, y: data[i].DistributionVoltage / 100};
                rtn[4][0].data[i] = {x: dt, y: data[i].LoadBusbar / 100};
                piSum += data[i].PowerImport / 100;
                pxSum += data[i].PowerExport / 100;
            }
        }
        rtn[5][0].data[0] = piSum;
        rtn[5][0].data[1] = pxSum;
        return rtn;
    };

    this.buildGraphData = function (data) {
        var size = data.length;
        var bv = [data.length];
        var pi = [data.length];
        var px = [data.length];
        var dv = [data.length];
        var lb = [data.length];
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

home = new Home();
window.addEventListener('load',
    function (ev) {
        home.init();
    });