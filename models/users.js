var db = require('./database');
var Email = require('./userEmails');
var UserAccountRole = require('./userAccountRoles');

var User = db.Model.extend({
  tableName: 'users',
  emails: function() {
    return this.hasMany(Email);
  },
  accountRoles: function() {
    return this.hasMany(UserAccountRole);
  }
}, {
  dependents: ['emails', 'accountRoles']
});

module.exports = User;
