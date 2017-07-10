const mongoose = require('mongoose');
const config = require('./sensitive.json');


const configDb = (inDevelopment = true) => {
  const user = 'rw';
  const useDevConf = inDevelopment ? 'development' : 'production';

  const dbConfig = {
    uri: `mongodb://${config[useDevConf].host}:${config[useDevConf].port}/${config[useDevConf].database}`,
    opts: {
      user: config.users[user].username,
      pass: config.users[user].password,
    },
  };

  mongoose.connect(
    dbConfig.uri,
    dbConfig.opts
  );

  return mongoose.connection;
};

module.exports = configDb;
