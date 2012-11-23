
var lib = require('../lib/inflections');

lib.parseArgs = function(in_args, callback) {
  
  var resource_name = in_args[4],
      args = in_args.slice(5);

  this.buildOptions(args, function(err, options) {
    // build resource object with name and options
    var resource = {
      name: resource_name,
      options: options
    };

    callback(null, resource);
  });
};

lib.buildOptions = function(args, callback) {
  var options = {},
      group_object = null;

  // iterate through all args and build out options object
  for(var i = 0; i < args.length; i++) {
    var arg = args[i];
    
    // are we starting a new options group?
    if (arg.indexOf('-') === 0) {
      if (group_object !== null) {
        options[group_object.name] = group_object.params;
        group_object = null;
      }
      group_object = {
        name: arg,
        params: []
      };
    }
    
    // either a standalone option or part of a group
    else {
      
      // add to current group
      if (group_object !== null) {
        group_object.params.push(arg);
      }

      // standalone option, push into object as true
      else {
        options[arg] = true;
      }
    }
  }

  // add last option object
  if (group_object !== null) options[group_object.name] = group_object.params;

  callback(null, options);
};

module.exports = lib;