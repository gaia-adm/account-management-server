'use strict';

function makeError(msg, status) {
  let err = new Error(msg);
  err.status = status;
  return err;
}

module.exports = {
    'ACCOUNT_UPDATE_REQUIRES_USERS': makeError('Account update requires a non-empty array of user objects when users property is present.', 400),
    'ACCOUNT_UPDATE_USER_DATA_VALIDATION': makeError('Account update of user roles requires users with an id and role_id.')
};
