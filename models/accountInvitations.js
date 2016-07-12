var db = require('./database');
var Account = require('./accounts');

var AccountInvitations = db.Model.extend({
  tableName: 'account_invitations',
  account: function() {
    return this.belongsTo('Account', 'account_id');
  }
});

module.exports = db.model('AccountInvitations', AccountInvitations);
