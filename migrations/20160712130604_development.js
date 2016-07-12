
exports.up = function(knex, Promise) {
  return knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    .then(function() {
      return knex.schema
        .createTableIfNotExists('account_invitations', function(table) {
          table.increments('id').primary();
          table.uuid('uuid').unique().defaultTo(knex.raw('uuid_generate_v4()'));
          table.integer('account_id').references('id').inTable('accounts').onDelete('CASCADE');
          table.string('email');
          table.specificType('invited_role_ids','int[]');
          table.dateTime('date_invited').defaultTo(knex.fn.now());
          table.dateTime('date_accepted');
          table.unique(['account_id', 'email']);
        });
    });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTableIfExists('account_invitations');
};
