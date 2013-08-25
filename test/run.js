var test = require("tap").test;
var Q = require('../node_modules/q');
var OrientDb = require('../lib/OrientDb').Connection;
var config = require('../config/test');


function pass(t, msg) { return function() { t.ok(true, msg); }; }
function fail(t, msg) { return function(err) { console.log(err); t.ok(false, msg); t.end(); }; }


test('incorrect connect', function (t) {
  t.plan(1);

  var db = new OrientDb({
    host: "http://localhost:2480",
    user: "admin",
    password: "wrong password",
    database: "blog"
  });

  db.connect().then(function() {
    fail(t, 'should not connect to orientdb');

  }, function(statusCode, body) {
    t.equal(statusCode, 401, 'should return 401 Unauthorized');
  });
});


var db = new OrientDb(config); // globals
var rid = null;


test('connect', function (t) {
  db.connect().then(function() {
    t.ok(true, 'should connect to orientdb');
    t.ok(db._classes, 'should retrieve db classes');
    t.ok(db.getClass('E') instanceof Function, 'should be a sub of OClass');
    t.end();
  }, function() {
    t.bailout('bailing out of tests, db connection failed');
    t.end();
  });
});


test('command', function (t) {
  t.plan(1);
  db.command("insert into V set name = 'batman' ").then(
    pass(t, 'should insert vertex'),
    fail(t, 'should insert vertex')
  );
});


test('create vertex', function (t) {
  var Vertex = db.getClass('V');
  var hero = new Vertex({ name: 'Batman' });
  hero.set('color', 'black');
  hero.save().then(function(hero) {
    t.ok(hero, 'should return instance');
    t.ok(hero instanceof Vertex, 'should be instance of Vertex');
    t.ok(hero.get('@rid'), 'should have rid');
    t.equal(hero.get('name'), 'Batman', 'should have correct property by init');
    t.equal(hero.get('color'), 'black', 'should have correct property by setter');
    t.end();
  }, fail(t, 'should create vertex'));
});

/*
test('load vertex', function (t) {
  var Vertex = db.getClass('V');
  Vertex.get(rid).then(function(hero) {
    t.ok(hero instanceof Vertex, 'should be instance of Vertex');
    t.equal(hero.get('name'), 'batman', 'should find right vertex');
    t.end();
  }, fail(t, 'should find vertex'));
});


/*
test('find vertices', function (t) {
  Vertex.get(hero.get()).then(function(heros) {
    t.ok(heros instanceof Array, 'should return array of vertices');
    t.ok(hero[0] instanceof Vertex, 'item should be instance of Vertex');
    t.equal(hero[0].get('name'), 'batman', 'should find right vertex');
    t.end();
  }, fail(t, 'should find vertex'));
});

test('load vertex', function (t) {
  Vertex.get().then(function(hero) {
    t.ok(hero instanceof Vertex, 'should be instance of Vertex');
    t.equal(hero.get('name'), 'batman', 'should find right vertex');
    t.end();
  }, fail(t, 'should find vertex'));
});

test('update vertex', function (t) {
  t.plan(1);

  Vertex.update({ name: 'batman' }, { name: 'bruce'}).then(function(hero) {
    t.ok(hero, 'should return vertex');
    t.equal(hero.get('name'), 'bruce', 'should find right vertex');
  });
});

test('connect two vertices', function (t) {
  var batman = new Vertex({ name: 'batman' });

  var robin = new Vertex({ name: 'robin' });

  Q.when(batman.commit(), robin.commit(), function(v1, v2) {
    var rel = new Edge(v1, v2, { label: 'teaches' });
    rel.commit().then(pass(t), fail(t, 'should create edge'));
  });
});

test('connect two vertices by promises', function (t) {
  var batman = new Vertex({ name: 'batman' });

  var robin = new Vertex({ name: 'robin' });

  var rel = new Edge(batman.commit(), robin.commit(), { label: 'teaches' });
  rel.commit().then(pass(t), fail(t, 'should create edge'));
});

test('create extended vertex', function (t) {
  t.plan(1);

  var heroSchema = new Schema({
    _extends: 'V',
    name: String
  });

  db.syncClass('Hero', heroSchema, { silent: true }).then(function(Hero) {
    var superman = new Hero({ name: 'superman' });
    superman.commit().then(pass(t), fail(t, 'should create extended vertex'));
  });
});
*/


test('disconnect', function (t) {
  db.disconnect().then(function() {
    t.ok(true, 'should disconnect');
    t.end();
  }, function() {
    t.ok(false, 'should disconnect');
    t.end();
  });
});
