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


var DEFAULT_OPTIONS = ExpressTrain.options = {
  base     : undefined,
  config   : '../config',
  files    : [],
  events   : {}
};

var DEFAULT_FILE_OPTIONS = {
  pattern    : '**',
  aggregateOn: null
};

function extractNegativePatterns(globs) {
  var negates = _.remove(globs, function (glob) {
    return glob[0] == '!'
  })

  if (globs.length == 0) {
    globs.push('**')
  }

  return negates
}


/**
 * Create a train application
 */
function ExpressTrain(opts) {
  var config,
    opts      = _.defaults((opts || {}), DEFAULT_OPTIONS),
    files     = opts.files,
    baseDir   = opts.base || process.cwd(),
    includes  = [],
    excludes  = [],
    tree      = new nject.Tree();

  _.each(opts.events, function(handler, eventName) {
    tree.on(eventName, handler);
  });

  if (opts.config) {
    config = ExpressTrain.loadConfig(path.resolve(baseDir, opts.config));
    tree.constant('config', config);
  }

  if(!_.isArray(files)) {
    files = _.compact([files])
  }

  _.each(files, function(file){
    var fileConfig = _.clone(DEFAULT_FILE_OPTIONS)
    if(_.isString(file)) {
      fileConfig.pattern = file
    }
    else if(_.isObject(file) && _.isString(file.pattern)) {
      _.extend(fileConfig, file)
    }
    else {
      throw new Error('Invalid file configuration:', file)
    }

    if(fileConfig.pattern[0] == '!') {
      // Drop the ! from the exclude pattern
      fileConfig.pattern = fileConfig.pattern.slice(1);
      excludes.push(fileConfig)
    }
    else {
      includes.push(fileConfig)
    }
  })

  if(includes.length == 0){
    includes.push(_.clone(DEFAULT_FILE_OPTIONS))
  }

  var fileMap = {}

  _.each(includes, function(fileConfig){
    var includedFiles = glob.sync(fileConfig.pattern, {cwd:baseDir})
    _.each(includedFiles, function(fileName){
      var identifier = path.basename(fileName, path.extname(fileName));
      var filePath = path.resolve(baseDir, fileName)
      var stat = fs.statSync(filePath)

      if (!stat.isFile()) return;

      if(!fileMap[identifier]) {
        fileMap[identifier] = {
          path : filePath,
          aggregateOn : []
        }
      }
      if(fileConfig.aggregateOn) {
        fileMap[identifier].aggregateOn.push(fileConfig.aggregateOn)
      }
    });
  });

  _.each(excludes, function(fileConfig){
    var excludedFiles  = glob.sync(fileConfig.pattern, {cwd:baseDir})
    _.each(excludedFiles, function(fileName){
      var identifier = path.basename(fileName, path.extname(fileName));

      delete fileMap[identifier]
    });
  });

  _.each(fileMap, function(file, identifier){
    var loaded = require(file.path);

    if (_.isFunction(loaded)) {
      tree.register(identifier, loaded, {
        aggregateOn: file.aggregateOn
      });
    }
    else {
      tree.constant(identifier, loaded, {
        aggregateOn: file.aggregateOn
      });
    }
  })

  return tree
}

ExpressTrain.configPath = function configPath(p) {
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

  return configFile;
};

ExpressTrain.loadConfig = function loadConfig(p) {
  var configFile = ExpressTrain.configPath(p)
  var config = require(configFile);
  var template = hbs.compile(JSON.stringify(config));
  return JSON.parse(template(process.env));
};
