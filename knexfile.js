// Update with your config settings.
var config = require('config');
module.exports = {

  test: {
    client: 'postgresql',
    connection: {
      database: 'hpe_account_management_test',
      // user:     'username',
      // password: 'password'
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './test/seeds'
    }
  },

  development: {
    client: 'postgresql',
    connection: {
      database: 'hpe_account_management',
      // user:     'username',
      // password: 'password'
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './test/seeds'
    }
  },

  staging: {
    client: 'postgresql',
    connection: {
      database: 'hpe_account_management',
      user:     'username',
      password: 'password'
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
      database: 'my_db',
      user:     'username',
      password: 'password'
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
