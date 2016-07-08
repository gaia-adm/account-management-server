var db = require('./database');
var User = require('./users');

var Email = db.Model.extend({
  idAttribute: 'email',
  tableName: 'xref_user_emails',
  user: function() {
    return this.belongsTo(User);
  }
});

module.exports = Email;
