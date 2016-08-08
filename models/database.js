var config = require('config');
var knex = require('knex');
var bookshelf = require('bookshelf');
console.info(process.env.DB_HOST);
try {
  knex = knex({
    client: 'pg',
    connection: {
      host     : process.env.DB_HOST,
      user     : process.env.DB_USER,
      password : process.env.DB_PASSWORD,
      database : process.env.DB_DATABASE
    },
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
