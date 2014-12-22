  /**
 * module dependencies
 */
var fs = require('fs'),
  hbs = require('handlebars'),
  path = require('path'),
  package = require('../package.json'),
  _ = require('lodash'),
  glob = require('glob'),
  nject = require('nject');

/**
 * expose `ExpressTrain()`
 */
module.exports = ExpressTrain;

/**
 * framework version
 */
ExpressTrain.version = package.version;

/**
 * expose objects that can be overridden
 */
var LOCATIONS = ExpressTrain.locations = {
  config: {
    path: '../config'
  },
  views: {
    path: 'views'
  },
  pub: {
    path: 'public'
  },
  models: {
    path: 'models',
    autoinject: true,
    aggregateOn: 'models'
  },
  lib: {
    path: 'lib',
    autoinject: true
  },
  controllers: {
    path: 'controllers',
    autoinject: true
  },
  middleware: {
    path: 'middleware',
    autoinject: true
  }
};

var DEFAULT_OPTIONS = ExpressTrain.options = {
  config: '../config',
  include: '**',
  exclude: null,  // file name starts with a dot
  directories: []
}

var DEFAULT_DIRECTORY_OPTIONS = {
  path : '',
  include : null,
  exclude : null,
  aggregateOn : null
};

/**
 * Create a train application
 */
function ExpressTrain(baseDir, opts) {
  var config,
    opts = _.defaults((opts || {}), DEFAULT_OPTIONS),
    directories = opts.directories,
    tree = new nject.Tree();

  if(opts.config) {
    config = ExpressTrain.loadConfig(path.resolve(baseDir, opts.config));
    tree.constant('config', config);
  }

  _.each(directories, function (directoryConfig) {
    var directoryConfig = _.defaults((directoryConfig || {}), DEFAULT_DIRECTORY_OPTIONS),
      include = directoryConfig.include || opts.include || '',
      exclude = directoryConfig.exclude || opts.exclude || '',
      dirPath = path.resolve(baseDir, directoryConfig.path),
      aggregateOn = directoryConfig.aggregateOn,
      stat = null

    try {
      stat = fs.statSync(dirPath);
    }
    catch (err) {
      throw new Error('File or directory ' + dirPath + ' could not be found. Please check your application\'s `directories` configuration.');
    }

    function getFiles(patternList) {
      if(!_.isArray(patternList)){
        patternList = [patternList]
      }

      return _(patternList).map(function(pattern){
        return glob.sync(path.resolve(dirPath, pattern))
      }).flatten().unique().valueOf()
    }

    var includedFiles = getFiles(include),
      excludedFiles = getFiles(exclude)

    includedFiles = _.difference(includedFiles, excludedFiles)

    _.each(includedFiles, function(fileName){
      var filePath = path.resolve(dirPath, fileName),
        stat = fs.statSync(filePath),
        identifier = path.basename(fileName, path.extname(fileName));

      if(stat.isFile()) {
        var loaded = require(filePath);
        if (_.isFunction(loaded)) {
          tree.register(identifier, loaded, {
            aggregateOn: aggregateOn
          });
        }
        else {
          tree.constant(identifier, loaded, {
            aggregateOn: aggregateOn
          });
        }
      }

    })
  });

  return tree
}

//function traverseAndRegister(p, tree, aggregateOn, recurse) {
//  var stat,
//    key = path.basename(p, path.extname(p));
//
//  //ignore hidden files and directories
//  if (key[0] == '.') return;
//
//  try {
//    stat = fs.statSync(p);
//  }
//  catch (err) {
//    throw new Error('File or directory ' + p + ' could not be found. Please check your application\'s `directories` configuration.');
//  }
//
//  if (stat.isDirectory()) {
//    if (recurse > 0) {
//      var files = fs.readdirSync(p);
//      files.forEach(function (file) {
//        var filePath = path.join(p, file);
//        traverseAndRegister(filePath, tree, aggregateOn, recurse - 1);
//      });
//    }
//  }
//  else {
//    var loaded = require(p);
//    if (_.isFunction(loaded)) {
//      tree.register(key, loaded, {
//        identifier: p,
//        aggregateOn: aggregateOn
//      });
//    }
//    else {
//      tree.constant(key, loaded, {
//        identifier: p,
//        aggregateOn: aggregateOn
//      });
//    }
//  }
//}

ExpressTrain.loadConfig = function loadConfig(p) {
  var configFile,
    env = process.env.NODE_ENV || 'default',
    stat = fs.statSync(p);

  //if config path is overridden with a specific file, respect that
  if (stat.isFile()) {
    configFile = p
  } else {
    configFile = path.join(p, env);

    try {
      require.resolve(configFile);
    } catch (e) {
      configFile = path.join(p, 'default');
      try {
        require.resolve(configFile);
      } catch (e) {
        var msg = 'Express train is unable to resolve a valid configuration file. A configuration file is expected in' +
          ' one of the following locations: \n' +
          '  ' + path.join(p, env) + '\n' +
          '  ' + path.join(p, 'default')

        throw new Error(msg)
      }
    }
  }

  var config = require(configFile);
  var template = hbs.compile(JSON.stringify(config));
  return JSON.parse(template(process.env));
}
