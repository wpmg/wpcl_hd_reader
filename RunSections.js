var exec = require('child_process').exec;

module.exports.Info = (callback, disk, current_time) => {
  // Run smartctl for a disk
  exec('smartctl -i ' + disk, (error, stdout, stderr) => {
    // Split output on newline
    const out_arr = stdout.split('\n');
    const no_out_arr = out_arr.length;

    // Create object to which data will be saved and later passed on
    const disk_data = {
      'Device Model': '',
      'Serial Number': '',
      'info_section': [],
      'updated': current_time
    };

    // Loop through each line in the output
    let found_info_sec = false;
    for (let i = 0; i < no_out_arr; i++) {
      // Skip to info-sec
      if (
        found_info_sec === false
        && out_arr[i] === '=== START OF INFORMATION SECTION ==='
      ) {
        found_info_sec = true;
        continue;
      }

      // When info-sec is found
      if (found_info_sec === true) {
        // Break if info-sec is over (when a row is empty)
        if (out_arr[i] === '') {
          break;
        }

        // Match lines, splitting on first semicolon
        let info_row = out_arr[i].match(/\s*([^:]+):\s*(.+)\s*/);

        // If match isnt found, continue to next iteration.
        // Skip past Local Time is and SMART support is
        if (
          info_row === null
          || info_row[1] === 'Local Time is'
          || info_row[1] === 'SMART support is'
        ) {
          continue;
        }

        // Device Model and Serial Number are used for identification and saved seperately.
        if (info_row[1] === 'Device Model' || info_row[1] === 'Serial Number') {
          disk_data[info_row[1]] = info_row[2];
          continue;
        }

        // Push other attributes to array
        disk_data.info_section.push({
          'name': info_row[1],
          'value': info_row[2]
        });
      }
    }

    // Send data back to async.parallel
    callback(null, disk_data);
  });
};

module.exports.Attr = (callback, disk, current_time) => {
  // Run smartctl for a disk
  exec('smartctl -A ' + disk, (error, stdout, stderr) => {
    // Split output on newline
    const out_arr = stdout.split('\n');
    const no_out_arr = out_arr.length;

    // Create array to which data will be saved and later passed on
    let disk_data = [];

    // Loop through each line in the output
    let found_attr_sec = false;
    for (let i = 0; i < no_out_arr; i++) {
      // Skip to attr-sec, then skip two more lines (hopefully universal)
      if (
        found_attr_sec === false
        && out_arr[i] === '=== START OF READ SMART DATA SECTION ==='
      ) {
        found_attr_sec = true;
        i += 2;
        continue;
      }

      // When attr-sec is found
      if (found_attr_sec === true) {
        // Break if attr-sec is over (when a row is empty)
        if (out_arr[i] === '') {
          break;
        }

        // Match an attr-row
        let attr_row = out_arr[i].match(/\s*([0-9]+)\s*([A-Za-z0-9_-]+)\s*0x[0-9A-Fa-f]{4}\s*([0-9]{3})\s*[0-9]{3}\s*([0-9]{3})\s*(Pre-fail|Old_age)\s*(Always|Offline)\s*([A-Za-z0-9_-]*)\s*(.*)\s*/);

        // Continue if attr-row isn't matched
        if (attr_row === null) {
          continue;
        }

        // Push to disk_data-array
        disk_data.push({
          attr_id: attr_row[1],
          name: attr_row[2],
          thresh: parseInt(attr_row[4]),
          attr_type: attr_row[5],
          updated: attr_row[6],
          failed: attr_row[7],
          values: [{
            time: current_time,
            value: parseInt(attr_row[3]),
            raw: attr_row[8]
          }]
        });
      }
    }

    // Send data back to async.parallel
    callback(null, disk_data);
  });
};
