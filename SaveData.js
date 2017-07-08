var async = require('async');

var Disk_Model = require('./disk_model');

var RunSections = require('./RunSections');

const SaveDataToDB = (err, results, sdtdb_callback) => {
  if (err !== null) {
    console.log('Abort saving.');
    return false;
  }

  Disk_Model.findOne(
    {
      'Device Model': results[0].data['Device Model'],
      'Serial Number': results[0].data['Serial Number']
    },
    '_id updated',
    (err, disk) => {
      if (err) {
        console.log('Err: ', err);
        // mongoose.close();
        return false;
      }

      var disk_to_save = results[0];
      disk_to_save.attr_section = results[1];

      if (disk === null) {
        console.log('diskrnull');

        var new_disk = new Disk_Model(disk_to_save);


        new_disk.save((err) => {
          if (err) {
            console.log('Err: ', err);
            // mongoose.close();
            return false;
          }

          // mongoose.close();
          // console.log('Script runtime: ', (new Date()).getTime() - script_start_time);
        });


      } else {
        if (disk.updated >= disk_to_save.updated) {
          console.log('Err: ', 'More recent update found.');
          // mongoose.close();
          return false;
        }

        async.every(
          disk_to_save.attr_section,
          (this_attr, attr_callback) => {
            Disk_Model.findById(disk._id).update(
              {'attr_section.attr_id': this_attr.attr_id},
              {
                '$push': {'attr_section.$.values': this_attr.values[0]},
                'attr_section.$.failed': this_attr.failed
              }
            ).exec((err) => { attr_callback(null, !err) });
          },
          (attr_err) => {
            if (attr_err) {
              console.log('Err: ', attr_err);
            }

            Disk_Model.findById(disk._id).update({}, {'updated': disk_to_save.updated})
              .exec((err) => {
                if (err) {
                  console.log('Err: ', 'Couldn\'t update time.');
                  // mongoose.close();
                  return false;
                }

                // mongoose.close();

                // console.log('Script runtime: ', (new Date()).getTime() - script_start_time);

                return true;
              });
          }
        );
        // mongoose.close();
      }

      //mongoose.close();
    }
  );
}

module.exports = (disk, callback) => {
  let current_time = (new Date()).getTime();

  // Get info-sec and attr-sec asyncronically, then save to DB and call callback-function
  async.parallel(
    [
      (run_callback) => { RunSections.Info(run_callback, disk, current_time); },
      (run_callback) => { RunSections.Attr(run_callback, disk, current_time); }
    ],
    (err, res) => { SaveDataToDB(err, res, callback) }
  );
}
