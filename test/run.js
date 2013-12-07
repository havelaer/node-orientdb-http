var test = require("tap").test;
var orientdb = require('../orientdb');
var config = require('../config/test');

function pass(t, msg) { return function() { t.ok(true, msg); }; }
function fail(t, msg) { return function(err) { console.log(err); t.ok(false, msg); t.end(); }; }

test('incorrect connect', function (t) {
  t.plan(1);
  var db = orientdb.connect({
    host: "http://localhost:2480",
    user: "admin",
    password: "wrong password",
    database: "blog"
  });

  db.on('connect', function() {
    t.ok(false, 'should not connect to orientdb');
  });

  db.on('error', function(err) {
    t.ok(err, 'should return Error');
    t.end();
  });
});

var db; // globals
var rid = null;

test('connect', function (t) {
  db = orientdb.connect(config);

  db.on('connect', function() {
    t.ok(true, 'should connect to orientdb');
    t.end();
  });

  db.on('error', function() {
    t.bailout('bailing out of tests, db connection failed');
    t.end();
  });
});

test('info', function (t) {
  db.get('database').then(function(body) {
    t.ok(body.server, 'should return server info');
    t.ok(body.classes, 'should return class info');
    t.ok(body.clusters, 'should return cluster info');
    t.ok(body.dataSegments, 'should return dataSegments info');
    t.ok(body.txSegment, 'should return txSegment info');
    t.ok(body.currentUser, 'should return currentUser info');
    t.ok(body.users, 'should return users info');
    t.ok(body.config, 'should return config info');
    t.end();
  }, function() {
    t.bailout('bailing out of tests, db connection failed');
    t.end();
  });
});

test('command', function (t) {
  t.plan(3);
  db.command("insert into V set name = 'Robin' ").then(function (response) {
    t.ok(true, 'should insert vertex');
    t.ok(response.result, 'should return response');
    t.ok(response.result[0]['@rid'], 'should return rid');
    rid = response.result[0]['@rid'];
  }, fail(t, 'should insert vertex')
  );
});

test('command', function (t) {
  t.plan(1);
  db.command("delete from V where name like 'Robin' ").then(function (response) {
    t.ok(true, 'should delete vertex');
  }, fail(t, 'should delete vertex')
  );
});

test('document', function (t) {
  t.plan(3);
  var vertex = {
    '@class': 'V',
    name: 'Robin'
  };
  db.post("document", null, vertex).then(function (response) {
    t.ok(true, 'should insert vertex');
    t.equal(response['@class'], 'V', 'should return correct class');
    t.equal(response['name'], 'Robin', 'should return same name');
    rid = response['@rid']; // global for next test
  }, fail(t, 'should insert vertex')
  );
});

test('document', function (t) {
  t.plan(1);
  var vertex = {
    '@class': 'V',
    name: 'Robin'
  };
  db.delete("document", rid.replace('#', '')).then(function (response) {
    t.ok(true, 'should delete document');
  }, fail(t, 'should delete document')
  );
});

test('disconnect', function (t) {
  t.plan(1);

  db.disconnect();

  db.on('disconnect', function() {
    t.ok(true, 'should disconnect');
    t.end();
  });
});
