const exec = require('child_process').exec;
const async = require('async').mapLimit;
const winston = require('winston');
const mongoose = require('./db')(true);
const SaveData = require('./SaveData');

const logFileString = () => {
  const now = new Date();
  const year = now.getFullYear().toString();
  let month = (now.getMonth() + 1).toString();

  if (month.length < 2) {
    month = `0${month}`;
  }

  return year + month;
};

const scriptStartTime = (new Date()).getTime();

// Configure winston
winston.configure({
  transports: [
    new (winston.transports.Console)({
      timestamp: true,
    }),
    new (winston.transports.File)({
      filename: `logs/${logFileString()}.log`,
      timestamp: true,
    }),
  ],
});

exec('sudo lsblk -l -d -p', (diskErr, execRes) => {
  if (diskErr) {
    winston.error(`Terminating: Couldn't read disk names. Runtime ${((new Date()).getTime() - scriptStartTime)} ms.`);
    return;
  }

  const diskRes = execRes.split('\n');

  const diskResLength = diskRes.length;
  const disks = [];

  for (let i = 1; i < diskResLength; i++) {
    if (diskRes[i] === '') {
      continue;
    }

    const diskResRow = diskRes[i].match(/\s*(\S*)\s+\d*:\d*\s*\d*\s*[\w.,]*\s*\d*\s*(\w*)\s+.*/);

    if (diskResRow[2] === 'disk') {
      disks.push(diskResRow[1]);
    }
  }

  async(
    disks,
    3,
    (disk, callback) => { SaveData(disk, callback); },
    (err, res) => {
      if (err) {
        winston.warn('An unknown error was returned when reading disks.');
        return;
      }

      mongoose.close();

      const resLength = res.length;
      const diskCount = [0, 0];

      for (let i = 0; i < resLength; i++) {
        if (res[i][0] === false) {
          diskCount[1]++;
          winston.warn(res[i][1]);
          continue;
        }

        if (res[i][1] !== null) {
          winston.info(res[i][1]);
        }

        diskCount[0]++;
      }

      const runtime = (new Date()).getTime() - scriptStartTime;
      winston.info(`SCRIPT INFO: ${diskCount[0]}S ${diskCount[1]}F (${disks.length}T). Runtime ${runtime} ms.`);
    }
  );
});
