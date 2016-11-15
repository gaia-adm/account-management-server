exports.seed = function(knex, Promise) {
  // Deletes predefined users
  return Promise.all([
      knex('users').where('id','IN', [1,2,3,4,5]).del(),
      knex('xref_user_emails').where('email','IN',['alexei.ledenev@hpe.com', 'alexei.led@gmail.com']).del(),
      knex('xref_user_emails').where('email','IN',['gaiaadmservice@gmail.com']).del()
    ])
    .then(function () {
      return Promise.all([
        // Insert or update roles
        knex.raw("INSERT INTO roles (id, name) values (1, 'Account Admin') ON CONFLICT (id) DO UPDATE SET name = 'Account Admin'"),
        knex.raw("INSERT INTO roles (id, name) values (2, 'Analyst') ON CONFLICT (id) DO UPDATE SET name = 'Analyst'"),
        knex.raw("INSERT INTO roles (id, name) values (3, 'Member') ON CONFLICT (id) DO UPDATE SET name = 'Member'"),

        //Superusers for HPE
        knex('users').insert({id: 1, firstName: 'Alexei', lastName: 'Ledenev', isSuperuser: true, isAdmin: true}),
        knex('users').insert({id: 10, firstName: 'Gaia', lastName: 'Team', isSuperuser: true, isAdmin: true}),

      ]).then(function() {
        return Promise.all([

          //Superusers for HPE
          knex('xref_user_emails').insert({user_id:1,email:'alexei.ledenev@hpe.com'}),
          knex('xref_user_emails').insert({user_id:1,email:'alexei.led@gmail.com'}),

          knex('xref_user_emails').insert({user_id:10,email:'gaiaadmservice@gmail.com'})

        ]);
      })
    });
};
