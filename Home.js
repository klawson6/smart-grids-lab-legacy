"use strict"

var home = null;
var volGraph, powGraph, bvGraph, piGraph, pxGraph, dvGraph, lbGraph, barGraph, tariffGraph;
var devices = [];
var curData;
var calendar;

var val2cmd = {
    0: "Enable Power Import & Export",
    1: "Disable Power Import",
    2: "Disable Power Export",
    3: "Disable Power Import & Export"
};

var cmd2val = {
    En: 0,
    Dis1: 1,
    Dis2: 2,
    Dis3: 3
};
var homeVal;

var picker;

function Home() {

    var map, addMap;

    this.init = function () {
        home.initGraphCanvas();
        home.startMap();
        home.startMapAdd();
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
        $("#addtag").on('click', home.divSwitch("#add"));
        $("#imeiSearch").on('click', function () {
            $("#list" + $("#imeiField").val()).click();
            $("#deviceList").animate({scrollTop: $("#list" + $("#imeiField").val()).offset().top}, 500);
        });
        $("#addDevice").on('click', function () {
            $.get("putDevice.php?imei=" + $("#addIMEI").val() + "&cmd=" + cmd2val[$("#commandsList").val()] + "&lat=" + $("#addLat").val() + "&lng=" + $("#addLng").val(), home.addDeviceCallback);
        });
        $("#filterSearch").on('click', home.reportTimescale);
    };

    this.addDeviceCallback = function (data) {
        switch (data) {
            case "0" :
                $("#submitText").css('color', "red");
                $("#submitText").text("Invalid information!!");
                break;
            case "1":
                $("#submitText").css('color', "green");
                $("#submitText").text("Submitted!");
                home.loadDevices();
                break;
            case "2":
                $("#submitText").css('color', "orange");
                $("#submitText").text("IMEI number already in use!");
                break;
        }
        setTimeout(function () {
            $("#submitText").text("");
        }, 3000);
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
        return 60 - (Math.round(Math.abs(new Date().getTime() - new Date(time).getTime()) / (60000)));
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

    this.startMapAdd = function () {
        navigator.geolocation.getCurrentPosition(function (position) {
            addMap = new google.maps.Map(document.getElementById("mappane2"), {
                center: {lat: position.coords.latitude, lng: position.coords.longitude},
                zoom: 14,
                mapTypeControl: false,
                mapTypeId: google.maps.MapTypeId.SATELLITE,
                streetViewControl: false
            });

            google.maps.event.addListener(addMap, 'click', function (event) {
                $("#addLat").val(event.latLng.lat());
                $("#addLng").val(event.latLng.lng());
            });
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
        bvGraph = home.drawReportGraphTemplate($("#bvGraphCanvas"), "Battery Voltage", "Voltage - V");
        piGraph = home.drawReportGraphTemplate($("#piGraphCanvas"), "Power Imported", "Power - W");
        pxGraph = home.drawReportGraphTemplate($("#pxGraphCanvas"), "Power Exported", "Power - W");
        dvGraph = home.drawReportGraphTemplate($("#dvGraphCanvas"), "Distribution Voltage", "Voltage - V");
        lbGraph = home.drawReportGraphTemplate($("#lbGraphCanvas"), "Load Busbar", "Voltage - V");
        barGraph = home.drawHorBarTemplate($("#powerGraphCanvas"), "Total Energy Imported and Exported", "Energy - Whr");
        tariffGraph = home.drawBarTemplate($("#tariffGraphCanvas"), "Monetary Exchange", "Total Transaction per Tariff - RWF");
        picker = datepicker("#dateChoose", {
            onSelect: function (instance, date) {
                home.changeReportDate(date, date.getDate(), date.getMonth(), date.getFullYear());
                barGraph.update();
                tariffGraph.update();
            }
        });
    };

    this.drawBarTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'bar',
            data: {
                labels: [["Tariff 1", "274 RWF/kWh"], ["Tariff 2", "548 RWF/kWh"], ["Tariff 3", "822 RWF/kWh"], ["Tariff 4", "1096 RWF/kWh"]]
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
                        scaleLabel: {
                            display: true,
                            labelString: type
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: "Amount / RWF"
                        }
                    }]
                }
            }
        });
    };

    this.drawHorBarTemplate = function (canvas, title, type) {
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
                animation: {
                    duration: 0
                },
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
                            labelString: "Time Recorded"
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: type
                        }
                    }]
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            onPan: home.rescaleGraphs
                        },
                        zoom: {
                            enabled: true,
                            mode: 'x',
                            onZoom: home.rescaleGraphs
                        }
                    }
                }
            }
        });
    };

    this.drawReportGraphTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'line',
            options: {
                animation: {
                    duration: 0
                },
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
                            labelString: "Time Recorded"
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: type
                        }
                    }]
                },
                plugins: {
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            onPan: home.rescaleReportGraphs
                        },
                        zoom: {
                            enabled: true,
                            mode: 'x',
                            onZoom: home.rescaleReportGraphs
                        }
                    }
                }
            }
        });
    };

    this.rescaleGraphs = function (chart) {
        volGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        volGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        powGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        powGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        volGraph.update();
        powGraph.update();
    };

    this.rescaleReportGraphs = function (chart) {
        bvGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        bvGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        piGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        piGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        pxGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        pxGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        dvGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        dvGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        lbGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        lbGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
    };

    this.reportGraph = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.reportGraphCallback, "json");
        $.get("getDeviceInfo.php?imei=" + imei + "&param=Balance", home.updateBalCallback, "json");
    };

    this.updateBalCallback = function (bal) {
        $("#balVal").text(Math.floor(bal) + " RWF");
    };

    this.reportGraphCallback = function (data) {
        curData = data;
        var size = data.length;
        if (size) {
            var graphData = home.buildReportData(data);
            bvGraph.data.datasets = graphData[0];
            piGraph.data.datasets = graphData[1];
            pxGraph.data.datasets = graphData[2];
            dvGraph.data.datasets = graphData[3];
            lbGraph.data.datasets = graphData[4];
            var dt = new Date();
            bvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            piGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            pxGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            dvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            lbGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            bvGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            piGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            pxGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            dvGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            lbGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            bvGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            piGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            pxGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            dvGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            lbGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            dt.setHours(dt.getHours() - 24);
            if (dt.valueOf() < new Date(data[0].DateTime).valueOf()) {
                dt = new Date(data[0].DateTime);
            }
            bvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            piGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            pxGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            dvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            lbGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            bvGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            piGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            pxGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            dvGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            lbGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            bvGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            piGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            pxGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            dvGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            lbGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            home.changeReportDate(new Date(), new Date().getDate(), new Date().getMonth(), new Date().getFullYear());
        } else {
            bvGraph.data.datasets = {};
            piGraph.data.datasets = {};
            pxGraph.data.datasets = {};
            dvGraph.data.datasets = {};
            lbGraph.data.datasets = {};
            barGraph.data.datasets = {};
            tariffGraph.data.datasets = {};
        }
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
        barGraph.update();
        tariffGraph.update();
    };

    this.reportTimescale = function () {
        var time = $("#timeField").val();
        switch ($("#units").val()) {
            case "Minutes":
                time = time * 60;
                break;
            case "Hours":
                time = time * 3600;
                break;
            case "Days":
                time = time * 86400;
                break;
        }
        var dt = new Date();
        bvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
        piGraph.options.scales.xAxes[0].time.max = dt.valueOf();
        pxGraph.options.scales.xAxes[0].time.max = dt.valueOf();
        dvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
        lbGraph.options.scales.xAxes[0].time.max = dt.valueOf();
        dt.setSeconds(dt.getSeconds() - time);
        bvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
        piGraph.options.scales.xAxes[0].time.min = dt.valueOf();
        pxGraph.options.scales.xAxes[0].time.min = dt.valueOf();
        dvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
        lbGraph.options.scales.xAxes[0].time.min = dt.valueOf();
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
    };

    this.updateGraphs = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.updateGraphsCallback, "json");
    };

    this.updateGraphsCallback = function (data) {
        var size = data.length;
        if (size) {
            var graphData = home.buildGraphData(data);
            volGraph.data.datasets = graphData[0];
            powGraph.data.datasets = graphData[1];
            var dt = new Date();
            volGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            powGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            volGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            volGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            dt.setHours(dt.getHours() - 4);
            volGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            powGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            dt = new Date(data[0].DateTime);
            volGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            volGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
        } else {
            volGraph.data.datasets = {};
            powGraph.data.datasets = {};
        }
        volGraph.update();
        powGraph.update();
    };

    this.buildReportData = function (data) {
        var size = data.length;
        var bv = [size];
        var pi = [size];
        var px = [size];
        var dv = [size];
        var lb = [size];
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
                backgroundColor: ["#3e95cd", "#c46e11"],
                data: [2]
            }]
        ];
        var dt;
        for (var i = 0; i < size; i++) {
            if (data[i] !== null && data[i] !== undefined) {
                dt = new Date(data[i].DateTime);
                rtn[0][0].data[i] = {x: dt, y: data[i].BatteryVoltage / 100};
                rtn[1][0].data[i] = {x: dt, y: data[i].PowerImport / 100};
                rtn[2][0].data[i] = {x: dt, y: data[i].PowerExport / 100};
                rtn[3][0].data[i] = {x: dt, y: data[i].DistributionVoltage / 100};
                rtn[4][0].data[i] = {x: dt, y: data[i].LoadBusbar / 100};
            }
        }
        return rtn;
    };

    this.buildGraphData = function (data) {
        var size = data.length;
        var bv = [size];
        var pi = [size];
        var px = [size];
        var dv = [size];
        var lb = [size];
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
        for (var i = 0; i < size; i++) {
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

    this.changeReportDate = function (date, day, month, year) {
        if (curData === undefined || curData === null) {
            return;
        }
        var size = curData.length;
        if (size) {
            var eiSum = 0;
            var exSum = 0;
            var income = [0, 0, 0, 0];
            var outgoing = [0, 0, 0, 0];
            var dvTemp;
            var rtn = [
                [{
                    backgroundColor: ["#3e95cd", "#c46e11"],
                    data: [2]
                }],
                [
                    {
                        label: "Income",
                        backgroundColor: "#45cd7e",
                        data: [4]
                    },
                    {
                        label: "Outgoing",
                        backgroundColor: "#c41922",
                        data: [4]
                    }
                ]
            ];
            var start = new Date(year, month, day);
            var end = new Date(year, month, day);

            end.setHours(23, 59, 59, 999);
            for (var i = 0; i < size - 1; i++) {
                var tempDate = new Date(curData[i].DateTime).valueOf();
                if (start.valueOf() <= tempDate.valueOf() && tempDate.valueOf() <= end.valueOf()) {
                    dvTemp = curData[i].DistributionVoltage / 100;
                    var ei = curData[i].PowerImport / 6000;
                    var ex = curData[i].PowerExport / 6000;
                    eiSum += ei;
                    exSum += ex;
                    switch (true) {
                        case (47.8 <= dvTemp):
                            income[0] += ei * 0.274;
                            outgoing[0] += ex * 0.274;
                            break;
                        case (45.8 <= dvTemp && dvTemp < 47.8):
                            income[1] += ei * 0.548;
                            outgoing[1] += ex * 0.548;
                            break;
                        case (43.8 <= dvTemp && dvTemp < 45.8):
                            income[2] += ei * 0.822;
                            outgoing[2] += ex * 0.822;
                            break;
                        case (dvTemp < 43.8):
                            income[3] += ei * 1.096;
                            outgoing[3] += ex * 1.096;
                            break;
                    }
                }
            }
            rtn[0][0].data[0] = eiSum;
            rtn[0][0].data[1] = exSum;

            rtn[1][0].data = income;
            rtn[1][1].data = outgoing;

            barGraph.data.datasets = rtn[0];
            tariffGraph.data.datasets = rtn[1];
        } else {
            barGraph.data.datasets = {};
            tariffGraph.data.datasets = {};
        }
        barGraph.update();
        tariffGraph.update();
        $("#dateShownVal").text(date.toDateString());
    };
}

home = new Home();
window.addEventListener('load',
    function (ev) {
        home.init();
    });