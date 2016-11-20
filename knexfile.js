// Update with your config settings.
require('dotenv').load({silent: true});
var config = require('config');
module.exports = {

  test: {
    client: 'pg',
    connection: {
      host:     process.env.DB_HOST,
      database: 'hpe_account_management_test',
      user:     'hpe_account_management_test',
      password: 'hpe_account_management_test'
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
    },
    seeds: {
      directory: './seeds/production'
    }
  },

  mock: {
    client: 'sqlite3',
    connection: {
      filename: 'sqlite_for_testing'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './mock_migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/mock'
    }
  },

  reset: {
    client: 'postgresql',
    connection: {
      host:     process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds/reset'
    }
  }

};
