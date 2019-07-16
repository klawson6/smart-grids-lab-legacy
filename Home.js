"use strict" // Specify JS syntax to be used

var home = null; // An instance of the set of functions in Home.js
var volGraph, powGraph, bvGraph, piGraph, pxGraph, dvGraph, lbGraph, barGraph, tariffGraph; // The Graph canvas to draw data onto
var devices = []; // The information fetched from the database for each installed and active device (IEMI num, Geolocation, Last Activity, Balance)
var curData; // The data for a selected device

// Part of a bidirectional map between commands codes and strings
var val2cmd = {
    0: "Enable Power Import & Export",
    1: "Disable Power Import",
    2: "Disable Power Export",
    3: "Disable Power Import & Export"
};

// Part of a bidirectional map between commands codes and strings
var cmd2val = {
    En: 0,
    Dis1: 1,
    Dis2: 2,
    Dis3: 3
};

var homeVal; // Index of selected device

var picker; // An instance of the date picker calendar

// The function object that contains all usable functions
function Home() {

    var map, addMap; // Instances of google map objects

    /*
     * Calls the initialisation functions for maps, listeners and graphs
     */
    this.init = function () {
        home.initGraphCanvas(); // Initialise graphs
        home.startMap(); // Initialise the live data map
        home.startMapAdd(); // Initialise the device-add map
        home.initListeners(); // Initialise listeners
    };

    /*
     * Selects the elements on the DOM that have listeners and defines the listener behaviour
     */
    this.initListeners = function () {
        // Sets the command chosen from the dropdown menu for the selected device in live data
        $("#issue").on('click', function () { // On button click
            if ($("#commands").val() !== null) // Only issue the command if a command is chosen in the dropdown menu
                $.get("putCommand.php?imei=" + devices[homeVal].IMEI + "&cmd=" + cmd2val[$("#commands").val()], home.issueCallback); // Issue a GET request on the PHP script to set the command
        });
        // Switches from live data to report page on view report selection of live data selection
        $("#viewReport").on('click', function () { // On button click
            home.divSwitch("#report")(); // Switch page
            $("#list" + devices[homeVal].IMEI).click(); // Carry over selection to the report page
            $("#deviceList").animate({scrollTop: $("#list" + devices[homeVal].IMEI).offset().top}, 500); // Auto-scroll to device in deveice list if automatically carried over
        });
        $("#browsetag").on('click', home.divSwitch("#browse")); // Switch page to live data
        $("#reporttag").on('click', home.divSwitch("#report")); // Switch page to reports
        $("#addtag").on('click', home.divSwitch("#add")); // Switch to add device
        // Selects report for device based on an entered IMEI number
        $("#imeiSearch").on('click', function () { // On button click
            $("#list" + $("#imeiField").val()).click(); // Simulate the effects of selecting a IMEI menu option
            $("#deviceList").animate({scrollTop: $("#list" + $("#imeiField").val()).offset().top}, 500); // Scroll to selection
        });
        // Submit information on a new device entered into add-device page
        $("#addDevice").on('click', function () {
            // GET request containing the information on new device to be sent to a PHP script to place new device in database
            $.get("putDevice.php?imei=" + $("#addIMEI").val() + "&cmd=" + cmd2val[$("#commandsList").val()] + "&lat=" + $("#addLat").val() + "&lng=" + $("#addLng").val(), home.addDeviceCallback);
        });
        // Rescale graph when filter button is clicked in report page
        $("#filterSearch").on('click', home.reportTimescale); // Call the rescale function
    };

    /*
     * Callback function to display the success/failure of adding a new device to the database
     * @params data - response from PHP script after GET request is issued
     */
    this.addDeviceCallback = function (data) {
        // Data is the response from the PHP script given after the GET request has been issued
        switch (data) {
            // Give red message indicating the information given to build the new device was incorrect
            case "0" :
                $("#submitText").css('color', "red");
                $("#submitText").text("Invalid information!!");
                break;
            // Give orange message indicating the information given to build the new device as some data identical to another device
            case "1":
                $("#submitText").css('color', "green");
                $("#submitText").text("Submitted!");
                home.loadDevices();
                break;
            // Give green message indicating the information given to build was correct and it was built successfully and placed in the database
            case "2":
                $("#submitText").css('color', "orange");
                $("#submitText").text("IMEI number already in use!");
                break;
        }
        // Set the success/failure message to disappear after 3 seconds
        setTimeout(function () {
            $("#submitText").text("");
        }, 3000);
    };

    /*
     * Switch the page displayed when page switch is selected.
     * @params type - The page being navigated to
     */
    this.divSwitch = function (type) {
        return function () {
            $(".menutags").css({"border-color": "#3d7679"}); // Deselect all menu options
            $(type + "tag").css({"border-color": "white"}); // Visual indication of selected option in menu,  white border
            $(".infoPane").css({"display": "none"}); // Hide all changing panels on the page
            $(type + "Div").css({"display": "unset"}); // Reveal the panel for the page to be navigated to
        };
    };

    /*
     * Callback function for issuing a command to a device
     */
    this.issueCallback = function () {
        devices[homeVal].Command = cmd2val[$("#commands").val()]; // Set the command of the device locally stored
        home.updateData(homeVal)(); // Update the information displayed on the selected device to match the new command issued
    };

    /*
     * Issues a GET request to a PHP script to get all device inforamtion
     */
    this.loadDevices = function () {
        $.get("getDevices.php", home.loadDevicesCallback, "json");
    };

    /*
     * Callback function for loading devices
     * @params data - Response from GET request to PHP script, contains JSON of all device information
     */
    this.loadDevicesCallback = function (data) {
        devices = data; // Save a local copy of the devices
        for (var i = 0; i < devices.length; i++) { // For every device place it on the map
            devices[i].marker = new google.maps.Marker({ // Create new Google Maps Marker object
                position: {lat: devices[i].Latitude, lng: devices[i].Longitude}, // Set position to geolocation in device info
                animation: google.maps.Animation.DROP, // Drop pin on map
                map: map // Specifies the map object to place markers on
            });
            devices[i].marker.addListener('click', home.updateData(i)); // Listener for clicking the markers. Displays data on selected device
            // Add device to selectable list on report page
            $("#listDiv").append("  <div id=\"list" + devices[i].IMEI + "\" class=\"listItem\">\n" +
                "                    <p>" + devices[i].IMEI + "</p>\n" +
                "                </div>");
        }
        // Listener for devices on report page menu
        $(".listItem").on('click', function () {
            $(".listItem").css({"background-color": "#ffffff"}); // Visual deselect indication
            $(this).css({"background-color": "rgba(116, 215, 218, 0.28)"}); // Visual select indication
            home.reportGraph($(this).children().text()); // Build graphs for selected device on report page
        });
    };

    /*
     * Displays live data for selected device on map
     * @params index - index of device in devices array containing device information
     */
    this.updateData = function (index) {
        return function () {
            homeVal = index; // Set selected device index
            $(".hiddenInfo").removeAttr("hidden"); // Show DOM elements now a device is selected
            $("#imei").text("IMEI: " + devices[index].IMEI); // Display IMEI number
            $("#latlng").text("Geolocation: " + devices[index].Latitude + ", " + devices[index].Longitude); // Display the latitude and longitude
            $("#pendingcmd").text("Pending Command: " + val2cmd[devices[index].Command]); // Display the command currently being issued
            $("#tuc").text("Time Until Command: " + home.calcTimeDiff(devices[index].LastActivity) + " minutes"); // Display the time until command is issued (0-10 mins)
            home.updateGraphs(devices[index].IMEI); // Update the graphs for live data
        };
    };

    /*
     * Calculate the time until the command issued to a device is executed. Occurs when the device pushes a data packet, every 10 minutes
     * @params time - The last time the device sent a packet of data
     */
    this.calcTimeDiff = function (time) {
        return 10 - (Math.round(Math.abs(new Date().getTime() - new Date(time).getTime()) / (60000))); // 10 minutes minus the time from last sent packet
    };

    /*
     * Initialise the live data map
     */
    this.startMap = function () {
        navigator.geolocation.getCurrentPosition(function (position) { // Ask the user for location data, REQUIRED MAP WILL NOT FUNCTION WITHOUT LOCATION DATA
            map = new google.maps.Map(document.getElementById("mappane"), { // Create new Google Maps object on the element "mappane"
                center: {lat: position.coords.latitude, lng: position.coords.longitude}, // Center map around the user's location
                zoom: 2, // Zoom out to show the earth
                mapTypeControl: false, // Disable map changing functions e.g. 3D map, switching map types etc
                mapTypeId: google.maps.MapTypeId.SATELLITE, // Set map type to satellite mode
                streetViewControl: false // Disable street view
            });
            home.loadDevices(); // Load in all device data and place them on the map
        });
    };

    /*
     * Initialise the add-device map
     */
    this.startMapAdd = function () {
        navigator.geolocation.getCurrentPosition(function (position) { // Ask the user for location data, REQUIRED MAP WILL NOT FUNCTION WITHOUT LOCATION DATA
            addMap = new google.maps.Map(document.getElementById("mappane2"), { // Create new Google Maps object on the element "mappane2"
                center: {lat: position.coords.latitude, lng: position.coords.longitude}, // Center map around the user's location
                zoom: 14, // Zoom out to show the earth
                mapTypeControl: false, // Disable map changing functions e.g. 3D map, switching map types etc
                mapTypeId: google.maps.MapTypeId.SATELLITE, // Set map type to satellite mode
                streetViewControl: false // Disable street view
            });

            // Set listener to get the lat-lng of clicked spot on map and fill in lat-lng fields on add-device page
            google.maps.event.addListener(addMap, 'click', function (event) {
                $("#addLat").val(event.latLng.lat());
                $("#addLng").val(event.latLng.lng());
            });
        });
    };

    /*
     * Initialise the graph canvases
     */
    this.initGraphCanvas = function () {
        // Set the size of the live data graphs to size of the container. Allows dynamic sizing
        $("#volgraphcanvas").width = $("#parent").width();
        $("#volgraphcanvas").height = $("#parent").height();
        $("#powgraphcanvas").width = $("#parent").width();
        $("#powgraphcanvas").height = $("#parent").height();
        // Call template drawing functions on live data graphs
        volGraph = home.drawGraphTemplate($("#volgraphcanvas"), "Monitor Voltage Measurements", "Voltage / V");
        powGraph = home.drawGraphTemplate($("#powgraphcanvas"), "Monitor Power Measurements", "Power / W");
        // Set the size of the report graphs to size of their containers. Allows dynamic sizing
        $(".reportGraphCanvas").width = $("#parent").width();
        $(".reportGraphCanvas").height = $("#parent").height();
        // Call template drawing functions on report graphs
        bvGraph = home.drawReportGraphTemplate($("#bvGraphCanvas"), "Battery Voltage", "Voltage - V");
        piGraph = home.drawReportGraphTemplate($("#piGraphCanvas"), "Power Imported", "Power - W");
        pxGraph = home.drawReportGraphTemplate($("#pxGraphCanvas"), "Power Exported", "Power - W");
        dvGraph = home.drawReportGraphTemplate($("#dvGraphCanvas"), "Distribution Voltage", "Voltage - V");
        lbGraph = home.drawReportGraphTemplate($("#lbGraphCanvas"), "Load Busbar", "Voltage - V");
        barGraph = home.drawHorBarTemplate($("#powerGraphCanvas"), "Total Energy Imported and Exported", "Energy - Whr");
        tariffGraph = home.drawBarTemplate($("#tariffGraphCanvas"), "Monetary Exchange", "Total Transaction per Tariff - RWF");
        // Initialise the calendar date picker
        picker = datepicker("#dateChoose", { // Create datepicker object
            onSelect: function (instance, date) { // Define the behaviour of clicking a date
                home.changeReportDate(date, date.getDate(), date.getMonth(), date.getFullYear()); // Change the data shown for energy base don date selected
                barGraph.update(); // Update energy in/out graph
                tariffGraph.update(); // Update the tariff graph
            }
        });
    };

    /*
     * Draw the template for the bar graph (tariff graph)
     * @params  canvas - The canvas DOM element
     *          title - The title of the graph
     *          type - The type of graph to build
     */
    this.drawBarTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'bar', // Create a bar chart
            data: {
                labels: [["Tariff 1", "274 RWF/kWh"], ["Tariff 2", "548 RWF/kWh"], ["Tariff 3", "822 RWF/kWh"], ["Tariff 4", "1096 RWF/kWh"]] // Define that there are 4 sets of data for each tariff.
            },
            options: { // Configuration for the graph, mostly self explanatory. Not all available options, mostly defaults are used and thus don't need defined
                title: {
                    display: true,
                    text: title
                },
                responsive: true, // Will resize the graph if the page size changes
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

    /*
     * Draw the template for the horizontal bar graph (energy graph)
     * @params  canvas - The canvas DOM element
     *          title - The title of the graph
     *          type - The type of graph to build
     */
    this.drawHorBarTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'horizontalBar', // Create a horizontal bar chart
            data: {
                labels: ["Import", "Export"] // Define that there are 2 sets of data, import and export
            },
            options: { // Configuration for the graph, mostly self explanatory. Not all available options, mostly defaults are used and thus don't need defined
                legend: {display: false},
                title: {
                    display: true,
                    text: title
                },
                responsive: true, // Will resize the graph if the page size changes
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

    /*
     * Draw the template for a line graph (live data graphs)
     * @params  canvas - The canvas DOM element
     *          title - The title of the graph
     *          type - The type of graph to build
     */
    this.drawGraphTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'line', // Create a line graph
            options: {
                animation: {
                    duration: 0 // Disable animation (Lags quite a bit with lots of data points)
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
                plugins: { // Enable the zoom & pan plugin
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

    /*
     * Draw the template for a line graph (report graphs)
     * @params  canvas - The canvas DOM element
     *          title - The title of the graph
     *          type - The type of graph to build
     */
    this.drawReportGraphTemplate = function (canvas, title, type) {
        return new Chart(canvas, {
            type: 'line', // Create a line graph
            options: {
                animation: {
                    duration: 0 // Disable animation (Lags quite a bit with lots of data points)
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
                plugins: { // Enable the zoom & pan plugin
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

    /*
     * Recales the graphs for live data after one graph is zoomed or panned to keep the range of displayed values the same in both graphs
     * @params chart - the zoomed or panned graph with the new min/max limits to synchronise other the graphs to
     */
    this.rescaleGraphs = function (chart) {
        // Rescale voltage graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        volGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        volGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        // Rescale power graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        powGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        powGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;

        // Update the displayed data
        volGraph.update();
        powGraph.update();
    };

    /*
     * Recales the graphs for reports after one graph is zoomed or panned to keep the range of displayed values the same in all graphs
     * @params chart - the zoomed or panned graph with the new min/max limits to synchronise other the graphs to
     */
    this.rescaleReportGraphs = function (chart) {
        // Rescale battery voltage graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        bvGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        bvGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;
        // Rescale power import graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        piGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        piGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;
        // Rescale power export graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        pxGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        pxGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;
        // Rescale distribution voltage graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        dvGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        dvGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;
        // Rescale load busbar graph. Set the displayed min/max to the zoomed/panned chart's new min/max
        lbGraph.options.scales.xAxes[0].time.min = chart.chart.options.scales.xAxes[0].time.min;
        lbGraph.options.scales.xAxes[0].time.max = chart.chart.options.scales.xAxes[0].time.max;
        // Update the displayed data
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
    };

    /*
     * Gets data for the report of the device selected and via callback functions presents that data in graphs and on the report page
     * @params imei - The IMEI number of the selected device
     */
    this.reportGraph = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.reportGraphCallback, "json"); // GET request for latest data on the device, followed by a callback function to present the data on the graphs
        $.get("getDeviceInfo.php?imei=" + imei + "&param=Balance", home.updateBalCallback, "json"); // GET request for the balance of the device, and callback to display the balance
    };

    /*
     * Callback function to display the newly received value for the balance of the selected device
     */
    this.updateBalCallback = function (bal) {
        $("#balVal").text(Math.floor(bal) + " RWF"); // Print to the specified DOM element
    };

    /*
     * Callback function to update the data in the report graphs
     * @params data - The new data to be added to the graph
     */
    this.reportGraphCallback = function (data) {
        curData = data; // Save a copy of the data
        var size = data.length;
        if (size) { // If there is data
            var graphData = home.buildReportData(data); // Restructure the JSON of data to comply with the data structure required for the graph package to understand it
            // Set the datasets of each type of data to the restructured data values
            bvGraph.data.datasets = graphData[0];
            piGraph.data.datasets = graphData[1];
            pxGraph.data.datasets = graphData[2];
            dvGraph.data.datasets = graphData[3];
            lbGraph.data.datasets = graphData[4];
            var dt = new Date(); // The current date and time
            // Set the upper limit for the displayed data to the current date and time
            bvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            piGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            pxGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            dvGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            lbGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            // Set the max limit for the zoom and pan to the current date and time i.e. can't look into the future
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
            // Set the default displayed limits and the zoom/pan min/max
            dt.setHours(dt.getHours() - 24); // Current DateTime -24 hours
            var dtLast = new Date(data[0].DateTime); // The oldest data point
            if (dt.valueOf() < dtLast.valueOf()) { // If the oldest data point is younger than 24 hours, use that as the displayed minimum, otherwise show the past 24 hours
                dt = dtLast;
            }
            // Set displayed minimum
            bvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            piGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            pxGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            dvGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            lbGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            // Set zoom/pan minimum to oldest data point
            bvGraph.options.plugins.zoom.pan.rangeMin = {x: dtLast.valueOf()};
            piGraph.options.plugins.zoom.pan.rangeMin = {x: dtLast.valueOf()};
            pxGraph.options.plugins.zoom.pan.rangeMin = {x: dtLast.valueOf()};
            dvGraph.options.plugins.zoom.pan.rangeMin = {x: dtLast.valueOf()};
            lbGraph.options.plugins.zoom.pan.rangeMin = {x: dtLast.valueOf()};
            bvGraph.options.plugins.zoom.zoom.rangeMin = {x: dtLast.valueOf()};
            piGraph.options.plugins.zoom.zoom.rangeMin = {x: dtLast.valueOf()};
            pxGraph.options.plugins.zoom.zoom.rangeMin = {x: dtLast.valueOf()};
            dvGraph.options.plugins.zoom.zoom.rangeMin = {x: dtLast.valueOf()};
            lbGraph.options.plugins.zoom.zoom.rangeMin = {x: dtLast.valueOf()};
            // Display energy and money graphs for current day
            home.changeReportDate(new Date(), new Date().getDate(), new Date().getMonth(), new Date().getFullYear());
        } else {
            // If no data for this device, show nothing on graphs
            bvGraph.data.datasets = {};
            piGraph.data.datasets = {};
            pxGraph.data.datasets = {};
            dvGraph.data.datasets = {};
            lbGraph.data.datasets = {};
            barGraph.data.datasets = {};
            tariffGraph.data.datasets = {};
        }
        // Update the graphs
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
        barGraph.update();
        tariffGraph.update();
    };

    /*
     * Rescale the graph to show the time range specified by the filter
     */
    this.reportTimescale = function () {
        var time = $("#timeField").val();
        // Convert unit of time into seconds
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
        // Set min and max displayed values to the current date and time back to the specified time
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
        // Update graphs
        bvGraph.update();
        piGraph.update();
        pxGraph.update();
        dvGraph.update();
        lbGraph.update();
    };

    /*
     * GET request to fetch latest data to then update live data graphs
     */
    this.updateGraphs = function (imei) {
        $.get("getLatestData.php?imei=" + imei, home.updateGraphsCallback, "json");
    };

    /*
     * Callback function to update the live data graphs
     * @params data - The latest data for selected device to be put on graphs
     */
    this.updateGraphsCallback = function (data) {
        var size = data.length;
        if (size) { // If there is data
            var graphData = home.buildGraphData(data); // Restructure the JSON of data to comply with the data structure required for the graph package to understand it
            // Set the datasets of each type of data to the restructured data values
            volGraph.data.datasets = graphData[0];
            powGraph.data.datasets = graphData[1];
            // Set displayed max and zoom/pan max to the current date and time
            var dt = new Date();
            volGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            powGraph.options.scales.xAxes[0].time.max = dt.valueOf();
            volGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.pan.rangeMax = {x: dt.valueOf()};
            volGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.zoom.rangeMax = {x: dt.valueOf()};
            // Set displayed min to latest 4 hours
            dt.setHours(dt.getHours() - 4);
            volGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            powGraph.options.scales.xAxes[0].time.min = dt.valueOf();
            // Set the min/max of zoom/pan to the oldest data
            dt = new Date(data[0].DateTime);
            volGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.pan.rangeMin = {x: dt.valueOf()};
            volGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
            powGraph.options.plugins.zoom.zoom.rangeMin = {x: dt.valueOf()};
        } else {
            // If no data exists, clear the graphs
            volGraph.data.datasets = {};
            powGraph.data.datasets = {};
        }
        // Update the graphs
        volGraph.update();
        powGraph.update();
    };

    /*
     * Build a JSON object to contain the data for the report graphs in the structure that the graph package can parse and understand
     * @params data - The data to be restructured
     */
    this.buildReportData = function (data) {
        var size = data.length;
        // Set up arrays for individual sets of data
        var bv = [size];
        var pi = [size];
        var px = [size];
        var dv = [size];
        var lb = [size];
        // Set up the JSON to return
        // Data array, label and graph colour specified for each type of data
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
        // Fill in the datasets with the raw data in the correct places in the restructure
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

    /*
     * Build a JSON object to contain the data for the live data graphs in the structure that the graph package can parse and understand
     * @params data - The data to be restructured
     */
    this.buildGraphData = function (data) {
        var size = data.length;
        // Set up arrays for individual sets of data
        var bv = [size];
        var pi = [size];
        var px = [size];
        var dv = [size];
        var lb = [size];
        // Set up the JSON to return
        // Data array, label and graph colour specified for each type of data
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
        // Fill in the datasets with the raw data in the correct places in the restructure
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

    /*
     * Change the energy exchange and monetray transactions graphs to correspond to the selected date chosen on the date picker calendar
     * @params  date - The Date object for the date chosen
     *          day - The day chosen 0-30
     *          month - The month chosen 0-11
     *          year - The year chosen YYYY
     */
    this.changeReportDate = function (date, day, month, year) {
        if (curData === undefined || curData === null) { // If no device is loaded, do not do anything
            return;
        }
        var size = curData.length;
        if (size) { // If the selected device has data
            // Energy in and out sum
            var eiSum = 0;
            var exSum = 0;
            // Monetary income and outgoing over 4 tariffs based on energy demand
            var income = [0, 0, 0, 0];
            var outgoing = [0, 0, 0, 0];
            var dvTemp;
            // Prepare the JSON of data structured for the graph package
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
            // Set the time limits for the day selected to check if data is within the datetime range
            var start = new Date(year, month, day);
            var end = new Date(year, month, day);
            end.setHours(23, 59, 59, 999);
            for (var i = 0; i < size - 1; i++) {
                var tempDate = new Date(curData[i].DateTime).valueOf();
                if (start.valueOf() <= tempDate.valueOf() && tempDate.valueOf() <= end.valueOf()) { // If datapoint happened on selected day
                    dvTemp = curData[i].DistributionVoltage / 100; // To decide the tariff
                    // Calculate 1 minute of energy in Whrs
                    var ei = curData[i].PowerImport / 6000;
                    var ex = curData[i].PowerExport / 6000;
                    // Sum the energy in/out
                    eiSum += ei;
                    exSum += ex;
                    // Sum the tariffs based on demand (distribution voltage)
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
            // Build the data JSON
            rtn[0][0].data[0] = eiSum;
            rtn[0][0].data[1] = exSum;

            rtn[1][0].data = income;
            rtn[1][1].data = outgoing;

            // Set the datasets of the graphs
            barGraph.data.datasets = rtn[0];
            tariffGraph.data.datasets = rtn[1];
        } else {
            // If no data exists, clear the graphs
            barGraph.data.datasets = {};
            tariffGraph.data.datasets = {};
        }
        // Update the graphs
        barGraph.update();
        tariffGraph.update();
        $("#dateShownVal").text(date.toDateString()); // Indicate the date selected
    };
}

home = new Home(); // Create a new instance of the set of functions
window.addEventListener('load', // When the window loads
    function (ev) {
        home.init(); // Initialise
    });