exports.seed = function(knex, Promise) {
  // Deletes predefined users
  return Promise.all([
      knex('users').del(),
      knex('xref_user_emails').del()
    ])
    .then(function () {
      return Promise.all([
        // Insert or update roles
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (1, 'Account Admin')"),
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (2, 'Analyst')"),
        knex.raw("INSERT OR IGNORE INTO roles (id, name) values (3, 'Member')"),

        //Superusers for HPE
        knex('users').insert({id: process.env.mockuserid, firstName: 'Gaia', lastName: 'Team', isSuperuser: true, isAdmin: true}),

      ]).then(function() {
        return Promise.all([

          //Superusers for HPE
          knex('xref_user_emails').insert({user_id: process.env.mockuserid ,email:'gaiaadmservice@gmail.com'})

        ]);
      })
    });
};
