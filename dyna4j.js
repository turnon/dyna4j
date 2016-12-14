var dyna4j = (function (a) {

  var debug = false;
  function toggle_debug(){debug = !debug;}

  // substitute
  var _submit = a.Submit;

  a.Submit = function (root_id, form_id, event, action) {
    var target = event_target(action);
    var approved = exec_callbacks_onclick(target);
    if (!approved) {
      return false;
    }
    action.oncomplete = wanted_callbacks_oncomplete(target);
    append_parameters(action.parameters, target);
    if(debug && console && console.log){
        console.log(action);
    }
    _submit(root_id, form_id, event, action);
  };

  // helpers
  function event_target(action) {
    for (var key in action.parameters) {
      if (key.indexOf(':') > 0) {
        return document.getElementById(key);
      }
    }
  }

  function callbacks_for(target, cb_collection) {
    var callbacks = [];
    var actual_classes = target.className.split(/\s+/);
    for (var class_name in cb_collection) {
      if (actual_classes.indexOf(class_name) > 0) {
        callbacks = callbacks.concat(cb_collection[class_name]);
      }
    }
    return callbacks;
  }
  
  function keep_tail_args(args, arr){
      for(var i=1; i<args.length; i++){
          arr.push(args[i]);
      }
  }

  // callbacks for onclick/oncomplete
  var callback_onclick = {};
  function onclick(class_name) {
    if (callback_onclick[class_name] === undefined) {
      callback_onclick[class_name] = [];
    }
    keep_tail_args(arguments, callback_onclick[class_name]);
  };

  var callback_oncomplete = {};
  function oncomplete(class_name) {
    if (callback_oncomplete[class_name] === undefined) {
      callback_oncomplete[class_name] = [];
    }
    keep_tail_args(arguments, callback_oncomplete[class_name]);
  };

  function exec_callbacks_onclick(target) {
    var callbacks = callbacks_for(target, callback_onclick);
    for (var i = 0; i < callbacks.length; i++) {
      var return_value = callbacks[i].call(target);
      if (return_value === false) {
        return false;
      }
    }
    return true;
  }

  function wanted_callbacks_oncomplete(target) {    
    return function (request, event, data) {
      var callbacks = callbacks_for(target, callback_oncomplete);
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(target, data);
      }
    };
  }

  // dynamic arguments
  // extractor function should return something like {schedule_code: 'S101'}
  var parameters_extractors = {}
  function parameters(class_name){
    if (parameters_extractors[class_name] === undefined) {
      parameters_extractors[class_name] = [];
    }
    keep_tail_args(arguments, parameters_extractors[class_name]);
  }
  
  function append_parameters(para, target){
    var extractors = callbacks_for(target, parameters_extractors);
    for (var i = 0; i < extractors.length; i++) {
      var return_value = extractors[i].call(null, target);
      for(var para_name in return_value){
        para[para_name] = return_value[para_name];
      }
    }
  }

  // module to return
  return {
    onclick: onclick,
    oncomplete: oncomplete,
    parameters: parameters,
    toggle_debug: toggle_debug
  };

})(A4J.AJAX);