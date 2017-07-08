// import {exec} from 'child-process';
var exec = require('child_process').exec;
var async = require('async');

var mongoose = require('./db')(true);
var Disk_Model = require('./disk_model');

var script_start_time = (new Date()).getTime();

const disks = [
  '/dev/sda1',
  '/dev/sda2',
  '/dev/sda5'
];

const no_disks = disks.length;



const SaveData = (err, results) => {
  if (err !== null) {
    console.log('Abort saving.');
    return false;
  }
  //var a = new Disk_Model({'Device Model' : 'hej'});
  //console.log(a);
  //a.save();
  //new Disk_Model({'Device Model' : 'hej'}).save();
  // console.log(disk_to_save);

  Disk_Model.findOne(
    {
      'Device Model': results[0].data['Device Model'],
      'Serial Number': results[0].data['Serial Number']
    },
    '_id updated',
    (err, disk) => {
      if (err) {
        console.log('Err: ', err);
        mongoose.close();
        return false;
      }

      disk_to_save = results[0].data;
      disk_to_save.attr_section = results[1];

      if (disk === null) {
        console.log('diskrnull');
        
        var new_disk = new Disk_Model(disk_to_save);

        
        new_disk.save((err) => {
          if (err) {
            console.log('Err: ', err);
            mongoose.close();
            return false;
          }

          mongoose.close();
          console.log('Script runtime: ', (new Date()).getTime() - script_start_time);
        });
        

      } else {
        if (disk.updated >= disk_to_save.updated) {
          console.log('Err: ', 'More recent update found.');
          mongoose.close();
          return false;
        }

        async.some(
          disk_to_save.attr_section,
          (this_attr, attr_callback) => {
            Disk_Model.findById(disk._id).update(
              {'attr_section.attr_id': this_attr.attr_id},
              {
                '$push': {'attr_section.$.values': this_attr.values[0]},
                'attr_section.$.failed': this_attr.failed
              }
            ).exec((err, res) => { attr_callback(null, !err) });
          },
          (attr_err, attr_res) => {
            Disk_Model.findById(disk._id).update({}, {'updated': disk_to_save.updated})
              .exec((err, res) => {
                if (err) {
                  console.log('Err: ', 'Couldn\'t update time.');
                  mongoose.close();
                  return false;
                }

                mongoose.close();

                console.log('Script runtime: ', (new Date()).getTime() - script_start_time);

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


var disk_no = 2;
var current_time = (new Date()).getTime();

async.parallel(
  [
    (callback) => {RunInfoSection(callback, disk_no, current_time);},
    (callback) => {RunAttrSection(callback, disk_no, current_time);}
  ],
  SaveData
);

// exec('smartctl -A ' + disks[2]);

/*
for (let i = 0; i < no_disks; i++) {

}
*/
