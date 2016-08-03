exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return Promise.all([
      knex('xref_user_emails').del(),
      knex('xref_user_account_roles').del(),
      knex('users').del(),
      knex('accounts').del(),
      knex('roles').del()
    ])
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('users').insert({id: 42, firstName: 'Richard', lastName: 'Plotkin', isSuperuser: true}),
        knex('users').insert({id: 1010, firstName: 'Alexei', lastName: 'Ledenev'}),
        knex('accounts').insert({id:36, name: 'Test Account', description: 'Short Description'}),
        knex('accounts').insert({id:37, name: 'Another Account', description: 'Another Description'}),
        knex('roles').insert({id:1, name: 'Account Admin'}),
        knex('roles').insert({id:2, name: 'Analyst'}),
        knex('roles').insert({id:3, name: 'Member'})
      ]).then(function() {
        return Promise.all([
          knex('xref_user_emails').insert({user_id:42,email:'richard.plotkin@toptal.com'}),
          knex('xref_user_emails').insert({user_id:42,email:'richardjplotkin@gmail.com'}),
          knex('xref_user_account_roles').insert({user_id:42,account_id:36,role_id:2}),
          knex('xref_user_account_roles').insert({user_id:42,account_id:36,role_id:3})
        ]);
      })
    });
};
