var Base = require('./Base');
var request = require('request');
var Q = require('q');

var connectionInstance = null;

/**
 * OrientDB Connection
 *
 * @constructor
 * @parent Base
 */
exports.Connection = Base.sub('Connection', {

  init: function() {
    this.super.init.apply(this, arguments);
    this.status = 0;
    this.j = request.jar();
    this.request = request.defaults({
      jar: this.j,
      json: true,
      auth: { user: this.user, pass: this.password }
    });
  },

  connect: function() {
    var self = this;
    this.connecting = Q.defer();
    self.request.get({
      uri: self.host + '/connect/' + self.database
    }, function(err, response, body) {
      if (err)
        return self.connecting.reject(new Error(err));

      if (response.statusCode < 200 || response.statusCode > 299)
        return self.connecting.reject(response.statusCode, body);

      self.info().then(function() {
        self.connecting.resolve(body);
      }, function(err) {
        self.connecting.reject(err);
      });
    });
    return self.connecting.promise;
  },

  disconnect: function() {
    var self = this;
    var deferred = Q.defer();

    request.get(this.host + '/disconnect', function(err, response, body) {
      if (err) return deferred.reject(err);

      deferred.resolve(body);
    });
    return deferred.promise;
  },

  info: function() {
    var self = this;
    var d = Q.defer();
    self.request.get({
      uri: self.host + '/database/' + self.database + ''
    }, function(err, response, body) {
      var i;
      var c;

      if (err)
        return d.reject(new Error(err));

      if (response.statusCode < 200 || response.statusCode > 299)
        return d.reject(response.statusCode, body);

      self._classes = {};
      for(i = 0, ii = body.classes.length; i < ii; i++) {
        c = body.classes[i];
        self._classes[c.name] = OClass.sub(c.name, {
          db: self,
          defaults: c.properties
        });
      }

      d.resolve(this);
    });
    return d.promise;
  },

  _wrap: function(fn) {
    var self = this;
    self.connecting.resolve(function() {
      fn().then(null, function(err) {
        if (err === 401) {
          self.connect();
          self._wrap(fn);
        }
      });
    });
  },

  getClass: function(name) {
    return this._classes[name];
  },

  command: function(command, limit, fetchplan) {
    var d = Q.defer();
    var url = this.host + '/command/' + this.database + '/sql/' + command;
    this.request({
      method: 'POST',
      url: url
    },
    function(err, response, body) {
      if (err) return d.reject(err);

      if (response.statusCode < 200 || response.statusCode > 299)
        return d.reject(response.statusCode, body);

      d.resolve(body);
    });
    return d.promise;
  }

});

/**
 * OrientDB Base Class
 *
 * @constructor
 * @parent Base
 */
var OClass = exports.OClass = Base.sub('OClass', {

  save: function() {
    var self = this;
    var query;
    var attr;
    var attrs = [];
    var changed;
    var d = Q.defer();

    if (this.get('rid')) {
      query = 'update ' + this.get('rid') + ' set ' + attrs.join();
      changed = this.changed();
      for(attr in changed) {
        attrs.push(attr + "='" + this.get(attr) + "'");
      }
    } else {
      changed = this.attrs();
      for(attr in changed) {
        attrs.push(attr + "='" + this.get(attr) + "'");
      }
      query = 'insert into ' + this.constructor.name + ' set ' + attrs.join();
    }
    this.db.command(query).then(function(body) {
      self.clearChanges();
      if (!body.result) d.reject('no result');
      self.set(body.result[0]);
      d.resolve(self);
    }, function(err) {
      d.reject(err);
    });
    return d.promise;
  }

},{

  all: function(filter) {
    var self = this;
    var d = Q.defer();
    var attr;
    var query;

    for(attr in filter) {
      if (!filter[attr]) continue;
      attrs.push(attr + "='" + this.get(attr) + "'");
    }

    query = 'select from ' + this.name + ' where ' + attrs;

    db.command(query).then(function(body) {
      self.clearChanges();
      d.resolve(this);
    }, function(err) {
      d.reject(err);
    });
  },

  get: function() {

  }

});

/**
 * OrientDB Vertex
 *
 * @constructor
 * @parent OClass
 */
var Vertex = exports.Vertex = OClass.sub('V', {

}, {

});

/**
 * OrientDB Edge
 *
 * @constructor
 * @parent OClass
 */
var Edge = exports.Edge = OClass.sub('E', {

}, {

});

/**
 * OrientDB Query
 *
 * @constructor
 * @parent OClass
 */
var Query = exports.Query = Base.sub('E', {

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

