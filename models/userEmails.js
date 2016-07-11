var db = require('./database');
var User = require('./users');

var UserEmail = db.Model.extend({
  idAttribute: 'email',
  tableName: 'xref_user_emails',
  user: function() {
    return this.belongsTo('User');
  }
});

module.exports = db.model('UserEmail', UserEmail);
