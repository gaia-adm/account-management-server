var config = require('config');
var knex = require('knex')({
  client: 'pg',
  connection: config.get('db.url'),
  searchPath: 'knex,public',
  debug: (config.get('db.debug'))
});
var bookshelf = require('bookshelf')(knex);
bookshelf.plugin('registry');

module.exports = bookshelf;
