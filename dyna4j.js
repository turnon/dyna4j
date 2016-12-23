var dyna4j = (function (a) {

  // debug
  var debug = false;

  function toggle_debug() {
    debug = !debug;
  }

  function log() {
    if (debug && console && console.log)
      console.log(arguments);
  }

  // substitute
  var _submit = a.Submit;

  a.Submit = function () {
    var event, action;
    if (arguments.length === 4) {
      event = arguments[2];
      action = arguments[3];
    } else {
      event = arguments[1];
      action = arguments[2];
    }
    if (event.type !== 'click')
      return;
    var target = event.srcElement || event.target;
    var approved = exec_callbacks_onclick(target);
    if (!approved)
      return false;
    action.oncomplete = wanted_callbacks_oncomplete(target);
    append_parameters(action.parameters, target);
    log(action);
    _submit.apply(a, arguments);
  };

  function revert() {
    a.Submit = _submit;
  }

  // helpers

  function keep_tail_args(args, arr) {
    for (var i = 1; i < args.length; i++)
      arr.push(args[i]);
  }

  function classname(t) {
    return t.getAttribute('className') || t.getAttribute('class') || '';
  }

  function lazy_collection() {
    var callbacks = {};

    function add(args) {
      var class_name = args[0];
      if (callbacks[class_name] === undefined)
        callbacks[class_name] = [];
      keep_tail_args(args, callbacks[class_name]);
    }

    function match(target) {
      var matched_callbacks = [];
      var actual_classes = classname(target).split(/\s+/);
      for (var class_name in callbacks)
        if (actual_classes.indexOf(class_name) > 0)
          matched_callbacks = matched_callbacks.concat(callbacks[class_name]);
      return matched_callbacks;
    }

    return {
      add: add,
      match: match
    };
  }

  function one_array() {
    var arr = [];
    for (var i = 0; i < arguments.length; i++) {
      var arg = arguments[i];
      if (arg.length) {
        arr = arr.concat(arg);
      } else {
        arr.push(arg);
      }
    }
    return arr;
  }

  function merge(tar, src, inject) {
    var rt = tar;
    if (inject === false)
      rt = merge({}, tar);
    for (var key in src)
      rt[key] = src[key];
    return rt;
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
      if (return_value === false)
        return false;
    }
    return true;
  }

  function wanted_callbacks_oncomplete(target) {
    return function (request, event, data) {
      var callbacks = callback_oncomplete.match(target);
      for (var i = 0; i < callbacks.length; i++)
        callbacks[i].call(target, data);
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
      merge(para, return_value);
    }
  }

  // facade
  var basic = {
    onclick: onclick,
    oncomplete: oncomplete,
    parameters: parameters
  };

  function submit_facade(class_name, options) {
    for (var intf in basic)
      if (options[intf])
        basic[intf].apply(null, one_array(class_name, options[intf]));
  }

  return merge(basic, {
    submit: submit_facade,
    toggle_debug: toggle_debug,
    revert: revert
  }, false);

})(A4J.AJAX);
