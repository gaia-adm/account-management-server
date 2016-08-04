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

        //USER 42 is a SUPERUSER
        knex('users').insert({id: 42, firstName: 'Awesome', lastName: 'Superuser', isSuperuser: true, isAdmin: true}),

        //USER 43 is a SITE ADMIN
        knex('users').insert({id: 43, firstName: 'Site', lastName: 'Admin', isSuperuser: false, isAdmin: true}),

        //USER 44 is an ACCOUNT ADMIN on account 36 and an ANALYST on account 37
        knex('users').insert({id: 44, firstName: 'Account', lastName: 'Admin', isSuperuser: false, isAdmin: false}),

        //USER 45 is an ANALYST on account 36 and a MEMBER on account 37
        knex('users').insert({id: 45, firstName: 'Account', lastName: 'Analyst', isSuperuser: false, isAdmin: false}),

        knex('users').insert({id: 1010, firstName: 'Alexei', lastName: 'Ledenev', isSuperuser: false, isAdmin: true}),
        knex('accounts').insert({id:36, name: 'Test Account', description: 'Short Description'}),
        knex('accounts').insert({id:37, name: 'Another Account', description: 'Another Description'}),
        knex('roles').insert({id:1, name: 'Account Admin'}),
        knex('roles').insert({id:2, name: 'Analyst'}),
        knex('roles').insert({id:3, name: 'Member'})
      ]).then(function() {
        return Promise.all([
          knex('xref_user_emails').insert({user_id:42,email:'richard.plotkin@toptal.com'}),
          knex('xref_user_emails').insert({user_id:43,email:'richardjplotkin@gmail.com'}),
          knex('xref_user_emails').insert({user_id:44,email:'richard@richardplotkin.com'}),
          knex('xref_user_emails').insert({user_id:45,email:'emilykplotkin@gmail.com'}),
          knex('xref_user_emails').insert({user_id:1010,email:'alexei.ledenev@hpe.com'}),
          knex('xref_user_account_roles').insert({user_id:42,account_id:36,role_id:2}),
          knex('xref_user_account_roles').insert({user_id:42,account_id:36,role_id:3}),
          knex('xref_user_account_roles').insert({user_id:43,account_id:36,role_id:1}),
          knex('xref_user_account_roles').insert({user_id:43,account_id:36,role_id:2}),
          knex('xref_user_account_roles').insert({user_id:44,account_id:36,role_id:1}),
          knex('xref_user_account_roles').insert({user_id:44,account_id:37,role_id:2}),
          knex('xref_user_account_roles').insert({user_id:45,account_id:36,role_id:2}),
          knex('xref_user_account_roles').insert({user_id:45,account_id:37,role_id:3}),
          knex('xref_user_account_roles').insert({user_id:1010,account_id:37,role_id:3})
        ]);
      })
    });
};
