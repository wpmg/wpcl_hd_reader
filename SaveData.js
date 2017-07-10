const async = require('async').parallel;

const RunSections = require('./RunSections');
const SaveDataToDB = require('./SaveDataToDB');

module.exports = (disk, callback) => {
  const currentTime = (new Date()).getTime();

  // Get info-sec and attr-sec asyncronically, then save to DB and call callback-function
  async(
    [
      (runCallback) => { RunSections.Info(runCallback, disk, currentTime); },
      (runCallback) => { RunSections.Attr(runCallback, disk, currentTime); },
    ],
    (err, res) => {
      // Abort if any smartctl couldn't run
      if (res[0][0] === false) {
        callback(null, res[0]);
      } else if (res[1][0] === false) {
        callback(null, res[1]);
      } else {
        SaveDataToDB(res, callback);
      }
    }
  );
};
