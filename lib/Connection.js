var request = require('request');
var Q = require('q');
var Base = require('./Base');
var OClass = require("./OClass");

/**
 * OrientDB Connection
 *
 * @constructor
 * @parent Base
 */
module.exports = Base.sub('Connection', {

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
    return self.get('connect').then(function() {
      console.log('connect');
      return self.info();
    });
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
      console.log('asdf');
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