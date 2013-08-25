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
    t.plan(1);

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

test('create vertex', function (t) {
    t.plan(1);

    var db = new OrientDb.Connection(config);
    var Vertex = db.getClass('Vertex');

    var batman = new Vertex({ name: 'batman' });
    batman.commit().then(pass(t), fail(t, 'should create vertex'));
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