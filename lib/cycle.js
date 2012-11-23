var child_process = require('child_process');
var fs = require('fs');
var basename = require('path').basename;
var extname = require('path').extname;

var extensions = ['.js'];
var interval = 100;

var app, app_path, arg;

module.exports = function(dir, filename, max) {
  app_path = dir + '/' + filename;
  arg = max;
  monitor(dir);
  start();
};

function monitor(dir) {
  var files = fs.readdirSync(dir);
  files.forEach(traverse);
}

function start() {
  build(run);
}

function build(callback) {
  console.log('  \033[36mbuilding app...\033[0m');
  child_process.exec('./build', function(err, stdout, stderr) {
    console.log(stdout);
    console.warn(stderr);
    if (err) throw err;
    return callback();
  });
}

function run() {
  console.log('  \033[36mrunning app...\033[0m');
  app = child_process.fork(app_path, [arg]);
  app.once('exit', function(code, signal) {
    start();
  });
}

function kill() {
  console.log('  \033[36mkilling app...\033[0m');
  app.kill('SIGKILL');
}

// traverse file if it is a directory
// otherwise setup the watcher
function traverse(file) {
  fs.stat(file, function(err, stat){
    if (!err) {
      if (stat.isDirectory()) {
        if (~exports.ignoreDirectories.indexOf(basename(file))) return;
        fs.readdir(file, function(err, files){
          files.map(function(f){
            return file + '/' + f;
          }).forEach(traverse);
        });
      } else {
        watch(file);
      }
    }
    else {
      console.log("ERR Looking at file in reloader:", err);
    }
  });
}

// watch file for changes
function watch(file) {
  if (!~extensions.indexOf(extname(file))) return;
  fs.watchFile(file, { interval: interval }, function(curr, prev){
    if (curr.mtime > prev.mtime) {
      console.log('  \033[36mchanged\033[0m \033[90m- %s\033[0m', file);
      kill();
    }
  });
}

exports.ignoreDirectories = ['node_modules', 'support', 'test', 'bin', 'public', '.git'];