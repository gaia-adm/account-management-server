var db = require('./database');
var UserAccountRole = require('./userAccountRoles');
var User = require('./users');
var Roles = require('./roles');

var Account = db.Model.extend({
  tableName: 'accounts',
  // idAttribute: 'id',
  users: function() {
    return this.belongsToMany('User', 'user_id').through('UserAccountRole', 'account_id');
  }
  // ,
  // userRoles: function() {
  //   return this.hasMany(Role).through(UserAccountRole);
  // }
});

module.exports = db.model('Account', Account);
