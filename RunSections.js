const exec = require('child_process').exec;

module.exports.Info = (callback, disk, currentTime) => {
  // Run smartctl for a disk
  exec(`sudo smartctl -i ${disk}`, (error, stdout) => {
    // If error, report down the chain.
    if (error) {
      callback(null, [false, `${disk}: Reading stopped. smartctl -i could not execute: ${error}`]);
      return;
    }

    // Split output on newline
    const outArr = stdout.split('\n');
    const outArrLength = outArr.length;

    // Create object to which data will be saved and later passed on
    const diskData = {
      'Device Model': '',
      'Serial Number': '',
      info_section: [],
      location: 'Umea',
      internal_name: disk,
      updated: currentTime,
      added: currentTime,
    };

    // Loop through each line in the output
    let infoSecStartIsFound = false;
    for (let i = 0; i < outArrLength; i++) {
      // Skip to info-sec
      if (
        infoSecStartIsFound === false
        && outArr[i] === '=== START OF INFORMATION SECTION ==='
      ) {
        infoSecStartIsFound = true;
        continue;
      }

      // When info-sec is found
      if (infoSecStartIsFound === true) {
        // Break if info-sec is over (when a row is empty)
        if (outArr[i] === '') {
          break;
        }

        // Match lines, splitting on first semicolon
        const infoRow = outArr[i].match(/\s*([^:]+):\s*(.+)\s*/);

        // If match isnt found, continue to next iteration.
        // Skip past Local Time is and SMART support is
        if (
          infoRow === null
          || infoRow[1] === 'Local Time is'
          || infoRow[1] === 'SMART support is'
        ) {
          continue;
        }

        // Device Model and Serial Number are used for identification and saved seperately.
        if (infoRow[1] === 'Device Model' || infoRow[1] === 'Serial Number') {
          diskData[infoRow[1]] = infoRow[2];
          continue;
        }

        // Push other attributes to array
        diskData.info_section.push({
          name: infoRow[1],
          value: infoRow[2],
        });
      }
    }

    // Send data back to async.parallel
    callback(null, [true, diskData]);
  });
};

module.exports.Attr = (callback, disk, currentTime) => {
  // Run smartctl for a disk
  exec(`sudo smartctl -A ${disk}`, (error, stdout) => {
    // If error, report down the chain
    if (error) {
      callback(null, [false, `${disk}: Reading stopped. smartctl -A could not execute: ${error}`]);
      return;
    }

    // Split output on newline
    const outArr = stdout.split('\n');
    const outArrLength = outArr.length;

    // Create array to which data will be saved and later passed on
    const diskData = [];

    // Loop through each line in the output
    let attrSecStartIsFound = false;
    for (let i = 0; i < outArrLength; i++) {
      // Skip to attr-sec, then skip two more lines (hopefully universal)
      if (
        attrSecStartIsFound === false
        && outArr[i] === '=== START OF READ SMART DATA SECTION ==='
      ) {
        attrSecStartIsFound = true;
        i += 2;
        continue;
      }

      // When attr-sec is found
      if (attrSecStartIsFound === true) {
        // Break if attr-sec is over (when a row is empty)
        if (outArr[i] === '') {
          break;
        }

        // Match an attr-row
        const attrRow = outArr[i].match(/\s*([0-9]+)\s*([A-Za-z0-9_-]+)\s*0x[0-9A-Fa-f]{4}\s*([0-9]{3})\s*[0-9]{3}\s*([0-9]{3})\s*(Pre-fail|Old_age)\s*(Always|Offline)\s*([A-Za-z0-9_-]*)\s*(.*)\s*/);

        // Continue if attr-row isn't matched
        if (attrRow === null) {
          continue;
        }

        // Push to diskData-array
        diskData.push({
          attr_id: attrRow[1],
          name: attrRow[2],
          thresh: parseInt(attrRow[4], 10),
          attr_type: attrRow[5],
          updated: attrRow[6],
          failed: attrRow[7],
          values: [{
            time: currentTime,
            value: parseInt(attrRow[3], 10),
            raw: attrRow[8],
          }],
        });
      }
    }

    // Send data back to async.parallel
    callback(null, [true, diskData]);
  });
};
