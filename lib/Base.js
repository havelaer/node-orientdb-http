// copied from https://github.com/Havelaer/base.js

var Registry  = {},
  __cid       = 0,
  __array     = Array.prototype,
  __fn        = Function.prototype,
  __forEach   = __array.forEach,
  __slice     = __array.slice,
  __map       = __array.map;


var _each = function(iterator, context) {
  if (__forEach) {
    __forEach.call(this, iterator, context);
  } else {
    for (var i = 0, l = this.length; i < l; i++) {
      iterator.call(context, this[i], i, this);
    }
  }
  return this;
};

var _extend = function(extend) {
  for (var prop in extend) {
    if (extend.hasOwnProperty(prop)) {
      this[prop] = extend[prop];
    }
  }
  return this;
};

/**
 * Basic Object class used for all other classes
 *
 * @constructor
 * @this Base
 */
function Base() {
  this.init.apply(this, arguments);
}

/**
 * Create sub Class
 *
 * @param {string}
 * @param {object} properties and methods of instance
 * @param {object} static properties and methods
 * @return {function} Child class
 */
Base.sub = function(name, instanceProps, staticProps) {
  var f = ["return function ", name, "(){ this.init.apply(this, arguments); }"],
    a = Registry[name] = new Function(f.join(''))(),
    C = this,
    _init = C.prototype.init,
    b;

  Base.extend.call(a, this);

  C.prototype.init = function() {};
  b = new C();
  C.prototype.init = _init;
  a.prototype = b;
  a.prototype.constructor = a;
  a.prototype.super = C.prototype;

  if (instanceProps)
    Base.extend.call(a.prototype, instanceProps);
  if (staticProps)
    Base.extend.call(a, staticProps);
  return a;
};

/**
 * Extend properties and methods
 *
 * @param {object} object of methods and properties
 * @return {this}
 */
Base.extend = _extend;

Base.extend.call(Base.prototype, {

  /**
   * Constructor function
   *
   * @param {object} object that will be wrapped as Base object
   */
  init: function() {
    this._cid = ++__cid;
    Base.extend.apply(this, arguments);
    this._previous = {};
  },

  /**
   * Setter
   *
   * @param {object} hash of attributes
   * @param {object} options
   * or
   * @param {string} name of attribute
   * @param {string} attribute value
   * @param {object} options
   * @return {this}
   */
  set: function(attrs, options) {
    if (typeof attrs === 'object') {
      for(var k in attrs) {
        this.set(k, attrs[k], options);
      }
    } else {
      var value = options, name = attrs;
      options = arguments[2];
      if (this[name] && this[name] === value) return this;
      this._previous[name] = this[name];
      this[name] = value;
      this.trigger('change');
    }
    return this;
  },

  /**
   * Getter
   *
   * @param {string} name attribute
   * @return {mixed} attribute value
   */
  get: function(name) {
    return this[name];
  },

  /**
   * attrs
   *
   * @return {object} attributes
   */
  attrs: function() {
    var attrs = {};
    for(var key in this) {
      if (key.charAt(0) === '_') continue;
      if (typeof this[key] === 'function') continue;
      if (!this.hasOwnProperty(key)) continue;
      attrs[key] = this.get(key);
    }
    return attrs;
  },

  /**
   * dirty
   *
   * @return {object} attributes
   */
  dirty: function() {
    var attrs = {};
    for(var key in this._previous) {
      attrs[key] = this[key];
    }
    return attrs;
  },

  /**
   * cleanUp
   *
   * @return {this}
   */
  cleanUp: function() {
    this._previous = {};
    return this;
  },

  /**
   * previous
   *
   * @return {object} attributes
   */
  previous: function() {
    return this._previous;
  },

  /**
   * Bind event listener
   *
   * @param {string} name of event
   * @param {function} callback if event is triggered
   * @param {object} context in which callback is called
   * @return {this}
   */
  on: function(evname, callback, context) {
    this._events = this._events || {};
    var a = this._events[evname] = this._events[evname] || [];
    a.push({
      cb: callback,
      ctxt: context || this
    });
    return this;
  },

  /**
   * Bind event listener and only fire once
   *
   * @param {string} name of event
   * @param {function} callback if event is triggered
   * @param {object} context in which callback is called
   * @return {this}
   */
  once: function(evname, callback, context) {
    var self = this, args = arguments;
    this.on(evname, function() {
      callback.apply(context, arguments);
      self.off.apply(self, args);
    });
    return this;
  },

  /**
   * Remove event listener
   *
   * @param {string} name of event
   * @param {function} callback if event is triggered
   * @return {this}
   */
  off: function(evname, callback, context) {
    if (!evname && !callback && !context) {
      this._events = {};
      return this;
    } else if (!evname) {
      for (var _evname in this._events) {
        this.off(_evname, callback, context);
      }
      return this;
    } else {
      var fns = this._events[evname], l = fns.length;
      while (l--) {
        if ((callback ? fns[l].cb === callback : true) && (context ? fns[l].ctxt === context : true)) {
          fns.splice(l, 1);
        }
      }
      return this;
    }
  },

  /**
   * Trigger event on object
   *
   * @param {string} name of event
   * @param {array} array of arguments
   * @return {this}
   */
  trigger: function(evname) {
    var fns = this._events && this._events[evname] || [],
    args = __slice.call(arguments, 1);
    for (var i = 0, ii = fns.length; i < ii; i++) {
      fns[i].cb.apply(fns[i].ctxt, args);
    }
  },

  /**
   * Bind event listener on an other object
   *
   * @param {object} object to listen to
   * @param {string} name of event
   * @param {function} callback
   * @return {this}
   */
  listenTo: function(other, evname, callback) {
    other.on(evname, callback, this);
    var a = this._listeningTo = this._listeningTo || {},
      b = a[other._cid] = other;
  },

  /**
   * Remove event listener from an other object
   *
   * @param {object} object to listening to
   * @param {string} name of event
   * @param {function} callback
   * @return {this}
   */
  stopListening: function(other, evname, callback) {
    if (!this._listeningTo) return;
    if (!other) {
      for (var cid in this._listeningTo) {
        this.stopListening(this._listeningTo[cid], evname, callback);
      }
    } else {
      other.off(evname, callback, this);
      // TODO: remove local listener tracker
    }
  }

});

module.exports = Base;