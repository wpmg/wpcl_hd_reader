var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;

const attr_values = new Schema({
  time: Number,
  value: Number,
  raw: String
}, {_id: false});

const attr_schema = new Schema({
  attr_id: Number,
  name: String,
  thresh: Number,
  attr_type: String,
  failed: String,
  updated: String,
  values: [attr_values]
}, {_id: false});

const info_schema = new Schema({
  name: String,
  value: String
}, {_id: false});

const disk_schema = new Schema({
  'Device Model': String,
  'Serial Number': String,
  'updated': Number,
  info_section: [info_schema],
  attr_section: [attr_schema]
});

const disk_model = mongoose.model(
  'Disk',
  disk_schema,
  'disks'
);

module.exports = disk_model;

/*

Behöver få scheman att matcha med resultaten från hur data sparas.

*/

