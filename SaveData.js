var async = require('async').parallel;

var RunSections = require('./RunSections');
var SaveDataToDB = require('./SaveDataToDB');

module.exports = (disk, callback) => {
  let current_time = (new Date()).getTime();

  // Get info-sec and attr-sec asyncronically, then save to DB and call callback-function
  async(
    [
      (run_callback) => { RunSections.Info(run_callback, disk, current_time); },
      (run_callback) => { RunSections.Attr(run_callback, disk, current_time); }
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
}
