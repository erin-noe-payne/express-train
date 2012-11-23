
var fs = require('fs'),
    lib = require('./lib'),
    template_dir = __dirname+'/templates/',
    resource_name = process.argv[4],
    app_root = process.env.PWD,
    app_path = __dirname.split("/"),
    app_name = app_path[app_path.length - 1];


module.exports = function(){

  console.log("generating "+ resource_name + " resource");
  
  // parse resource options from command arguments
  lib.parseArgs(process.argv, function(err, resource) {

    // build controller
    var controller = buildController();
    fs.writeFileSync(app_root+'/app/controllers/'+lib.pluralize(resource_name)+'.js', controller, 'utf-8');

    // build model
    var model = buildModel(resource.options['-with']);
    fs.writeFileSync(app_root+'/app/models/'+resource_name+'.js', model, 'utf-8');

    // build test
    var test = buildTest(resource.options['-with']);
    fs.writeFileSync(app_root+'/test/'+resource_name+'.vows.js', test, 'utf-8');

  });

};


/**
 * build new model file using template
 * @param {Array} props the properties for the new resource
 */
function buildModel(props) {
  // grab model template
  var model = loadTemplate('model');

  // add resource name
  model = replaceParams(model);

  // add props
  var props_objects = [];
  if (props && props.length > 0) {
    for (var i = 0; i < props.length; i++) {
      var prop = props[i].split(":");
      if (!prop[1]) prop.push("string");
      props_objects.push("  "+[prop[0]] + " : { type: "+lib.capitalize(prop[1])+" }"); 
    }
  }
  model = model.replace(/_props_/g, "{\n " + props_objects.join(",\n ") + "\n}");

  return model;
}

/**
 * build new test file using template
 * @param {Array} props the properties for the new resource
 */
function buildTest(props) {
  // grab test template
  var test = loadTemplate('test');

  // add resource name
  test = replaceParams(test);

  // add props
  var props_objects = [];
  if (props && props.length > 0) {
    for (var i = 0; i < props.length; i++) {
      var prop = props[i].split(":");
      if (!prop[1]) prop.push("string");
      if (prop[1] == "string") {
        props_objects.push([prop[0]] + " : 'test_data'");  
      }
    }
  }
  test = test.replace(/_props_/g, "{ " + props_objects.join(", ") + " }");

  return test;
}

/**
 * build new controller file using template
 */
function buildController() {
  // grab model template
  var controller = loadTemplate('controller');

  // add resource name
  controller = replaceParams(controller);

  return controller;
}




/**
 * loads template from template directory matching name
 * @param {String} name the name of the template to load
 */
function loadTemplate(name) {
  return fs.readFileSync(template_dir+name+'.js', 'utf-8');
}


function replaceParams(string) {
  
  // add resource name
  string = string.replace(/_resource_/g, lib.capitalize(resource_name));
  string = string.replace(/_resources_/g, lib.pluralize(lib.capitalize(resource_name)));

  // add appname
  string = string.replace(/_appname_/g, app_name);

  return string;
}

