var config = require('config');
var knex = require('knex')({
  client: 'pg',
  connection: config.get('db.url'),
  searchPath: 'knex,public'
});
var bookshelf = require('bookshelf')(knex);
var cascadeDelete = require('bookshelf-cascade-delete');
bookshelf.plugin(cascadeDelete.default);


module.exports = bookshelf;
