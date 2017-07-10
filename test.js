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


const exec = require('child_process').exec;

exec('sudo lsblk -l -d -p', (err, diskRes) => {
  const res = diskRes.split('\n');

  const resLength = res.length;
  const disks = [];

  for (let i = 1; i < resLength; i++) {
    if (res[i] === '') {
      continue;
    }

    const resRow = res[i].match(/\s*(\S*)\s+\d*:\d*\s*\d*\s*[\w.,]*\s*\d*\s*(\w*)\s+.*/);

    if (resRow[2] === 'disk') {
      disks.push(resRow[1]);
    }
  }
  console.log(disks);
});
