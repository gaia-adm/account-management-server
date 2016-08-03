'use strict';

function makeError(msg, status) {
  let err = new Error(msg);
  err.status = status;
  return err;
}

module.exports = {
    'ACCOUNT_INVALID_EMAIL': makeError('Invalid email address.', 400),
    'ACCOUNT_UPDATE_REQUIRES_USERS': makeError('Account update requires a non-empty array of user objects when users property is present.', 400),
    'ACCOUNT_UPDATE_USER_DATA_VALIDATION': makeError('Account update of user roles requires users with an id and role_id.', 400),
    'INVITATION_INVALID_EMAIL': makeError('Invalid email address.', 400),
    'INVITATION_NO_ROLES_PROVIDED': makeError('Invitation requires an array of role_ids.', 400),
    'INVITATION_DOES_NOT_EXIST': makeError('Invitation does not exist.', 400),
    'INVITATION_UNMATCHING_EMAIL': makeError('Invited email address is not validated with this authorization.', 400),
    'NOT_AUTHORIZED': makeError('You are not allowed to access this resource.', 403)
};
