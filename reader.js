// import {exec} from 'child-process';
var exec = require('child_process').exec;
var async = require('async').parallel;

var mongoose = require('./db')(true);
var Disk_Model = require('./disk_model');

const disks = [
  '/dev/sda1',
  '/dev/sda2',
  '/dev/sda5'
];

const no_disks = disks.length;

const RunInfoSection = (callback, disk_no, current_time) => {
  exec('smartctl -i ' + disks[disk_no], (error, stdout, stderr) => {
    const out_arr = stdout.split('\n');
    const no_out_arr = out_arr.length;

    let found_info_sec = false;
    let disk_data = {
      'Device Model': '',
      'Serial Number': '',
      'info_section': []
    };

    for (let i = 0; i < no_out_arr; i++) {
      if (out_arr[i] === '=== START OF INFORMATION SECTION ===') {
        found_info_sec = true;
        continue;
      }

      if (found_info_sec === true) {
        if (out_arr[i] === '') {
          break;
        }

        let info_row = out_arr[i].match(/\s*([^:]+):\s*(.+)\s*/);

        if (info_row === null) {
          continue;
        }

        if (info_row[1] === 'Device Model' || info_row[1] === 'Serial Number') {
          disk_data[info_row[1]] = info_row[2];
        } else {
          disk_data.info_section.push({
            'name': info_row[1],
            'value': info_row[2]
          });
        }
      }
    }

    delete disk_data.info_section['Local Time is'];
    delete disk_data.info_section['SMART support is'];

    callback(null, {
      data: disk_data,
      update_time: current_time
    });
  });
};

const RunAttrSection = (callback, disk_no, current_time) => {
  exec('smartctl -A ' + disks[disk_no], (error, stdout, stderr) => {
    const out_arr = stdout.split('\n');
    const no_out_arr = out_arr.length;

    let found_attr_sec = false;
    let disk_data = [];

    for (let i = 0; i < no_out_arr; i++) {
      if (out_arr[i] === '=== START OF READ SMART DATA SECTION ===') {
        found_attr_sec = true;
        i += 2;
        continue;
      }

      if (found_attr_sec === true) {
        if (out_arr[i] === '') {
          break;
        }

        let attr_row = out_arr[i].match(/\s*([0-9]+)\s*([A-Za-z0-9_-]+)\s*0x[0-9A-Fa-f]{4}\s*([0-9]{3})\s*[0-9]{3}\s*([0-9]{3})\s*(Pre-fail|Old_age)\s*(Always|Offline)\s*([A-Za-z0-9_-]*)\s*(.*)\s*/);

        if (attr_row === null) {
          continue;
        }

        disk_data.push({
          attr_id: attr_row[1],
          name: attr_row[2],
          thresh: parseInt(attr_row[4]),
          attr_type: attr_row[5],
          updated: attr_row[6],
          values: [{
            time: current_time,
            value: parseInt(attr_row[3]),
            failed: attr_row[7],
            raw: attr_row[8]
          }]
        });
      }
    }

    callback(null, disk_data);
  });
};

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
    (err, disk) => {
      if (err) {
        console.log('err');
        return false;
      }

      if (disk === null) {
        console.log('diskrnull');
        disk_to_save = results[0].data;
        disk_to_save.attr_section = results[1];
        
        var new_disk = new Disk_Model(disk_to_save);
        
        new_disk.save((err) => {

          mongoose.close();
        });
        //(new Disk_Model(disk_to_save)).save();

        //Disk_Model.create(disk_to_save, (errr, doc) => {console.log(errr, ':::', doc)});

      } else {
        
        mongoose.close();
      }

      //mongoose.close();
    }
  );
  console.log('hej');
} 


var disk_no = 2;
var current_time = (new Date).getTime();

async(
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
