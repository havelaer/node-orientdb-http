var Base = require('./Base');
var Q = require('q');

/**
 * OrientDB Query
 *
 * @constructor
 * @parent OClass
 */
module.exports = Base.sub('Query', {

  init: function() {
    this._projections = 'select';
    this._target = '';
    this._conditions = '';
    this._order = '';
    this._skip = '';
    this._limit = false;
    this._fetchplan = false;
  },

  // projections

  class: function() {

  },

  cluster: function(cid) {

  },

  rid: function(rid) {
    this._rid = rid;
  },

  // target

  target: function(target) {
    this._target = target;
  },

  // where

  where: function(key, operator, value) {
    if (!value) value = operator;

    if (this._conditions === '') {
      this._conditions += ' and ';
    }
  },

  and: function(key, operator, value) {
    if (!value) value = operator;
    this._conditions += ' and ';
  },

  any: function(operator, value) {
    this.where('any()', operator, value);
  },

  all: function(operator, value) {
    this.where('all()', operator, value);
  },

  column: function(column_index, operator, value) {

  },

  between: function(key, min, max) {

  },

  instanceOf: function() {

  },

  in: function() {

  },

  contains: function() {

  },

  toString: function() {
    return 'select';
  }

}, {

});

