'use strict';

require('dotenv').config();

// Start up DB Server
const mongoose = require('mongoose');
const options = {
  useNewUrlParser:true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};
mongoose.connect(process.env.MONGODB_URI, options);
console.log('Connected to mongo');

const RoleModel = require('./roles-model.js');

async function doWork() {
  // Clear the collection
  RoleModel.deleteMany({});

  // Insert our roles and their capabilities
  RoleModel.insertMany([
    { 
      role: 'admin',
      capabilities: ['create','read','update','delete'], 
    },
    { 
      role: 'editor',
      capabilities: ['create', 'read', 'update'], 
    },
    { 
      role: 'user',
      capabilities: ['read'], 
    },
  ]);
}

console.log('Setup roles started...');
doWork().then(() => {
  console.log('Setup roled finished');
}).catch(err => {
  console.log('Setup roles failed: ', err);
});
