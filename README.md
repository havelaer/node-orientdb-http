node-orientdb-http
==================

A Node.js driver for OrientDB using the OrientDB RESTful HTTP protocol.

Very basic http wrapper using request and Q. Tested on [OrientDb](http://www.orientdb.org/) 1.6.1.

## Install
```
npm install node-orientdb-http
```

## Connect
```
var orientdb = require('node-orientdb-http');

var db = orientdb.connect({
    host: "http://localhost:2480",
    user: "admin",
    password: "admin",
    database: "test"
});

db.on('connect', function() {
    // yes! connected
});

db.on('error', function(err) {
    // mmm error ..
});
```

## Play
See [OrientDB-REST](https://github.com/orientechnologies/orientdb/wiki/OrientDB-REST) for more docs.
```
// general api
db.[get|post|put|delete](:command, :queryParams, :postBody).then(successHandler, errorHandler);

var d = { '@class': 'V', name: 'Robin'};
db.post('document', null, d).then(successHandler, errorHandler);

db.delete('document', '9:1').then(successHandler, errorHandler);

// or specific commands
db.command('insert into V set name = "Batman"').then(successHandler, errorHandler);

db.query('select * from V where name = "Batman"').then(successHandler, errorHandler);
```

## Changelog

0.1.1 

* encodeURIComponent for complexe request against OrientDB (@welcoMattic)

0.1.0

* First Release