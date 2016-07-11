var db = require('./database');
var UserAccountRole = require('./userAccountRoles');

var Role = db.Model.extend({
  tableName: 'roles',
  accountUsers: function() {
    return this.hasMany(UserAccountRole);
  }
});

module.exports = db.model('Role', Role);
