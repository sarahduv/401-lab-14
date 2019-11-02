'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// eslint-disable-next-line no-unused-vars
const RolesModel = require('./roles-model.js');
const slog = require('../sarah-logging.js');

const SINGLE_USE_TOKENS = !!process.env.SINGLE_USE_TOKENS;
const TOKEN_EXPIRE = process.env.TOKEN_LIFETIME || '5m';
const SECRET = process.env.SECRET || 'foobar';

const usedTokens = new Set();

const usersSchema = new mongoose.Schema({
  username: {type:String, required:true, unique:true},
  password: {type:String, required:true},
  email: {type: String},
  role: {type: String, default:'user', enum: ['admin','editor','user']},
  
}, {
  toObject: { virtuals: true },
  toJSON: { virtuals: true },
});

usersSchema.virtual('role_doc', {
  ref: 'roles',
  localField: 'role',
  foreignField: 'role',
  justOne: true,
});

// const capabilities = {
//   admin: ['create','read','update','delete'],
//   editor: ['create', 'read', 'update'],
//   user: ['read'],
// };

usersSchema.pre('save', async function() {
  if (this.isModified('password'))
  {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
usersSchema.statics.createFromOauth = function(email) {

  if(! email) { return Promise.reject('Validation Error'); }

  return this.findOne( {email} )
    .then(user => {
      if( !user ) { throw new Error('User Not Found'); }
      return user;
    })
    // eslint-disable-next-line no-unused-vars
    .catch( error => {
      let username = email;
      let password = 'none';
      return this.create({username, password, email});
    });

};

usersSchema.statics.authenticateToken = function(token) {

  if ( usedTokens.has(token ) ) {
    return Promise.reject('Invalid Token');
  }

  try {
    let parsedToken = jwt.verify(token, SECRET);
    (SINGLE_USE_TOKENS) && parsedToken.type !== 'key' && usedTokens.add(token);
    let query = {_id: parsedToken.id};
    return this.findOne(query);
  } catch(e) { throw new Error('Invalid Token'); }

};

usersSchema.statics.authenticateBasic = function(auth) {
  let query = {username:auth.username};
  return this.findOne(query)
    .then( user => user && user.comparePassword(auth.password) )
    .catch(error => {throw error;});
};

usersSchema.methods.comparePassword = function(password) {
  console.log('PASSWORD HASH', password, this.password);
  return bcrypt.compare( password, this.password )
    .then( valid => valid ? this : null);
};

usersSchema.methods.generateToken = async function(type) {
  slog.log('Generating token for user with type: ', type);
  const role = await this.getRole();
  let token = {
    id: this._id,
    capabilities: role.capabilities,
    type: type || 'user',
  };

  let options = {};
  if ( type !== 'key' && !! TOKEN_EXPIRE ) {
    options = { expiresIn: TOKEN_EXPIRE };
  }

  return jwt.sign(token, SECRET, options);
};

usersSchema.methods.can = async function(capability) {
  const role = await this.getRole();
  return role.capabilities.includes(capability);
};

usersSchema.methods.getRole = async function() {
  const user = await this.populate('role_doc').execPopulate();
  slog.log('Populated user with roles: ', user);
  const role = user.role_doc;
  if(role === null) {
    throw new Error('invalid role for user ' + user.username);
  }
  return role;
};

usersSchema.methods.generateKey = async function() {
  return await this.generateToken('key');
};

module.exports = mongoose.model('users', usersSchema);
