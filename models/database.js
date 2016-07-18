var config = require('config');
var knex = require('knex');
var bookshelf = require('bookshelf');

try {
  knex = knex({
    client: 'pg',
    connection: config.get('db.connection'),
    searchPath: 'knex,public',
    debug: (config.get('db.debug'))
  });
  try {
    bookshelf = bookshelf(knex);
    bookshelf.plugin('registry');
  }
  catch(e) {
    console.error('ERROR: Could not bookshelf.');
    console.error(e);
  }
} catch(e) {
  console.error('ERROR: Could not create connection.');
  console.error(e);
}

module.exports = bookshelf;
