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

      it('can sign in to public stuff', () => {
        return mockRequest.get('/public-stuff')
          .expect(200);
      });

      it('can sign in to hidden stuff', () => {
        return mockRequest.get('/hidden-stuff')
          .auth(users[userType].username, users[userType].password)
          .expect(200);
      });

      it('can sign in to something to read', () => {
        return mockRequest.get('/something-to-read')
          .auth(users[userType].username, users[userType].password)
          .expect(200);
      });

    });
    
  });

  it('can sign in to create a thing', () => {
    return mockRequest.post('/create-a-thing')
      .auth(users.admin.username, users.admin.password)
      .expect(200);
  });

  it('can sign in to update a thing', () => {
    return mockRequest.put('/update')
      .auth(users.admin.username, users.admin.password)
      .expect(200);
  });

  it('can sign in to delete a thing', () => {
    return mockRequest.delete('/bye-bye')
      .auth(users.admin.username, users.admin.password)
      .expect(200);
  });

  it('will be unable to access this route because superuser role does not exist', () => {
    return mockRequest.post('/router-get-everything')
      .auth(users.admin.username, users.admin.password)
      .expect(500);
  });

  it('Testing the oAuth static function from email', async () => {
    const admin = await new Users({
      username: 'adminTwo', 
      password: 'password', 
      email: 'admin@admin.com', 
      role: 'admin',
    }).save();
    const admin2 = await Users.createFromOauth('admin@admin.com');
    expect(admin2.username).toEqual(admin.username);
  });

  it('Testing the authenticate basic static function from email', async () => {
    const admin = await new Users({
      username: 'adminThree', 
      password: 'password', 
      email: 'admin3@admin.com', 
      role: 'admin',
    }).save();
    const hashedPass = 'password';
    const admin3 = await Users.authenticateBasic({username: 'adminThree', password: hashedPass});
    expect(admin3.username).toEqual(admin.username);
  });
  
});