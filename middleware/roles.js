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

/**
 * Function must return boolean
 * SQLite stores boolean type as a number (1/0) that's why it is not enough just return req.user.isSupervisor - it can be a number instead boolean
 */
roles.use('superuser', function(req) {
  if(req.user.isSuperuser){
    return true;
  } else {
    return false;
  }
});

/**
 * Function must return boolean
 * SQLite stores boolean type as a number (1/0) that's why it is not enough just return (req.user.isAdmin || req.user.isSuperuser) - it can be a number instead boolean
 */
roles.use('siteAdmin', function(req) {
  if(req.user.isAdmin || req.user.isSuperuser){
    return true;
  } else {
    return false;
  }
});

roles.use('self', function(req) {
  return Number(req.params.id) === Number(req.user.id);
});

//account admin, analyst, member not well-handled with a convenience method

module.exports = roles;
