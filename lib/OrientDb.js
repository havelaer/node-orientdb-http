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
            if (err) return deferred.reject(new Error(err));

            deferred.resolve(body);
        });
        return deferred.promise;
    },

    info: function() {
        var self = this;
        var d = Q.defer();
        self.request.get({
            uri: self.host + '/class/' + self.database + '/V'
        }, function(err, response, body) {
            console.log(body);
            if (err)
                return d.reject(new Error(err));

            if (response.statusCode < 200 || response.statusCode > 299)
                return d.reject(response.statusCode, body);

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

    get: function(name) {

    },

    set: function(name, properties) {

        return Base.sub(name, {

            init: function() {

            },

            commit: function() {

            }

        }, {

            get: function(className) {

            }

        });
    }

});

/**
 * OrientDB Base Class
 *
 * @constructor
 * @parent Base
 */
var OClass = exports.OClass = Base.sub('OClass', {

    init: function() {

    },

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
var Vertex = exports.Vertex = OClass.sub('Vertex', {

    init: function() {

    },

    commit: function() {

    }

}, {

    get: function(vertexName) {

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
exports.Cluster = Base.sub('Cluster', {

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
exports.Document = Base.sub('Document', {

    init: function() {

    },

    commit: function() {

    }

}, {

    get: function(recordId) {

    }

});

