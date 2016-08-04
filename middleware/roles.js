const ConnectRoles = require('connect-roles');

const roles = new ConnectRoles({
  failureHandler: function (req, res, action) {
    // optional function to customise code that runs when
    // user fails authorisation
    var accept = req.headers.accept || '';
    res.status(403);
    if (~accept.indexOf('html')) {
      res.render('access-denied', {action: action});
    } else {
      res.send('Access Denied - You don\'t have permission to: ' + action);
    }
  }
});

roles.use('superuser', function(req) {
  return req.user.isSuperuser;
});

roles.use('siteAdmin', function(req) {
  return req.user.isAdmin || req.user.isSuperuser;
});

roles.use('self', function(req) {
  return Number(req.params.id) === Number(req.user.id);
});

//account admin, analyst, member not well-handled with a convenience method

module.exports = roles;
