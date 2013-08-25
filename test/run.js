var test = require("tap").test;
var Q = require('../node_modules/q');
var OrientDb = require('../lib/OrientDb');
var config = require('../config/test');

function pass(t, msg) { return function() { t.ok(true, msg); }; }
function fail(t, msg) { return function() { t.ok(false, msg); }; }

test('unauthorized connect', function (t) {
  t.plan(1);

  var db = new OrientDb.Connection({
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

test('connect & disconnect', function (t) {
  t.plan(2);

  var db = new OrientDb.Connection(config);
  db.connect().then(function() {
    t.ok(true, 'should connect to orientdb');

    db.disconnect().then(function() {
      t.ok(true, 'should disconnect from orientdb');
    }, fail(t, 'should disconnect from orientdb'));

  }, function() {
    t.fail('should connect to orientdb with proper config');
    t.bailout('bailing out of tests, db connection failed');
    t.end();
  });

});

test('command', function (t) {
  t.plan(1);

  var db = new OrientDb.Connection(config);
  db.connect().then(function() {

    t.test('insert query', function (t) {
      t.plan(1);
      db.command("insert into V set name = 'batman' ").then(pass(t, 'should insert vertex'), fail(t, 'should insert vertex'));
    });

    db.disconnect();

  });
});


test('vertices', function (t) {

  var db = new OrientDb.Connection(config);

  db.connect().then(function() {

    pass(t, 'make connection');

    var Vertex = OrientDb.Vertex;

    t.test('create vertex', function (t) {
      t.plan(1);

      var hero = new Vertex({ name: 'batman' });
      hero.commitTo(db).then(pass(t), fail(t, 'should create vertex'));
    });

    /*
    t.test('find vertex', function (t) {
      t.plan(3);

      Vertex.find({ name: 'batman' }).then(function(heros) {
        t.ok(heros instanceof Array, 'should return array of vertices');
        t.ok(hero[0] instanceof Vertex, 'item should be instance of Vertex');
        t.equal(hero[0].get('name'), 'batman', 'should find right vertex');
      }, fail(t, 'should find vertex'));
    });

    t.test('update vertex', function (t) {
      t.plan(1);

      Vertex.update({ name: 'batman' }, { name: 'bruce'}).then(function(hero) {
        t.ok(hero, 'should return vertex');
        t.equal(hero.get('name'), 'bruce', 'should find right vertex');
      });
    });

    t.test('connect two vertices', function (t) {
      var batman = new Vertex({ name: 'batman' });

      var robin = new Vertex({ name: 'robin' });

      Q.when(batman.commit(), robin.commit(), function(v1, v2) {
        var rel = new Edge(v1, v2, { label: 'teaches' });
        rel.commit().then(pass(t), fail(t, 'should create edge'));
      });
    });

    t.test('connect two vertices by promises', function (t) {
      var batman = new Vertex({ name: 'batman' });

      var robin = new Vertex({ name: 'robin' });

      var rel = new Edge(batman.commit(), robin.commit(), { label: 'teaches' });
      rel.commit().then(pass(t), fail(t, 'should create edge'));
    });

    t.test('create extended vertex', function (t) {
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

    db.disconnect();
  }, fail(t, 'no connection'));
});