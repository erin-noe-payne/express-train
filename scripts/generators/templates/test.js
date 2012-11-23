// Connect to Test Database
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/_appname__test', function(err) {
  if (err) throw new Error(err.message);
});

var vows = require('vows'),
    assert = require('assert'),
    _resource_Model = require('../app/models/_resource_');

// Macros
var noErrors = function (err, result) {
  assert.isNull(err);
};

// test descriptions
vows.describe('_resource_ model test').addBatch({
  
  // setup step, remove any _resources_ in test DB
  'remove all _resources_' : {
    topic: function() {
      _resource_Model.remove().run(this.callback);
    },
    'errors should be null': noErrors
  }

}).addBatch({
  
  // list all _resources_ to verify empty DB
  'list all _resources_' : {
    topic: function() {
      _resource_Model.find().run(this.callback);
    },
    'errors should be null': noErrors,
    'result should be empty array': function(err, result) {
      assert.typeOf(result, 'array');
      assert.equal(result.length, 0);
    }
  }

}).addBatch({
  
  // create new resource
  'create new _resource_' : {
    topic: function() {
      var _resource_ = new _resource_Model(_props_);
      _resource_.save(this.callback);
    },
    'errors should be null': noErrors
  }

}).addBatch({
  
  // list all _resources_ to verify new _resource_
  'list all _resources_' : {
    topic: function() {
      _resource_Model.find().run(this.callback);
    },
    'errors should be null': noErrors,
    'result should be an array with one _resource_': function(err, result) {
      assert.typeOf(result, 'array');
      assert.equal(result.length, 1);
    }
  }

}).addBatch({

  // teardown step, remove any _resources_ in test DB
  'remove all _resources_' : {
    topic: function() {
      _resource_Model.remove().run(this.callback);
    },
    'errors should be null': noErrors
  }
  
})['export'](module);