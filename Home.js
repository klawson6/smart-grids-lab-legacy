"use strict"

var view = null;

function Home() {
    this.init = function(){
        window.console.log("Jess is always sick.");
        view.updateGraphs();
    };

    this.updateGraphs = function () {

    };
}

view = new Home();
window.addEventListener('load',
    function (ev) {
        view.init();
    });