var async = require('async').mapLimit;
var winston = require('winston');
var mongoose = require('./db')(true);

var SaveData = require('./SaveData');

const log_file_string = () => {
  let now = new Date();
  let year = now.getFullYear().toString();
  let month = (now.getMonth() + 1).toString();

  if (month.length < 2) {
    month = '0' + month;
  }

  return year + month;
};

// Configure winston
winston.configure({
  transports: [
    new (winston.transports.Console)({
      timestamp: true
    }),
    new (winston.transports.File)({
      filename: 'logs/' + log_file_string() + '.log',
      timestamp: true
    })
  ]
});


var script_start_time = (new Date()).getTime();

var disks = [
  '/dev/sda1',
  '/dev/sda2',
  '/dev/sda5'
];

// During development
let dev = true;
if (dev) {
  disks = [
    '/dev/sda5'
  ];
}

// use map instead and use res to take eventual errors.
// use promise.then or .catch for saveData to get out of callback hell.
async(
  disks,
  3,
  (disk, callback) => { SaveData(disk, callback) },
  (err, res) => {
    if (err) {
      winston.warning('An unknown error was returned when reading disks.');
      return false;
    }

    mongoose.close();

    let res_length = res.length;
    let disk_count = [0, 0];
    for (var i = 0; i < res_length; i++) {
      if (res[i][0] === false) {
        disk_count[1]++;
        winston.warning(res[i][1]);
        continue;
      }

      if (res[i][1] !== null) {
        winston.info(res[i][1]);
      }

      disk_count[0]++;
    }

    winston.info(
      'SCRIPT INFO: ' + disk_count[0] + 'S ' + disk_count[1] + 'F (' + disks.length + 'T). '
      + 'Runtime ' + ((new Date()).getTime() - script_start_time) + ' ms.'
    );
  }
);
