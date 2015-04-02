'use strict';

var EventModulePage = require('base/EventModulePage'),
    Formatter = require('base/Formatter'),
    Util = require('util/Util'),

    Tensor = require('./tensor/Tensor');


// default options
var DEFAULTS = {
  title: 'Summary',
  hash: 'summary',
  formatter: new Formatter()
};


/**
 * Create a new ScientificSummaryPage.
 * @param options {Object}
 *        module options.
 */
var ScientificSummaryPage = function (options) {
  this._options = Util.extend({}, DEFAULTS, options);
  EventModulePage.call(this, this._options);
};

// extend EventModulePage
ScientificSummaryPage.prototype = Object.create(EventModulePage.prototype);

// Do not display a header
ScientificSummaryPage.prototype._setHeaderMarkup = function () {};
// Do not display a footer
ScientificSummaryPage.prototype._setFooterMarkup = function () {};

/**
 * Render page content.
 */
ScientificSummaryPage.prototype._setContentMarkup = function () {
  var products = this._options.eventDetails.properties.products,
      product;

  // Hypocenter content
  if (products.hasOwnProperty('origin')) {
    product = products.origin[0];
    this.getPreferredSummaryMarkup(product, 'scientific_origin', 'Origin');
  }

  // Moment Tensor content
  if (products.hasOwnProperty('moment-tensor')) {
    product = Tensor.fromProduct(products['moment-tensor'][0]);
    this.getPreferredSummaryMarkup(product, 'scientific_tensor', 'Moment Tensor');
  }

  // Focal Mechanism content
  if (products.hasOwnProperty('focal-mechanism')) {
    product = Tensor.fromProduct(products['focal-mechanism'][0]);
    this.getPreferredSummaryMarkup(product, 'scientific_mechanism', 'Focal Mechanism');
  }

  // Finite Fault content
  if (products.hasOwnProperty('finite-fault')) {
    product = products['finite-fault'][0];
    this.getPreferredSummaryMarkup(product, 'scientific_finitefault', 'Finite Fault');
  }

  // scitech-text content
  this.getText();

  // scitech-links content
  this._content.appendChild(this.getLinks());
};

/**
 * Get any scitech-text information.
 *
 * @return {DOMElement} content, or null if no information present.
 */
ScientificSummaryPage.prototype.getText = function () {
  var products = this._event.properties.products,
      texts = products['scitech-text'],
      textEl = null,
      buf,
      i,
      len,
      text;

  if (texts) {
    textEl = document.createElement('div');
    textEl.className = 'scitech-text';

    buf = [];
    buf.push('<h3>Scientific and Technical Commentary</h3>');
    for (i = 0, len = texts.length; i < len; i++) {
      text = texts[i].contents[''].bytes;
      buf.push('<section>', text, '</section>');
    }

    textEl.innerHTML = buf.join('');
  }

  if (textEl !== null) {
    this._content.appendChild(textEl);
  }
};

/**
 * Get any scitech-link information.
 *
 * @return {DocumentFragment}
 *         Fragment with links, or empty if no information present.
 */
ScientificSummaryPage.prototype.getLinks = function () {
  var fragment = document.createDocumentFragment(),
      products = this._event.properties.products,
      links = products['scitech-link'],
      linkEl = null,
      i,
      item,
      len,
      list;

  if (links) {
    linkEl = document.createElement('div');
    linkEl.className = 'scitech-links';
    linkEl.innerHTML = '<h3>Scientific and Technical Links</h3>';
    fragment.appendChild(linkEl);

    list = document.createElement('ul');
    linkEl.appendChild(list);

    for (i = 0, len = links.length; i < len; i++) {
      item = document.createElement('li');
      item.appendChild(this.getLink(links[i]));
      list.appendChild(item);
    }
  }

  return fragment;
};

/**
 * Create an anchor element from a link product.
 *
 * @param product {Object}
 *        The link product.
 * @return {DOMEElement}
 *         anchor element.
 */
ScientificSummaryPage.prototype.getLink = function (product) {
  var el = document.createElement('a'),
      props = product.properties;

  el.setAttribute('href', props.url);
  el.innerHTML = props.text;

  return el;
};


module.exports = ScientificSummaryPage;
