var app = app || {};



app = (function() {
  'use strict';

  var init = function() {
    var canvas = document.getElementById('canvas-4');
    paper.setup(canvas);
    console.log('init');

    

  }


  return {
    init: init
  };


})();