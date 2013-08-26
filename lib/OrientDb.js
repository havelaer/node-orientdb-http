var Base = require('./Base');
var request = require('request');
var Q = require('q');

/**
 * OrientDB Connection
 *
 * @constructor
 * @parent Base
 */
exports.Connection = Base.sub('Connection', {

  init: function() {
    var self = this;
    this.super.init.apply(this, arguments);
    this.status = 0;
    this.j = request.jar();
    this._request = request.defaults({
      jar: this.j,
      json: true,
      auth: { user: this.user, pass: this.password }
    });

    var methods = ['post', 'get', 'put', 'delete'];
    for(var i = 0; i < methods.length; i++) {
      this[methods[i]] = (function(i) {
        return function(command, args) {
          return self.request(methods[i].toUpperCase(), command, args);
        };
      })(i);
    }
  },

  connect: function() {
    var self = this;
    this.connecting = Q.defer();
    self._request.get({
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
    return self.get('database').then(function(body) {
      var d = Q.defer();
      var i, c;

      self._classes = {};
      for(i = 0, ii = body.classes.length; i < ii; i++) {
        c = body.classes[i];
        self._classes[c.name] = OClass.sub(c.name, {
          defaults: c.properties
        }, {
          db: self
        });
      }

      d.resolve(this);
      return d.promise;
    });
  },

  getClass: function(name) {
    return this._classes[name];
  },

  request: function(method, command, args) {
    var d = Q.defer();
    var url = this.host + '/' + command + '/' + this.database + (args ? '/' + args : '');
    console.log(url);
    this._request({
      method: method,
      url: url
    },
    function(err, response, body) {
      if (err) return d.reject(err);

      if (response.statusCode < 200 || response.statusCode > 299)
        return d.reject(response.statusCode, body);

      d.resolve(body);
    });
    return d.promise;
  },

  command: function(query, limit, fetchplan) {
    return this.post('command', 'sql/' + query + (limit ? '/' + limit + (fetchplan ? '/' + fetchplan : '') : ''));
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
    this.constructor.db.command(query).then(function(body) {
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

  find: function(filter) {
    var self = this;
    var d = Q.defer();
    var attr;
    var query;

    for(attr in filter) {
      if (!filter[attr]) continue;
      attrs.push(attr + "='" + this.get(attr) + "'");
    }

    query = 'select from ' + this.name + ' where ' + attrs;

    this.db.command(query).then(function(body) {
      self.clearChanges();
      d.resolve(this);
    }, function(err) {
      d.reject(err);
    });
  },

  get: function(rid, fetchplan) {
    var self = this;
    rid = rid.replace('#', '');
    return self.db.get('document', rid + (fetchplan ? '/' + fetchplan : '')).then(function(body) {
      var C = self.db.getClass(body['@class']);
      return new C(body);
    });
  }

});

/**
 * OrientDB Query
 *
 * @constructor
 * @parent OClass
 */
var Query = exports.Query = Base.sub('Query', {

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

