'use strict';

var Util = require('util/Util'),
    View = require('mvc/View');

var _ID,
    _TITLE,
    _TYPES;


// Note: These should be overridden by each implementing sub-class.
_ID = 'module';
_TITLE = 'Default Module';
_TYPES = [];

var _DEFAULTS = {

};


var Module = function (options) {
  var _this,
      _initialize;


  options = Util.extend({}, _DEFAULTS, options);
  _this = View(options);

  _initialize = function (/*options*/) {

  };


  _initialize(options);
  options = null;
  return _this;
};


Module.ID = _ID;
Module.TITLE = _TITLE;
Module.TYPES = _TYPES;


module.export = Module;
