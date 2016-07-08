exports.up = function(knex, Promise) {
  return knex.schema
    .createTable('users', function(table) {
      table.increments('id').primary();
      table.string('firstName');
      table.string('lastName');
      table.boolean('isSuperuser').defaultTo(false);
    })
    .createTable('xref_user_emails', function(table) {
      table.integer('user_id').references('id').inTable('users');
      table.string('email').primary();
    })
    .createTable('accounts', function(table) {
      table.integer('id').primary();
      table.string('name').notNullable();
      table.string('description');
      table.binary('icon');
      table.boolean('enabled').defaultTo(true);
    })
    .createTable('roles', function(table) {
      table.integer('id').primary();
      table.string('name').unique();
    })
    .createTable('xref_user_account_roles', function(table) {
      table.integer('user_id').references('id').inTable('users');
      table.integer('account_id').references('id').inTable('accounts');
      table.integer('role_id').references('id').inTable('roles');
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('xref_user_emails');
  return knex.schema.dropTable('xref_user_account_roles');
  return knex.schema.dropTable('users');
  return knex.schema.dropTable('accounts');
  return knex.schema.dropTable('roles');
};
