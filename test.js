/*
$ sudo lsblk -l -d -p
NAME     MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
/dev/sda   8:0    0 119,2G  0 disk
/dev/sr0  11:0    1  1024M  0 rom

[ 'NAME     MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT',
  '/dev/sda   8:0    0 119,2G  0 disk ',
  '/dev/sr0  11:0    1  1024M  0 rom  ',
  '' ]
*/


var exec = require('child_process').exec;

exec('sudo lsblk -l -d -p', (err, res) => {
  res = res.split('\n');

  var res_length = res.length;
  var disks = [];

  for (let i = 1; i < res_length; i++) {
    if (res[i] === '') {
      continue;
    }

    let res_row = res[i].match(/\s*(\S*)\s+\d*:\d*\s*\d*\s*[\w.,]*\s*\d*\s*(\w*)\s+.*/);

    if (res_row[2] === 'disk') {
      disks.push(res_row[1]);
    }
  }
  console.log(disks);
});
