var fs = require('fs');
var util = require('util');
var path = require('path');

var _ = require('underscore')._;

module.exports = {
  dir: process.env.PWD,
  get_json: function(file) {
    return require(this.dir + file);
  },
  save_json: function(file, obj) {
    console.log(' -> Updating ' + this.dir + file + '...');
    fs.writeFileSync(this.dir + file, JSON.stringify(obj, null, 2), 'utf-8');
  },
  merge: function(a, b) {
    a = _(a).extend(b);
  },
  cp: function(from, to, callback) {
    console.log(' -> Writing ' + to + '...');
    if (path.existsSync(to)) {
      console.warn('    (already exists)');
      return;
    }
    var rs = fs.createReadStream(from);
    var ws = fs.createWriteStream(to);
    util.pump(rs, ws, callback);
  },
  inject: function(array, item) {
    if(array.indexOf(item) === -1) {
      array.unshift(item);
    }
  }
};