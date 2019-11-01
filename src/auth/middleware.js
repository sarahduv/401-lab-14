'use strict';

const User = require('./users-model.js');

module.exports = (required_capability) => {
  
  return (req, res, next) => {

    try {
      let [authType, authString] = req.headers.authorization.split(/\s+/);

      switch (authType.toLowerCase()) {
      case 'basic':
        return _authBasic(authString);
      case 'bearer':
        return _authBearer(authString);
      default:
        return _authError();
      }
    } catch (e) {
      _authError();
    }


    function _authBasic(str) {
    // str: am9objpqb2hubnk=
      let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
      let bufferString = base64Buffer.toString();    // john:mysecret
      let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
      let auth = {username, password}; // { username:'john', password:'mysecret' }

      return User.authenticateBasic(auth)
        .then(user => _authenticate(user))
        .then(() => {})
        .catch(_authError);
    }

    function _authBearer(authString) {
      return User.authenticateToken(authString)
        .then(user => _authenticate(user))
        .then(() => {})
        .catch(_authError);
    }

    async function _authenticate(user) {
      if ( user ) {
        let user_has_capability = false;
        if (!required_capability) {
          user_has_capability = true;
        } else {
          // there is a required capability
          user_has_capability = await user.can(required_capability);
        }
        if (user_has_capability) {
          req.user = user;
          req.token = await user.generateToken();
          next();
        } else {
          _authError();
        }
      }
      else {
        _authError();
      }
    }

    function _authError() {
      next('Invalid User ID/Password');
    }

  };
  
};