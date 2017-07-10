const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const attrValues = new Schema({
  time: Number,
  value: Number,
  raw: String,
}, { _id: false });

const attrSchema = new Schema({
  attr_id: Number,
  name: String,
  thresh: Number,
  attr_type: String,
  failed: String,
  updated: String,
  values: [attrValues],
}, { _id: false });

const infoSchema = new Schema({
  name: String,
  value: String,
}, { _id: false });

const diskSchema = new Schema({
  'Device Model': String,
  'Serial Number': String,
  added: Number,
  updated: Number,
  location: String,
  internal_name: String,
  info_section: [infoSchema],
  attr_section: [attrSchema],
});

const diskModel = mongoose.model(
  'Disk',
  diskSchema,
  'disks'
);

module.exports = diskModel;
