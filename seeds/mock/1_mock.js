exports.seed = function(knex, Promise) {
  // Deletes predefined users
  return Promise.all([
      knex('users').del(),
      knex('xref_user_emails').del(),
      knex('accounts').del(),
      knex('xref_user_account_roles').del(),
    ])
    .then(function () {
      return Promise.all([
        // Insert or update roles
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (1, 'Account Admin')"),
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (2, 'Analyst')"),
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (3, 'Member')"),

        //Superusers for HPE
        knex('users').insert({id: process.env.mockuserid, firstName: 'Gaia', lastName: 'Team', isSuperuser: true, isAdmin: true}),
        //User for integration tests - can be used by services integrated with ACM, for example in STS system tests
        knex('users').insert({id: 9, firstName: 'Gaia', lastName: 'Tester', isSuperuser: false, isAdmin: false}),
        knex('accounts').insert({id:9, name: 'Testing-1', description: 'Test account for using by integration tests'}),
      ]).then(function() {
        return Promise.all([

          //Superusers for HPE
          knex('xref_user_emails').insert({user_id: process.env.mockuserid ,email:'gaiaadmservice@gmail.com'}),
          knex('xref_user_emails').insert({user_id: 9 ,email:'gaiaadmtester@gmail.com'}),
          knex('xref_user_account_roles').insert({user_id:9,account_id:9,role_id:1}),
        ]);
      })
    });
};
