var Base = require('./Base');
var Q = require('q');

/**
 * OrientDB OClass
 *
 * @constructor
 * @parent Base
 */
module.exports = Base.sub('OClass', {

  save: function() {
    var self = this;
    var query;
    var attr;
    var attrs = [];
    var changed;
    var d = Q.defer();
    var val;

    if (this.get('@rid')) {
      changed = this.changed();
      for(attr in changed) {
        val = changed[attr];
        switch(typeof val) {
          case 'number':
            attrs.push(attr + "=" + val);
            break;
          default:
            attrs.push(attr + "='" + val + "'");
        }
      }
      query = 'update ' + this.get('@rid') + ' set ' + attrs.join();
    } else {
      changed = this.attrs();
      for(attr in changed) {
        val = changed[attr];
        switch(typeof val) {
          case 'number':
            attrs.push(attr + "=" + val);
            break;
          default:
            attrs.push(attr + "='" + val + "'");
        }
      }
      query = 'insert into ' + this.constructor.name + ' set ' + attrs.join();
    }
    this.constructor.db.command(query).then(function(body) {
      self.clearChanges();
      if (!body.result) d.reject('no result');
      self.set(body.result[0]);
      d.resolve(self);
    }, function(err, body) {
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