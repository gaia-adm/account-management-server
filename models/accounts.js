var db = require('./database');
var UserAccountRole = require('./userAccountRoles');
var User = require('./users');
var Roles = require('./roles');

var Account = db.Model.extend({
  tableName: 'accounts',
  users: function() {
    return this.belongsToMany(User).through(UserAccountRole);
  },
  userRoles: function() {
    return this.hasMany(Role).through(UserAccountRole);
  }
});

module.exports = Account;
