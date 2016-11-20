exports.up = function (knex, Promise) {
    return knex.schema
        .createTableIfNotExists('users', function (table) {
            table.integer('id').primary();
            table.string('firstName');
            table.string('lastName');
            table.boolean('isSuperuser').defaultTo(false);
        })
        .createTableIfNotExists('accounts', function (table) {
            table.increments('id').primary();
            table.string('name').unique().notNullable();
            table.string('description');
            table.binary('icon');
            table.boolean('enabled').defaultTo(true);
        })
        .createTableIfNotExists('roles', function (table) {
            table.integer('id').primary();
            table.string('name').unique();
        })
        .createTableIfNotExists('xref_user_emails', function (table) {
            table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('email').primary();
        })
        .createTableIfNotExists('xref_user_account_roles', function (table) {
            table.integer('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.integer('account_id').references('id').inTable('accounts').onDelete('CASCADE');
            table.integer('role_id').references('id').inTable('roles').onDelete('CASCADE');
        })
};

exports.down = function (knex, Promise) {
    return knex.schema
        .dropTableIfExists('xref_user_emails')
        .dropTableIfExists('xref_user_account_roles')
        .dropTableIfExists('users')
        .dropTableIfExists('accounts')
        .dropTableIfExists('roles');
};
