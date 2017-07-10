const async = require('async').mapLimit;
const DiskModel = require('./disk_model');

module.exports = (results, sdtdbCallback) => {
  // Store data in correct format
  const diskModelData = results[0][1];
  diskModelData.attr_section = results[1][1];

  // Save disk name to variable for use in errors.
  const diskName = `${diskModelData['Device Model']} (${diskModelData['Serial Number']})`;

  // Check if disk exists
  DiskModel.findOne(
    {
      'Device Model': diskModelData['Device Model'],
      'Serial Number': diskModelData['Serial Number'],
    },
    '_id updated',
    (err, disk) => {
      // If error occured
      if (err) {
        sdtdbCallback(null, [false, `${diskName}: Could not execute mongooose query.`]);
        return;
      }

      // If disk does not exist, save disk as new
      if (disk === null) {
        (new DiskModel(diskModelData))
          .save((saveErr) => {
            // If error occured on save
            if (saveErr) {
              sdtdbCallback(null, [false, `${diskName}: New disk found but not saved.`]);
              return;
            }

            sdtdbCallback(null, [true, `${diskName}: New disk found and saved.`]);
          });
      } else {
        // If disk does exist, but has somehow been updated already
        if (disk.updated >= diskModelData.updated) {
          sdtdbCallback(null, [false, `${diskName}: Disk has already been updated.`]);
          return;
        }

        // Update attributes asyncronically
        async(
          diskModelData.attr_section,
          5,

          // Function to map on
          (thisAttr, attrCallback) => {
            // Find disk and update.
            DiskModel.findById(disk._id).update(
              { 'attr_section.attr_id': thisAttr.attr_id },
              {
                $push: { 'attr_section.$.values': thisAttr.values[0] },
                'attr_section.$.failed': thisAttr.failed,
              }
            ).exec((execErr) => {
              if (execErr) {
                attrCallback(null, [false, thisAttr.attr_id]);
                return false;
              }

              attrCallback(null, [true, thisAttr.attr_id]);
              return true;
            });
          },

          // Callback function
          (attrErr, attrRes) => {
            // If attrErr somehow got invoked
            if (attrErr) {
              sdtdbCallback(null, [false, `${diskName}: Something went wrong when saving the attributes.`]);
              return;
            }

            // Update update-time for disk
            DiskModel.findById(disk._id).update(
              {},
              {
                updated: diskModelData.updated,
                location: diskModelData.phys_loc,
                internal_name: diskModelData.internal_name,
              }
            )
              .exec((execErr) => {
                // If mongoose couldn't execute
                if (execErr) {
                  sdtdbCallback(null, [false, `${diskName}: Could not execute mongooose query.`]);
                  return;
                }

                // Report any error on attributes.
                const attrResLength = attrRes.length;
                for (let i = 0; i < attrResLength; i++) {
                  if (attrRes[i][0] === false) {
                    sdtdbCallback(null, [false, `${diskName}: Could not update attriute ${attrRes[i][1]}.`]);
                    return;
                  }
                }

                // Report success.
                sdtdbCallback(null, [true, null]);
              });
          }
        );
      }
    }
  );
};
