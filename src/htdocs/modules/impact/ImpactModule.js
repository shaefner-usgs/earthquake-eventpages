'use strict';

var EventModule = require('base/EventModule'),
    Util = require('util/Util');


var DEFAULTS = {
  title: 'Impact',
  hash: 'impact',
  cssUrl: 'modules/impact/index.css',
  pages: [

  /**
   * NOTE: pages that are bundled in the impact module must be added
   * to the "browserify:impact" target.
   */

    {
      className: 'impact/DYFIPage',
      dependencyBundle: 'modules/impact/index.js',
      options: {
        title: 'Did You Feel It?',
        hash: 'dyfi'
      },
      productTypes: ['dyfi']
    },
    {
      className: 'impact/DYFIFormPage',
      dependencyBundle: [
        'modules/impact/index.js',
        'lib/leaflet/leaflet.js'
      ],
      options: {
        title: 'Tell Us!',
        hash: 'tellus'
      }
    },
    {
      className: 'impact/ShakeMapPage',
      dependencyBundle: 'modules/impact/index.js',
      options: {
        title: 'Shakemap',
        hash: 'shakemap'
      },
      productTypes: ['shakemap']
    },
    {
      className: 'impact/PagerPage',
      dependencyBundle: 'modules/impact/index.js',
      options: {
        title: 'PAGER',
        hash: 'pager'
      },
      productTypes: ['losspager']
    },
    {
      className: 'summary/InteractiveMap',
      dependencyBundle: [
        'modules/summary/index.js',
        'lib/leaflet/leaflet.js'
      ],
      options: {
        title: 'Interactive Map',
        hash: 'map'
      }
    }
  ]
};


var ImpactModule = function (options) {
  options = Util.extend({}, DEFAULTS, options || {});

  EventModule.call(this, options);
};
ImpactModule.prototype = Object.create(EventModule.prototype);


module.exports = ImpactModule;
