'use strict';

const db = require('./database');
const UserEmail = require('./userEmails');
const UserAccountRole = require('./userAccountRoles');
const Account = require('./accounts');
const _ = require('lodash');
const Promise = require('bluebird');

const User = db.Model.extend({
  tableName: 'users',
  emails: function() {
    return this.hasMany('UserEmail');
  },
  accounts: function() {
    return this.belongsToMany('Account', 'account_id').through('UserAccountRole', 'user_id');
  },
  accountRoles: function() {
    return this.hasMany('UserAccountRole');
  }
}, {
  dependents: ['emails', 'accountRoles'],
  createUser: function(userData) {
    let data = _.pick(userData, ['firstName', 'lastName', 'emails']);
    data.emails = _.map(data.emails, function(email) {
      return {'email': email};
    });

    return db.transaction(function(t) {
      return User.forge({
        firstName: data.firstName,
        lastName: data.lastName
      })
        .save(null, {transacting: t, method: 'insert'})
        .tap(user =>
          //NOTE: must _explicitly_ set method to insert to get a duplicate key violation
          Promise.map(data.emails, email => user.related('emails').create(email, {method: 'insert', transacting: t}))
        );
    });
  }
});

module.exports = db.model('User', User);
