exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return Promise.all([
    knex('xref_user_emails').del(),
    knex('xref_user_account_roles').del(),
    knex('account_invitations').del(),
    knex('users').del(),
    knex('accounts').del(),
    knex('roles').del()
  ]);
};
