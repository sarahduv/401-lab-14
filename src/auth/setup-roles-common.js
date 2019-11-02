'use strict';

const RoleModel = require('./roles-model.js');

async function doWork() {
  // Clear the collection
  await RoleModel.deleteMany({});

  // Insert our roles and their capabilities
  await RoleModel.insertMany([
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

module.exports = doWork;