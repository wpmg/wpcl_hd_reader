var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

var Schema = mongoose.Schema;

const attr_values = new Schema({
  time: Number,
  value: Number,
  failed: String,
  raw: String
});

const attr_schema = new Schema({
  attr_id: Number,
  name: String,
  thresh: Number,
  attr_type: String,
  updated: String,
  values: [attr_values]
});

const info_schema = new Schema({
  name: String,
  value: String
});

const disk_schema = new Schema({
  'Device Model': String,
  'Serial Number': String,
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

