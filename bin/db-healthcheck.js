var args = process.argv;

var config = require('config');
var pg = require('pg');

var connection = (args[2]) ? args[2] : {
  "database": "hpe_account_management",
  "user": "hpe_account_management",
  "password": "",
  "port": 5532
};

console.log('CONNECTION: ' + JSON.stringify(connection));

var db = require('knex')({
  client: 'pg',
  connection: connection
});
// var db = require('../models/database');

var client = new pg.Client(connection);

var end = function() {
  db.destroy(endClientConnection);
};

var endClientConnection = // disconnect the client
  function() {
    client.end(function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      process.exit(0);
    });
  };


client.connect(function (err) {
  if (err) { console.error(err); }
  console.log('Successful connection to postgres database.');

  //Check the migration
  return db.migrate.latest({
    tableName: 'knex_migrations'
  })
    .then(function(version) {
      console.info('version: ' + version);
      end();
    })
    .catch(function(err) {
      console.info('error', err);
      if (err) {
        console.error(err);
        process.exit(1);
      }
      end();
    });
});

