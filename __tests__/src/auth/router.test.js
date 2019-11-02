'use strict';

process.env.SECRET = 'test';

const jwt = require('jsonwebtoken');
const setupRoles = require('../../../src/auth/setup-roles-common.js');
const supergoose = require('../../supergoose.js');
// eslint-disable-next-line no-unused-vars
const RoleModel = require('../../../src/auth/roles-model.js');
// eslint-disable-next-line no-unused-vars
const Users = require('../../../src/auth/users-model.js');
const server = require('../../../src/app.js').server;


const mockRequest = supergoose.server(server);

let users = {
  admin: {username: 'admin', password: 'password', role: 'admin'},
  editor: {username: 'editor', password: 'password', role: 'editor'},
  user: {username: 'user', password: 'password', role: 'user'},
};

beforeAll(async (done) => {
  await supergoose.startDB();

  // Creating the roles
  await setupRoles();
  // Creating the users
  // const admin = await new Users(users.admin).save();
  // const editor = await new Users(users.editor).save();
  // const user = await new Users(users.user).save();
  done();
});


afterAll(supergoose.stopDB);

describe('Auth Router', () => {
  
  Object.keys(users).forEach( userType => {
    
    describe(`${userType} users`, () => {
      
      let encodedToken;
      let id;
      
      it('can create one', () => {
        return mockRequest.post('/signup')
          .send(users[userType])
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            id = token.id;
            encodedToken = results.text;
            expect(token.id).toBeDefined();
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with basic', () => {
        return mockRequest.post('/signin')
          .auth(users[userType].username, users[userType].password)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

      it('can signin with bearer', () => {
        return mockRequest.post('/signin')
          .set('Authorization', `Bearer ${encodedToken}`)
          .then(results => {
            var token = jwt.verify(results.text, process.env.SECRET);
            expect(token.id).toEqual(id);
            expect(token.capabilities).toBeDefined();
          });
      });

    });
    
  });
  
});