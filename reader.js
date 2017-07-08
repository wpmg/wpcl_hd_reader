var async = require('async');

var mongoose = require('./db')(true);

var SaveData = require('./SaveData');

// var script_start_time = (new Date()).getTime();

var disks = [
  '/dev/sda1',
  '/dev/sda2',
  '/dev/sda5'
];

// During development
disks = [
  '/dev/sda5'
];

// use map instead and use res to take eventual errors.
async.every(
  disks,
  (disk, callback) => { SaveData(disk, callback) },
  (err, res) => {
    console.log(err);
    console.log(res);
    mongoose.close();
  }
);
