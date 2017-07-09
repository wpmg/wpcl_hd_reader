var async = require('async').mapLimit;
var Disk_Model = require('./disk_model');

module.exports = (results, sdtdb_callback) => {
  // Store data in correct format
  var disk_to_save = results[0][1];
  disk_to_save.attr_section = results[1][1];

  // Save disk name to variable for use in errors.
  var disk_name = disk_to_save['Device Model'] + ' (' + disk_to_save['Serial Number'] + ')';

  // Check if disk exists
  Disk_Model.findOne(
    {
      'Device Model': disk_to_save['Device Model'],
      'Serial Number': disk_to_save['Serial Number']
    },
    '_id updated',
    (err, disk) => {
      // If error occured
      if (err) {
        sdtdb_callback(null, [false, disk_name + ': Could not execute mongooose query.']);
        return false;
      }

      // If disk does not exist, save disk as new
      if (disk === null) {
        (new Disk_Model(disk_to_save))
          .save((err) => {
            // If error occured on save
            if (err) {
              sdtdb_callback(null, [false, disk_name + ': New disk found but not saved.']);
              return false;
            }

            sdtdb_callback(null, [true, disk_name + ': New disk found and saved.']);
            return true;
          });


      } else {
        // If disk does exist, but has somehow been updated already
        if (disk.updated >= disk_to_save.updated) {
          sdtdb_callback(null, [false, disk_name + ': Disk has already been updated.']);
          return false;
        }

        // Update attributes asyncronically
        async(
          disk_to_save.attr_section,
          5,

          // Function to map on
          (this_attr, attr_callback) => {
            // Find disk and update.
            Disk_Model.findById(disk._id).update(
              {'attr_section.attr_id': this_attr.attr_id},
              {
                '$push': {'attr_section.$.values': this_attr.values[0]},
                'attr_section.$.failed': this_attr.failed
              }
            ).exec((err) => {
              if (err) {
                attr_callback(null, [false, this_attr.attr_id]);
                return false;
              }

              attr_callback(null, [true, this_attr.attr_id]);
              return true;
            });
          },

          // Callback function
          (attr_err, attr_res) => {
            // If attr_err somehow got invoked
            if (attr_err) {
              sdtdb_callback(null, [false, disk_name + ': Something went wrong when saving the attributes.']);
              return false;
            }

            // Update update-time for disk
            Disk_Model.findById(disk._id).update({}, {'updated': disk_to_save.updated})
              .exec((err) => {
                // If mongoose couldn't execute
                if (err) {
                  sdtdb_callback(null, [false, disk_name + ': Could not execute mongooose query.']);
                  return false;
                }

                // Report any error on attributes.
                let attr_res_length = attr_res.length;
                for (let i = 0; i < attr_res_length; i++) {
                  if (attr_res[i][0] === false) {
                    sdtdb_callback(null, [false, disk_name + ': Could not update attriute ' + attr_res[i][1] + '.']);
                    return false;
                  }
                }

                // Report success.
                sdtdb_callback(null, [true, null]);
                return true;
              });
          }
        );
      }
    }
  );
}
