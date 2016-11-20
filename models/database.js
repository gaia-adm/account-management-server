var config = require('config');
var knex = require('knex');
var bookshelf = require('bookshelf');
console.info(process.env.DB_HOST);
try {
    if (process.argv.toString().indexOf('env=mock') > -1) {
        console.log('Working with SQLite 3');
        knex = knex({
            client: 'sqlite3',
            connection: {
                filename: 'sqlite_for_testing'
            },
            useNullAsDefault: true,
            searchPath: 'knex,mock',
            debug: (config.get('db.debug'))
        });
    } else {
        console.log('Working with Postgres');
        knex = knex({
            client: 'pg',
            connection: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: (process.env.NODE_ENV === 'test') ? config.get('db.connection.database') : process.env.DB_DATABASE
            },
            searchPath: 'knex,public',
            debug: (config.get('db.debug'))
        });
    }

    try {
        bookshelf = bookshelf(knex);
        bookshelf.plugin('registry');
    }
    catch (e) {
        console.error('ERROR: Could not bookshelf.');
        console.error(e);
    }
} catch (e) {
    console.error('ERROR: Could not create connection.');
    console.error(e);
}

module.exports = bookshelf;
