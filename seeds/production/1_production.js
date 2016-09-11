exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return Promise.all([
      knex('users').where('id','IN', [1,2,3,4,5]).del(),
      knex('xref_user_emails').where('email','IN',['alexei.ledenev@hpe.com', 'alexei.led@gmail.com']),
      knex('xref_user_emails').where('email','IN',['gaiaadmservice@gmail.com']),
      knex('xref_user_emails').where('email','IN',['richard.plotkin@toptal.com', 'richardjplotkin@gmail.com','richard@richardplotkin.com','emilykplotkin@gmail.com']),
      knex('roles').del()
    ])
    .then(function () {
      return Promise.all([
        // Inserts seed entries
        knex('roles').insert({id:1, name: 'Account Admin'}),
        knex('roles').insert({id:2, name: 'Analyst'}),
        knex('roles').insert({id:3, name: 'Member'}),

        //Superusers for HPE
        knex('users').insert({id: 1, firstName: 'Alexei', lastName: 'Ledenev', isSuperuser: true, isAdmin: true}),
        knex('users').insert({id: 10, firstName: 'Gaia', lastName: 'Team', isSuperuser: true, isAdmin: true}),

        //USER 42 is a SUPERUSER
        knex('users').insert({id: 2, firstName: 'Awesome', lastName: 'Superuser', isSuperuser: true, isAdmin: true}),

        //USER 43 is a SITE ADMIN
        knex('users').insert({id: 3, firstName: 'Site', lastName: 'Admin', isSuperuser: false, isAdmin: true}),

        //USER 44 is an ACCOUNT ADMIN on account 36 and an ANALYST on account 37
        knex('users').insert({id: 4, firstName: 'Account', lastName: 'Admin', isSuperuser: false, isAdmin: false}),

        //USER 45 is an ANALYST on account 36 and a MEMBER on account 37
        knex('users').insert({id: 5, firstName: 'Account', lastName: 'Analyst', isSuperuser: false, isAdmin: false})

      ]).then(function() {
        return Promise.all([

          //Superusers for HPE
          knex('xref_user_emails').insert({user_id:1,email:'alexei.ledenev@hpe.com'}),
          knex('xref_user_emails').insert({user_id:1,email:'alexei.led@gmail.com'}),

          knex('xref_user_emails').insert({user_id:10,email:'gaiaadmservice@gmail.com'}),

          knex('xref_user_emails').insert({user_id:2,email:'richard.plotkin@toptal.com'}),
          knex('xref_user_emails').insert({user_id:3,email:'richardjplotkin@gmail.com'}),
          knex('xref_user_emails').insert({user_id:4,email:'richard@richardplotkin.com'}),
          knex('xref_user_emails').insert({user_id:5,email:'emilykplotkin@gmail.com'})
        ]);
      })
    });
};
