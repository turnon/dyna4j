var dyna4j = (function (a) {

  // debug
  var debug = false;

  function toggle_debug() {
    debug = !debug;
  }

  function log() {
    if (debug && console && console.log) {
      console.log(arguments);
    }
  }

  // substitute
  var _submit = a.Submit;

  a.Submit = function (ctnr_id, form_id, event, action) {
    if (event.type !== 'click') {
      return;
    }
    var target = event.srcElement || event.target;
    var approved = exec_callbacks_onclick(target);
    if (!approved) {
      return false;
    }
    action.oncomplete = wanted_callbacks_oncomplete(target);
    append_parameters(action.parameters, target);
    log(action);
    _submit(ctnr_id, form_id, event, action);
  };

  function revert() {
    a.Submit = _submit;
  }

  // helpers
  function keep_tail_args(args, arr) {
    for (var i = 1; i < args.length; i++) {
      arr.push(args[i]);
    }
  }

  function classname(t) {
    return t.getAttribute('className') || t.getAttribute('class') || '';
  }

  function lazy_collection() {
    var callbacks = {};

    function add(args) {
      var class_name = args[0];
      if (callbacks[class_name] === undefined) {
        callbacks[class_name] = [];
      }
      keep_tail_args(args, callbacks[class_name]);
    }

    function match(target) {
      var matched_callbacks = [];
      var actual_classes = classname(target).split(/\s+/);
      for (var class_name in callbacks) {
        if (actual_classes.indexOf(class_name) > 0) {
          matched_callbacks = matched_callbacks.concat(callbacks[class_name]);
        }
      }
      return matched_callbacks;
    }

    return {
      add: add,
      match: match
    };
  }

  // callbacks for onclick/oncomplete
  var callback_onclick = lazy_collection();

  function onclick() {
    callback_onclick.add(arguments);
  };

  var callback_oncomplete = lazy_collection();

  function oncomplete() {
    callback_oncomplete.add(arguments);
  };

  function exec_callbacks_onclick(target) {
    var callbacks = callback_onclick.match(target);
    for (var i = 0; i < callbacks.length; i++) {
      var return_value = callbacks[i].call(a, target);
      if (return_value === false) {
        return false;
      }
    }
    return true;
  }

  function wanted_callbacks_oncomplete(target) {
    return function (request, event, data) {
      var callbacks = callback_oncomplete.match(target);
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i].call(target, data);
      }
    };
  }

  // dynamic arguments
  // extractor function should return something like {schedule_code: 'S101'}
  var parameters_extractors = lazy_collection();

  function parameters() {
    parameters_extractors.add(arguments);
  }

  function append_parameters(para, target) {
    var extractors = parameters_extractors.match(target);
    log(extractors);
    for (var i = 0; i < extractors.length; i++) {
      var return_value = extractors[i].call(null, target);
      for (var para_name in return_value) {
        para[para_name] = return_value[para_name];
      }
    }
  }

  // module to return
  return {
    onclick: onclick,
    oncomplete: oncomplete,
    parameters: parameters,
    toggle_debug: toggle_debug,
    revert: revert
  };

})(A4J.AJAX);
