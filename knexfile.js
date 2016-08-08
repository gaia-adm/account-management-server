// Update with your config settings.
var config = require('config');
module.exports = {

  test: {
    client: 'pg',
    connection: {
      database: 'hpe_account_management_test',
      // user:     'username',
      // password: 'password'
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  development: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgresql',
    connection: {
      host:     process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    }
  }

};
