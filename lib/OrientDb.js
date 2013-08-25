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
      if (err)
        return d.reject(new Error(err));

      if (response.statusCode < 200 || response.statusCode > 299)
        return d.reject(response.statusCode, body);

      self._classes = {};
      for(var i = 0, ii = body.classes.length; i < ii; i++) {
        self._classes[body.classes[i].name] = OClass.sub(body.classes[i].name, body.classes[i].properties);
      }

      d.resolve(body);
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

  commit: function() {

  }

}, {

  commitTo: function(db) {

  }

});

/**
 * OrientDB Command
 *
 * @constructor
 * @parent Base
 */
var Command = exports.Command = Base.sub('Command', {

  init: function() {

  },

  commit: function() {

  }

}, {

  get: function(className) {

  }

});

/**
 * OrientDB Query
 *
 * @constructor
 * @parent Base
 */
var Query = exports.Query = Base.sub('Query', {

  init: function() {

  },

  commit: function() {

  }

}, {

  get: function(className) {

  }

});

/**
 * OrientDB Vertex
 *
 * @constructor
 * @parent OClass
 */
var Vertex = exports.Vertex = OClass.sub('V', {

  commitTo: function(db) {
    var self = this, query;
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
    db.command(query).then(function(body) {
      self.clearChanges();
      d.resolve(this);
    }, function(err) {
      d.reject(err);
    });
    return d.promise;
  }

}, {

  find: function(filter) {

  }

});

/**
 * OrientDB Edge
 *
 * @constructor
 * @parent OClass
 */
var Edge = exports.Edge = OClass.sub('Edge', {

  init: function() {

  },

  commit: function() {

  }

}, {

  get: function(edge) {

  }

});

/**
 * OrientDB Cluster
 *
 * @constructor
 * @parent Base
 */
var Cluster = exports.Cluster = Base.sub('Cluster', {

  init: function() {

  },

  commit: function() {

  }

}, {

  get: function(cluster) {

  }

});

/**
 * OrientDB Document
 *
 * @constructor
 * @parent Base
 */
var Document = exports.Document = Base.sub('Document', {

  init: function() {

  },

  commit: function() {

  }

}, {

  get: function(recordId) {

  }

});

