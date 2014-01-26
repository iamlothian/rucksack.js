
var
 $RSConfig = !!$RSConfig ? $RSConfig : {}
, $rucksack = $rucksack || (function (config) {

    "use strict";

    var
     DEBUG = config.DEBUG || false
    , ERROR_CALLBACK = config.ERROR_CALLBACK || null
    , LOCKED = false
    , _namespaces = {}
    , _modules = {}
    , _linkQueue = {}
    // REGEX
    , _KEY_REGEX = /([a-zA-Z]+\d*[\.\_]?)+?[a-zA-Z\d]/
    , _NAMESPACE_REGEX = /[a-zA-Z]+\d*:/
    , _MODULE_KEY_REGEX = new RegExp(_NAMESPACE_REGEX.source + _KEY_REGEX.source, "g")
    , _INTERFACE_REGEX = new RegExp(_MODULE_KEY_REGEX.source + "( as )" + _MODULE_KEY_REGEX.source)
    , _FUNCTION_ARGS_REGEX = /\(([^)]+)/
    , _FUNCTION_ARGS_SPLIT_REGEX = /\s*,\s*/
    , _OBJECT_TYPE_REGEX = /^\[object(.*)\]$/

    // helpers
    , _reset = function () {
        if (DEBUG) {
            _namespaces = {};
            _modules = {};
            _linkQueue = {};
            _awaitQueue = _namespace(_awaitNameSpace, { sealed: true });
        }
    }
    // returns the an object type
    , _getObjectType = function (O) {
        return Object.prototype.toString.call(O).match(_OBJECT_TYPE_REGEX)[1].toLowerCase().replace(/ /g, '');
    }
    // returns the argument list of a function constructor
    , _getFunctionArgs = function (F) {
        return F.toString().match(_FUNCTION_ARGS_REGEX)[1].split(_FUNCTION_ARGS_SPLIT_REGEX);
    }
    // returns the sate of a module
    , _moduleState = function (module) {
        var state = "";
        if (!!!module) state = "undefined";
        else if (!!module.dependencies) state = "linking";
        else if (!!module) state = "compiled";
        return state;
    }
    // validate module key and perpend namespace if needed
    , _namespaceKey = function (namespace, key) {
        if (!_KEY_REGEX.test(key))
            throw new Error(" Invalid module Key [" + key + "] must regex " + _KEY_REGEX.toString());

        return key.indexOf(namespace) === 0 ? key : (namespace + ':' + key);
    }
    // break apart dependency list into its usable parts
    , _proccessDependencies = function (constructor) {

        var
           dependencies = (constructor.length == 1 ? [] : constructor.slice(0, constructor.length - 1))
          , keys = []
          , interfaces = {}

        for (var key in dependencies) {
            if (_INTERFACE_REGEX.test(dependencies[key])) {

                console.log(dependencies[key]);

                var
                   parts = dependencies[key].match(_MODULE_KEY_REGEX)
                  , module_key = parts[0]
                  , interface_key = parts[1];

                if (DEBUG) console.log("INTERFACE: [" + interface_key + "] for [" + module_key + "]", parts);

                keys.push(module_key);
                interfaces[module_key] = interface_key;
            } else {
                keys.push(dependencies[key]);
            }

        }

        return {
            link_count: 0
          , link_keys: keys
          , link_interfaces: interfaces
        }
    }
    // is a module compilable
    , _canCompile = function (module) {
        return module.dependencies.link_count == module.dependencies.link_keys.length;
    }
    // is a module be linked to another
    , _canLink = function (caller_key, callee_key) {

        var
           caller_namespace = caller_key.split(':')[0]
          , callee_namespace = callee_key.split(':')[0]
          , isCalleeNamespaceSealed = _namespaces[callee_namespace]._options.sealed || false
          , isCalleeModuleSealed = _namespaces[callee_namespace][callee_key].sealed || false
          , isCalleeModuleAbstract = _namespaces[callee_namespace][callee_key].abstract || false;

        if (isCalleeModuleAbstract)
            throw new Error("Access Violation: Module [" + callee_key + "] is abstract and can only be referenced as an interface");
        if ((isCalleeNamespaceSealed || isCalleeModuleSealed) && caller_namespace != callee_namespace) {
            throw new Error("Access Violation: Module [" + callee_key + "] is seal to namespace [" + callee_namespace +
            "] and can not be accessed from namespace [" + caller_namespace + "]");
        }

        return true;

    }
    // turn the dependency list into injected 
    // compiled modules and apply any interfaces
    , _resolve = function (module) {

        var
           ijct = []
          , links = module.dependencies.link_keys
          , interfaces = module.dependencies.link_interfaces
          , NotFoundError = (function (key) {
              throw new Error("Resolve Exception: Module \"" + links[key] + "\" not found");
          });

        for (var key in links) {
            var link_module = _modules[links[key]];

            // get compiled modules to inject into this module
            link_module = _moduleState(link_module) == "compiled" ? link_module : new NotFoundError(key);

            // does dependency require an interface
            if (!!interfaces[links[key]]) {
                _assertInterface(links[key], link_module, interfaces[links[key]], _modules[interfaces[links[key]]])
            }

            ijct.push(link_module);
        }

        return ijct;

    }
    // compare a function constructor to a validation object
    // returns an index of an argument if the comparison fails
    // else true or a compiled function constructor
    , _validateFunctionArgs = function (thisFunction, validator) {

        var args = _getFunctionArgs(thisFunction);

        // check we are validation a function
        if (validator[0] === _getObjectType(thisFunction)) {

            // check arguments and ordering
            for (var idx in validator[1]) {

                // arguments don't match the name and order defined in the interface
                if (validator[1][idx] != args[idx])
                    return idx + 1;
            }
        } else {
            return false;
        }

        return !!validator[2] ? thisFunction.apply({}, validator[2]) : true;
    }
    // test that a module complies with an interface
    , _assertInterface = function (module_key, module, interface_key, thisInterface) {

        if (DEBUG) console.log("Assert Interface:", module_key, module, "AS", interface_key, thisInterface);

        // check module is no a function constructor
        if (_getObjectType(module) == "function") {
            if (!!thisInterface.$constructor) {
                module = _validateFunctionArgs(module, thisInterface.$constructor);
            } else {
                throw new Error("Interface Exception: No $constructor definition found for constructor function. Interface [" + interface_key + "] can not be applied to module [" + module_key +
                "] because module needs to be instanced by the constructor \"new " + module_key + "(" + module.toString().match(_FUNCTION_ARGS_REGEX)[1] + ")\"");
            }

        }

        // match interface properties
        for (var prop in thisInterface) {
            if (prop[0] == '$') continue;
            if (!!module[prop]) {
                var type = _getObjectType(module[prop]);

                switch (thisInterface[prop][0]) {
                    case "string":
                    case "number":
                    case "boolean":
                    case "array":
                        if (thisInterface[prop][0] != type)
                            throw new Error("Interface Exception: Module [" + module_key + "] must implement property ["
                            + prop + " : " + thisInterface[prop] + "] of interface [" + interface_key + "] "
                            + "Expected type \"" + thisInterface[prop][0] + "\" but found type \"" + type + "\"");
                        break;
                    case "function":
                        var result = _validateFunctionArgs(module[prop], thisInterface[prop]);

                        if (!!result) {
                            if (!isNaN(parseFloat(result)) && isFinite(result)) {
                                result = result - 1;
                                throw new Error(
                                  "Interface Exception: function argument mismatch in property " + prop +
                                  ". Expected \"" + thisInterface[prop][1][result] + "\" but found \"" + _getFunctionArgs(module[prop])
                                  + "\" in \"" + prop + " : " + module[prop] + "\"");
                            }
                        } else {
                            throw new Error("Interface Exception: Module [" + module_key + "] must implement property ["
                              + prop + " : " + thisInterface[prop] + "] of interface [" + interface_key + "] "
                              + "Expected type \"" + thisInterface[prop][0] + "\" but found type \"" + type + "\"");
                        }
                        break;
                }

            } else {
                throw new Error("Interface Exception: Module [" + module_key + "] must implement property ["
                 + "(" + thisInterface[prop][0] + ") " + prop + " : " + thisInterface[prop] + "] of interface [" + interface_key + "]");
            }
        }

        return true

    }
    // build the link state from a module constructor ready for registering
    , _constructorParts = function (namespace, constructor, type, key) {
        return {
            namespace: namespace
          , key: _namespaceKey(namespace, key)
          , type: type
          , dependencies: _proccessDependencies(constructor)
          , builder: constructor[constructor.length - 1]
        };
    }
    // life cycle
    , _register = function () {

        if (DEBUG) console.log("Registered: ", this);

        if (LOCKED)
            throw new Error("Register Exception: rucksack has been locked and can not be altered");

        if (_moduleState(_modules[this.key]) != "undefined")
            throw new Error("Register Exception: [" + this.key + "] has already been registered and can not be redefined");

        _modules[this.key] = this;

        // list dependencies to be linked
        for (var key in this.dependencies.link_keys) {

            var
               dependency_key = this.dependencies.link_keys[key]
               // add undefined module if dependency is yet to be defined
              , dependency = _modules[dependency_key] = !!_modules[dependency_key] ? _modules[dependency_key] : undefined;

            switch (_moduleState(dependency)) {

                case "undefined":
                case "linking":

                    // add dependency to _linkQueue if it isn't already in queue
                    _linkQueue[dependency_key] = !!_linkQueue[dependency_key] ? _linkQueue[dependency_key] : [];
                    // add this module as a listener to this dependency
                    _linkQueue[dependency_key].push(this.key);

                    if (DEBUG) console.log("[" + _linkQueue[dependency_key] + "] is listening for [" + dependency_key + "]");

                    break;

                    // try link now
                case "compiled":
                    // try link now
                    if (DEBUG) console.log(dependency_key, "is compiled try link now");
                    if (_canLink(this.key, dependency_key)) {
                        this.dependencies.link_count++;
                    }
                    break;
            }

        }

        // can compile?
        if (_canCompile(this)) _compile(this.key);

    }
    , _compile = function (module_key) {

        if (DEBUG) console.log("Try Compile: ", _modules[module_key]);

        var
           built = {}
          , injectables = _resolve(_modules[module_key]);

        switch (_modules[module_key].type) {
            case "service":
                _modules[module_key].builder.apply(built, injectables);
                break;
            case "factory":
                built = _modules[module_key].builder.apply(null, injectables);
                break;
            case "interface":
                built = _modules[module_key].builder();
                break;
            case "await":
                _modules[module_key].builder.apply(null, injectables);
                built = true;
                break;
        }

        _modules[module_key] = built;

        _link(module_key);

        //return _modules[module_key];

    }
    , _link = function (module_key) {

        if (DEBUG) console.log("Link [", module_key, "] with", _linkQueue[module_key] || "[ No listening modules ]");

        //var successfullLinks = [];

        // for each module listening to this module
        for (var listener_key in _linkQueue[module_key]) {

            var listener = _linkQueue[module_key][listener_key]

            if (DEBUG) console.log(listener, "is listening for", module_key);

            // can link
            if (_canLink(listener, module_key)) {

                // account dependency as available to module
                _modules[listener].dependencies.link_count++;

                // if all modules dependencies have been accounted for compile it
                if (_canCompile(_modules[listener])) _compile(listener);

                //successfullLinks.push(listener, _moduleState(_modules[listener]));
            }

        }

        // remove link from queue
        delete _linkQueue[module_key];

        //return successfullLinks;

    }
    , _await = function (name, constructor) {
        _awaitQueue.$await(name, constructor);
    }
    , _lock = function () {
        LOCKED = true;
    }

    // rucksack namespace interface
    , _namespace = function (namespace, options) {

        if (DEBUG) console.log("Add namespace: ", namespace, options);

        if (!!_namespaces[namespace])
            throw new Error("Namespace Exception: The namespace [" + namespace + "] has already been defined");

        _namespaces[namespace] = { _options: options || {} };

        var
        // -------------------------------------------------------
        // take a module and turn it into something the rucksack framework can use
        // this function is part of the stack for every module so errors can be captured here
        // -------------------------------------------------------
        _proccess = function (namespace, module_key, constructor, type, options) {

            var me = {};

            try {

                if (!!_namespaces[namespace]._options.frozen)
                    throw new Error("Namespace Exception: The namespace [" + namespace + "] has been frozen and can not be added to");

                me = _constructorParts(namespace, constructor, type, module_key);
                _namespaces[namespace][me.key] = options || {};
                _register.call(me);
            } catch (err) {

                if (!!ERROR_CALLBACK) {


                    // add scope data
                    var
                     NOT_SUPPORTED = "NOT SUPPORTED"
                    , errObj = {
                        name: err.name
                      , message: err.message
                      , lineNumber: err.lineNumber || err.line || NOT_SUPPORTED
                      , stack: err.stack || NOT_SUPPORTED
                      , $navigator: window.navigator
                      , $datetime: new Date().toLocaleString()
                      , $ruckackScope: {
                          module: me
                        , descriptor: !!_namespaces[namespace][me.key] ?
                          _namespaces[namespace][me.key].descriptor : NOT_SUPPORTED
                      }
                    };

                    // add error data
                    for (var prop in err)
                        errObj[prop] = err[prop];

                    ERROR_CALLBACK(errObj);
                }
                throw err;
            }
        }
        // -------------------------------------------------------
        // a module with a static like intent, built around the this object 
        // -------------------------------------------------------
        // Injectable
        , _service = function (module_key, constructor, options) {
            _proccess(namespace, module_key, constructor, "service", options);
            return _public;
        }
        // -------------------------------------------------------
        // a module with an instanciable like intent, built around the return object 
        // -------------------------------------------------------
        // Injectable
        , _factory = function (module_key, constructor, options) {
            _proccess(namespace, module_key, constructor, "factory", options);
            return _public;
        }
        // -------------------------------------------------------
        // a module with an abstract like intent, used to describe 
        // and validate the expected properties injected modules.
        // -------------------------------------------------------
        // Not Injectable
        , _interface = function (module_key, definition) {
            _proccess(namespace, module_key, [function () { return definition; }], "interface", { abstract: true, seal: true });
            return _public;
        }
        // -------------------------------------------------------
        // a listener module intended to be used to wait for dependencies to be resolved before use
        // unlike other modules no constructor is compiled, only a true value if the await is resolved
        // -------------------------------------------------------
        // Injectable but sealed
        , _await = function (module_key, constructor) {
            _proccess(_awaitNameSpace, module_key, constructor, "await", options);
        }
        // -------------------------------------------------------
        // DEPRICATED: Not useful, mostly falls outside the life cycle of the rucksack framework
        // -------------------------------------------------------
        , _tryGet = function (module_key) {

            if (!!!_namespaces[namespace][module_key])
                throw new Error("Reference Exception: Module [" + module_key + "] is not found in namespace [" + namespace + "]");

            var
             module = _modules[module_key]
            , result = null;

            switch (_moduleState(module)) {
                case "undefined":
                    throw new Error("Reference Exception: Module [" + module_key + "] is not yet defined");
                case "linking":
                    result = _resolve(module);
                    break;
                case "compiled":
                    result = module;
                    break;
            }

            return result;

        }
        // -------------------------------------------------------
        // also available as an option on a module. Describe is intended as an 
        // option method of internal documentation for debugging and describing you modules
        // -------------------------------------------------------
        , _describe = function (module_key, description) {
            if (!!module_key) {
                if (!!description && !!!_namespaces[namespace][module_key].descriptor)
                    _namespaces[namespace][module_key].descriptor = description;
                return _namespaces[namespace][module_key].descriptor;
            } else {
                // TODO: show all descriptions for name space
            }
        }
        // -------------------------------------------------------
        // freezes the state of this namespace and stops additions
        // -------------------------------------------------------
        , _freeze = function () {
            _namespaces[namespace]._options.frozen = true;
        }
        , _public = {
            $service: _service
          , $factory: _factory
          , $interface: _interface
          , $await: _await
            //,$get:        _tryGet // DEPRICATED
          , $describe: _describe
          , $freeze: _freeze
        };
        return _public;
    }
    // internal await namespace variables
    , _awaitNameSpace = "_AWAIT"
    , _awaitQueue = _namespace(_awaitNameSpace, { seal: true })
    // public
    , _public = {
        $namespace: _namespace
      , $await: _await
      , $lock: _lock
      , $reset: _reset
    };

    return _public;

})($RSConfig);
