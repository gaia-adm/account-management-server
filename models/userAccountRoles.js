var db = require('./database');
var User = require('./users');
var Account = require('./accounts');
var Role = require('./roles');

var UserAccountRole = db.Model.extend({
  tableName: 'xref_user_account_roles',
  idAttribute: 'user_id', //this is a lie to make bookshelf work
  user: function() {
    return this.belongsTo('User', "user_id")
  },
  account: function() {
    return this.belongsTo('Account', 'account_id');
  },
  role: function() {
    return this.belongsTo('Role', 'role_id');
  }
});

module.exports = db.model('UserAccountRole', UserAccountRole);
