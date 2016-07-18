'use strict';

exports.up = function(knex, Promise) {
  return knex.schema
    .createTableIfNotExists('users', function(table) {
      table.increments('id').primary();
      table.string('firstName');
      table.string('lastName');
      table.boolean('isSuperuser').defaultTo(false);
    })
    .createTableIfNotExists('xref_user_emails', function(table) {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('email').primary();
    })
    .createTableIfNotExists('accounts', function(table) {
      table.increments('id').primary();
      table.string('name').unique().notNullable();
      table.string('description');
      table.binary('icon');
      table.boolean('enabled').defaultTo(true);
    })
    .createTableIfNotExists('roles', function(table) {
      table.integer('id').primary();
      table.string('name').unique();
    })
    .createTableIfNotExists('xref_user_account_roles', function(table) {
      table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.integer('account_id').references('id').inTable('accounts').onDelete('CASCADE');
      table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
    })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('xref_user_emails');
  return knex.schema.dropTable('xref_user_account_roles');
  return knex.schema.dropTable('users');
  return knex.schema.dropTable('accounts');
  return knex.schema.dropTable('roles');
};
