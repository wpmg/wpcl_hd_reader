var mongoose = require('mongoose');
var config = require('./sensitive.json');


const db_config = function(in_development = true) {
  const user = 'rw';
  const use_development_config = in_development ? 'development' : 'production';

  const db_config = {
    'uri': 'mongodb://' + config[use_development_config].host +
      ':' + config[use_development_config].port +
      '/' + config[use_development_config].database,
    'opts': {
      'user': config.users[user].username,
      'pass': config.users[user].password
    }
  };

  mongoose.connect(
    db_config.uri,
    db_config.opts
  );

  return mongoose.connection;
};

module.exports = db_config;
