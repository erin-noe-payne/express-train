var utils = require('./utils');

module.exports = function(args) {
  create_libfile();
  update_package();
  update_config();
};

function create_libfile() {
  utils.cp(__dirname + '/templates/lib/mongoose.js', utils.dir + '/app/lib/mongoose.js');
  var current_lib = utils.get_json('/app/lib/index.json');
  
  utils.inject(current_lib.autorun, 'mongoose');
  utils.save_json('/app/lib/index.json', current_lib);
}

function update_package() {
  var current_package = utils.get_json('/package.json');

  utils.merge(current_package.dependencies, {'mongoose': 'latest'});
  utils.save_json('/package.json', current_package);
}

function update_config() {
  var constants = utils.get_json('/package.json');
  var current_config = utils.get_json('/.env.json');

  var default_config = {
    mongoose: {
      host: 'localhost',
      db: constants.name || 'base12project'
    }
  };

  utils.merge(default_config, current_config);
  utils.save_json('/.env.json', default_config);
}