// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Bootstrap for the Google JS Library (Closure).
 *
 * In uncompiled mode base.js will write out Closure's deps file, unless the
 * global <code>CLOSURE_NO_DEPS</code> is set to true.  This allows projects to
 * include their own deps file(s) from different locations.
 *
 */


/**
 * @define {boolean} Overridden to true by the compiler when --closure_pass
 *     or --mark_as_compiled is specified.
 */
var COMPILED = false;


/**
 * Base namespace for the Closure library.  Checks to see goog is
 * already defined in the current scope before assigning to prevent
 * clobbering if base.js is loaded more than once.
 *
 * @const
 */
var goog = goog || {};


/**
 * Reference to the global context.  In most cases this will be 'window'.
 */
goog.global = this;


/**
 * @define {boolean} DEBUG is provided as a convenience so that debugging code
 * that should not be included in a production js_binary can be easily stripped
 * by specifying --define goog.DEBUG=false to the JSCompiler. For example, most
 * toString() methods should be declared inside an "if (goog.DEBUG)" conditional
 * because they are generally used for debugging purposes and it is difficult
 * for the JSCompiler to statically determine whether they are used.
 */
goog.DEBUG = true;


/**
 * @define {string} LOCALE defines the locale being used for compilation. It is
 * used to select locale specific data to be compiled in js binary. BUILD rule
 * can specify this value by "--define goog.LOCALE=<locale_name>" as JSCompiler
 * option.
 *
 * Take into account that the locale code format is important. You should use
 * the canonical Unicode format with hyphen as a delimiter. Language must be
 * lowercase, Language Script - Capitalized, Region - UPPERCASE.
 * There are few examples: pt-BR, en, en-US, sr-Latin-BO, zh-Hans-CN.
 *
 * See more info about locale codes here:
 * http://www.unicode.org/reports/tr35/#Unicode_Language_and_Locale_Identifiers
 *
 * For language codes you should use values defined by ISO 693-1. See it here
 * http://www.w3.org/WAI/ER/IG/ert/iso639.htm. There is only one exception from
 * this rule: the Hebrew language. For legacy reasons the old code (iw) should
 * be used instead of the new code (he), see http://wiki/Main/IIISynonyms.
 */
goog.LOCALE = 'en';  // default to en


/**
 * Indicates whether or not we can call 'eval' directly to eval code in the
 * global scope. Set to a Boolean by the first call to goog.globalEval (which
 * empirically tests whether eval works for globals). @see goog.globalEval
 * @type {?boolean}
 * @private
 */
goog.evalWorksForGlobals_ = null;


/**
 * Creates object stubs for a namespace. When present in a file, goog.provide
 * also indicates that the file defines the indicated object. Calls to
 * goog.provide are resolved by the compiler if --closure_pass is set.
 * @param {string} name name of the object that this file defines.
 */
goog.provide = function(name) {
  if (!COMPILED) {
    // Ensure that the same namespace isn't provided twice. This is intended
    // to teach new developers that 'goog.provide' is effectively a variable
    // declaration. And when JSCompiler transforms goog.provide into a real
    // variable declaration, the compiled JS should work the same as the raw
    // JS--even when the raw JS uses goog.provide incorrectly.
    if (goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }

    var namespace = name;
    while ((namespace = namespace.substring(0, namespace.lastIndexOf('.')))) {
      goog.implicitNamespaces_[namespace] = true;
    }
  }

  goog.exportPath_(name);
};


/**
 * Marks that the current file should only be used for testing, and never for
 * live code in production.
 * @param {string=} opt_message Optional message to add to the error that's
 *     raised when used in production code.
 */
goog.setTestOnly = function(opt_message) {
  if (COMPILED && !goog.DEBUG) {
    opt_message = opt_message || '';
    throw Error('Importing test-only code into non-debug environment' +
                opt_message ? ': ' + opt_message : '.');
  }
};


if (!COMPILED) {
  /**
   * Namespaces implicitly defined by goog.provide. For example,
   * goog.provide('goog.events.Event') implicitly declares
   * that 'goog' and 'goog.events' must be namespaces.
   *
   * @type {Object}
   * @private
   */
  goog.implicitNamespaces_ = {};
}


/**
 * Builds an object structure for the provided namespace path,
 * ensuring that names that already exist are not overwritten. For
 * example:
 * "a.b.c" -> a = {};a.b={};a.b.c={};
 * Used by goog.provide and goog.exportSymbol.
 * @param {string} name name of the object that this file defines.
 * @param {*=} opt_object the object to expose at the end of the path.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 * @private
 */
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split('.');
  var cur = opt_objectToExportTo || goog.global;

  // Internet Explorer exhibits strange behavior when throwing errors from
  // methods externed in this manner.  See the testExportSymbolExceptions in
  // base_test.html for an example.
  if (!(parts[0] in cur) && cur.execScript) {
    cur.execScript('var ' + parts[0]);
  }

  // Certain browsers cannot parse code in the form for((a in b); c;);
  // This pattern is produced by the JSCompiler when it collapses the
  // statement above into the conditional loop below. To prevent this from
  // happening, use a for-loop and reserve the init logic as below.

  // Parentheses added to eliminate strict JS warning in Firefox.
  for (var part; parts.length && (part = parts.shift());) {
    if (!parts.length && goog.isDef(opt_object)) {
      // last part and we have an object; use it
      cur[part] = opt_object;
    } else if (cur[part]) {
      cur = cur[part];
    } else {
      cur = cur[part] = {};
    }
  }
};


/**
 * Returns an object based on its fully qualified external name.  If you are
 * using a compilation pass that renames property names beware that using this
 * function will not find renamed properties.
 *
 * @param {string} name The fully qualified name.
 * @param {Object=} opt_obj The object within which to look; default is
 *     |goog.global|.
 * @return {Object} The object or, if not found, null.
 */
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split('.');
  var cur = opt_obj || goog.global;
  for (var part; part = parts.shift(); ) {
    if (goog.isDefAndNotNull(cur[part])) {
      cur = cur[part];
    } else {
      return null;
    }
  }
  return cur;
};


/**
 * Globalizes a whole namespace, such as goog or goog.lang.
 *
 * @param {Object} obj The namespace to globalize.
 * @param {Object=} opt_global The object to add the properties to.
 * @deprecated Properties may be explicitly exported to the global scope, but
 *     this should no longer be done in bulk.
 */
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for (var x in obj) {
    global[x] = obj[x];
  }
};


/**
 * Adds a dependency from a file to the files it requires.
 * @param {string} relPath The path to the js file.
 * @param {Array} provides An array of strings with the names of the objects
 *                         this file provides.
 * @param {Array} requires An array of strings with the names of the objects
 *                         this file requires.
 */
goog.addDependency = function(relPath, provides, requires) {
  if (!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, '/');
    var deps = goog.dependencies_;
    for (var i = 0; provide = provides[i]; i++) {
      deps.nameToPath[provide] = path;
      if (!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {};
      }
      deps.pathToNames[path][provide] = true;
    }
    for (var j = 0; require = requires[j]; j++) {
      if (!(path in deps.requires)) {
        deps.requires[path] = {};
      }
      deps.requires[path][require] = true;
    }
  }
};


/**
 * Implements a system for the dynamic resolution of dependencies
 * that works in parallel with the BUILD system. Note that all calls
 * to goog.require will be stripped by the JSCompiler when the
 * --closure_pass option is used.
 * @param {string} rule Rule to include, in the form goog.package.part.
 */
goog.require = function(rule) {

  // if the object already exists we do not need do do anything
  // TODO(user): If we start to support require based on file name this has
  //            to change
  // TODO(user): If we allow goog.foo.* this has to change
  // TODO(user): If we implement dynamic load after page load we should probably
  //            not remove this code for the compiled output
  if (!COMPILED) {
    if (goog.getObjectByName(rule)) {
      return;
    }
    var path = goog.getPathFromDeps_(rule);
    if (path) {
      goog.included_[path] = true;
      goog.writeScripts_();
    } else {
      var errorMessage = 'goog.require could not find: ' + rule;
      if (goog.global.console) {
        goog.global.console['error'](errorMessage);
      }

        throw Error(errorMessage);
    }
  }
};


/**
 * Path for included scripts
 * @type {string}
 */
goog.basePath = '';


/**
 * A hook for overriding the base path.
 * @type {string|undefined}
 */
goog.global.CLOSURE_BASE_PATH;


/**
 * Whether to write out Closure's deps file. By default,
 * the deps are written.
 * @type {boolean|undefined}
 */
goog.global.CLOSURE_NO_DEPS;


/**
 * A function to import a single script. This is meant to be overridden when
 * Closure is being run in non-HTML contexts, such as web workers. It's defined
 * in the global scope so that it can be set before base.js is loaded, which
 * allows deps.js to be imported properly.
 *
 * The function is passed the script source, which is a relative URI. It should
 * return true if the script was imported, false otherwise.
 */
goog.global.CLOSURE_IMPORT_SCRIPT;


/**
 * Null function used for default values of callbacks, etc.
 * @return {void} Nothing.
 */
goog.nullFunction = function() {};


/**
 * The identity function. Returns its first argument.
 *
 * @param {...*} var_args The arguments of the function.
 * @return {*} The first argument.
 * @deprecated Use goog.functions.identity instead.
 */
goog.identityFunction = function(var_args) {
  return arguments[0];
};


/**
 * When defining a class Foo with an abstract method bar(), you can do:
 *
 * Foo.prototype.bar = goog.abstractMethod
 *
 * Now if a subclass of Foo fails to override bar(), an error
 * will be thrown when bar() is invoked.
 *
 * Note: This does not take the name of the function to override as
 * an argument because that would make it more difficult to obfuscate
 * our JavaScript code.
 *
 * @type {!Function}
 * @throws {Error} when invoked to indicate the method should be
 *   overridden.
 */
goog.abstractMethod = function() {
  throw Error('unimplemented abstract method');
};


/**
 * Adds a {@code getInstance} static method that always return the same instance
 * object.
 * @param {!Function} ctor The constructor for the class to add the static
 *     method to.
 */
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor());
  };
};


if (!COMPILED) {
  /**
   * Object used to keep track of urls that have already been added. This
   * record allows the prevention of circular dependencies.
   * @type {Object}
   * @private
   */
  goog.included_ = {};


  /**
   * This object is used to keep track of dependencies and other data that is
   * used for loading scripts
   * @private
   * @type {Object}
   */
  goog.dependencies_ = {
    pathToNames: {}, // 1 to many
    nameToPath: {}, // 1 to 1
    requires: {}, // 1 to many
    // used when resolving dependencies to prevent us from
    // visiting the file twice
    visited: {},
    written: {} // used to keep track of script files we have written
  };


  /**
   * Tries to detect whether is in the context of an HTML document.
   * @return {boolean} True if it looks like HTML document.
   * @private
   */
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != 'undefined' &&
           'write' in doc;  // XULDocument misses write.
  };


  /**
   * Tries to detect the base path of the base.js script that bootstraps Closure
   * @private
   */
  goog.findBasePath_ = function() {
    if (goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return;
    } else if (!goog.inHtmlDocument_()) {
      return;
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName('script');
    // Search backwards since the current script is in almost all cases the one
    // that has base.js.
    for (var i = scripts.length - 1; i >= 0; --i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf('?');
      var l = qmark == -1 ? src.length : qmark;
      if (src.substr(l - 7, 7) == 'base.js') {
        goog.basePath = src.substr(0, l - 7);
        return;
      }
    }
  };


  /**
   * Imports a script if, and only if, that script hasn't already been imported.
   * (Must be called at execution time)
   * @param {string} src Script source.
   * @private
   */
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT ||
        goog.writeScriptTag_;
    if (!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true;
    }
  };


  /**
   * The default implementation of the import function. Writes a script tag to
   * import the script.
   *
   * @param {string} src The script source.
   * @return {boolean} True if the script was imported, false otherwise.
   * @private
   */
  goog.writeScriptTag_ = function(src) {
    if (goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write(
          '<script type="text/javascript" src="' + src + '"></' + 'script>');
      return true;
    } else {
      return false;
    }
  };


  /**
   * Resolves dependencies based on the dependencies added using addDependency
   * and calls importScript_ in the correct order.
   * @private
   */
  goog.writeScripts_ = function() {
    // the scripts we need to write this time
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;

    function visitNode(path) {
      if (path in deps.written) {
        return;
      }

      // we have already visited this one. We can get here if we have cyclic
      // dependencies
      if (path in deps.visited) {
        if (!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path);
        }
        return;
      }

      deps.visited[path] = true;

      if (path in deps.requires) {
        for (var requireName in deps.requires[path]) {
          if (requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName]);
          } else if (!goog.getObjectByName(requireName)) {
            // If the required name is defined, we assume that this
            // dependency was bootstapped by other means. Otherwise,
            // throw an exception.
            throw Error('Undefined nameToPath for ' + requireName);
          }
        }
      }

      if (!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path);
      }
    }

    for (var path in goog.included_) {
      if (!deps.written[path]) {
        visitNode(path);
      }
    }

    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i]);
      } else {
        throw Error('Undefined script input');
      }
    }
  };


  /**
   * Looks at the dependency rules and tries to determine the script file that
   * fulfills a particular rule.
   * @param {string} rule In the form goog.namespace.Class or project.script.
   * @return {?string} Url corresponding to the rule, or null.
   * @private
   */
  goog.getPathFromDeps_ = function(rule) {
    if (rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule];
    } else {
      return null;
    }
  };

  goog.findBasePath_();

  // Allow projects to manage the deps files themselves.
  if (!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + 'deps.js');
  }
}



//==============================================================================
// Language Enhancements
//==============================================================================


/**
 * This is a "fixed" version of the typeof operator.  It differs from the typeof
 * operator in such a way that null returns 'null' and arrays return 'array'.
 * @param {*} value The value to get the type of.
 * @return {string} The name of the type.
 */
goog.typeOf = function(value) {
  var s = typeof value;
  if (s == 'object') {
    if (value) {
      // We cannot use constructor == Array or instanceof Array because
      // different frames have different Array objects. In IE6, if the iframe
      // where the array was created is destroyed, the array loses its
      // prototype. Then dereferencing val.splice here throws an exception, so
      // we can't use goog.isFunction. Calling typeof directly returns 'unknown'
      // so that will work. In this case, this function will return false and
      // most array functions will still work because the array is still
      // array-like (supports length and []) even though it has lost its
      // prototype.
      // Mark Miller noticed that Object.prototype.toString
      // allows access to the unforgeable [[Class]] property.
      //  15.2.4.2 Object.prototype.toString ( )
      //  When the toString method is called, the following steps are taken:
      //      1. Get the [[Class]] property of this object.
      //      2. Compute a string value by concatenating the three strings
      //         "[object ", Result(1), and "]".
      //      3. Return Result(2).
      // and this behavior survives the destruction of the execution context.
      if (value instanceof Array ||  // Works quickly in same execution context.
          // If value is from a different execution context then
          // !(value instanceof Object), which lets us early out in the common
          // case when value is from the same context but not an array.
          // The {if (value)} check above means we don't have to worry about
          // undefined behavior of Object.prototype.toString on null/undefined.
          //
          // HACK: In order to use an Object prototype method on the arbitrary
          //   value, the compiler requires the value be cast to type Object,
          //   even though the ECMA spec explicitly allows it.
          (!(value instanceof Object) &&
           (Object.prototype.toString.call(
               /** @type {Object} */ (value)) == '[object Array]') ||

           // In IE all non value types are wrapped as objects across window
           // boundaries (not iframe though) so we have to do object detection
           // for this edge case
           typeof value.length == 'number' &&
           typeof value.splice != 'undefined' &&
           typeof value.propertyIsEnumerable != 'undefined' &&
           !value.propertyIsEnumerable('splice')

          )) {
        return 'array';
      }
      // HACK: There is still an array case that fails.
      //     function ArrayImpostor() {}
      //     ArrayImpostor.prototype = [];
      //     var impostor = new ArrayImpostor;
      // this can be fixed by getting rid of the fast path
      // (value instanceof Array) and solely relying on
      // (value && Object.prototype.toString.vall(value) === '[object Array]')
      // but that would require many more function calls and is not warranted
      // unless closure code is receiving objects from untrusted sources.

      // IE in cross-window calls does not correctly marshal the function type
      // (it appears just as an object) so we cannot use just typeof val ==
      // 'function'. However, if the object has a call property, it is a
      // function.
      if (!(value instanceof Object) &&
          (Object.prototype.toString.call(
              /** @type {Object} */ (value)) == '[object Function]' ||
          typeof value.call != 'undefined' &&
          typeof value.propertyIsEnumerable != 'undefined' &&
          !value.propertyIsEnumerable('call'))) {
        return 'function';
      }


    } else {
      return 'null';
    }

  } else if (s == 'function' && typeof value.call == 'undefined') {
    // In Safari typeof nodeList returns 'function', and on Firefox
    // typeof behaves similarly for HTML{Applet,Embed,Object}Elements
    // and RegExps.  We would like to return object for those and we can
    // detect an invalid function by making sure that the function
    // object has a call method.
    return 'object';
  }
  return s;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE). Does not use browser native
 * Object.propertyIsEnumerable.
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  // KJS in Safari 2 is not ECMAScript compatible and lacks crucial methods
  // such as propertyIsEnumerable.  We therefore use a workaround.
  // Does anyone know a more efficient work around?
  if (propName in object) {
    for (var key in object) {
      if (key == propName &&
          Object.prototype.hasOwnProperty.call(object, propName)) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Safe way to test whether a property is enumarable.  It allows testing
 * for enumerable on objects where 'propertyIsEnumerable' is overridden or
 * does not exist (like DOM nodes in IE).
 * @param {Object} object The object to test if the property is enumerable.
 * @param {string} propName The property name to check for.
 * @return {boolean} True if the property is enumarable.
 * @private
 */
goog.propertyIsEnumerable_ = function(object, propName) {
  // In IE if object is from another window, cannot use propertyIsEnumerable
  // from this window's Object. Will raise a 'JScript object expected' error.
  if (object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName);
  } else {
    return goog.propertyIsEnumerableCustom_(object, propName);
  }
};


/**
 * Returns true if the specified value is not |undefined|.
 * WARNING: Do not use this to test if an object has a property. Use the in
 * operator instead.  Additionally, this function assumes that the global
 * undefined variable has not been redefined.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined.
 */
goog.isDef = function(val) {
  return val !== undefined;
};


/**
 * Returns true if the specified value is |null|
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is null.
 */
goog.isNull = function(val) {
  return val === null;
};


/**
 * Returns true if the specified value is defined and not null
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is defined and not null.
 */
goog.isDefAndNotNull = function(val) {
  // Note that undefined == null.
  return val != null;
};


/**
 * Returns true if the specified value is an array
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArray = function(val) {
  return goog.typeOf(val) == 'array';
};


/**
 * Returns true if the object looks like an array. To qualify as array like
 * the value needs to be either a NodeList or an object with a Number length
 * property.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an array.
 */
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == 'array' || type == 'object' && typeof val.length == 'number';
};


/**
 * Returns true if the object looks like a Date. To qualify as Date-like
 * the value needs to be an object and have a getFullYear() function.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a like a Date.
 */
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == 'function';
};


/**
 * Returns true if the specified value is a string
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a string.
 */
goog.isString = function(val) {
  return typeof val == 'string';
};


/**
 * Returns true if the specified value is a boolean
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is boolean.
 */
goog.isBoolean = function(val) {
  return typeof val == 'boolean';
};


/**
 * Returns true if the specified value is a number
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a number.
 */
goog.isNumber = function(val) {
  return typeof val == 'number';
};


/**
 * Returns true if the specified value is a function
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is a function.
 */
goog.isFunction = function(val) {
  return goog.typeOf(val) == 'function';
};


/**
 * Returns true if the specified value is an object.  This includes arrays
 * and functions.
 * @param {*} val Variable to test.
 * @return {boolean} Whether variable is an object.
 */
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == 'object' || type == 'array' || type == 'function';
};


/**
 * Gets a unique ID for an object. This mutates the object so that further
 * calls with the same object as a parameter returns the same value. The unique
 * ID is guaranteed to be unique across the current session amongst objects that
 * are passed into {@code getUid}. There is no guarantee that the ID is unique
 * or consistent across sessions. It is unsafe to generate unique ID for
 * function prototypes.
 *
 * @param {Object} obj The object to get the unique ID for.
 * @return {number} The unique ID for the object.
 */
goog.getUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // In Opera window.hasOwnProperty exists but always returns false so we avoid
  // using it. As a consequence the unique ID generated for BaseClass.prototype
  // and SubClass.prototype will be the same.
  return obj[goog.UID_PROPERTY_] ||
      (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_);
};


/**
 * Removes the unique ID from an object. This is useful if the object was
 * previously mutated using {@code goog.getUid} in which case the mutation is
 * undone.
 * @param {Object} obj The object to remove the unique ID field from.
 */
goog.removeUid = function(obj) {
  // TODO(user): Make the type stricter, do not accept null.

  // DOM nodes in IE are not instance of Object and throws exception
  // for delete. Instead we try to use removeAttribute
  if ('removeAttribute' in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_);
  }
  /** @preserveTry */
  try {
    delete obj[goog.UID_PROPERTY_];
  } catch (ex) {
  }
};


/**
 * Name for unique ID property. Initialized in a way to help avoid collisions
 * with other closure javascript on the same page.
 * @type {string}
 * @private
 */
goog.UID_PROPERTY_ = 'closure_uid_' +
    Math.floor(Math.random() * 2147483648).toString(36);


/**
 * Counter for UID.
 * @type {number}
 * @private
 */
goog.uidCounter_ = 0;


/**
 * Adds a hash code field to an object. The hash code is unique for the
 * given object.
 * @param {Object} obj The object to get the hash code for.
 * @return {number} The hash code for the object.
 * @deprecated Use goog.getUid instead.
 */
goog.getHashCode = goog.getUid;


/**
 * Removes the hash code field from an object.
 * @param {Object} obj The object to remove the field from.
 * @deprecated Use goog.removeUid instead.
 */
goog.removeHashCode = goog.removeUid;


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * <code>goog.cloneObject</code> does not detect reference loops. Objects that
 * refer to themselves will cause infinite recursion.
 *
 * <code>goog.cloneObject</code> is unaware of unique identifiers, and copies
 * UIDs created by <code>getUid</code> into cloned results.
 *
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 * @deprecated goog.cloneObject is unsafe. Prefer the goog.object methods.
 */
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      clone[key] = goog.cloneObject(obj[key]);
    }
    return clone;
  }

  return obj;
};


/**
 * Forward declaration for the clone method. This is necessary until the
 * compiler can better support duck-typing constructs as used in
 * goog.cloneObject.
 *
 * TODO(user): Remove once the JSCompiler can infer that the check for
 * proto.clone is safe in goog.cloneObject.
 *
 * @type {Function}
 */
Object.prototype.clone;


/**
 * A native implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 * @suppress {deprecated} The compiler thinks that Function.prototype.bind
 *     is deprecated because some people have declared a pure-JS version.
 *     Only the pure-JS version is truly deprecated.
 */
goog.bindNative_ = function(fn, selfObj, var_args) {
  return /** @type {!Function} */ (fn.call.apply(fn.bind, arguments));
};


/**
 * A pure-JS implementation of goog.bind.
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @private
 */
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;

  if (arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      // Prepend the bound arguments to the current arguments.
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs);
    };

  } else {
    return function() {
      return fn.apply(context, arguments);
    };
  }
};


/**
 * Partially applies this function to a particular 'this object' and zero or
 * more arguments. The result is a new function with some arguments of the first
 * function pre-filled and the value of |this| 'pre-specified'.<br><br>
 *
 * Remaining arguments specified at call-time are appended to the pre-
 * specified ones.<br><br>
 *
 * Also see: {@link #partial}.<br><br>
 *
 * Usage:
 * <pre>var barMethBound = bind(myFunction, myObj, 'arg1', 'arg2');
 * barMethBound('arg3', 'arg4');</pre>
 *
 * @param {Function} fn A function to partially apply.
 * @param {Object|undefined} selfObj Specifies the object which |this| should
 *     point to when the function is run. If the value is null or undefined, it
 *     will default to the global object.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to the function.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 * @suppress {deprecated} See above.
 */
goog.bind = function(fn, selfObj, var_args) {
  // TODO(nicksantos): narrow the type signature.
  if (Function.prototype.bind &&
      // NOTE(nicksantos): Somebody pulled base.js into the default
      // Chrome extension environment. This means that for Chrome extensions,
      // they get the implementation of Function.prototype.bind that
      // calls goog.bind instead of the native one. Even worse, we don't want
      // to introduce a circular dependency between goog.bind and
      // Function.prototype.bind, so we have to hack this to make sure it
      // works correctly.
      Function.prototype.bind.toString().indexOf('native code') != -1) {
    goog.bind = goog.bindNative_;
  } else {
    goog.bind = goog.bindJs_;
  }
  return goog.bind.apply(null, arguments);
};


/**
 * Like bind(), except that a 'this object' is not required. Useful when the
 * target function is already bound.
 *
 * Usage:
 * var g = partial(f, arg1, arg2);
 * g(arg3, arg4);
 *
 * @param {Function} fn A function to partially apply.
 * @param {...*} var_args Additional arguments that are partially
 *     applied to fn.
 * @return {!Function} A partially-applied form of the function bind() was
 *     invoked as a method of.
 */
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    // Prepend the bound arguments to the current arguments.
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs);
  };
};


/**
 * Copies all the members of a source object to a target object. This method
 * does not work on all browsers for all objects that contain keys such as
 * toString or hasOwnProperty. Use goog.object.extend for this purpose.
 * @param {Object} target Target.
 * @param {Object} source Source.
 */
goog.mixin = function(target, source) {
  for (var x in source) {
    target[x] = source[x];
  }

  // For IE7 or lower, the for-in-loop does not contain any properties that are
  // not enumerable on the prototype object (for example, isPrototypeOf from
  // Object.prototype) but also it will not include 'replace' on objects that
  // extend String and change 'replace' (not that it is common for anyone to
  // extend anything except Object).
};


/**
 * @return {number} An integer value representing the number of milliseconds
 *     between midnight, January 1, 1970 and the current time.
 */
goog.now = Date.now || (function() {
  // Unary plus operator converts its operand to a number which in the case of
  // a date is done by calling getTime().
  return +new Date();
});


/**
 * Evals javascript in the global scope.  In IE this uses execScript, other
 * browsers use goog.global.eval. If goog.global.eval does not evaluate in the
 * global scope (for example, in Safari), appends a script tag instead.
 * Throws an exception if neither execScript or eval is defined.
 * @param {string} script JavaScript string.
 */
goog.globalEval = function(script) {
  if (goog.global.execScript) {
    goog.global.execScript(script, 'JavaScript');
  } else if (goog.global.eval) {
    // Test to see if eval works
    if (goog.evalWorksForGlobals_ == null) {
      goog.global.eval('var _et_ = 1;');
      if (typeof goog.global['_et_'] != 'undefined') {
        delete goog.global['_et_'];
        goog.evalWorksForGlobals_ = true;
      } else {
        goog.evalWorksForGlobals_ = false;
      }
    }

    if (goog.evalWorksForGlobals_) {
      goog.global.eval(script);
    } else {
      var doc = goog.global.document;
      var scriptElt = doc.createElement('script');
      scriptElt.type = 'text/javascript';
      scriptElt.defer = false;
      // Note(user): can't use .innerHTML since "t('<test>')" will fail and
      // .text doesn't work in Safari 2.  Therefore we append a text node.
      scriptElt.appendChild(doc.createTextNode(script));
      doc.body.appendChild(scriptElt);
      doc.body.removeChild(scriptElt);
    }
  } else {
    throw Error('goog.globalEval not available');
  }
};


/**
 * A macro for defining composite types.
 *
 * By assigning goog.typedef to a name, this tells JSCompiler that this is not
 * the name of a class, but rather it's the name of a composite type.
 *
 * For example,
 * /** @type {Array|NodeList} / goog.ArrayLike = goog.typedef;
 * will tell JSCompiler to replace all appearances of goog.ArrayLike in type
 * definitions with the union of Array and NodeList.
 *
 * Does nothing in uncompiled code.
 *
 * @deprecated Please use the {@code @typedef} annotation.
 */
goog.typedef = true;


/**
 * Optional map of CSS class names to obfuscated names used with
 * goog.getCssName().
 * @type {Object|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMapping_;


/**
 * Optional obfuscation style for CSS class names. Should be set to either
 * 'BY_WHOLE' or 'BY_PART' if defined.
 * @type {string|undefined}
 * @private
 * @see goog.setCssNameMapping
 */
goog.cssNameMappingStyle_;


/**
 * Handles strings that are intended to be used as CSS class names.
 *
 * This function works in tandem with @see goog.setCssNameMapping.
 *
 * Without any mapping set, the arguments are simple joined with a
 * hyphen and passed through unaltered.
 *
 * When there is a mapping, there are two possible styles in which
 * these mappings are used. In the BY_PART style, each part (i.e. in
 * between hyphens) of the passed in css name is rewritten according
 * to the map. In the BY_WHOLE style, the full css name is looked up in
 * the map directly. If a rewrite is not specified by the map, the
 * compiler will output a warning.
 *
 * When the mapping is passed to the compiler, it will replace calls
 * to goog.getCssName with the strings from the mapping, e.g.
 *     var x = goog.getCssName('foo');
 *     var y = goog.getCssName(this.baseClass, 'active');
 *  becomes:
 *     var x= 'foo';
 *     var y = this.baseClass + '-active';
 *
 * If one argument is passed it will be processed, if two are passed
 * only the modifier will be processed, as it is assumed the first
 * argument was generated as a result of calling goog.getCssName.
 *
 * @param {string} className The class name.
 * @param {string=} opt_modifier A modifier to be appended to the class name.
 * @return {string} The class name or the concatenation of the class name and
 *     the modifier.
 */
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName];
  };

  var renameByParts = function(cssName) {
    // Remap all the parts individually.
    var parts = cssName.split('-');
    var mapped = [];
    for (var i = 0; i < parts.length; i++) {
      var mapping = getMapping(parts[i]);
      if (!mapping) {
        // If any of the parts fail to match,
        // just return the whole string unmodified.
        // The compiler will emit a warning about this.
        return cssName;
      }
      mapped.push(mapping);
    }
    return mapped.join('-');
  };

  var renameByWhole = function(cssName) {
    return getMapping(cssName) || cssName;
  };

  var rename;
  if (goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == 'BY_WHOLE' ?
        renameByWhole : renameByParts;
  } else {
    rename = function(a) {
      return a;
    };
  }

  if (opt_modifier) {
    return className + '-' + rename(opt_modifier);
  } else {
    return rename(className);
  }
};


/**
 * Sets the map to check when returning a value from goog.getCssName(). Example:
 * <pre>
 * goog.setCssNameMapping({
 *   "goog": "a",
 *   "disabled": "b",
 * });
 *
 * var x = goog.getCssName('goog');
 * // The following evaluates to: "a a-b".
 * goog.getCssName('goog') + ' ' + goog.getCssName(x, 'disabled')
 * </pre>
 * When declared as a map of string literals to string literals, the JSCompiler
 * will replace all calls to goog.getCssName() using the supplied map if the
 * --closure_pass flag is set.
 *
 * @param {!Object} mapping A map of strings to strings where keys are possible
 *     arguments to goog.getCssName() and values are the corresponding values
 *     that should be returned.
 * @param {string=} style The style of css name mapping. There are two valid
 *     options: 'BY_PART', and 'BY_WHOLE'.
 * @see goog.getCssName for a description.
 */
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style;
};


/**
 * Abstract implementation of goog.getMsg for use with localized messages.
 * @param {string} str Translatable string, places holders in the form {$foo}.
 * @param {Object=} opt_values Map of place holder name to value.
 * @return {string} message with placeholders filled.
 */
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for (var key in values) {
    var value = ('' + values[key]).replace(/\$/g, '$$$$');
    str = str.replace(new RegExp('\\{\\$' + key + '\\}', 'gi'), value);
  }
  return str;
};


/**
 * Exposes an unobfuscated global namespace path for the given object.
 * Note that fields of the exported object *will* be obfuscated,
 * unless they are exported in turn via this function or
 * goog.exportProperty
 *
 * <p>Also handy for making public items that are defined in anonymous
 * closures.
 *
 * ex. goog.exportSymbol('Foo', Foo);
 *
 * ex. goog.exportSymbol('public.path.Foo.staticFunction',
 *                       Foo.staticFunction);
 *     public.path.Foo.staticFunction();
 *
 * ex. goog.exportSymbol('public.path.Foo.prototype.myMethod',
 *                       Foo.prototype.myMethod);
 *     new public.path.Foo().myMethod();
 *
 * @param {string} publicPath Unobfuscated name to export.
 * @param {*} object Object the name should point to.
 * @param {Object=} opt_objectToExportTo The object to add the path to; default
 *     is |goog.global|.
 */
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo);
};


/**
 * Exports a property unobfuscated into the object's namespace.
 * ex. goog.exportProperty(Foo, 'staticFunction', Foo.staticFunction);
 * ex. goog.exportProperty(Foo.prototype, 'myMethod', Foo.prototype.myMethod);
 * @param {Object} object Object whose static property is being exported.
 * @param {string} publicName Unobfuscated name to export.
 * @param {*} symbol Object the name should point to.
 */
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol;
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * Usage:
 * <pre>
 * function ParentClass(a, b) { }
 * ParentClass.prototype.foo = function(a) { }
 *
 * function ChildClass(a, b, c) {
 *   ParentClass.call(this, a, b);
 * }
 *
 * goog.inherits(ChildClass, ParentClass);
 *
 * var child = new ChildClass('a', 'b', 'see');
 * child.foo(); // works
 * </pre>
 *
 * In addition, a superclass' implementation of a method can be invoked
 * as follows:
 *
 * <pre>
 * ChildClass.prototype.foo = function(a) {
 *   ChildClass.superClass_.foo.call(this, a);
 *   // other code
 * };
 * </pre>
 *
 * @param {Function} childCtor Child class.
 * @param {Function} parentCtor Parent class.
 */
goog.inherits = function(childCtor, parentCtor) {
  /** @constructor */
  function tempCtor() {};
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor();
  childCtor.prototype.constructor = childCtor;
};


/**
 * Call up to the superclass.
 *
 * If this is called from a constructor, then this calls the superclass
 * contructor with arguments 1-N.
 *
 * If this is called from a prototype method, then you must pass
 * the name of the method as the second argument to this function. If
 * you do not, you will get a runtime error. This calls the superclass'
 * method with arguments 2-N.
 *
 * This function only works if you use goog.inherits to express
 * inheritance relationships between your classes.
 *
 * This function is a compiler primitive. At compile-time, the
 * compiler will do macro expansion to remove a lot of
 * the extra overhead that this function introduces. The compiler
 * will also enforce a lot of the assumptions that this function
 * makes, and treat it as a compiler error if you break them.
 *
 * @param {!Object} me Should always be "this".
 * @param {*=} opt_methodName The method name if calling a super method.
 * @param {...*} var_args The rest of the arguments.
 * @return {*} The return value of the superclass method.
 */
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if (caller.superClass_) {
    // This is a constructor. Call the superclass constructor.
    return caller.superClass_.constructor.apply(
        me, Array.prototype.slice.call(arguments, 1));
  }

  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for (var ctor = me.constructor;
       ctor; ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if (ctor.prototype[opt_methodName] === caller) {
      foundCaller = true;
    } else if (foundCaller) {
      return ctor.prototype[opt_methodName].apply(me, args);
    }
  }

  // If we did not find the caller in the prototype chain,
  // then one of two things happened:
  // 1) The caller is an instance method.
  // 2) This method was not called by the right caller.
  if (me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args);
  } else {
    throw Error(
        'goog.base called from a method of one name ' +
        'to a method of a different name');
  }
};


/**
 * Allow for aliasing within scope functions.  This function exists for
 * uncompiled code - in compiled code the calls will be inlined and the
 * aliases applied.  In uncompiled code the function is simply run since the
 * aliases as written are valid JavaScript.
 * @param {function()} fn Function to call.  This function can contain aliases
 *     to namespaces (e.g. "var dom = goog.dom") or classes
 *    (e.g. "var Timer = goog.Timer").
 */
goog.scope = function(fn) {
  fn.call(goog.global);
};




// Copyright 2011 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// This file has been auto-generated by GenJsDeps, please do not edit.

goog.addDependency('array/array.js', ['goog.array', 'goog.array.ArrayLike'], ['goog.asserts']);
goog.addDependency('asserts/asserts.js', ['goog.asserts', 'goog.asserts.AssertionError'], ['goog.debug.Error', 'goog.string']);
goog.addDependency('async/conditionaldelay.js', ['goog.async.ConditionalDelay'], ['goog.Disposable', 'goog.async.Delay']);
goog.addDependency('async/delay.js', ['goog.Delay', 'goog.async.Delay'], ['goog.Disposable', 'goog.Timer']);
goog.addDependency('async/throttle.js', ['goog.Throttle', 'goog.async.Throttle'], ['goog.Disposable', 'goog.Timer']);
goog.addDependency('base.js', ['goog'], []);
goog.addDependency('color/alpha.js', ['goog.color.alpha'], ['goog.color']);
goog.addDependency('color/color.js', ['goog.color'], ['goog.color.names', 'goog.math']);
goog.addDependency('color/names.js', ['goog.color.names'], []);
goog.addDependency('crypt/arc4.js', ['goog.crypt.Arc4'], ['goog.asserts']);
goog.addDependency('crypt/base64.js', ['goog.crypt.base64'], ['goog.crypt', 'goog.userAgent']);
goog.addDependency('crypt/basen.js', ['goog.crypt.baseN'], []);
goog.addDependency('crypt/crypt.js', ['goog.crypt'], []);
goog.addDependency('crypt/hash32.js', ['goog.crypt.hash32'], ['goog.crypt']);
goog.addDependency('crypt/sha1.js', ['goog.crypt.Sha1'], []);
goog.addDependency('cssom/cssom.js', ['goog.cssom', 'goog.cssom.CssRuleType'], ['goog.array', 'goog.dom']);
goog.addDependency('cssom/iframe/style.js', ['goog.cssom.iframe.style'], ['goog.cssom', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.classes', 'goog.style', 'goog.userAgent']);
goog.addDependency('datasource/datamanager.js', ['goog.ds.DataManager'], ['goog.ds.BasicNodeList', 'goog.ds.DataNode', 'goog.ds.Expr', 'goog.string', 'goog.structs', 'goog.structs.Map']);
goog.addDependency('datasource/datasource.js', ['goog.ds.BaseDataNode', 'goog.ds.BasicNodeList', 'goog.ds.DataNode', 'goog.ds.DataNodeList', 'goog.ds.EmptyNodeList', 'goog.ds.LoadState', 'goog.ds.SortedNodeList', 'goog.ds.Util', 'goog.ds.logger'], ['goog.array', 'goog.debug.Logger']);
goog.addDependency('datasource/expr.js', ['goog.ds.Expr'], ['goog.ds.BasicNodeList', 'goog.ds.EmptyNodeList', 'goog.string']);
goog.addDependency('datasource/fastdatanode.js', ['goog.ds.AbstractFastDataNode', 'goog.ds.FastDataNode', 'goog.ds.FastListNode', 'goog.ds.PrimitiveFastDataNode'], ['goog.ds.DataManager', 'goog.ds.EmptyNodeList', 'goog.string']);
goog.addDependency('datasource/jsdatasource.js', ['goog.ds.JsDataSource', 'goog.ds.JsPropertyDataSource'], ['goog.ds.BaseDataNode', 'goog.ds.BasicNodeList', 'goog.ds.DataManager', 'goog.ds.EmptyNodeList', 'goog.ds.LoadState']);
goog.addDependency('datasource/jsondatasource.js', ['goog.ds.JsonDataSource'], ['goog.Uri', 'goog.dom', 'goog.ds.DataManager', 'goog.ds.JsDataSource', 'goog.ds.LoadState', 'goog.ds.logger']);
goog.addDependency('datasource/jsxmlhttpdatasource.js', ['goog.ds.JsXmlHttpDataSource'], ['goog.Uri', 'goog.ds.DataManager', 'goog.ds.FastDataNode', 'goog.ds.LoadState', 'goog.ds.logger', 'goog.events', 'goog.net.EventType', 'goog.net.XhrIo']);
goog.addDependency('datasource/xmldatasource.js', ['goog.ds.XmlDataSource', 'goog.ds.XmlHttpDataSource'], ['goog.Uri', 'goog.dom.NodeType', 'goog.dom.xml', 'goog.ds.BasicNodeList', 'goog.ds.DataManager', 'goog.ds.LoadState', 'goog.ds.logger', 'goog.net.XhrIo', 'goog.string']);
goog.addDependency('date/date.js', ['goog.date', 'goog.date.Date', 'goog.date.DateTime', 'goog.date.Interval', 'goog.date.month', 'goog.date.weekDay'], ['goog.asserts', 'goog.date.DateLike', 'goog.string']);
goog.addDependency('date/datelike.js', ['goog.date.DateLike'], []);
goog.addDependency('date/daterange.js', ['goog.date.DateRange', 'goog.date.DateRange.Iterator', 'goog.date.DateRange.StandardDateRangeKeys'], ['goog.date.Date', 'goog.date.DateLike', 'goog.date.Interval', 'goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('date/relative.js', ['goog.date.relative'], ['goog.i18n.DateTimeFormat']);
goog.addDependency('date/utcdatetime.js', ['goog.date.UtcDateTime'], ['goog.date', 'goog.date.Date', 'goog.date.DateTime', 'goog.date.Interval']);
goog.addDependency('debug/console.js', ['goog.debug.Console'], ['goog.debug.LogManager', 'goog.debug.Logger.Level', 'goog.debug.TextFormatter']);
goog.addDependency('debug/debug.js', ['goog.debug'], ['goog.array', 'goog.string', 'goog.structs.Set']);
goog.addDependency('debug/debugwindow.js', ['goog.debug.DebugWindow'], ['goog.debug.HtmlFormatter', 'goog.debug.LogManager', 'goog.structs.CircularBuffer', 'goog.userAgent']);
goog.addDependency('debug/devcss/devcss.js', ['goog.debug.DevCss', 'goog.debug.DevCss.UserAgent'], ['goog.cssom', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.string', 'goog.userAgent']);
goog.addDependency('debug/devcss/devcssrunner.js', ['goog.debug.devCssRunner'], ['goog.debug.DevCss']);
goog.addDependency('debug/divconsole.js', ['goog.debug.DivConsole'], ['goog.debug.HtmlFormatter', 'goog.debug.LogManager', 'goog.style']);
goog.addDependency('debug/entrypointregistry.js', ['goog.debug.EntryPointMonitor', 'goog.debug.entryPointRegistry'], []);
goog.addDependency('debug/error.js', ['goog.debug.Error'], []);
goog.addDependency('debug/errorhandler.js', ['goog.debug.ErrorHandler'], ['goog.debug', 'goog.debug.EntryPointMonitor', 'goog.debug.Trace']);
goog.addDependency('debug/errorhandlerweakdep.js', ['goog.debug.errorHandlerWeakDep'], []);
goog.addDependency('debug/errorreporter.js', ['goog.debug.ErrorReporter', 'goog.debug.ErrorReporter.ExceptionEvent'], ['goog.debug', 'goog.debug.ErrorHandler', 'goog.debug.Logger', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.net.XhrIo', 'goog.object', 'goog.string', 'goog.uri.utils']);
goog.addDependency('debug/fancywindow.js', ['goog.debug.FancyWindow'], ['goog.debug.DebugWindow', 'goog.debug.LogManager', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.dom.DomHelper', 'goog.object', 'goog.userAgent']);
goog.addDependency('debug/formatter.js', ['goog.debug.Formatter', 'goog.debug.HtmlFormatter', 'goog.debug.TextFormatter'], ['goog.debug.RelativeTimeProvider', 'goog.string']);
goog.addDependency('debug/gcdiagnostics.js', ['goog.debug.GcDiagnostics'], ['goog.debug.Logger', 'goog.debug.Trace', 'goog.userAgent']);
goog.addDependency('debug/logbuffer.js', ['goog.debug.LogBuffer'], ['goog.asserts', 'goog.debug.LogRecord']);
goog.addDependency('debug/logger.js', ['goog.debug.LogManager', 'goog.debug.Logger', 'goog.debug.Logger.Level'], ['goog.array', 'goog.asserts', 'goog.debug', 'goog.debug.LogBuffer', 'goog.debug.LogRecord']);
goog.addDependency('debug/logrecord.js', ['goog.debug.LogRecord'], []);
goog.addDependency('debug/relativetimeprovider.js', ['goog.debug.RelativeTimeProvider'], []);
goog.addDependency('debug/tracer.js', ['goog.debug.Trace'], ['goog.array', 'goog.debug.Logger', 'goog.iter', 'goog.structs.Map', 'goog.structs.SimplePool']);
goog.addDependency('disposable/disposable.js', ['goog.Disposable', 'goog.dispose'], []);
goog.addDependency('dom/a11y.js', ['goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State'], ['goog.dom']);
goog.addDependency('dom/abstractmultirange.js', ['goog.dom.AbstractMultiRange'], ['goog.array', 'goog.dom', 'goog.dom.AbstractRange']);
goog.addDependency('dom/abstractrange.js', ['goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.SavedCaretRange', 'goog.dom.TagIterator', 'goog.userAgent']);
goog.addDependency('dom/annotate.js', ['goog.dom.annotate'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.string']);
goog.addDependency('dom/browserfeature.js', ['goog.dom.BrowserFeature'], ['goog.userAgent']);
goog.addDependency('dom/browserrange/abstractrange.js', ['goog.dom.browserrange.AbstractRange'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.TagName', 'goog.dom.TextRangeIterator', 'goog.iter', 'goog.string', 'goog.string.StringBuffer', 'goog.userAgent']);
goog.addDependency('dom/browserrange/browserrange.js', ['goog.dom.browserrange', 'goog.dom.browserrange.Error'], ['goog.dom', 'goog.dom.browserrange.GeckoRange', 'goog.dom.browserrange.IeRange', 'goog.dom.browserrange.OperaRange', 'goog.dom.browserrange.W3cRange', 'goog.dom.browserrange.WebKitRange', 'goog.userAgent']);
goog.addDependency('dom/browserrange/geckorange.js', ['goog.dom.browserrange.GeckoRange'], ['goog.dom.browserrange.W3cRange']);
goog.addDependency('dom/browserrange/ierange.js', ['goog.dom.browserrange.IeRange'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.dom.NodeIterator', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.TagName', 'goog.dom.browserrange.AbstractRange', 'goog.iter', 'goog.iter.StopIteration', 'goog.string']);
goog.addDependency('dom/browserrange/operarange.js', ['goog.dom.browserrange.OperaRange'], ['goog.dom.browserrange.W3cRange']);
goog.addDependency('dom/browserrange/w3crange.js', ['goog.dom.browserrange.W3cRange'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.RangeEndpoint', 'goog.dom.browserrange.AbstractRange', 'goog.string']);
goog.addDependency('dom/browserrange/webkitrange.js', ['goog.dom.browserrange.WebKitRange'], ['goog.dom.RangeEndpoint', 'goog.dom.browserrange.W3cRange', 'goog.userAgent']);
goog.addDependency('dom/classes.js', ['goog.dom.classes'], ['goog.array']);
goog.addDependency('dom/controlrange.js', ['goog.dom.ControlRange', 'goog.dom.ControlRangeIterator'], ['goog.array', 'goog.dom', 'goog.dom.AbstractMultiRange', 'goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TagWalkType', 'goog.dom.TextRange', 'goog.iter.StopIteration', 'goog.userAgent']);
goog.addDependency('dom/dom.js', ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.NodeType'], ['goog.array', 'goog.dom.BrowserFeature', 'goog.dom.TagName', 'goog.dom.classes', 'goog.math.Coordinate', 'goog.math.Size', 'goog.object', 'goog.string', 'goog.userAgent']);
goog.addDependency('dom/dom_test.js', ['goog.dom.dom_test'], ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.testing.asserts', 'goog.userAgent', 'goog.userAgent.product', 'goog.userAgent.product.isVersion']);
goog.addDependency('dom/fontsizemonitor.js', ['goog.dom.FontSizeMonitor', 'goog.dom.FontSizeMonitor.EventType'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.userAgent']);
goog.addDependency('dom/forms.js', ['goog.dom.forms'], ['goog.structs.Map']);
goog.addDependency('dom/iframe.js', ['goog.dom.iframe'], ['goog.dom']);
goog.addDependency('dom/iter.js', ['goog.dom.iter.AncestorIterator', 'goog.dom.iter.ChildIterator', 'goog.dom.iter.SiblingIterator'], ['goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('dom/multirange.js', ['goog.dom.MultiRange', 'goog.dom.MultiRangeIterator'], ['goog.array', 'goog.debug.Logger', 'goog.dom.AbstractMultiRange', 'goog.dom.AbstractRange', 'goog.dom.RangeIterator', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TextRange', 'goog.iter.StopIteration']);
goog.addDependency('dom/nodeiterator.js', ['goog.dom.NodeIterator'], ['goog.dom.TagIterator']);
goog.addDependency('dom/nodeoffset.js', ['goog.dom.NodeOffset'], ['goog.Disposable', 'goog.dom.TagName']);
goog.addDependency('dom/pattern/abstractpattern.js', ['goog.dom.pattern.AbstractPattern'], ['goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/allchildren.js', ['goog.dom.pattern.AllChildren'], ['goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/callback/callback.js', ['goog.dom.pattern.callback'], ['goog.dom', 'goog.dom.TagWalkType', 'goog.iter']);
goog.addDependency('dom/pattern/callback/counter.js', ['goog.dom.pattern.callback.Counter'], []);
goog.addDependency('dom/pattern/callback/test.js', ['goog.dom.pattern.callback.Test'], ['goog.iter.StopIteration']);
goog.addDependency('dom/pattern/childmatches.js', ['goog.dom.pattern.ChildMatches'], ['goog.dom.pattern.AllChildren', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/endtag.js', ['goog.dom.pattern.EndTag'], ['goog.dom.TagWalkType', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/fulltag.js', ['goog.dom.pattern.FullTag'], ['goog.dom.pattern.MatchType', 'goog.dom.pattern.StartTag', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/matcher.js', ['goog.dom.pattern.Matcher'], ['goog.dom.TagIterator', 'goog.dom.pattern.MatchType', 'goog.iter']);
goog.addDependency('dom/pattern/nodetype.js', ['goog.dom.pattern.NodeType'], ['goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/pattern.js', ['goog.dom.pattern', 'goog.dom.pattern.MatchType'], []);
goog.addDependency('dom/pattern/repeat.js', ['goog.dom.pattern.Repeat'], ['goog.dom.NodeType', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/sequence.js', ['goog.dom.pattern.Sequence'], ['goog.dom.NodeType', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/pattern/starttag.js', ['goog.dom.pattern.StartTag'], ['goog.dom.TagWalkType', 'goog.dom.pattern.Tag']);
goog.addDependency('dom/pattern/tag.js', ['goog.dom.pattern.Tag'], ['goog.dom.pattern', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType', 'goog.object']);
goog.addDependency('dom/pattern/text.js', ['goog.dom.pattern.Text'], ['goog.dom.NodeType', 'goog.dom.pattern', 'goog.dom.pattern.AbstractPattern', 'goog.dom.pattern.MatchType']);
goog.addDependency('dom/range.js', ['goog.dom.Range'], ['goog.dom', 'goog.dom.AbstractRange', 'goog.dom.ControlRange', 'goog.dom.MultiRange', 'goog.dom.NodeType', 'goog.dom.TextRange', 'goog.userAgent']);
goog.addDependency('dom/rangeendpoint.js', ['goog.dom.RangeEndpoint'], []);
goog.addDependency('dom/savedcaretrange.js', ['goog.dom.SavedCaretRange'], ['goog.array', 'goog.dom', 'goog.dom.SavedRange', 'goog.dom.TagName', 'goog.string']);
goog.addDependency('dom/savedrange.js', ['goog.dom.SavedRange'], ['goog.Disposable', 'goog.debug.Logger']);
goog.addDependency('dom/selection.js', ['goog.dom.selection'], ['goog.string', 'goog.userAgent']);
goog.addDependency('dom/tagiterator.js', ['goog.dom.TagIterator', 'goog.dom.TagWalkType'], ['goog.dom.NodeType', 'goog.iter.Iterator', 'goog.iter.StopIteration']);
goog.addDependency('dom/tagname.js', ['goog.dom.TagName'], []);
goog.addDependency('dom/textrange.js', ['goog.dom.TextRange'], ['goog.array', 'goog.dom', 'goog.dom.AbstractRange', 'goog.dom.RangeType', 'goog.dom.SavedRange', 'goog.dom.TagName', 'goog.dom.TextRangeIterator', 'goog.dom.browserrange', 'goog.string', 'goog.userAgent']);
goog.addDependency('dom/textrangeiterator.js', ['goog.dom.TextRangeIterator'], ['goog.array', 'goog.dom.NodeType', 'goog.dom.RangeIterator', 'goog.dom.TagName', 'goog.iter.StopIteration']);
goog.addDependency('dom/viewportsizemonitor.js', ['goog.dom.ViewportSizeMonitor'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.math.Size', 'goog.userAgent']);
goog.addDependency('dom/xml.js', ['goog.dom.xml'], ['goog.dom', 'goog.dom.NodeType']);
goog.addDependency('editor/browserfeature.js', ['goog.editor.BrowserFeature'], ['goog.editor.defines', 'goog.userAgent', 'goog.userAgent.product', 'goog.userAgent.product.isVersion']);
goog.addDependency('editor/clicktoeditwrapper.js', ['goog.editor.ClickToEditWrapper'], ['goog.Disposable', 'goog.asserts', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Field.EventType', 'goog.editor.node', 'goog.editor.range', 'goog.events.BrowserEvent.MouseButton', 'goog.events.EventHandler', 'goog.events.EventType']);
goog.addDependency('editor/command.js', ['goog.editor.Command'], []);
goog.addDependency('editor/defines.js', ['goog.editor.defines'], []);
goog.addDependency('editor/field.js', ['goog.editor.Field', 'goog.editor.Field.EventType'], ['goog.array', 'goog.async.Delay', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo', 'goog.editor.node', 'goog.editor.range', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.functions', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/focus.js', ['goog.editor.focus'], ['goog.dom.selection']);
goog.addDependency('editor/icontent.js', ['goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo'], ['goog.editor.BrowserFeature', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/link.js', ['goog.editor.Link'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.editor.node', 'goog.editor.range', 'goog.string.Unicode', 'goog.uri.utils']);
goog.addDependency('editor/node.js', ['goog.editor.node'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.iter.ChildIterator', 'goog.dom.iter.SiblingIterator', 'goog.iter', 'goog.object', 'goog.string', 'goog.string.Unicode']);
goog.addDependency('editor/plugin.js', ['goog.editor.Plugin'], ['goog.debug.Logger', 'goog.editor.Command', 'goog.events.EventTarget', 'goog.functions', 'goog.object', 'goog.reflect']);
goog.addDependency('editor/plugins/abstractbubbleplugin.js', ['goog.editor.plugins.AbstractBubblePlugin'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.Plugin', 'goog.editor.style', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.functions', 'goog.string.Unicode', 'goog.ui.Component.EventType', 'goog.ui.editor.Bubble', 'goog.userAgent']);
goog.addDependency('editor/plugins/abstractdialogplugin.js', ['goog.editor.plugins.AbstractDialogPlugin', 'goog.editor.plugins.AbstractDialogPlugin.EventType'], ['goog.dom', 'goog.dom.Range', 'goog.editor.Field.EventType', 'goog.editor.Plugin', 'goog.editor.range', 'goog.events', 'goog.ui.editor.AbstractDialog.EventType']);
goog.addDependency('editor/plugins/abstracttabhandler.js', ['goog.editor.plugins.AbstractTabHandler'], ['goog.editor.Plugin', 'goog.events.KeyCodes']);
goog.addDependency('editor/plugins/basictextformatter.js', ['goog.editor.plugins.BasicTextFormatter', 'goog.editor.plugins.BasicTextFormatter.COMMAND'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Link', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.range', 'goog.iter', 'goog.object', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.ui.editor.messages', 'goog.userAgent']);
goog.addDependency('editor/plugins/blockquote.js', ['goog.editor.plugins.Blockquote'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.node', 'goog.functions']);
goog.addDependency('editor/plugins/emoticons.js', ['goog.editor.plugins.Emoticons'], ['goog.dom.TagName', 'goog.editor.Plugin', 'goog.functions', 'goog.ui.emoji.Emoji']);
goog.addDependency('editor/plugins/enterhandler.js', ['goog.editor.plugins.EnterHandler'], ['goog.dom', 'goog.dom.AbstractRange', 'goog.dom.NodeOffset', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.plugins.Blockquote', 'goog.editor.range', 'goog.editor.style', 'goog.events.KeyCodes', 'goog.string', 'goog.userAgent']);
goog.addDependency('editor/plugins/headerformatter.js', ['goog.editor.plugins.HeaderFormatter'], ['goog.editor.Command', 'goog.editor.Plugin', 'goog.userAgent']);
goog.addDependency('editor/plugins/linkbubble.js', ['goog.editor.plugins.LinkBubble', 'goog.editor.plugins.LinkBubble.Action'], ['goog.array', 'goog.dom', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Link', 'goog.editor.plugins.AbstractBubblePlugin', 'goog.editor.range', 'goog.string', 'goog.style', 'goog.ui.editor.messages', 'goog.window']);
goog.addDependency('editor/plugins/linkdialogplugin.js', ['goog.editor.plugins.LinkDialogPlugin'], ['goog.editor.Command', 'goog.editor.plugins.AbstractDialogPlugin', 'goog.events.EventHandler', 'goog.functions', 'goog.ui.editor.AbstractDialog.EventType', 'goog.ui.editor.LinkDialog', 'goog.ui.editor.LinkDialog.OkEvent']);
goog.addDependency('editor/plugins/listtabhandler.js', ['goog.editor.plugins.ListTabHandler'], ['goog.dom.TagName', 'goog.editor.Command', 'goog.editor.plugins.AbstractTabHandler']);
goog.addDependency('editor/plugins/loremipsum.js', ['goog.editor.plugins.LoremIpsum'], ['goog.asserts', 'goog.dom', 'goog.editor.Command', 'goog.editor.Plugin', 'goog.editor.node', 'goog.functions']);
goog.addDependency('editor/plugins/removeformatting.js', ['goog.editor.plugins.RemoveFormatting'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Plugin', 'goog.editor.node', 'goog.editor.range', 'goog.string']);
goog.addDependency('editor/plugins/spacestabhandler.js', ['goog.editor.plugins.SpacesTabHandler'], ['goog.dom', 'goog.dom.TagName', 'goog.editor.plugins.AbstractTabHandler', 'goog.editor.range']);
goog.addDependency('editor/plugins/tableeditor.js', ['goog.editor.plugins.TableEditor'], ['goog.array', 'goog.dom', 'goog.dom.TagName', 'goog.editor.Plugin', 'goog.editor.Table', 'goog.editor.node', 'goog.editor.range', 'goog.object']);
goog.addDependency('editor/plugins/tagonenterhandler.js', ['goog.editor.plugins.TagOnEnterHandler'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.Command', 'goog.editor.node', 'goog.editor.plugins.EnterHandler', 'goog.editor.range', 'goog.editor.style', 'goog.events.KeyCodes', 'goog.string', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/plugins/undoredo.js', ['goog.editor.plugins.UndoRedo'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeOffset', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.editor.Command', 'goog.editor.Field.EventType', 'goog.editor.Plugin', 'goog.editor.plugins.UndoRedoManager', 'goog.editor.plugins.UndoRedoState', 'goog.events', 'goog.events.EventHandler']);
goog.addDependency('editor/plugins/undoredomanager.js', ['goog.editor.plugins.UndoRedoManager', 'goog.editor.plugins.UndoRedoManager.EventType'], ['goog.editor.plugins.UndoRedoState', 'goog.events.EventTarget']);
goog.addDependency('editor/plugins/undoredostate.js', ['goog.editor.plugins.UndoRedoState'], ['goog.events.EventTarget']);
goog.addDependency('editor/range.js', ['goog.editor.range', 'goog.editor.range.Point'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.Range', 'goog.dom.RangeEndpoint', 'goog.dom.SavedCaretRange', 'goog.editor.BrowserFeature', 'goog.editor.node', 'goog.editor.style', 'goog.iter']);
goog.addDependency('editor/seamlessfield.js', ['goog.editor.SeamlessField'], ['goog.cssom.iframe.style', 'goog.debug.Logger', 'goog.dom', 'goog.dom.Range', 'goog.dom.TagName', 'goog.editor.BrowserFeature', 'goog.editor.Field', 'goog.editor.Field.EventType', 'goog.editor.icontent', 'goog.editor.icontent.FieldFormatInfo', 'goog.editor.icontent.FieldStyleInfo', 'goog.editor.node', 'goog.events', 'goog.events.EventType', 'goog.style']);
goog.addDependency('editor/seamlessfield_test.js', ['goog.editor.seamlessfield_test'], ['goog.dom', 'goog.editor.BrowserFeature', 'goog.editor.SeamlessField', 'goog.events', 'goog.style', 'goog.testing.MockClock', 'goog.testing.MockRange', 'goog.testing.jsunit']);
goog.addDependency('editor/style.js', ['goog.editor.style'], ['goog.dom', 'goog.dom.NodeType', 'goog.editor.BrowserFeature', 'goog.events.EventType', 'goog.object', 'goog.style', 'goog.userAgent']);
goog.addDependency('editor/table.js', ['goog.editor.Table', 'goog.editor.TableCell', 'goog.editor.TableRow'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.string.Unicode', 'goog.style']);
goog.addDependency('events/actioneventwrapper.js', ['goog.events.actionEventWrapper'], ['goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.EventWrapper', 'goog.events.KeyCodes']);
goog.addDependency('events/actionhandler.js', ['goog.events.ActionEvent', 'goog.events.ActionHandler', 'goog.events.ActionHandler.EventType', 'goog.events.BeforeActionEvent'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/browserevent.js', ['goog.events.BrowserEvent', 'goog.events.BrowserEvent.MouseButton'], ['goog.events.BrowserFeature', 'goog.events.Event', 'goog.events.EventType', 'goog.reflect', 'goog.userAgent']);
goog.addDependency('events/browserfeature.js', ['goog.events.BrowserFeature'], ['goog.userAgent']);
goog.addDependency('events/event.js', ['goog.events.Event'], ['goog.Disposable']);
goog.addDependency('events/eventhandler.js', ['goog.events.EventHandler'], ['goog.Disposable', 'goog.events', 'goog.events.EventWrapper', 'goog.object', 'goog.structs.SimplePool']);
goog.addDependency('events/events.js', ['goog.events'], ['goog.array', 'goog.debug.entryPointRegistry', 'goog.debug.errorHandlerWeakDep', 'goog.events.BrowserEvent', 'goog.events.Event', 'goog.events.EventWrapper', 'goog.events.pools', 'goog.object', 'goog.userAgent']);
goog.addDependency('events/eventtarget.js', ['goog.events.EventTarget'], ['goog.Disposable', 'goog.events']);
goog.addDependency('events/eventtype.js', ['goog.events.EventType'], ['goog.userAgent']);
goog.addDependency('events/eventwrapper.js', ['goog.events.EventWrapper'], []);
goog.addDependency('events/filedrophandler.js', ['goog.events.FileDropHandler', 'goog.events.FileDropHandler.EventType'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency('events/focushandler.js', ['goog.events.FocusHandler', 'goog.events.FocusHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.userAgent']);
goog.addDependency('events/imehandler.js', ['goog.events.ImeHandler', 'goog.events.ImeHandler.Event', 'goog.events.ImeHandler.EventType'], ['goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent', 'goog.userAgent.product']);
goog.addDependency('events/inputhandler.js', ['goog.events.InputHandler', 'goog.events.InputHandler.EventType'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/keycodes.js', ['goog.events.KeyCodes'], ['goog.userAgent']);
goog.addDependency('events/keyhandler.js', ['goog.events.KeyEvent', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.userAgent']);
goog.addDependency('events/keynames.js', ['goog.events.KeyNames'], []);
goog.addDependency('events/listener.js', ['goog.events.Listener'], []);
goog.addDependency('events/mousewheelhandler.js', ['goog.events.MouseWheelEvent', 'goog.events.MouseWheelHandler', 'goog.events.MouseWheelHandler.EventType'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.EventTarget', 'goog.math', 'goog.userAgent']);
goog.addDependency('events/onlinehandler.js', ['goog.events.OnlineHandler', 'goog.events.OnlineHandler.EventType'], ['goog.Timer', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.userAgent']);
goog.addDependency('events/pastehandler.js', ['goog.events.PasteHandler', 'goog.events.PasteHandler.EventType', 'goog.events.PasteHandler.State'], ['goog.debug.Logger', 'goog.events.BrowserEvent', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes']);
goog.addDependency('events/pools.js', ['goog.events.pools'], ['goog.events.BrowserEvent', 'goog.events.Listener', 'goog.structs.SimplePool', 'goog.userAgent.jscript']);
goog.addDependency('format/emailaddress.js', ['goog.format.EmailAddress'], ['goog.string']);
goog.addDependency('format/format.js', ['goog.format'], ['goog.i18n.GraphemeBreak', 'goog.string', 'goog.userAgent']);
goog.addDependency('format/htmlprettyprinter.js', ['goog.format.HtmlPrettyPrinter', 'goog.format.HtmlPrettyPrinter.Buffer'], ['goog.object', 'goog.string.StringBuffer']);
goog.addDependency('format/jsonprettyprinter.js', ['goog.format.JsonPrettyPrinter', 'goog.format.JsonPrettyPrinter.HtmlDelimiters', 'goog.format.JsonPrettyPrinter.TextDelimiters'], ['goog.json', 'goog.json.Serializer', 'goog.string', 'goog.string.StringBuffer', 'goog.string.format']);
goog.addDependency('fs/entry.js', ['goog.fs.DirectoryEntry', 'goog.fs.DirectoryEntry.Behavior', 'goog.fs.Entry', 'goog.fs.FileEntry'], ['goog.async.Deferred', 'goog.fs.Error', 'goog.fs.FileWriter']);
goog.addDependency('fs/error.js', ['goog.fs.Error', 'goog.fs.Error.ErrorCode'], ['goog.debug.Error']);
goog.addDependency('fs/filesaver.js', ['goog.fs.FileSaver', 'goog.fs.FileSaver.EventType', 'goog.fs.FileSaver.ProgressEvent', 'goog.fs.FileSaver.ReadyState'], ['goog.events.Event', 'goog.events.EventTarget', 'goog.fs.Error']);
goog.addDependency('fs/filesystem.js', ['goog.fs.FileSystem'], ['goog.fs.DirectoryEntry']);
goog.addDependency('fs/filewriter.js', ['goog.fs.FileWriter'], ['goog.fs.FileSaver']);
goog.addDependency('fs/fs.js', ['goog.fs'], ['goog.async.Deferred', 'goog.events', 'goog.fs.Error', 'goog.fs.FileSystem']);
goog.addDependency('functions/functions.js', ['goog.functions'], []);
goog.addDependency('fx/abstractdragdrop.js', ['goog.fx.AbstractDragDrop', 'goog.fx.DragDropEvent', 'goog.fx.DragDropItem'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Box', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/animation.js', ['goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.fx.Animation.State', 'goog.fx.AnimationEvent'], ['goog.Timer', 'goog.array', 'goog.events.Event', 'goog.events.EventTarget', 'goog.object']);
goog.addDependency('fx/animationqueue.js', ['goog.fx.AnimationParallelQueue', 'goog.fx.AnimationQueue', 'goog.fx.AnimationSerialQueue'], ['goog.array', 'goog.events.EventHandler', 'goog.fx.Animation', 'goog.fx.Animation.EventType']);
goog.addDependency('fx/cssspriteanimation.js', ['goog.fx.CssSpriteAnimation'], ['goog.fx.Animation']);
goog.addDependency('fx/dom.js', ['goog.fx.dom', 'goog.fx.dom.BgColorTransform', 'goog.fx.dom.ColorTransform', 'goog.fx.dom.Fade', 'goog.fx.dom.FadeIn', 'goog.fx.dom.FadeInAndShow', 'goog.fx.dom.FadeOut', 'goog.fx.dom.FadeOutAndHide', 'goog.fx.dom.PredefinedEffect', 'goog.fx.dom.Resize', 'goog.fx.dom.ResizeHeight', 'goog.fx.dom.ResizeWidth', 'goog.fx.dom.Scroll', 'goog.fx.dom.Slide', 'goog.fx.dom.SlideFrom', 'goog.fx.dom.Swipe'], ['goog.color', 'goog.events', 'goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.style']);
goog.addDependency('fx/dragdrop.js', ['goog.fx.DragDrop'], ['goog.fx.AbstractDragDrop', 'goog.fx.DragDropItem']);
goog.addDependency('fx/dragdropgroup.js', ['goog.fx.DragDropGroup'], ['goog.dom', 'goog.fx.AbstractDragDrop', 'goog.fx.DragDropItem']);
goog.addDependency('fx/dragger.js', ['goog.fx.DragEvent', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType'], ['goog.dom', 'goog.events', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.math.Rect', 'goog.userAgent']);
goog.addDependency('fx/draglistgroup.js', ['goog.fx.DragListDirection', 'goog.fx.DragListGroup', 'goog.fx.DragListGroup.EventType', 'goog.fx.DragListGroupEvent'], ['goog.dom', 'goog.dom.NodeType', 'goog.dom.classes', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/dragscrollsupport.js', ['goog.fx.DragScrollSupport'], ['goog.Disposable', 'goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.style']);
goog.addDependency('fx/easing.js', ['goog.fx.easing'], []);
goog.addDependency('fx/fx.js', ['goog.fx'], ['goog.asserts', 'goog.fx.Animation', 'goog.fx.Animation.EventType', 'goog.fx.Animation.State', 'goog.fx.AnimationEvent', 'goog.fx.easing']);
goog.addDependency('gears/basestore.js', ['goog.gears.BaseStore', 'goog.gears.BaseStore.SchemaType'], ['goog.Disposable']);
goog.addDependency('gears/database.js', ['goog.gears.Database', 'goog.gears.Database.EventType', 'goog.gears.Database.TransactionEvent'], ['goog.array', 'goog.debug', 'goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.json']);
goog.addDependency('gears/fakeworkerpool.js', ['goog.gears.FakeWorkerPool'], ['goog.Uri', 'goog.gears', 'goog.gears.WorkerPool', 'goog.net.XmlHttp']);
goog.addDependency('gears/gears.js', ['goog.gears'], ['goog.string']);
goog.addDependency('gears/httprequest.js', ['goog.gears.HttpRequest'], ['goog.Timer', 'goog.gears', 'goog.net.XmlHttp']);
goog.addDependency('gears/loggerclient.js', ['goog.gears.LoggerClient'], ['goog.Disposable', 'goog.debug', 'goog.debug.Logger']);
goog.addDependency('gears/loggerserver.js', ['goog.gears.LoggerServer'], ['goog.Disposable', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.gears.Worker.EventType']);
goog.addDependency('gears/logstore.js', ['goog.gears.LogStore', 'goog.gears.LogStore.Query'], ['goog.async.Delay', 'goog.debug.LogManager', 'goog.debug.LogRecord', 'goog.debug.Logger', 'goog.debug.Logger.Level', 'goog.gears.BaseStore', 'goog.gears.BaseStore.SchemaType', 'goog.json']);
goog.addDependency('gears/managedresourcestore.js', ['goog.gears.ManagedResourceStore', 'goog.gears.ManagedResourceStore.EventType', 'goog.gears.ManagedResourceStore.UpdateStatus', 'goog.gears.ManagedResourceStoreEvent'], ['goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.string']);
goog.addDependency('gears/multipartformdata.js', ['goog.gears.MultipartFormData'], ['goog.asserts', 'goog.gears', 'goog.string']);
goog.addDependency('gears/statustype.js', ['goog.gears.StatusType'], []);
goog.addDependency('gears/urlcapture.js', ['goog.gears.UrlCapture', 'goog.gears.UrlCapture.Event', 'goog.gears.UrlCapture.EventType'], ['goog.Uri', 'goog.debug.Logger', 'goog.events.Event', 'goog.events.EventTarget', 'goog.gears']);
goog.addDependency('gears/worker.js', ['goog.gears.Worker', 'goog.gears.Worker.EventType', 'goog.gears.WorkerEvent'], ['goog.events.Event', 'goog.events.EventTarget']);
goog.addDependency('gears/workerchannel.js', ['goog.gears.WorkerChannel'], ['goog.Disposable', 'goog.debug', 'goog.debug.Logger', 'goog.events', 'goog.gears.Worker', 'goog.gears.Worker.EventType', 'goog.gears.WorkerEvent', 'goog.json', 'goog.messaging.AbstractChannel']);
goog.addDependency('gears/workerpool.js', ['goog.gears.WorkerPool', 'goog.gears.WorkerPool.Event', 'goog.gears.WorkerPool.EventType'], ['goog.events.Event', 'goog.events.EventTarget', 'goog.gears', 'goog.gears.Worker']);
goog.addDependency('graphics/abstractgraphics.js', ['goog.graphics.AbstractGraphics'], ['goog.graphics.Path', 'goog.math.Coordinate', 'goog.math.Size', 'goog.style', 'goog.ui.Component']);
goog.addDependency('graphics/affinetransform.js', ['goog.graphics.AffineTransform'], ['goog.math']);
goog.addDependency('graphics/canvaselement.js', ['goog.graphics.CanvasEllipseElement', 'goog.graphics.CanvasGroupElement', 'goog.graphics.CanvasImageElement', 'goog.graphics.CanvasPathElement', 'goog.graphics.CanvasRectElement', 'goog.graphics.CanvasTextElement'], ['goog.array', 'goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.Path', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/canvasgraphics.js', ['goog.graphics.CanvasGraphics'], ['goog.dom', 'goog.events.EventType', 'goog.graphics.AbstractGraphics', 'goog.graphics.CanvasEllipseElement', 'goog.graphics.CanvasGroupElement', 'goog.graphics.CanvasImageElement', 'goog.graphics.CanvasPathElement', 'goog.graphics.CanvasRectElement', 'goog.graphics.CanvasTextElement', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.math.Size']);
goog.addDependency('graphics/element.js', ['goog.graphics.Element'], ['goog.events', 'goog.events.EventTarget', 'goog.graphics.AffineTransform', 'goog.math']);
goog.addDependency('graphics/ellipseelement.js', ['goog.graphics.EllipseElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/ext/coordinates.js', ['goog.graphics.ext.coordinates'], []);
goog.addDependency('graphics/ext/element.js', ['goog.graphics.ext.Element'], ['goog.events', 'goog.events.EventTarget', 'goog.functions', 'goog.graphics', 'goog.graphics.ext.coordinates']);
goog.addDependency('graphics/ext/ellipse.js', ['goog.graphics.ext.Ellipse'], ['goog.graphics.ext.StrokeAndFillElement']);
goog.addDependency('graphics/ext/ext.js', ['goog.graphics.ext'], ['goog.graphics.ext.Ellipse', 'goog.graphics.ext.Graphics', 'goog.graphics.ext.Group', 'goog.graphics.ext.Image', 'goog.graphics.ext.Rectangle', 'goog.graphics.ext.Shape', 'goog.graphics.ext.coordinates']);
goog.addDependency('graphics/ext/graphics.js', ['goog.graphics.ext.Graphics'], ['goog.events.EventType', 'goog.graphics.ext.Group']);
goog.addDependency('graphics/ext/group.js', ['goog.graphics.ext.Group'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/ext/image.js', ['goog.graphics.ext.Image'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/ext/path.js', ['goog.graphics.ext.Path'], ['goog.graphics.AffineTransform', 'goog.graphics.Path', 'goog.math', 'goog.math.Rect']);
goog.addDependency('graphics/ext/rectangle.js', ['goog.graphics.ext.Rectangle'], ['goog.graphics.ext.StrokeAndFillElement']);
goog.addDependency('graphics/ext/shape.js', ['goog.graphics.ext.Shape'], ['goog.graphics.ext.Path', 'goog.graphics.ext.StrokeAndFillElement', 'goog.math.Rect']);
goog.addDependency('graphics/ext/strokeandfillelement.js', ['goog.graphics.ext.StrokeAndFillElement'], ['goog.graphics.ext.Element']);
goog.addDependency('graphics/fill.js', ['goog.graphics.Fill'], []);
goog.addDependency('graphics/font.js', ['goog.graphics.Font'], []);
goog.addDependency('graphics/graphics.js', ['goog.graphics'], ['goog.graphics.CanvasGraphics', 'goog.graphics.SvgGraphics', 'goog.graphics.VmlGraphics', 'goog.userAgent']);
goog.addDependency('graphics/groupelement.js', ['goog.graphics.GroupElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/imageelement.js', ['goog.graphics.ImageElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/lineargradient.js', ['goog.graphics.LinearGradient'], ['goog.graphics.Fill']);
goog.addDependency('graphics/path.js', ['goog.graphics.Path', 'goog.graphics.Path.Segment'], ['goog.array', 'goog.math']);
goog.addDependency('graphics/pathelement.js', ['goog.graphics.PathElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/paths.js', ['goog.graphics.paths'], ['goog.graphics.Path', 'goog.math.Coordinate']);
goog.addDependency('graphics/rectelement.js', ['goog.graphics.RectElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/solidfill.js', ['goog.graphics.SolidFill'], ['goog.graphics.Fill']);
goog.addDependency('graphics/stroke.js', ['goog.graphics.Stroke'], []);
goog.addDependency('graphics/strokeandfillelement.js', ['goog.graphics.StrokeAndFillElement'], ['goog.graphics.Element']);
goog.addDependency('graphics/svgelement.js', ['goog.graphics.SvgEllipseElement', 'goog.graphics.SvgGroupElement', 'goog.graphics.SvgImageElement', 'goog.graphics.SvgPathElement', 'goog.graphics.SvgRectElement', 'goog.graphics.SvgTextElement'], ['goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/svggraphics.js', ['goog.graphics.SvgGraphics'], ['goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.graphics.AbstractGraphics', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.SvgEllipseElement', 'goog.graphics.SvgGroupElement', 'goog.graphics.SvgImageElement', 'goog.graphics.SvgPathElement', 'goog.graphics.SvgRectElement', 'goog.graphics.SvgTextElement', 'goog.math.Size', 'goog.userAgent']);
goog.addDependency('graphics/textelement.js', ['goog.graphics.TextElement'], ['goog.graphics.StrokeAndFillElement']);
goog.addDependency('graphics/vmlelement.js', ['goog.graphics.VmlEllipseElement', 'goog.graphics.VmlGroupElement', 'goog.graphics.VmlImageElement', 'goog.graphics.VmlPathElement', 'goog.graphics.VmlRectElement', 'goog.graphics.VmlTextElement'], ['goog.dom', 'goog.graphics.EllipseElement', 'goog.graphics.GroupElement', 'goog.graphics.ImageElement', 'goog.graphics.PathElement', 'goog.graphics.RectElement', 'goog.graphics.TextElement']);
goog.addDependency('graphics/vmlgraphics.js', ['goog.graphics.VmlGraphics'], ['goog.array', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.graphics.AbstractGraphics', 'goog.graphics.Font', 'goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.VmlEllipseElement', 'goog.graphics.VmlGroupElement', 'goog.graphics.VmlImageElement', 'goog.graphics.VmlPathElement', 'goog.graphics.VmlRectElement', 'goog.graphics.VmlTextElement', 'goog.math.Size', 'goog.string']);
goog.addDependency('history/event.js', ['goog.history.Event'], ['goog.events.Event', 'goog.history.EventType']);
goog.addDependency('history/eventtype.js', ['goog.history.EventType'], []);
goog.addDependency('history/history.js', ['goog.History', 'goog.History.Event', 'goog.History.EventType'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.BrowserEvent', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.history.Event', 'goog.history.EventType', 'goog.string', 'goog.userAgent']);
goog.addDependency('history/html5history.js', ['goog.history.Html5History', 'goog.history.Html5History.TokenTransformer'], ['goog.asserts', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.history.Event', 'goog.history.EventType']);
goog.addDependency('i18n/bidi.js', ['goog.i18n.bidi'], []);
goog.addDependency('i18n/bidiformatter.js', ['goog.i18n.BidiFormatter'], ['goog.i18n.bidi', 'goog.string']);
goog.addDependency('i18n/charlistdecompressor.js', ['goog.i18n.CharListDecompressor'], ['goog.array', 'goog.i18n.uChar']);
goog.addDependency('i18n/charpickerdata.js', ['goog.i18n.CharPickerData'], []);
goog.addDependency('i18n/currency.js', ['goog.i18n.currency'], []);
goog.addDependency('i18n/currencycodemap.js', ['goog.i18n.currencyCodeMap'], []);
goog.addDependency('i18n/datetimeformat.js', ['goog.i18n.DateTimeFormat', 'goog.i18n.DateTimeFormat.Format'], ['goog.asserts', 'goog.date.DateLike', 'goog.i18n.DateTimeSymbols', 'goog.i18n.TimeZone', 'goog.string']);
goog.addDependency('i18n/datetimeparse.js', ['goog.i18n.DateTimeParse'], ['goog.date.DateLike', 'goog.i18n.DateTimeFormat', 'goog.i18n.DateTimeSymbols']);
goog.addDependency('i18n/datetimepatterns.js', ['goog.i18n.DateTimePatterns', 'goog.i18n.DateTimePatterns_am', 'goog.i18n.DateTimePatterns_ar', 'goog.i18n.DateTimePatterns_bg', 'goog.i18n.DateTimePatterns_bn', 'goog.i18n.DateTimePatterns_ca', 'goog.i18n.DateTimePatterns_cs', 'goog.i18n.DateTimePatterns_da', 'goog.i18n.DateTimePatterns_de', 'goog.i18n.DateTimePatterns_de_AT', 'goog.i18n.DateTimePatterns_de_CH', 'goog.i18n.DateTimePatterns_el', 'goog.i18n.DateTimePatterns_en', 'goog.i18n.DateTimePatterns_en_AU', 'goog.i18n.DateTimePatterns_en_GB', 'goog.i18n.DateTimePatterns_en_IE', 'goog.i18n.DateTimePatterns_en_IN', 'goog.i18n.DateTimePatterns_en_SG', 'goog.i18n.DateTimePatterns_en_US', 'goog.i18n.DateTimePatterns_en_ZA', 'goog.i18n.DateTimePatterns_es', 'goog.i18n.DateTimePatterns_et', 'goog.i18n.DateTimePatterns_eu', 'goog.i18n.DateTimePatterns_fa', 'goog.i18n.DateTimePatterns_fi', 'goog.i18n.DateTimePatterns_fil', 'goog.i18n.DateTimePatterns_fr', 'goog.i18n.DateTimePatterns_fr_CA', 'goog.i18n.DateTimePatterns_gl', 'goog.i18n.DateTimePatterns_gsw', 'goog.i18n.DateTimePatterns_gu', 'goog.i18n.DateTimePatterns_he', 'goog.i18n.DateTimePatterns_hi', 'goog.i18n.DateTimePatterns_hr', 'goog.i18n.DateTimePatterns_hu', 'goog.i18n.DateTimePatterns_id', 'goog.i18n.DateTimePatterns_is', 'goog.i18n.DateTimePatterns_it', 'goog.i18n.DateTimePatterns_ja', 'goog.i18n.DateTimePatterns_kn', 'goog.i18n.DateTimePatterns_ko', 'goog.i18n.DateTimePatterns_lt', 'goog.i18n.DateTimePatterns_lv', 'goog.i18n.DateTimePatterns_ml', 'goog.i18n.DateTimePatterns_mr', 'goog.i18n.DateTimePatterns_ms', 'goog.i18n.DateTimePatterns_mt', 'goog.i18n.DateTimePatterns_nl', 'goog.i18n.DateTimePatterns_or', 'goog.i18n.DateTimePatterns_pl', 'goog.i18n.DateTimePatterns_pt', 'goog.i18n.DateTimePatterns_pt_BR', 'goog.i18n.DateTimePatterns_pt_PT', 'goog.i18n.DateTimePatterns_ro', 'goog.i18n.DateTimePatterns_ru', 'goog.i18n.DateTimePatterns_sk', 'goog.i18n.DateTimePatterns_sl', 'goog.i18n.DateTimePatterns_sq', 'goog.i18n.DateTimePatterns_sr', 'goog.i18n.DateTimePatterns_sv', 'goog.i18n.DateTimePatterns_sw', 'goog.i18n.DateTimePatterns_ta', 'goog.i18n.DateTimePatterns_te', 'goog.i18n.DateTimePatterns_th', 'goog.i18n.DateTimePatterns_tr', 'goog.i18n.DateTimePatterns_uk', 'goog.i18n.DateTimePatterns_ur', 'goog.i18n.DateTimePatterns_vi', 'goog.i18n.DateTimePatterns_zh'], []);
goog.addDependency('i18n/datetimepatternsext.js', ['goog.i18n.DateTimePatternsExt', 'goog.i18n.DateTimePatterns_af', 'goog.i18n.DateTimePatterns_af_NA', 'goog.i18n.DateTimePatterns_af_ZA', 'goog.i18n.DateTimePatterns_ak', 'goog.i18n.DateTimePatterns_ak_GH', 'goog.i18n.DateTimePatterns_am_ET', 'goog.i18n.DateTimePatterns_ar_AE', 'goog.i18n.DateTimePatterns_ar_BH', 'goog.i18n.DateTimePatterns_ar_DZ', 'goog.i18n.DateTimePatterns_ar_EG', 'goog.i18n.DateTimePatterns_ar_IQ', 'goog.i18n.DateTimePatterns_ar_JO', 'goog.i18n.DateTimePatterns_ar_KW', 'goog.i18n.DateTimePatterns_ar_LB', 'goog.i18n.DateTimePatterns_ar_LY', 'goog.i18n.DateTimePatterns_ar_MA', 'goog.i18n.DateTimePatterns_ar_OM', 'goog.i18n.DateTimePatterns_ar_QA', 'goog.i18n.DateTimePatterns_ar_SA', 'goog.i18n.DateTimePatterns_ar_SD', 'goog.i18n.DateTimePatterns_ar_SY', 'goog.i18n.DateTimePatterns_ar_TN', 'goog.i18n.DateTimePatterns_ar_YE', 'goog.i18n.DateTimePatterns_as', 'goog.i18n.DateTimePatterns_as_IN', 'goog.i18n.DateTimePatterns_asa', 'goog.i18n.DateTimePatterns_asa_TZ', 'goog.i18n.DateTimePatterns_az', 'goog.i18n.DateTimePatterns_az_Cyrl', 'goog.i18n.DateTimePatterns_az_Cyrl_AZ', 'goog.i18n.DateTimePatterns_az_Latn', 'goog.i18n.DateTimePatterns_az_Latn_AZ', 'goog.i18n.DateTimePatterns_be', 'goog.i18n.DateTimePatterns_be_BY', 'goog.i18n.DateTimePatterns_bem', 'goog.i18n.DateTimePatterns_bem_ZM', 'goog.i18n.DateTimePatterns_bez', 'goog.i18n.DateTimePatterns_bez_TZ', 'goog.i18n.DateTimePatterns_bg_BG', 'goog.i18n.DateTimePatterns_bm', 'goog.i18n.DateTimePatterns_bm_ML', 'goog.i18n.DateTimePatterns_bn_BD', 'goog.i18n.DateTimePatterns_bn_IN', 'goog.i18n.DateTimePatterns_bo', 'goog.i18n.DateTimePatterns_bo_CN', 'goog.i18n.DateTimePatterns_bo_IN', 'goog.i18n.DateTimePatterns_ca_ES', 'goog.i18n.DateTimePatterns_cgg', 'goog.i18n.DateTimePatterns_cgg_UG', 'goog.i18n.DateTimePatterns_chr', 'goog.i18n.DateTimePatterns_chr_US', 'goog.i18n.DateTimePatterns_cs_CZ', 'goog.i18n.DateTimePatterns_cy', 'goog.i18n.DateTimePatterns_cy_GB', 'goog.i18n.DateTimePatterns_da_DK', 'goog.i18n.DateTimePatterns_dav', 'goog.i18n.DateTimePatterns_dav_KE', 'goog.i18n.DateTimePatterns_de_BE', 'goog.i18n.DateTimePatterns_de_DE', 'goog.i18n.DateTimePatterns_de_LI', 'goog.i18n.DateTimePatterns_de_LU', 'goog.i18n.DateTimePatterns_ebu', 'goog.i18n.DateTimePatterns_ebu_KE', 'goog.i18n.DateTimePatterns_ee', 'goog.i18n.DateTimePatterns_ee_GH', 'goog.i18n.DateTimePatterns_ee_TG', 'goog.i18n.DateTimePatterns_el_CY', 'goog.i18n.DateTimePatterns_el_GR', 'goog.i18n.DateTimePatterns_en_BE', 'goog.i18n.DateTimePatterns_en_BW', 'goog.i18n.DateTimePatterns_en_BZ', 'goog.i18n.DateTimePatterns_en_CA', 'goog.i18n.DateTimePatterns_en_HK', 'goog.i18n.DateTimePatterns_en_JM', 'goog.i18n.DateTimePatterns_en_MH', 'goog.i18n.DateTimePatterns_en_MT', 'goog.i18n.DateTimePatterns_en_MU', 'goog.i18n.DateTimePatterns_en_NA', 'goog.i18n.DateTimePatterns_en_NZ', 'goog.i18n.DateTimePatterns_en_PH', 'goog.i18n.DateTimePatterns_en_PK', 'goog.i18n.DateTimePatterns_en_TT', 'goog.i18n.DateTimePatterns_en_US_POSIX', 'goog.i18n.DateTimePatterns_en_VI', 'goog.i18n.DateTimePatterns_en_ZW', 'goog.i18n.DateTimePatterns_eo', 'goog.i18n.DateTimePatterns_es_AR', 'goog.i18n.DateTimePatterns_es_BO', 'goog.i18n.DateTimePatterns_es_CL', 'goog.i18n.DateTimePatterns_es_CO', 'goog.i18n.DateTimePatterns_es_CR', 'goog.i18n.DateTimePatterns_es_DO', 'goog.i18n.DateTimePatterns_es_EC', 'goog.i18n.DateTimePatterns_es_ES', 'goog.i18n.DateTimePatterns_es_GQ', 'goog.i18n.DateTimePatterns_es_GT', 'goog.i18n.DateTimePatterns_es_HN', 'goog.i18n.DateTimePatterns_es_MX', 'goog.i18n.DateTimePatterns_es_NI', 'goog.i18n.DateTimePatterns_es_PA', 'goog.i18n.DateTimePatterns_es_PE', 'goog.i18n.DateTimePatterns_es_PR', 'goog.i18n.DateTimePatterns_es_PY', 'goog.i18n.DateTimePatterns_es_SV', 'goog.i18n.DateTimePatterns_es_US', 'goog.i18n.DateTimePatterns_es_UY', 'goog.i18n.DateTimePatterns_es_VE', 'goog.i18n.DateTimePatterns_et_EE', 'goog.i18n.DateTimePatterns_eu_ES', 'goog.i18n.DateTimePatterns_fa_AF', 'goog.i18n.DateTimePatterns_fa_IR', 'goog.i18n.DateTimePatterns_ff', 'goog.i18n.DateTimePatterns_ff_SN', 'goog.i18n.DateTimePatterns_fi_FI', 'goog.i18n.DateTimePatterns_fil_PH', 'goog.i18n.DateTimePatterns_fo', 'goog.i18n.DateTimePatterns_fo_FO', 'goog.i18n.DateTimePatterns_fr_BE', 'goog.i18n.DateTimePatterns_fr_BL', 'goog.i18n.DateTimePatterns_fr_CF', 'goog.i18n.DateTimePatterns_fr_CH', 'goog.i18n.DateTimePatterns_fr_CI', 'goog.i18n.DateTimePatterns_fr_CM', 'goog.i18n.DateTimePatterns_fr_FR', 'goog.i18n.DateTimePatterns_fr_GN', 'goog.i18n.DateTimePatterns_fr_GP', 'goog.i18n.DateTimePatterns_fr_LU', 'goog.i18n.DateTimePatterns_fr_MC', 'goog.i18n.DateTimePatterns_fr_MF', 'goog.i18n.DateTimePatterns_fr_MG', 'goog.i18n.DateTimePatterns_fr_ML', 'goog.i18n.DateTimePatterns_fr_MQ', 'goog.i18n.DateTimePatterns_fr_NE', 'goog.i18n.DateTimePatterns_fr_RE', 'goog.i18n.DateTimePatterns_fr_SN', 'goog.i18n.DateTimePatterns_ga', 'goog.i18n.DateTimePatterns_ga_IE', 'goog.i18n.DateTimePatterns_gl_ES', 'goog.i18n.DateTimePatterns_gsw_CH', 'goog.i18n.DateTimePatterns_gu_IN', 'goog.i18n.DateTimePatterns_guz', 'goog.i18n.DateTimePatterns_guz_KE', 'goog.i18n.DateTimePatterns_gv', 'goog.i18n.DateTimePatterns_gv_GB', 'goog.i18n.DateTimePatterns_ha', 'goog.i18n.DateTimePatterns_ha_Latn', 'goog.i18n.DateTimePatterns_ha_Latn_GH', 'goog.i18n.DateTimePatterns_ha_Latn_NE', 'goog.i18n.DateTimePatterns_ha_Latn_NG', 'goog.i18n.DateTimePatterns_haw', 'goog.i18n.DateTimePatterns_haw_US', 'goog.i18n.DateTimePatterns_he_IL', 'goog.i18n.DateTimePatterns_hi_IN', 'goog.i18n.DateTimePatterns_hr_HR', 'goog.i18n.DateTimePatterns_hu_HU', 'goog.i18n.DateTimePatterns_hy', 'goog.i18n.DateTimePatterns_hy_AM', 'goog.i18n.DateTimePatterns_id_ID', 'goog.i18n.DateTimePatterns_ig', 'goog.i18n.DateTimePatterns_ig_NG', 'goog.i18n.DateTimePatterns_ii', 'goog.i18n.DateTimePatterns_ii_CN', 'goog.i18n.DateTimePatterns_is_IS', 'goog.i18n.DateTimePatterns_it_CH', 'goog.i18n.DateTimePatterns_it_IT', 'goog.i18n.DateTimePatterns_ja_JP', 'goog.i18n.DateTimePatterns_jmc', 'goog.i18n.DateTimePatterns_jmc_TZ', 'goog.i18n.DateTimePatterns_ka', 'goog.i18n.DateTimePatterns_ka_GE', 'goog.i18n.DateTimePatterns_kab', 'goog.i18n.DateTimePatterns_kab_DZ', 'goog.i18n.DateTimePatterns_kam', 'goog.i18n.DateTimePatterns_kam_KE', 'goog.i18n.DateTimePatterns_kde', 'goog.i18n.DateTimePatterns_kde_TZ', 'goog.i18n.DateTimePatterns_kea', 'goog.i18n.DateTimePatterns_kea_CV', 'goog.i18n.DateTimePatterns_khq', 'goog.i18n.DateTimePatterns_khq_ML', 'goog.i18n.DateTimePatterns_ki', 'goog.i18n.DateTimePatterns_ki_KE', 'goog.i18n.DateTimePatterns_kk', 'goog.i18n.DateTimePatterns_kk_Cyrl', 'goog.i18n.DateTimePatterns_kk_Cyrl_KZ', 'goog.i18n.DateTimePatterns_kl', 'goog.i18n.DateTimePatterns_kl_GL', 'goog.i18n.DateTimePatterns_kln', 'goog.i18n.DateTimePatterns_kln_KE', 'goog.i18n.DateTimePatterns_km', 'goog.i18n.DateTimePatterns_km_KH', 'goog.i18n.DateTimePatterns_kn_IN', 'goog.i18n.DateTimePatterns_ko_KR', 'goog.i18n.DateTimePatterns_kok', 'goog.i18n.DateTimePatterns_kok_IN', 'goog.i18n.DateTimePatterns_kw', 'goog.i18n.DateTimePatterns_kw_GB', 'goog.i18n.DateTimePatterns_lag', 'goog.i18n.DateTimePatterns_lag_TZ', 'goog.i18n.DateTimePatterns_lg', 'goog.i18n.DateTimePatterns_lg_UG', 'goog.i18n.DateTimePatterns_lt_LT', 'goog.i18n.DateTimePatterns_luo', 'goog.i18n.DateTimePatterns_luo_KE', 'goog.i18n.DateTimePatterns_luy', 'goog.i18n.DateTimePatterns_luy_KE', 'goog.i18n.DateTimePatterns_lv_LV', 'goog.i18n.DateTimePatterns_mas', 'goog.i18n.DateTimePatterns_mas_KE', 'goog.i18n.DateTimePatterns_mas_TZ', 'goog.i18n.DateTimePatterns_mer', 'goog.i18n.DateTimePatterns_mer_KE', 'goog.i18n.DateTimePatterns_mfe', 'goog.i18n.DateTimePatterns_mfe_MU', 'goog.i18n.DateTimePatterns_mg', 'goog.i18n.DateTimePatterns_mg_MG', 'goog.i18n.DateTimePatterns_mk', 'goog.i18n.DateTimePatterns_mk_MK', 'goog.i18n.DateTimePatterns_ml_IN', 'goog.i18n.DateTimePatterns_mr_IN', 'goog.i18n.DateTimePatterns_ms_BN', 'goog.i18n.DateTimePatterns_ms_MY', 'goog.i18n.DateTimePatterns_mt_MT', 'goog.i18n.DateTimePatterns_naq', 'goog.i18n.DateTimePatterns_naq_NA', 'goog.i18n.DateTimePatterns_nb', 'goog.i18n.DateTimePatterns_nb_NO', 'goog.i18n.DateTimePatterns_nd', 'goog.i18n.DateTimePatterns_nd_ZW', 'goog.i18n.DateTimePatterns_ne', 'goog.i18n.DateTimePatterns_ne_IN', 'goog.i18n.DateTimePatterns_ne_NP', 'goog.i18n.DateTimePatterns_nl_BE', 'goog.i18n.DateTimePatterns_nl_NL', 'goog.i18n.DateTimePatterns_nn', 'goog.i18n.DateTimePatterns_nn_NO', 'goog.i18n.DateTimePatterns_nyn', 'goog.i18n.DateTimePatterns_nyn_UG', 'goog.i18n.DateTimePatterns_om', 'goog.i18n.DateTimePatterns_om_ET', 'goog.i18n.DateTimePatterns_om_KE', 'goog.i18n.DateTimePatterns_or_IN', 'goog.i18n.DateTimePatterns_pa', 'goog.i18n.DateTimePatterns_pa_Arab', 'goog.i18n.DateTimePatterns_pa_Arab_PK', 'goog.i18n.DateTimePatterns_pa_Guru', 'goog.i18n.DateTimePatterns_pa_Guru_IN', 'goog.i18n.DateTimePatterns_pl_PL', 'goog.i18n.DateTimePatterns_ps', 'goog.i18n.DateTimePatterns_ps_AF', 'goog.i18n.DateTimePatterns_pt_GW', 'goog.i18n.DateTimePatterns_pt_MZ', 'goog.i18n.DateTimePatterns_rm', 'goog.i18n.DateTimePatterns_rm_CH', 'goog.i18n.DateTimePatterns_ro_MD', 'goog.i18n.DateTimePatterns_ro_RO', 'goog.i18n.DateTimePatterns_rof', 'goog.i18n.DateTimePatterns_rof_TZ', 'goog.i18n.DateTimePatterns_ru_MD', 'goog.i18n.DateTimePatterns_ru_RU', 'goog.i18n.DateTimePatterns_ru_UA', 'goog.i18n.DateTimePatterns_rw', 'goog.i18n.DateTimePatterns_rw_RW', 'goog.i18n.DateTimePatterns_rwk', 'goog.i18n.DateTimePatterns_rwk_TZ', 'goog.i18n.DateTimePatterns_saq', 'goog.i18n.DateTimePatterns_saq_KE', 'goog.i18n.DateTimePatterns_seh', 'goog.i18n.DateTimePatterns_seh_MZ', 'goog.i18n.DateTimePatterns_ses', 'goog.i18n.DateTimePatterns_ses_ML', 'goog.i18n.DateTimePatterns_sg', 'goog.i18n.DateTimePatterns_sg_CF', 'goog.i18n.DateTimePatterns_shi', 'goog.i18n.DateTimePatterns_shi_Latn', 'goog.i18n.DateTimePatterns_shi_Latn_MA', 'goog.i18n.DateTimePatterns_shi_Tfng', 'goog.i18n.DateTimePatterns_shi_Tfng_MA', 'goog.i18n.DateTimePatterns_si', 'goog.i18n.DateTimePatterns_si_LK', 'goog.i18n.DateTimePatterns_sk_SK', 'goog.i18n.DateTimePatterns_sl_SI', 'goog.i18n.DateTimePatterns_sn', 'goog.i18n.DateTimePatterns_sn_ZW', 'goog.i18n.DateTimePatterns_so', 'goog.i18n.DateTimePatterns_so_DJ', 'goog.i18n.DateTimePatterns_so_ET', 'goog.i18n.DateTimePatterns_so_KE', 'goog.i18n.DateTimePatterns_so_SO', 'goog.i18n.DateTimePatterns_sq_AL', 'goog.i18n.DateTimePatterns_sr_Cyrl', 'goog.i18n.DateTimePatterns_sr_Cyrl_BA', 'goog.i18n.DateTimePatterns_sr_Cyrl_ME', 'goog.i18n.DateTimePatterns_sr_Cyrl_RS', 'goog.i18n.DateTimePatterns_sr_Latn', 'goog.i18n.DateTimePatterns_sr_Latn_BA', 'goog.i18n.DateTimePatterns_sr_Latn_ME', 'goog.i18n.DateTimePatterns_sr_Latn_RS', 'goog.i18n.DateTimePatterns_sv_FI', 'goog.i18n.DateTimePatterns_sv_SE', 'goog.i18n.DateTimePatterns_sw_KE', 'goog.i18n.DateTimePatterns_sw_TZ', 'goog.i18n.DateTimePatterns_ta_IN', 'goog.i18n.DateTimePatterns_ta_LK', 'goog.i18n.DateTimePatterns_te_IN', 'goog.i18n.DateTimePatterns_teo', 'goog.i18n.DateTimePatterns_teo_KE', 'goog.i18n.DateTimePatterns_teo_UG', 'goog.i18n.DateTimePatterns_th_TH', 'goog.i18n.DateTimePatterns_ti', 'goog.i18n.DateTimePatterns_ti_ER', 'goog.i18n.DateTimePatterns_ti_ET', 'goog.i18n.DateTimePatterns_tl_PH', 'goog.i18n.DateTimePatterns_to', 'goog.i18n.DateTimePatterns_to_TO', 'goog.i18n.DateTimePatterns_tr_TR', 'goog.i18n.DateTimePatterns_tzm', 'goog.i18n.DateTimePatterns_tzm_Latn', 'goog.i18n.DateTimePatterns_tzm_Latn_MA', 'goog.i18n.DateTimePatterns_uk_UA', 'goog.i18n.DateTimePatterns_ur_IN', 'goog.i18n.DateTimePatterns_ur_PK', 'goog.i18n.DateTimePatterns_uz', 'goog.i18n.DateTimePatterns_uz_Arab', 'goog.i18n.DateTimePatterns_uz_Arab_AF', 'goog.i18n.DateTimePatterns_uz_Cyrl', 'goog.i18n.DateTimePatterns_uz_Cyrl_UZ', 'goog.i18n.DateTimePatterns_uz_Latn', 'goog.i18n.DateTimePatterns_uz_Latn_UZ', 'goog.i18n.DateTimePatterns_vi_VN', 'goog.i18n.DateTimePatterns_vun', 'goog.i18n.DateTimePatterns_vun_TZ', 'goog.i18n.DateTimePatterns_xog', 'goog.i18n.DateTimePatterns_xog_UG', 'goog.i18n.DateTimePatterns_yo', 'goog.i18n.DateTimePatterns_yo_NG', 'goog.i18n.DateTimePatterns_zh_Hans', 'goog.i18n.DateTimePatterns_zh_Hans_CN', 'goog.i18n.DateTimePatterns_zh_Hans_HK', 'goog.i18n.DateTimePatterns_zh_Hans_MO', 'goog.i18n.DateTimePatterns_zh_Hans_SG', 'goog.i18n.DateTimePatterns_zh_Hant', 'goog.i18n.DateTimePatterns_zh_Hant_HK', 'goog.i18n.DateTimePatterns_zh_Hant_MO', 'goog.i18n.DateTimePatterns_zh_Hant_TW', 'goog.i18n.DateTimePatterns_zu', 'goog.i18n.DateTimePatterns_zu_ZA'], ['goog.i18n.DateTimePatterns']);
goog.addDependency('i18n/datetimesymbols.js', ['goog.i18n.DateTimeSymbols', 'goog.i18n.DateTimeSymbols_am', 'goog.i18n.DateTimeSymbols_ar', 'goog.i18n.DateTimeSymbols_bg', 'goog.i18n.DateTimeSymbols_bn', 'goog.i18n.DateTimeSymbols_ca', 'goog.i18n.DateTimeSymbols_cs', 'goog.i18n.DateTimeSymbols_da', 'goog.i18n.DateTimeSymbols_de', 'goog.i18n.DateTimeSymbols_de_AT', 'goog.i18n.DateTimeSymbols_de_CH', 'goog.i18n.DateTimeSymbols_el', 'goog.i18n.DateTimeSymbols_en', 'goog.i18n.DateTimeSymbols_en_AU', 'goog.i18n.DateTimeSymbols_en_GB', 'goog.i18n.DateTimeSymbols_en_IE', 'goog.i18n.DateTimeSymbols_en_IN', 'goog.i18n.DateTimeSymbols_en_ISO', 'goog.i18n.DateTimeSymbols_en_SG', 'goog.i18n.DateTimeSymbols_en_US', 'goog.i18n.DateTimeSymbols_en_ZA', 'goog.i18n.DateTimeSymbols_es', 'goog.i18n.DateTimeSymbols_et', 'goog.i18n.DateTimeSymbols_eu', 'goog.i18n.DateTimeSymbols_fa', 'goog.i18n.DateTimeSymbols_fi', 'goog.i18n.DateTimeSymbols_fil', 'goog.i18n.DateTimeSymbols_fr', 'goog.i18n.DateTimeSymbols_fr_CA', 'goog.i18n.DateTimeSymbols_gl', 'goog.i18n.DateTimeSymbols_gsw', 'goog.i18n.DateTimeSymbols_gu', 'goog.i18n.DateTimeSymbols_he', 'goog.i18n.DateTimeSymbols_hi', 'goog.i18n.DateTimeSymbols_hr', 'goog.i18n.DateTimeSymbols_hu', 'goog.i18n.DateTimeSymbols_id', 'goog.i18n.DateTimeSymbols_in', 'goog.i18n.DateTimeSymbols_is', 'goog.i18n.DateTimeSymbols_it', 'goog.i18n.DateTimeSymbols_iw', 'goog.i18n.DateTimeSymbols_ja', 'goog.i18n.DateTimeSymbols_kn', 'goog.i18n.DateTimeSymbols_ko', 'goog.i18n.DateTimeSymbols_ln', 'goog.i18n.DateTimeSymbols_lt', 'goog.i18n.DateTimeSymbols_lv', 'goog.i18n.DateTimeSymbols_ml', 'goog.i18n.DateTimeSymbols_mo', 'goog.i18n.DateTimeSymbols_mr', 'goog.i18n.DateTimeSymbols_ms', 'goog.i18n.DateTimeSymbols_mt', 'goog.i18n.DateTimeSymbols_nl', 'goog.i18n.DateTimeSymbols_no', 'goog.i18n.DateTimeSymbols_or', 'goog.i18n.DateTimeSymbols_pl', 'goog.i18n.DateTimeSymbols_pt', 'goog.i18n.DateTimeSymbols_pt_BR', 'goog.i18n.DateTimeSymbols_pt_PT', 'goog.i18n.DateTimeSymbols_ro', 'goog.i18n.DateTimeSymbols_ru', 'goog.i18n.DateTimeSymbols_sk', 'goog.i18n.DateTimeSymbols_sl', 'goog.i18n.DateTimeSymbols_sq', 'goog.i18n.DateTimeSymbols_sr', 'goog.i18n.DateTimeSymbols_sv', 'goog.i18n.DateTimeSymbols_sw', 'goog.i18n.DateTimeSymbols_ta', 'goog.i18n.DateTimeSymbols_te', 'goog.i18n.DateTimeSymbols_th', 'goog.i18n.DateTimeSymbols_tl', 'goog.i18n.DateTimeSymbols_tr', 'goog.i18n.DateTimeSymbols_uk', 'goog.i18n.DateTimeSymbols_ur', 'goog.i18n.DateTimeSymbols_vi', 'goog.i18n.DateTimeSymbols_zh', 'goog.i18n.DateTimeSymbols_zh_CN', 'goog.i18n.DateTimeSymbols_zh_HK', 'goog.i18n.DateTimeSymbols_zh_TW'], []);
goog.addDependency('i18n/datetimesymbolsext.js', ['goog.i18n.DateTimeSymbolsExt', 'goog.i18n.DateTimeSymbols_aa', 'goog.i18n.DateTimeSymbols_aa_DJ', 'goog.i18n.DateTimeSymbols_aa_ER', 'goog.i18n.DateTimeSymbols_aa_ER_SAAHO', 'goog.i18n.DateTimeSymbols_aa_ET', 'goog.i18n.DateTimeSymbols_af', 'goog.i18n.DateTimeSymbols_af_NA', 'goog.i18n.DateTimeSymbols_af_ZA', 'goog.i18n.DateTimeSymbols_ak', 'goog.i18n.DateTimeSymbols_ak_GH', 'goog.i18n.DateTimeSymbols_am_ET', 'goog.i18n.DateTimeSymbols_ar_AE', 'goog.i18n.DateTimeSymbols_ar_BH', 'goog.i18n.DateTimeSymbols_ar_DZ', 'goog.i18n.DateTimeSymbols_ar_EG', 'goog.i18n.DateTimeSymbols_ar_IQ', 'goog.i18n.DateTimeSymbols_ar_JO', 'goog.i18n.DateTimeSymbols_ar_KW', 'goog.i18n.DateTimeSymbols_ar_LB', 'goog.i18n.DateTimeSymbols_ar_LY', 'goog.i18n.DateTimeSymbols_ar_MA', 'goog.i18n.DateTimeSymbols_ar_OM', 'goog.i18n.DateTimeSymbols_ar_QA', 'goog.i18n.DateTimeSymbols_ar_SA', 'goog.i18n.DateTimeSymbols_ar_SD', 'goog.i18n.DateTimeSymbols_ar_SY', 'goog.i18n.DateTimeSymbols_ar_TN', 'goog.i18n.DateTimeSymbols_ar_YE', 'goog.i18n.DateTimeSymbols_as', 'goog.i18n.DateTimeSymbols_as_IN', 'goog.i18n.DateTimeSymbols_az', 'goog.i18n.DateTimeSymbols_az_AZ', 'goog.i18n.DateTimeSymbols_az_Cyrl', 'goog.i18n.DateTimeSymbols_az_Cyrl_AZ', 'goog.i18n.DateTimeSymbols_az_Latn', 'goog.i18n.DateTimeSymbols_az_Latn_AZ', 'goog.i18n.DateTimeSymbols_be', 'goog.i18n.DateTimeSymbols_be_BY', 'goog.i18n.DateTimeSymbols_bg_BG', 'goog.i18n.DateTimeSymbols_bn_BD', 'goog.i18n.DateTimeSymbols_bn_IN', 'goog.i18n.DateTimeSymbols_bo', 'goog.i18n.DateTimeSymbols_bo_CN', 'goog.i18n.DateTimeSymbols_bo_IN', 'goog.i18n.DateTimeSymbols_bs', 'goog.i18n.DateTimeSymbols_bs_BA', 'goog.i18n.DateTimeSymbols_byn', 'goog.i18n.DateTimeSymbols_byn_ER', 'goog.i18n.DateTimeSymbols_ca_ES', 'goog.i18n.DateTimeSymbols_cch', 'goog.i18n.DateTimeSymbols_cch_NG', 'goog.i18n.DateTimeSymbols_cop', 'goog.i18n.DateTimeSymbols_cs_CZ', 'goog.i18n.DateTimeSymbols_cy', 'goog.i18n.DateTimeSymbols_cy_GB', 'goog.i18n.DateTimeSymbols_da_DK', 'goog.i18n.DateTimeSymbols_de_BE', 'goog.i18n.DateTimeSymbols_de_DE', 'goog.i18n.DateTimeSymbols_de_LI', 'goog.i18n.DateTimeSymbols_de_LU', 'goog.i18n.DateTimeSymbols_dv', 'goog.i18n.DateTimeSymbols_dv_MV', 'goog.i18n.DateTimeSymbols_dz', 'goog.i18n.DateTimeSymbols_dz_BT', 'goog.i18n.DateTimeSymbols_ee', 'goog.i18n.DateTimeSymbols_ee_GH', 'goog.i18n.DateTimeSymbols_ee_TG', 'goog.i18n.DateTimeSymbols_el_CY', 'goog.i18n.DateTimeSymbols_el_GR', 'goog.i18n.DateTimeSymbols_el_POLYTON', 'goog.i18n.DateTimeSymbols_en_AS', 'goog.i18n.DateTimeSymbols_en_BE', 'goog.i18n.DateTimeSymbols_en_BW', 'goog.i18n.DateTimeSymbols_en_BZ', 'goog.i18n.DateTimeSymbols_en_CA', 'goog.i18n.DateTimeSymbols_en_Dsrt', 'goog.i18n.DateTimeSymbols_en_Dsrt_US', 'goog.i18n.DateTimeSymbols_en_GU', 'goog.i18n.DateTimeSymbols_en_HK', 'goog.i18n.DateTimeSymbols_en_JM', 'goog.i18n.DateTimeSymbols_en_MH', 'goog.i18n.DateTimeSymbols_en_MP', 'goog.i18n.DateTimeSymbols_en_MT', 'goog.i18n.DateTimeSymbols_en_NA', 'goog.i18n.DateTimeSymbols_en_NZ', 'goog.i18n.DateTimeSymbols_en_PH', 'goog.i18n.DateTimeSymbols_en_PK', 'goog.i18n.DateTimeSymbols_en_Shaw', 'goog.i18n.DateTimeSymbols_en_TT', 'goog.i18n.DateTimeSymbols_en_UM', 'goog.i18n.DateTimeSymbols_en_VI', 'goog.i18n.DateTimeSymbols_en_ZW', 'goog.i18n.DateTimeSymbols_eo', 'goog.i18n.DateTimeSymbols_es_AR', 'goog.i18n.DateTimeSymbols_es_BO', 'goog.i18n.DateTimeSymbols_es_CL', 'goog.i18n.DateTimeSymbols_es_CO', 'goog.i18n.DateTimeSymbols_es_CR', 'goog.i18n.DateTimeSymbols_es_DO', 'goog.i18n.DateTimeSymbols_es_EC', 'goog.i18n.DateTimeSymbols_es_ES', 'goog.i18n.DateTimeSymbols_es_GT', 'goog.i18n.DateTimeSymbols_es_HN', 'goog.i18n.DateTimeSymbols_es_MX', 'goog.i18n.DateTimeSymbols_es_NI', 'goog.i18n.DateTimeSymbols_es_PA', 'goog.i18n.DateTimeSymbols_es_PE', 'goog.i18n.DateTimeSymbols_es_PR', 'goog.i18n.DateTimeSymbols_es_PY', 'goog.i18n.DateTimeSymbols_es_SV', 'goog.i18n.DateTimeSymbols_es_US', 'goog.i18n.DateTimeSymbols_es_UY', 'goog.i18n.DateTimeSymbols_es_VE', 'goog.i18n.DateTimeSymbols_et_EE', 'goog.i18n.DateTimeSymbols_eu_ES', 'goog.i18n.DateTimeSymbols_fa_AF', 'goog.i18n.DateTimeSymbols_fa_IR', 'goog.i18n.DateTimeSymbols_fi_FI', 'goog.i18n.DateTimeSymbols_fil_PH', 'goog.i18n.DateTimeSymbols_fo', 'goog.i18n.DateTimeSymbols_fo_FO', 'goog.i18n.DateTimeSymbols_fr_BE', 'goog.i18n.DateTimeSymbols_fr_CH', 'goog.i18n.DateTimeSymbols_fr_FR', 'goog.i18n.DateTimeSymbols_fr_LU', 'goog.i18n.DateTimeSymbols_fr_MC', 'goog.i18n.DateTimeSymbols_fr_SN', 'goog.i18n.DateTimeSymbols_fur', 'goog.i18n.DateTimeSymbols_fur_IT', 'goog.i18n.DateTimeSymbols_ga', 'goog.i18n.DateTimeSymbols_ga_IE', 'goog.i18n.DateTimeSymbols_gaa', 'goog.i18n.DateTimeSymbols_gaa_GH', 'goog.i18n.DateTimeSymbols_gez', 'goog.i18n.DateTimeSymbols_gez_ER', 'goog.i18n.DateTimeSymbols_gez_ET', 'goog.i18n.DateTimeSymbols_gl_ES', 'goog.i18n.DateTimeSymbols_gsw_CH', 'goog.i18n.DateTimeSymbols_gu_IN', 'goog.i18n.DateTimeSymbols_gv', 'goog.i18n.DateTimeSymbols_gv_GB', 'goog.i18n.DateTimeSymbols_ha', 'goog.i18n.DateTimeSymbols_ha_Arab', 'goog.i18n.DateTimeSymbols_ha_Arab_NG', 'goog.i18n.DateTimeSymbols_ha_Arab_SD', 'goog.i18n.DateTimeSymbols_ha_GH', 'goog.i18n.DateTimeSymbols_ha_Latn', 'goog.i18n.DateTimeSymbols_ha_Latn_GH', 'goog.i18n.DateTimeSymbols_ha_Latn_NE', 'goog.i18n.DateTimeSymbols_ha_Latn_NG', 'goog.i18n.DateTimeSymbols_ha_NE', 'goog.i18n.DateTimeSymbols_ha_NG', 'goog.i18n.DateTimeSymbols_ha_SD', 'goog.i18n.DateTimeSymbols_haw', 'goog.i18n.DateTimeSymbols_haw_US', 'goog.i18n.DateTimeSymbols_he_IL', 'goog.i18n.DateTimeSymbols_hi_IN', 'goog.i18n.DateTimeSymbols_hr_HR', 'goog.i18n.DateTimeSymbols_hu_HU', 'goog.i18n.DateTimeSymbols_hy', 'goog.i18n.DateTimeSymbols_hy_AM', 'goog.i18n.DateTimeSymbols_ia', 'goog.i18n.DateTimeSymbols_id_ID', 'goog.i18n.DateTimeSymbols_ig', 'goog.i18n.DateTimeSymbols_ig_NG', 'goog.i18n.DateTimeSymbols_ii', 'goog.i18n.DateTimeSymbols_ii_CN', 'goog.i18n.DateTimeSymbols_is_IS', 'goog.i18n.DateTimeSymbols_it_CH', 'goog.i18n.DateTimeSymbols_it_IT', 'goog.i18n.DateTimeSymbols_iu', 'goog.i18n.DateTimeSymbols_ja_JP', 'goog.i18n.DateTimeSymbols_ka', 'goog.i18n.DateTimeSymbols_ka_GE', 'goog.i18n.DateTimeSymbols_kaj', 'goog.i18n.DateTimeSymbols_kaj_NG', 'goog.i18n.DateTimeSymbols_kam', 'goog.i18n.DateTimeSymbols_kam_KE', 'goog.i18n.DateTimeSymbols_kcg', 'goog.i18n.DateTimeSymbols_kcg_NG', 'goog.i18n.DateTimeSymbols_kfo', 'goog.i18n.DateTimeSymbols_kfo_CI', 'goog.i18n.DateTimeSymbols_kk', 'goog.i18n.DateTimeSymbols_kk_Cyrl', 'goog.i18n.DateTimeSymbols_kk_Cyrl_KZ', 'goog.i18n.DateTimeSymbols_kk_KZ', 'goog.i18n.DateTimeSymbols_kl', 'goog.i18n.DateTimeSymbols_kl_GL', 'goog.i18n.DateTimeSymbols_km', 'goog.i18n.DateTimeSymbols_km_KH', 'goog.i18n.DateTimeSymbols_kn_IN', 'goog.i18n.DateTimeSymbols_ko_KR', 'goog.i18n.DateTimeSymbols_kok', 'goog.i18n.DateTimeSymbols_kok_IN', 'goog.i18n.DateTimeSymbols_kpe', 'goog.i18n.DateTimeSymbols_kpe_GN', 'goog.i18n.DateTimeSymbols_kpe_LR', 'goog.i18n.DateTimeSymbols_ku', 'goog.i18n.DateTimeSymbols_ku_Arab', 'goog.i18n.DateTimeSymbols_ku_Arab_IQ', 'goog.i18n.DateTimeSymbols_ku_Arab_IR', 'goog.i18n.DateTimeSymbols_ku_Arab_SY', 'goog.i18n.DateTimeSymbols_ku_IQ', 'goog.i18n.DateTimeSymbols_ku_IR', 'goog.i18n.DateTimeSymbols_ku_Latn', 'goog.i18n.DateTimeSymbols_ku_Latn_TR', 'goog.i18n.DateTimeSymbols_ku_SY', 'goog.i18n.DateTimeSymbols_ku_TR', 'goog.i18n.DateTimeSymbols_kw', 'goog.i18n.DateTimeSymbols_kw_GB', 'goog.i18n.DateTimeSymbols_ky', 'goog.i18n.DateTimeSymbols_ky_KG', 'goog.i18n.DateTimeSymbols_ln_CD', 'goog.i18n.DateTimeSymbols_ln_CG', 'goog.i18n.DateTimeSymbols_lo', 'goog.i18n.DateTimeSymbols_lo_LA', 'goog.i18n.DateTimeSymbols_lt_LT', 'goog.i18n.DateTimeSymbols_lv_LV', 'goog.i18n.DateTimeSymbols_mk', 'goog.i18n.DateTimeSymbols_mk_MK', 'goog.i18n.DateTimeSymbols_ml_IN', 'goog.i18n.DateTimeSymbols_mn', 'goog.i18n.DateTimeSymbols_mn_CN', 'goog.i18n.DateTimeSymbols_mn_Cyrl', 'goog.i18n.DateTimeSymbols_mn_Cyrl_MN', 'goog.i18n.DateTimeSymbols_mn_MN', 'goog.i18n.DateTimeSymbols_mn_Mong', 'goog.i18n.DateTimeSymbols_mn_Mong_CN', 'goog.i18n.DateTimeSymbols_mr_IN', 'goog.i18n.DateTimeSymbols_ms_BN', 'goog.i18n.DateTimeSymbols_ms_MY', 'goog.i18n.DateTimeSymbols_mt_MT', 'goog.i18n.DateTimeSymbols_my', 'goog.i18n.DateTimeSymbols_my_MM', 'goog.i18n.DateTimeSymbols_nb', 'goog.i18n.DateTimeSymbols_nb_NO', 'goog.i18n.DateTimeSymbols_nds', 'goog.i18n.DateTimeSymbols_nds_DE', 'goog.i18n.DateTimeSymbols_ne', 'goog.i18n.DateTimeSymbols_ne_IN', 'goog.i18n.DateTimeSymbols_ne_NP', 'goog.i18n.DateTimeSymbols_nl_BE', 'goog.i18n.DateTimeSymbols_nl_NL', 'goog.i18n.DateTimeSymbols_nn', 'goog.i18n.DateTimeSymbols_nn_NO', 'goog.i18n.DateTimeSymbols_nr', 'goog.i18n.DateTimeSymbols_nr_ZA', 'goog.i18n.DateTimeSymbols_nso', 'goog.i18n.DateTimeSymbols_nso_ZA', 'goog.i18n.DateTimeSymbols_ny', 'goog.i18n.DateTimeSymbols_ny_MW', 'goog.i18n.DateTimeSymbols_oc', 'goog.i18n.DateTimeSymbols_oc_FR', 'goog.i18n.DateTimeSymbols_om', 'goog.i18n.DateTimeSymbols_om_ET', 'goog.i18n.DateTimeSymbols_om_KE', 'goog.i18n.DateTimeSymbols_or_IN', 'goog.i18n.DateTimeSymbols_pa', 'goog.i18n.DateTimeSymbols_pa_Arab', 'goog.i18n.DateTimeSymbols_pa_Arab_PK', 'goog.i18n.DateTimeSymbols_pa_Guru', 'goog.i18n.DateTimeSymbols_pa_Guru_IN', 'goog.i18n.DateTimeSymbols_pa_IN', 'goog.i18n.DateTimeSymbols_pa_PK', 'goog.i18n.DateTimeSymbols_pl_PL', 'goog.i18n.DateTimeSymbols_ps', 'goog.i18n.DateTimeSymbols_ps_AF', 'goog.i18n.DateTimeSymbols_ro_MD', 'goog.i18n.DateTimeSymbols_ro_RO', 'goog.i18n.DateTimeSymbols_ru_RU', 'goog.i18n.DateTimeSymbols_ru_UA', 'goog.i18n.DateTimeSymbols_rw', 'goog.i18n.DateTimeSymbols_rw_RW', 'goog.i18n.DateTimeSymbols_sa', 'goog.i18n.DateTimeSymbols_sa_IN', 'goog.i18n.DateTimeSymbols_se', 'goog.i18n.DateTimeSymbols_se_FI', 'goog.i18n.DateTimeSymbols_se_NO', 'goog.i18n.DateTimeSymbols_sh', 'goog.i18n.DateTimeSymbols_sh_BA', 'goog.i18n.DateTimeSymbols_sh_CS', 'goog.i18n.DateTimeSymbols_sh_YU', 'goog.i18n.DateTimeSymbols_si', 'goog.i18n.DateTimeSymbols_si_LK', 'goog.i18n.DateTimeSymbols_sid', 'goog.i18n.DateTimeSymbols_sid_ET', 'goog.i18n.DateTimeSymbols_sk_SK', 'goog.i18n.DateTimeSymbols_sl_SI', 'goog.i18n.DateTimeSymbols_so', 'goog.i18n.DateTimeSymbols_so_DJ', 'goog.i18n.DateTimeSymbols_so_ET', 'goog.i18n.DateTimeSymbols_so_KE', 'goog.i18n.DateTimeSymbols_so_SO', 'goog.i18n.DateTimeSymbols_sq_AL', 'goog.i18n.DateTimeSymbols_sr_BA', 'goog.i18n.DateTimeSymbols_sr_CS', 'goog.i18n.DateTimeSymbols_sr_Cyrl', 'goog.i18n.DateTimeSymbols_sr_Cyrl_BA', 'goog.i18n.DateTimeSymbols_sr_Cyrl_CS', 'goog.i18n.DateTimeSymbols_sr_Cyrl_ME', 'goog.i18n.DateTimeSymbols_sr_Cyrl_RS', 'goog.i18n.DateTimeSymbols_sr_Cyrl_YU', 'goog.i18n.DateTimeSymbols_sr_Latn', 'goog.i18n.DateTimeSymbols_sr_Latn_BA', 'goog.i18n.DateTimeSymbols_sr_Latn_CS', 'goog.i18n.DateTimeSymbols_sr_Latn_ME', 'goog.i18n.DateTimeSymbols_sr_Latn_RS', 'goog.i18n.DateTimeSymbols_sr_Latn_YU', 'goog.i18n.DateTimeSymbols_sr_ME', 'goog.i18n.DateTimeSymbols_sr_RS', 'goog.i18n.DateTimeSymbols_sr_YU', 'goog.i18n.DateTimeSymbols_ss', 'goog.i18n.DateTimeSymbols_ss_SZ', 'goog.i18n.DateTimeSymbols_ss_ZA', 'goog.i18n.DateTimeSymbols_st', 'goog.i18n.DateTimeSymbols_st_LS', 'goog.i18n.DateTimeSymbols_st_ZA', 'goog.i18n.DateTimeSymbols_sv_FI', 'goog.i18n.DateTimeSymbols_sv_SE', 'goog.i18n.DateTimeSymbols_sw_KE', 'goog.i18n.DateTimeSymbols_sw_TZ', 'goog.i18n.DateTimeSymbols_syr', 'goog.i18n.DateTimeSymbols_syr_SY', 'goog.i18n.DateTimeSymbols_ta_IN', 'goog.i18n.DateTimeSymbols_te_IN', 'goog.i18n.DateTimeSymbols_tg', 'goog.i18n.DateTimeSymbols_tg_Cyrl', 'goog.i18n.DateTimeSymbols_tg_Cyrl_TJ', 'goog.i18n.DateTimeSymbols_tg_TJ', 'goog.i18n.DateTimeSymbols_th_TH', 'goog.i18n.DateTimeSymbols_ti', 'goog.i18n.DateTimeSymbols_ti_ER', 'goog.i18n.DateTimeSymbols_ti_ET', 'goog.i18n.DateTimeSymbols_tig', 'goog.i18n.DateTimeSymbols_tig_ER', 'goog.i18n.DateTimeSymbols_tl_PH', 'goog.i18n.DateTimeSymbols_tn', 'goog.i18n.DateTimeSymbols_tn_ZA', 'goog.i18n.DateTimeSymbols_to', 'goog.i18n.DateTimeSymbols_to_TO', 'goog.i18n.DateTimeSymbols_tr_TR', 'goog.i18n.DateTimeSymbols_trv', 'goog.i18n.DateTimeSymbols_trv_TW', 'goog.i18n.DateTimeSymbols_ts', 'goog.i18n.DateTimeSymbols_ts_ZA', 'goog.i18n.DateTimeSymbols_tt', 'goog.i18n.DateTimeSymbols_tt_RU', 'goog.i18n.DateTimeSymbols_ug', 'goog.i18n.DateTimeSymbols_ug_Arab', 'goog.i18n.DateTimeSymbols_ug_Arab_CN', 'goog.i18n.DateTimeSymbols_ug_CN', 'goog.i18n.DateTimeSymbols_uk_UA', 'goog.i18n.DateTimeSymbols_ur_IN', 'goog.i18n.DateTimeSymbols_ur_PK', 'goog.i18n.DateTimeSymbols_uz', 'goog.i18n.DateTimeSymbols_uz_AF', 'goog.i18n.DateTimeSymbols_uz_Arab', 'goog.i18n.DateTimeSymbols_uz_Arab_AF', 'goog.i18n.DateTimeSymbols_uz_Cyrl', 'goog.i18n.DateTimeSymbols_uz_Cyrl_UZ', 'goog.i18n.DateTimeSymbols_uz_Latn', 'goog.i18n.DateTimeSymbols_uz_Latn_UZ', 'goog.i18n.DateTimeSymbols_uz_UZ', 'goog.i18n.DateTimeSymbols_ve', 'goog.i18n.DateTimeSymbols_ve_ZA', 'goog.i18n.DateTimeSymbols_vi_VN', 'goog.i18n.DateTimeSymbols_wal', 'goog.i18n.DateTimeSymbols_wal_ET', 'goog.i18n.DateTimeSymbols_wo', 'goog.i18n.DateTimeSymbols_wo_Latn', 'goog.i18n.DateTimeSymbols_wo_Latn_SN', 'goog.i18n.DateTimeSymbols_wo_SN', 'goog.i18n.DateTimeSymbols_xh', 'goog.i18n.DateTimeSymbols_xh_ZA', 'goog.i18n.DateTimeSymbols_yo', 'goog.i18n.DateTimeSymbols_yo_NG', 'goog.i18n.DateTimeSymbols_zh_Hans', 'goog.i18n.DateTimeSymbols_zh_Hans_CN', 'goog.i18n.DateTimeSymbols_zh_Hans_HK', 'goog.i18n.DateTimeSymbols_zh_Hans_MO', 'goog.i18n.DateTimeSymbols_zh_Hans_SG', 'goog.i18n.DateTimeSymbols_zh_Hant', 'goog.i18n.DateTimeSymbols_zh_Hant_HK', 'goog.i18n.DateTimeSymbols_zh_Hant_MO', 'goog.i18n.DateTimeSymbols_zh_Hant_TW', 'goog.i18n.DateTimeSymbols_zh_MO', 'goog.i18n.DateTimeSymbols_zh_SG', 'goog.i18n.DateTimeSymbols_zu', 'goog.i18n.DateTimeSymbols_zu_ZA'], ['goog.i18n.DateTimeSymbols']);
goog.addDependency('i18n/graphemebreak.js', ['goog.i18n.GraphemeBreak'], ['goog.structs.InversionMap']);
goog.addDependency('i18n/messageformat.js', ['goog.i18n.MessageFormat'], ['goog.asserts', 'goog.i18n.NumberFormat', 'goog.i18n.pluralRules']);
goog.addDependency('i18n/mime.js', ['goog.i18n.mime', 'goog.i18n.mime.encode'], []);
goog.addDependency('i18n/numberformat.js', ['goog.i18n.NumberFormat'], ['goog.i18n.NumberFormatSymbols', 'goog.i18n.currencyCodeMap']);
goog.addDependency('i18n/numberformatsymbols.js', ['goog.i18n.NumberFormatSymbols', 'goog.i18n.NumberFormatSymbols_aa', 'goog.i18n.NumberFormatSymbols_aa_DJ', 'goog.i18n.NumberFormatSymbols_aa_ER', 'goog.i18n.NumberFormatSymbols_aa_ER_SAAHO', 'goog.i18n.NumberFormatSymbols_aa_ET', 'goog.i18n.NumberFormatSymbols_af', 'goog.i18n.NumberFormatSymbols_af_NA', 'goog.i18n.NumberFormatSymbols_af_ZA', 'goog.i18n.NumberFormatSymbols_ak', 'goog.i18n.NumberFormatSymbols_ak_GH', 'goog.i18n.NumberFormatSymbols_am', 'goog.i18n.NumberFormatSymbols_am_ET', 'goog.i18n.NumberFormatSymbols_ar', 'goog.i18n.NumberFormatSymbols_ar_AE', 'goog.i18n.NumberFormatSymbols_ar_BH', 'goog.i18n.NumberFormatSymbols_ar_DZ', 'goog.i18n.NumberFormatSymbols_ar_EG', 'goog.i18n.NumberFormatSymbols_ar_IQ', 'goog.i18n.NumberFormatSymbols_ar_JO', 'goog.i18n.NumberFormatSymbols_ar_KW', 'goog.i18n.NumberFormatSymbols_ar_LB', 'goog.i18n.NumberFormatSymbols_ar_LY', 'goog.i18n.NumberFormatSymbols_ar_MA', 'goog.i18n.NumberFormatSymbols_ar_OM', 'goog.i18n.NumberFormatSymbols_ar_QA', 'goog.i18n.NumberFormatSymbols_ar_SA', 'goog.i18n.NumberFormatSymbols_ar_SD', 'goog.i18n.NumberFormatSymbols_ar_SY', 'goog.i18n.NumberFormatSymbols_ar_TN', 'goog.i18n.NumberFormatSymbols_ar_YE', 'goog.i18n.NumberFormatSymbols_as', 'goog.i18n.NumberFormatSymbols_as_IN', 'goog.i18n.NumberFormatSymbols_az', 'goog.i18n.NumberFormatSymbols_az_AZ', 'goog.i18n.NumberFormatSymbols_az_Cyrl', 'goog.i18n.NumberFormatSymbols_az_Cyrl_AZ', 'goog.i18n.NumberFormatSymbols_az_Latn', 'goog.i18n.NumberFormatSymbols_az_Latn_AZ', 'goog.i18n.NumberFormatSymbols_be', 'goog.i18n.NumberFormatSymbols_be_BY', 'goog.i18n.NumberFormatSymbols_bg', 'goog.i18n.NumberFormatSymbols_bg_BG', 'goog.i18n.NumberFormatSymbols_bn', 'goog.i18n.NumberFormatSymbols_bn_BD', 'goog.i18n.NumberFormatSymbols_bn_IN', 'goog.i18n.NumberFormatSymbols_bo', 'goog.i18n.NumberFormatSymbols_bo_CN', 'goog.i18n.NumberFormatSymbols_bo_IN', 'goog.i18n.NumberFormatSymbols_bs', 'goog.i18n.NumberFormatSymbols_bs_BA', 'goog.i18n.NumberFormatSymbols_byn', 'goog.i18n.NumberFormatSymbols_byn_ER', 'goog.i18n.NumberFormatSymbols_ca', 'goog.i18n.NumberFormatSymbols_ca_ES', 'goog.i18n.NumberFormatSymbols_cch', 'goog.i18n.NumberFormatSymbols_cch_NG', 'goog.i18n.NumberFormatSymbols_cop', 'goog.i18n.NumberFormatSymbols_cs', 'goog.i18n.NumberFormatSymbols_cs_CZ', 'goog.i18n.NumberFormatSymbols_cy', 'goog.i18n.NumberFormatSymbols_cy_GB', 'goog.i18n.NumberFormatSymbols_da', 'goog.i18n.NumberFormatSymbols_da_DK', 'goog.i18n.NumberFormatSymbols_de', 'goog.i18n.NumberFormatSymbols_de_AT', 'goog.i18n.NumberFormatSymbols_de_BE', 'goog.i18n.NumberFormatSymbols_de_CH', 'goog.i18n.NumberFormatSymbols_de_DE', 'goog.i18n.NumberFormatSymbols_de_LI', 'goog.i18n.NumberFormatSymbols_de_LU', 'goog.i18n.NumberFormatSymbols_dv', 'goog.i18n.NumberFormatSymbols_dv_MV', 'goog.i18n.NumberFormatSymbols_dz', 'goog.i18n.NumberFormatSymbols_dz_BT', 'goog.i18n.NumberFormatSymbols_ee', 'goog.i18n.NumberFormatSymbols_ee_GH', 'goog.i18n.NumberFormatSymbols_ee_TG', 'goog.i18n.NumberFormatSymbols_el', 'goog.i18n.NumberFormatSymbols_el_CY', 'goog.i18n.NumberFormatSymbols_el_GR', 'goog.i18n.NumberFormatSymbols_el_POLYTON', 'goog.i18n.NumberFormatSymbols_en', 'goog.i18n.NumberFormatSymbols_en_AS', 'goog.i18n.NumberFormatSymbols_en_AU', 'goog.i18n.NumberFormatSymbols_en_BE', 'goog.i18n.NumberFormatSymbols_en_BW', 'goog.i18n.NumberFormatSymbols_en_BZ', 'goog.i18n.NumberFormatSymbols_en_CA', 'goog.i18n.NumberFormatSymbols_en_Dsrt', 'goog.i18n.NumberFormatSymbols_en_Dsrt_US', 'goog.i18n.NumberFormatSymbols_en_GB', 'goog.i18n.NumberFormatSymbols_en_GU', 'goog.i18n.NumberFormatSymbols_en_HK', 'goog.i18n.NumberFormatSymbols_en_IE', 'goog.i18n.NumberFormatSymbols_en_IN', 'goog.i18n.NumberFormatSymbols_en_JM', 'goog.i18n.NumberFormatSymbols_en_MH', 'goog.i18n.NumberFormatSymbols_en_MP', 'goog.i18n.NumberFormatSymbols_en_MT', 'goog.i18n.NumberFormatSymbols_en_NA', 'goog.i18n.NumberFormatSymbols_en_NZ', 'goog.i18n.NumberFormatSymbols_en_PH', 'goog.i18n.NumberFormatSymbols_en_PK', 'goog.i18n.NumberFormatSymbols_en_SG', 'goog.i18n.NumberFormatSymbols_en_Shaw', 'goog.i18n.NumberFormatSymbols_en_TT', 'goog.i18n.NumberFormatSymbols_en_UM', 'goog.i18n.NumberFormatSymbols_en_US', 'goog.i18n.NumberFormatSymbols_en_VI', 'goog.i18n.NumberFormatSymbols_en_ZA', 'goog.i18n.NumberFormatSymbols_en_ZW', 'goog.i18n.NumberFormatSymbols_eo', 'goog.i18n.NumberFormatSymbols_es', 'goog.i18n.NumberFormatSymbols_es_AR', 'goog.i18n.NumberFormatSymbols_es_BO', 'goog.i18n.NumberFormatSymbols_es_CL', 'goog.i18n.NumberFormatSymbols_es_CO', 'goog.i18n.NumberFormatSymbols_es_CR', 'goog.i18n.NumberFormatSymbols_es_DO', 'goog.i18n.NumberFormatSymbols_es_EC', 'goog.i18n.NumberFormatSymbols_es_ES', 'goog.i18n.NumberFormatSymbols_es_GT', 'goog.i18n.NumberFormatSymbols_es_HN', 'goog.i18n.NumberFormatSymbols_es_MX', 'goog.i18n.NumberFormatSymbols_es_NI', 'goog.i18n.NumberFormatSymbols_es_PA', 'goog.i18n.NumberFormatSymbols_es_PE', 'goog.i18n.NumberFormatSymbols_es_PR', 'goog.i18n.NumberFormatSymbols_es_PY', 'goog.i18n.NumberFormatSymbols_es_SV', 'goog.i18n.NumberFormatSymbols_es_US', 'goog.i18n.NumberFormatSymbols_es_UY', 'goog.i18n.NumberFormatSymbols_es_VE', 'goog.i18n.NumberFormatSymbols_et', 'goog.i18n.NumberFormatSymbols_et_EE', 'goog.i18n.NumberFormatSymbols_eu', 'goog.i18n.NumberFormatSymbols_eu_ES', 'goog.i18n.NumberFormatSymbols_fa', 'goog.i18n.NumberFormatSymbols_fa_AF', 'goog.i18n.NumberFormatSymbols_fa_IR', 'goog.i18n.NumberFormatSymbols_fi', 'goog.i18n.NumberFormatSymbols_fi_FI', 'goog.i18n.NumberFormatSymbols_fil', 'goog.i18n.NumberFormatSymbols_fil_PH', 'goog.i18n.NumberFormatSymbols_fo', 'goog.i18n.NumberFormatSymbols_fo_FO', 'goog.i18n.NumberFormatSymbols_fr', 'goog.i18n.NumberFormatSymbols_fr_BE', 'goog.i18n.NumberFormatSymbols_fr_CA', 'goog.i18n.NumberFormatSymbols_fr_CH', 'goog.i18n.NumberFormatSymbols_fr_FR', 'goog.i18n.NumberFormatSymbols_fr_LU', 'goog.i18n.NumberFormatSymbols_fr_MC', 'goog.i18n.NumberFormatSymbols_fr_SN', 'goog.i18n.NumberFormatSymbols_fur', 'goog.i18n.NumberFormatSymbols_fur_IT', 'goog.i18n.NumberFormatSymbols_ga', 'goog.i18n.NumberFormatSymbols_ga_IE', 'goog.i18n.NumberFormatSymbols_gaa', 'goog.i18n.NumberFormatSymbols_gaa_GH', 'goog.i18n.NumberFormatSymbols_gez', 'goog.i18n.NumberFormatSymbols_gez_ER', 'goog.i18n.NumberFormatSymbols_gez_ET', 'goog.i18n.NumberFormatSymbols_gl', 'goog.i18n.NumberFormatSymbols_gl_ES', 'goog.i18n.NumberFormatSymbols_gsw', 'goog.i18n.NumberFormatSymbols_gsw_CH', 'goog.i18n.NumberFormatSymbols_gu', 'goog.i18n.NumberFormatSymbols_gu_IN', 'goog.i18n.NumberFormatSymbols_gv', 'goog.i18n.NumberFormatSymbols_gv_GB', 'goog.i18n.NumberFormatSymbols_ha', 'goog.i18n.NumberFormatSymbols_ha_Arab', 'goog.i18n.NumberFormatSymbols_ha_Arab_NG', 'goog.i18n.NumberFormatSymbols_ha_Arab_SD', 'goog.i18n.NumberFormatSymbols_ha_GH', 'goog.i18n.NumberFormatSymbols_ha_Latn', 'goog.i18n.NumberFormatSymbols_ha_Latn_GH', 'goog.i18n.NumberFormatSymbols_ha_Latn_NE', 'goog.i18n.NumberFormatSymbols_ha_Latn_NG', 'goog.i18n.NumberFormatSymbols_ha_NE', 'goog.i18n.NumberFormatSymbols_ha_NG', 'goog.i18n.NumberFormatSymbols_ha_SD', 'goog.i18n.NumberFormatSymbols_haw', 'goog.i18n.NumberFormatSymbols_haw_US', 'goog.i18n.NumberFormatSymbols_he', 'goog.i18n.NumberFormatSymbols_he_IL', 'goog.i18n.NumberFormatSymbols_hi', 'goog.i18n.NumberFormatSymbols_hi_IN', 'goog.i18n.NumberFormatSymbols_hr', 'goog.i18n.NumberFormatSymbols_hr_HR', 'goog.i18n.NumberFormatSymbols_hu', 'goog.i18n.NumberFormatSymbols_hu_HU', 'goog.i18n.NumberFormatSymbols_hy', 'goog.i18n.NumberFormatSymbols_hy_AM', 'goog.i18n.NumberFormatSymbols_ia', 'goog.i18n.NumberFormatSymbols_id', 'goog.i18n.NumberFormatSymbols_id_ID', 'goog.i18n.NumberFormatSymbols_ig', 'goog.i18n.NumberFormatSymbols_ig_NG', 'goog.i18n.NumberFormatSymbols_ii', 'goog.i18n.NumberFormatSymbols_ii_CN', 'goog.i18n.NumberFormatSymbols_in', 'goog.i18n.NumberFormatSymbols_is', 'goog.i18n.NumberFormatSymbols_is_IS', 'goog.i18n.NumberFormatSymbols_it', 'goog.i18n.NumberFormatSymbols_it_CH', 'goog.i18n.NumberFormatSymbols_it_IT', 'goog.i18n.NumberFormatSymbols_iu', 'goog.i18n.NumberFormatSymbols_iw', 'goog.i18n.NumberFormatSymbols_ja', 'goog.i18n.NumberFormatSymbols_ja_JP', 'goog.i18n.NumberFormatSymbols_ka', 'goog.i18n.NumberFormatSymbols_ka_GE', 'goog.i18n.NumberFormatSymbols_kaj', 'goog.i18n.NumberFormatSymbols_kaj_NG', 'goog.i18n.NumberFormatSymbols_kam', 'goog.i18n.NumberFormatSymbols_kam_KE', 'goog.i18n.NumberFormatSymbols_kcg', 'goog.i18n.NumberFormatSymbols_kcg_NG', 'goog.i18n.NumberFormatSymbols_kfo', 'goog.i18n.NumberFormatSymbols_kfo_CI', 'goog.i18n.NumberFormatSymbols_kk', 'goog.i18n.NumberFormatSymbols_kk_Cyrl', 'goog.i18n.NumberFormatSymbols_kk_Cyrl_KZ', 'goog.i18n.NumberFormatSymbols_kk_KZ', 'goog.i18n.NumberFormatSymbols_kl', 'goog.i18n.NumberFormatSymbols_kl_GL', 'goog.i18n.NumberFormatSymbols_km', 'goog.i18n.NumberFormatSymbols_km_KH', 'goog.i18n.NumberFormatSymbols_kn', 'goog.i18n.NumberFormatSymbols_kn_IN', 'goog.i18n.NumberFormatSymbols_ko', 'goog.i18n.NumberFormatSymbols_ko_KR', 'goog.i18n.NumberFormatSymbols_kok', 'goog.i18n.NumberFormatSymbols_kok_IN', 'goog.i18n.NumberFormatSymbols_kpe', 'goog.i18n.NumberFormatSymbols_kpe_GN', 'goog.i18n.NumberFormatSymbols_kpe_LR', 'goog.i18n.NumberFormatSymbols_ku', 'goog.i18n.NumberFormatSymbols_ku_Arab', 'goog.i18n.NumberFormatSymbols_ku_Arab_IQ', 'goog.i18n.NumberFormatSymbols_ku_Arab_IR', 'goog.i18n.NumberFormatSymbols_ku_Arab_SY', 'goog.i18n.NumberFormatSymbols_ku_IQ', 'goog.i18n.NumberFormatSymbols_ku_IR', 'goog.i18n.NumberFormatSymbols_ku_Latn', 'goog.i18n.NumberFormatSymbols_ku_Latn_TR', 'goog.i18n.NumberFormatSymbols_ku_SY', 'goog.i18n.NumberFormatSymbols_ku_TR', 'goog.i18n.NumberFormatSymbols_kw', 'goog.i18n.NumberFormatSymbols_kw_GB', 'goog.i18n.NumberFormatSymbols_ky', 'goog.i18n.NumberFormatSymbols_ky_KG', 'goog.i18n.NumberFormatSymbols_ln', 'goog.i18n.NumberFormatSymbols_ln_CD', 'goog.i18n.NumberFormatSymbols_ln_CG', 'goog.i18n.NumberFormatSymbols_lo', 'goog.i18n.NumberFormatSymbols_lo_LA', 'goog.i18n.NumberFormatSymbols_lt', 'goog.i18n.NumberFormatSymbols_lt_LT', 'goog.i18n.NumberFormatSymbols_lv', 'goog.i18n.NumberFormatSymbols_lv_LV', 'goog.i18n.NumberFormatSymbols_mk', 'goog.i18n.NumberFormatSymbols_mk_MK', 'goog.i18n.NumberFormatSymbols_ml', 'goog.i18n.NumberFormatSymbols_ml_IN', 'goog.i18n.NumberFormatSymbols_mn', 'goog.i18n.NumberFormatSymbols_mn_CN', 'goog.i18n.NumberFormatSymbols_mn_Cyrl', 'goog.i18n.NumberFormatSymbols_mn_Cyrl_MN', 'goog.i18n.NumberFormatSymbols_mn_MN', 'goog.i18n.NumberFormatSymbols_mn_Mong', 'goog.i18n.NumberFormatSymbols_mn_Mong_CN', 'goog.i18n.NumberFormatSymbols_mo', 'goog.i18n.NumberFormatSymbols_mr', 'goog.i18n.NumberFormatSymbols_mr_IN', 'goog.i18n.NumberFormatSymbols_ms', 'goog.i18n.NumberFormatSymbols_ms_BN', 'goog.i18n.NumberFormatSymbols_ms_MY', 'goog.i18n.NumberFormatSymbols_mt', 'goog.i18n.NumberFormatSymbols_mt_MT', 'goog.i18n.NumberFormatSymbols_my', 'goog.i18n.NumberFormatSymbols_my_MM', 'goog.i18n.NumberFormatSymbols_nb', 'goog.i18n.NumberFormatSymbols_nb_NO', 'goog.i18n.NumberFormatSymbols_nds', 'goog.i18n.NumberFormatSymbols_nds_DE', 'goog.i18n.NumberFormatSymbols_ne', 'goog.i18n.NumberFormatSymbols_ne_IN', 'goog.i18n.NumberFormatSymbols_ne_NP', 'goog.i18n.NumberFormatSymbols_nl', 'goog.i18n.NumberFormatSymbols_nl_BE', 'goog.i18n.NumberFormatSymbols_nl_NL', 'goog.i18n.NumberFormatSymbols_nn', 'goog.i18n.NumberFormatSymbols_nn_NO', 'goog.i18n.NumberFormatSymbols_no', 'goog.i18n.NumberFormatSymbols_nr', 'goog.i18n.NumberFormatSymbols_nr_ZA', 'goog.i18n.NumberFormatSymbols_nso', 'goog.i18n.NumberFormatSymbols_nso_ZA', 'goog.i18n.NumberFormatSymbols_ny', 'goog.i18n.NumberFormatSymbols_ny_MW', 'goog.i18n.NumberFormatSymbols_oc', 'goog.i18n.NumberFormatSymbols_oc_FR', 'goog.i18n.NumberFormatSymbols_om', 'goog.i18n.NumberFormatSymbols_om_ET', 'goog.i18n.NumberFormatSymbols_om_KE', 'goog.i18n.NumberFormatSymbols_or', 'goog.i18n.NumberFormatSymbols_or_IN', 'goog.i18n.NumberFormatSymbols_pa', 'goog.i18n.NumberFormatSymbols_pa_Arab', 'goog.i18n.NumberFormatSymbols_pa_Arab_PK', 'goog.i18n.NumberFormatSymbols_pa_Guru', 'goog.i18n.NumberFormatSymbols_pa_Guru_IN', 'goog.i18n.NumberFormatSymbols_pa_IN', 'goog.i18n.NumberFormatSymbols_pa_PK', 'goog.i18n.NumberFormatSymbols_pl', 'goog.i18n.NumberFormatSymbols_pl_PL', 'goog.i18n.NumberFormatSymbols_ps', 'goog.i18n.NumberFormatSymbols_ps_AF', 'goog.i18n.NumberFormatSymbols_pt', 'goog.i18n.NumberFormatSymbols_pt_BR', 'goog.i18n.NumberFormatSymbols_pt_PT', 'goog.i18n.NumberFormatSymbols_ro', 'goog.i18n.NumberFormatSymbols_ro_MD', 'goog.i18n.NumberFormatSymbols_ro_RO', 'goog.i18n.NumberFormatSymbols_ru', 'goog.i18n.NumberFormatSymbols_ru_RU', 'goog.i18n.NumberFormatSymbols_ru_UA', 'goog.i18n.NumberFormatSymbols_rw', 'goog.i18n.NumberFormatSymbols_rw_RW', 'goog.i18n.NumberFormatSymbols_sa', 'goog.i18n.NumberFormatSymbols_sa_IN', 'goog.i18n.NumberFormatSymbols_se', 'goog.i18n.NumberFormatSymbols_se_FI', 'goog.i18n.NumberFormatSymbols_se_NO', 'goog.i18n.NumberFormatSymbols_sh', 'goog.i18n.NumberFormatSymbols_sh_BA', 'goog.i18n.NumberFormatSymbols_sh_CS', 'goog.i18n.NumberFormatSymbols_sh_YU', 'goog.i18n.NumberFormatSymbols_si', 'goog.i18n.NumberFormatSymbols_si_LK', 'goog.i18n.NumberFormatSymbols_sid', 'goog.i18n.NumberFormatSymbols_sid_ET', 'goog.i18n.NumberFormatSymbols_sk', 'goog.i18n.NumberFormatSymbols_sk_SK', 'goog.i18n.NumberFormatSymbols_sl', 'goog.i18n.NumberFormatSymbols_sl_SI', 'goog.i18n.NumberFormatSymbols_so', 'goog.i18n.NumberFormatSymbols_so_DJ', 'goog.i18n.NumberFormatSymbols_so_ET', 'goog.i18n.NumberFormatSymbols_so_KE', 'goog.i18n.NumberFormatSymbols_so_SO', 'goog.i18n.NumberFormatSymbols_sq', 'goog.i18n.NumberFormatSymbols_sq_AL', 'goog.i18n.NumberFormatSymbols_sr', 'goog.i18n.NumberFormatSymbols_sr_BA', 'goog.i18n.NumberFormatSymbols_sr_CS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_BA', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_CS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_ME', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_RS', 'goog.i18n.NumberFormatSymbols_sr_Cyrl_YU', 'goog.i18n.NumberFormatSymbols_sr_Latn', 'goog.i18n.NumberFormatSymbols_sr_Latn_BA', 'goog.i18n.NumberFormatSymbols_sr_Latn_CS', 'goog.i18n.NumberFormatSymbols_sr_Latn_ME', 'goog.i18n.NumberFormatSymbols_sr_Latn_RS', 'goog.i18n.NumberFormatSymbols_sr_Latn_YU', 'goog.i18n.NumberFormatSymbols_sr_ME', 'goog.i18n.NumberFormatSymbols_sr_RS', 'goog.i18n.NumberFormatSymbols_sr_YU', 'goog.i18n.NumberFormatSymbols_ss', 'goog.i18n.NumberFormatSymbols_ss_SZ', 'goog.i18n.NumberFormatSymbols_ss_ZA', 'goog.i18n.NumberFormatSymbols_st', 'goog.i18n.NumberFormatSymbols_st_LS', 'goog.i18n.NumberFormatSymbols_st_ZA', 'goog.i18n.NumberFormatSymbols_sv', 'goog.i18n.NumberFormatSymbols_sv_FI', 'goog.i18n.NumberFormatSymbols_sv_SE', 'goog.i18n.NumberFormatSymbols_sw', 'goog.i18n.NumberFormatSymbols_sw_KE', 'goog.i18n.NumberFormatSymbols_sw_TZ', 'goog.i18n.NumberFormatSymbols_syr', 'goog.i18n.NumberFormatSymbols_syr_SY', 'goog.i18n.NumberFormatSymbols_ta', 'goog.i18n.NumberFormatSymbols_ta_IN', 'goog.i18n.NumberFormatSymbols_te', 'goog.i18n.NumberFormatSymbols_te_IN', 'goog.i18n.NumberFormatSymbols_tg', 'goog.i18n.NumberFormatSymbols_tg_Cyrl', 'goog.i18n.NumberFormatSymbols_tg_Cyrl_TJ', 'goog.i18n.NumberFormatSymbols_tg_TJ', 'goog.i18n.NumberFormatSymbols_th', 'goog.i18n.NumberFormatSymbols_th_TH', 'goog.i18n.NumberFormatSymbols_ti', 'goog.i18n.NumberFormatSymbols_ti_ER', 'goog.i18n.NumberFormatSymbols_ti_ET', 'goog.i18n.NumberFormatSymbols_tig', 'goog.i18n.NumberFormatSymbols_tig_ER', 'goog.i18n.NumberFormatSymbols_tl', 'goog.i18n.NumberFormatSymbols_tl_PH', 'goog.i18n.NumberFormatSymbols_tn', 'goog.i18n.NumberFormatSymbols_tn_ZA', 'goog.i18n.NumberFormatSymbols_to', 'goog.i18n.NumberFormatSymbols_to_TO', 'goog.i18n.NumberFormatSymbols_tr', 'goog.i18n.NumberFormatSymbols_tr_TR', 'goog.i18n.NumberFormatSymbols_trv', 'goog.i18n.NumberFormatSymbols_trv_TW', 'goog.i18n.NumberFormatSymbols_ts', 'goog.i18n.NumberFormatSymbols_ts_ZA', 'goog.i18n.NumberFormatSymbols_tt', 'goog.i18n.NumberFormatSymbols_tt_RU', 'goog.i18n.NumberFormatSymbols_ug', 'goog.i18n.NumberFormatSymbols_ug_Arab', 'goog.i18n.NumberFormatSymbols_ug_Arab_CN', 'goog.i18n.NumberFormatSymbols_ug_CN', 'goog.i18n.NumberFormatSymbols_uk', 'goog.i18n.NumberFormatSymbols_uk_UA', 'goog.i18n.NumberFormatSymbols_ur', 'goog.i18n.NumberFormatSymbols_ur_IN', 'goog.i18n.NumberFormatSymbols_ur_PK', 'goog.i18n.NumberFormatSymbols_uz', 'goog.i18n.NumberFormatSymbols_uz_AF', 'goog.i18n.NumberFormatSymbols_uz_Arab', 'goog.i18n.NumberFormatSymbols_uz_Arab_AF', 'goog.i18n.NumberFormatSymbols_uz_Cyrl', 'goog.i18n.NumberFormatSymbols_uz_Cyrl_UZ', 'goog.i18n.NumberFormatSymbols_uz_Latn', 'goog.i18n.NumberFormatSymbols_uz_Latn_UZ', 'goog.i18n.NumberFormatSymbols_uz_UZ', 'goog.i18n.NumberFormatSymbols_ve', 'goog.i18n.NumberFormatSymbols_ve_ZA', 'goog.i18n.NumberFormatSymbols_vi', 'goog.i18n.NumberFormatSymbols_vi_VN', 'goog.i18n.NumberFormatSymbols_wal', 'goog.i18n.NumberFormatSymbols_wal_ET', 'goog.i18n.NumberFormatSymbols_wo', 'goog.i18n.NumberFormatSymbols_wo_Latn', 'goog.i18n.NumberFormatSymbols_wo_Latn_SN', 'goog.i18n.NumberFormatSymbols_wo_SN', 'goog.i18n.NumberFormatSymbols_xh', 'goog.i18n.NumberFormatSymbols_xh_ZA', 'goog.i18n.NumberFormatSymbols_yo', 'goog.i18n.NumberFormatSymbols_yo_NG', 'goog.i18n.NumberFormatSymbols_zh', 'goog.i18n.NumberFormatSymbols_zh_CN', 'goog.i18n.NumberFormatSymbols_zh_HK', 'goog.i18n.NumberFormatSymbols_zh_Hans', 'goog.i18n.NumberFormatSymbols_zh_Hans_CN', 'goog.i18n.NumberFormatSymbols_zh_Hans_HK', 'goog.i18n.NumberFormatSymbols_zh_Hans_MO', 'goog.i18n.NumberFormatSymbols_zh_Hans_SG', 'goog.i18n.NumberFormatSymbols_zh_Hant', 'goog.i18n.NumberFormatSymbols_zh_Hant_HK', 'goog.i18n.NumberFormatSymbols_zh_Hant_MO', 'goog.i18n.NumberFormatSymbols_zh_Hant_TW', 'goog.i18n.NumberFormatSymbols_zh_MO', 'goog.i18n.NumberFormatSymbols_zh_SG', 'goog.i18n.NumberFormatSymbols_zh_TW', 'goog.i18n.NumberFormatSymbols_zu', 'goog.i18n.NumberFormatSymbols_zu_ZA'], []);
goog.addDependency('i18n/pluralrules.js', ['goog.i18n.pluralRules'], []);
goog.addDependency('i18n/timezone.js', ['goog.i18n.TimeZone'], ['goog.array', 'goog.date.DateLike', 'goog.string']);
goog.addDependency('i18n/uchar.js', ['goog.i18n.uChar'], []);
goog.addDependency('iter/iter.js', ['goog.iter', 'goog.iter.Iterator', 'goog.iter.StopIteration'], ['goog.array', 'goog.asserts']);
goog.addDependency('json/json.js', ['goog.json', 'goog.json.Serializer'], []);
goog.addDependency('locale/countries.js', ['goog.locale.countries'], []);
goog.addDependency('locale/defaultlocalenameconstants.js', ['goog.locale.defaultLocaleNameConstants'], []);
goog.addDependency('locale/genericfontnames.js', ['goog.locale.genericFontNames'], []);
goog.addDependency('locale/genericfontnamesdata.js', ['goog.locale.genericFontNamesData'], ['goog.locale']);
goog.addDependency('locale/locale.js', ['goog.locale'], ['goog.locale.nativeNameConstants']);
goog.addDependency('locale/nativenameconstants.js', ['goog.locale.nativeNameConstants'], []);
goog.addDependency('locale/scriptToLanguages.js', ['goog.locale.scriptToLanguages'], ['goog.locale']);
goog.addDependency('locale/timezonedetection.js', ['goog.locale.timeZoneDetection'], ['goog.locale', 'goog.locale.TimeZoneFingerprint']);
goog.addDependency('locale/timezonefingerprint.js', ['goog.locale.TimeZoneFingerprint'], ['goog.locale']);
goog.addDependency('locale/timezonelist.js', ['goog.locale.TimeZoneList'], ['goog.locale']);
goog.addDependency('math/bezier.js', ['goog.math.Bezier'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/box.js', ['goog.math.Box'], ['goog.math.Coordinate']);
goog.addDependency('math/coordinate.js', ['goog.math.Coordinate'], []);
goog.addDependency('math/coordinate3.js', ['goog.math.Coordinate3'], []);
goog.addDependency('math/integer.js', ['goog.math.Integer'], []);
goog.addDependency('math/line.js', ['goog.math.Line'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/long.js', ['goog.math.Long'], []);
goog.addDependency('math/math.js', ['goog.math'], ['goog.array']);
goog.addDependency('math/matrix.js', ['goog.math.Matrix'], ['goog.array', 'goog.math', 'goog.math.Size']);
goog.addDependency('math/range.js', ['goog.math.Range'], []);
goog.addDependency('math/rangeset.js', ['goog.math.RangeSet'], ['goog.array', 'goog.iter.Iterator', 'goog.iter.StopIteration', 'goog.math.Range']);
goog.addDependency('math/rect.js', ['goog.math.Rect'], ['goog.math.Box', 'goog.math.Size']);
goog.addDependency('math/size.js', ['goog.math.Size'], []);
goog.addDependency('math/vec2.js', ['goog.math.Vec2'], ['goog.math', 'goog.math.Coordinate']);
goog.addDependency('math/vec3.js', ['goog.math.Vec3'], ['goog.math', 'goog.math.Coordinate3']);
goog.addDependency('memoize/memoize.js', ['goog.memoize'], []);
goog.addDependency('messaging/abstractchannel.js', ['goog.messaging.AbstractChannel'], ['goog.Disposable', 'goog.debug', 'goog.debug.Logger', 'goog.json', 'goog.messaging.MessageChannel']);
goog.addDependency('messaging/bufferedchannel.js', ['goog.messaging.BufferedChannel'], ['goog.Timer', 'goog.Uri', 'goog.debug.Error', 'goog.debug.Logger', 'goog.events', 'goog.messaging.MessageChannel', 'goog.messaging.MultiChannel']);
goog.addDependency('messaging/deferredchannel.js', ['goog.messaging.DeferredChannel'], ['goog.async.Deferred', 'goog.messaging.MessageChannel']);
goog.addDependency('messaging/loggerclient.js', ['goog.messaging.LoggerClient'], ['goog.Disposable', 'goog.debug', 'goog.debug.LogManager', 'goog.debug.Logger']);
goog.addDependency('messaging/loggerserver.js', ['goog.messaging.LoggerServer'], ['goog.Disposable', 'goog.debug.Logger']);
goog.addDependency('messaging/messagechannel.js', ['goog.messaging.MessageChannel'], []);
goog.addDependency('messaging/messaging.js', ['goog.messaging'], ['goog.messaging.MessageChannel']);
goog.addDependency('messaging/multichannel.js', ['goog.messaging.MultiChannel', 'goog.messaging.MultiChannel.VirtualChannel'], ['goog.Disposable', 'goog.debug.Logger', 'goog.events.EventHandler', 'goog.messaging.MessageChannel', 'goog.object']);
goog.addDependency('module/abstractmoduleloader.js', ['goog.module.AbstractModuleLoader'], []);
goog.addDependency('module/basemodule.js', ['goog.module.BaseModule'], ['goog.Disposable']);
goog.addDependency('module/basemoduleloader.js', ['goog.module.BaseModuleLoader'], ['goog.Disposable', 'goog.debug.Logger', 'goog.module.AbstractModuleLoader']);
goog.addDependency('module/loader.js', ['goog.module.Loader'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.object']);
goog.addDependency('module/module.js', ['goog.module'], ['goog.array', 'goog.module.Loader']);
goog.addDependency('module/moduleinfo.js', ['goog.module.ModuleInfo'], ['goog.Disposable', 'goog.functions', 'goog.module.BaseModule', 'goog.module.ModuleLoadCallback']);
goog.addDependency('module/moduleloadcallback.js', ['goog.module.ModuleLoadCallback'], ['goog.debug.entryPointRegistry', 'goog.debug.errorHandlerWeakDep']);
goog.addDependency('module/moduleloader.js', ['goog.module.ModuleLoader'], ['goog.array', 'goog.debug.Logger', 'goog.dom', 'goog.events.EventHandler', 'goog.module.BaseModuleLoader', 'goog.net.BulkLoader', 'goog.net.EventType', 'goog.userAgent']);
goog.addDependency('module/modulemanager.js', ['goog.module.ModuleManager', 'goog.module.ModuleManager.FailureType'], ['goog.Disposable', 'goog.array', 'goog.asserts', 'goog.async.Deferred', 'goog.debug.Logger', 'goog.debug.Trace', 'goog.module.AbstractModuleLoader', 'goog.module.ModuleInfo', 'goog.module.ModuleLoadCallback']);
goog.addDependency('module/testdata/modA_1.js', ['goog.module.testdata.modA_1'], []);
goog.addDependency('module/testdata/modA_2.js', ['goog.module.testdata.modA_2'], ['goog.module.ModuleManager']);
goog.addDependency('module/testdata/modB_1.js', ['goog.module.testdata.modB_1'], ['goog.module.ModuleManager']);
goog.addDependency('net/browserchannel.js', ['goog.net.BrowserChannel', 'goog.net.BrowserChannel.Error', 'goog.net.BrowserChannel.Handler', 'goog.net.BrowserChannel.LogSaver', 'goog.net.BrowserChannel.QueuedMap', 'goog.net.BrowserChannel.StatEvent', 'goog.net.BrowserChannel.TimingEvent'], ['goog.Uri', 'goog.array', 'goog.debug.TextFormatter', 'goog.events.Event', 'goog.events.EventTarget', 'goog.json', 'goog.net.BrowserTestChannel', 'goog.net.ChannelDebug', 'goog.net.ChannelRequest', 'goog.net.XhrIo', 'goog.string', 'goog.structs.CircularBuffer', 'goog.userAgent']);
goog.addDependency('net/browsertestchannel.js', ['goog.net.BrowserTestChannel'], ['goog.net.ChannelDebug', 'goog.net.ChannelRequest', 'goog.userAgent']);
goog.addDependency('net/bulkloader.js', ['goog.net.BulkLoader'], ['goog.debug.Logger', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.net.BulkLoaderHelper', 'goog.net.EventType', 'goog.net.XhrIo']);
goog.addDependency('net/bulkloaderhelper.js', ['goog.net.BulkLoaderHelper'], ['goog.Disposable', 'goog.debug.Logger']);
goog.addDependency('net/channeldebug.js', ['goog.net.ChannelDebug'], ['goog.debug.Logger', 'goog.json']);
goog.addDependency('net/channelrequest.js', ['goog.net.ChannelRequest'], ['goog.Timer', 'goog.Uri', 'goog.events.EventHandler', 'goog.net.XhrIo', 'goog.net.XmlHttp', 'goog.net.tmpnetwork', 'goog.object', 'goog.userAgent']);
goog.addDependency('net/cookies.js', ['goog.net.Cookies', 'goog.net.cookies'], ['goog.userAgent']);
goog.addDependency('net/crossdomainrpc.js', ['goog.net.CrossDomainRpc'], ['goog.Uri.QueryData', 'goog.debug.Logger', 'goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.json', 'goog.net.EventType', 'goog.userAgent']);
goog.addDependency('net/errorcode.js', ['goog.net.ErrorCode'], []);
goog.addDependency('net/eventtype.js', ['goog.net.EventType'], []);
goog.addDependency('net/iframeio.js', ['goog.net.IframeIo', 'goog.net.IframeIo.IncrementalDataEvent'], ['goog.Timer', 'goog.Uri', 'goog.debug', 'goog.debug.Logger', 'goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.xhrMonitor', 'goog.reflect', 'goog.string', 'goog.structs', 'goog.userAgent']);
goog.addDependency('net/iframeloadmonitor.js', ['goog.net.IframeLoadMonitor'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.userAgent']);
goog.addDependency('net/imageloader.js', ['goog.net.ImageLoader'], ['goog.dom', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.net.EventType', 'goog.object', 'goog.userAgent']);
goog.addDependency('net/jsonp.js', ['goog.net.Jsonp'], ['goog.Uri', 'goog.dom']);
goog.addDependency('net/mockiframeio.js', ['goog.net.MockIFrameIo'], ['goog.events.EventTarget', 'goog.net.ErrorCode', 'goog.net.IframeIo', 'goog.net.IframeIo.IncrementalDataEvent']);
goog.addDependency('net/mockxhrlite.js', ['goog.net.MockXhrLite'], ['goog.testing.net.XhrIo']);
goog.addDependency('net/multiiframeloadmonitor.js', ['goog.net.MultiIframeLoadMonitor'], ['goog.net.IframeLoadMonitor']);
goog.addDependency('net/networktester.js', ['goog.net.NetworkTester'], ['goog.Timer', 'goog.Uri', 'goog.debug.Logger']);
goog.addDependency('net/tmpnetwork.js', ['goog.net.tmpnetwork'], ['goog.Uri', 'goog.net.ChannelDebug']);
goog.addDependency('net/wrapperxmlhttpfactory.js', ['goog.net.WrapperXmlHttpFactory'], ['goog.net.XmlHttpFactory']);
goog.addDependency('net/xhrio.js', ['goog.net.XhrIo', 'goog.net.XhrIo.ResponseType'], ['goog.Timer', 'goog.debug.Logger', 'goog.debug.entryPointRegistry', 'goog.debug.errorHandlerWeakDep', 'goog.events.EventTarget', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.XmlHttp', 'goog.net.xhrMonitor', 'goog.object', 'goog.structs', 'goog.structs.Map', 'goog.uri.utils']);
goog.addDependency('net/xhriopool.js', ['goog.net.XhrIoPool'], ['goog.net.XhrIo', 'goog.structs', 'goog.structs.PriorityPool']);
goog.addDependency('net/xhrlite.js', ['goog.net.XhrLite'], ['goog.net.XhrIo']);
goog.addDependency('net/xhrlitepool.js', ['goog.net.XhrLitePool'], ['goog.net.XhrIoPool']);
goog.addDependency('net/xhrmanager.js', ['goog.net.XhrManager', 'goog.net.XhrManager.Event', 'goog.net.XhrManager.Request'], ['goog.Disposable', 'goog.events', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.net.EventType', 'goog.net.XhrIo', 'goog.net.XhrIoPool', 'goog.structs.Map']);
goog.addDependency('net/xhrmonitor.js', ['goog.net.xhrMonitor'], ['goog.array', 'goog.debug.Logger', 'goog.userAgent']);
goog.addDependency('net/xmlhttp.js', ['goog.net.DefaultXmlHttpFactory', 'goog.net.XmlHttp', 'goog.net.XmlHttp.OptionType', 'goog.net.XmlHttp.ReadyState'], ['goog.net.WrapperXmlHttpFactory', 'goog.net.XmlHttpFactory']);
goog.addDependency('net/xmlhttpfactory.js', ['goog.net.XmlHttpFactory'], []);
goog.addDependency('net/xpc/crosspagechannel.js', ['goog.net.xpc.CrossPageChannel', 'goog.net.xpc.CrossPageChannel.Role'], ['goog.Disposable', 'goog.Uri', 'goog.dom', 'goog.events', 'goog.json', 'goog.messaging.AbstractChannel', 'goog.net.xpc', 'goog.net.xpc.FrameElementMethodTransport', 'goog.net.xpc.IframePollingTransport', 'goog.net.xpc.IframeRelayTransport', 'goog.net.xpc.NativeMessagingTransport', 'goog.net.xpc.NixTransport', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/frameelementmethodtransport.js', ['goog.net.xpc.FrameElementMethodTransport'], ['goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/iframepollingtransport.js', ['goog.net.xpc.IframePollingTransport', 'goog.net.xpc.IframePollingTransport.Receiver', 'goog.net.xpc.IframePollingTransport.Sender'], ['goog.array', 'goog.dom', 'goog.net.xpc', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/iframerelaytransport.js', ['goog.net.xpc.IframeRelayTransport'], ['goog.dom', 'goog.events', 'goog.net.xpc', 'goog.net.xpc.Transport', 'goog.userAgent']);
goog.addDependency('net/xpc/nativemessagingtransport.js', ['goog.net.xpc.NativeMessagingTransport'], ['goog.events', 'goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/nixtransport.js', ['goog.net.xpc.NixTransport'], ['goog.net.xpc', 'goog.net.xpc.Transport']);
goog.addDependency('net/xpc/relay.js', ['goog.net.xpc.relay'], []);
goog.addDependency('net/xpc/transport.js', ['goog.net.xpc.Transport'], ['goog.Disposable', 'goog.net.xpc']);
goog.addDependency('net/xpc/xpc.js', ['goog.net.xpc', 'goog.net.xpc.CfgFields', 'goog.net.xpc.ChannelStates', 'goog.net.xpc.TransportNames', 'goog.net.xpc.TransportTypes', 'goog.net.xpc.UriCfgFields'], ['goog.debug.Logger']);
goog.addDependency('object/object.js', ['goog.object'], []);
goog.addDependency('positioning/absoluteposition.js', ['goog.positioning.AbsolutePosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/abstractposition.js', ['goog.positioning.AbstractPosition'], ['goog.math.Box', 'goog.math.Size', 'goog.positioning.Corner']);
goog.addDependency('positioning/anchoredposition.js', ['goog.positioning.AnchoredPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/anchoredviewportposition.js', ['goog.positioning.AnchoredViewportPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus']);
goog.addDependency('positioning/clientposition.js', ['goog.positioning.ClientPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AbstractPosition']);
goog.addDependency('positioning/menuanchoredposition.js', ['goog.positioning.MenuAnchoredPosition'], ['goog.math.Box', 'goog.math.Size', 'goog.positioning', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow']);
goog.addDependency('positioning/positioning.js', ['goog.positioning', 'goog.positioning.Corner', 'goog.positioning.CornerBit', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus'], ['goog.dom', 'goog.dom.TagName', 'goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.style']);
goog.addDependency('positioning/viewportclientposition.js', ['goog.positioning.ViewportClientPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning.ClientPosition']);
goog.addDependency('positioning/viewportposition.js', ['goog.positioning.ViewportPosition'], ['goog.math.Box', 'goog.math.Coordinate', 'goog.math.Size', 'goog.positioning.AbstractPosition']);
goog.addDependency('proto/proto.js', ['goog.proto'], ['goog.proto.Serializer']);
goog.addDependency('proto/serializer.js', ['goog.proto.Serializer'], ['goog.json.Serializer', 'goog.string']);
goog.addDependency('proto2/descriptor.js', ['goog.proto2.Descriptor', 'goog.proto2.Metadata'], ['goog.array', 'goog.object', 'goog.proto2.Util']);
goog.addDependency('proto2/fielddescriptor.js', ['goog.proto2.FieldDescriptor'], ['goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/lazydeserializer.js', ['goog.proto2.LazyDeserializer'], ['goog.proto2.Serializer', 'goog.proto2.Util']);
goog.addDependency('proto2/message.js', ['goog.proto2.Message'], ['goog.proto2.Descriptor', 'goog.proto2.FieldDescriptor', 'goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/objectserializer.js', ['goog.proto2.ObjectSerializer'], ['goog.proto2.Serializer', 'goog.proto2.Util', 'goog.string']);
goog.addDependency('proto2/package_test.pb.js', ['someprotopackage.TestPackageTypes'], ['goog.proto2.Message', 'proto2.TestAllTypes']);
goog.addDependency('proto2/pbliteserializer.js', ['goog.proto2.PbLiteSerializer'], ['goog.proto2.LazyDeserializer', 'goog.proto2.Util']);
goog.addDependency('proto2/serializer.js', ['goog.proto2.Serializer'], ['goog.proto2.Descriptor', 'goog.proto2.FieldDescriptor', 'goog.proto2.Message', 'goog.proto2.Util']);
goog.addDependency('proto2/test.pb.js', ['proto2.TestAllTypes', 'proto2.TestAllTypes.NestedEnum', 'proto2.TestAllTypes.NestedMessage', 'proto2.TestAllTypes.OptionalGroup', 'proto2.TestAllTypes.RepeatedGroup'], ['goog.proto2.Message']);
goog.addDependency('proto2/util.js', ['goog.proto2.Util'], ['goog.asserts']);
goog.addDependency('pubsub/pubsub.js', ['goog.pubsub.PubSub'], ['goog.Disposable', 'goog.array']);
goog.addDependency('reflect/reflect.js', ['goog.reflect'], []);
goog.addDependency('spell/spellcheck.js', ['goog.spell.SpellCheck', 'goog.spell.SpellCheck.WordChangedEvent'], ['goog.Timer', 'goog.events.EventTarget', 'goog.structs.Set']);
goog.addDependency('string/path.js', ['goog.string.path'], ['goog.array', 'goog.string']);
goog.addDependency('string/string.js', ['goog.string', 'goog.string.Unicode'], []);
goog.addDependency('string/stringbuffer.js', ['goog.string.StringBuffer'], ['goog.userAgent.jscript']);
goog.addDependency('string/stringformat.js', ['goog.string.format'], ['goog.string']);
goog.addDependency('structs/avltree.js', ['goog.structs.AvlTree', 'goog.structs.AvlTree.Node'], ['goog.structs']);
goog.addDependency('structs/circularbuffer.js', ['goog.structs.CircularBuffer'], []);
goog.addDependency('structs/heap.js', ['goog.structs.Heap'], ['goog.array', 'goog.structs.Node']);
goog.addDependency('structs/inversionmap.js', ['goog.structs.InversionMap'], ['goog.array']);
goog.addDependency('structs/linkedmap.js', ['goog.structs.LinkedMap'], ['goog.structs.Map']);
goog.addDependency('structs/map.js', ['goog.structs.Map'], ['goog.iter.Iterator', 'goog.iter.StopIteration', 'goog.object', 'goog.structs']);
goog.addDependency('structs/node.js', ['goog.structs.Node'], []);
goog.addDependency('structs/pool.js', ['goog.structs.Pool'], ['goog.Disposable', 'goog.structs.Queue', 'goog.structs.Set']);
goog.addDependency('structs/prioritypool.js', ['goog.structs.PriorityPool'], ['goog.structs.Pool', 'goog.structs.PriorityQueue']);
goog.addDependency('structs/priorityqueue.js', ['goog.structs.PriorityQueue'], ['goog.structs', 'goog.structs.Heap']);
goog.addDependency('structs/quadtree.js', ['goog.structs.QuadTree', 'goog.structs.QuadTree.Node', 'goog.structs.QuadTree.Point'], ['goog.math.Coordinate']);
goog.addDependency('structs/queue.js', ['goog.structs.Queue'], ['goog.array']);
goog.addDependency('structs/set.js', ['goog.structs.Set'], ['goog.structs', 'goog.structs.Map']);
goog.addDependency('structs/simplepool.js', ['goog.structs.SimplePool'], ['goog.Disposable']);
goog.addDependency('structs/stringset.js', ['goog.structs.StringSet'], ['goog.iter']);
goog.addDependency('structs/structs.js', ['goog.structs'], ['goog.array', 'goog.object']);
goog.addDependency('structs/treenode.js', ['goog.structs.TreeNode'], ['goog.array', 'goog.asserts', 'goog.structs.Node']);
goog.addDependency('structs/trie.js', ['goog.structs.Trie'], ['goog.object', 'goog.structs']);
goog.addDependency('style/cursor.js', ['goog.style.cursor'], ['goog.userAgent']);
goog.addDependency('style/style.js', ['goog.style'], ['goog.array', 'goog.dom', 'goog.math.Box', 'goog.math.Coordinate', 'goog.math.Rect', 'goog.math.Size', 'goog.object', 'goog.userAgent']);
goog.addDependency('testing/asserts.js', ['goog.testing.JsUnitException', 'goog.testing.asserts'], ['goog.testing.stacktrace']);
goog.addDependency('testing/async/mockcontrol.js', ['goog.testing.async.MockControl'], ['goog.asserts', 'goog.async.Deferred', 'goog.debug', 'goog.testing.asserts', 'goog.testing.mockmatchers.IgnoreArgument']);
goog.addDependency('testing/asynctestcase.js', ['goog.testing.AsyncTestCase', 'goog.testing.AsyncTestCase.ControlBreakingException'], ['goog.testing.TestCase', 'goog.testing.TestCase.Test', 'goog.testing.asserts']);
goog.addDependency('testing/benchmark.js', ['goog.testing.benchmark'], ['goog.dom', 'goog.dom.TagName', 'goog.testing.PerformanceTable', 'goog.testing.PerformanceTimer', 'goog.testing.TestCase']);
goog.addDependency('testing/benchmarks/jsbinarysizebutton.js', ['goog.ui.benchmarks.jsbinarysizebutton'], ['goog.array', 'goog.dom', 'goog.events', 'goog.ui.Button', 'goog.ui.ButtonSide', 'goog.ui.Component.EventType', 'goog.ui.CustomButton']);
goog.addDependency('testing/benchmarks/jsbinarysizetoolbar.js', ['goog.ui.benchmarks.jsbinarysizetoolbar'], ['goog.array', 'goog.dom', 'goog.events', 'goog.object', 'goog.ui.Component.EventType', 'goog.ui.Option', 'goog.ui.Toolbar', 'goog.ui.ToolbarButton', 'goog.ui.ToolbarSelect', 'goog.ui.ToolbarSeparator']);
goog.addDependency('testing/continuationtestcase.js', ['goog.testing.ContinuationTestCase', 'goog.testing.ContinuationTestCase.Step', 'goog.testing.ContinuationTestCase.Test'], ['goog.array', 'goog.events.EventHandler', 'goog.testing.TestCase', 'goog.testing.TestCase.Test', 'goog.testing.asserts']);
goog.addDependency('testing/deferredtestcase.js', ['goog.testing.DeferredTestCase'], ['goog.async.Deferred', 'goog.testing.AsyncTestCase', 'goog.testing.TestCase']);
goog.addDependency('testing/dom.js', ['goog.testing.dom'], ['goog.dom', 'goog.dom.NodeIterator', 'goog.dom.NodeType', 'goog.dom.TagIterator', 'goog.dom.TagName', 'goog.dom.classes', 'goog.iter', 'goog.object', 'goog.string', 'goog.style', 'goog.testing.asserts', 'goog.userAgent']);
goog.addDependency('testing/editor/dom.js', ['goog.testing.editor.dom'], ['goog.dom.NodeType', 'goog.dom.TagIterator', 'goog.dom.TagWalkType', 'goog.iter', 'goog.string', 'goog.testing.asserts']);
goog.addDependency('testing/editor/fieldmock.js', ['goog.testing.editor.FieldMock'], ['goog.dom', 'goog.dom.Range', 'goog.editor.Field', 'goog.testing.LooseMock']);
goog.addDependency('testing/editor/testhelper.js', ['goog.testing.editor.TestHelper'], ['goog.Disposable', 'goog.dom.Range', 'goog.editor.BrowserFeature', 'goog.testing.dom']);
goog.addDependency('testing/events/eventobserver.js', ['goog.testing.events.EventObserver'], ['goog.array']);
goog.addDependency('testing/events/events.js', ['goog.testing.events', 'goog.testing.events.Event'], ['goog.events', 'goog.events.BrowserEvent', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.object', 'goog.style', 'goog.userAgent']);
goog.addDependency('testing/events/matchers.js', ['goog.testing.events.EventMatcher'], ['goog.events.Event', 'goog.testing.mockmatchers.ArgumentMatcher']);
goog.addDependency('testing/expectedfailures.js', ['goog.testing.ExpectedFailures'], ['goog.debug.DivConsole', 'goog.debug.Logger', 'goog.dom', 'goog.dom.TagName', 'goog.events', 'goog.events.EventType', 'goog.style', 'goog.testing.JsUnitException', 'goog.testing.TestCase', 'goog.testing.asserts']);
goog.addDependency('testing/fs/blob.js', ['goog.testing.fs.Blob'], []);
goog.addDependency('testing/fs/entry.js', ['goog.testing.fs.DirectoryEntry', 'goog.testing.fs.Entry', 'goog.testing.fs.FileEntry'], ['goog.Timer', 'goog.array', 'goog.async.Deferred', 'goog.fs.DirectoryEntry.Behavior', 'goog.fs.Error', 'goog.object', 'goog.testing.fs.File', 'goog.testing.fs.FileWriter']);
goog.addDependency('testing/fs/file.js', ['goog.testing.fs.File'], ['goog.testing.fs.Blob']);
goog.addDependency('testing/fs/filesystem.js', ['goog.testing.fs.FileSystem'], ['goog.testing.fs.DirectoryEntry']);
goog.addDependency('testing/fs/filewriter.js', ['goog.testing.fs.FileWriter', 'goog.testing.fs.FileWriter.ProgressEvent'], ['goog.Timer', 'goog.events.Event', 'goog.events.EventTarget', 'goog.fs.Error', 'goog.fs.FileSaver.EventType', 'goog.fs.FileSaver.ReadyState', 'goog.string']);
goog.addDependency('testing/fs/fs.js', ['goog.testing.fs'], ['goog.Timer', 'goog.array', 'goog.fs', 'goog.testing.fs.Blob', 'goog.testing.fs.FileSystem']);
goog.addDependency('testing/functionmock.js', ['goog.testing', 'goog.testing.FunctionMock', 'goog.testing.GlobalFunctionMock', 'goog.testing.MethodMock'], ['goog.object', 'goog.testing.MockInterface', 'goog.testing.PropertyReplacer', 'goog.testing.StrictMock']);
goog.addDependency('testing/graphics.js', ['goog.testing.graphics'], ['goog.graphics.Path.Segment', 'goog.testing.asserts']);
goog.addDependency('testing/jsunit.js', ['goog.testing.jsunit'], ['goog.testing.TestCase', 'goog.testing.TestRunner']);
goog.addDependency('testing/loosemock.js', ['goog.testing.LooseExpectationCollection', 'goog.testing.LooseMock'], ['goog.array', 'goog.structs.Map', 'goog.testing.Mock']);
goog.addDependency('testing/messaging/mockmessagechannel.js', ['goog.testing.messaging.MockMessageChannel'], ['goog.messaging.AbstractChannel', 'goog.testing.asserts']);
goog.addDependency('testing/mock.js', ['goog.testing.Mock', 'goog.testing.MockExpectation'], ['goog.array', 'goog.testing.JsUnitException', 'goog.testing.MockInterface', 'goog.testing.mockmatchers']);
goog.addDependency('testing/mockclassfactory.js', ['goog.testing.MockClassFactory', 'goog.testing.MockClassRecord'], ['goog.array', 'goog.object', 'goog.testing.LooseMock', 'goog.testing.StrictMock', 'goog.testing.TestCase', 'goog.testing.mockmatchers']);
goog.addDependency('testing/mockclock.js', ['goog.testing.MockClock'], ['goog.Disposable', 'goog.testing.PropertyReplacer']);
goog.addDependency('testing/mockcontrol.js', ['goog.testing.MockControl'], ['goog.array', 'goog.testing', 'goog.testing.LooseMock', 'goog.testing.MockInterface', 'goog.testing.StrictMock']);
goog.addDependency('testing/mockinterface.js', ['goog.testing.MockInterface'], []);
goog.addDependency('testing/mockmatchers.js', ['goog.testing.mockmatchers', 'goog.testing.mockmatchers.ArgumentMatcher', 'goog.testing.mockmatchers.IgnoreArgument', 'goog.testing.mockmatchers.InstanceOf', 'goog.testing.mockmatchers.ObjectEquals', 'goog.testing.mockmatchers.RegexpMatch', 'goog.testing.mockmatchers.SaveArgument', 'goog.testing.mockmatchers.TypeOf'], ['goog.array', 'goog.dom', 'goog.testing.asserts']);
goog.addDependency('testing/mockrandom.js', ['goog.testing.MockRandom'], ['goog.Disposable']);
goog.addDependency('testing/mockrange.js', ['goog.testing.MockRange'], ['goog.dom.AbstractRange', 'goog.testing.LooseMock']);
goog.addDependency('testing/mockuseragent.js', ['goog.testing.MockUserAgent'], ['goog.Disposable', 'goog.userAgent']);
goog.addDependency('testing/multitestrunner.js', ['goog.testing.MultiTestRunner', 'goog.testing.MultiTestRunner.TestFrame'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.dom.classes', 'goog.events.EventHandler', 'goog.functions', 'goog.string', 'goog.ui.Component', 'goog.ui.ServerChart', 'goog.ui.ServerChart.ChartType', 'goog.ui.TableSorter']);
goog.addDependency('testing/net/xhrio.js', ['goog.testing.net.XhrIo'], ['goog.array', 'goog.dom.xml', 'goog.events', 'goog.events.EventTarget', 'goog.json', 'goog.net.ErrorCode', 'goog.net.EventType', 'goog.net.XhrIo.ResponseType', 'goog.net.XmlHttp', 'goog.object', 'goog.structs.Map', 'goog.uri.utils']);
goog.addDependency('testing/objectpropertystring.js', ['goog.testing.ObjectPropertyString'], []);
goog.addDependency('testing/performancetable.js', ['goog.testing.PerformanceTable'], ['goog.dom', 'goog.testing.PerformanceTimer']);
goog.addDependency('testing/performancetimer.js', ['goog.testing.PerformanceTimer'], ['goog.array', 'goog.math']);
goog.addDependency('testing/propertyreplacer.js', ['goog.testing.PropertyReplacer'], ['goog.userAgent']);
goog.addDependency('testing/pseudorandom.js', ['goog.testing.PseudoRandom'], ['goog.Disposable']);
goog.addDependency('testing/recordfunction.js', ['goog.testing.FunctionCall', 'goog.testing.recordConstructor', 'goog.testing.recordFunction'], []);
goog.addDependency('testing/singleton.js', ['goog.testing.singleton'], ['goog.array']);
goog.addDependency('testing/stacktrace.js', ['goog.testing.stacktrace', 'goog.testing.stacktrace.Frame'], []);
goog.addDependency('testing/strictmock.js', ['goog.testing.StrictMock'], ['goog.array', 'goog.testing.Mock']);
goog.addDependency('testing/style/layoutasserts.js', ['goog.testing.style.layoutasserts'], ['goog.style', 'goog.testing.asserts']);
goog.addDependency('testing/testcase.js', ['goog.testing.TestCase', 'goog.testing.TestCase.Error', 'goog.testing.TestCase.Order', 'goog.testing.TestCase.Result', 'goog.testing.TestCase.Test'], ['goog.testing.asserts', 'goog.testing.stacktrace']);
goog.addDependency('testing/testqueue.js', ['goog.testing.TestQueue'], []);
goog.addDependency('testing/testrunner.js', ['goog.testing.TestRunner'], ['goog.testing.TestCase']);
goog.addDependency('testing/ui/rendererasserts.js', ['goog.testing.ui.rendererasserts'], ['goog.testing.asserts']);
goog.addDependency('testing/ui/rendererharness.js', ['goog.testing.ui.RendererHarness'], ['goog.Disposable', 'goog.dom.NodeType', 'goog.testing.asserts']);
goog.addDependency('testing/ui/style.js', ['goog.testing.ui.style'], ['goog.array', 'goog.dom', 'goog.dom.classes', 'goog.testing.asserts']);
goog.addDependency('timer/timer.js', ['goog.Timer'], ['goog.events.EventTarget']);
goog.addDependency('tweak/entries.js', ['goog.tweak.BaseEntry', 'goog.tweak.BasePrimitiveSetting', 'goog.tweak.BaseSetting', 'goog.tweak.BooleanGroup', 'goog.tweak.BooleanInGroupSetting', 'goog.tweak.BooleanSetting', 'goog.tweak.ButtonAction', 'goog.tweak.NumericSetting', 'goog.tweak.StringSetting'], ['goog.array', 'goog.asserts', 'goog.debug.Logger', 'goog.object']);
goog.addDependency('tweak/registry.js', ['goog.tweak.Registry'], ['goog.asserts', 'goog.debug.Logger', 'goog.object', 'goog.string', 'goog.tweak.BaseEntry', 'goog.uri.utils']);
goog.addDependency('tweak/testhelpers.js', ['goog.tweak.testhelpers'], ['goog.tweak']);
goog.addDependency('tweak/tweak.js', ['goog.tweak', 'goog.tweak.ConfigParams'], ['goog.asserts', 'goog.tweak.BooleanGroup', 'goog.tweak.BooleanInGroupSetting', 'goog.tweak.BooleanSetting', 'goog.tweak.ButtonAction', 'goog.tweak.NumericSetting', 'goog.tweak.Registry', 'goog.tweak.StringSetting']);
goog.addDependency('tweak/tweakui.js', ['goog.tweak.EntriesPanel', 'goog.tweak.TweakUi'], ['goog.array', 'goog.asserts', 'goog.dom.DomHelper', 'goog.object', 'goog.style', 'goog.tweak', 'goog.ui.Zippy', 'goog.userAgent']);
goog.addDependency('ui/abstractspellchecker.js', ['goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult'], ['goog.asserts', 'goog.dom', 'goog.dom.classes', 'goog.dom.selection', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.spell.SpellCheck', 'goog.structs.Set', 'goog.style', 'goog.ui.MenuItem', 'goog.ui.MenuSeparator', 'goog.ui.PopupMenu']);
goog.addDependency('ui/activitymonitor.js', ['goog.ui.ActivityMonitor'], ['goog.array', 'goog.dom', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency('ui/advancedtooltip.js', ['goog.ui.AdvancedTooltip'], ['goog.events.EventType', 'goog.math.Coordinate', 'goog.ui.Tooltip', 'goog.userAgent']);
goog.addDependency('ui/animatedzippy.js', ['goog.ui.AnimatedZippy'], ['goog.dom', 'goog.events', 'goog.fx.Animation', 'goog.fx.easing', 'goog.ui.Zippy', 'goog.ui.ZippyEvent']);
goog.addDependency('ui/attachablemenu.js', ['goog.ui.AttachableMenu'], ['goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.KeyCodes', 'goog.ui.ItemEvent', 'goog.ui.MenuBase']);
goog.addDependency('ui/autocomplete/arraymatcher.js', ['goog.ui.AutoComplete.ArrayMatcher'], ['goog.iter', 'goog.string', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/autocomplete.js', ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.EventType'], ['goog.events', 'goog.events.EventTarget']);
goog.addDependency('ui/autocomplete/basic.js', ['goog.ui.AutoComplete.Basic'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.ArrayMatcher', 'goog.ui.AutoComplete.InputHandler', 'goog.ui.AutoComplete.Renderer']);
goog.addDependency('ui/autocomplete/inputhandler.js', ['goog.ui.AutoComplete.InputHandler'], ['goog.Disposable', 'goog.Timer', 'goog.dom.a11y', 'goog.dom.selection', 'goog.events', 'goog.events.EventHandler', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.string', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/remote.js', ['goog.ui.AutoComplete.Remote'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.InputHandler', 'goog.ui.AutoComplete.RemoteArrayMatcher', 'goog.ui.AutoComplete.Renderer']);
goog.addDependency('ui/autocomplete/remotearraymatcher.js', ['goog.ui.AutoComplete.RemoteArrayMatcher'], ['goog.Disposable', 'goog.Uri', 'goog.events', 'goog.json', 'goog.net.XhrIo', 'goog.ui.AutoComplete']);
goog.addDependency('ui/autocomplete/renderer.js', ['goog.ui.AutoComplete.Renderer', 'goog.ui.AutoComplete.Renderer.CustomRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.iter', 'goog.string', 'goog.style', 'goog.ui.AutoComplete', 'goog.ui.IdGenerator', 'goog.userAgent']);
goog.addDependency('ui/autocomplete/richinputhandler.js', ['goog.ui.AutoComplete.RichInputHandler'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.InputHandler']);
goog.addDependency('ui/autocomplete/richremote.js', ['goog.ui.AutoComplete.RichRemote'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.Remote', 'goog.ui.AutoComplete.Renderer', 'goog.ui.AutoComplete.RichInputHandler', 'goog.ui.AutoComplete.RichRemoteArrayMatcher']);
goog.addDependency('ui/autocomplete/richremotearraymatcher.js', ['goog.ui.AutoComplete.RichRemoteArrayMatcher'], ['goog.ui.AutoComplete', 'goog.ui.AutoComplete.RemoteArrayMatcher']);
goog.addDependency('ui/basicmenu.js', ['goog.ui.BasicMenu', 'goog.ui.BasicMenu.Item', 'goog.ui.BasicMenu.Separator'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.events.EventType', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.ui.AttachableMenu', 'goog.ui.ItemEvent']);
goog.addDependency('ui/bidiinput.js', ['goog.ui.BidiInput'], ['goog.events', 'goog.events.InputHandler', 'goog.i18n.bidi', 'goog.ui.Component']);
goog.addDependency('ui/bubble.js', ['goog.ui.Bubble'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.events.Event', 'goog.events.EventType', 'goog.math.Box', 'goog.positioning', 'goog.positioning.AbsolutePosition', 'goog.positioning.AbstractPosition', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.Popup', 'goog.ui.Popup.AnchoredPosition']);
goog.addDependency('ui/button.js', ['goog.ui.Button', 'goog.ui.Button.Side'], ['goog.events.KeyCodes', 'goog.ui.ButtonRenderer', 'goog.ui.ButtonSide', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.NativeButtonRenderer']);
goog.addDependency('ui/buttonrenderer.js', ['goog.ui.ButtonRenderer'], ['goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.ui.ButtonSide', 'goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/buttonside.js', ['goog.ui.ButtonSide'], []);
goog.addDependency('ui/cccbutton.js', ['goog.ui.CccButton'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventType', 'goog.ui.DeprecatedButton', 'goog.userAgent']);
goog.addDependency('ui/charcounter.js', ['goog.ui.CharCounter', 'goog.ui.CharCounter.Display'], ['goog.dom', 'goog.events', 'goog.events.EventTarget', 'goog.events.InputHandler']);
goog.addDependency('ui/charpicker.js', ['goog.ui.CharPicker'], ['goog.array', 'goog.dom', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.events.KeyHandler', 'goog.i18n.CharListDecompressor', 'goog.i18n.uChar', 'goog.structs.Set', 'goog.style', 'goog.ui.Button', 'goog.ui.Component', 'goog.ui.ContainerScroller', 'goog.ui.FlatButtonRenderer', 'goog.ui.HoverCard', 'goog.ui.LabelInput', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuItem', 'goog.ui.Tooltip.ElementTooltipPosition']);
goog.addDependency('ui/checkbox.js', ['goog.ui.Checkbox', 'goog.ui.Checkbox.State'], ['goog.array', 'goog.dom.classes', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler.EventType', 'goog.object', 'goog.ui.Component.EventType', 'goog.ui.Control', 'goog.ui.registry']);
goog.addDependency('ui/checkboxmenuitem.js', ['goog.ui.CheckBoxMenuItem'], ['goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/colorbutton.js', ['goog.ui.ColorButton'], ['goog.ui.Button', 'goog.ui.ColorButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/colorbuttonrenderer.js', ['goog.ui.ColorButtonRenderer'], ['goog.dom.classes', 'goog.functions', 'goog.ui.ColorMenuButtonRenderer']);
goog.addDependency('ui/colormenubutton.js', ['goog.ui.ColorMenuButton'], ['goog.array', 'goog.object', 'goog.ui.ColorMenuButtonRenderer', 'goog.ui.ColorPalette', 'goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.registry']);
goog.addDependency('ui/colormenubuttonrenderer.js', ['goog.ui.ColorMenuButtonRenderer'], ['goog.color', 'goog.dom.classes', 'goog.ui.ControlContent', 'goog.ui.MenuButtonRenderer', 'goog.userAgent']);
goog.addDependency('ui/colorpalette.js', ['goog.ui.ColorPalette'], ['goog.array', 'goog.color', 'goog.dom', 'goog.style', 'goog.ui.Palette', 'goog.ui.PaletteRenderer']);
goog.addDependency('ui/colorpicker.js', ['goog.ui.ColorPicker', 'goog.ui.ColorPicker.EventType'], ['goog.ui.ColorPalette', 'goog.ui.Component', 'goog.ui.Component.State']);
goog.addDependency('ui/colorsplitbehavior.js', ['goog.ui.ColorSplitBehavior'], ['goog.ui.ColorButton', 'goog.ui.ColorMenuButton', 'goog.ui.SplitBehavior']);
goog.addDependency('ui/combobox.js', ['goog.ui.ComboBox', 'goog.ui.ComboBoxItem'], ['goog.Timer', 'goog.debug.Logger', 'goog.dom.classes', 'goog.events', 'goog.events.InputHandler', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.string', 'goog.style', 'goog.ui.Component', 'goog.ui.ItemEvent', 'goog.ui.LabelInput', 'goog.ui.Menu', 'goog.ui.MenuItem', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/component.js', ['goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State'], ['goog.array', 'goog.dom', 'goog.dom.DomHelper', 'goog.events', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.object', 'goog.style', 'goog.ui.IdGenerator']);
goog.addDependency('ui/container.js', ['goog.ui.Container', 'goog.ui.Container.EventType', 'goog.ui.Container.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ContainerRenderer']);
goog.addDependency('ui/containerrenderer.js', ['goog.ui.ContainerRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.string', 'goog.style', 'goog.ui.Separator', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/containerscroller.js', ['goog.ui.ContainerScroller'], ['goog.Timer', 'goog.events.EventHandler', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.Container.EventType']);
goog.addDependency('ui/control.js', ['goog.ui.Control'], ['goog.array', 'goog.dom', 'goog.events.BrowserEvent.MouseButton', 'goog.events.Event', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.string', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer', 'goog.ui.decorate', 'goog.ui.registry', 'goog.userAgent']);
goog.addDependency('ui/controlcontent.js', ['goog.ui.ControlContent'], []);
goog.addDependency('ui/controlrenderer.js', ['goog.ui.ControlRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.object', 'goog.style', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.userAgent']);
goog.addDependency('ui/cookieeditor.js', ['goog.ui.CookieEditor'], ['goog.dom', 'goog.dom.TagName', 'goog.events.EventType', 'goog.net.cookies', 'goog.string', 'goog.style', 'goog.ui.Component']);
goog.addDependency('ui/css3buttonrenderer.js', ['goog.ui.Css3ButtonRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.ui.Button', 'goog.ui.ButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/css3menubuttonrenderer.js', ['goog.ui.Css3MenuButtonRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.MenuButton', 'goog.ui.MenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/cssnames.js', ['goog.ui.INLINE_BLOCK_CLASSNAME'], []);
goog.addDependency('ui/custombutton.js', ['goog.ui.CustomButton'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/custombuttonrenderer.js', ['goog.ui.CustomButtonRenderer'], ['goog.dom', 'goog.dom.classes', 'goog.string', 'goog.ui.ButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME']);
goog.addDependency('ui/customcolorpalette.js', ['goog.ui.CustomColorPalette'], ['goog.color', 'goog.dom', 'goog.ui.ColorPalette']);
goog.addDependency('ui/datepicker.js', ['goog.ui.DatePicker', 'goog.ui.DatePicker.Events', 'goog.ui.DatePickerEvent'], ['goog.date', 'goog.date.Date', 'goog.date.Interval', 'goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventType', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.i18n.DateTimeFormat', 'goog.i18n.DateTimeSymbols', 'goog.style', 'goog.ui.Component']);
goog.addDependency('ui/decorate.js', ['goog.ui.decorate'], ['goog.ui.registry']);
goog.addDependency('ui/deprecatedbutton.js', ['goog.ui.DeprecatedButton'], ['goog.dom', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency('ui/dialog.js', ['goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.ButtonSet.DefaultButtons', 'goog.ui.Dialog.DefaultButtonCaptions', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.Event', 'goog.ui.Dialog.EventType'], ['goog.Timer', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.TagName', 'goog.dom.a11y', 'goog.dom.classes', 'goog.dom.iframe', 'goog.events', 'goog.events.EventType', 'goog.events.FocusHandler', 'goog.events.KeyCodes', 'goog.fx.Dragger', 'goog.math.Rect', 'goog.structs', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/dimensionpicker.js', ['goog.ui.DimensionPicker'], ['goog.events.EventType', 'goog.math.Size', 'goog.ui.Control', 'goog.ui.DimensionPickerRenderer', 'goog.ui.registry']);
goog.addDependency('ui/dimensionpickerrenderer.js', ['goog.ui.DimensionPickerRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.i18n.bidi', 'goog.style', 'goog.ui.ControlRenderer', 'goog.userAgent']);
goog.addDependency('ui/dragdropdetector.js', ['goog.ui.DragDropDetector', 'goog.ui.DragDropDetector.EventType', 'goog.ui.DragDropDetector.ImageDropEvent', 'goog.ui.DragDropDetector.LinkDropEvent'], ['goog.dom', 'goog.dom.TagName', 'goog.events.Event', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.math.Coordinate', 'goog.string', 'goog.style', 'goog.userAgent']);
goog.addDependency('ui/drilldownrow.js', ['goog.ui.DrilldownRow'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.ui.Component']);
goog.addDependency('ui/editor/abstractdialog.js', ['goog.ui.editor.AbstractDialog', 'goog.ui.editor.AbstractDialog.Builder', 'goog.ui.editor.AbstractDialog.EventType'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventTarget', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.Event', 'goog.ui.Dialog.EventType']);
goog.addDependency('ui/editor/bubble.js', ['goog.ui.editor.Bubble'], ['goog.debug.Logger', 'goog.dom', 'goog.dom.ViewportSizeMonitor', 'goog.editor.style', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.positioning', 'goog.string', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.PopupBase', 'goog.ui.PopupBase.EventType', 'goog.userAgent']);
goog.addDependency('ui/editor/defaulttoolbar.js', ['goog.ui.editor.DefaultToolbar'], ['goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.editor.Command', 'goog.string.StringBuffer', 'goog.style', 'goog.ui.ControlContent', 'goog.ui.editor.ToolbarFactory', 'goog.ui.editor.messages']);
goog.addDependency('ui/editor/linkdialog.js', ['goog.ui.editor.LinkDialog', 'goog.ui.editor.LinkDialog.BeforeTestLinkEvent', 'goog.ui.editor.LinkDialog.EventType', 'goog.ui.editor.LinkDialog.OkEvent'], ['goog.dom', 'goog.dom.DomHelper', 'goog.dom.TagName', 'goog.dom.classes', 'goog.dom.selection', 'goog.editor.BrowserFeature', 'goog.editor.Link', 'goog.editor.focus', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.events.InputHandler.EventType', 'goog.string', 'goog.style', 'goog.ui.Button', 'goog.ui.LinkButtonRenderer', 'goog.ui.editor.AbstractDialog', 'goog.ui.editor.AbstractDialog.Builder', 'goog.ui.editor.AbstractDialog.EventType', 'goog.ui.editor.TabPane', 'goog.ui.editor.messages', 'goog.userAgent', 'goog.window']);
goog.addDependency('ui/editor/messages.js', ['goog.ui.editor.messages'], []);
goog.addDependency('ui/editor/tabpane.js', ['goog.ui.editor.TabPane'], ['goog.dom.TagName', 'goog.events.EventHandler', 'goog.ui.Component', 'goog.ui.Control', 'goog.ui.Tab', 'goog.ui.TabBar']);
goog.addDependency('ui/editor/toolbarcontroller.js', ['goog.ui.editor.ToolbarController'], ['goog.editor.Field.EventType', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.ui.Component.EventType']);
goog.addDependency('ui/editor/toolbarfactory.js', ['goog.ui.editor.ToolbarFactory'], ['goog.array', 'goog.dom', 'goog.string', 'goog.string.Unicode', 'goog.style', 'goog.ui.Component.State', 'goog.ui.Container.Orientation', 'goog.ui.ControlContent', 'goog.ui.Option', 'goog.ui.Toolbar', 'goog.ui.ToolbarButton', 'goog.ui.ToolbarColorMenuButton', 'goog.ui.ToolbarMenuButton', 'goog.ui.ToolbarRenderer', 'goog.ui.ToolbarSelect', 'goog.userAgent']);
goog.addDependency('ui/emoji/emoji.js', ['goog.ui.emoji.Emoji'], []);
goog.addDependency('ui/emoji/emojipalette.js', ['goog.ui.emoji.EmojiPalette'], ['goog.events.Event', 'goog.events.EventType', 'goog.net.ImageLoader', 'goog.ui.Palette', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.EmojiPaletteRenderer']);
goog.addDependency('ui/emoji/emojipaletterenderer.js', ['goog.ui.emoji.EmojiPaletteRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.ui.PaletteRenderer', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.SpriteInfo']);
goog.addDependency('ui/emoji/emojipicker.js', ['goog.ui.emoji.EmojiPicker'], ['goog.debug.Logger', 'goog.dom', 'goog.ui.Component', 'goog.ui.TabPane', 'goog.ui.TabPane.TabPage', 'goog.ui.emoji.Emoji', 'goog.ui.emoji.EmojiPalette', 'goog.ui.emoji.EmojiPaletteRenderer', 'goog.ui.emoji.ProgressiveEmojiPaletteRenderer']);
goog.addDependency('ui/emoji/popupemojipicker.js', ['goog.ui.emoji.PopupEmojiPicker'], ['goog.dom', 'goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.ui.Component', 'goog.ui.Popup', 'goog.ui.emoji.EmojiPicker']);
goog.addDependency('ui/emoji/progressiveemojipaletterenderer.js', ['goog.ui.emoji.ProgressiveEmojiPaletteRenderer'], ['goog.ui.emoji.EmojiPaletteRenderer']);
goog.addDependency('ui/emoji/spriteinfo.js', ['goog.ui.emoji.SpriteInfo'], []);
goog.addDependency('ui/filteredmenu.js', ['goog.ui.FilteredMenu'], ['goog.dom', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.events.KeyCodes', 'goog.string', 'goog.ui.FilterObservingMenuItem', 'goog.ui.Menu']);
goog.addDependency('ui/filterobservingmenuitem.js', ['goog.ui.FilterObservingMenuItem'], ['goog.ui.ControlContent', 'goog.ui.FilterObservingMenuItemRenderer', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/filterobservingmenuitemrenderer.js', ['goog.ui.FilterObservingMenuItemRenderer'], ['goog.ui.MenuItemRenderer']);
goog.addDependency('ui/flatbuttonrenderer.js', ['goog.ui.FlatButtonRenderer'], ['goog.dom.classes', 'goog.ui.Button', 'goog.ui.ButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/flatmenubuttonrenderer.js', ['goog.ui.FlatMenuButtonRenderer'], ['goog.style', 'goog.ui.ControlContent', 'goog.ui.FlatButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuRenderer', 'goog.ui.registry']);
goog.addDependency('ui/formpost.js', ['goog.ui.FormPost'], ['goog.array', 'goog.dom.TagName', 'goog.string', 'goog.string.StringBuffer', 'goog.ui.Component']);
goog.addDependency('ui/gauge.js', ['goog.ui.Gauge', 'goog.ui.GaugeColoredRange'], ['goog.dom', 'goog.dom.a11y', 'goog.fx.Animation', 'goog.fx.easing', 'goog.graphics', 'goog.graphics.Font', 'goog.graphics.SolidFill', 'goog.ui.Component', 'goog.ui.GaugeTheme']);
goog.addDependency('ui/gaugetheme.js', ['goog.ui.GaugeTheme'], ['goog.graphics.LinearGradient', 'goog.graphics.SolidFill', 'goog.graphics.Stroke']);
goog.addDependency('ui/hovercard.js', ['goog.ui.HoverCard', 'goog.ui.HoverCard.EventType', 'goog.ui.HoverCard.TriggerEvent'], ['goog.dom', 'goog.events', 'goog.events.EventType', 'goog.ui.AdvancedTooltip']);
goog.addDependency('ui/hsvapalette.js', ['goog.ui.HsvaPalette'], ['goog.array', 'goog.color', 'goog.color.alpha', 'goog.events.EventType', 'goog.ui.Component.EventType', 'goog.ui.HsvPalette']);
goog.addDependency('ui/hsvpalette.js', ['goog.ui.HsvPalette'], ['goog.color', 'goog.dom', 'goog.dom.DomHelper', 'goog.events', 'goog.events.Event', 'goog.events.EventType', 'goog.events.InputHandler', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/idgenerator.js', ['goog.ui.IdGenerator'], []);
goog.addDependency('ui/idletimer.js', ['goog.ui.IdleTimer'], ['goog.Timer', 'goog.events', 'goog.events.EventTarget', 'goog.structs.Set', 'goog.ui.ActivityMonitor']);
goog.addDependency('ui/iframemask.js', ['goog.ui.IframeMask'], ['goog.Disposable', 'goog.Timer', 'goog.dom', 'goog.dom.DomHelper', 'goog.dom.iframe', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.style']);
goog.addDependency('ui/imagelessbuttonrenderer.js', ['goog.ui.ImagelessButtonRenderer'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/imagelessmenubuttonrenderer.js', ['goog.ui.ImagelessMenuButtonRenderer'], ['goog.dom', 'goog.dom.TagName', 'goog.ui.ControlContent', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.MenuButton', 'goog.ui.MenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/imagelessroundedcorner.js', ['goog.ui.AbstractImagelessRoundedCorner', 'goog.ui.CanvasRoundedCorner', 'goog.ui.ImagelessRoundedCorner', 'goog.ui.VmlRoundedCorner'], ['goog.dom.DomHelper', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.graphics.VmlGraphics', 'goog.userAgent']);
goog.addDependency('ui/inputdatepicker.js', ['goog.ui.InputDatePicker'], ['goog.date.DateTime', 'goog.dom', 'goog.i18n.DateTimeParse', 'goog.string', 'goog.ui.Component', 'goog.ui.PopupDatePicker']);
goog.addDependency('ui/itemevent.js', ['goog.ui.ItemEvent'], ['goog.events.Event']);
goog.addDependency('ui/keyboardshortcuthandler.js', ['goog.ui.KeyboardShortcutEvent', 'goog.ui.KeyboardShortcutHandler', 'goog.ui.KeyboardShortcutHandler.EventType'], ['goog.Timer', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyNames', 'goog.object']);
goog.addDependency('ui/labelinput.js', ['goog.ui.LabelInput'], ['goog.Timer', 'goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.ui.Component']);
goog.addDependency('ui/linkbuttonrenderer.js', ['goog.ui.LinkButtonRenderer'], ['goog.ui.Button', 'goog.ui.FlatButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/media/flashobject.js', ['goog.ui.media.FlashObject', 'goog.ui.media.FlashObject.ScriptAccessLevel', 'goog.ui.media.FlashObject.Wmodes'], ['goog.asserts', 'goog.debug.Logger', 'goog.events.EventHandler', 'goog.string', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.userAgent', 'goog.userAgent.flash']);
goog.addDependency('ui/media/flickr.js', ['goog.ui.media.FlickrSet', 'goog.ui.media.FlickrSetModel'], ['goog.object', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/media.js', ['goog.ui.media.Media', 'goog.ui.media.MediaRenderer'], ['goog.style', 'goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/media/mediamodel.js', ['goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Category', 'goog.ui.media.MediaModel.Credit', 'goog.ui.media.MediaModel.Credit.Role', 'goog.ui.media.MediaModel.Credit.Scheme', 'goog.ui.media.MediaModel.Medium', 'goog.ui.media.MediaModel.MimeType', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaModel.Thumbnail'], ['goog.array']);
goog.addDependency('ui/media/mp3.js', ['goog.ui.media.Mp3'], ['goog.string', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/photo.js', ['goog.ui.media.Photo'], ['goog.ui.media.Media', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/picasa.js', ['goog.ui.media.PicasaAlbum', 'goog.ui.media.PicasaAlbumModel'], ['goog.object', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/vimeo.js', ['goog.ui.media.Vimeo', 'goog.ui.media.VimeoModel'], ['goog.string', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/media/youtube.js', ['goog.ui.media.Youtube', 'goog.ui.media.YoutubeModel'], ['goog.string', 'goog.ui.Component.Error', 'goog.ui.Component.State', 'goog.ui.media.FlashObject', 'goog.ui.media.Media', 'goog.ui.media.MediaModel', 'goog.ui.media.MediaModel.Player', 'goog.ui.media.MediaModel.Thumbnail', 'goog.ui.media.MediaRenderer']);
goog.addDependency('ui/menu.js', ['goog.ui.Menu', 'goog.ui.Menu.EventType'], ['goog.math.Coordinate', 'goog.string', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.Container', 'goog.ui.Container.Orientation', 'goog.ui.MenuHeader', 'goog.ui.MenuItem', 'goog.ui.MenuRenderer', 'goog.ui.MenuSeparator']);
goog.addDependency('ui/menubase.js', ['goog.ui.MenuBase'], ['goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.ui.Popup']);
goog.addDependency('ui/menubutton.js', ['goog.ui.MenuButton'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler.EventType', 'goog.math.Box', 'goog.math.Rect', 'goog.positioning.Corner', 'goog.positioning.MenuAnchoredPosition', 'goog.style', 'goog.ui.Button', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/menubuttonrenderer.js', ['goog.ui.MenuButtonRenderer'], ['goog.dom', 'goog.style', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.Menu', 'goog.ui.MenuRenderer', 'goog.userAgent']);
goog.addDependency('ui/menuheader.js', ['goog.ui.MenuHeader'], ['goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.MenuHeaderRenderer', 'goog.ui.registry']);
goog.addDependency('ui/menuheaderrenderer.js', ['goog.ui.MenuHeaderRenderer'], ['goog.dom', 'goog.dom.classes', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/menuitem.js', ['goog.ui.MenuItem'], ['goog.math.Coordinate', 'goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.MenuItemRenderer', 'goog.ui.registry']);
goog.addDependency('ui/menuitemrenderer.js', ['goog.ui.MenuItemRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.classes', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/menurenderer.js', ['goog.ui.MenuRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.ui.ContainerRenderer', 'goog.ui.Separator']);
goog.addDependency('ui/menuseparator.js', ['goog.ui.MenuSeparator'], ['goog.ui.MenuSeparatorRenderer', 'goog.ui.Separator', 'goog.ui.registry']);
goog.addDependency('ui/menuseparatorrenderer.js', ['goog.ui.MenuSeparatorRenderer'], ['goog.dom', 'goog.dom.classes', 'goog.ui.ControlContent', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/mockactivitymonitor.js', ['goog.ui.MockActivityMonitor'], ['goog.events.EventType', 'goog.ui.ActivityMonitor']);
goog.addDependency('ui/nativebuttonrenderer.js', ['goog.ui.NativeButtonRenderer'], ['goog.dom.classes', 'goog.events.EventType', 'goog.ui.ButtonRenderer', 'goog.ui.Component.State']);
goog.addDependency('ui/offlineinstalldialog.js', ['goog.ui.OfflineInstallDialog', 'goog.ui.OfflineInstallDialog.ButtonKeyType', 'goog.ui.OfflineInstallDialog.EnableScreen', 'goog.ui.OfflineInstallDialog.InstallScreen', 'goog.ui.OfflineInstallDialog.InstallingGearsScreen', 'goog.ui.OfflineInstallDialog.ScreenType', 'goog.ui.OfflineInstallDialog.UpgradeScreen', 'goog.ui.OfflineInstallDialogScreen'], ['goog.Disposable', 'goog.dom.classes', 'goog.gears', 'goog.string', 'goog.string.StringBuffer', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.EventType', 'goog.window']);
goog.addDependency('ui/offlinestatuscard.js', ['goog.ui.OfflineStatusCard', 'goog.ui.OfflineStatusCard.EventType'], ['goog.dom', 'goog.events.EventType', 'goog.gears.StatusType', 'goog.structs.Map', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.ProgressBar']);
goog.addDependency('ui/offlinestatuscomponent.js', ['goog.ui.OfflineStatusComponent', 'goog.ui.OfflineStatusComponent.StatusClassNames'], ['goog.dom.classes', 'goog.events.EventType', 'goog.gears.StatusType', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.ui.Component', 'goog.ui.Popup']);
goog.addDependency('ui/option.js', ['goog.ui.Option'], ['goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.registry']);
goog.addDependency('ui/palette.js', ['goog.ui.Palette'], ['goog.array', 'goog.dom', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.math.Size', 'goog.ui.Component.Error', 'goog.ui.Component.EventType', 'goog.ui.Control', 'goog.ui.PaletteRenderer', 'goog.ui.SelectionModel']);
goog.addDependency('ui/paletterenderer.js', ['goog.ui.PaletteRenderer'], ['goog.array', 'goog.dom', 'goog.dom.NodeType', 'goog.dom.a11y', 'goog.dom.classes', 'goog.style', 'goog.ui.ControlRenderer', 'goog.userAgent']);
goog.addDependency('ui/plaintextspellchecker.js', ['goog.ui.PlainTextSpellChecker'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.style', 'goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/popup.js', ['goog.ui.Popup', 'goog.ui.Popup.AbsolutePosition', 'goog.ui.Popup.AnchoredPosition', 'goog.ui.Popup.AnchoredViewPortPosition', 'goog.ui.Popup.ClientPosition', 'goog.ui.Popup.Corner', 'goog.ui.Popup.Overflow', 'goog.ui.Popup.ViewPortClientPosition', 'goog.ui.Popup.ViewPortPosition'], ['goog.math.Box', 'goog.positioning', 'goog.positioning.AbsolutePosition', 'goog.positioning.AnchoredPosition', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.ClientPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus', 'goog.positioning.ViewportClientPosition', 'goog.positioning.ViewportPosition', 'goog.style', 'goog.ui.PopupBase']);
goog.addDependency('ui/popupbase.js', ['goog.ui.PopupBase', 'goog.ui.PopupBase.EventType', 'goog.ui.PopupBase.Type'], ['goog.Timer', 'goog.dom', 'goog.events.EventHandler', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style', 'goog.userAgent']);
goog.addDependency('ui/popupcolorpicker.js', ['goog.ui.PopupColorPicker'], ['goog.dom.classes', 'goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.ui.ColorPicker', 'goog.ui.ColorPicker.EventType', 'goog.ui.Component', 'goog.ui.Popup']);
goog.addDependency('ui/popupdatepicker.js', ['goog.ui.PopupDatePicker'], ['goog.events.EventType', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.DatePicker', 'goog.ui.DatePicker.Events', 'goog.ui.Popup', 'goog.ui.PopupBase.EventType']);
goog.addDependency('ui/popupmenu.js', ['goog.ui.PopupMenu'], ['goog.events.EventType', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.positioning.MenuAnchoredPosition', 'goog.positioning.ViewportClientPosition', 'goog.structs', 'goog.structs.Map', 'goog.style', 'goog.ui.Component.EventType', 'goog.ui.Menu', 'goog.ui.PopupBase', 'goog.userAgent']);
goog.addDependency('ui/progressbar.js', ['goog.ui.ProgressBar', 'goog.ui.ProgressBar.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.RangeModel', 'goog.userAgent']);
goog.addDependency('ui/prompt.js', ['goog.ui.Prompt'], ['goog.Timer', 'goog.dom', 'goog.events', 'goog.ui.Component.Error', 'goog.ui.Dialog', 'goog.ui.Dialog.ButtonSet', 'goog.ui.Dialog.DefaultButtonKeys', 'goog.ui.Dialog.EventType', 'goog.userAgent']);
goog.addDependency('ui/rangemodel.js', ['goog.ui.RangeModel'], ['goog.events.EventTarget', 'goog.ui.Component.EventType']);
goog.addDependency('ui/ratings.js', ['goog.ui.Ratings', 'goog.ui.Ratings.EventType'], ['goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventType', 'goog.ui.Component']);
goog.addDependency('ui/registry.js', ['goog.ui.registry'], ['goog.dom.classes']);
goog.addDependency('ui/richtextspellchecker.js', ['goog.ui.RichTextSpellChecker'], ['goog.Timer', 'goog.dom', 'goog.dom.NodeType', 'goog.events', 'goog.events.EventType', 'goog.string.StringBuffer', 'goog.ui.AbstractSpellChecker', 'goog.ui.AbstractSpellChecker.AsyncResult']);
goog.addDependency('ui/roundedcorners.js', ['goog.ui.RoundedCorners', 'goog.ui.RoundedCorners.Corners'], ['goog.Uri', 'goog.color', 'goog.dom', 'goog.math.Size', 'goog.string', 'goog.style', 'goog.userAgent']);
goog.addDependency('ui/roundedpanel.js', ['goog.ui.BaseRoundedPanel', 'goog.ui.CssRoundedPanel', 'goog.ui.GraphicsRoundedPanel', 'goog.ui.RoundedPanel', 'goog.ui.RoundedPanel.Corner'], ['goog.dom', 'goog.dom.classes', 'goog.graphics', 'goog.graphics.SolidFill', 'goog.graphics.Stroke', 'goog.math.Coordinate', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/roundedtabrenderer.js', ['goog.ui.RoundedTabRenderer'], ['goog.dom', 'goog.ui.Tab', 'goog.ui.TabBar.Location', 'goog.ui.TabRenderer', 'goog.ui.registry']);
goog.addDependency('ui/scrollfloater.js', ['goog.ui.ScrollFloater'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventType', 'goog.object', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/select.js', ['goog.ui.Select'], ['goog.events.EventType', 'goog.ui.Component.EventType', 'goog.ui.ControlContent', 'goog.ui.MenuButton', 'goog.ui.SelectionModel', 'goog.ui.registry']);
goog.addDependency('ui/selectionmenubutton.js', ['goog.ui.SelectionMenuButton', 'goog.ui.SelectionMenuButton.SelectionState'], ['goog.events.EventType', 'goog.ui.Component.EventType', 'goog.ui.Menu', 'goog.ui.MenuButton', 'goog.ui.MenuItem']);
goog.addDependency('ui/selectionmodel.js', ['goog.ui.SelectionModel'], ['goog.array', 'goog.events.EventTarget', 'goog.events.EventType']);
goog.addDependency('ui/separator.js', ['goog.ui.Separator'], ['goog.dom.a11y', 'goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.MenuSeparatorRenderer', 'goog.ui.registry']);
goog.addDependency('ui/serverchart.js', ['goog.ui.ServerChart', 'goog.ui.ServerChart.AxisDisplayType', 'goog.ui.ServerChart.ChartType', 'goog.ui.ServerChart.EncodingType', 'goog.ui.ServerChart.Event', 'goog.ui.ServerChart.LegendPosition', 'goog.ui.ServerChart.MaximumValue', 'goog.ui.ServerChart.MultiAxisAlignment', 'goog.ui.ServerChart.MultiAxisType', 'goog.ui.ServerChart.UriParam', 'goog.ui.ServerChart.UriTooLongEvent'], ['goog.Uri', 'goog.array', 'goog.asserts', 'goog.events.Event', 'goog.string', 'goog.ui.Component']);
goog.addDependency('ui/slider.js', ['goog.ui.Slider', 'goog.ui.Slider.Orientation'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.ui.SliderBase', 'goog.ui.SliderBase.Orientation']);
goog.addDependency('ui/sliderbase.js', ['goog.ui.SliderBase', 'goog.ui.SliderBase.Orientation'], ['goog.Timer', 'goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.events.MouseWheelHandler', 'goog.events.MouseWheelHandler.EventType', 'goog.fx.Animation.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.fx.dom.SlideFrom', 'goog.math', 'goog.math.Coordinate', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.RangeModel']);
goog.addDependency('ui/splitbehavior.js', ['goog.ui.SplitBehavior', 'goog.ui.SplitBehavior.DefaultHandlers'], ['goog.Disposable', 'goog.array', 'goog.dispose', 'goog.dom', 'goog.dom.DomHelper', 'goog.dom.classes', 'goog.events', 'goog.events.EventHandler', 'goog.events.EventType', 'goog.string', 'goog.ui.ButtonSide', 'goog.ui.Component', 'goog.ui.Component.Error', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.decorate', 'goog.ui.registry']);
goog.addDependency('ui/splitpane.js', ['goog.ui.SplitPane', 'goog.ui.SplitPane.Orientation'], ['goog.dom', 'goog.dom.classes', 'goog.events.EventType', 'goog.fx.Dragger', 'goog.fx.Dragger.EventType', 'goog.math.Rect', 'goog.math.Size', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.userAgent']);
goog.addDependency('ui/style/app/buttonrenderer.js', ['goog.ui.style.app.ButtonRenderer'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.registry']);
goog.addDependency('ui/style/app/menubuttonrenderer.js', ['goog.ui.style.app.MenuButtonRenderer'], ['goog.array', 'goog.dom', 'goog.dom.a11y.Role', 'goog.style', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuRenderer', 'goog.ui.style.app.ButtonRenderer']);
goog.addDependency('ui/style/app/primaryactionbuttonrenderer.js', ['goog.ui.style.app.PrimaryActionButtonRenderer'], ['goog.ui.Button', 'goog.ui.registry', 'goog.ui.style.app.ButtonRenderer']);
goog.addDependency('ui/submenu.js', ['goog.ui.SubMenu'], ['goog.Timer', 'goog.dom', 'goog.dom.classes', 'goog.events.KeyCodes', 'goog.positioning.AnchoredViewportPosition', 'goog.positioning.Corner', 'goog.style', 'goog.ui.Component', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.Menu', 'goog.ui.MenuItem', 'goog.ui.SubMenuRenderer', 'goog.ui.registry']);
goog.addDependency('ui/submenurenderer.js', ['goog.ui.SubMenuRenderer'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.State', 'goog.dom.classes', 'goog.style', 'goog.ui.Menu', 'goog.ui.MenuItemRenderer']);
goog.addDependency('ui/tab.js', ['goog.ui.Tab'], ['goog.ui.Component.State', 'goog.ui.Control', 'goog.ui.ControlContent', 'goog.ui.TabRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tabbar.js', ['goog.ui.TabBar', 'goog.ui.TabBar.Location'], ['goog.ui.Component.EventType', 'goog.ui.Container', 'goog.ui.Container.Orientation', 'goog.ui.Tab', 'goog.ui.TabBarRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tabbarrenderer.js', ['goog.ui.TabBarRenderer'], ['goog.dom.a11y.Role', 'goog.object', 'goog.ui.ContainerRenderer']);
goog.addDependency('ui/tablesorter.js', ['goog.ui.TableSorter', 'goog.ui.TableSorter.EventType'], ['goog.array', 'goog.dom', 'goog.dom.TagName', 'goog.dom.classes', 'goog.events', 'goog.events.EventType', 'goog.functions', 'goog.ui.Component']);
goog.addDependency('ui/tabpane.js', ['goog.ui.TabPane', 'goog.ui.TabPane.Events', 'goog.ui.TabPane.TabLocation', 'goog.ui.TabPane.TabPage', 'goog.ui.TabPaneEvent'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style']);
goog.addDependency('ui/tabrenderer.js', ['goog.ui.TabRenderer'], ['goog.dom.a11y.Role', 'goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/textarea.js', ['goog.ui.Textarea'], ['goog.Timer', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style', 'goog.ui.Control', 'goog.ui.TextareaRenderer', 'goog.userAgent', 'goog.userAgent.product']);
goog.addDependency('ui/textarearenderer.js', ['goog.ui.TextareaRenderer'], ['goog.ui.Component.State', 'goog.ui.ControlRenderer']);
goog.addDependency('ui/togglebutton.js', ['goog.ui.ToggleButton'], ['goog.ui.Button', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.CustomButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbar.js', ['goog.ui.Toolbar'], ['goog.ui.Container', 'goog.ui.ToolbarRenderer']);
goog.addDependency('ui/toolbarbutton.js', ['goog.ui.ToolbarButton'], ['goog.ui.Button', 'goog.ui.ControlContent', 'goog.ui.ToolbarButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarbuttonrenderer.js', ['goog.ui.ToolbarButtonRenderer'], ['goog.ui.CustomButtonRenderer']);
goog.addDependency('ui/toolbarcolormenubutton.js', ['goog.ui.ToolbarColorMenuButton'], ['goog.ui.ColorMenuButton', 'goog.ui.ControlContent', 'goog.ui.ToolbarColorMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarcolormenubuttonrenderer.js', ['goog.ui.ToolbarColorMenuButtonRenderer'], ['goog.dom.classes', 'goog.ui.ColorMenuButtonRenderer', 'goog.ui.ControlContent', 'goog.ui.MenuButtonRenderer', 'goog.ui.ToolbarMenuButtonRenderer']);
goog.addDependency('ui/toolbarmenubutton.js', ['goog.ui.ToolbarMenuButton'], ['goog.ui.ControlContent', 'goog.ui.MenuButton', 'goog.ui.ToolbarMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarmenubuttonrenderer.js', ['goog.ui.ToolbarMenuButtonRenderer'], ['goog.ui.MenuButtonRenderer']);
goog.addDependency('ui/toolbarrenderer.js', ['goog.ui.ToolbarRenderer'], ['goog.dom.a11y.Role', 'goog.ui.Container.Orientation', 'goog.ui.ContainerRenderer', 'goog.ui.Separator', 'goog.ui.ToolbarSeparatorRenderer']);
goog.addDependency('ui/toolbarselect.js', ['goog.ui.ToolbarSelect'], ['goog.ui.ControlContent', 'goog.ui.Select', 'goog.ui.ToolbarMenuButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarseparator.js', ['goog.ui.ToolbarSeparator'], ['goog.ui.Separator', 'goog.ui.ToolbarSeparatorRenderer', 'goog.ui.registry']);
goog.addDependency('ui/toolbarseparatorrenderer.js', ['goog.ui.ToolbarSeparatorRenderer'], ['goog.dom.classes', 'goog.ui.INLINE_BLOCK_CLASSNAME', 'goog.ui.MenuSeparatorRenderer']);
goog.addDependency('ui/toolbartogglebutton.js', ['goog.ui.ToolbarToggleButton'], ['goog.ui.ControlContent', 'goog.ui.ToggleButton', 'goog.ui.ToolbarButtonRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tooltip.js', ['goog.ui.Tooltip', 'goog.ui.Tooltip.CursorTooltipPosition', 'goog.ui.Tooltip.ElementTooltipPosition', 'goog.ui.Tooltip.State'], ['goog.Timer', 'goog.array', 'goog.dom', 'goog.events', 'goog.events.EventType', 'goog.math.Box', 'goog.math.Coordinate', 'goog.positioning', 'goog.positioning.AnchoredPosition', 'goog.positioning.Corner', 'goog.positioning.Overflow', 'goog.positioning.OverflowStatus', 'goog.positioning.ViewportPosition', 'goog.structs.Set', 'goog.style', 'goog.ui.Popup', 'goog.ui.PopupBase']);
goog.addDependency('ui/tree/basenode.js', ['goog.ui.tree.BaseNode', 'goog.ui.tree.BaseNode.EventType'], ['goog.Timer', 'goog.asserts', 'goog.dom.a11y', 'goog.events.KeyCodes', 'goog.string', 'goog.string.StringBuffer', 'goog.style', 'goog.ui.Component', 'goog.userAgent']);
goog.addDependency('ui/tree/treecontrol.js', ['goog.ui.tree.TreeControl'], ['goog.debug.Logger', 'goog.dom.a11y', 'goog.dom.classes', 'goog.events.EventType', 'goog.events.FocusHandler', 'goog.events.KeyHandler', 'goog.events.KeyHandler.EventType', 'goog.ui.tree.BaseNode', 'goog.ui.tree.TreeNode', 'goog.ui.tree.TypeAhead', 'goog.userAgent']);
goog.addDependency('ui/tree/treenode.js', ['goog.ui.tree.TreeNode'], ['goog.ui.tree.BaseNode']);
goog.addDependency('ui/tree/typeahead.js', ['goog.ui.tree.TypeAhead', 'goog.ui.tree.TypeAhead.Offset'], ['goog.array', 'goog.events.KeyCodes', 'goog.string', 'goog.structs.Trie']);
goog.addDependency('ui/tristatemenuitem.js', ['goog.ui.TriStateMenuItem', 'goog.ui.TriStateMenuItem.State'], ['goog.dom.classes', 'goog.ui.Component.EventType', 'goog.ui.Component.State', 'goog.ui.ControlContent', 'goog.ui.MenuItem', 'goog.ui.TriStateMenuItemRenderer', 'goog.ui.registry']);
goog.addDependency('ui/tristatemenuitemrenderer.js', ['goog.ui.TriStateMenuItemRenderer'], ['goog.dom.classes', 'goog.ui.MenuItemRenderer']);
goog.addDependency('ui/twothumbslider.js', ['goog.ui.TwoThumbSlider'], ['goog.dom', 'goog.dom.a11y', 'goog.dom.a11y.Role', 'goog.ui.SliderBase']);
goog.addDependency('ui/zippy.js', ['goog.ui.Zippy', 'goog.ui.ZippyEvent'], ['goog.dom', 'goog.dom.classes', 'goog.events', 'goog.events.Event', 'goog.events.EventTarget', 'goog.events.EventType', 'goog.events.KeyCodes', 'goog.style']);
goog.addDependency('uri/uri.js', ['goog.Uri', 'goog.Uri.QueryData'], ['goog.array', 'goog.string', 'goog.structs', 'goog.structs.Map', 'goog.uri.utils', 'goog.uri.utils.ComponentIndex']);
goog.addDependency('uri/utils.js', ['goog.uri.utils', 'goog.uri.utils.ComponentIndex'], ['goog.asserts', 'goog.string']);
goog.addDependency('useragent/adobereader.js', ['goog.userAgent.adobeReader'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/flash.js', ['goog.userAgent.flash'], ['goog.string']);
goog.addDependency('useragent/iphoto.js', ['goog.userAgent.iphoto'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/jscript.js', ['goog.userAgent.jscript'], ['goog.string']);
goog.addDependency('useragent/picasa.js', ['goog.userAgent.picasa'], ['goog.string', 'goog.userAgent']);
goog.addDependency('useragent/platform.js', ['goog.userAgent.platform'], ['goog.userAgent']);
goog.addDependency('useragent/product.js', ['goog.userAgent.product'], ['goog.userAgent']);
goog.addDependency('useragent/product_isversion.js', ['goog.userAgent.product.isVersion'], ['goog.userAgent.product']);
goog.addDependency('useragent/useragent.js', ['goog.userAgent'], ['goog.string']);
goog.addDependency('window/window.js', ['goog.window'], ['goog.string']);

goog.addDependency('../../third_party/closure/goog/caja/string/html/htmlparser.js', ['goog.string.html.HtmlParser', 'goog.string.html.HtmlParser.EFlags', 'goog.string.html.HtmlParser.Elements', 'goog.string.html.HtmlParser.Entities', 'goog.string.html.HtmlSaxHandler'], []);
goog.addDependency('../../third_party/closure/goog/caja/string/html/htmlsanitizer.js', ['goog.string.html.HtmlSanitizer', 'goog.string.html.HtmlSanitizer.AttributeType', 'goog.string.html.HtmlSanitizer.Attributes', 'goog.string.html.htmlSanitize'], ['goog.string.StringBuffer', 'goog.string.html.HtmlParser', 'goog.string.html.HtmlParser.EFlags', 'goog.string.html.HtmlParser.Elements', 'goog.string.html.HtmlSaxHandler']);
goog.addDependency('../../third_party/closure/goog/dojo/dom/query.js', ['goog.dom.query'], ['goog.array', 'goog.dom', 'goog.functions', 'goog.string', 'goog.userAgent']);
goog.addDependency('../../third_party/closure/goog/jpeg_encoder/jpeg_encoder_basic.js', ['goog.crypt.JpegEncoder'], ['goog.crypt.base64']);
goog.addDependency('../../third_party/closure/goog/loremipsum/text/loremipsum.js', ['goog.text.LoremIpsum'], ['goog.array', 'goog.math', 'goog.string', 'goog.structs.Map', 'goog.structs.Set']);
goog.addDependency('../../third_party/closure/goog/mochikit/async/deferred.js', ['goog.async.Deferred', 'goog.async.Deferred.AlreadyCalledError', 'goog.async.Deferred.CancelledError'], ['goog.array', 'goog.asserts', 'goog.debug.Error']);
goog.addDependency('../../third_party/closure/goog/mochikit/async/deferredlist.js', ['goog.async.DeferredList'], ['goog.array', 'goog.async.Deferred']);
goog.addDependency('../../third_party/closure/goog/osapi/osapi.js', ['goog.osapi'], []);
goog.addDependency('../../third_party/closure/goog/silverlight/silverlight.js', ['goog.silverlight'], []);
goog.addDependency('../../third_party/closure/goog/silverlight/supporteduseragent.js', ['goog.silverlight.supportedUserAgent'], []);


// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Provides a base class for custom Error objects such that the
 * stack is correctly maintained.
 *
 * You should never need to throw goog.debug.Error(msg) directly, Error(msg) is
 * sufficient.
 *
 */

goog.provide('goog.debug.Error');



/**
 * Base class for custom error objects.
 * @param {*=} opt_msg The message associated with the error.
 * @constructor
 * @extends {Error}
 */
goog.debug.Error = function(opt_msg) {

  // Ensure there is a stack trace.
  this.stack = new Error().stack || '';

  if (opt_msg) {
    this.message = String(opt_msg);
  }
};
goog.inherits(goog.debug.Error, Error);


/** @inheritDoc */
goog.debug.Error.prototype.name = 'CustomError';


// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for string manipulation.
 */


/**
 * Namespace for string utilities
 */
goog.provide('goog.string');
goog.provide('goog.string.Unicode');


/**
 * Common Unicode string characters.
 * @enum {string}
 */
goog.string.Unicode = {
  NBSP: '\xa0'
};


/**
 * Fast prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix A string to look for at the start of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix}.
 */
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0;
};


/**
 * Fast suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix}.
 */
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l;
};


/**
 * Case-insensitive prefix-checker.
 * @param {string} str The string to check.
 * @param {string} prefix  A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} begins with {@code prefix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(
      prefix, str.substr(0, prefix.length)) == 0;
};


/**
 * Case-insensitive suffix-checker.
 * @param {string} str The string to check.
 * @param {string} suffix A string to look for at the end of {@code str}.
 * @return {boolean} True if {@code str} ends with {@code suffix} (ignoring
 *     case).
 */
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(
      suffix, str.substr(str.length - suffix.length, suffix.length)) == 0;
};


/**
 * Does simple python-style string substitution.
 * subs("foo%s hot%s", "bar", "dog") becomes "foobar hotdog".
 * @param {string} str The string containing the pattern.
 * @param {...*} var_args The items to substitute into the pattern.
 * @return {string} A copy of {@code str} in which each occurrence of
 *     {@code %s} has been replaced an argument from {@code var_args}.
 */
goog.string.subs = function(str, var_args) {
  // This appears to be slow, but testing shows it compares more or less
  // equivalent to the regex.exec method.
  for (var i = 1; i < arguments.length; i++) {
    // We cast to String in case an argument is a Function.  Replacing $&, for
    // example, with $$$& stops the replace from subsituting the whole match
    // into the resultant string.  $$$& in the first replace becomes $$& in the
    //  second, which leaves $& in the resultant string.  Also:
    // $$, $`, $', $n $nn
    var replacement = String(arguments[i]).replace(/\$/g, '$$$$');
    str = str.replace(/\%s/, replacement);
  }
  return str;
};


/**
 * Converts multiple whitespace chars (spaces, non-breaking-spaces, new lines
 * and tabs) to a single space, and strips leading and trailing whitespace.
 * @param {string} str Input string.
 * @return {string} A copy of {@code str} with collapsed whitespace.
 */
goog.string.collapseWhitespace = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+/g, ' ').replace(/^\s+|\s+$/g, '');
};


/**
 * Checks if a string is empty or contains only whitespaces.
 * @param {string} str The string to check.
 * @return {boolean} True if {@code str} is empty or whitespace only.
 */
goog.string.isEmpty = function(str) {
  // testing length == 0 first is actually slower in all browsers (about the
  // same in Opera).
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return /^[\s\xa0]*$/.test(str);
};


/**
 * Checks if a string is null, empty or contains only whitespaces.
 * @param {*} str The string to check.
 * @return {boolean} True if{@code str} is null, empty, or whitespace only.
 */
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str));
};


/**
 * Checks if a string is all breaking whitespace.
 * @param {string} str The string to check.
 * @return {boolean} Whether the string is all breaking whitespace.
 */
goog.string.isBreakingWhitespace = function(str) {
  return !/[^\t\n\r ]/.test(str);
};


/**
 * Checks if a string contains all letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} consists entirely of letters.
 */
goog.string.isAlpha = function(str) {
  return !/[^a-zA-Z]/.test(str);
};


/**
 * Checks if a string contains only numbers.
 * @param {*} str string to check. If not a string, it will be
 *     casted to one.
 * @return {boolean} True if {@code str} is numeric.
 */
goog.string.isNumeric = function(str) {
  return !/[^0-9]/.test(str);
};


/**
 * Checks if a string contains only numbers or letters.
 * @param {string} str string to check.
 * @return {boolean} True if {@code str} is alphanumeric.
 */
goog.string.isAlphaNumeric = function(str) {
  return !/[^a-zA-Z0-9]/.test(str);
};


/**
 * Checks if a character is a space character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a space.
 */
goog.string.isSpace = function(ch) {
  return ch == ' ';
};


/**
 * Checks if a character is a valid unicode character.
 * @param {string} ch Character to check.
 * @return {boolean} True if {code ch} is a valid unicode character.
 */
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= ' ' && ch <= '~' ||
         ch >= '\u0080' && ch <= '\uFFFD';
};


/**
 * Takes a string and replaces newlines with a space. Multiple lines are
 * replaced with a single space.
 * @param {string} str The string from which to strip newlines.
 * @return {string} A copy of {@code str} stripped of newlines.
 */
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, ' ');
};


/**
 * Replaces Windows and Mac new lines with unix style: \r or \r\n with \n.
 * @param {string} str The string to in which to canonicalize newlines.
 * @return {string} {@code str} A copy of {@code} with canonicalized newlines.
 */
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, '\n');
};


/**
 * Normalizes whitespace in a string, replacing all whitespace chars with
 * a space.
 * @param {string} str The string in which to normalize whitespace.
 * @return {string} A copy of {@code str} with all whitespace normalized.
 */
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, ' ');
};


/**
 * Normalizes spaces in a string, replacing all consecutive spaces and tabs
 * with a single space. Replaces non-breaking space with a space.
 * @param {string} str The string in which to normalize spaces.
 * @return {string} A copy of {@code str} with all consecutive spaces and tabs
 *    replaced with a single space.
 */
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, ' ');
};


/**
 * Trims white spaces to the left and right of a string.
 * @param {string} str The string to trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trim = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, '');
};


/**
 * Trims whitespaces at the left end of a string.
 * @param {string} str The string to left trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimLeft = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/^[\s\xa0]+/, '');
};


/**
 * Trims whitespaces at the right end of a string.
 * @param {string} str The string to right trim.
 * @return {string} A trimmed copy of {@code str}.
 */
goog.string.trimRight = function(str) {
  // Since IE doesn't include non-breaking-space (0xa0) in their \s character
  // class (as required by section 7.2 of the ECMAScript spec), we explicitly
  // include it in the regexp to enforce consistent cross-browser behavior.
  return str.replace(/[\s\xa0]+$/, '');
};


/**
 * A string comparator that ignores case.
 * -1 = str1 less than str2
 *  0 = str1 equals str2
 *  1 = str1 greater than str2
 *
 * @param {string} str1 The string to compare.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} The comparator result, as described above.
 */
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();

  if (test1 < test2) {
    return -1;
  } else if (test1 == test2) {
    return 0;
  } else {
    return 1;
  }
};


/**
 * Regular expression used for splitting a string into substrings of fractional
 * numbers, integers, and non-numeric characters.
 * @type {RegExp}
 * @private
 */
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;


/**
 * String comparison function that handles numbers in a way humans might expect.
 * Using this function, the string "File 2.jpg" sorts before "File 10.jpg". The
 * comparison is mostly case-insensitive, though strings that are identical
 * except for case are sorted with the upper-case strings before lower-case.
 *
 * This comparison function is significantly slower (about 500x) than either
 * the default or the case-insensitive compare. It should not be used in
 * time-critical code, but should be fast enough to sort several hundred short
 * strings (like filenames) with a reasonable delay.
 *
 * @param {string} str1 The string to compare in a numerically sensitive way.
 * @param {string} str2 The string to compare {@code str1} to.
 * @return {number} less than 0 if str1 < str2, 0 if str1 == str2, greater than
 *     0 if str1 > str2.
 */
goog.string.numerateCompare = function(str1, str2) {
  if (str1 == str2) {
    return 0;
  }
  if (!str1) {
    return -1;
  }
  if (!str2) {
    return 1;
  }

  // Using match to split the entire string ahead of time turns out to be faster
  // for most inputs than using RegExp.exec or iterating over each character.
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);

  var count = Math.min(tokens1.length, tokens2.length);

  for (var i = 0; i < count; i++) {
    var a = tokens1[i];
    var b = tokens2[i];

    // Compare pairs of tokens, returning if one token sorts before the other.
    if (a != b) {

      // Only if both tokens are integers is a special comparison required.
      // Decimal numbers are sorted as strings (e.g., '.09' < '.1').
      var num1 = parseInt(a, 10);
      if (!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if (!isNaN(num2) && num1 - num2) {
          return num1 - num2;
        }
      }
      return a < b ? -1 : 1;
    }
  }

  // If one string is a substring of the other, the shorter string sorts first.
  if (tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length;
  }

  // The two strings must be equivalent except for case (perfect equality is
  // tested at the head of the function.) Revert to default ASCII-betical string
  // comparison to stablize the sort.
  return str1 < str2 ? -1 : 1;
};


/**
 * Regular expression used for determining if a string needs to be encoded.
 * @type {RegExp}
 * @private
 */
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;


/**
 * URL-encodes a string
 * @param {*} str The string to url-encode.
 * @return {string} An encoded copy of {@code str} that is safe for urls.
 *     Note that '#', ':', and other characters used to delimit portions
 *     of URLs *will* be encoded.
 */
goog.string.urlEncode = function(str) {
  str = String(str);
  // Checking if the search matches before calling encodeURIComponent avoids an
  // extra allocation in IE6. This adds about 10us time in FF and a similiar
  // over head in IE6 for lower working set apps, but for large working set
  // apps like Gmail, it saves about 70us per call.
  if (!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str);
  }
  return str;
};


/**
 * URL-decodes the string. We need to specially handle '+'s because
 * the javascript library doesn't convert them to spaces.
 * @param {string} str The string to url decode.
 * @return {string} The decoded {@code str}.
 */
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, ' '));
};


/**
 * Converts \n to <br>s or <br />s.
 * @param {string} str The string in which to convert newlines.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} A copy of {@code str} with converted newlines.
 */
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? '<br />' : '<br>');
};


/**
 * Escape double quote '"' characters in addition to '&', '<', and '>' so that a
 * string can be included in an HTML tag attribute value within double quotes.
 *
 * It should be noted that > doesn't need to be escaped for the HTML or XML to
 * be valid, but it has been decided to escape it for consistency with other
 * implementations.
 *
 * NOTE(user):
 * HtmlEscape is often called during the generation of large blocks of HTML.
 * Using statics for the regular expressions and strings is an optimization
 * that can more than half the amount of time IE spends in this function for
 * large apps, since strings and regexes both contribute to GC allocations.
 *
 * Testing for the presence of a character before escaping increases the number
 * of function calls, but actually provides a speed increase for the average
 * case -- since the average case often doesn't require the escaping of all 4
 * characters and indexOf() is much cheaper than replace().
 * The worst case does suffer slightly from the additional calls, therefore the
 * opt_isLikelyToContainHtmlChars option has been included for situations
 * where all 4 HTML entities are very likely to be present and need escaping.
 *
 * Some benchmarks (times tended to fluctuate +-0.05ms):
 *                                     FireFox                     IE6
 * (no chars / average (mix of cases) / all 4 chars)
 * no checks                     0.13 / 0.22 / 0.22         0.23 / 0.53 / 0.80
 * indexOf                       0.08 / 0.17 / 0.26         0.22 / 0.54 / 0.84
 * indexOf + re test             0.07 / 0.17 / 0.28         0.19 / 0.50 / 0.85
 *
 * An additional advantage of checking if replace actually needs to be called
 * is a reduction in the number of object allocations, so as the size of the
 * application grows the difference between the various methods would increase.
 *
 * @param {string} str string to be escaped.
 * @param {boolean=} opt_isLikelyToContainHtmlChars Don't perform a check to see
 *     if the character needs replacing - use this option if you expect each of
 *     the characters to appear often. Leave false if you expect few html
 *     characters to occur in your strings, such as if you are escaping HTML.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {

  if (opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, '&amp;')
          .replace(goog.string.ltRe_, '&lt;')
          .replace(goog.string.gtRe_, '&gt;')
          .replace(goog.string.quotRe_, '&quot;');

  } else {
    // quick test helps in the case when there are no chars to replace, in
    // worst case this makes barely a difference to the time taken
    if (!goog.string.allRe_.test(str)) return str;

    // str.indexOf is faster than regex.test in this case
    if (str.indexOf('&') != -1) {
      str = str.replace(goog.string.amperRe_, '&amp;');
    }
    if (str.indexOf('<') != -1) {
      str = str.replace(goog.string.ltRe_, '&lt;');
    }
    if (str.indexOf('>') != -1) {
      str = str.replace(goog.string.gtRe_, '&gt;');
    }
    if (str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, '&quot;');
    }
    return str;
  }
};


/**
 * Regular expression that matches an ampersand, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.amperRe_ = /&/g;


/**
 * Regular expression that matches a less than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.ltRe_ = /</g;


/**
 * Regular expression that matches a greater than sign, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.gtRe_ = />/g;


/**
 * Regular expression that matches a double quote, for use in escaping.
 * @type {RegExp}
 * @private
 */
goog.string.quotRe_ = /\"/g;


/**
 * Regular expression that matches any character that needs to be escaped.
 * @type {RegExp}
 * @private
 */
goog.string.allRe_ = /[&<>\"]/;


/**
 * Unescapes an HTML string.
 *
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapeEntities = function(str) {
  if (goog.string.contains(str, '&')) {
    // We are careful not to use a DOM if we do not have one. We use the []
    // notation so that the JSCompiler will not complain about these objects and
    // fields in the case where we have no DOM.
    // If the string contains < then there could be a script tag in there and in
    // that case we fall back to a non DOM solution as well.
    if ('document' in goog.global && !goog.string.contains(str, '<')) {
      return goog.string.unescapeEntitiesUsingDom_(str);
    } else {
      // Fall back on pure XML entities
      return goog.string.unescapePureXmlEntities_(str);
    }
  }
  return str;
};


/**
 * Unescapes an HTML string using a DOM. Don't use this function directly, it
 * should only be used by unescapeEntities. If used directly you will be
 * vulnerable to XSS attacks.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} The unescaped {@code str} string.
 */
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  // Use a DIV as FF3 generates bogus markup for A > PRE.
  var el = goog.global['document']['createElement']('div');
  // Wrap in PRE to preserve whitespace in IE.
  // The PRE must be part of the innerHTML markup,
  // just setting innerHTML on a PRE element does not work.
  // Also include a leading character since conforming HTML5
  // UAs will strip leading newlines inside a PRE element.
  el['innerHTML'] = '<pre>x' + str + '</pre>';
  // Accesing the function directly triggers some virus scanners.
  if (el['firstChild'][goog.string.NORMALIZE_FN_]) {
    el['firstChild'][goog.string.NORMALIZE_FN_]();
  }
  // Remove the leading character we added.
  str = el['firstChild']['firstChild']['nodeValue'].slice(1);
  el['innerHTML'] = '';
  // IE will also return non-standard newlines for TextNode.nodeValue,
  // switching \r and \n, so canonicalize them before returning.
  return goog.string.canonicalizeNewlines(str);
};


/**
 * Unescapes XML entities.
 * @private
 * @param {string} str The string to unescape.
 * @return {string} An unescaped copy of {@code str}.
 */
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch (entity) {
      case 'amp':
        return '&';
      case 'lt':
        return '<';
      case 'gt':
        return '>';
      case 'quot':
        return '"';
      default:
        if (entity.charAt(0) == '#') {
          var n = Number('0' + entity.substr(1));
          if (!isNaN(n)) {
            return String.fromCharCode(n);
          }
        }
        // For invalid entities we just return the entity
        return s;
    }
  });
};


/**
 * String name for the node.normalize function. Anti-virus programs use this as
 * a signature for some viruses so we need a work around (temporary).
 * @private
 * @type {string}
 */
goog.string.NORMALIZE_FN_ = 'normalize';


/**
 * Do escaping of whitespace to preserve spatial formatting. We use character
 * entity #160 to make it safer for xml.
 * @param {string} str The string in which to escape whitespace.
 * @param {boolean=} opt_xml Whether to use XML compatible tags.
 * @return {string} An escaped copy of {@code str}.
 */
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, ' &#160;'), opt_xml);
};


/**
 * Strip quote characters around a string.  The second argument is a string of
 * characters to treat as quotes.  This can be a single character or a string of
 * multiple character and in that case each of those are treated as possible
 * quote characters. For example:
 *
 * <pre>
 * goog.string.stripQuotes('"abc"', '"`') --> 'abc'
 * goog.string.stripQuotes('`abc`', '"`') --> 'abc'
 * </pre>
 *
 * @param {string} str The string to strip.
 * @param {string} quoteChars The quote characters to strip.
 * @return {string} A copy of {@code str} without the quotes.
 */
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for (var i = 0; i < length; i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if (str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1);
    }
  }
  return str;
};


/**
 * Truncates a string to a certain length and adds '...' if necessary.  The
 * length also accounts for the ellipsis, so a maximum length of 10 and a string
 * 'Hello World!' produces 'Hello W...'.
 * @param {string} str The string to truncate.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cut off in the middle.
 * @return {string} The truncated {@code str} string.
 */
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    str = str.substring(0, chars - 3) + '...';
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Truncate a string in the middle, adding "..." if necessary,
 * and favoring the beginning of the string.
 * @param {string} str The string to truncate the middle of.
 * @param {number} chars Max number of characters.
 * @param {boolean=} opt_protectEscapedCharacters Whether to protect escaped
 *     characters from being cutoff in the middle.
 * @return {string} A truncated copy of {@code str}.
 */
goog.string.truncateMiddle = function(str, chars,
    opt_protectEscapedCharacters) {
  if (opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str);
  }

  if (str.length > chars) {
    // Favor the beginning of the string:
    var half = Math.floor(chars / 2);
    var endPos = str.length - half;
    half += chars % 2;
    str = str.substring(0, half) + '...' + str.substring(endPos);
  }

  if (opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str);
  }

  return str;
};


/**
 * Special chars that need to be escaped for goog.string.quote.
 * @private
 * @type {Object}
 */
goog.string.specialEscapeChars_ = {
  '\0': '\\0',
  '\b': '\\b',
  '\f': '\\f',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\x0B': '\\x0B', // '\v' is not supported in JScript
  '"': '\\"',
  '\\': '\\\\'
};


/**
 * Character mappings used internally for goog.string.escapeChar.
 * @private
 * @type {Object}
 */
goog.string.jsEscapeCache_ = {
  '\'': '\\\''
};


/**
 * Encloses a string in double quotes and escapes characters so that the
 * string is a valid JS string.
 * @param {string} s The string to quote.
 * @return {string} A copy of {@code s} surrounded by double quotes.
 */
goog.string.quote = function(s) {
  s = String(s);
  if (s.quote) {
    return s.quote();
  } else {
    var sb = ['"'];
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] ||
          ((cc > 31 && cc < 127) ? ch : goog.string.escapeChar(ch));
    }
    sb.push('"');
    return sb.join('');
  }
};


/**
 * Takes a string and returns the escaped string for that character.
 * @param {string} str The string to escape.
 * @return {string} An escaped string representing {@code str}.
 */
goog.string.escapeString = function(str) {
  var sb = [];
  for (var i = 0; i < str.length; i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i));
  }
  return sb.join('');
};


/**
 * Takes a character and returns the escaped string for that character. For
 * example escapeChar(String.fromCharCode(15)) -> "\\x0E".
 * @param {string} c The character to escape.
 * @return {string} An escaped string representing {@code c}.
 */
goog.string.escapeChar = function(c) {
  if (c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c];
  }

  if (c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c];
  }

  var rv = c;
  var cc = c.charCodeAt(0);
  if (cc > 31 && cc < 127) {
    rv = c;
  } else {
    // tab is 9 but handled above
    if (cc < 256) {
      rv = '\\x';
      if (cc < 16 || cc > 256) {
        rv += '0';
      }
    } else {
      rv = '\\u';
      if (cc < 4096) { // \u1000
        rv += '0';
      }
    }
    rv += cc.toString(16).toUpperCase();
  }

  return goog.string.jsEscapeCache_[c] = rv;
};


/**
 * Takes a string and creates a map (Object) in which the keys are the
 * characters in the string. The value for the key is set to true. You can
 * then use goog.object.map or goog.array.map to change the values.
 * @param {string} s The string to build the map from.
 * @return {Object} The map of characters used.
 */
// TODO(user): It seems like we should have a generic goog.array.toMap. But do
//            we want a dependency on goog.array in goog.string?
goog.string.toMap = function(s) {
  var rv = {};
  for (var i = 0; i < s.length; i++) {
    rv[s.charAt(i)] = true;
  }
  return rv;
};


/**
 * Checks whether a string contains a given character.
 * @param {string} s The string to test.
 * @param {string} ss The substring to test for.
 * @return {boolean} True if {@code s} contains {@code ss}.
 */
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1;
};


/**
 * Removes a substring of a specified length at a specific
 * index in a string.
 * @param {string} s The base string from which to remove.
 * @param {number} index The index at which to remove the substring.
 * @param {number} stringLength The length of the substring to remove.
 * @return {string} A copy of {@code s} with the substring removed or the full
 *     string if nothing is removed or the input is invalid.
 */
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  // If the index is greater or equal to 0 then remove substring
  if (index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) +
        s.substr(index + stringLength, s.length - index - stringLength);
  }
  return resultStr;
};


/**
 *  Removes the first occurrence of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), '');
  return s.replace(re, '');
};


/**
 *  Removes all occurrences of a substring from a string.
 *  @param {string} s The base string from which to remove.
 *  @param {string} ss The string to remove.
 *  @return {string} A copy of {@code s} with {@code ss} removed or the full
 *      string if nothing is removed.
 */
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), 'g');
  return s.replace(re, '');
};


/**
 * Escapes characters in the string that are not safe to use in a RegExp.
 * @param {*} s The string to escape. If not a string, it will be casted
 *     to one.
 * @return {string} A RegExp safe, escaped copy of {@code s}.
 */
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').
      replace(/\x08/g, '\\x08');
};


/**
 * Repeats a string n times.
 * @param {string} string The string to repeat.
 * @param {number} length The number of times to repeat.
 * @return {string} A string containing {@code length} repetitions of
 *     {@code string}.
 */
goog.string.repeat = function(string, length) {
  return new Array(length + 1).join(string);
};


/**
 * Pads number to given length and optionally rounds it to a given precision.
 * For example:
 * <pre>padNumber(1.25, 2, 3) -> '01.250'
 * padNumber(1.25, 2) -> '01.25'
 * padNumber(1.25, 2, 1) -> '01.3'
 * padNumber(1.25, 0) -> '1.25'</pre>
 *
 * @param {number} num The number to pad.
 * @param {number} length The desired length.
 * @param {number=} opt_precision The desired precision.
 * @return {string} {@code num} as a string with the given options.
 */
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf('.');
  if (index == -1) {
    index = s.length;
  }
  return goog.string.repeat('0', Math.max(0, length - index)) + s;
};


/**
 * Returns a string representation of the given object, with
 * null and undefined being returned as the empty string.
 *
 * @param {*} obj The object to convert.
 * @return {string} A string representation of the {@code obj}.
 */
goog.string.makeSafe = function(obj) {
  return obj == null ? '' : String(obj);
};


/**
 * Concatenates string expressions. This is useful
 * since some browsers are very inefficient when it comes to using plus to
 * concat strings. Be careful when using null and undefined here since
 * these will not be included in the result. If you need to represent these
 * be sure to cast the argument to a String first.
 * For example:
 * <pre>buildString('a', 'b', 'c', 'd') -> 'abcd'
 * buildString(null, undefined) -> ''
 * </pre>
 * @param {...*} var_args A list of strings to concatenate. If not a string,
 *     it will be casted to one.
 * @return {string} The concatenation of {@code var_args}.
 */
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, '');
};


/**
 * Returns a string with at least 64-bits of randomness.
 *
 * Doesn't trust Javascript's random function entirely. Uses a combination of
 * random and current timestamp, and then encodes the string in base-36 to
 * make it shorter.
 *
 * @return {string} A random string, e.g. sn1s7vb4gcic.
 */
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) +
         Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36);
};


/**
 * Compares two version numbers.
 *
 * @param {string|number} version1 Version of first item.
 * @param {string|number} version2 Version of second item.
 *
 * @return {number}  1 if {@code version1} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code version2} is higher.
 */
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  // Trim leading and trailing whitespace and split the versions into
  // subversions.
  var v1Subs = goog.string.trim(String(version1)).split('.');
  var v2Subs = goog.string.trim(String(version2)).split('.');
  var subCount = Math.max(v1Subs.length, v2Subs.length);

  // Iterate over the subversions, as long as they appear to be equivalent.
  for (var subIdx = 0; order == 0 && subIdx < subCount; subIdx++) {
    var v1Sub = v1Subs[subIdx] || '';
    var v2Sub = v2Subs[subIdx] || '';

    // Split the subversions into pairs of numbers and qualifiers (like 'b').
    // Two different RegExp objects are needed because they are both using
    // the 'g' flag.
    var v1CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    var v2CompParser = new RegExp('(\\d*)(\\D*)', 'g');
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ['', '', ''];
      var v2Comp = v2CompParser.exec(v2Sub) || ['', '', ''];
      // Break if there are no more matches.
      if (v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break;
      }

      // Parse the numeric part of the subversion. A missing number is
      // equivalent to 0.
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);

      // Compare the subversion components. The number has the highest
      // precedence. Next, if the numbers are equal, a subversion without any
      // qualifier is always higher than a subversion with any qualifier. Next,
      // the qualifiers are compared as strings.
      order = goog.string.compareElements_(v1CompNum, v2CompNum) ||
          goog.string.compareElements_(v1Comp[2].length == 0,
              v2Comp[2].length == 0) ||
          goog.string.compareElements_(v1Comp[2], v2Comp[2]);
      // Stop as soon as an inequality is discovered.
    } while (order == 0);
  }

  return order;
};


/**
 * Compares elements of a version number.
 *
 * @param {string|number|boolean} left An element from a version number.
 * @param {string|number|boolean} right An element from a version number.
 *
 * @return {number}  1 if {@code left} is higher.
 *                   0 if arguments are equal.
 *                  -1 if {@code right} is higher.
 * @private
 */
goog.string.compareElements_ = function(left, right) {
  if (left < right) {
    return -1;
  } else if (left > right) {
    return 1;
  }
  return 0;
};


/**
 * Maximum value of #goog.string.hashCode, exclusive. 2^32.
 * @type {number}
 * @private
 */
goog.string.HASHCODE_MAX_ = 0x100000000;


/**
 * String hash function similar to java.lang.String.hashCode().
 * The hash code for a string is computed as
 * s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
 * where s[i] is the ith character of the string and n is the length of
 * the string. We mod the result to make it between 0 (inclusive) and 2^32
 * (exclusive).
 * @param {string} str A string.
 * @return {number} Hash value for {@code str}, between 0 (inclusive) and 2^32
 *  (exclusive). The empty string returns 0.
 */
goog.string.hashCode = function(str) {
  var result = 0;
  for (var i = 0; i < str.length; ++i) {
    result = 31 * result + str.charCodeAt(i);
    // Normalize to 4 byte range, 0 ... 2^32.
    result %= goog.string.HASHCODE_MAX_;
  }
  return result;
};


/**
 * The most recent unique ID. |0 is equivalent to Math.floor in this case.
 * @type {number}
 * @private
 */
goog.string.uniqueStringCounter_ = Math.random() * 0x80000000 | 0;


/**
 * Generates and returns a string which is unique in the current document.
 * This is useful, for example, to create unique IDs for DOM elements.
 * @return {string} A unique id.
 */
goog.string.createUniqueString = function() {
  return 'goog_' + goog.string.uniqueStringCounter_++;
};


/**
 * Converts the supplied string to a number, which may be Ininity or NaN.
 * This function strips whitespace: (toNumber(' 123') === 123)
 * This function accepts scientific notation: (toNumber('1e1') === 10)
 *
 * This is better than Javascript's built-in conversions because, sadly:
 *     (Number(' ') === 0) and (parseFloat('123a') === 123)
 *
 * @param {string} str The string to convert.
 * @return {number} The number the supplied string represents, or NaN.
 */
goog.string.toNumber = function(str) {
  var num = Number(str);
  if (num == 0 && goog.string.isEmpty(str)) {
    return NaN;
  }
  return num;
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities to check the preconditions, postconditions and
 * invariants runtime.
 *
 * Methods in this package should be given special treatment by the compiler
 * for type-inference. For example, <code>goog.asserts.assert(foo)</code>
 * will restrict <code>foo</code> to a truthy value.
 *
 * The compiler has an option to disable asserts. So code like:
 * <code>
 * var x = goog.asserts.assert(foo()); goog.asserts.assert(bar());
 * </code>
 * will be transformed into:
 * <code>
 * var x = foo();
 * </code>
 * The compiler will leave in foo() (because its return value is used),
 * but it will remove bar() because it assumes it does not have side-effects.
 *
 */

goog.provide('goog.asserts');
goog.provide('goog.asserts.AssertionError');

goog.require('goog.debug.Error');
goog.require('goog.string');


/**
 * @define {boolean} Whether to strip out asserts or to leave them in.
 */
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;



/**
 * Error object for failed assertions.
 * @param {string} messagePattern The pattern that was used to form message.
 * @param {!Array.<*>} messageArgs The items to substitute into the pattern.
 * @constructor
 * @extends {goog.debug.Error}
 */
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  // Remove the messagePattern afterwards to avoid permenantly modifying the
  // passed in array.
  messageArgs.shift();

  /**
   * The message pattern used to format the error message. Error handlers can
   * use this to uniquely identify the assertion.
   * @type {string}
   */
  this.messagePattern = messagePattern;
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);


/** @inheritDoc */
goog.asserts.AssertionError.prototype.name = 'AssertionError';


/**
 * Throws an exception with the given message and "Assertion failed" prefixed
 * onto it.
 * @param {string} defaultMessage The message to use if givenMessage is empty.
 * @param {Array.<*>} defaultArgs The substitution arguments for defaultMessage.
 * @param {string|undefined} givenMessage Message supplied by the caller.
 * @param {Array.<*>} givenArgs The substitution arguments for givenMessage.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 * @private
 */
goog.asserts.doAssertFailure_ =
    function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = 'Assertion failed';
  if (givenMessage) {
    message += ': ' + givenMessage;
    var args = givenArgs;
  } else if (defaultMessage) {
    message += ': ' + defaultMessage;
    args = defaultArgs;
  }
  // The '' + works around an Opera 10 bug in the unit tests. Without it,
  // a stack trace is added to var message above. With this, a stack trace is
  // not added until this line (it causes the extra garbage to be added after
  // the assertion message instead of in the middle of it).
  throw new goog.asserts.AssertionError('' + message, args || []);
};


/**
 * Checks if the condition evaluates to true if goog.asserts.ENABLE_ASSERTS is
 * true.
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {*} The value of the condition.
 * @throws {goog.asserts.AssertionError} When the condition evaluates to false.
 */
goog.asserts.assert = function(condition, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_('', null, opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return condition;
};


/**
 * Fails if goog.asserts.ENABLE_ASSERTS is true. This function is useful in case
 * when we want to add a check in the unreachable area like switch-case
 * statement:
 *
 * <pre>
 *  switch(type) {
 *    case FOO: doSomething(); break;
 *    case BAR: doSomethingElse(); break;
 *    default: goog.assert.fail('Unrecognized type: ' + type);
 *      // We have only 2 types - "default:" section is unreachable code.
 *  }
 * </pre>
 *
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} Failure.
 */
goog.asserts.fail = function(opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError(
        'Failure' + (opt_message ? ': ' + opt_message : ''),
        Array.prototype.slice.call(arguments, 1));
  }
};


/**
 * Checks if the value is a number if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {number} The value, guaranteed to be a number when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a number.
 */
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_('Expected number but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {number} */ (value);
};


/**
 * Checks if the value is a string if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {string} The value, guaranteed to be a string when asserts enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a string.
 */
goog.asserts.assertString = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_('Expected string but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {string} */ (value);
};


/**
 * Checks if the value is a function if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Function} The value, guaranteed to be a function when asserts
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a function.
 */
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_('Expected function but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Function} */ (value);
};


/**
 * Checks if the value is an Object if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Object} The value, guaranteed to be a non-null object.
 * @throws {goog.asserts.AssertionError} When the value is not an object.
 */
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_('Expected object but got %s: %s.',
        [goog.typeOf(value), value],
        opt_message, Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Object} */ (value);
};


/**
 * Checks if the value is an Array if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {!Array} The value, guaranteed to be a non-null array.
 * @throws {goog.asserts.AssertionError} When the value is not an array.
 */
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_('Expected array but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {!Array} */ (value);
};


/**
 * Checks if the value is a boolean if goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @return {boolean} The value, guaranteed to be a boolean when asserts are
 *     enabled.
 * @throws {goog.asserts.AssertionError} When the value is not a boolean.
 */
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_('Expected boolean but got %s: %s.',
        [goog.typeOf(value), value], opt_message,
        Array.prototype.slice.call(arguments, 2));
  }
  return /** @type {boolean} */ (value);
};


/**
 * Checks if the value is an instance of the user-defined type if
 * goog.asserts.ENABLE_ASSERTS is true.
 * @param {*} value The value to check.
 * @param {!Function} type A user-defined constructor.
 * @param {string=} opt_message Error message in case of failure.
 * @param {...*} var_args The items to substitute into the failure message.
 * @throws {goog.asserts.AssertionError} When the value is not an instance of
 *     type.
 */
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if (goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_('instanceof check failed.', null,
        opt_message, Array.prototype.slice.call(arguments, 3));
  }
};



// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating arrays.
 *
 */


goog.provide('goog.array');
goog.provide('goog.array.ArrayLike');

goog.require('goog.asserts');


/**
 * @typedef {Array|NodeList|Arguments|{length: number}}
 */
goog.array.ArrayLike;


/**
 * Returns the last element in an array without removing it.
 * @param {goog.array.ArrayLike} array The array.
 * @return {*} Last item in array.
 */
goog.array.peek = function(array) {
  return array[array.length - 1];
};


/**
 * Reference to the original {@code Array.prototype}.
 * @private
 */
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;


// NOTE(user): Since most of the array functions are generic it allows you to
// pass an array-like object. Strings have a length and are considered array-
// like. However, the 'in' operator does not work on strings so we cannot just
// use the array path even if the browser supports indexing into strings. We
// therefore end up splitting the string.


/**
 * Returns the index of the first element of an array with a specified
 * value, or -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-indexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at index 0.
 * @return {number} The index of the first matching array element.
 */
goog.array.indexOf = goog.array.ARRAY_PROTOTYPE_.indexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ?
          0 : (opt_fromIndex < 0 ?
               Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex);

      if (goog.isString(arr)) {
        // Array.prototype.indexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.indexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i < arr.length; i++) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Returns the index of the last element of an array with a specified value, or
 * -1 if the element is not present in the array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-lastindexof}
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} obj The object for which we are searching.
 * @param {?number=} opt_fromIndex The index at which to start the search. If
 *     omitted the search starts at the end of the array.
 * @return {number} The index of the last matching array element.
 */
goog.array.lastIndexOf = goog.array.ARRAY_PROTOTYPE_.lastIndexOf ?
    function(arr, obj, opt_fromIndex) {
      goog.asserts.assert(arr.length != null);

      // Firefox treats undefined and null as 0 in the fromIndex argument which
      // leads it to always return -1
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
      return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex);
    } :
    function(arr, obj, opt_fromIndex) {
      var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;

      if (fromIndex < 0) {
        fromIndex = Math.max(0, arr.length + fromIndex);
      }

      if (goog.isString(arr)) {
        // Array.prototype.lastIndexOf uses === so only strings should be found.
        if (!goog.isString(obj) || obj.length != 1) {
          return -1;
        }
        return arr.lastIndexOf(obj, fromIndex);
      }

      for (var i = fromIndex; i >= 0; i--) {
        if (i in arr && arr[i] === obj)
          return i;
      }
      return -1;
    };


/**
 * Calls a function for each element in an array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-foreach}
 *
 * @param {goog.array.ArrayLike} arr Array or array like object over
 *     which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored. The function is called only for indexes of the array
 *     which have assigned values; it is not called for indexes which have
 *     been deleted or which have never been assigned values.
 *
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEach = goog.array.ARRAY_PROTOTYPE_.forEach ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          f.call(opt_obj, arr2[i], i, arr);
        }
      }
    };


/**
 * Calls a function for each element in an array, starting from the last
 * element rather than the first.
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array). The return
 *     value is ignored.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 */
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; --i) {
    if (i in arr2) {
      f.call(opt_obj, arr2[i], i, arr);
    }
  }
};


/**
 * Calls a function for each element in an array, and if the function returns
 * true adds the element to a new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-filter}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean. If the return value is true the element is added to the
 *     result array. If it is false the element is not included.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array in which only elements that passed the test are
 *     present.
 */
goog.array.filter = goog.array.ARRAY_PROTOTYPE_.filter ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = [];
      var resLength = 0;
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          var val = arr2[i];  // in case f mutates arr2
          if (f.call(opt_obj, val, i, arr)) {
            res[resLength++] = val;
          }
        }
      }
      return res;
    };


/**
 * Calls a function for each element in an array and inserts the result into a
 * new array.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-map}
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return something. The result will be inserted into a new array.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {!Array} a new array with the results from f.
 */
goog.array.map = goog.array.ARRAY_PROTOTYPE_.map ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var res = new Array(l);
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2) {
          res[i] = f.call(opt_obj, arr2[i], i, arr);
        }
      }
      return res;
    };


/**
 * Passes every element of an array into a function and accumulates the result.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduce}
 *
 * For example:
 * var a = [1, 2, 3, 4];
 * goog.array.reduce(a, function(r, v, i, arr) {return r + v;}, 0);
 * returns 10
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {*} Result of evaluating f repeatedly across the values of the array.
 */
goog.array.reduce = function(arr, f, val, opt_obj) {
  if (arr.reduce) {
    if (opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduce(f, val);
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Passes every element of an array into a function and accumulates the result,
 * starting from the last element and working towards the first.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-reduceright}
 *
 * For example:
 * var a = ['a', 'b', 'c'];
 * goog.array.reduceRight(a, function(r, v, i, arr) {return r + v;}, '');
 * returns 'cba'
 *
 * @param {goog.array.ArrayLike} arr The array over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 4 arguments (the function's previous result or the initial value,
 *     the value of the current array element, the current array index, and the
 *     array itself)
 *     function(previousValue, currentValue, index, array).
 * @param {*} val The initial value to pass into the function on the first call.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {*} Object returned as a result of evaluating f repeatedly across the
 *     values of the array.
 */
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if (arr.reduceRight) {
    if (opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val);
    } else {
      return arr.reduceRight(f, val);
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr);
  });
  return rval;
};


/**
 * Calls f for each element of an array. If any call returns true, some()
 * returns true (without checking the remaining elements). If all calls
 * return false, some() returns false.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-some}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj  The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} true if any element passes the test.
 */
goog.array.some = goog.array.ARRAY_PROTOTYPE_.some ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
          return true;
        }
      }
      return false;
    };


/**
 * Call f for each element of an array. If all calls return true, every()
 * returns true. If any call returns false, every() returns false and
 * does not continue to check the remaining elements.
 *
 * See {@link http://tinyurl.com/developer-mozilla-org-array-every}
 *
 * @param {goog.array.ArrayLike} arr The array to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a Boolean.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within f.
 * @return {boolean} false if any element fails the test.
 */
goog.array.every = goog.array.ARRAY_PROTOTYPE_.every ?
    function(arr, f, opt_obj) {
      goog.asserts.assert(arr.length != null);

      return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj);
    } :
    function(arr, f, opt_obj) {
      var l = arr.length;  // must be fixed during loop... see docs
      var arr2 = goog.isString(arr) ? arr.split('') : arr;
      for (var i = 0; i < l; i++) {
        if (i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
          return false;
        }
      }
      return true;
    };


/**
 * Search an array for the first element that satisfies a given condition and
 * return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The first array element that passes the test, or null if no
 *     element is found.
 */
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array for the first element that satisfies a given condition and
 * return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the first array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = 0; i < l; i++) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return that element.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {*} The last array element that passes the test, or null if no
 *     element is found.
 */
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i];
};


/**
 * Search an array (in reverse order) for the last element that satisfies a
 * given condition and return its index.
 * @param {goog.array.ArrayLike} arr The array to search.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {number} The index of the last array element that passes the test,
 *     or -1 if no element is found.
 */
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;  // must be fixed during loop... see docs
  var arr2 = goog.isString(arr) ? arr.split('') : arr;
  for (var i = l - 1; i >= 0; i--) {
    if (i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i;
    }
  }
  return -1;
};


/**
 * Whether the array contains the given object.
 * @param {goog.array.ArrayLike} arr The array to test for the presence of the
 *     element.
 * @param {*} obj The object for which to test.
 * @return {boolean} true if obj is present.
 */
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0;
};


/**
 * Whether the array is empty.
 * @param {goog.array.ArrayLike} arr The array to test.
 * @return {boolean} true if empty.
 */
goog.array.isEmpty = function(arr) {
  return arr.length == 0;
};


/**
 * Clears the array.
 * @param {goog.array.ArrayLike} arr Array or array like object to clear.
 */
goog.array.clear = function(arr) {
  // For non real arrays we don't have the magic length so we delete the
  // indices.
  if (!goog.isArray(arr)) {
    for (var i = arr.length - 1; i >= 0; i--) {
      delete arr[i];
    }
  }
  arr.length = 0;
};


/**
 * Pushes an item into an array, if it's not already in the array.
 * @param {Array} arr Array into which to insert the item.
 * @param {*} obj Value to add.
 */
goog.array.insert = function(arr, obj) {
  if (!goog.array.contains(arr, obj)) {
    arr.push(obj);
  }
};


/**
 * Inserts an object at the given index of the array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj);
};


/**
 * Inserts at the given index of the array, all elements of another array.
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {goog.array.ArrayLike} elementsToAdd The array of elements to add.
 * @param {number=} opt_i The index at which to insert the object. If omitted,
 *      treated as 0. A negative index is counted from the end of the array.
 */
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd);
};


/**
 * Inserts an object into an array before a specified object.
 * @param {Array} arr The array to modify.
 * @param {*} obj The object to insert.
 * @param {*=} opt_obj2 The object before which obj should be inserted. If obj2
 *     is omitted or not found, obj is inserted at the end of the array.
 */
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if (arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj);
  } else {
    goog.array.insertAt(arr, obj, i);
  }
};


/**
 * Removes the first occurrence of a particular value from an array.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {*} obj Object to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if ((rv = i >= 0)) {
    goog.array.removeAt(arr, i);
  }
  return rv;
};


/**
 * Removes from an array the element at index i
 * @param {goog.array.ArrayLike} arr Array or array like object from which to
 *     remove value.
 * @param {number} i The index to remove.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);

  // use generic form of splice
  // splice returns the removed items and if successful the length of that
  // will be 1
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1;
};


/**
 * Removes the first value that satisfies the given condition.
 * @param {goog.array.ArrayLike} arr Array from which to remove value.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the array) and should
 *     return a boolean.
 * @param {Object=} opt_obj An optional "this" context for the function.
 * @return {boolean} True if an element was removed.
 */
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if (i >= 0) {
    goog.array.removeAt(arr, i);
    return true;
  }
  return false;
};


/**
 * Returns a new array that is the result of joining the arguments.  If arrays
 * are passed then their items are added, however, if non-arrays are passed they
 * will be added to the return array as is.
 *
 * Note that ArrayLike objects will be added as is, rather than having their
 * items added.
 *
 * goog.array.concat([1, 2], [3, 4]) -> [1, 2, 3, 4]
 * goog.array.concat(0, [1, 2]) -> [0, 1, 2]
 * goog.array.concat([1, 2], null) -> [1, 2, null]
 *
 * There is bug in all current versions of IE (6, 7 and 8) where arrays created
 * in an iframe become corrupted soon (not immediately) after the iframe is
 * destroyed. This is common if loading data via goog.net.IframeIo, for example.
 * This corruption only affects the concat method which will start throwing
 * Catastrophic Errors (#-2147418113).
 *
 * See http://endoflow.com/scratch/corrupted-arrays.html for a test case.
 *
 * Internally goog.array should use this, so that all methods will continue to
 * work on these broken array objects.
 *
 * @param {...*} var_args Items to concatenate.  Arrays will have each item
 *     added, while primitives and objects will be added as is.
 * @return {!Array} The new resultant array.
 */
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(
      goog.array.ARRAY_PROTOTYPE_, arguments);
};


/**
 * Does a shallow copy of an array.
 * @param {goog.array.ArrayLike} arr  Array or array-like object to clone.
 * @return {!Array} Clone of the input array.
 */
goog.array.clone = function(arr) {
  if (goog.isArray(arr)) {
    return goog.array.concat(/** @type {!Array} */ (arr));
  } else { // array like
    // Concat does not work with non arrays.
    var rv = [];
    for (var i = 0, len = arr.length; i < len; i++) {
      rv[i] = arr[i];
    }
    return rv;
  }
};


/**
 * Converts an object to an array.
 * @param {goog.array.ArrayLike} object  The object to convert to an array.
 * @return {!Array} The object converted into an array. If object has a
 *     length property, every property indexed with a non-negative number
 *     less than length will be included in the result. If object does not
 *     have a length property, an empty array will be returned.
 */
goog.array.toArray = function(object) {
  if (goog.isArray(object)) {
    // This fixes the JS compiler warning and forces the Object to an Array type
    return goog.array.concat(/** @type {!Array} */ (object));
  }
  // Clone what we hope to be an array-like object to an array.
  // We could check isArrayLike() first, but no check we perform would be as
  // reliable as simply making the call.
  return goog.array.clone(/** @type {Array} */ (object));
};


/**
 * Extends an array with another array, element, or "array like" object.
 * This function operates 'in-place', it does not create a new Array.
 *
 * Example:
 * var a = [];
 * goog.array.extend(a, [0, 1]);
 * a; // [0, 1]
 * goog.array.extend(a, 2);
 * a; // [0, 1, 2]
 *
 * @param {Array} arr1  The array to modify.
 * @param {...*} var_args The elements or arrays of elements to add to arr1.
 */
goog.array.extend = function(arr1, var_args) {
  for (var i = 1; i < arguments.length; i++) {
    var arr2 = arguments[i];
    // If we have an Array or an Arguments object we can just call push
    // directly.
    var isArrayLike;
    if (goog.isArray(arr2) ||
        // Detect Arguments. ES5 says that the [[Class]] of an Arguments object
        // is "Arguments" but only V8 and JSC/Safari gets this right. We instead
        // detect Arguments by checking for array like and presence of "callee".
        (isArrayLike = goog.isArrayLike(arr2)) &&
            // The getter for callee throws an exception in strict mode
            // according to section 10.6 in ES5 so check for presence instead.
            arr2.hasOwnProperty('callee')) {
      arr1.push.apply(arr1, arr2);

    } else if (isArrayLike) {
      // Otherwise loop over arr2 to prevent copying the object.
      var len1 = arr1.length;
      var len2 = arr2.length;
      for (var j = 0; j < len2; j++) {
        arr1[len1 + j] = arr2[j];
      }
    } else {
      arr1.push(arr2);
    }
  }
};


/**
 * Adds or removes elements from an array. This is a generic version of Array
 * splice. This means that it might work on other objects similar to arrays,
 * such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array to modify.
 * @param {number|undefined} index The index at which to start changing the
 *     array. If not defined, treated as 0.
 * @param {number} howMany How many elements to remove (0 means no removal. A
 *     value below 0 is treated as zero and so is any other non number. Numbers
 *     are floored).
 * @param {...*} var_args Optional, additional elements to insert into the
 *     array.
 * @return {!Array} the removed elements.
 */
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);

  return goog.array.ARRAY_PROTOTYPE_.splice.apply(
      arr, goog.array.slice(arguments, 1));
};


/**
 * Returns a new array from a segment of an array. This is a generic version of
 * Array slice. This means that it might work on other objects similar to
 * arrays, such as the arguments object.
 *
 * @param {goog.array.ArrayLike} arr The array from which to copy a segment.
 * @param {number} start The index of the first element to copy.
 * @param {number=} opt_end The index after the last element to copy.
 * @return {!Array} A new array containing the specified segment of the original
 *     array.
 */
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);

  // passing 1 arg to slice is not the same as passing 2 where the second is
  // null or undefined (in that case the second argument is treated as 0).
  // we could use slice on the arguments object and then use apply instead of
  // testing the length
  if (arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start);
  } else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end);
  }
};


/**
 * Removes all duplicates from an array (retaining only the first
 * occurrence of each array element).  This function modifies the
 * array in place and doesn't change the order of the non-duplicate items.
 *
 * For objects, duplicates are identified as having the same unique ID as
 * defined by {@link goog.getUid}.
 *
 * Runtime: N,
 * Worstcase space: 2N (no dupes)
 *
 * @param {goog.array.ArrayLike} arr The array from which to remove duplicates.
 * @param {Array=} opt_rv An optional array in which to return the results,
 *     instead of performing the removal inplace.  If specified, the original
 *     array will remain unchanged.
 */
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;

  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];

    // Prefix each type with a single character representing the type to
    // prevent conflicting keys (e.g. true and 'true').
    var key = goog.isObject(current) ?
        'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;

    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current;
    }
  }
  returnArray.length = cursorInsert;
};


/**
 * Searches the specified array for the specified target using the binary
 * search algorithm.  If no opt_compareFn is specified, elements are compared
 * using <code>goog.array.defaultCompare</code>, which compares the elements
 * using the built in < and > operators.  This will produce the expected
 * behavior for homogeneous arrays of String(s) and Number(s). The array
 * specified <b>must</b> be sorted in ascending order (as defined by the
 * comparison function).  If the array is not sorted, results are undefined.
 * If the array contains multiple instances of the specified target value, any
 * of these instances may be found.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {*} target The sought value.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 */
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr,
      opt_compareFn || goog.array.defaultCompare, false /* isEvaluator */,
      target);
};


/**
 * Selects an index in the specified array using the binary search algorithm.
 * The evaluator receives an element and determines whether the desired index
 * is before, at, or after it.  The evaluator must be consistent (formally,
 * goog.array.map(goog.array.map(arr, evaluator, opt_obj), goog.math.sign)
 * must be monotonically non-increasing).
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} evaluator Evaluator function that receives 3 arguments
 *     (the element, the index and the array). Should return a negative number,
 *     zero, or a positive number depending on whether the desired index is
 *     before, at, or after the element passed to it.
 * @param {Object=} opt_obj The object to be used as the value of 'this'
 *     within evaluator.
 * @return {number} Index of the leftmost element matched by the evaluator, if
 *     such exists; otherwise (-(insertion point) - 1). The insertion point is
 *     the index of the first element for which the evaluator returns negative,
 *     or arr.length if no such element exists. The return value is non-negative
 *     iff a match is found.
 */
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true /* isEvaluator */,
      undefined /* opt_target */, opt_obj);
};


/**
 * Implementation of a binary search algorithm which knows how to use both
 * comparison functions and evaluators. If an evaluator is provided, will call
 * the evaluator with the given optional data object, conforming to the
 * interface defined in binarySelect. Otherwise, if a comparison function is
 * provided, will call the comparison function against the given data object.
 *
 * This implementation purposefully does not use goog.bind or goog.partial for
 * performance reasons.
 *
 * Runtime: O(log n)
 *
 * @param {goog.array.ArrayLike} arr The array to be searched.
 * @param {Function} compareFn Either an evaluator or a comparison function,
 *     as defined by binarySearch and binarySelect above.
 * @param {boolean} isEvaluator Whether the function is an evaluator or a
 *     comparison function.
 * @param {*=} opt_target If the function is a comparison function, then this is
 *     the target to binary search for.
 * @param {Object=} opt_selfObj If the function is an evaluator, this is an
  *    optional this object for the evaluator.
 * @return {number} Lowest index of the target value if found, otherwise
 *     (-(insertion point) - 1). The insertion point is where the value should
 *     be inserted into arr to preserve the sorted property.  Return value >= 0
 *     iff target is found.
 * @private
 */
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target,
    opt_selfObj) {
  var left = 0;  // inclusive
  var right = arr.length;  // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;
    var compareResult;
    if (isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr);
    } else {
      compareResult = compareFn(opt_target, arr[middle]);
    }
    if (compareResult > 0) {
      left = middle + 1;
    } else {
      right = middle;
      // We are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};


/**
 * Sorts the specified array into ascending order.  If no opt_compareFn is
 * specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s), unlike the native sort,
 * but will give unpredictable results for heterogenous lists of strings and
 * numbers with different numbers of digits.
 *
 * This sort is not guaranteed to be stable.
 *
 * Runtime: Same as <code>Array.prototype.sort</code>
 *
 * @param {Array} arr The array to be sorted.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is to be ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 */
goog.array.sort = function(arr, opt_compareFn) {
  // TODO(user): Update type annotation since null is not accepted.
  goog.asserts.assert(arr.length != null);

  goog.array.ARRAY_PROTOTYPE_.sort.call(
      arr, opt_compareFn || goog.array.defaultCompare);
};


/**
 * Sorts the specified array into ascending order in a stable way.  If no
 * opt_compareFn is specified, elements are compared using
 * <code>goog.array.defaultCompare</code>, which compares the elements using
 * the built in < and > operators.  This will produce the expected behavior
 * for homogeneous arrays of String(s) and Number(s).
 *
 * Runtime: Same as <code>Array.prototype.sort</code>, plus an additional
 * O(n) overhead of copying the array twice.
 *
 * @param {Array} arr The array to be sorted.
 * @param {function(*, *): number=} opt_compareFn Optional comparison function
 *     by which the array is to be ordered. Should take 2 arguments to compare,
 *     and return a negative number, zero, or a positive number depending on
 *     whether the first argument is less than, equal to, or greater than the
 *     second.
 */
goog.array.stableSort = function(arr, opt_compareFn) {
  for (var i = 0; i < arr.length; i++) {
    arr[i] = {index: i, value: arr[i]};
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index;
  };
  goog.array.sort(arr, stableCompareFn);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = arr[i].value;
  }
};


/**
 * Sorts an array of objects by the specified object key and compare
 * function. If no compare function is provided, the key values are
 * compared in ascending order using <code>goog.array.defaultCompare</code>.
 * This won't work for keys that get renamed by the compiler. So use
 * {'foo': 1, 'bar': 2} rather than {foo: 1, bar: 2}.
 * @param {Array.<Object>} arr An array of objects to sort.
 * @param {string} key The object key to sort by.
 * @param {Function=} opt_compareFn The function to use to compare key
 *     values.
 */
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key]);
  });
};


/**
 * Tells if the array is sorted.
 * @param {!Array} arr The array.
 * @param {Function=} opt_compareFn Function to compare the array elements.
 *     Should take 2 arguments to compare, and return a negative number, zero,
 *     or a positive number depending on whether the first argument is less
 *     than, equal to, or greater than the second.
 * @param {boolean=} opt_strict If true no equal elements are allowed.
 * @return {boolean} Whether the array is sorted.
 */
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for (var i = 1; i < arr.length; i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if (compareResult > 0 || compareResult == 0 && opt_strict) {
      return false;
    }
  }
  return true;
};


/**
 * Compares two arrays for equality. Two arrays are considered equal if they
 * have the same length and their corresponding elements are equal according to
 * the comparison function.
 *
 * @param {goog.array.ArrayLike} arr1 The first array to compare.
 * @param {goog.array.ArrayLike} arr2 The second array to compare.
 * @param {Function=} opt_equalsFn Optional comparison function.
 *     Should take 2 arguments to compare, and return true if the arguments
 *     are equal. Defaults to {@link goog.array.defaultCompareEquality} which
 *     compares the elements using the built-in '===' operator.
 * @return {boolean} Whether the two arrays are equal.
 */
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if (!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) ||
      arr1.length != arr2.length) {
    return false;
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for (var i = 0; i < l; i++) {
    if (!equalsFn(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};


/**
 * @deprecated Use {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr1 See {@link goog.array.equals}.
 * @param {goog.array.ArrayLike} arr2 See {@link goog.array.equals}.
 * @param {Function=} opt_equalsFn See {@link goog.array.equals}.
 * @return {boolean} See {@link goog.array.equals}.
 */
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn);
};


/**
 * Compares its two arguments for order, using the built in < and >
 * operators.
 * @param {*} a The first object to be compared.
 * @param {*} b The second object to be compared.
 * @return {number} A negative number, zero, or a positive number as the first
 *     argument is less than, equal to, or greater than the second.
 */
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};


/**
 * Compares its two arguments for equality, using the built in === operator.
 * @param {*} a The first object to compare.
 * @param {*} b The second object to compare.
 * @return {boolean} True if the two arguments are equal, false otherwise.
 */
goog.array.defaultCompareEquality = function(a, b) {
  return a === b;
};


/**
 * Inserts a value into a sorted array. The array is not modified if the
 * value is already present.
 * @param {Array} array The array to modify.
 * @param {*} value The object to insert.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was inserted.
 */
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true;
  }
  return false;
};


/**
 * Removes a value from a sorted array.
 * @param {Array} array The array to modify.
 * @param {*} value The object to remove.
 * @param {Function=} opt_compareFn Optional comparison function by which the
 *     array is ordered. Should take 2 arguments to compare, and return a
 *     negative number, zero, or a positive number depending on whether the
 *     first argument is less than, equal to, or greater than the second.
 * @return {boolean} True if an element was removed.
 */
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return (index >= 0) ? goog.array.removeAt(array, index) : false;
};


/**
 * Splits an array into disjoint buckets according to a splitting function.
 * @param {Array} array The array.
 * @param {Function} sorter Function to call for every element.  This
 *     takes 3 arguments (the element, the index and the array) and must
 *     return a valid object key (a string, number, etc), or undefined, if
 *     that object should not be placed in a bucket.
 * @return {!Object} An object, with keys being all of the unique return values
 *     of sorter, and values being arrays containing the items for
 *     which the splitter returned that key.
 */
goog.array.bucket = function(array, sorter) {
  var buckets = {};

  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if (goog.isDef(key)) {
      // Push the value to the right bucket, creating it if necessary.
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value);
    }
  }

  return buckets;
};


/**
 * Returns an array consisting of the given value repeated N times.
 *
 * @param {*} value The value to repeat.
 * @param {number} n The repeat count.
 * @return {!Array.<*>} An array with the repeated value.
 */
goog.array.repeat = function(value, n) {
  var array = [];
  for (var i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
};


/**
 * Returns an array consisting of every argument with all arrays
 * expanded in-place recursively.
 *
 * @param {...*} var_args The values to flatten.
 * @return {!Array.<*>} An array containing the flattened values.
 */
goog.array.flatten = function(var_args) {
  var result = [];
  for (var i = 0; i < arguments.length; i++) {
    var element = arguments[i];
    if (goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element));
    } else {
      result.push(element);
    }
  }
  return result;
};


/**
 * Rotates an array in-place. After calling this method, the element at
 * index i will be the element previously at index (i - n) %
 * array.length, for all values of i between 0 and array.length - 1,
 * inclusive.
 *
 * For example, suppose list comprises [t, a, n, k, s]. After invoking
 * rotate(array, 1) (or rotate(array, -4)), array will comprise [s, t, a, n, k].
 *
 * @param {!Array.<*>} array The array to rotate.
 * @param {number} n The amount to rotate.
 * @return {!Array.<*>} The array.
 */
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);

  if (array.length) {
    n %= array.length;
    if (n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n));
    } else if (n < 0) {
      goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n));
    }
  }
  return array;
};


/**
 * Creates a new array for which the element at position i is an array of the
 * ith element of the provided arrays.  The returned array will only be as long
 * as the shortest array provided; additional values are ignored.  For example,
 * the result of zipping [1, 2] and [3, 4, 5] is [[1,3], [2, 4]].
 *
 * This is similar to the zip() function in Python.  See {@link
 * http://docs.python.org/library/functions.html#zip}
 *
 * @param {...!goog.array.ArrayLike} var_args Arrays to be combined.
 * @return {!Array.<!Array>} A new array of arrays created from provided arrays.
 */
goog.array.zip = function(var_args) {
  if (!arguments.length) {
    return [];
  }
  var result = [];
  for (var i = 0; true; i++) {
    var value = [];
    for (var j = 0; j < arguments.length; j++) {
      var arr = arguments[j];
      // If i is larger than the array length, this is the shortest array.
      if (i >= arr.length) {
        return result;
      }
      value.push(arr[i]);
    }
    result.push(value);
  }
};


/**
 * Shuffles the values in the specified array using the Fisher-Yates in-place
 * shuffle (also known as the Knuth Shuffle). By default, calls Math.random()
 * and so resets the state of that random number generator. Similarly, may reset
 * the state of the any other specified random number generator.
 *
 * Runtime: O(n)
 *
 * @param {!Array} arr The array to be shuffled.
 * @param {Function=} opt_randFn Optional random function to use for shuffling.
 *     Takes no arguments, and returns a random number on the interval [0, 1).
 *     Defaults to Math.random() using JavaScript's built-in Math library.
 */
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;

  for (var i = arr.length - 1; i > 0; i--) {
    // Choose a random array index in [0, i] (inclusive with i).
    var j = Math.floor(randFn() * (i + 1));

    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
};


// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utilities for manipulating objects/maps/hashes.
 */

goog.provide('goog.object');


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and the return value is irrelevant.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    f.call(opt_obj, obj[key], key, obj);
  }
};


/**
 * Calls a function for each element in an object/map/hash. If that call returns
 * true, adds the element to a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This
 *     function takes 3 arguments (the element, the index and the object)
 *     and should return a boolean. If the return value is true the
 *     element is added to the result object. If it is false the
 *     element is not included.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object in which only elements that passed the test
 *     are present.
 */
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key];
    }
  }
  return res;
};


/**
 * For every element in an object/map/hash calls a function and inserts the
 * result into a new object.
 *
 * @param {Object} obj The object over which to iterate.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object)
 *     and should return something. The result will be inserted
 *     into a new object.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {!Object} a new object with the results from f.
 */
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for (var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj);
  }
  return res;
};


/**
 * Calls a function for each element in an object/map/hash. If any
 * call returns true, returns true (without checking the rest). If
 * all calls return false, returns false.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} true if any element passes the test.
 */
goog.object.some = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (f.call(opt_obj, obj[key], key, obj)) {
      return true;
    }
  }
  return false;
};


/**
 * Calls a function for each element in an object/map/hash. If
 * all calls return true, returns true. If any call returns false, returns
 * false at this point and does not continue to check the remaining elements.
 *
 * @param {Object} obj The object to check.
 * @param {Function} f The function to call for every element. This function
 *     takes 3 arguments (the element, the index and the object) and should
 *     return a boolean.
 * @param {Object=} opt_obj This is used as the 'this' object within f.
 * @return {boolean} false if any element fails the test.
 */
goog.object.every = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (!f.call(opt_obj, obj[key], key, obj)) {
      return false;
    }
  }
  return true;
};


/**
 * Returns the number of key-value pairs in the object map.
 *
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    rv++;
  }
  return rv;
};


/**
 * Returns one key from the object map, if any exists.
 * For map literals the returned key will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a key from.
 * @return {string|undefined} The key or undefined if the object is empty.
 */
goog.object.getAnyKey = function(obj) {
  for (var key in obj) {
    return key;
  }
};


/**
 * Returns one value from the object map, if any exists.
 * For map literals the returned value will be the first one in most of the
 * browsers (a know exception is Konqueror).
 *
 * @param {Object} obj The object to pick a value from.
 * @return {*} The value or undefined if the object is empty.
 */
goog.object.getAnyValue = function(obj) {
  for (var key in obj) {
    return obj[key];
  }
};


/**
 * Whether the object/hash/map contains the given object as a value.
 * An alias for goog.object.containsValue(obj, val).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The object for which to check.
 * @return {boolean} true if val is present.
 */
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val);
};


/**
 * Returns the values of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the values.
 * @return {!Array} The values in the object/map/hash.
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = obj[key];
  }
  return res;
};


/**
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array.<string>} Array of property keys.
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    res[i++] = key;
  }
  return res;
};


/**
 * Get a value from an object multiple levels deep.  This is useful for
 * pulling values from deeply nested objects, such as JSON responses.
 * Example usage: getValueByKeys(jsonObj, 'foo', 'entries', 3)
 *
 * @param {!Object} obj An object to get the value from.  Can be array-like.
 * @param {...(string|number|!Array.<number|string>)} var_args A number of keys
 *     (as strings, or nubmers, for array-like objects).  Can also be
 *     specified as a single array of keys.
 * @return {*} The resulting value.  If, at any point, the value for a key
 *     is undefined, returns undefined.
 */
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;

  // Start with the 2nd parameter for the variable parameters syntax.
  for (var i = isArrayLike ? 0 : 1; i < keys.length; i++) {
    obj = obj[keys[i]];
    if (!goog.isDef(obj)) {
      break;
    }
  }

  return obj;
};


/**
 * Whether the object/map/hash contains the given key.
 *
 * @param {Object} obj The object in which to look for key.
 * @param {*} key The key for which to check.
 * @return {boolean} true If the map contains the key.
 */
goog.object.containsKey = function(obj, key) {
  return key in obj;
};


/**
 * Whether the object/map/hash contains the given value. This is O(n).
 *
 * @param {Object} obj The object in which to look for val.
 * @param {*} val The value for which to check.
 * @return {boolean} true If the map contains the value.
 */
goog.object.containsValue = function(obj, val) {
  for (var key in obj) {
    if (obj[key] == val) {
      return true;
    }
  }
  return false;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its key.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {string|undefined} The key of an element for which the function
 *     returns true or undefined if no such element is found.
 */
goog.object.findKey = function(obj, f, opt_this) {
  for (var key in obj) {
    if (f.call(opt_this, obj[key], key, obj)) {
      return key;
    }
  }
  return undefined;
};


/**
 * Searches an object for an element that satisfies the given condition and
 * returns its value.
 * @param {Object} obj The object to search in.
 * @param {function(*, string, Object): boolean} f The function to call for
 *     every element. Takes 3 arguments (the value, the key and the object) and
 *     should return a boolean.
 * @param {Object=} opt_this An optional "this" context for the function.
 * @return {*} The value of an element for which the function returns true or
 *     undefined if no such element is found.
 */
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key];
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    return false;
  }
  return true;
};


/**
 * Removes all key value pairs from the object/map/hash.
 *
 * @param {Object} obj The object to clear.
 */
goog.object.clear = function(obj) {
  for (var i in obj) {
    delete obj[i];
  }
};


/**
 * Removes a key-value pair based on the key.
 *
 * @param {Object} obj The object from which to remove the key.
 * @param {*} key The key to remove.
 * @return {boolean} Whether an element was removed.
 */
goog.object.remove = function(obj, key) {
  var rv;
  if ((rv = key in obj)) {
    delete obj[key];
  }
  return rv;
};


/**
 * Adds a key-value pair to the object. Throws an exception if the key is
 * already in use. Use set if you want to change an existing pair.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} val The value to add.
 */
goog.object.add = function(obj, key, val) {
  if (key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val);
};


/**
 * Returns the value for the given key.
 *
 * @param {Object} obj The object from which to get the value.
 * @param {string} key The key for which to get the value.
 * @param {*=} opt_val The value to return if no item is found for the given
 *     key (default is undefined).
 * @return {*} The value for the given key.
 */
goog.object.get = function(obj, key, opt_val) {
  if (key in obj) {
    return obj[key];
  }
  return opt_val;
};


/**
 * Adds a key-value pair to the object/map/hash.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add.
 */
goog.object.set = function(obj, key, value) {
  obj[key] = value;
};


/**
 * Adds a key-value pair to the object/map/hash if it doesn't exist yet.
 *
 * @param {Object} obj The object to which to add the key-value pair.
 * @param {string} key The key to add.
 * @param {*} value The value to add if the key wasn't present.
 * @return {*} The value of the entry at the end of the function.
 */
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : (obj[key] = value);
};


/**
 * Does a flat clone of the object.
 *
 * @param {Object} obj Object to clone.
 * @return {!Object} Clone of the input object.
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    res[key] = obj[key];
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Returns a new object in which all the keys and values are interchanged
 * (keys become values and values become keys). If multiple keys map to the
 * same value, the chosen transposed value is implementation-dependent.
 *
 * @param {Object} obj The object to transpose.
 * @return {!Object} The transposed object.
 */
goog.object.transpose = function(obj) {
  var transposed = {};
  for (var key in obj) {
    transposed[obj[key]] = key;
  }
  return transposed;
};


/**
 * The names of the fields that are defined on Object.prototype.
 * @type {Array.<string>}
 * @private
 */
goog.object.PROTOTYPE_FIELDS_ = [
  'constructor',
  'hasOwnProperty',
  'isPrototypeOf',
  'propertyIsEnumerable',
  'toLocaleString',
  'toString',
  'valueOf'
];


/**
 * Extends an object with another object.
 * This operates 'in-place'; it does not create a new Object.
 *
 * Example:
 * var o = {};
 * goog.object.extend(o, {a: 0, b: 1});
 * o; // {a: 0, b: 1}
 * goog.object.extend(o, {c: 2});
 * o; // {a: 0, b: 1, c: 2}
 *
 * @param {Object} target  The object to modify.
 * @param {...Object} var_args The objects from which values will be copied.
 */
goog.object.extend = function(target, var_args) {
  var key, source;
  for (var i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (key in source) {
      target[key] = source[key];
    }

    // For IE the for-in-loop does not contain any properties that are not
    // enumerable on the prototype object (for example isPrototypeOf from
    // Object.prototype) and it will also not include 'replace' on objects that
    // extend String and change 'replace' (not that it is common for anyone to
    // extend anything except Object).

    for (var j = 0; j < goog.object.PROTOTYPE_FIELDS_.length; j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
};


/**
 * Creates a new object built from the key-value pairs provided as arguments.
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise even arguments are used as
 *     the property names and odd arguments are used as the property values.
 * @return {!Object} The new object.
 * @throws {Error} If there are uneven number of arguments or there is only one
 *     non array argument.
 */
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0]);
  }

  if (argLength % 2) {
    throw Error('Uneven number of arguments');
  }

  var rv = {};
  for (var i = 0; i < argLength; i += 2) {
    rv[arguments[i]] = arguments[i + 1];
  }
  return rv;
};


/**
 * Creates a new object where the property names come from the arguments but
 * the value is always set to true
 * @param {...*} var_args If only one argument is provided and it is an array
 *     then this is used as the arguments,  otherwise the arguments are used
 *     as the property names.
 * @return {!Object} The new object.
 */
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if (argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0]);
  }

  var rv = {};
  for (var i = 0; i < argLength; i++) {
    rv[arguments[i]] = true;
  }
  return rv;
};


// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility methods for Protocol Buffer 2 implementation.
 */

goog.provide('goog.proto2.Util');

goog.require('goog.asserts');


/**
 * @define {boolean} Defines a PBCHECK constant that can be turned off by
 * clients of PB2. This for is clients that do not want assertion/checking
 * running even in non-COMPILED builds.
 */
goog.proto2.Util.PBCHECK = !COMPILED;


/**
 * Asserts that the given condition is true, if and only if the PBCHECK
 * flag is on.
 *
 * @param {*} condition The condition to check.
 * @param {string=} opt_message Error message in case of failure.
 * @throws {Error} Assertion failed, the condition evaluates to false.
 */
goog.proto2.Util.assert = function(condition, opt_message) {
  if (goog.proto2.Util.PBCHECK) {
    goog.asserts.assert(condition, opt_message);
  }
};


/**
 * Returns true if debug assertions (checks) are on.
 *
 * @return {boolean} The value of the PBCHECK constant.
 */
goog.proto2.Util.conductChecks = function() {
  return goog.proto2.Util.PBCHECK;
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer (Message) Descriptor class.
 */

goog.provide('goog.proto2.Descriptor');
goog.provide('goog.proto2.Metadata');

goog.require('goog.array');
goog.require('goog.object');
goog.require('goog.proto2.Util');


/**
 * @type {{name: (string|undefined),
 *         fullName: (string|undefined),
 *         containingType: (goog.proto2.Message|undefined)}}
 */
goog.proto2.Metadata = goog.typedef;



/**
 * A class which describes a Protocol Buffer 2 Message.
 *
 * @param {Function} messageType Constructor for the message class that
 *      this descriptor describes.
 * @param {!goog.proto2.Metadata} metadata The metadata about the message that
 *      will be used to construct this descriptor.
 * @param {Array.<!goog.proto2.FieldDescriptor>} fields The fields of the
 *      message described by this descriptor.
 *
 * @constructor
 */
goog.proto2.Descriptor = function(messageType, metadata, fields) {

  /**
   * @type {Function}
   * @private
   */
  this.messageType_ = messageType;

  /**
   * @type {?string}
   * @private
   */
  this.name_ = metadata.name || null;

  /**
   * @type {?string}
   * @private
   */
  this.fullName_ = metadata.fullName || null;

  /**
   * @type {goog.proto2.Message|undefined}
   * @private
   */
  this.containingType_ = metadata.containingType;

  /**
   * The fields of the message described by this descriptor.
   * @type {!Object.<number, !goog.proto2.FieldDescriptor>}
   * @private
   */
  this.fields_ = {};

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    this.fields_[field.getTag()] = field;
  }
};


/**
 * Returns the name of the message, if any.
 *
 * @return {?string} The name.
 */
goog.proto2.Descriptor.prototype.getName = function() {
  return this.name_;
};


/**
 * Returns the full name of the message, if any.
 *
 * @return {?string} The name.
 */
goog.proto2.Descriptor.prototype.getFullName = function() {
  return this.fullName_;
};


/**
 * Returns the descriptor of the containing message type or null if none.
 *
 * @return {goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.Descriptor.prototype.getContainingType = function() {
  if (!this.containingType_) {
    return null;
  }

  return this.containingType_.descriptor_;
};


/**
 * Returns the fields in the message described by this descriptor ordered by
 * tag.
 *
 * @return {!Array.<!goog.proto2.FieldDescriptor>} The array of field
 *     descriptors.
 */
goog.proto2.Descriptor.prototype.getFields = function() {
  /**
   * @param {!goog.proto2.FieldDescriptor} fieldA First field.
   * @param {!goog.proto2.FieldDescriptor} fieldB Second field.
   * @return {number} Negative if fieldA's tag number is smaller, positive
   *     if greater, zero if the same.
   */
  function tagComparator(fieldA, fieldB) {
    return fieldA.getTag() - fieldB.getTag();
  };

  var fields = goog.object.getValues(this.fields_);
  goog.array.sort(fields, tagComparator);

  return fields;
};


/**
 * Returns the fields in the message as a key/value map, where the key is
 * the tag number of the field.
 *
 * @return {!Object.<number, !goog.proto2.FieldDescriptor>} The field map.
 */
goog.proto2.Descriptor.prototype.getFieldsMap = function() {
  return goog.object.clone(this.fields_);
};


/**
 * Returns the field matching the given name, if any. Note that
 * this method searches over the *original* name of the field,
 * not the camelCase version.
 *
 * @param {string} name The field name for which to search.
 *
 * @return {goog.proto2.FieldDescriptor} The field found, if any.
 */
goog.proto2.Descriptor.prototype.findFieldByName = function(name) {
  var valueFound = goog.object.findValue(this.fields_,
      function(field, key, obj) {
        return field.getName() == name;
      });

  return /** @type {goog.proto2.FieldDescriptor} */ (valueFound) || null;
};


/**
 * Returns the field matching the given tag number, if any.
 *
 * @param {number|string} tag The field tag number for which to search.
 *
 * @return {goog.proto2.FieldDescriptor} The field found, if any.
 */
goog.proto2.Descriptor.prototype.findFieldByTag = function(tag) {
  goog.proto2.Util.assert(goog.string.isNumeric(tag));
  return this.fields_[parseInt(tag, 10)] || null;
};


/**
 * Creates an instance of the message type that this descriptor
 * describes.
 *
 * @return {goog.proto2.Message} The instance of the message.
 */
goog.proto2.Descriptor.prototype.createMessageInstance = function() {
  return new this.messageType_;
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer Field Descriptor class.
 */

goog.provide('goog.proto2.FieldDescriptor');

goog.require('goog.proto2.Util');
goog.require('goog.string');



/**
 * A class which describes a field in a Protocol Buffer 2 Message.
 *
 * @param {Function} messageType Constructor for the message
 *     class to which the field described by this class belongs.
 * @param {number|string} tag The field's tag index.
 * @param {Object} metadata The metadata about this field that will be used
 *     to construct this descriptor.
 *
 * @constructor
 */
goog.proto2.FieldDescriptor = function(messageType, tag, metadata) {
  /**
   * The message type that contains the field that this
   * descriptor describes.
   * @type {Function}
   * @private
   */
  this.parent_ = messageType;

  // Ensure that the tag is numeric.
  goog.proto2.Util.assert(goog.string.isNumeric(tag));

  /**
   * The field's tag number.
   * @type {number}
   * @private
   */
  this.tag_ = /** @type {number} */ (tag);

  /**
   * The field's name.
   * @type {string}
   * @private
   */
  this.name_ = metadata.name;

  /** @type {*} */
  metadata.repeated;

  /** @type {*} */
  metadata.required;

  /**
   * If true, this field is a repeating field.
   * @type {boolean}
   * @private
   */
  this.isRepeated_ = !!metadata.repeated;

  /**
   * If true, this field is required.
   * @type {boolean}
   * @private
   */
  this.isRequired_ = !!metadata.required;

  /**
   * The field type of this field.
   * @type {goog.proto2.FieldDescriptor.FieldType}
   * @private
   */
  this.fieldType_ = metadata.fieldType;

  /**
   * If this field is a primitive: The native (ECMAScript) type of this field.
   * If an enumeration: The enumeration object.
   * If a message or group field: The Message function.
   * @type {Function}
   * @private
   */
  this.nativeType_ = metadata.type;

  /**
   * Is it permissible on deserialization to convert between numbers and
   * well-formed strings?  Is true for 64-bit integral field types, false for
   * all other field types.
   * @type {boolean}
   * @private
   */
  this.deserializationConversionPermitted_ = false;

  switch (this.fieldType_) {
    case goog.proto2.FieldDescriptor.FieldType.INT64:
    case goog.proto2.FieldDescriptor.FieldType.UINT64:
    case goog.proto2.FieldDescriptor.FieldType.FIXED64:
    case goog.proto2.FieldDescriptor.FieldType.SFIXED64:
    case goog.proto2.FieldDescriptor.FieldType.SINT64:
      this.deserializationConversionPermitted_ = true;
      break;
  }

  /**
   * The default value of this field, if different from the default, default
   * value.
   * @type {*}
   * @private
   */
  this.defaultValue_ = metadata.defaultValue;
};


/**
 * An enumeration defining the possible field types.
 * Should be a mirror of that defined in descriptor.h.
 *
 * @enum {number}
 */
goog.proto2.FieldDescriptor.FieldType = {
  DOUBLE: 1,
  FLOAT: 2,
  INT64: 3,
  UINT64: 4,
  INT32: 5,
  FIXED64: 6,
  FIXED32: 7,
  BOOL: 8,
  STRING: 9,
  GROUP: 10,
  MESSAGE: 11,
  BYTES: 12,
  UINT32: 13,
  ENUM: 14,
  SFIXED32: 15,
  SFIXED64: 16,
  SINT32: 17,
  SINT64: 18
};


/**
 * Returns the tag of the field that this descriptor represents.
 *
 * @return {number} The tag number.
 */
goog.proto2.FieldDescriptor.prototype.getTag = function() {
  return this.tag_;
};


/**
 * Returns the descriptor describing the message that defined this field.
 * @return {goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.FieldDescriptor.prototype.getContainingType = function() {
  return this.parent_.descriptor_;
};


/**
 * Returns the name of the field that this descriptor represents.
 * @return {string} The name.
 */
goog.proto2.FieldDescriptor.prototype.getName = function() {
  return this.name_;
};


/**
 * Returns the default value of this field.
 * @return {*} The default value.
 */
goog.proto2.FieldDescriptor.prototype.getDefaultValue = function() {
  if (this.defaultValue_ === undefined) {
    // Set the default value based on a new instance of the native type.
    // This will be (0, false, "") for (number, boolean, string) and will
    // be a new instance of a group/message if the field is a message type.
    var nativeType = this.nativeType_;
    if (nativeType === Boolean) {
      this.defaultValue_ = false;
    } else if (nativeType === Number) {
      this.defaultValue_ = 0;
    } else if (nativeType === String) {
      this.defaultValue_ = '';
    } else {
      this.defaultValue_ = new nativeType;
    }
  }

  return this.defaultValue_;
};


/**
 * Returns the field type of the field described by this descriptor.
 * @return {goog.proto2.FieldDescriptor.FieldType} The field type.
 */
goog.proto2.FieldDescriptor.prototype.getFieldType = function() {
  return this.fieldType_;
};


/**
 * Returns the native (i.e. ECMAScript) type of the field described by this
 * descriptor.
 *
 * @return {Object} The native type.
 */
goog.proto2.FieldDescriptor.prototype.getNativeType = function() {
  return this.nativeType_;
};


/**
 * Returns true if simple conversions between numbers and strings are permitted
 * during deserialization for this field.
 *
 * @return {boolean} Whether conversion is permitted.
 */
goog.proto2.FieldDescriptor.prototype.deserializationConversionPermitted =
    function() {
  return this.deserializationConversionPermitted_;
};


/**
 * Returns the descriptor of the message type of this field. Only valid
 * for fields of type GROUP and MESSAGE.
 *
 * @return {goog.proto2.Descriptor} The message descriptor.
 */
goog.proto2.FieldDescriptor.prototype.getFieldMessageType = function() {
  goog.proto2.Util.assert(this.isCompositeType(), 'Expected message or group');

  return this.nativeType_.descriptor_;
};


/**
 * @return {boolean} True if the field stores composite data or repeated
 *     composite data (message or group).
 */
goog.proto2.FieldDescriptor.prototype.isCompositeType = function() {
  return this.fieldType_ == goog.proto2.FieldDescriptor.FieldType.MESSAGE ||
      this.fieldType_ == goog.proto2.FieldDescriptor.FieldType.GROUP;
};


/**
 * Returns whether the field described by this descriptor is repeating.
 * @return {boolean} Whether the field is repeated.
 */
goog.proto2.FieldDescriptor.prototype.isRepeated = function() {
  return this.isRepeated_;
};


/**
 * Returns whether the field described by this descriptor is required.
 * @return {boolean} Whether the field is required.
 */
goog.proto2.FieldDescriptor.prototype.isRequired = function() {
  return this.isRequired_;
};


/**
 * Returns whether the field described by this descriptor is optional.
 * @return {boolean} Whether the field is optional.
 */
goog.proto2.FieldDescriptor.prototype.isOptional = function() {
  return !this.isRepeated_ && !this.isRequired_;
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer Message base class.
 */

goog.provide('goog.proto2.Message');

goog.require('goog.proto2.Descriptor');
goog.require('goog.proto2.FieldDescriptor');
goog.require('goog.proto2.Util');
goog.require('goog.string');



/**
 * Abstract base class for all Protocol Buffer 2 messages. It will be
 * subclassed in the code generated by the Protocol Compiler. Any other
 * subclasses are prohibited.
 * @constructor
 */
goog.proto2.Message = function() {
  /**
   * Stores the field values in this message.
   * @type {*}
   * @private
   */
  this.values_ = {};

  // The descriptor_ is static to the message function that is being created.
  // Therefore, we retrieve it via the constructor.

  /**
   * Stores the information (i.e. metadata) about this message.
   * @type {!goog.proto2.Descriptor}
   * @private
   */
  this.descriptor_ = this.constructor.descriptor_;

  /**
   * Stores the field information (i.e. metadata) about this message.
   * @type {Object.<number, !goog.proto2.FieldDescriptor>}
   * @private
   */
  this.fields_ = this.descriptor_.getFieldsMap();

  /**
   * The lazy deserializer for this message instance, if any.
   * @type {goog.proto2.LazyDeserializer}
   * @private
   */
  this.lazyDeserializer_ = null;

  /**
   * A map of those fields deserialized.
   * @type {Object}
   * @private
   */
  this.deserializedFields_ = null;
};


/**
 * An enumeration defining the possible field types.
 * Should be a mirror of that defined in descriptor.h.
 *
 * TODO(user): Remove this alias.  The code generator generates code that
 * references this enum, so it needs to exist until the code generator is
 * changed.  The enum was moved to from Message to FieldDescriptor to avoid a
 * dependency cycle.
 *
 * Use goog.proto2.FieldDescriptor.FieldType instead.
 *
 * @enum {number}
 */
goog.proto2.Message.FieldType = {
  DOUBLE: 1,
  FLOAT: 2,
  INT64: 3,
  UINT64: 4,
  INT32: 5,
  FIXED64: 6,
  FIXED32: 7,
  BOOL: 8,
  STRING: 9,
  GROUP: 10,
  MESSAGE: 11,
  BYTES: 12,
  UINT32: 13,
  ENUM: 14,
  SFIXED32: 15,
  SFIXED64: 16,
  SINT32: 17,
  SINT64: 18
};


/**
 * Initializes the message with a lazy deserializer and its associated data.
 * This method should be called by internal methods ONLY.
 *
 * @param {goog.proto2.LazyDeserializer} deserializer The lazy deserializer to
 *   use to decode the data on the fly.
 *
 * @param {*} data The data to decode/deserialize.
 */
goog.proto2.Message.prototype.initializeForLazyDeserializer = function(
    deserializer, data) {

  this.lazyDeserializer_ = deserializer;
  this.values_ = data;
  this.deserializedFields_ = {};
};


/**
 * Sets the value of an unknown field, by tag.
 *
 * @param {number} tag The tag of an unknown field (must be >= 1).
 * @param {*} value The value for that unknown field.
 */
goog.proto2.Message.prototype.setUnknown = function(tag, value) {
  goog.proto2.Util.assert(!this.fields_[tag],
                          'Field is not unknown in this message');

  goog.proto2.Util.assert(tag >= 1, 'Tag is not valid');
  goog.proto2.Util.assert(value !== null, 'Value cannot be null');

  this.values_[tag] = value;
};


/**
 * Iterates over all the unknown fields in the message.
 *
 * @param {function(number, *)} callback A callback method
 *     which gets invoked for each unknown field.
 */
goog.proto2.Message.prototype.forEachUnknown = function(callback) {
  for (var key in this.values_) {
    if (!this.fields_[key]) {
      callback(/** @type {number} */ (key), this.values_[key]);
    }
  }
};


/**
 * Returns the descriptor which describes the current message.
 *
 * @return {goog.proto2.Descriptor} The descriptor.
 */
goog.proto2.Message.prototype.getDescriptor = function() {
  return this.descriptor_;
};


/**
 * Returns whether there is a value stored at the field specified by the
 * given field descriptor.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to check
 *     if there is a value.
 *
 * @return {boolean} True if a value was found.
 */
goog.proto2.Message.prototype.has = function(field) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  return this.has$Value(field.getTag());
};


/**
 * Returns the array of values found for the given repeated field.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to
 *     return the values.
 *
 * @return {!Array} The values found.
 */
goog.proto2.Message.prototype.arrayOf = function(field) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  return this.array$Values(field.getTag());
};


/**
 * Returns the number of values stored in the given field.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to count
 *     the number of values.
 *
 * @return {number} The count of the values in the given field.
 */
goog.proto2.Message.prototype.countOf = function(field) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  return this.count$Values(field.getTag());
};


/**
 * Returns the value stored at the field specified by the
 * given field descriptor.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to get the
 *     value.
 * @param {number=} opt_index If the field is repeated, the index to use when
 *     looking up the value.
 *
 * @return {*} The value found or undefined if none.
 */
goog.proto2.Message.prototype.get = function(field, opt_index) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  return this.get$Value(field.getTag(), opt_index);
};


/**
 * Returns the value stored at the field specified by the
 * given field descriptor or the default value if none exists.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to get the
 *     value.
 * @param {number=} opt_index If the field is repeated, the index to use when
 *     looking up the value.
 *
 * @return {*} The value found or the default if none.
 */
goog.proto2.Message.prototype.getOrDefault = function(field, opt_index) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  return this.get$ValueOrDefault(field.getTag(), opt_index);
};


/**
 * Stores the given value to the field specified by the
 * given field descriptor. Note that the field must not be repeated.
 *
 * @param {goog.proto2.FieldDescriptor} field The field for which to set
 *     the value.
 * @param {*} value The new value for the field.
 */
goog.proto2.Message.prototype.set = function(field, value) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  this.set$Value(field.getTag(), value);
};


/**
 * Adds the given value to the field specified by the
 * given field descriptor. Note that the field must be repeated.
 *
 * @param {goog.proto2.FieldDescriptor} field The field in which to add the
 *     the value.
 * @param {*} value The new value to add to the field.
 */
goog.proto2.Message.prototype.add = function(field, value) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  this.add$Value(field.getTag(), value);
};


/**
 * Clears the field specified.
 *
 * @param {goog.proto2.FieldDescriptor} field The field to clear.
 */
goog.proto2.Message.prototype.clear = function(field) {
  goog.proto2.Util.assert(
      field.getContainingType() == this.descriptor_,
      'The current message does not contain the given field');

  this.clear$Field(field.getTag());
};


/**
 * Compares this message with another one ignoring the unknown fields.
 * @param {*} other The other message.
 * @return {boolean} Whether they are equal. Returns false if the {@code other}
 *     argument is a different type of message or not a message.
 */
goog.proto2.Message.prototype.equals = function(other) {
  if (!other || this.constructor != other.constructor) {
    return false;
  }

  var fields = this.getDescriptor().getFields();
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    if (this.has(field) != other.has(field)) {
      return false;
    }

    if (this.has(field)) {
      var isComposite = field.isCompositeType();

      function fieldsEqual(value1, value2) {
        return isComposite ? value1.equals(value2) : value1 == value2;
      }

      var tag = field.getTag();
      var thisValue = this.values_[tag];
      var otherValue = other.values_[tag];

      if (field.isRepeated()) {
        // In this case thisValue and otherValue are arrays.
        if (thisValue.length != otherValue.length) {
          return false;
        }
        for (var j = 0; j < thisValue.length; j++) {
          if (!fieldsEqual(thisValue[j], otherValue[j])) {
            return false;
          }
        }
      } else if (!fieldsEqual(thisValue, otherValue)) {
        return false;
      }
    }
  }

  return true;
};


/**
 * Recursively copies the known fields from the given message to this message.
 * Removes the fields which are not present in the source message.
 * @param {!goog.proto2.Message} message The source message.
 */
goog.proto2.Message.prototype.copyFrom = function(message) {
  goog.proto2.Util.assert(this.constructor == message.constructor,
      'The source message must have the same type.');
  var fields = this.getDescriptor().getFields();

  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    delete this.values_[field.getTag()];

    if (message.has(field)) {
      var isComposite = field.isCompositeType();
      if (field.isRepeated()) {
        var values = message.arrayOf(field);
        for (var j = 0; j < values.length; j++) {
          this.add(field, isComposite ? values[j].clone() : values[j]);
        }
      } else {
        var value = message.get(field);
        this.set(field, isComposite ? value.clone() : value);
      }
    }
  }
};


/**
 * @return {!goog.proto2.Message} Recursive clone of the message only including
 *     the known fields.
 */
goog.proto2.Message.prototype.clone = function() {
  var clone = new this.constructor;
  clone.copyFrom(this);
  return clone;
};


/**
 * Fills in the protocol buffer with default values. Any fields that are
 * already set will not be overridden.
 * @param {boolean} simpleFieldsToo If true, all fields will be initialized;
 *     if false, only the nested messages and groups.
 */
goog.proto2.Message.prototype.initDefaults = function(simpleFieldsToo) {
  var fields = this.getDescriptor().getFields();
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];
    var tag = field.getTag();
    var isComposite = field.isCompositeType();

    // Initialize missing fields.
    if (!this.has(field) && !field.isRepeated()) {
      if (isComposite) {
        this.values_[tag] = new /** @type {Function} */ (field.getNativeType());
      } else if (simpleFieldsToo) {
        this.values_[tag] = field.getDefaultValue();
      }
    }

    // Fill in the existing composite fields recursively.
    if (isComposite) {
      if (field.isRepeated()) {
        var values = this.array$Values(tag);
        for (var j = 0; j < values.length; j++) {
          values[j].initDefaults(simpleFieldsToo);
        }
      } else {
        this.get$Value(tag).initDefaults(simpleFieldsToo);
      }
    }
  }
};


/**
 * Returns the field in this message by the given tag number. If no
 * such field exists, throws an exception.
 *
 * @param {number} tag The field's tag index.
 * @return {!goog.proto2.FieldDescriptor} The descriptor for the field.
 * @private
 */
goog.proto2.Message.prototype.getFieldByTag_ = function(tag) {
  goog.proto2.Util.assert(this.fields_[tag],
                          'No field found for the given tag');

  return this.fields_[tag];
};


/**
 * Returns the whether or not the field indicated by the given tag
 * has a value.
 *
 * GENERATED CODE USE ONLY. Basis of the has{Field} methods.
 *
 * @param {number} tag The tag.
 *
 * @return {boolean} Whether the message has a value for the field.
 */
goog.proto2.Message.prototype.has$Value = function(tag) {
  goog.proto2.Util.assert(this.fields_[tag],
                          'No field found for the given tag');

  return tag in this.values_ && goog.isDef(this.values_[tag]);
};


/**
 * If a lazy deserializer is instantiated, lazily deserializes the
 * field if required.
 *
 * @param {goog.proto2.FieldDescriptor} field The field.
 * @private
 */
goog.proto2.Message.prototype.lazyDeserialize_ = function(field) {
  // If we have a lazy deserializer, then ensure that the field is
  // properly deserialized.
  if (this.lazyDeserializer_) {
    var tag = field.getTag();

    if (!(tag in this.deserializedFields_)) {
      this.values_[tag] = this.lazyDeserializer_.deserializeField(
          this, field, this.values_[tag]);

      this.deserializedFields_[tag] = true;
    }
  }
};


/**
 * Gets the value at the field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the get{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {number=} opt_index If the field is a repeated field, the index
 *     at which to get the value.
 *
 * @return {*} The value found or undefined for none.
 */
goog.proto2.Message.prototype.get$Value = function(tag, opt_index) {
  var field = this.getFieldByTag_(tag);

  // Ensure that the field is deserialized.
  this.lazyDeserialize_(field);

  if (field.isRepeated()) {
    var index = opt_index || 0;
    goog.proto2.Util.assert(index < this.count$Values(tag),
                            'Field value count is less than index given');

    return this.values_[tag][index];
  } else {
    goog.proto2.Util.assert(!goog.isArray(this.values_[tag]));
    return this.values_[tag];
  }
};


/**
 * Gets the value at the field indicated by the given tag or the default value
 * if none.
 *
 * GENERATED CODE USE ONLY. Basis of the get{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {number=} opt_index If the field is a repeated field, the index
 *     at which to get the value.
 *
 * @return {*} The value found or the default value if none set.
 */
goog.proto2.Message.prototype.get$ValueOrDefault = function(tag, opt_index) {

  if (!this.has$Value(tag)) {
    // Return the default value.
    var field = this.getFieldByTag_(tag);
    return field.getDefaultValue();
  }

  return this.get$Value(tag, opt_index);
};


/**
 * Gets the values at the field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the {field}Array methods.
 *
 * @param {number} tag The field's tag index.
 *
 * @return {!Array} The values found. If none, returns an empty array.
 */
goog.proto2.Message.prototype.array$Values = function(tag) {
  goog.proto2.Util.assert(this.getFieldByTag_(tag).isRepeated(),
                          'Cannot call fieldArray on a non-repeated field');

  var field = this.getFieldByTag_(tag);

  // Ensure that the field is deserialized.
  this.lazyDeserialize_(field);

  return this.values_[tag] || [];
};


/**
 * Returns the number of values stored in the field by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the {field}Count methods.
 *
 * @param {number} tag The tag.
 *
 * @return {number} The number of values.
 */
goog.proto2.Message.prototype.count$Values = function(tag) {
  var field = this.getFieldByTag_(tag);

  if (field.isRepeated()) {
    if (this.has$Value(tag)) {
      goog.proto2.Util.assert(goog.isArray(this.values_[tag]));
    }

    return this.has$Value(tag) ? this.values_[tag].length : 0;
  } else {
    return this.has$Value(tag) ? 1 : 0;
  }
};


/**
 * Sets the value of the *non-repeating* field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the set{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {*} value The field's value.
 */
goog.proto2.Message.prototype.set$Value = function(tag, value) {
  if (goog.proto2.Util.conductChecks()) {
    var field = this.getFieldByTag_(tag);

    goog.proto2.Util.assert(!field.isRepeated(),
                            'Cannot call set on a repeated field');

    this.checkFieldType_(field, value);
  }

  this.values_[tag] = value;
};


/**
 * Adds the value to the *repeating* field indicated by the given tag.
 *
 * GENERATED CODE USE ONLY. Basis of the add{Field} methods.
 *
 * @param {number} tag The field's tag index.
 * @param {*} value The value to add.
 */
goog.proto2.Message.prototype.add$Value = function(tag, value) {
  if (goog.proto2.Util.conductChecks()) {
    var field = this.getFieldByTag_(tag);

    goog.proto2.Util.assert(field.isRepeated(),
                            'Cannot call add on a non-repeated field');

    this.checkFieldType_(field, value);
  }

  if (!this.values_[tag]) {
    this.values_[tag] = [];
  }

  this.values_[tag].push(value);
};


/**
 * Ensures that the value being assigned to the given field
 * is valid.
 *
 * @param {!goog.proto2.FieldDescriptor} field The field being assigned.
 * @param {*} value The value being assigned.
 * @private
 */
goog.proto2.Message.prototype.checkFieldType_ = function(field, value) {
  goog.proto2.Util.assert(value !== null);

  var nativeType = field.getNativeType();
  if (nativeType === String) {
    goog.proto2.Util.assert(typeof value === 'string',
                            'Expected value of type string');
  } else if (nativeType === Boolean) {
    goog.proto2.Util.assert(typeof value === 'boolean',
                            'Expected value of type boolean');
  } else if (nativeType === Number) {
    goog.proto2.Util.assert(typeof value === 'number',
                            'Expected value of type number');
  } else if (field.getFieldType() ==
             goog.proto2.FieldDescriptor.FieldType.ENUM) {
    goog.proto2.Util.assert(typeof value === 'number',
                            'Expected an enum value, which is a number');
  } else {
    goog.proto2.Util.assert(value instanceof nativeType,
                            'Expected a matching message type');
  }
};


/**
 * Clears the field specified by tag.
 *
 * GENERATED CODE USE ONLY. Basis of the clear{Field} methods.
 *
 * @param {number} tag The tag of the field to clear.
 */
goog.proto2.Message.prototype.clear$Field = function(tag) {
  goog.proto2.Util.assert(this.getFieldByTag_(tag), 'Unknown field');
  delete this.values_[tag];
};


/**
 * Sets the metadata that represents the definition of this message.
 *
 * GENERATED CODE USE ONLY. Called when constructing message classes.
 *
 * @param {Function} messageType Constructor for the message type to
 *     which this metadata applies.
 * @param {Object} metadataObj The object containing the metadata.
 */
goog.proto2.Message.set$Metadata = function(messageType, metadataObj) {
  var fields = [];
  var descriptorInfo;

  for (var key in metadataObj) {
    if (!metadataObj.hasOwnProperty(key)) {
      continue;
    }

    goog.proto2.Util.assert(goog.string.isNumeric(key), 'Keys must be numeric');

    if (key == 0) {
      descriptorInfo = metadataObj[0];
      continue;
    }

    // Create the field descriptor.
    fields.push(
        new goog.proto2.FieldDescriptor(messageType, key, metadataObj[key]));
  }

  goog.proto2.Util.assert(descriptorInfo);

  // Create the descriptor.
  messageType.descriptor_ =
      new goog.proto2.Descriptor(messageType, descriptorInfo, fields);

  messageType.getDescriptor = function() {
    return messageType.descriptor_;
  };
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for all Protocol Buffer 2 serializers.
 */

goog.provide('goog.proto2.Serializer');

goog.require('goog.proto2.Descriptor');
goog.require('goog.proto2.FieldDescriptor');
goog.require('goog.proto2.Message');
goog.require('goog.proto2.Util');



/**
 * Abstract base class for PB2 serializers. A serializer is a class which
 * implements the serialization and deserialization of a Protocol Buffer Message
 * to/from a specific format.
 *
 * @constructor
 */
goog.proto2.Serializer = function() {};


/**
 * Serializes a message to the expected format.
 *
 * @param {goog.proto2.Message} message The message to be serialized.
 *
 * @return {Object} The serialized form of the message.
 */
goog.proto2.Serializer.prototype.serialize = goog.abstractMethod;


/**
 * Returns the serialized form of the given value for the given field
 * if the field is a Message or Group and returns the value unchanged
 * otherwise.
 *
 * @param {goog.proto2.FieldDescriptor} field The field from which this
 *     value came.
 *
 * @param {*} value The value of the field.
 *
 * @return {*} The value.
 * @protected
 */
goog.proto2.Serializer.prototype.getSerializedValue = function(field, value) {
  if (field.isCompositeType()) {
    return this.serialize(/** @type {goog.proto2.Message} */ (value));
  } else {
    return value;
  }
};


/**
 * Deserializes a message from the expected format.
 *
 * @param {goog.proto2.Descriptor} descriptor The descriptor of the message
 *     to be created.
 * @param {*} data The data of the message.
 *
 * @return {goog.proto2.Message} The message created.
 */
goog.proto2.Serializer.prototype.deserialize = function(descriptor, data) {
  var message = descriptor.createMessageInstance();
  this.deserializeTo(message, data);
  goog.proto2.Util.assert(message instanceof goog.proto2.Message);
  return message;
};


/**
 * Deserializes a message from the expected format and places the
 * data in the message.
 *
 * @param {goog.proto2.Message} message The message in which to
 *     place the information.
 * @param {*} data The data of the message.
 */
goog.proto2.Serializer.prototype.deserializeTo = goog.abstractMethod;


/**
 * Returns the deserialized form of the given value for the given field if the
 * field is a Message or Group and returns the value, converted or unchanged,
 * for primitive field types otherwise.
 *
 * @param {goog.proto2.FieldDescriptor} field The field from which this
 *     value came.
 *
 * @param {*} value The value of the field.
 *
 * @return {*} The value.
 * @protected
 */
goog.proto2.Serializer.prototype.getDeserializedValue = function(field, value) {
  // Composite types are deserialized recursively.
  if (field.isCompositeType()) {
    return this.deserialize(field.getFieldMessageType(), value);
  }

  // Return the raw value if the field does not allow the JSON input to be
  // converted.
  if (!field.deserializationConversionPermitted()) {
    return value;
  }

  // Convert to native type of field.  Return the converted value or fall
  // through to return the raw value.  The JSON encoding of int64 value 123
  // might be either the number 123 or the string "123".  The field native type
  // could be either Number or String (depending on field options in the .proto
  // file).  All four combinations should work correctly.
  var nativeType = field.getNativeType();

  if (nativeType === String) {
    // JSON numbers can be converted to strings.
    if (typeof value === 'number') {
      return String(value);
    }
  } else if (nativeType === Number) {
    // JSON strings are sometimes used for large integer numeric values.
    if (typeof value === 'string') {
      // Validate the string.  If the string is not an integral number, we would
      // rather have an assertion or error in the caller than a mysterious NaN
      // value.
      if (/^-?[0-9]+$/.test(value)) {
        return Number(value);
      }
    }
  }

  return value;
};


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer 2 Serializer which serializes messages
 *  into anonymous, simplified JSON objects.
 *
 */

goog.provide('goog.proto2.ObjectSerializer');

goog.require('goog.proto2.Serializer');
goog.require('goog.proto2.Util');
goog.require('goog.string');



/**
 * ObjectSerializer, a serializer which turns Messages into simplified
 * ECMAScript objects.
 *
 * @param {goog.proto2.ObjectSerializer.KeyOption=} opt_keyOption If specified,
 *     which key option to use when serializing/deserializing.
 *
 * @constructor
 * @extends {goog.proto2.Serializer}
 */
goog.proto2.ObjectSerializer = function(opt_keyOption) {
  this.keyOption_ = opt_keyOption;
};
goog.inherits(goog.proto2.ObjectSerializer, goog.proto2.Serializer);


/**
 * An enumeration of the options for how to emit the keys in
 * the generated simplified object.
 *
 * @enum {number}
 */
goog.proto2.ObjectSerializer.KeyOption = {
  /**
   * Use the tag of the field as the key (default)
   */
  TAG: 0,

  /**
   * Use the name of the field as the key. Unknown fields
   * will still use their tags as keys.
   */
  NAME: 1
};


/**
 * Serializes a message to an object.
 *
 * @param {goog.proto2.Message} message The message to be serialized.
 *
 * @return {Object} The serialized form of the message.
 */
goog.proto2.ObjectSerializer.prototype.serialize = function(message) {
  var descriptor = message.getDescriptor();
  var fields = descriptor.getFields();

  var objectValue = {};

  // Add the defined fields, recursively.
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    var key =
        this.keyOption_ == goog.proto2.ObjectSerializer.KeyOption.NAME ?
        field.getName() : field.getTag();


    if (message.has(field)) {
      if (field.isRepeated()) {
        var array = [];
        objectValue[key] = array;

        for (var j = 0; j < message.countOf(field); j++) {
          array.push(this.getSerializedValue(field, message.get(field, j)));
        }

      } else {
        objectValue[key] = this.getSerializedValue(field, message.get(field));
      }
    }
  }

  // Add the unknown fields, if any.
  message.forEachUnknown(function(tag, value) {
    objectValue[tag] = value;
  });

  return objectValue;
};


/**
 * Deserializes a message from an object and places the
 * data in the message.
 *
 * @param {goog.proto2.Message} message The message in which to
 *     place the information.
 * @param {Object} data The data of the message.
 */
goog.proto2.ObjectSerializer.prototype.deserializeTo = function(message, data) {
  var descriptor = message.getDescriptor();

  for (var key in data) {
    var field;
    var value = data[key];

    var isNumeric = goog.string.isNumeric(key);

    if (isNumeric) {
      field = descriptor.findFieldByTag(key);
    } else {
      // We must be in Key == NAME mode to lookup by name.
      goog.proto2.Util.assert(
          this.keyOption_ == goog.proto2.ObjectSerializer.KeyOption.NAME);

      field = descriptor.findFieldByName(key);
    }

    if (field) {
      if (field.isRepeated()) {
        goog.proto2.Util.assert(goog.isArray(value));

        for (var j = 0; j < value.length; j++) {
          message.add(field, this.getDeserializedValue(field, value[j]));
        }
      } else {
        goog.proto2.Util.assert(!goog.isArray(value));
        message.set(field, this.getDeserializedValue(field, value));
      }
    } else {
      if (isNumeric) {
        // We have an unknown field.
        message.setUnknown(/** @type {number} */ (key), value);
      } else {
        // Named fields must be present.
        goog.proto2.Util.assert(field);
      }
    }
  }
};


// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Base class for all PB2 lazy deserializer. A lazy deserializer
 *   is a serializer whose deserialization occurs on the fly as data is
 *   requested. In order to use a lazy deserializer, the serialized form
 *   of the data must be an object or array that can be indexed by the tag
 *   number.
 *
 */

goog.provide('goog.proto2.LazyDeserializer');

goog.require('goog.proto2.Serializer');
goog.require('goog.proto2.Util');



/**
 * Base class for all lazy deserializers.
 *
 * @constructor
 * @extends {goog.proto2.Serializer}
 */
goog.proto2.LazyDeserializer = function() {};
goog.inherits(goog.proto2.LazyDeserializer, goog.proto2.Serializer);


/** @inheritDoc */
goog.proto2.LazyDeserializer.prototype.deserialize =
  function(descriptor, data) {
  var message = descriptor.createMessageInstance();
  message.initializeForLazyDeserializer(this, data);
  goog.proto2.Util.assert(message instanceof goog.proto2.Message);
  return message;
};


/** @inheritDoc */
goog.proto2.LazyDeserializer.prototype.deserializeTo = function(message, data) {
  throw new Error('Unimplemented');
};


/**
 * Deserializes a message field from the expected format and places the
 * data in the given message
 *
 * @param {goog.proto2.Message} message The message in which to
 *     place the information.
 * @param {goog.proto2.FieldDescriptor} field The field for which to set the
 *     message value.
 * @param {*} data The serialized data for the field.
 *
 * @return {*} The deserialized data or null for no value found.
 */
goog.proto2.LazyDeserializer.prototype.deserializeField = goog.abstractMethod;


// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Protocol Buffer 2 Serializer which serializes messages
 *  into PB-Lite ("JsPbLite") format.
 *
 * PB-Lite format is an array where each index corresponds to the associated tag
 * number. For example, a message like so:
 *
 * message Foo {
 *   optional int bar = 1;
 *   optional int baz = 2;
 *   optional int bop = 4;
 * }
 *
 * would be represented as such:
 *
 * [, (bar data), (baz data), (nothing), (bop data)]
 *
 * Note that since the array index is used to represent the tag number, sparsely
 * populated messages with tag numbers that are not continuous (and/or are very
 * large) will have many (empty) spots and thus, are inefficient.
 *
 *
 */

goog.provide('goog.proto2.PbLiteSerializer');

goog.require('goog.proto2.LazyDeserializer');
goog.require('goog.proto2.Util');



/**
 * PB-Lite serializer.
 *
 * @constructor
 * @extends {goog.proto2.LazyDeserializer}
 */
goog.proto2.PbLiteSerializer = function() {};
goog.inherits(goog.proto2.PbLiteSerializer, goog.proto2.LazyDeserializer);


/**
 * Serializes a message to a PB-Lite object.
 *
 * @param {goog.proto2.Message} message The message to be serialized.
 *
 * @return {!Array} The serialized form of the message.
 */
goog.proto2.PbLiteSerializer.prototype.serialize = function(message) {
  var descriptor = message.getDescriptor();
  var fields = descriptor.getFields();

  var serialized = [];

  // Add the known fields.
  for (var i = 0; i < fields.length; i++) {
    var field = fields[i];

    if (!message.has(field)) {
      continue;
    }

    var tag = field.getTag();

    if (field.isRepeated()) {
      serialized[tag] = [];

      for (var j = 0; j < message.countOf(field); j++) {
        serialized[tag][j] =
            this.getSerializedValue(field, message.get(field, j));
      }
    } else {
      serialized[tag] = this.getSerializedValue(field, message.get(field));
    }
  }

  // Add any unknown fields.
  message.forEachUnknown(function(tag, value) {
    serialized[tag] = value;
  });

  return serialized;
};


/** @inheritDoc */
goog.proto2.PbLiteSerializer.prototype.deserializeField =
    function(message, field, value) {

  if (value == null) {
    // Since value double-equals null, it may be either null or undefined.
    // Ensure we return the same one, since they have different meanings.
    return value;
  }

  if (field.isRepeated()) {
    var data = [];

    goog.proto2.Util.assert(goog.isArray(value));

    for (var i = 0; i < value.length; i++) {
      data[i] = this.getDeserializedValue(field, value[i]);
    }

    return data;
  } else {
    return this.getDeserializedValue(field, value);
  }
};


/** @inheritDoc */
goog.proto2.PbLiteSerializer.prototype.getSerializedValue =
    function(field, value) {
  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.BOOL) {
    // Booleans are serialized in numeric form.
    return value ? 1 : 0;
  }

  return goog.proto2.Serializer.prototype.getSerializedValue.apply(this,
                                                                   arguments);
};


/** @inheritDoc */
goog.proto2.PbLiteSerializer.prototype.getDeserializedValue =
    function(field, value) {

  if (field.getFieldType() == goog.proto2.FieldDescriptor.FieldType.BOOL) {
    // Booleans are serialized in numeric form.
    return value === 1;
  }

  return goog.proto2.Serializer.prototype.getDeserializedValue.apply(this,
                                                                     arguments);
};


// Copyright 2007 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Detection of JScript version.
 *
 */


goog.provide('goog.userAgent.jscript');

goog.require('goog.string');


/**
 * @define {boolean} True if it is known at compile time that the runtime
 *     environment will not be using JScript.
 */
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;


/**
 * Initializer for goog.userAgent.jscript.  Detects if the user agent is using
 * Microsoft JScript and which version of it.
 *
 * This is a named function so that it can be stripped via the jscompiler
 * option for stripping types.
 * @private
 */
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = 'ScriptEngine' in goog.global;

  /**
   * @type {boolean}
   * @private
   */
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ =
      hasScriptEngine && goog.global['ScriptEngine']() == 'JScript';

  /**
   * @type {string}
   * @private
   */
  goog.userAgent.jscript.DETECTED_VERSION_ =
      goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ?
      (goog.global['ScriptEngineMajorVersion']() + '.' +
       goog.global['ScriptEngineMinorVersion']() + '.' +
       goog.global['ScriptEngineBuildVersion']()) :
      '0';
};

if (!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_();
}


/**
 * Whether we detect that the user agent is using Microsoft JScript.
 * @type {boolean}
 */
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;


/**
 * The installed version of JScript.
 * @type {string}
 */
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ?
    '0' : goog.userAgent.jscript.DETECTED_VERSION_;


/**
 * Whether the installed version of JScript is as new or newer than a given
 * version.
 * @param {string} version The version to check.
 * @return {boolean} Whether the installed version of JScript is as new or
 *     newer than the given version.
 */
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION,
                                     version) >= 0;
};


// Copyright 2006 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Utility for fast string concatenation.
 */

goog.provide('goog.string.StringBuffer');

goog.require('goog.userAgent.jscript');



/**
 * Utility class to facilitate much faster string concatenation in IE,
 * using Array.join() rather than the '+' operator.  For other browsers
 * we simply use the '+' operator.
 *
 * @param {Object|number|string|boolean=} opt_a1 Optional first initial item
 *     to append.
 * @param {...Object|number|string|boolean} var_args Other initial items to
 *     append, e.g., new goog.string.StringBuffer('foo', 'bar').
 * @constructor
 */
goog.string.StringBuffer = function(opt_a1, var_args) {
  /**
   * Internal buffer for the string to be concatenated.
   * @type {string|Array}
   * @private
   */
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : '';

  if (opt_a1 != null) {
    this.append.apply(this, arguments);
  }
};


/**
 * Sets the contents of the string buffer object, replacing what's currently
 * there.
 *
 * @param {string} s String to set.
 */
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s);
};


if (goog.userAgent.jscript.HAS_JSCRIPT) {
  /**
   * Length of internal buffer (faster than calling buffer_.length).
   * Only used if buffer_ is an array.
   * @type {number}
   * @private
   */
  goog.string.StringBuffer.prototype.bufferLength_ = 0;

  /**
   * Appends one or more items to the buffer.
   *
   * Calling this with null, undefined, or empty arguments is an error.
   *
   * @param {Object|number|string|boolean} a1 Required first string.
   * @param {Object|number|string|boolean=} opt_a2 Optional second string.
   * @param {...Object|number|string|boolean} var_args Other items to append,
   *     e.g., sb.append('foo', 'bar', 'baz').
   * @return {goog.string.StringBuffer} This same StringBuffer object.
   */
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    // IE version.

    if (opt_a2 == null) { // second argument is undefined (null == undefined)
      // Array assignment is 2x faster than Array push.  Also, use a1
      // directly to avoid arguments instantiation, another 2x improvement.
      this.buffer_[this.bufferLength_++] = a1;
    } else {
      this.buffer_.push.apply(/** @type {Array} */ (this.buffer_), arguments);
      this.bufferLength_ = this.buffer_.length;
    }
    return this;
  };
} else {

  /**
   * Appends one or more items to the buffer.
   *
   * Calling this with null, undefined, or empty arguments is an error.
   *
   * @param {Object|number|string|boolean} a1 Required first string.
   * @param {Object|number|string|boolean=} opt_a2 Optional second string.
   * @param {...Object|number|string|boolean} var_args Other items to append,
   *     e.g., sb.append('foo', 'bar', 'baz').
   * @return {goog.string.StringBuffer} This same StringBuffer object.
   * @suppress {duplicate}
   */
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    // W3 version.

    // Use a1 directly to avoid arguments instantiation for single-arg case.
    this.buffer_ += a1;
    if (opt_a2 != null) { // second argument is undefined (null == undefined)
      for (var i = 1; i < arguments.length; i++) {
        this.buffer_ += arguments[i];
      }
    }
    return this;
  };
}


/**
 * Clears the internal buffer.
 */
goog.string.StringBuffer.prototype.clear = function() {
  if (goog.userAgent.jscript.HAS_JSCRIPT) {
     this.buffer_.length = 0;  // Reuse the array to avoid creating new object.
     this.bufferLength_ = 0;
   } else {
     this.buffer_ = '';
   }
};


/**
 * Returns the length of the current contents of the buffer.  In IE, this is
 * O(n) where n = number of appends, so to avoid quadratic behavior, do not call
 * this after every append.
 *
 * @return {number} the length of the current contents of the buffer.
 */
goog.string.StringBuffer.prototype.getLength = function() {
   return this.toString().length;
};


/**
 * Returns the concatenated string.
 *
 * @return {string} The concatenated string.
 */
goog.string.StringBuffer.prototype.toString = function() {
  if (goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join('');
    // Given a string with the entire contents, simplify the StringBuffer by
    // setting its contents to only be this string, rather than many fragments.
    this.clear();
    if (str) {
      this.append(str);
    }
    return str;
  } else {
    return /** @type {string} */ (this.buffer_);
  }
};


/*
 * @license
 * Protocol Buffer 2 Copyright 2008 Google Inc
 * All other code copyright its respective owners(s).
 * Copyright (C) 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated Protocol Buffer code for file
 * phonemetadata.proto.
 */

goog.provide('i18n.phonenumbers.NumberFormat');
goog.provide('i18n.phonenumbers.PhoneNumberDesc');
goog.provide('i18n.phonenumbers.PhoneMetadata');
goog.provide('i18n.phonenumbers.PhoneMetadataCollection');

goog.require('goog.proto2.Message');

/**
 * Message NumberFormat.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.NumberFormat = function() {
  goog.proto2.Message.apply(this);
};
goog.inherits(i18n.phonenumbers.NumberFormat, goog.proto2.Message);

/**
 * Gets the value of the pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getPattern = function() {
  return /** @type {?string} */ (this.get$Value(1));
};


/**
 * Gets the value of the pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setPattern = function(value) {
  this.set$Value(1, /** @type {Object} */ (value));
};


/**
 * Returns whether the pattern field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasPattern = function() {
  return this.has$Value(1);
};


/**
 * Gets the number of values in the pattern field.
 * @return {number}
 */
i18n.phonenumbers.NumberFormat.prototype.patternCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearPattern = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the format field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getFormat = function() {
  return /** @type {?string} */ (this.get$Value(2));
};


/**
 * Gets the value of the format field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getFormatOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the format field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setFormat = function(value) {
  this.set$Value(2, /** @type {Object} */ (value));
};


/**
 * Returns whether the format field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasFormat = function() {
  return this.has$Value(2);
};


/**
 * Gets the number of values in the format field.
 * @return {number}
 */
i18n.phonenumbers.NumberFormat.prototype.formatCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the format field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearFormat = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the leading_digits_pattern field at the index given.
 * @param {number} index The index to lookup.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getLeadingDigitsPattern = function(index) {
  return /** @type {?string} */ (this.get$Value(3, index));
};


/**
 * Gets the value of the leading_digits_pattern field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getLeadingDigitsPatternOrDefault = function(index) {
  return /** @type {string} */ (this.get$ValueOrDefault(3, index));
};


/**
 * Adds a value to the leading_digits_pattern field.
 * @param {string} value The value to add.
 */
i18n.phonenumbers.NumberFormat.prototype.addLeadingDigitsPattern = function(value) {
  this.add$Value(3, /** @type {Object} */ (value));
};


/**
 * Returns the array of values in the leading_digits_pattern field.
 * @return {Array.<string>} The values in the field.
 */
i18n.phonenumbers.NumberFormat.prototype.leadingDigitsPatternArray = function() {
  return /** @type {Array.<string>} */ (this.array$Values(3));
};


/**
 * Returns whether the leading_digits_pattern field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasLeadingDigitsPattern = function() {
  return this.has$Value(3);
};


/**
 * Gets the number of values in the leading_digits_pattern field.
 * @return {number}
 */
i18n.phonenumbers.NumberFormat.prototype.leadingDigitsPatternCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the leading_digits_pattern field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearLeadingDigitsPattern = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the national_prefix_formatting_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixFormattingRule = function() {
  return /** @type {?string} */ (this.get$Value(4));
};


/**
 * Gets the value of the national_prefix_formatting_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getNationalPrefixFormattingRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the national_prefix_formatting_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setNationalPrefixFormattingRule = function(value) {
  this.set$Value(4, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_prefix_formatting_rule field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasNationalPrefixFormattingRule = function() {
  return this.has$Value(4);
};


/**
 * Gets the number of values in the national_prefix_formatting_rule field.
 * @return {number}
 */
i18n.phonenumbers.NumberFormat.prototype.nationalPrefixFormattingRuleCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the national_prefix_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearNationalPrefixFormattingRule = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the domestic_carrier_code_formatting_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getDomesticCarrierCodeFormattingRule = function() {
  return /** @type {?string} */ (this.get$Value(5));
};


/**
 * Gets the value of the domestic_carrier_code_formatting_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.NumberFormat.prototype.getDomesticCarrierCodeFormattingRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the domestic_carrier_code_formatting_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.NumberFormat.prototype.setDomesticCarrierCodeFormattingRule = function(value) {
  this.set$Value(5, /** @type {Object} */ (value));
};


/**
 * Returns whether the domestic_carrier_code_formatting_rule field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.NumberFormat.prototype.hasDomesticCarrierCodeFormattingRule = function() {
  return this.has$Value(5);
};


/**
 * Gets the number of values in the domestic_carrier_code_formatting_rule field.
 * @return {number}
 */
i18n.phonenumbers.NumberFormat.prototype.domesticCarrierCodeFormattingRuleCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the domestic_carrier_code_formatting_rule field.
 */
i18n.phonenumbers.NumberFormat.prototype.clearDomesticCarrierCodeFormattingRule = function() {
  this.clear$Field(5);
};




/**
 * Message PhoneNumberDesc.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneNumberDesc = function() {
  goog.proto2.Message.apply(this);
};
goog.inherits(i18n.phonenumbers.PhoneNumberDesc, goog.proto2.Message);

/**
 * Gets the value of the national_number_pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberPattern = function() {
  return /** @type {?string} */ (this.get$Value(2));
};


/**
 * Gets the value of the national_number_pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getNationalNumberPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the national_number_pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setNationalNumberPattern = function(value) {
  this.set$Value(2, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_number_pattern field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasNationalNumberPattern = function() {
  return this.has$Value(2);
};


/**
 * Gets the number of values in the national_number_pattern field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.nationalNumberPatternCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the national_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearNationalNumberPattern = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the possible_number_pattern field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberPattern = function() {
  return /** @type {?string} */ (this.get$Value(3));
};


/**
 * Gets the value of the possible_number_pattern field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getPossibleNumberPatternOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the possible_number_pattern field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setPossibleNumberPattern = function(value) {
  this.set$Value(3, /** @type {Object} */ (value));
};


/**
 * Returns whether the possible_number_pattern field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasPossibleNumberPattern = function() {
  return this.has$Value(3);
};


/**
 * Gets the number of values in the possible_number_pattern field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.possibleNumberPatternCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the possible_number_pattern field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearPossibleNumberPattern = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the example_number field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getExampleNumber = function() {
  return /** @type {?string} */ (this.get$Value(6));
};


/**
 * Gets the value of the example_number field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.getExampleNumberOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the example_number field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.setExampleNumber = function(value) {
  this.set$Value(6, /** @type {Object} */ (value));
};


/**
 * Returns whether the example_number field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.hasExampleNumber = function() {
  return this.has$Value(6);
};


/**
 * Gets the number of values in the example_number field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.exampleNumberCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the example_number field.
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.clearExampleNumber = function() {
  this.clear$Field(6);
};




/**
 * Message PhoneMetadata.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneMetadata = function() {
  goog.proto2.Message.apply(this);
};
goog.inherits(i18n.phonenumbers.PhoneMetadata, goog.proto2.Message);

/**
 * Gets the value of the general_desc field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getGeneralDesc = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(1));
};


/**
 * Gets the value of the general_desc field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getGeneralDescOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the general_desc field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setGeneralDesc = function(value) {
  this.set$Value(1, /** @type {Object} */ (value));
};


/**
 * Returns whether the general_desc field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasGeneralDesc = function() {
  return this.has$Value(1);
};


/**
 * Gets the number of values in the general_desc field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.generalDescCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the general_desc field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearGeneralDesc = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the fixed_line field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getFixedLine = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(2));
};


/**
 * Gets the value of the fixed_line field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getFixedLineOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the fixed_line field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setFixedLine = function(value) {
  this.set$Value(2, /** @type {Object} */ (value));
};


/**
 * Returns whether the fixed_line field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasFixedLine = function() {
  return this.has$Value(2);
};


/**
 * Gets the number of values in the fixed_line field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.fixedLineCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the fixed_line field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearFixedLine = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the mobile field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMobile = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(3));
};


/**
 * Gets the value of the mobile field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMobileOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the mobile field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setMobile = function(value) {
  this.set$Value(3, /** @type {Object} */ (value));
};


/**
 * Returns whether the mobile field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasMobile = function() {
  return this.has$Value(3);
};


/**
 * Gets the number of values in the mobile field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.mobileCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the mobile field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearMobile = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the toll_free field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getTollFree = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(4));
};


/**
 * Gets the value of the toll_free field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getTollFreeOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the toll_free field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setTollFree = function(value) {
  this.set$Value(4, /** @type {Object} */ (value));
};


/**
 * Returns whether the toll_free field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasTollFree = function() {
  return this.has$Value(4);
};


/**
 * Gets the number of values in the toll_free field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.tollFreeCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the toll_free field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearTollFree = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the premium_rate field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPremiumRate = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(5));
};


/**
 * Gets the value of the premium_rate field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPremiumRateOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the premium_rate field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPremiumRate = function(value) {
  this.set$Value(5, /** @type {Object} */ (value));
};


/**
 * Returns whether the premium_rate field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPremiumRate = function() {
  return this.has$Value(5);
};


/**
 * Gets the number of values in the premium_rate field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.premiumRateCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the premium_rate field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPremiumRate = function() {
  this.clear$Field(5);
};


/**
 * Gets the value of the shared_cost field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSharedCost = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(6));
};


/**
 * Gets the value of the shared_cost field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSharedCostOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the shared_cost field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setSharedCost = function(value) {
  this.set$Value(6, /** @type {Object} */ (value));
};


/**
 * Returns whether the shared_cost field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasSharedCost = function() {
  return this.has$Value(6);
};


/**
 * Gets the number of values in the shared_cost field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.sharedCostCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the shared_cost field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearSharedCost = function() {
  this.clear$Field(6);
};


/**
 * Gets the value of the personal_number field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPersonalNumber = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(7));
};


/**
 * Gets the value of the personal_number field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPersonalNumberOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(7));
};


/**
 * Sets the value of the personal_number field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPersonalNumber = function(value) {
  this.set$Value(7, /** @type {Object} */ (value));
};


/**
 * Returns whether the personal_number field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPersonalNumber = function() {
  return this.has$Value(7);
};


/**
 * Gets the number of values in the personal_number field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.personalNumberCount = function() {
  return this.count$Values(7);
};


/**
 * Clears the values in the personal_number field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPersonalNumber = function() {
  this.clear$Field(7);
};


/**
 * Gets the value of the voip field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoip = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(8));
};


/**
 * Gets the value of the voip field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getVoipOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(8));
};


/**
 * Sets the value of the voip field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setVoip = function(value) {
  this.set$Value(8, /** @type {Object} */ (value));
};


/**
 * Returns whether the voip field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasVoip = function() {
  return this.has$Value(8);
};


/**
 * Gets the number of values in the voip field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.voipCount = function() {
  return this.count$Values(8);
};


/**
 * Clears the values in the voip field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearVoip = function() {
  this.clear$Field(8);
};


/**
 * Gets the value of the pager field.
 * @return {?i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPager = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumberDesc} */ (this.get$Value(21));
};


/**
 * Gets the value of the pager field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumberDesc} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPagerOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumberDesc} */ (this.get$ValueOrDefault(21));
};


/**
 * Sets the value of the pager field.
 * @param {i18n.phonenumbers.PhoneNumberDesc} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPager = function(value) {
  this.set$Value(21, /** @type {Object} */ (value));
};


/**
 * Returns whether the pager field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPager = function() {
  return this.has$Value(21);
};


/**
 * Gets the number of values in the pager field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.pagerCount = function() {
  return this.count$Values(21);
};


/**
 * Clears the values in the pager field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPager = function() {
  this.clear$Field(21);
};


/**
 * Gets the value of the id field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getId = function() {
  return /** @type {?string} */ (this.get$Value(9));
};


/**
 * Gets the value of the id field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIdOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(9));
};


/**
 * Sets the value of the id field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setId = function(value) {
  this.set$Value(9, /** @type {Object} */ (value));
};


/**
 * Returns whether the id field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasId = function() {
  return this.has$Value(9);
};


/**
 * Gets the number of values in the id field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.idCount = function() {
  return this.count$Values(9);
};


/**
 * Clears the values in the id field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearId = function() {
  this.clear$Field(9);
};


/**
 * Gets the value of the country_code field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getCountryCode = function() {
  return /** @type {?number} */ (this.get$Value(10));
};


/**
 * Gets the value of the country_code field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getCountryCodeOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(10));
};


/**
 * Sets the value of the country_code field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setCountryCode = function(value) {
  this.set$Value(10, /** @type {Object} */ (value));
};


/**
 * Returns whether the country_code field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasCountryCode = function() {
  return this.has$Value(10);
};


/**
 * Gets the number of values in the country_code field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.countryCodeCount = function() {
  return this.count$Values(10);
};


/**
 * Clears the values in the country_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearCountryCode = function() {
  this.clear$Field(10);
};


/**
 * Gets the value of the international_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getInternationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(11));
};


/**
 * Gets the value of the international_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getInternationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(11));
};


/**
 * Sets the value of the international_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setInternationalPrefix = function(value) {
  this.set$Value(11, /** @type {Object} */ (value));
};


/**
 * Returns whether the international_prefix field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasInternationalPrefix = function() {
  return this.has$Value(11);
};


/**
 * Gets the number of values in the international_prefix field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.internationalPrefixCount = function() {
  return this.count$Values(11);
};


/**
 * Clears the values in the international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearInternationalPrefix = function() {
  this.clear$Field(11);
};


/**
 * Gets the value of the preferred_international_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredInternationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(17));
};


/**
 * Gets the value of the preferred_international_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredInternationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(17));
};


/**
 * Sets the value of the preferred_international_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPreferredInternationalPrefix = function(value) {
  this.set$Value(17, /** @type {Object} */ (value));
};


/**
 * Returns whether the preferred_international_prefix field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPreferredInternationalPrefix = function() {
  return this.has$Value(17);
};


/**
 * Gets the number of values in the preferred_international_prefix field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.preferredInternationalPrefixCount = function() {
  return this.count$Values(17);
};


/**
 * Clears the values in the preferred_international_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPreferredInternationalPrefix = function() {
  this.clear$Field(17);
};


/**
 * Gets the value of the national_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefix = function() {
  return /** @type {?string} */ (this.get$Value(12));
};


/**
 * Gets the value of the national_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(12));
};


/**
 * Sets the value of the national_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefix = function(value) {
  this.set$Value(12, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_prefix field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefix = function() {
  return this.has$Value(12);
};


/**
 * Gets the number of values in the national_prefix field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixCount = function() {
  return this.count$Values(12);
};


/**
 * Clears the values in the national_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefix = function() {
  this.clear$Field(12);
};


/**
 * Gets the value of the preferred_extn_prefix field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredExtnPrefix = function() {
  return /** @type {?string} */ (this.get$Value(13));
};


/**
 * Gets the value of the preferred_extn_prefix field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getPreferredExtnPrefixOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(13));
};


/**
 * Sets the value of the preferred_extn_prefix field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setPreferredExtnPrefix = function(value) {
  this.set$Value(13, /** @type {Object} */ (value));
};


/**
 * Returns whether the preferred_extn_prefix field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasPreferredExtnPrefix = function() {
  return this.has$Value(13);
};


/**
 * Gets the number of values in the preferred_extn_prefix field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.preferredExtnPrefixCount = function() {
  return this.count$Values(13);
};


/**
 * Clears the values in the preferred_extn_prefix field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearPreferredExtnPrefix = function() {
  this.clear$Field(13);
};


/**
 * Gets the value of the national_prefix_for_parsing field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixForParsing = function() {
  return /** @type {?string} */ (this.get$Value(15));
};


/**
 * Gets the value of the national_prefix_for_parsing field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixForParsingOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(15));
};


/**
 * Sets the value of the national_prefix_for_parsing field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefixForParsing = function(value) {
  this.set$Value(15, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_prefix_for_parsing field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefixForParsing = function() {
  return this.has$Value(15);
};


/**
 * Gets the number of values in the national_prefix_for_parsing field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixForParsingCount = function() {
  return this.count$Values(15);
};


/**
 * Clears the values in the national_prefix_for_parsing field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefixForParsing = function() {
  this.clear$Field(15);
};


/**
 * Gets the value of the national_prefix_transform_rule field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixTransformRule = function() {
  return /** @type {?string} */ (this.get$Value(16));
};


/**
 * Gets the value of the national_prefix_transform_rule field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNationalPrefixTransformRuleOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(16));
};


/**
 * Sets the value of the national_prefix_transform_rule field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setNationalPrefixTransformRule = function(value) {
  this.set$Value(16, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_prefix_transform_rule field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNationalPrefixTransformRule = function() {
  return this.has$Value(16);
};


/**
 * Gets the number of values in the national_prefix_transform_rule field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.nationalPrefixTransformRuleCount = function() {
  return this.count$Values(16);
};


/**
 * Clears the values in the national_prefix_transform_rule field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNationalPrefixTransformRule = function() {
  this.clear$Field(16);
};


/**
 * Gets the value of the same_mobile_and_fixed_line_pattern field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSameMobileAndFixedLinePattern = function() {
  return /** @type {?boolean} */ (this.get$Value(18));
};


/**
 * Gets the value of the same_mobile_and_fixed_line_pattern field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getSameMobileAndFixedLinePatternOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(18));
};


/**
 * Sets the value of the same_mobile_and_fixed_line_pattern field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setSameMobileAndFixedLinePattern = function(value) {
  this.set$Value(18, /** @type {Object} */ (value));
};


/**
 * Returns whether the same_mobile_and_fixed_line_pattern field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasSameMobileAndFixedLinePattern = function() {
  return this.has$Value(18);
};


/**
 * Gets the number of values in the same_mobile_and_fixed_line_pattern field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.sameMobileAndFixedLinePatternCount = function() {
  return this.count$Values(18);
};


/**
 * Clears the values in the same_mobile_and_fixed_line_pattern field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearSameMobileAndFixedLinePattern = function() {
  this.clear$Field(18);
};


/**
 * Gets the value of the number_format field at the index given.
 * @param {number} index The index to lookup.
 * @return {?i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNumberFormat = function(index) {
  return /** @type {?i18n.phonenumbers.NumberFormat} */ (this.get$Value(19, index));
};


/**
 * Gets the value of the number_format field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getNumberFormatOrDefault = function(index) {
  return /** @type {i18n.phonenumbers.NumberFormat} */ (this.get$ValueOrDefault(19, index));
};


/**
 * Adds a value to the number_format field.
 * @param {i18n.phonenumbers.NumberFormat} value The value to add.
 */
i18n.phonenumbers.PhoneMetadata.prototype.addNumberFormat = function(value) {
  this.add$Value(19, /** @type {Object} */ (value));
};


/**
 * Returns the array of values in the number_format field.
 * @return {Array.<i18n.phonenumbers.NumberFormat>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.numberFormatArray = function() {
  return /** @type {Array.<i18n.phonenumbers.NumberFormat>} */ (this.array$Values(19));
};


/**
 * Returns whether the number_format field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasNumberFormat = function() {
  return this.has$Value(19);
};


/**
 * Gets the number of values in the number_format field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.numberFormatCount = function() {
  return this.count$Values(19);
};


/**
 * Clears the values in the number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearNumberFormat = function() {
  this.clear$Field(19);
};


/**
 * Gets the value of the intl_number_format field at the index given.
 * @param {number} index The index to lookup.
 * @return {?i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIntlNumberFormat = function(index) {
  return /** @type {?i18n.phonenumbers.NumberFormat} */ (this.get$Value(20, index));
};


/**
 * Gets the value of the intl_number_format field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.NumberFormat} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getIntlNumberFormatOrDefault = function(index) {
  return /** @type {i18n.phonenumbers.NumberFormat} */ (this.get$ValueOrDefault(20, index));
};


/**
 * Adds a value to the intl_number_format field.
 * @param {i18n.phonenumbers.NumberFormat} value The value to add.
 */
i18n.phonenumbers.PhoneMetadata.prototype.addIntlNumberFormat = function(value) {
  this.add$Value(20, /** @type {Object} */ (value));
};


/**
 * Returns the array of values in the intl_number_format field.
 * @return {Array.<i18n.phonenumbers.NumberFormat>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.intlNumberFormatArray = function() {
  return /** @type {Array.<i18n.phonenumbers.NumberFormat>} */ (this.array$Values(20));
};


/**
 * Returns whether the intl_number_format field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasIntlNumberFormat = function() {
  return this.has$Value(20);
};


/**
 * Gets the number of values in the intl_number_format field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.intlNumberFormatCount = function() {
  return this.count$Values(20);
};


/**
 * Clears the values in the intl_number_format field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearIntlNumberFormat = function() {
  this.clear$Field(20);
};


/**
 * Gets the value of the main_country_for_code field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMainCountryForCode = function() {
  return /** @type {?boolean} */ (this.get$Value(22));
};


/**
 * Gets the value of the main_country_for_code field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getMainCountryForCodeOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(22));
};


/**
 * Sets the value of the main_country_for_code field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setMainCountryForCode = function(value) {
  this.set$Value(22, /** @type {Object} */ (value));
};


/**
 * Returns whether the main_country_for_code field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasMainCountryForCode = function() {
  return this.has$Value(22);
};


/**
 * Gets the number of values in the main_country_for_code field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.mainCountryForCodeCount = function() {
  return this.count$Values(22);
};


/**
 * Clears the values in the main_country_for_code field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearMainCountryForCode = function() {
  this.clear$Field(22);
};


/**
 * Gets the value of the leading_digits field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingDigits = function() {
  return /** @type {?string} */ (this.get$Value(23));
};


/**
 * Gets the value of the leading_digits field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.getLeadingDigitsOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(23));
};


/**
 * Sets the value of the leading_digits field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.setLeadingDigits = function(value) {
  this.set$Value(23, /** @type {Object} */ (value));
};


/**
 * Returns whether the leading_digits field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadata.prototype.hasLeadingDigits = function() {
  return this.has$Value(23);
};


/**
 * Gets the number of values in the leading_digits field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadata.prototype.leadingDigitsCount = function() {
  return this.count$Values(23);
};


/**
 * Clears the values in the leading_digits field.
 */
i18n.phonenumbers.PhoneMetadata.prototype.clearLeadingDigits = function() {
  this.clear$Field(23);
};




/**
 * Message PhoneMetadataCollection.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneMetadataCollection = function() {
  goog.proto2.Message.apply(this);
};
goog.inherits(i18n.phonenumbers.PhoneMetadataCollection, goog.proto2.Message);

/**
 * Gets the value of the metadata field at the index given.
 * @param {number} index The index to lookup.
 * @return {?i18n.phonenumbers.PhoneMetadata} The value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.getMetadata = function(index) {
  return /** @type {?i18n.phonenumbers.PhoneMetadata} */ (this.get$Value(1, index));
};


/**
 * Gets the value of the metadata field at the index given or the default value if not set.
 * @param {number} index The index to lookup.
 * @return {i18n.phonenumbers.PhoneMetadata} The value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.getMetadataOrDefault = function(index) {
  return /** @type {i18n.phonenumbers.PhoneMetadata} */ (this.get$ValueOrDefault(1, index));
};


/**
 * Adds a value to the metadata field.
 * @param {i18n.phonenumbers.PhoneMetadata} value The value to add.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.addMetadata = function(value) {
  this.add$Value(1, /** @type {Object} */ (value));
};


/**
 * Returns the array of values in the metadata field.
 * @return {Array.<i18n.phonenumbers.PhoneMetadata>} The values in the field.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.metadataArray = function() {
  return /** @type {Array.<i18n.phonenumbers.PhoneMetadata>} */ (this.array$Values(1));
};


/**
 * Returns whether the metadata field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.hasMetadata = function() {
  return this.has$Value(1);
};


/**
 * Gets the number of values in the metadata field.
 * @return {number}
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.metadataCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the metadata field.
 */
i18n.phonenumbers.PhoneMetadataCollection.prototype.clearMetadata = function() {
  this.clear$Field(1);
};




goog.proto2.Message.set$Metadata(i18n.phonenumbers.NumberFormat, {
  0 : {
    name: 'NumberFormat',
    fullName: 'i18n.phonenumbers.NumberFormat'
  },
  '1' : {
    name: 'pattern',
    required: true,
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '2' : {
    name: 'format',
    required: true,
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '3' : {
    name: 'leading_digits_pattern',
    repeated: true,
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '4' : {
    name: 'national_prefix_formatting_rule',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '5' : {
    name: 'domestic_carrier_code_formatting_rule',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  }});

goog.proto2.Message.set$Metadata(i18n.phonenumbers.PhoneNumberDesc, {
  0 : {
    name: 'PhoneNumberDesc',
    fullName: 'i18n.phonenumbers.PhoneNumberDesc'
  },
  '2' : {
    name: 'national_number_pattern',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '3' : {
    name: 'possible_number_pattern',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '6' : {
    name: 'example_number',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  }});

goog.proto2.Message.set$Metadata(i18n.phonenumbers.PhoneMetadata, {
  0 : {
    name: 'PhoneMetadata',
    fullName: 'i18n.phonenumbers.PhoneMetadata'
  },
  '1' : {
    name: 'general_desc',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '2' : {
    name: 'fixed_line',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '3' : {
    name: 'mobile',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '4' : {
    name: 'toll_free',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '5' : {
    name: 'premium_rate',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '6' : {
    name: 'shared_cost',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '7' : {
    name: 'personal_number',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '8' : {
    name: 'voip',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '9' : {
    name: 'id',
    required: true,
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '10' : {
    name: 'country_code',
    required: true,
    fieldType: goog.proto2.Message.FieldType.INT32,
    type: Number
  },
  '11' : {
    name: 'international_prefix',
    required: true,
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '17' : {
    name: 'preferred_international_prefix',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '12' : {
    name: 'national_prefix',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '13' : {
    name: 'preferred_extn_prefix',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '15' : {
    name: 'national_prefix_for_parsing',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '16' : {
    name: 'national_prefix_transform_rule',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '18' : {
    name: 'same_mobile_and_fixed_line_pattern',
    fieldType: goog.proto2.Message.FieldType.BOOL,
    defaultValue: false,
    type: Boolean
  },
  '19' : {
    name: 'number_format',
    repeated: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.NumberFormat
  },
  '20' : {
    name: 'intl_number_format',
    repeated: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.NumberFormat
  },
  '21' : {
    name: 'pager',
    required: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneNumberDesc
  },
  '22' : {
    name: 'main_country_for_code',
    fieldType: goog.proto2.Message.FieldType.BOOL,
    defaultValue: false,
    type: Boolean
  },
  '23' : {
    name: 'leading_digits',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  }});

goog.proto2.Message.set$Metadata(i18n.phonenumbers.PhoneMetadataCollection, {
  0 : {
    name: 'PhoneMetadataCollection',
    fullName: 'i18n.phonenumbers.PhoneMetadataCollection'
  },
  '1' : {
    name: 'metadata',
    repeated: true,
    fieldType: goog.proto2.Message.FieldType.MESSAGE,
    type: i18n.phonenumbers.PhoneMetadata
  }});



/*
 * @license
 * Protocol Buffer 2 Copyright 2008 Google Inc
 * All other code copyright its respective owners(s).
 * Copyright (C) 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated Protocol Buffer code for file
 * phonenumber.proto.
 */

goog.provide('i18n.phonenumbers.PhoneNumber');
goog.provide('i18n.phonenumbers.PhoneNumber.CountryCodeSource');

goog.require('goog.proto2.Message');

/**
 * Message PhoneNumber.
 * @constructor
 * @extends {goog.proto2.Message}
 */
i18n.phonenumbers.PhoneNumber = function() {
  goog.proto2.Message.apply(this);
};
goog.inherits(i18n.phonenumbers.PhoneNumber, goog.proto2.Message);

/**
 * Gets the value of the country_code field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCode = function() {
  return /** @type {?number} */ (this.get$Value(1));
};


/**
 * Gets the value of the country_code field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(1));
};


/**
 * Sets the value of the country_code field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setCountryCode = function(value) {
  this.set$Value(1, /** @type {Object} */ (value));
};


/**
 * Returns whether the country_code field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasCountryCode = function() {
  return this.has$Value(1);
};


/**
 * Gets the number of values in the country_code field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.countryCodeCount = function() {
  return this.count$Values(1);
};


/**
 * Clears the values in the country_code field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearCountryCode = function() {
  this.clear$Field(1);
};


/**
 * Gets the value of the national_number field.
 * @return {?number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNationalNumber = function() {
  return /** @type {?number} */ (this.get$Value(2));
};


/**
 * Gets the value of the national_number field or the default value if not set.
 * @return {number} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getNationalNumberOrDefault = function() {
  return /** @type {number} */ (this.get$ValueOrDefault(2));
};


/**
 * Sets the value of the national_number field.
 * @param {number} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setNationalNumber = function(value) {
  this.set$Value(2, /** @type {Object} */ (value));
};


/**
 * Returns whether the national_number field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasNationalNumber = function() {
  return this.has$Value(2);
};


/**
 * Gets the number of values in the national_number field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.nationalNumberCount = function() {
  return this.count$Values(2);
};


/**
 * Clears the values in the national_number field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearNationalNumber = function() {
  this.clear$Field(2);
};


/**
 * Gets the value of the extension field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getExtension = function() {
  return /** @type {?string} */ (this.get$Value(3));
};


/**
 * Gets the value of the extension field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getExtensionOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(3));
};


/**
 * Sets the value of the extension field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setExtension = function(value) {
  this.set$Value(3, /** @type {Object} */ (value));
};


/**
 * Returns whether the extension field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasExtension = function() {
  return this.has$Value(3);
};


/**
 * Gets the number of values in the extension field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.extensionCount = function() {
  return this.count$Values(3);
};


/**
 * Clears the values in the extension field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearExtension = function() {
  this.clear$Field(3);
};


/**
 * Gets the value of the italian_leading_zero field.
 * @return {?boolean} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getItalianLeadingZero = function() {
  return /** @type {?boolean} */ (this.get$Value(4));
};


/**
 * Gets the value of the italian_leading_zero field or the default value if not set.
 * @return {boolean} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getItalianLeadingZeroOrDefault = function() {
  return /** @type {boolean} */ (this.get$ValueOrDefault(4));
};


/**
 * Sets the value of the italian_leading_zero field.
 * @param {boolean} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setItalianLeadingZero = function(value) {
  this.set$Value(4, /** @type {Object} */ (value));
};


/**
 * Returns whether the italian_leading_zero field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasItalianLeadingZero = function() {
  return this.has$Value(4);
};


/**
 * Gets the number of values in the italian_leading_zero field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.italianLeadingZeroCount = function() {
  return this.count$Values(4);
};


/**
 * Clears the values in the italian_leading_zero field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearItalianLeadingZero = function() {
  this.clear$Field(4);
};


/**
 * Gets the value of the raw_input field.
 * @return {?string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getRawInput = function() {
  return /** @type {?string} */ (this.get$Value(5));
};


/**
 * Gets the value of the raw_input field or the default value if not set.
 * @return {string} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getRawInputOrDefault = function() {
  return /** @type {string} */ (this.get$ValueOrDefault(5));
};


/**
 * Sets the value of the raw_input field.
 * @param {string} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setRawInput = function(value) {
  this.set$Value(5, /** @type {Object} */ (value));
};


/**
 * Returns whether the raw_input field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasRawInput = function() {
  return this.has$Value(5);
};


/**
 * Gets the number of values in the raw_input field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.rawInputCount = function() {
  return this.count$Values(5);
};


/**
 * Clears the values in the raw_input field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearRawInput = function() {
  this.clear$Field(5);
};


/**
 * Gets the value of the country_code_source field.
 * @return {?i18n.phonenumbers.PhoneNumber.CountryCodeSource} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeSource = function() {
  return /** @type {?i18n.phonenumbers.PhoneNumber.CountryCodeSource} */ (this.get$Value(6));
};


/**
 * Gets the value of the country_code_source field or the default value if not set.
 * @return {i18n.phonenumbers.PhoneNumber.CountryCodeSource} The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.getCountryCodeSourceOrDefault = function() {
  return /** @type {i18n.phonenumbers.PhoneNumber.CountryCodeSource} */ (this.get$ValueOrDefault(6));
};


/**
 * Sets the value of the country_code_source field.
 * @param {i18n.phonenumbers.PhoneNumber.CountryCodeSource} value The value.
 */
i18n.phonenumbers.PhoneNumber.prototype.setCountryCodeSource = function(value) {
  this.set$Value(6, /** @type {Object} */ (value));
};


/**
 * Returns whether the country_code_source field has a value.
 * @return {boolean} true if the field has a value.
 */
i18n.phonenumbers.PhoneNumber.prototype.hasCountryCodeSource = function() {
  return this.has$Value(6);
};


/**
 * Gets the number of values in the country_code_source field.
 * @return {number}
 */
i18n.phonenumbers.PhoneNumber.prototype.countryCodeSourceCount = function() {
  return this.count$Values(6);
};


/**
 * Clears the values in the country_code_source field.
 */
i18n.phonenumbers.PhoneNumber.prototype.clearCountryCodeSource = function() {
  this.clear$Field(6);
};


/**
 * Enumeration CountryCodeSource.
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumber.CountryCodeSource = {
  FROM_NUMBER_WITH_PLUS_SIGN : 1,
  FROM_NUMBER_WITH_IDD : 5,
  FROM_NUMBER_WITHOUT_PLUS_SIGN : 10,
  FROM_DEFAULT_COUNTRY : 20
};



goog.proto2.Message.set$Metadata(i18n.phonenumbers.PhoneNumber, {
  0 : {
    name: 'PhoneNumber',
    fullName: 'i18n.phonenumbers.PhoneNumber'
  },
  '1' : {
    name: 'country_code',
    required: true,
    fieldType: goog.proto2.Message.FieldType.INT32,
    type: Number
  },
  '2' : {
    name: 'national_number',
    required: true,
    fieldType: goog.proto2.Message.FieldType.UINT64,
    type: Number
  },
  '3' : {
    name: 'extension',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '4' : {
    name: 'italian_leading_zero',
    fieldType: goog.proto2.Message.FieldType.BOOL,
    type: Boolean
  },
  '5' : {
    name: 'raw_input',
    fieldType: goog.proto2.Message.FieldType.STRING,
    type: String
  },
  '6' : {
    name: 'country_code_source',
    fieldType: goog.proto2.Message.FieldType.ENUM,
    defaultValue: i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_PLUS_SIGN,
    type: i18n.phonenumbers.PhoneNumber.CountryCodeSource
  }});



/*
 * @license
 * Copyright (C) 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generated metadata for file
 * java/resources/com/google/i18n/phonenumbers/src/PhoneNumberMetaData.xml
 * @author Nikolaos Trogkanis
 */

goog.provide('i18n.phonenumbers.metadata');

/**
 * A mapping from a country code to the region codes which denote the
 * country/region represented by that country code. In the case of multiple
 * countries sharing a calling code, such as the NANPA countries, the one
 * indicated with "isMainCountryForCode" in the metadata should be first.
 * @type {Object.<number, Array.<string>>}
 */
i18n.phonenumbers.metadata.countryCodeToRegionCodeMap = {
1:["US","AG","AI","AS","BB","BM","BS","CA","DM","DO","GD","GU","JM","KN","KY","LC","MP","MS","PR","TC","TT","VC","VG","VI"]
,7:["RU","KZ"]
,20:["EG"]
,27:["ZA"]
,30:["GR"]
,31:["NL"]
,32:["BE"]
,33:["FR"]
,34:["ES"]
,36:["HU"]
,39:["IT"]
,40:["RO"]
,41:["CH"]
,43:["AT"]
,44:["GB","GG","IM","JE"]
,45:["DK"]
,46:["SE"]
,47:["NO"]
,48:["PL"]
,49:["DE"]
,51:["PE"]
,52:["MX"]
,53:["CU"]
,54:["AR"]
,55:["BR"]
,56:["CL"]
,57:["CO"]
,58:["VE"]
,60:["MY"]
,61:["AU"]
,62:["ID"]
,63:["PH"]
,64:["NZ"]
,65:["SG"]
,66:["TH"]
,81:["JP"]
,82:["KR"]
,84:["VN"]
,86:["CN"]
,90:["TR"]
,91:["IN"]
,92:["PK"]
,93:["AF"]
,94:["LK"]
,95:["MM"]
,98:["IR"]
,212:["MA"]
,213:["DZ"]
,216:["TN"]
,218:["LY"]
,220:["GM"]
,221:["SN"]
,222:["MR"]
,223:["ML"]
,224:["GN"]
,225:["CI"]
,226:["BF"]
,227:["NE"]
,228:["TG"]
,229:["BJ"]
,230:["MU"]
,231:["LR"]
,232:["SL"]
,233:["GH"]
,234:["NG"]
,235:["TD"]
,236:["CF"]
,237:["CM"]
,238:["CV"]
,239:["ST"]
,240:["GQ"]
,241:["GA"]
,242:["CG"]
,243:["CD"]
,244:["AO"]
,245:["GW"]
,246:["IO"]
,248:["SC"]
,249:["SD"]
,250:["RW"]
,251:["ET"]
,252:["SO"]
,253:["DJ"]
,254:["KE"]
,255:["TZ"]
,256:["UG"]
,257:["BI"]
,258:["MZ"]
,260:["ZM"]
,261:["MG"]
,262:["RE","TF","YT"]
,263:["ZW"]
,264:["NA"]
,265:["MW"]
,266:["LS"]
,267:["BW"]
,268:["SZ"]
,269:["KM"]
,290:["SH"]
,291:["ER"]
,297:["AW"]
,298:["FO"]
,299:["GL"]
,350:["GI"]
,351:["PT"]
,352:["LU"]
,353:["IE"]
,354:["IS"]
,355:["AL"]
,356:["MT"]
,357:["CY"]
,358:["FI"]
,359:["BG"]
,370:["LT"]
,371:["LV"]
,372:["EE"]
,373:["MD"]
,374:["AM"]
,375:["BY"]
,376:["AD"]
,377:["MC"]
,378:["SM"]
,379:["VA"]
,380:["UA"]
,381:["RS"]
,382:["ME"]
,385:["HR"]
,386:["SI"]
,387:["BA"]
,389:["MK"]
,420:["CZ"]
,421:["SK"]
,423:["LI"]
,500:["FK"]
,501:["BZ"]
,502:["GT"]
,503:["SV"]
,504:["HN"]
,505:["NI"]
,506:["CR"]
,507:["PA"]
,508:["PM"]
,509:["HT"]
,590:["GP","BL","MF"]
,591:["BO"]
,592:["GY"]
,593:["EC"]
,594:["GF"]
,595:["PY"]
,596:["MQ"]
,597:["SR"]
,598:["UY"]
,599:["AN"]
,670:["TL"]
,672:["NF"]
,673:["BN"]
,674:["NR"]
,675:["PG"]
,676:["TO"]
,677:["SB"]
,678:["VU"]
,679:["FJ"]
,680:["PW"]
,681:["WF"]
,682:["CK"]
,683:["NU"]
,685:["WS"]
,686:["KI"]
,687:["NC"]
,688:["TV"]
,689:["PF"]
,690:["TK"]
,691:["FM"]
,692:["MH"]
,850:["KP"]
,852:["HK"]
,853:["MO"]
,855:["KH"]
,856:["LA"]
,880:["BD"]
,886:["TW"]
,960:["MV"]
,961:["LB"]
,962:["JO"]
,963:["SY"]
,964:["IQ"]
,965:["KW"]
,966:["SA"]
,967:["YE"]
,968:["OM"]
,970:["PS"]
,971:["AE"]
,972:["IL"]
,973:["BH"]
,974:["QA"]
,975:["BT"]
,976:["MN"]
,977:["NP"]
,992:["TJ"]
,993:["TM"]
,994:["AZ"]
,995:["GE"]
,996:["KG"]
,998:["UZ"]
};

/**
 * A mapping from a region code to the PhoneMetadata for that region.
 * @type {Object.<string, Array>}
 */
i18n.phonenumbers.metadata.countryToMetadata = {
"AD":[,[,,"(?:[346-9]|180)\\d{5}","\\d{6,8}"]
,[,,"[78]\\d{5}","\\d{6}",,,"712345"]
,[,,"[346]\\d{5}","\\d{6}",,,"312345"]
,[,,"180[02]\\d{4}","\\d{8}",,,"18001234"]
,[,,"9\\d{5}","\\d{6}",,,"912345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AD",376,"00",,,,,,,,[[,"(\\d{3})(\\d{3})","$1 $2",["[346-9]"]
,"",""]
,[,"(180[02])(\\d{4})","$1 $2",["1"]
,"",""]
]
,,[,,"NA","NA"]
]
,"AE":[,[,,"[2-79]\\d{7,8}|800\\d{2,9}","\\d{5,12}"]
,[,,"(?:[2-4679][2-8]\\d|600[25])\\d{5}","\\d{7,9}",,,"22345678"]
,[,,"5[056]\\d{7}","\\d{9}",,,"501234567"]
,[,,"400\\d{6}|800\\d{2,9}","\\d{5,12}",,,"800123456"]
,[,,"900[02]\\d{5}","\\d{9}",,,"900234567"]
,[,,"700[05]\\d{5}","\\d{9}",,,"700012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AE",971,"00","0",,,"0",,,,[[,"([2-4679])(\\d{3})(\\d{4})","$1 $2 $3",["[2-4679][2-8]"]
,"0$1",""]
,[,"(5[056])(\\d{3})(\\d{4})","$1 $2 $3",["5"]
,"0$1",""]
,[,"([4679]00)(\\d)(\\d{5})","$1 $2 $3",["[4679]0"]
,"$1",""]
,[,"(800)(\\d{2,9})","$1 $2",["8"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"AF":[,[,,"[2-7]\\d{8}","\\d{7,9}"]
,[,,"(?:[25][0-8]|[34][0-4]|6[0-5])[2-9]\\d{6}","\\d{7,9}",,,"234567890"]
,[,,"7[057-9]\\d{7}","\\d{9}",,,"701234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AF",93,"00","0",,,"0",,,,[[,"([2-7]\\d)(\\d{3})(\\d{4})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"AG":[,[,,"[289]\\d{9}","\\d{7,10}"]
,[,,"268(?:4(?:6[0-3]|84)|56[0-2])\\d{4}","\\d{7,10}",,,"2684601234"]
,[,,"268(?:464|7(?:2[0-9]|64|7[0-5]|8[358]))\\d{4}","\\d{10}",,,"2684641234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"26848[01]\\d{4}","\\d{10}",,,"2684801234"]
,"AG",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"268"]
,"AI":[,[,,"[289]\\d{9}","\\d{7,10}"]
,[,,"2644(?:6[12]|9[78])\\d{4}","\\d{7,10}",,,"2644612345"]
,[,,"264(?:235|476|5(?:3[6-9]|8[1-4])|7(?:29|72))\\d{4}","\\d{10}",,,"2642351234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AI",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"264"]
,"AL":[,[,,"[2-57]\\d{7}|6\\d{8}|8\\d{5,7}|9\\d{5}","\\d{5,9}"]
,[,,"(?:2(?:[168][1-9]|[247]\\d|9[1-7])|3(?:1[1-3]|[2-6]\\d|[79][1-8]|8[1-9])|4\\d{2}|5(?:1[1-4]|[2-578]\\d|6[1-5]|9[1-7])|8(?:[19][1-5]|[2-6]\\d|[78][1-7]))\\d{5}","\\d{5,8}",,,"22345678"]
,[,,"6[6-9]\\d{7}","\\d{9}",,,"661234567"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"900\\d{3}","\\d{6}",,,"900123"]
,[,,"808\\d{3}","\\d{6}",,,"808123"]
,[,,"700\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"AL",355,"00","0",,,"0",,,,[[,"(4)(\\d{3})(\\d{4})","$1 $2 $3",["4[0-6]"]
,"0$1",""]
,[,"(6[6-9])(\\d{3})(\\d{4})","$1 $2 $3",["6"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[2358][2-5]|4[7-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3,5})","$1 $2",["[235][16-9]|8[016-9]|[79]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"AM":[,[,,"[1-37-9]\\d{7}","\\d{5,8}"]
,[,,"(?:10\\d|2(?:2[2-46]|3[1-8]|4[2-69]|5[2-7]|6[1-9]|8[1-7])|3[12]2)\\d{5}","\\d{5,8}",,,"10123456"]
,[,,"(?:77|9[1-49])\\d{6}","\\d{8}",,,"77123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90[016]\\d{5}","\\d{8}",,,"90012345"]
,[,,"80[1-4]\\d{5}","\\d{8}",,,"80112345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AM",374,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{6})","$1 $2",["[17]|9[1-49]"]
,"(0$1)",""]
,[,"(\\d{3})(\\d{5})","$1 $2",["[23]"]
,"(0$1)",""]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["8|90"]
,"0 $1",""]
]
,,[,,"NA","NA"]
]
,"AN":[,[,,"[13-79]\\d{6,7}","\\d{7,8}"]
,[,,"(?:318|5(?:25|4\\d|8[239])|7(?:1[578]|50)|9(?:[48]\\d{2}|50\\d|7(?:2[0-2]|[34]\\d|6[35-7]|77)))\\d{4}|416[0239]\\d{3}","\\d{7,8}",,,"7151234"]
,[,,"(?:318|5(?:1[01]|2[0-7]|5\\d|8[016-8])|7(?:0[01]|[89]\\d)|9(?:5(?:[1246]\\d|3[01])|6(?:[1679]\\d|3[01])))\\d{4}|416[15-8]\\d{3}","\\d{7,8}",,,"3181234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:10|69)\\d{5}","\\d{7,8}",,,"1011234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AN",599,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[13-7]"]
,"",""]
,[,"(9)(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"",""]
]
,,[,,"NA","NA"]
]
,"AO":[,[,,"[29]\\d{8}","\\d{9}"]
,[,,"2\\d(?:[26-9]\\d|\\d[26-9])\\d{5}","\\d{9}",,,"222123456"]
,[,,"9[1-3]\\d{7}","\\d{9}",,,"923123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AO",244,"00",,,,,,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"AR":[,[,,"[1-9]\\d{9,11}","\\d{6,12}"]
,[,,"[1-9]\\d{9}","\\d{6,10}",,,"1123456789"]
,[,,"9(?:11[2-9]\\d{7}|(?:2(?:2[013]|37|6[14]|9[179])|3(?:4[1235]|5[138]|8[1578]))[2-9]\\d{6}|\\d{4}[2-9]\\d{5})","\\d{6,12}",,,"91123456789"]
,[,,"80\\d{8}","\\d{10}",,,"8012345678"]
,[,,"6(?:0\\d|10)\\d{7}","\\d{10}",,,"6001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AR",54,"00","0",,,"0(?:(11|2(?:2(?:02?|[13]|2[13-79]|4[1-6]|5[2457]|6[124-8]|7[1-4]|8[13-6]|9[1-367])|3(?:[06]2|1[467]|2[02-6]|3[13-8]|[49][2-6]|5[2-8]|7)|47[3-578]|6(?:1|2[2-7]|4[6-8]?|5[125-8])|9(?:0[1-3]|[19]|2\\d|3[1-6]|4[0-24-68]|5[2-4]|6[2-6]|72?|8[23]?))|3(?:3(?:2[79]|8[2578])|4(?:0[124-9]|[12]|3[5-8]?|4[24-7]|5[4-68]?|6\\d|7[126]|8[237-9]|9[1-36-8])|5(?:1|2[1245]|3[2-4]?|4[1-46-9]|6[2-4]|7[1-6]|8[2-5]?)|7(?:1[15-8]|2[125]|3[1245]|4[13]|5[124-8]|7[2-57]|8[1-36])|8(?:1|2[125-7]|3[23578]|4[13-6]|5[4-8]?|6[1-357-9]|7[5-8]?|8[4-7]?|9[124])))15)?","9$1",,,[[,"([68]\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[68]"]
,"0$1",""]
,[,"9(11)(\\d{4})(\\d{4})","$1 15-$2-$3",["91"]
,"0$1",""]
,[,"9(\\d{3})(\\d{3})(\\d{4})","$1 15-$2-$3",["9(?:2[2369]|3[458])","9(?:2(?:2[013]|37|6[14]|9[179])|3(?:4[1235]|5[138]|8[1578]))"]
,"0$1",""]
,[,"9(\\d{4})(\\d{2})(\\d{4})","$1 15-$2-$3",["9(?:2[2-469]|3[3-578])","9(?:2(?:2[24-9]|3[0-69]|47|6[25]|9[02-68])|3(?:3[28]|4[046-9]|5[2467]|7[1-578]|8[23469]))"]
,"0$1",""]
,[,"(11)(\\d{4})(\\d{4})","$1 $2-$3",["1"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2-$3",["2(?:2[013]|37|6[14]|9[179])|3(?:4[1235]|5[138]|8[1578])"]
,"0$1",""]
,[,"(\\d{4})(\\d{2})(\\d{4})","$1 $2-$3",["[23]"]
,"0$1",""]
]
,[[,"([68]\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[68]"]
,,""]
,[,"9(11)(\\d{4})(\\d{4})","9 $1 $2-$3",["91"]
,,""]
,[,"9(\\d{3})(\\d{3})(\\d{4})","9 $1 $2-$3",["9(?:2[2369]|3[458])","9(?:2(?:2[013]|37|6[14]|9[179])|3(?:4[1235]|5[138]|8[1578]))"]
,,""]
,[,"9(\\d{4})(\\d{2})(\\d{4})","9 $1 $2-$3",["9(?:2[2-469]|3[3-578])","9(?:2(?:2[24-9]|3[0-69]|47|6[25]|9[02-68])|3(?:3[28]|4[046-9]|5[2467]|7[1-578]|8[23469]))"]
,,""]
,[,"(11)(\\d{4})(\\d{4})","$1 $2-$3",["1"]
,,""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2-$3",["2(?:2[013]|37|6[14]|9[179])|3(?:4[1235]|5[138]|8[1578])"]
,,""]
,[,"(\\d{4})(\\d{2})(\\d{4})","$1 $2-$3",["[23]"]
,,""]
]
,[,,"NA","NA"]
]
,"AS":[,[,,"[689]\\d{9}","\\d{7,10}"]
,[,,"6846(?:22|33|44|55|77|88|9[19])\\d{4}","\\d{7,10}",,,"6846221234"]
,[,,"684(?:733|258)\\d{4}","\\d{10}",,,"6847331234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"684"]
,"AT":[,[,,"\\d{4,13}","\\d{3,13}"]
,[,,"1\\d{3,12}|(?:2(?:1[467]|2[134-8]|5[2357]|6[1-46-8]|7[1-8]|8[124-7]|8[1458])|3(?:1[1-8]|3[23568]|4[5-7]|5[1378]|6[1-38]|8[3-68])|4(?:2[1-8]|35|63|7[1368]|8[2457])|5(?:1[27]|2[1-8]|3[357]|4[147]|5[12578]|6[37])|6(?:13|2[1-47]|4[1-35-8]|5[468]|62)|7(?:2[1-8]|3[25]|4[13478]|5[68]|6[16-8]|7[1-6]|9[45]))\\d{3,10}|5(?:0[1-9]|[79]\\d)\\d{2,10}|720\\d{6,10}","\\d{3,13}",,,"1234567890"]
,[,,"6(?:44|5[0-3579]|6[013-9]|[7-9]\\d)\\d{4,10}","\\d{7,13}",,,"644123456"]
,[,,"80[02]\\d{6,10}","\\d{9,13}",,,"800123456"]
,[,,"(?:711|9(?:0[01]|3[019]))\\d{6,10}","\\d{9,13}",,,"900123456"]
,[,,"8(?:10|2[018])\\d{6,10}","\\d{9,13}",,,"810123456"]
,[,,"NA","NA"]
,[,,"780\\d{6,10}","\\d{9,13}",,,"780123456"]
,"AT",43,"00","0",,,"0",,,,[[,"([15])(\\d{3,12})","$1 $2",["1|5[079]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3,10})","$1 $2",["316|46|51|732|6(?:44|5[0-3579]|[6-9])|7(?:1|[28]0)|[89]"]
,"0$1",""]
,[,"(\\d{4})(\\d{3,9})","$1 $2",["2|3(?:1[1-578]|[3-8])|4[2378]|5[2-6]|6(?:[12]|4[1-35-9]|5[468])|7(?:2[1-8]|35|4[1-8]|[57-9])"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"AU":[,[,,"[1-578]\\d{5,9}","\\d{6,10}"]
,[,,"[2378]\\d{8}","\\d{8,9}",,,"212345678"]
,[,,"4[0-68]\\d{7}","\\d{9}",,,"412345678"]
,[,,"1(?:80(?:0\\d{2})?|3(?:00\\d{2})?)\\d{4}","\\d{6,10}",,,"1800123456"]
,[,,"190[0126]\\d{6}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"500\\d{6}","\\d{9}",,,"500123456"]
,[,,"550\\d{6}","\\d{9}",,,"550123456"]
,"AU",61,"(?:14(?:1[14]|34|4[17]|[56]6|7[47]|88))?001[14-689]","0",,,"0",,"0011",,[[,"([2378])(\\d{4})(\\d{4})","$1 $2 $3",["[2378]"]
,"(0$1)",""]
,[,"(4\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["4"]
,"0$1",""]
,[,"(5[05]0)(\\d{3})(\\d{3})","$1 $2 $3",["5"]
,"0$1",""]
,[,"(1[389]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:[38]0|9)","1(?:[38]00|9)"]
,"$1",""]
,[,"(180)(\\d{4})","$1 $2",["180","180[1-9]"]
,"$1",""]
,[,"(13)(\\d{2})(\\d{2})","$1 $2 $3",["13[1-9]"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"AW":[,[,,"[5-9]\\d{6}","\\d{7}"]
,[,,"5(?:2\\d{2}|8(?:[2-7]\\d|8[0-79]|9[48]))\\d{3}","\\d{7}",,,"5212345"]
,[,,"(?:5[69]\\d|660|9(?:6\\d|9[02-9])|7[34]\\d)\\d{4}","\\d{7}",,,"5601234"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"900\\d{4}","\\d{7}",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AW",297,"00",,,,,,,,[[,"([5-9]\\d{2})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"AZ":[,[,,"[1-8]\\d{7,8}","\\d{8,9}"]
,[,,"(?:1(?:(?:[28]\\d|9)\\d|02|1[0-589]|3[358]|4[013-79]|5[0-479]|6[0236-9]|7[0-24-8])|2(?:16|2\\d|3[0-24]|4[1468]|55|6[56]|79)|365?\\d)\\d{5}","\\d{8,9}",,,"123123456"]
,[,,"(?:4[04]|5[015]|60|7[07])\\d{7}","\\d{9}",,,"401234567"]
,[,,"88\\d{7}","\\d{9}",,,"881234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"AZ",994,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["1[28]|22|[3-8]"]
,"",""]
,[,"([12]\\d{2})(\\d{5})","$1 $2",["1[013-79]|2[013-9]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"BA":[,[,,"[3-689]\\d{7}","\\d{6,8}"]
,[,,"(?:[35]\\d|49|81)\\d{6}","\\d{6,8}",,,"30123456"]
,[,,"6[1-356]\\d{6}","\\d{8}",,,"61123456"]
,[,,"8[08]\\d{6}","\\d{8}",,,"80123456"]
,[,,"9[0246]\\d{6}","\\d{8}",,,"90123456"]
,[,,"82\\d{6}","\\d{8}",,,"82123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BA",387,"00","0",,,"0",,,,[[,"([3-689]\\d)(\\d{3})(\\d{3})","$1 $2-$3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BB":[,[,,"[289]\\d{9}","\\d{7,10}"]
,[,,"246[2-9]\\d{6}","\\d{7,10}",,,"2462345678"]
,[,,"246(?:(?:2[346]|45|82)\\d|25[0-4])\\d{4}","\\d{10}",,,"2462501234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BB",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"246"]
,"BD":[,[,,"[2-79]\\d{5,9}|1\\d{9}|8[0-7]\\d{4,8}","\\d{6,10}"]
,[,,"2(?:7\\d1|8(?:[026]1|[1379][1-5]|8[1-8])|9(?:0[0-2]|1[1-4]|3[3-5]|5[56]|6[67]|71|8[078]))\\d{4}|3(?:[6-8]1|(?:0[23]|[25][12]|82|416)\\d|(?:31|12?[5-7])\\d{2})\\d{3}|4(?:(?:02|[49]6|[68]1)|(?:0[13]|21\\d?|[23]2|[457][12]|6[28])\\d|(?:23|[39]1)\\d{2}|1\\d{3})\\d{3}|5(?:(?:[457-9]1|62)|(?:1\\d?|2[12]|3[1-3]|52)\\d|61{2})|6(?:[45]1|(?:11|2[15]|[39]1)\\d|(?:[06-8]1|62)\\d{2})|7(?:(?:32|91)|(?:02|31|[67][12])\\d|[458]1\\d{2}|21\\d{3})\\d{3}|8(?:(?:4[12]|[5-7]2|1\\d?)|(?:0|3[12]|[5-7]1|217)\\d)\\d{4}|9(?:[35]1|(?:[024]2|81)\\d|(?:1|[24]1)\\d{2})\\d{3}","\\d{6,9}",,,"27111234"]
,[,,"(?:1[13-9]\\d|(?:3[78]|44)[02-9]|6(?:44|6[02-9]))\\d{7}","\\d{10}",,,"1812345678"]
,[,,"80[03]\\d{7}","\\d{10}",,,"8001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BD",880,"00[12]?","0",,,"0",,"00",,[[,"(2)(\\d{7})","$1 $2",["2"]
,"0$1",""]
,[,"(\\d{2})(\\d{4,6})","$1 $2",["[3-79]1"]
,"0$1",""]
,[,"(\\d{3})(\\d{3,7})","$1 $2",["[3-79][2-9]|8"]
,"0$1",""]
,[,"(\\d{4})(\\d{6})","$1 $2",["1"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BE":[,[,,"[1-9]\\d{7,8}","\\d{8,9}"]
,[,,"(?:1[0-69]|[23][2-8]|[49][23]|5\\d|6[013-57-9]|7[18])\\d{6}|8(?:0[1-9]|[1-79]\\d)\\d{5}","\\d{8}",,,"12345678"]
,[,,"4(?:7\\d|8[4-9]|9[1-9])\\d{6}","\\d{9}",,,"470123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"(?:90|7[07])\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BE",32,"00","0",,,"0",,,,[[,"(4[7-9]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["4[7-9]"]
,"0$1",""]
,[,"([2-49])(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[23]|[49][23]"]
,"0$1",""]
,[,"([15-8]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[156]|7[0178]|8(?:0[1-9]|[1-79])"]
,"0$1",""]
,[,"([89]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["(?:80|9)0"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BF":[,[,,"[2457]\\d{7}","\\d{8}"]
,[,,"(?:20(?:49|5[23]|9[016-9])|40(?:4[569]|55|7[0179])|50[34]\\d)\\d{4}","\\d{8}",,,"20491234"]
,[,,"7(?:[024-6]\\d|1[0-489]|3[01]|8[013-9]|9[012])\\d{5}","\\d{8}",,,"70123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BF",226,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"BG":[,[,,"[2-9]\\d{6,8}","\\d{7,9}"]
,[,,"(?:2\\d|[36]\\d|5[1-9]|8[1-6]|9[1-7])\\d{5,6}|(?:4(?:[124-7]\\d|3[1-6])|7(?:0[1-9]|[1-9]\\d))\\d{4,5}","\\d{7,8}",,,"2123456"]
,[,,"(?:8[7-9]|98)\\d{7}|4(?:3[0789]|8\\d)\\d{5}","\\d{8,9}",,,"48123456"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"700\\d{5}","\\d{7,9}",,,"70012345"]
,[,,"NA","NA"]
,"BG",359,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{3,4})","$1/$2 $3",["2"]
,"0$1",""]
,[,"(\\d{3})(\\d{4})","$1/$2",["43[124-7]|70[1-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{2})","$1/$2 $3",["43[124-7]|70[1-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3",["[78]00"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{2,3})","$1/$2 $3",["[356]|7[1-9]|8[1-6]|9[1-7]"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["48|8[7-9]|9[08]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BH":[,[,,"[1367]\\d{7}","\\d{8}"]
,[,,"(?:1(?:3[3-6]|6[0156]|7\\d)|6(?:1[16]|6[03469]|9[69])|77\\d)\\d{5}","\\d{8}",,,"17001234"]
,[,,"(?:3(?:[369]\\d|77|8[38])|6(?:1[16]|6[03469]|9[69])|77\\d)\\d{5}","\\d{8}",,,"36001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BH",973,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"BI":[,[,,"[27]\\d{7}","\\d{8}"]
,[,,"22(?:2[0-7]|[3-5]0)\\d{4}","\\d{8}",,,"22201234"]
,[,,"(?:29\\d|7(?:1[1-3]|[4-9]\\d))\\d{5}","\\d{8}",,,"79561234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BI",257,"00",,,,,,,,[[,"([27]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"BJ":[,[,,"[2689]\\d{7}|7\\d{3}","\\d{4,8}"]
,[,,"2(?:02|1[037]|2[45]|3[68])\\d{5}","\\d{8}",,,"20211234"]
,[,,"66\\d{6}|9(?:0[069]|[35][0-2457-9]|[6-8]\\d)\\d{5}","\\d{8}",,,"90011234"]
,[,,"7[3-5]\\d{2}","\\d{4}",,,"7312"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"857[58]\\d{4}","\\d{8}",,,"85751234"]
,"BJ",229,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"BL":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:2[7-9]|5[12]|87)\\d{4}","\\d{9}",,,"590271234"]
,[,,"690(?:10|2[27]|66|77|8[78])\\d{4}","\\d{9}",,,"690221234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BL",590,"00","0",,,"0",,,,,,[,,"NA","NA"]
]
,"BM":[,[,,"[489]\\d{9}","\\d{7,10}"]
,[,,"441(?:2(?:02|23|61|[3479]\\d)|[46]\\d{2}|5(?:4\\d|60|89)|824)\\d{4}","\\d{7,10}",,,"4412345678"]
,[,,"441(?:[37]\\d|5[0-39])\\d{5}","\\d{10}",,,"4413701234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"441"]
,"BN":[,[,,"[2-578]\\d{6}","\\d{7}"]
,[,,"[2-5]\\d{6}","\\d{7}",,,"2345678"]
,[,,"[78]\\d{6}","\\d{7}",,,"7123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BN",673,"00","0",,,"0",,,,[[,"([2-578]\\d{2})(\\d{4})","$1 $2",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BO":[,[,,"[23467]\\d{7}","\\d{7,8}"]
,[,,"(?:2(?:2\\d{2}|5(?:11|[258]\\d|9[67])|6(?:12|2\\d|9[34])|8(?:2[34]|39|62))|3(?:3\\d{2}|4(?:6\\d|8[24])|8(?:25|42|5[257]|86|9[25])|9(?:2\\d|3[234]|4[248]|5[24]|6[2-6]|7\\d))|4(?:4\\d{2}|6(?:11|[24689]\\d|72)))\\d{4}","\\d{7,8}",,,"22123456"]
,[,,"[67]\\d{7}","\\d{8}",,,"71234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BO",591,"00(1\\d)?","0",,,"0(1\\d)?",,,,[[,"([234])(\\d{7})","$1 $2",["[234]"]
,"",""]
,[,"([67]\\d{7})","$1",["[67]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"BR":[,[,,"[1-9]\\d{7,9}","\\d{8,10}"]
,[,,"(?:[14689][1-9]|2[12478]|3[1-578]|5[13-5]|7[13-579])[2-5]\\d{7}","\\d{8,10}",,,"1123456789"]
,[,,"(?:[14689][1-9]|2[12478]|3[1-578]|5[13-5]|7[13-579])[6-9]\\d{7}","\\d{10}",,,"1161234567"]
,[,,"800\\d{6,7}","\\d{8,10}",,,"800123456"]
,[,,"[359]00\\d{6,7}","\\d{8,10}",,,"300123456"]
,[,,"(?:400\\d|3003)\\d{4}","\\d{8,10}",,,"40041234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BR",55,"00(?:1[45]|2[135]|[34]1|43)","0",,,"0(?:(?:1[245]|2[135]|[34]1)(\\d{10}))?","$1",,,[[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2-$3",["[1-9][1-9]"]
,"($1)","0 $CC $1"]
,[,"([34]00\\d)(\\d{4})","$1-$2",["[34]00","400|3003"]
,"",""]
,[,"([3589]00)(\\d{2,3})(\\d{4})","$1 $2 $3",["[3589]00"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"BS":[,[,,"[289]\\d{9}","\\d{7,10}"]
,[,,"242(?:3(?:02|[236][1-9]|4[0-24-9]|5[0-68]|7[3467]|8[0-4]|9[2-467])|461|502|6(?:12|7[67]|8[78]|9[89])|702)\\d{4}","\\d{7,10}",,,"2423456789"]
,[,,"242(?:3(?:5[79]|[79]5)|4(?:[2-4][1-9]|5[1-8]|6[2-8]|7\\d|81)|5(?:2[34]|3[35]|44|5[1-9]|65|77)|6[34]6|727)\\d{4}","\\d{10}",,,"2423591234"]
,[,,"242300\\d{4}|8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"242"]
,"BT":[,[,,"(?:17|[2-8])\\d{6}","\\d{6,8}"]
,[,,"(?:2[3-6]|[34][5-7]|5[236]|6[2-46]|7[246]|8[2-4])\\d{5}","\\d{6,7}",,,"2345678"]
,[,,"17\\d{6}","\\d{8}",,,"17123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BT",975,"00",,,,,,,,[[,"(17)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1"]
,"",""]
,[,"([2-8])(\\d{3})(\\d{3})","$1 $2 $3",["[2-8]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"BW":[,[,,"[2-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:2(?:4[0-48]|6[0-24]|9[0578])|3(?:1[0235-9]|55|6\\d|7[01]|9[0-57])|4(?:6[03]|7[1267]|9[0-5])|5(?:3[0389]|4[0489]|7[1-47]|88|9[0-49])|6(?:2[1-35]|5[149]|8[067]))\\d{4}","\\d{7}",,,"2401234"]
,[,,"7(?:[1-3]\\d{6}|4[0-7]\\d{5})","\\d{8}",,,"71123456"]
,[,,"8\\d{6}","\\d{7}",,,"8123456"]
,[,,"90\\d{5}","\\d{7}",,,"9012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BW",267,"00",,,,,,,,[[,"(7[1-4])(\\d{3})(\\d{3})","$1 $2 $3",["7"]
,"",""]
,[,"(90)(\\d{5})","$1 $2",["9"]
,"",""]
]
,,[,,"NA","NA"]
]
,"BY":[,[,,"[12-4]\\d{8}|[89]\\d{9}","\\d{7,10}"]
,[,,"(?:1(?:5(?:1[1-5]|2\\d|6[1-4]|9[1-7])|6(?:[235]\\d|4[1-7])|7\\d{2})|2(?:1(?:[246]\\d|3[0-35-9]|5[1-9])|2(?:[235]\\d|4[0-8])|3(?:2\\d|3[02-79]|4[024-7]|5[0-7])))\\d{5}","\\d{7,9}",,,"152450911"]
,[,,"(?:2(?:5[679]|9[1-9])|33\\d|44\\d)\\d{6}","\\d{9}",,,"294911911"]
,[,,"80[13]\\d{7}","\\d{10}",,,"8011234567"]
,[,,"902\\d{7}","\\d{10}",,,"9021234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BY",375,"8~10","8",,,"80?",,,,[[,"([1-4]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[1-4]"]
,"8 0$1",""]
,[,"([89]\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[89]"]
,"8 $1",""]
]
,,[,,"NA","NA"]
]
,"BZ":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"BZ",501,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"CA":[,[,,"[2-9]\\d{9}|3\\d{6}","\\d{7,10}"]
,[,,"(?:2(?:04|26|50|89)|306|4(?:03|16|18|38|50|56)|5(?:00|06|14|19|81|87)|6(?:00|04|13|47)|7(?:00|05|09|10|78|80)|8(?:07|19|67))[2-9]\\d{6}|310\\d{4}","\\d{7,10}",,,"2042345678"]
,[,,"(?:2(?:04|26|50|89)|306|4(?:03|16|18|38|50|56)|5(?:00|06|14|19|81|87)|6(?:00|04|13|47)|7(?:00|05|09|10|78|80)|8(?:07|19|67)|9(?:02|05))[2-9]\\d{6}","\\d{7,10}",,,"2042345678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}|310\\d{4}","\\d{7,10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CA",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
]
,"CD":[,[,,"[89]\\d{8}|[1-6]\\d{6}","\\d{7,9}"]
,[,,"[1-6]\\d{6}","\\d{7}",,,"1234567"]
,[,,"(?:8[0149]|9[7-9])\\d{7}","\\d{9}",,,"991234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CD",243,"00","0",,,"0",,,,[[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[89]"]
,"0$1",""]
,[,"([1-6]\\d)(\\d{5})","$1 $2",["[1-6]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"CF":[,[,,"[278]\\d{7}","\\d{8}"]
,[,,"2[12]\\d{6}","\\d{8}",,,"21612345"]
,[,,"7[0257]\\d{6}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,[,,"8776\\d{4}","\\d{8}",,,"87761234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CF",236,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"CG":[,[,,"[24-68]\\d{6}","\\d{7}"]
,[,,"(?:2[1-589]|8\\d)\\d{5}","\\d{7}",,,"2123456"]
,[,,"[4-6]\\d{6}","\\d{7}",,,"5012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CG",242,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"CH":[,[,,"[2-9]\\d{8}","\\d{9}"]
,[,,"(?:2[12467]|3[1-4]|4[134]|5[12568]|6[12]|[7-9]1)\\d{7}","\\d{9}",,,"212345678"]
,[,,"7[46-9]\\d{7}","\\d{9}",,,"741234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"90[016]\\d{6}","\\d{9}",,,"900123456"]
,[,,"84[0248]\\d{6}","\\d{9}",,,"840123456"]
,[,,"878\\d{6}","\\d{9}",,,"878123456"]
,[,,"NA","NA"]
,"CH",41,"00","0",,,"0",,,,[[,"([2-9]\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[2-7]|[89]1"]
,"0$1",""]
,[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["8[047]|90"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"CI":[,[,,"[02-5]\\d{7}","\\d{8}"]
,[,,"(?:2(?:0[023]|1[02357]|[23][045]|4[03-5])|3(?:0[06]|1[069]|[2-4][07]|5[09]|6[08]))\\d{5}","\\d{8}",,,"21234567"]
,[,,"(?:0[1-9]|4[04-9]|50|6[067])\\d{6}","\\d{8}",,,"01234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CI",225,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"CK":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CK",682,"00","00",,,"00",,,1,,,[,,"NA","NA"]
]
,"CL":[,[,,"(?:[2-9]|600|123)\\d{7,8}","\\d{6,11}"]
,[,,"(?:2|32|41)\\d{7}|(?:3[3-5]|4[235]|5[1-3578]|6[13-57]|7[1-35])\\d{6,7}","\\d{6,9}",,,"21234567"]
,[,,"9[6-9]\\d{7}","\\d{8,9}",,,"961234567"]
,[,,"800\\d{6}|1230\\d{7}","\\d{9,11}",,,"800123456"]
,[,,"600\\d{7,8}","\\d{10,11}",,,"6001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"44\\d{7}","\\d{9}",,,"441234567"]
,"CL",56,"(?:0|1(?:1[0-69]|2[0-57]|5[13-58]|69|7[0167]|8[018]))0","0",,,"(?:0|1(?:1[0-69]|2[0-57]|5[13-58]|69|7[0167]|8[018]))",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1",""]
,[,"(\\d{2})(\\d{2,3})(\\d{4})","$1 $2 $3",["[357]|4[1-35]|6[13-57]"]
,"0$1",""]
,[,"(9)([6-9]\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"0$1",""]
,[,"(44)(\\d{3})(\\d{4})","$1 $2 $3",["44"]
,"0$1",""]
,[,"([68]00)(\\d{3})(\\d{3,4})","$1 $2 $3",["60|8"]
,"$1",""]
,[,"(600)(\\d{3})(\\d{2})(\\d{3})","$1 $2 $3 $4",["60"]
,"$1",""]
,[,"(1230)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"CM":[,[,,"[237-9]\\d{7}","\\d{8}"]
,[,,"(?:22|33)\\d{6}","\\d{8}",,,"22123456"]
,[,,"[79]\\d{7}","\\d{8}",,,"71234567"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"88\\d{6}","\\d{8}",,,"88012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CM",237,"00",,,,,,,,[[,"([237-9]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[2379]|88"]
,"",""]
,[,"(800)(\\d{2})(\\d{3})","$1 $2 $3",["80"]
,"",""]
]
,,[,,"NA","NA"]
]
,"CN":[,[,,"[1-79]\\d{7,11}|8[0-357-9]\\d{6,9}","\\d{4,12}"]
,[,,"21\\d{8,10}|(?:10|2[02-57-9]|3(?:11|7[159])|4[135]1|5(?:1\\d|2[37]|3[12]|7[13-79]|9[15])|7(?:31|5[457]|6[09])|898)\\d{8}|(?:3(?:1[02-9]|35|49|5\\d|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|[35][2-9]|6[4789]|7[0-46-9]|8[23])|5(?:3[03-9]|4[36]|5\\d|6[1-6]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]\\d|2[248]|3[04-9]|4[3-6]|6[2368])|8(?:1[236-8]|2[5-7]|[37]\\d|5[1-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]\\d|4[13]|5[1-5]))\\d{7}|80(?:29|6[03578]|7[018]|81)\\d{4}","\\d{4,12}",,,"1012345678"]
,[,,"1(?:3[0-9]|47|5[0135689]|8[05-9])\\d{8}","\\d{11}",,,"13123456789"]
,[,,"(?:10)?800\\d{7}","\\d{10,12}",,,"8001234567"]
,[,,"16[08]\\d{5}","\\d{8}",,,"16812345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"400\\d{7}","\\d{10}",,,"4001234567"]
,"CN",86,"00","0",,,"0",,,,[[,"(80\\d{2})(\\d{4})","$1 $2",["80[2678]"]
,"0$1",""]
,[,"([48]00)(\\d{3})(\\d{4})","$1 $2 $3",["[48]00"]
,"",""]
,[,"(\\d{3,4})(\\d{4})","$1 $2",["[2-9]"]
,"",""]
,[,"(21)(\\d{4})(\\d{4,6})","$1 $2 $3",["21"]
,"0$1",""]
,[,"([12]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["10[1-9]|2[02-9]","10[1-9]|2[02-9]","10(?:[1-79]|8(?:[1-9]|0[1-9]))|2[02-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["3(?:11|7[159])|4[135]1|5(?:1|2[37]|3[12]|7[13-79]|9[15])|7(?:31|5[457]|6[09])|898"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["3(?:1[02-9]|35|49|5|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|[35][2-9]|6[4789]|7[0-46-9]|8[23])|5(?:3[03-9]|4[36]|5|6[1-6]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[04-9]|4[3-6]|6[2368])|8(?:1[236-8]|2[5-7]|[37]|5[1-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])"]
,"0$1",""]
,[,"(1[3-58]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["1[3-58]"]
,"",""]
,[,"(10800)(\\d{3})(\\d{4})","$1 $2 $3",["108","1080","10800"]
,"",""]
]
,[[,"(21)(\\d{4})(\\d{4,6})","$1 $2 $3",["21"]
,,""]
,[,"([12]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["10[1-9]|2[02-9]","10[1-9]|2[02-9]","10(?:[1-79]|8(?:[1-9]|0[1-9]))|2[02-9]"]
,,""]
,[,"(80\\d{2})(\\d{4})","$1 $2",["80[2678]"]
,,""]
,[,"(\\d{3})(\\d{4})(\\d{4})","$1 $2 $3",["3(?:11|7[159])|4[135]1|5(?:1|2[37]|3[12]|7[13-79]|9[15])|7(?:31|5[457]|6[09])|898"]
,,""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["3(?:1[02-9]|35|49|5|7[02-68]|9[1-68])|4(?:1[02-9]|2[179]|[35][2-9]|6[4789]|7[0-46-9]|8[23])|5(?:3[03-9]|4[36]|5|6[1-6]|7[028]|80|9[2-46-9])|6(?:3[1-5]|6[0238]|9[12])|7(?:01|[1579]|2[248]|3[04-9]|4[3-6]|6[2368])|8(?:1[236-8]|2[5-7]|[37]|5[1-9]|8[3678]|9[1-7])|9(?:0[1-3689]|1[1-79]|[379]|4[13]|5[1-5])"]
,,""]
,[,"(1[3-58]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["1[3-58]"]
,,""]
,[,"([48]00)(\\d{3})(\\d{4})","$1 $2 $3",["[48]00"]
,,""]
,[,"(10800)(\\d{3})(\\d{4})","$1 $2 $3",["108","1080","10800"]
,,""]
]
,[,,"NA","NA"]
]
,"CO":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CO",57,"(?:00[579]|#555|#999)","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"CR":[,[,,"[28]\\d{7}","\\d{8}"]
,[,,"2[24-7]\\d{6}","\\d{8}",,,"22123456"]
,[,,"8[38]\\d{6}","\\d{8}",,,"83123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CR",506,"00",,,,,,,,[[,"([28]\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"CU":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CU",53,"119","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"CV":[,[,,"[259]\\d{6}","\\d{7}"]
,[,,"2(?:2[1-7]|3[0-8]|4[12]|5[1256]|6\\d|7[1-3]|8[1-5])\\d{4}","\\d{7}",,,"2211234"]
,[,,"(?:9\\d|59)\\d{5}","\\d{7}",,,"9911234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"CV",238,"0",,,,,,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"CY":[,[,,"[27-9]\\d{7}","\\d{8}"]
,[,,"2[2-6]\\d{6}","\\d{8}",,,"22345678"]
,[,,"7777\\d{4}|9(?:[69]\\d|7[67])\\d{5}","\\d{8}",,,"96123456"]
,[,,"8000\\d{4}","\\d{8}",,,"80001234"]
,[,,"9009\\d{4}","\\d{8}",,,"90091234"]
,[,,"NA","NA"]
,[,,"700\\d{5}","\\d{8}",,,"70012345"]
,[,,"NA","NA"]
,"CY",357,"00",,,,,,,,[[,"([27-9]\\d)(\\d{6})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"CZ":[,[,,"[2-9]\\d{8}","\\d{9}"]
,[,,"2\\d{8}|(?:3[1257-9]|4[16-9]|5[13-9])\\d{7}","\\d{9}",,,"212345678"]
,[,,"60[1-8]\\d{6}|7[2379]\\d{7}","\\d{9}",,,"601123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"90[0689]\\d{6}","\\d{9}",,,"900123456"]
,[,,"8[134]\\d{7}","\\d{9}",,,"811234567"]
,[,,"70[01]\\d{6}","\\d{9}",,,"700123456"]
,[,,"NA","NA"]
,"CZ",420,"00",,,,,,,,[[,"([2-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"DE":[,[,,"(?:4[0-8]|[1-35-9]\\d)\\d{4,12}|49(?:4[1-8]|[0-35-7]\\d)\\d{2,7}","\\d{2,14}"]
,[,,"(?:[246]\\d{2}|3[02-9]\\d|5(?:0[2-8]|[38][0-8]|[124-6]\\d|[79][0-7])|[789](?:[1-9]\\d|0[2-9]))\\d{3,10}","\\d{2,14}",,,"30123456"]
,[,,"1(?:5\\d{9}|7(?:[0-57-9]|6\\d)\\d{7}|6[02]\\d{7,8}|63\\d{7})","\\d{10,11}",,,"15123456789"]
,[,,"800\\d{7,9}","\\d{10,12}",,,"8001234567"]
,[,,"900(?:[135]\\d{6}|9\\d{7})","\\d{10,11}",,,"9001234567"]
,[,,"180\\d{5,11}","\\d{8,14}",,,"18012345"]
,[,,"700\\d{8}","\\d{11}",,,"70012345678"]
,[,,"NA","NA"]
,"DE",49,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{4,11})","$1/$2",["3[02]|40|[68]9"]
,"0$1",""]
,[,"(\\d{3})(\\d{3,10})","$1/$2",["2(?:\\d1|0[2389]|1[24]|28|34)|3(?:[3-9][15]|40)|[4-8][1-9]1|9(?:06|[1-9]1)"]
,"0$1",""]
,[,"(\\d{4})(\\d{2,8})","$1/$2",["[24-6]|[7-9](?:\\d[1-9]|[1-9]\\d)|3(?:[3569][02-46-9]|4[2-4679]|7[2-467]|8[2-46-8])","[24-6]|[7-9](?:\\d[1-9]|[1-9]\\d)|3(?:3(?:0[1-467]|2[127-9]|3[124578]|[46][1246]|7[1257-9]|8[1256]|9[145])|4(?:2[135]|3[1357]|4[13578]|6[1246]|7[1356]|9[1346])|5(?:0[14]|2[1-3589]|3[1357]|4[1246]|6[1-4]|7[1346]|8[13568]|9[1246])|6(?:0[356]|2[1-489]|3[124-6]|4[1347]|6[13]|7[12579]|8[1-356]|9[135])|7(?:2[1-7]|3[1357]|4[145]|6[1-5]|7[1-4])|8(?:21|3[1468]|4[1347]|6[0135-9]|7[1467]|8[136])|9(?:0[12479]|2[1358]|3[1357]|4[134679]|6[1-9]|7[136]|8[147]|9[1468]))"]
,"0$1",""]
,[,"(\\d{5})(\\d{1,6})","$1/$2",["3"]
,"0$1",""]
,[,"([18]\\d{2})(\\d{7,9})","$1 $2",["1[5-7]|800"]
,"0$1",""]
,[,"(\\d{3})(\\d)(\\d{4,10})","$1 $2 $3",["(?:18|90)0","180|900[1359]"]
,"0$1",""]
,[,"(700)(\\d{4})(\\d{4})","$1 $2 $3",["700"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"DJ":[,[,,"[2-8]\\d{5}","\\d{6}"]
,[,,"(?:25|3[0-6]|42)\\d{4}","\\d{6}",,,"251234"]
,[,,"(?:[5-7]\\d|8[0-7])\\d{4}","\\d{6}",,,"601234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DJ",253,"00",,,,,,,,[[,"([2-8]\\d)(\\d{2})(\\d{2})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"DK":[,[,,"[1-9]\\d{7}","\\d{8}"]
,[,,"(?:3[2-9]|4[3-9]|5[4-9]|6[2-9]|7[02-9]|8[26-9]|9[6-9])\\d{6}","\\d{8}",,,"32123456"]
,[,,"(?:2[0-9]|3[0-2]|4[0-2]|5[0-3]|6[01]|72|99)\\d{6}","\\d{8}",,,"20123456"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DK",45,"00",,,,,,,,[[,"([1-9]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"DM":[,[,,"[7-9]\\d{9}","\\d{7,10}"]
,[,,"767(?:2(?:55|66)|4(?:2[01]|4[0-25-9])|50[0-4])\\d{4}","\\d{7,10}",,,"7674201234"]
,[,,"767(?:2(?:[2346]5|7[5-7])|31[5-7]|61[4-6])\\d{4}","\\d{10}",,,"7672251234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"767"]
,"DO":[,[,,"[89]\\d{9}","\\d{7,10}"]
,[,,"8[024]9[2-9]\\d{6}","\\d{7,10}",,,"8092345678"]
,[,,"8[024]9[2-9]\\d{6}","\\d{7,10}",,,"8092345678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"DO",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"8[024]9"]
,"DZ":[,[,,"(?:[1-4]|[5-9]\\d)\\d{7}","\\d{8,9}"]
,[,,"(?:1\\d|2[014-79]|3[0-8]|4[0135689])\\d{6}|9619\\d{5}","\\d{8,9}",,,"12345678"]
,[,,"(?:5[56]|6[69]|7[79])\\d{7}","\\d{9}",,,"551234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"80[3-689]1\\d{5}","\\d{9}",,,"808123456"]
,[,,"80[12]1\\d{5}","\\d{9}",,,"801123456"]
,[,,"NA","NA"]
,[,,"98[23]\\d{6}","\\d{9}",,,"983123456"]
,"DZ",213,"00","0",,,"0",,,,[[,"([1-4]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[1-4]"]
,"0$1",""]
,[,"([5-8]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[5-8]"]
,"0$1",""]
,[,"(9\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"EC":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"EC",593,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"EE":[,[,,"[3-9]\\d{6,7}|800\\d{6,7}","\\d{6,10}"]
,[,,"(?:3[23589]|4[3-8]|6\\d|7[1-9]|88)\\d{5}","\\d{7}",,,"3212345"]
,[,,"(?:5\\d|8[1-5])\\d{6}|5(?:[02]\\d{2}|1(?:[0-8]\\d|95)|5[0-478]\\d|64[0-4]|65[1-589])\\d{3}","\\d{7,8}",,,"51234567"]
,[,,"800(?:0\\d{3}|1\\d|[2-9])\\d{3}","\\d{7,10}",,,"80012345"]
,[,,"900\\d{4}","\\d{7}",,,"9001234"]
,[,,"NA","NA"]
,[,,"70\\d{5}","\\d{7}",,,"7012345"]
,[,,"NA","NA"]
,"EE",372,"00",,,,,,,,[[,"([34-79]\\d{2})(\\d{4})","$1 $2",["[34679]|5(?:[0-2]|5[0-478]|6[45])","[34679]|5(?:[02]|1(?:[0-8]|95)|5[0-478]|6(?:4[0-4]|5[1-589]))"]
,"",""]
,[,"(8000)(\\d{3})(\\d{3})","$1 $2 $3",["800","8000"]
,"",""]
,[,"([58]\\d{3})(\\d{3,4})","$1 $2",["5|8(?:00|[1-5])","5|8(?:00[1-9]|[1-5])"]
,"",""]
]
,,[,,"NA","NA"]
]
,"EG":[,[,,"1\\d{4,9}|[2-689]\\d{7,9}","\\d{5,10}"]
,[,,"(?:1[35][23]|2[23]\\d|3\\d|4(?:0[2-4]|[578][23]|64)|5(?:0[234]|[57][23])|6[24-689]3|8(?:[28][2-4]|42|6[23])|9(?:[25]2|3[24]|6[23]|7[2-4]))\\d{6}|1[69]\\d{3}","\\d{5,9}",,,"234567890"]
,[,,"1[0-246-9]\\d{7}","\\d{9}",,,"101234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"EG",20,"00","0",,,"0",,,,[[,"(\\d)(\\d{7,8})","$1 $2",["[23]"]
,"0$1",""]
,[,"(\\d{2})(\\d{7})","$1 $2",["[14-6]|[89][2-9]"]
,"0$1",""]
,[,"([89]00)(\\d{3})(\\d{4})","$1 $2 $3",["[89]00"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ER":[,[,,"[178]\\d{6}","\\d{6,7}"]
,[,,"1(?:1[12568]|20|40|55|6[146])\\d{4}|8\\d{6}","\\d{6,7}",,,"8370362"]
,[,,"17[1-3]\\d{4}|7\\d{6}","\\d{7}",,,"7123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ER",291,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ES":[,[,,"[5-9]\\d{8}","\\d{9}"]
,[,,"[89][1-8]\\d{7}","\\d{9}",,,"812345678"]
,[,,"6\\d{8}","\\d{9}",,,"612345678"]
,[,,"[89]00\\d{6}","\\d{9}",,,"800123456"]
,[,,"80[367]\\d{6}","\\d{9}",,,"803123456"]
,[,,"90[12]\\d{6}","\\d{9}",,,"901123456"]
,[,,"(?:51|70)\\d{7}","\\d{9}",,,"701234567"]
,[,,"NA","NA"]
,"ES",34,"00",,,,,,,,[[,"([5-9]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"ET":[,[,,"[1-59]\\d{8}","\\d{7,9}"]
,[,,"(?:11(?:1(?:1[124]|2[2-57]|3[1-5]|5[5-8]|8[6-8])|2(?:13|3[6-8]|5[89]|7[05-9]|8[2-6])|3(?:2[01]|3[0-289]|4[1289]|7[1-4]|87)|4(?:1[69]|3[2-49]|4[0-23]|6[5-8])|5(?:1[57]|44|5[0-4])|6(?:18|2[69]|4[5-7]|5[1-5]|6[0-59]|8[015-8]))|2(?:2(?:11[1-9]|22[0-7]|33\\d|44[1467]|66[1-68])|5(?:11[124-6]|33[2-8]|44[1467]|55[14]|66[1-3679]|77[124-79]|880))|3(?:3(?:11[0-46-8]|22[0-6]|33[0134689]|44[04]|55[0-6]|66[01467])|4(?:44[0-8]|55[0-69]|66[0-3]|77[1-5]))|4(?:6(?:22[0-24-7]|33[1-5]|44[13-69]|55[14-689]|660|88[1-4])|7(?:11[1-9]|22[1-9]|33[13-7]|44[13-6]|55[1-689]))|5(?:7(?:227|55[05]|(?:66|77)[14-8])|8(?:11[149]|22[013-79]|33[0-68]|44[013-8]|550|66[1-5]|77\\d)))\\d{4}","\\d{7,9}",,,"111112345"]
,[,,"91(?:1(?:[146]\\d|2[0-5]|3[4-6]|50|7[2-6]|8[46-9])|31\\d|4(?:3[0-2489]|7[0-3])|5(?:3[23]|7[3-5])|6(?:58|8[23])|7(?:5[57]|8[01])|8(?:3[45]|7[67]))\\d{4}","\\d{9}",,,"911123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ET",251,"00","0",,,"0",,,,[[,"([1-59]\\d)(\\d{3})(\\d{4})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"FI":[,[,,"[1-9]\\d{4,11}","\\d{5,12}"]
,[,,"1(?:0[1-9]\\d{3,7}|[35689][1-8]\\d{3,9}|[47]\\d{5,10})|2(?:0(?:[16-8]\\d{3,7}|2[14-9]\\d{1,6}|[3-5]\\d{2,7}|9[0-7]\\d{1,6})|[1-8]\\d{3,9}|9\\d{4,8})|3(?:0[1-9]\\d{3,7}|[1-8]\\d{3,9}|9\\d{4,8})|[5689][1-8]\\d{3,9}|7(?:1\\d{7}|3\\d{8}|5[03-9]\\d{2,7})","\\d{5,12}",,,"1312345678"]
,[,,"4\\d{5,10}|50\\d{4,8}","\\d{6,11}",,,"412345678"]
,[,,"800\\d{4,7}","\\d{7,10}",,,"8001234567"]
,[,,"[67]00\\d{5,6}","\\d{8,9}",,,"600123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FI",358,"00|99[049]","0",,,"0",,,,[[,"(\\d{2})(\\d{4,10})","$1 $2",["2[09]|[14]|50|7[135]"]
,"0$1",""]
,[,"(\\d)(\\d{4,11})","$1 $2",["[25689][1-8]|3"]
,"0$1",""]
,[,"([6-8]00)(\\d{4,7})","$1 $2",["[6-8]0"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"FJ":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FJ",679,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"FK":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FK",500,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"FM":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FM",691,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"FO":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"FO",298,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"FR":[,[,,"[1-9]\\d{8}","\\d{9}"]
,[,,"[1-5]\\d{8}","\\d{9}",,,"123456789"]
,[,,"6\\d{8}|7[5-9]\\d{7}","\\d{9}",,,"612345678"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89[1-37-9]\\d{6}","\\d{9}",,,"891123456"]
,[,,"8(?:1[019]|2[0156]|84|90)\\d{6}","\\d{9}",,,"810123456"]
,[,,"NA","NA"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,"FR",33,"[04579]0","0",,,"0",,"00",,[[,"([1-79])(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["[1-79]"]
,"0$1",""]
,[,"(8\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["8"]
,"0 $1",""]
]
,,[,,"NA","NA"]
]
,"GA":[,[,,"[4-9]\\d{5}|0\\d{7}","\\d{6,8}"]
,[,,"(?:4(?:[04-8]\\d|2[04])|(?:5[04-689]|6[024-9]|7\\d|8[236]|9[02368])\\d)\\d{3}","\\d{6}",,,"441234"]
,[,,"0(?:5(?:0[89]|3[0-4]|8[0-26]|9[238])|6(?:0[3-7]|1[01]|2[0-7]|6[0-589]|71|83|9[57])|7(?:1[2-5]|2[89]|3[35-9]|4[01]|5[0-347-9]|[67]\\d|8[457-9]|9[0146]))\\d{4}","\\d{8}",,,"06031234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GA",241,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",["[4-9]"]
,"",""]
,[,"(0\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["0"]
,"",""]
]
,,[,,"NA","NA"]
]
,"GB":[,[,,"\\d{7,10}","\\d{4,10}"]
,[,,"1(?:1[3-8]|[2-69]1)\\d{7}|1(?:2(?:0[024-9]|2[3-9]|3[3-79]|4[1-689]|[58][02-9]|6[0-4789]|7[013-9]|9\\d)|3(?:0\\d|[25][02-9]|3[02-579]|[468][0-46-9]|7[1235679]|9[24578])|4(?:0[03-9]|2[02-5789]|[37]\\d|4[02-69]|5[0-8]|[69][0-79]|8[02-5789])|5(?:0[1235-9]|2[024-9]|3[015689]|4[02-9]|5[03-9]|6\\d|7[0-35-9]|8[0-468]|9[0-5789])|6(?:0[034689]|2[0-35689]|3[013-9]|4[1-467]|5[0-69]|6[13-9]|7[0-8]|8[013-9]|9[0124578])|7(?:0[0246-9]|2\\d|3[023678]|4[03-9]|5[0-46-9]|6[013-9]|7[0-35-9]|8[024-9]|9[02-9])|8(?:0[35-9]|2[1-5789]|3[02-578]|4[0-578]|5[124-9]|6[2-69]|7\\d|8[02-9]|9[02569])|9(?:0[02-589]|2[02-689]|3[1-5789]|4[2-9]|5[0-579]|6[234789]|7[0124578]|8\\d|9[2-57]))\\d{6}|1(?:2(?:0(?:46[1-4]|87[2-9])|545[1-79]|76(?:2\\d|3[1-8]|6[1-6])|9(?:7(?:2[0-4]|3[2-5])|8(?:2[2-8]|7[0-4789]|8[345])))|3(?:638[2-5]|647[23]|8(?:47[04-9]|64[015789]))|4(?:044[1-7]|20(?:2[23]|8\\d)|6(?:0(?:30|5[2-57]|6[1-8]|7[2-8])|140)|8(?:052|87[123]))|5(?:24(?:3[2-79]|6\\d)|276\\d|6(?:26[06-9]|686))|6(?:06(?:4\\d|7[4-79])|295[567]|35[34]\\d|47(?:24|61)|59(?:5[08]|6[67]|74)|955[0-4])|7(?:26(?:6[13-9]|7[0-7])|442\\d|50(?:2[0-3]|[3-68]2|76))|8(?:27[56]\\d|37(?:5[2-5]|8[239])|84(?:3[2-58]))|9(?:0(?:0(?:6[1-8]|85)|52\\d)|3583|4(?:66[1-8]|9(?:2[01]|81))|63(?:23|3[1-4])|9561))\\d{3}|176888[234678]\\d{2}|16977[23]\\d{3}|2(?:0[01378]|3[0189]|4[017]|8[0-46-9]|9[012])\\d{7}|(?:3[0347]|55)\\d{8}","\\d{4,10}",,,"1212345678"]
,[,,"7(?:[1-4]\\d\\d|5(?:0[0-8]|[13-9]\\d|2[0-35-9])|7(?:0[1-9]|[1-7]\\d|8[02-9]|9[0-689])|8(?:[014-9]\\d|[23][0-8])|9(?:[04-9]\\d|1[02-9]|2[0135-9]|3[0-689]))\\d{6}","\\d{10}",,,"7400123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[0-3]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"GB",44,"00","0"," x",,"0",,,,[[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["2|5[56]|7[06]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1(?:1|\\d1)|3|9[018]"]
,"0$1",""]
,[,"(\\d{5})(\\d{4,5})","$1 $2",["1(?:38|5[23]|69|76|94)","1(?:387|5(?:24|39)|697|768|946)","1(?:3873|5(?:242|39[456])|697[347]|768[347]|9467)"]
,"0$1",""]
,[,"(1\\d{3})(\\d{5,6})","$1 $2",["1"]
,"0$1",""]
,[,"(7\\d{3})(\\d{6})","$1 $2",["7[1-5789]"]
,"0$1",""]
,[,"(800)(\\d{4})","$1 $2",["800","8001","80011","800111","8001111"]
,"0$1",""]
,[,"(845)(46)(4\\d)","$1 $2 $3",["845","8454","84546","845464"]
,"0$1",""]
,[,"(8\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["8(?:4[2-5]|7[0-3])"]
,"0$1",""]
,[,"(80\\d)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"0$1",""]
,[,"([58]00)(\\d{6})","$1 $2",["[58]00"]
,"0$1",""]
]
,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
,1]
,"GD":[,[,,"[489]\\d{9}","\\d{7,10}"]
,[,,"473(?:2(?:3[0-2]|69)|3(?:2[89]|86)|4(?:08|3[5-9]|4[0-49]|5[5-79]|68|73|90)|63[68]|7(?:58|84)|938)\\d{4}","\\d{7,10}",,,"4732691234"]
,[,,"473(?:4(?:0[3-79]|1[04-9]|20|58)|53[3-8])\\d{4}","\\d{10}",,,"4734031234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GD",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"473"]
,"GE":[,[,,"[1-3579]\\d{7}|8\\d{8}","\\d{3,9}"]
,[,,"(?:122|2(?:22|36|5[03])|3(?:1[0-35-8]|[24-6]\\d|3[1-35679]|7[0-39]|9[1-35-7])|44[2-6])\\d{5}","\\d{3,8}",,,"32123456"]
,[,,"(?:5[1578]|6[28]|7[0147-9]|9[0135-9])\\d{6}","\\d{8}",,,"55123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GE",995,"8~10","8",,,"8",,,,[[,"(32)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["32"]
,"8 $1",""]
,[,"(\\d{3})(\\d{5})","$1 $2",["2|3[13-79]|446"]
,"8 $1",""]
,[,"(\\d{4})(\\d{3,4})","$1 $2",["44[2-5]"]
,"8 $1",""]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[5679]"]
,"8 $1",""]
,[,"(800)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["8"]
,"8 $1",""]
]
,,[,,"NA","NA"]
]
,"GF":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GF",594,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"GG":[,[,,"[15789]\\d{6,9}","\\d{6,10}"]
,[,,"1481\\d{6}","\\d{6,10}",,,"1481456789"]
,[,,"7(?:781|839|911)\\d{6}","\\d{10}",,,"7781123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[0-3]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"GG",44,"00","0"," x",,"0",,,,,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
]
,"GH":[,[,,"[235]\\d{6,8}","\\d{7,9}"]
,[,,"3(?:0[237]\\d|[167](?:2[0-6]|7\\d)|2(?:2[0-5]|7\\d)|3(?:2[0-37]|7\\d)|4(?:[27]\\d|30)|5(?:2[0-7]|7\\d)|8(?:2[0-2]|7\\d)|9(?:20|7\\d))\\d{5}","\\d{7,9}",,,"302345678"]
,[,,"2(?:(?:[47]\\d|08)\\d{6}|[368]\\d{7})|54\\d{7}","\\d{9}",,,"231234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GH",233,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"GI":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GI",350,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"GL":[,[,,"[1-689]\\d{5}","\\d{6}"]
,[,,"(?:19|3[1-6]|6[14689]|8[14-79]|9\\d)\\d{4}","\\d{6}",,,"321000"]
,[,,"[245][2-9]\\d{4}","\\d{6}",,,"221234"]
,[,,"80\\d{4}","\\d{6}",,,"801234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"3[89]\\d{4}","\\d{6}",,,"381234"]
,"GL",299,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"GM":[,[,,"[3-9]\\d{6}","\\d{7}"]
,[,,"(?:4(?:[23]\\d{2}|4(?:1[024679]|[6-9]\\d))|5(?:54[0-7]|6(?:[67]\\d)|7(?:1[04]|2[035]|3[58]|48))|8\\d{3})\\d{3}","\\d{7}",,,"5661234"]
,[,,"[3679]\\d{6}","\\d{7}",,,"3012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GM",220,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"GN":[,[,,"[3567]\\d{7}","\\d{8}"]
,[,,"30(?:24|3[12]|4[1-35-7]|5[13]|6[189]|[78]1|9[1478])\\d{4}","\\d{8}",,,"30241234"]
,[,,"55\\d{6}|6(?:0(?:2\\d|3[3467]|5[2457-9])|[2457]\\d{2}|3(?:[14]0|35))\\d{4}","\\d{8}",,,"60201234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GN",224,"00",,,,,,,,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"GP":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:1[12]|2[0-68]|3[28]|4[126-8]|5[067]|6[018]|[89]\\d)\\d{4}","\\d{9}",,,"590201234"]
,[,,"690(?:00|[3-5]\\d|6[0-57-9]|7[1-6]|8[0-6]|9[09])\\d{4}","\\d{9}",,,"690301234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GP",590,"00","0",,,"0",,,,[[,"([56]90)(\\d{2})(\\d{4})","$1 $2-$3",,"0$1",""]
]
,,[,,"NA","NA"]
,1]
,"GQ":[,[,,"[23589]\\d{8}","\\d{6,9}"]
,[,,"3(?:3(?:3\\d[7-9]|[0-24-9]\\d[46])|5\\d{2}[7-9])\\d{4}","\\d{6,9}",,,"333091234"]
,[,,"(?:222|551)\\d{6}","\\d{6,9}",,,"222123456"]
,[,,"80\\d[1-9]\\d{5}","\\d{6,9}",,,"800123456"]
,[,,"90\\d[1-9]\\d{5}","\\d{6,9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GQ",240,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[235]"]
,"",""]
,[,"(\\d{3})(\\d{6})","$1 $2",["[89]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"GR":[,[,,"[26-9]\\d{9}","\\d{10}"]
,[,,"2(?:1\\d{2}|2(?:3[1-8]|4[1-7]|5[1-4]|6[1-8]|7[1-5]|[289][1-9])|3(?:1\\d|2[1-5]|3[1-4]|[45][1-3]|7[1-7]|8[1-6]|9[1-79])|4(?:1\\d|2[1-8]|3[1-4]|4[13-5]|6[1-578]|9[1-5])|5(?:1\\d|2[1-3]|4[124]|5[1-6]|[39][1-4])|6(?:1\\d|3[24]|4[1-7]|5[13-9]|[269][1-6]|7[14]|8[1-35])|7(?:1\\d|[23][1-5]|4[1-7]|5[1-57]|6[134]|9[15-7])|8(?:1\\d|2[1-5]|[34][1-4]|9[1-7]))\\d{6}","\\d{10}",,,"2123456789"]
,[,,"69\\d{8}","\\d{10}",,,"6912345678"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"90[19]\\d{7}","\\d{10}",,,"9091234567"]
,[,,"8(?:0[16]|12|25)\\d{7}","\\d{10}",,,"8011234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"NA","NA"]
,"GR",30,"00",,,,,,,,[[,"([27]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["21|7"]
,"",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["2[2-9]1|[689]"]
,"",""]
,[,"(2\\d{3})(\\d{6})","$1 $2",["2[2-9][02-9]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"GT":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GT",502,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"GU":[,[,,"[689]\\d{9}","\\d{7,10}"]
,[,,"671(?:3\\d{2}|47\\d|56\\d|6[3-5]\\d|7(?:3\\d|89)|828)\\d{4}","\\d{7,10}",,,"6713123456"]
,[,,"671(?:3\\d{2}|47\\d|56\\d|6[3-5]\\d|7(?:3\\d|89)|828)\\d{4}","\\d{7,10}",,,"6713123456"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GU",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"671"]
,"GW":[,[,,"[3567]\\d{6}","\\d{7}"]
,[,,"3(?:2[0125]|3[1245]|4[12]|5[1-4]|70|9[1-467])\\d{4}","\\d{7}",,,"3201234"]
,[,,"[5-7]\\d{6}","\\d{7}",,,"5012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GW",245,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"GY":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"GY",592,"001","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"HK":[,[,,"[235-7]\\d{7}|8\\d{7,8}|9\\d{7,10}","\\d{8,11}"]
,[,,"[23]\\d{7}","\\d{8}",,,"21234567"]
,[,,"[5-79]\\d{7}","\\d{8}",,,"51234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{8}","\\d{11}",,,"90012345678"]
,[,,"NA","NA"]
,[,,"8[1-3]\\d{6}","\\d{8}"]
,[,,"NA","NA"]
,"HK",852,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",["[235-7]|[89](?:0[1-9]|[1-9])"]
,"",""]
,[,"(800)(\\d{3})(\\d{3})","$1 $2 $3",["800"]
,"",""]
,[,"(900)(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3 $4",["900"]
,"",""]
]
,,[,,"NA","NA"]
]
,"HN":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"HN",504,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"HR":[,[,,"[1-7]\\d{5,8}|[89]\\d{6,11}","\\d{6,12}"]
,[,,"(?:1|6[029])\\d{7}|(?:2[0-3]|3[1-5]|4[02-47-9]|5[1-3])\\d{6}","\\d{6,9}",,,"12345678"]
,[,,"9[12589]\\d{6,10}","\\d{8,12}",,,"912345678"]
,[,,"80[01]\\d{4,7}","\\d{7,10}",,,"8001234567"]
,[,,"6[145]\\d{4,7}","\\d{6,9}",,,"611234"]
,[,,"NA","NA"]
,[,,"7[45]\\d{4,7}","\\d{6,9}",,,"741234567"]
,[,,"NA","NA"]
,"HR",385,"00","0",,,"0",,,,[[,"(1)(\\d{4})(\\d{3})","$1 $2 $3",["1"]
,"0$1",""]
,[,"(6[029])(\\d{4})(\\d{3})","$1 $2 $3",["6[029]"]
,"0$1",""]
,[,"([2-5]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[2-5]"]
,"0$1",""]
,[,"(9[12589])(\\d{3,4})(\\d{3,4})","$1 $2 $3",["9"]
,"0$1",""]
,[,"(9[12589])(\\d{3,4})(\\d{3})(\\d{3})","$1 $2 $3 $4",["9"]
,"0$1",""]
,[,"(\\d{2})(\\d{2})(\\d{2,3})","$1 $2 $3",["6[145]|7"]
,"0$1",""]
,[,"(\\d{2})(\\d{3,4})(\\d{3})","$1 $2 $3",["6[145]|7"]
,"0$1",""]
,[,"(80[01])(\\d{2})(\\d{2,3})","$1 $2 $3",["8"]
,"0$1",""]
,[,"(80[01])(\\d{3,4})(\\d{3})","$1 $2 $3",["8"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"HT":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"HT",509,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"HU":[,[,,"\\d{8,9}","\\d{6,9}"]
,[,,"(?:1\\d|2(?:1\\d|[2-9])|3[2-7]|4[24-9]|5[2-79]|6[23689]|7(?:1\\d|[2-9])|8[2-57-9]|9[2-69])\\d{6}","\\d{6,9}",,,"12345678"]
,[,,"(?:[237]0|31)\\d{7}","\\d{9}",,,"201234567"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"9[01]\\d{6}","\\d{8}",,,"90123456"]
,[,,"40\\d{6}","\\d{8}",,,"40123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"HU",36,"00","06",,,"06",,,,[[,"(1)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"($1)",""]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[2-9]"]
,"($1)",""]
]
,,[,,"NA","NA"]
]
,"ID":[,[,,"[1-9]\\d{6,10}","\\d{5,11}"]
,[,,"2[124]\\d{7,8}|(?:2(?:[35][1-4]|6[0-8]|7[1-6]|8\\d|9[1-8])|3(?:1|2[1-578]|3[1-68]|4[1-3]|5[1-8]|6[1-3568]|7[0-46]|8\\d)|4(?:0[1-589]|1[01347-9]|2[0-36-8]|3[0-24-68]|5[1-378]|6[1-5]|7[134]|8[1245])|5(?:1[1-35-9]|2[25-8]|3[1246-9]|4[1-3589]|5[1-46]|6[1-8])|6(?:19?|[25]\\d|3[1-469]|4[1-6])|7(?:1[1-46-9]|2[14-9]|[36]\\d|4[1-8]|5[1-9]|7[0-36-9])|9(?:0[12]|1[0134-8]|2[0-479]|5[125-8]|6[23679]|7[159]|8[01346]))\\d{5,8}","\\d{5,10}",,,"612345678"]
,[,,"8[1-35-9]\\d{7,9}","\\d{9,11}",,,"812345678"]
,[,,"177\\d{6,8}|800\\d{5,7}","\\d{8,11}",,,"8001234567"]
,[,,"809\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ID",62,"0(?:0[1789]|10(?:00|1[67]))","0",,,"0",,,,[[,"(\\d{2})(\\d{7,8})","$1 $2",["2[124]|[36]1"]
,"(0$1)",""]
,[,"(\\d{3})(\\d{5,7})","$1 $2",["[4579]|2[035-9]|[36][02-9]"]
,"(0$1)",""]
,[,"(8\\d{2})(\\d{3,4})(\\d{3,4})","$1-$2-$3",["8[1-35-9]"]
,"0$1",""]
,[,"(177)(\\d{6,8})","$1 $2",["1"]
,"0$1",""]
,[,"(800)(\\d{5,7})","$1 $2",["800"]
,"0$1",""]
,[,"(809)(\\d)(\\d{3})(\\d{3})","$1 $2 $3 $4",["809"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"IE":[,[,,"[124-9]\\d{6,9}","\\d{5,10}"]
,[,,"1\\d{7,8}|(?:2[24-9]|4(?:0[24]|7)|5(?:0[45]|8)|6[237-9]|9[3-9])\\d{5}|(?:45|[569]1|818)\\d{6}|(?:4[12469]|5[3679]|6[56]|7[14]|9[04])\\d{7}|21\\d{6,7}|(?:23|4[34]|52|64)\\d{5,7}|48\\d{8}","\\d{5,10}",,,"2212345"]
,[,,"8[35-9]\\d{7}","\\d{9}",,,"850123456"]
,[,,"1800\\d{6}","\\d{10}",,,"1800123456"]
,[,,"15(?:1[2-9]|[2-8]0|59|9[089])\\d{6}","\\d{10}",,,"1520123456"]
,[,,"18[59]0\\d{6}","\\d{10}",,,"1850123456"]
,[,,"700\\d{6}","\\d{9}",,,"700123456"]
,[,,"76\\d{7}","\\d{9}",,,"761234567"]
,"IE",353,"00","0",,,"0",,,,[[,"(1)(\\d{3,4})(\\d{4})","$1 $2 $3",["1"]
,"(0$1)",""]
,[,"(\\d{2})(\\d{5})","$1 $2",["2[2-9]|4[347]|5[2-58]|6[2-47-9]|9[3-9]"]
,"(0$1)",""]
,[,"(\\d{3})(\\d{5})","$1 $2",["40[24]|50[45]"]
,"(0$1)",""]
,[,"(48)(\\d{4})(\\d{4})","$1 $2 $3",["48"]
,"(0$1)",""]
,[,"(818)(\\d{3})(\\d{3})","$1 $2 $3",["81"]
,"(0$1)",""]
,[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[24-69]|7[14]"]
,"(0$1)",""]
,[,"([78]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["76|8[35-9]"]
,"0$1",""]
,[,"(700)(\\d{3})(\\d{3})","$1 $2 $3",["70"]
,"0$1",""]
,[,"(\\d{4})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:8[059]|5)","1(?:8[059]0|5)"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"IL":[,[,,"[1-57-9]\\d{6,9}","\\d{7,10}"]
,[,,"(?:[2-489]|7[2-46-8])\\d{7}","\\d{7,9}",,,"21234567"]
,[,,"5[024679]\\d{7}","\\d{9}",,,"501234567"]
,[,,"1(?:80[01]\\d{3}|255)\\d{3}","\\d{7,10}",,,"1800123456"]
,[,,"1(?:212|(?:919|200)\\d{2})\\d{4}","\\d{8,10}",,,"1919123456"]
,[,,"1(?:700|809)\\d{6}","\\d{10}",,,"1700123456"]
,[,,"NA","NA"]
,[,,"77\\d{7}","\\d{9}",,,"771234567"]
,"IL",972,"0(?:0|1[2-48])","0",,,"0",,,,[[,"([2-489])(\\d{3})(\\d{4})","$1-$2-$3",["[2-489]"]
,"0$1",""]
,[,"([57]\\d)(\\d{3})(\\d{4})","$1-$2-$3",["[57]"]
,"0$1",""]
,[,"(1)([7-9]\\d{2})(\\d{3})(\\d{3})","$1-$2-$3-$4",["1[7-9]"]
,"$1",""]
,[,"(1255)(\\d{3})","$1-$2",["125"]
,"$1",""]
,[,"(1200)(\\d{3})(\\d{3})","$1-$2-$3",["120"]
,"$1",""]
,[,"(1212)(\\d{2})(\\d{2})","$1-$2-$3",["121"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"IM":[,[,,"[15789]\\d{6,9}","\\d{6,10}"]
,[,,"1624\\d{6}","\\d{6,10}",,,"1624456789"]
,[,,"7[569]24\\d{6}","\\d{10}",,,"7924123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[0-3]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"IM",44,"00","0"," x",,"0",,,,,,[,,"7624\\d{6}","\\d{10}",,,"7624123456"]
]
,"IN":[,[,,"[1-9]\\d{9,10}","\\d{6,11}"]
,[,,"(?:11|2[02]|33|4[04]|79|80)[2-6]\\d{7}|(?:1(?:2[0-249]|3[0-25]|4[145]|[59][14]|6[014]|7[1257]|8[01346])|2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568]|9[14])|3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])|4(?:1[36]|2[1-47]|3[15]|5[12]|6[126-9]|7[0-24-9]|8[013-57]|9[014-7])|5(?:[136][25]|22|4[28]|5[12]|[78]1|9[15])|6(?:12|[2345]1|57|6[13]|7[14]|80)|7(?:12|2[14]|3[134]|4[47]|5[15]|[67]1|88)|8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91))[2-6]\\d{6}|(?:(?:1(?:2[35-8]|3[346-9]|4[236-9]|[59][0235-9]|6[235-9]|7[34689]|8[257-9])|2(?:1[134689]|3[24-8]|4[2-8]|5[25689]|6[2-4679]|7[13-79]|8[2-479]|9[235-9])|3(?:01|1[79]|2[1-5]|4[25-8]|5[125689]|6[235-7]|7[157-9]|8[2-467])|4(?:1[14578]|2[5689]|3[2-467]|5[4-7]|6[35]|73|8[2689]|9[2389])|5(?:[16][146-9]|2[14-8]|3[1346]|4[14-69]|5[46]|7[2-4]|8[2-8]|9[246])|6(?:1[1358]|2[2457]|3[2-4]|4[235-7]|5[2-689]|6[24-58]|7[23-689]|8[1-6])|8(?:1[1357-9]|2[235-8]|3[03-57-9]|4[0-24-9]|5\\d|6[2457-9]|7[1-6]|8[1256]|9[2-4]))\\d|7(?:(?:1[013-9]|2[0235-9]|3[2679]|4[1-35689]|5[2-46-9]|[67][02-9]|9\\d)\\d|8(?:2[0-6]|[013-8]\\d)))[2-6]\\d{5}","\\d{6,10}",,,"1123456789"]
,[,,"(?:7(?:39[89]|5(?:50|6[6-8]|79|[89][7-9])|6(?:0[027]|20|3[19]|54|65|7[67]|9[6-9])|7(?:0[89]|3[589]|42|60|9[5-9])|8(?:[03][07-9]|14|2[7-9]|4[25]|6[09]))\\d|9\\d{4}|8(?:(?:0[01589]|1[024])\\d|8(?:[079]\\d|44)|9[057-9]\\d)\\d)\\d{5}","\\d{10}",,,"9123456789"]
,[,,"1(?:800\\d?|600)\\d{6}","\\d{10,11}",,,"1800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IN",91,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{2})(\\d{6})","$1 $2 $3",["7(?:39|5[5-9]|[67][02-9]|8[0-6])|8(?:0[01589]|1[024]|8[0479]|9[057-9])|9","7(?:39|5(?:50|[6-9])|[67][02-9]|8[0-6])|8(?:0[01589]|1[024]|8(?:[079]|44)|9[057-9])|9"]
,"0$1",""]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1 $2 $3",["11|2[02]|33|4[04]|79|80[2-6]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["1(?:2[0-249]|3[0-25]|4[145]|[569][14]|7[1257]|8[1346]|[68][1-9])"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["2(?:1[257]|3[013]|4[01]|5[0137]|6[0158]|78|8[1568]|9[14])"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["3(?:26|4[1-3]|5[34]|6[01489]|7[02-46]|8[159])"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["4(?:1[36]|2[1-47]|3[15]|5[12]|6[126-9]|7[0-24-9]|8[013-57]|9[014-7])"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["5(?:[136][25]|22|4[28]|5[12]|[78]1|9[15])"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["6(?:12|[2345]1|57|6[13]|7[14]|80)"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["7(?:12|2[14]|3[134]|4[47]|5[15]|[67]1|88)","7(?:12|2[14]|3[134]|4[47]|5(?:1|5[1-9])|[67]1|88)"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["8(?:16|2[014]|3[126]|6[136]|7[078]|8[34]|91)"]
,"0$1",""]
,[,"(\\d{4})(\\d{3})(\\d{3})","$1 $2 $3",["1(?:[2-579]|[68][1-9])|[2-8]"]
,"0$1",""]
,[,"(1600)(\\d{2})(\\d{4})","$1 $2 $3",["160","1600"]
,"$1",""]
,[,"(1800)(\\d{2,3})(\\d{4})","$1 $2 $3",["180","1800"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"IO":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IO",246,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"IQ":[,[,,"[1-7]\\d{7,9}","\\d{6,10}"]
,[,,"1\\d{7}|(?:2[13-5]|3[02367]|4[023]|5[03]|6[026])\\d{6,7}","\\d{6,9}",,,"12345678"]
,[,,"7[5-9]\\d{8}","\\d{10}",,,"7912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IQ",964,"00","0",,,"0",,,,[[,"(1)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"0$1",""]
,[,"([2-6]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[2-6]"]
,"0$1",""]
,[,"(7[5-9]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["7"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"IR":[,[,,"[1-9]\\d{9}","\\d{7,10}"]
,[,,"[1-8]\\d{9}","\\d{7,10}",,,"2123456789"]
,[,,"9(?:1\\d|3[1-8])\\d{7}","\\d{10}",,,"9123456789"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"IR",98,"00","0",,,"0",,,,[[,"(21)(\\d{4})(\\d{4})","$1 $2 $3",["21"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[13-89]|2[02-9]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"IS":[,[,,"[4-9]\\d{6}|38\\d{7}","\\d{7,9}"]
,[,,"(?:4(?:1[0-245]|2[0-7]|[37][0-8]|4[0245]|5[0-356]|6\\d|8[0-46-8]|9[013-79])|5(?:05|[156]\\d|2[02578]|3[013-6]|4[03-6]|7[0-2578]|8[0-25-9]|9[013-689])|87[23])\\d{4}","\\d{7}",,,"4101234"]
,[,,"38[59]\\d{6}|(?:6(?:1[014-8]|2[0-8]|3[0-27-9]|4[0-29]|5[029]|[67][0-69]|[89]\\d)|7(?:5[057]|7[0-7])|8(?:2[0-5]|[469]\\d|5[1-9]))\\d{4}","\\d{7,9}",,,"6101234"]
,[,,"800\\d{4}","\\d{7}",,,"8001234"]
,[,,"90\\d{5}","\\d{7}",,,"9011234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"49[013-79]\\d{4}","\\d{7}",,,"4931234"]
,"IS",354,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[4-9]"]
,"",""]
,[,"(3\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["3"]
,"",""]
]
,,[,,"NA","NA"]
]
,"IT":[,[,,"[01389]\\d{5,10}","\\d{6,11}"]
,[,,"0\\d{7,10}","\\d{8,11}",,,"0212345678"]
,[,,"3\\d{8,9}","\\d{9,10}",,,"312345678"]
,[,,"80(?:0\\d{6}|3\\d{3})","\\d{6,9}",,,"800123456"]
,[,,"89(?:2\\d{3}|9\\d{6})","\\d{6,9}",,,"899123456"]
,[,,"84[78]\\d{6,7}","\\d{9,10}",,,"8481234567"]
,[,,"178\\d{6,7}","\\d{9,10}",,,"1781234567"]
,[,,"NA","NA"]
,"IT",39,"00",,,,,,,,[[,"(0[26])(\\d{3,4})(\\d{4})","$1 $2 $3",["0[26]"]
,"",""]
,[,"(0[26])(\\d{4})(\\d{5})","$1 $2 $3",["0[26]"]
,"",""]
,[,"(0[26])(\\d{6})","$1 $2",["0[26]"]
,"",""]
,[,"(0\\d{2})(\\d{3,4})(\\d{4})","$1 $2 $3",["0(?:[13-57-9][0159]|36)"]
,"",""]
,[,"(0\\d{2})(\\d{5,6})","$1 $2",["0(?:[13-57-9][0159]|36)"]
,"",""]
,[,"(0\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["0[13-57-9]"]
,"",""]
,[,"(0\\d{3})(\\d{4,6})","$1 $2",["0[13-57-9]"]
,"",""]
,[,"(\\d{3})(\\d{3})(\\d{3,4})","$1 $2 $3",["[13]|8(?:00|4[78])"]
,"",""]
,[,"(\\d{3})(\\d{3,6})","$1 $2",["8(?:03|9)"]
,"",""]
]
,,[,,"NA","NA"]
]
,"JE":[,[,,"[15789]\\d{6,9}","\\d{6,10}"]
,[,,"1534\\d{6}","\\d{6,10}",,,"1534456789"]
,[,,"7(?:509|7(?:00|97)|829|937)\\d{6}","\\d{10}",,,"7797123456"]
,[,,"80(?:0(?:1111|\\d{6,7})|8\\d{7})|500\\d{6}","\\d{7}(?:\\d{2,3})?",,,"8001234567"]
,[,,"(?:87[123]|9(?:[01]\\d|8[0-3]))\\d{7}","\\d{10}",,,"9012345678"]
,[,,"8(?:4(?:5464\\d|[2-5]\\d{7})|70\\d{7})","\\d{7}(?:\\d{3})?",,,"8431234567"]
,[,,"701511\\d{4}","\\d{10}",,,"7015115678"]
,[,,"56\\d{8}","\\d{10}",,,"5612345678"]
,"JE",44,"00","0"," x",,"0",,,,,,[,,"76(?:0[012]|2[356]|4[0134]|5[49]|6[0-369]|77|81|9[39])\\d{6}","\\d{10}",,,"7640123456"]
]
,"JM":[,[,,"[89]\\d{9}","\\d{7,10}"]
,[,,"876(?:(?:5[0-26]|6\\d|7[1-6]|9[2-8])\\d{5}|(?:7(?:0[2-689]|8[056]|9[45])|9(?:0[1-8]|1[02378]|9[2-468]))\\d{4})","\\d{7,10}",,,"8765123456"]
,[,,"876(?:(?:21|[348]\\d|5[78]|77)\\d|7(?:0[07]|8[1-47-9]|9[0-36-9])|9(?:[01]9|9[0579]))\\d{4}","\\d{10}",,,"8762101234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"JM",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"876"]
,"JO":[,[,,"[235-9]\\d{7,8}","\\d{7,9}"]
,[,,"[2356][2-8]\\d{6}","\\d{7,8}",,,"62345678"]
,[,,"7(?:4[5-7]|55|7[5-79]|8[5-8]|9[05-9])\\d{6}","\\d{9}",,,"790123456"]
,[,,"80\\d{6}","\\d{8}",,,"80012345"]
,[,,"90\\d{6}","\\d{8}",,,"90012345"]
,[,,"(?:8[57]\\d|810)\\d{5}","\\d{8}",,,"85012345"]
,[,,"70\\d{7}","\\d{9}",,,"700123456"]
,[,,"NA","NA"]
,"JO",962,"00","0",,,"0",,,,[[,"([2356])(\\d{3})(\\d{4})","$1 $2 $3",["[2356]"]
,"(0$1)",""]
,[,"(7)(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4 $5",["7[457-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{5,6})","$1 $2",["70|[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"JP":[,[,,"\\d{9,10}","\\d{9,10}"]
,[,,"(?:1[1-9][1-9]|9(?:[3-9][1-9]|2\\d)|(?:[36][1-9]|[24578][2-9])\\d)\\d{6}","\\d{9}",,,"312345678"]
,[,,"[7-9]0\\d{8}","\\d{10}",,,"7012345678"]
,[,,"120\\d{6}","\\d{9}",,,"120123456"]
,[,,"990\\d{6}","\\d{9}",,,"990123456"]
,[,,"NA","NA"]
,[,,"60\\d{7}","\\d{9}",,,"601234567"]
,[,,"50\\d{8}","\\d{10}",,,"5012345678"]
,"JP",81,"010","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1-$2-$3",["(?:12|99)0"]
,"0$1",""]
,[,"(\\d{2})(\\d{4})(\\d{4})","$1-$2-$3",["[57-9]0"]
,"0$1",""]
,[,"(\\d{4})(\\d)(\\d{4})","$1-$2-$3",["1(?:26|3[79]|4[56]|5[4-68]|6[3-5])|5(?:76|97)|499|746|8(?:3[89]|63|47|51)|9(?:49|80|9[16])","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:76|97)9|499[2468]|7468|8(?:3(?:8[78]|96)|636|477|51[24])|9(?:496|802|9(?:1[23]|69))","1(?:267|3(?:7[247]|9[278])|4(?:5[67]|66)|5(?:47|58|64|8[67])|6(?:3[245]|48|5[4-68]))|5(?:769|979[2-69])|499[2468]|7468|8(?:3(?:8[78]|96[2457-9])|636[2-57-9]|477|51[24])|9(?:496|802|9(?:1[23]|69))"]
,"0$1",""]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["1(?:2[3-6]|3[3-9]|4[2-6]|5[2-8]|[68][2-7]|7[2-689]|9[1-578])|2(?:2[034-9]|3[3-58]|4[0-468]|5[04-8]|6[013-8]|7[06-9]|8[02-57-9]|9[13])|4(?:2[28]|3[689]|6[035-7]|7[05689]|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9[4-9])|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9[014-9])|8(?:2[49]|3[3-8]|4[5-8]|5[2-9]|6[35-9]|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[0245-79]|6[4-9]|7[2-47-9]|8[02-7]|9[3-7])","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-9]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9[2-8])|3(?:7[2-56]|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5[4-7]|6[2-9]|8[2-8]|9[236-9])|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[0245-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3[34]|[4-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-9]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6[56]))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[0245-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))","1(?:2[3-6]|3[3-9]|4[2-6]|5(?:[236-8]|[45][2-69])|[68][2-7]|7[2-689]|9[1-578])|2(?:2(?:[04-9]|3[23])|3[3-58]|4[0-468]|5(?:5[78]|7[2-4]|[0468][2-9])|6(?:[0135-8]|4[2-5])|7(?:[0679]|8[2-7])|8(?:[024578]|3[25-9]|9[6-9])|9(?:11|3[2-4]))|4(?:2(?:2[2-9]|8[237-9])|3[689]|6[035-7]|7(?:[059][2-8]|[68])|80|9[3-5])|5(?:3[1-36-9]|4[4578]|5[013-8]|6[1-9]|7[2-8]|8[14-7]|9(?:[89][2-8]|[4-7]))|7(?:2[15]|3[5-9]|4[02-9]|6[135-8]|7[0-4689]|9(?:[017-9]|4[6-8]|5[2-478]|6[2-589]))|8(?:2(?:4[4-8]|9(?:[3578]|20|4[04-9]|6(?:5[25]|60)))|3(?:7(?:[2-5]|6[0-59])|[3-6][2-9]|8[2-5])|4[5-8]|5[2-9]|6(?:[37]|5(?:[467]|5[014-9])|6(?:[2-8]|9[02-69])|8[2-8]|9(?:[236-8]|9[23]))|7[579]|8[03-579]|9[2-8])|9(?:[23]0|4[02-46-9]|5[0245-79]|6[4-9]|7[2-47-9]|8[02-7]|9(?:3(?:3[02-9]|4[0-24689])|4[2-69]|[5-7]))"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["1|2(?:23|5[5-89]|64|78|8[39]|91)|4(?:2[2689]|64|7[347])|5(?:[2-589]|39)|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93)","1|2(?:23|5(?:[57]|[68]0|9[19])|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93[34])","1|2(?:23|5(?:[57]|[68]0|9(?:17|99))|64|78|8[39]|917)|4(?:2(?:[68]|20|9[178])|64|7[347])|5(?:[2-589]|39[67])|8(?:[46-9]|3[279]|2[124589])|9(?:[235-8]|93(?:31|4))"]
,"0$1",""]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["2(?:9[14-79]|74|[34]7|[56]9)|82|993"]
,"0$1",""]
,[,"(\\d)(\\d{4})(\\d{4})","$1-$2-$3",["[36]|4(?:2[09]|7[01])"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["[2479]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"KE":[,[,,"\\d{6,10}","\\d{4,10}"]
,[,,"(?:20|4[0-6]|5\\d|6[0-24-9])\\d{4,7}","\\d{4,9}",,,"202012345"]
,[,,"7(?:1[0-6]|2\\d|3[2-8]|5[0-2]|7[023])\\d{6}","\\d{9}",,,"712123456"]
,[,,"8(?:00|88)\\d{6,7}","\\d{9,10}",,,"800123456"]
,[,,"9(?:00|1)\\d{6,7}","\\d{8,10}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KE",254,"000","0",,,"0",,,,[[,"(\\d{2})(\\d{4,7})","$1 $2",["[2-6]|91"]
,"0$1",""]
,[,"(\\d{3})(\\d{6,7})","$1 $2",["[78]|90"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"KG":[,[,,"[356-8]\\d{8}","\\d{5,9}"]
,[,,"(?:3(?:1(?:2\\d|3[1-9]|52|6[1-8])|2(?:22|3[0-479]|6[0-7])|4(?:22|5[6-9]|6[0-4])|5(?:22|3[4-7]|59|6[0-5])|6(?:22|5[35-7]|6[0-3])|7(?:22|3[468]|4[1-8]|59|6\\d|7[5-7])|9(?:22|4[1-7]|6[0-8]))|6(?:09|12|2[2-4])\\d)\\d{5}","\\d{5,9}",,,"312123456"]
,[,,"5[124-7]\\d{7}|7(?:0[05]|7\\d)\\d{6}","\\d{9}",,,"700123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KG",996,"00","0",,,"0",,,,[[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["31[25]|[5-8]"]
,"0$1",""]
,[,"(\\d{4})(\\d{5})","$1 $2",["3(?:1[36]|[2-9])"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"KH":[,[,,"[1-9]\\d{7,9}","\\d{6,10}"]
,[,,"(?:2[3-6]|3[2-6]|4[2-4]|[5-7][2-5])[2-47-9]\\d{5}","\\d{6,8}",,,"23456789"]
,[,,"(?:(?:1[0-35-9]|9[1-49])[1-9]|85[2-689])\\d{5}","\\d{8}",,,"91234567"]
,[,,"1800(?:1\\d|2[09])\\d{4}","\\d{10}",,,"1800123456"]
,[,,"1900(?:1\\d|2[09])\\d{4}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KH",855,"00[178]","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1\\d[1-9]|[2-9]"]
,"0$1",""]
,[,"(1[89]00)(\\d{3})(\\d{3})","$1 $2 $3",["1[89]0"]
,"",""]
]
,,[,,"NA","NA"]
]
,"KI":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KI",686,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"KM":[,[,,"[37]\\d{6}","\\d{7}"]
,[,,"7(?:6[0-37-9]|7[0-57-9])\\d{4}","\\d{7}",,,"7712345"]
,[,,"3[23]\\d{5}","\\d{7}",,,"3212345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KM",269,"00",,,,,,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"KN":[,[,,"[89]\\d{9}","\\d{7,10}"]
,[,,"869(?:2(?:29|36)|4(?:6[5-9]|70))\\d{4}","\\d{7,10}",,,"8692361234"]
,[,,"869(?:5(?:5[6-8]|6[5-7])|66[2-9]|76[2-5])\\d{4}","\\d{10}",,,"8695561234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KN",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"869"]
,"KP":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KP",850,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"KR":[,[,,"[1-79]\\d{3,9}|8\\d{8}","\\d{4,10}"]
,[,,"1(?:5(?:44|66|77|88|99)|6(?:00|44|6[16]|70|88))\\d{4}|(?:2|[34][1-3]|5[1-5]|6[1-4])(?:1\\d{2,3}|[2-9]\\d{6,7})","\\d{4,10}",,,"22123456"]
,[,,"1[0-25-9]\\d{7,8}","\\d{9,10}",,,"1023456789"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"60[2-9]\\d{6}","\\d{9}",,,"602345678"]
,[,,"NA","NA"]
,[,,"50\\d{8}","\\d{10}",,,"5012345678"]
,[,,"70\\d{8}","\\d{10}",,,"7012345678"]
,"KR",82,"00(?:[124-68]|[37]\\d{2})","0",,,"0(?:8[1-46-8]|85\\d{2})?",,,,[[,"(\\d{2})(\\d{4})(\\d{4})","$1-$2-$3",["1(?:0|1[19]|[69]9|5[458])|[57]0","1(?:0|1[19]|[69]9|5(?:44|59|8))|[57]0"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3",["1(?:[169][2-8]|[78]|5[1-4])|[68]0|[3-9][1-9][2-9]","1(?:[169][2-8]|[78]|5(?:[1-3]|4[56]))|[68]0|[3-9][1-9][2-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d)(\\d{4})","$1-$2-$3",["131","1312"]
,"0$1",""]
,[,"(\\d{3})(\\d{2})(\\d{4})","$1-$2-$3",["131","131[13-9]"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",["13[2-9]"]
,"0$1",""]
,[,"(\\d{2})(\\d{2})(\\d{3})(\\d{4})","$1-$2-$3-$4",["30"]
,"0$1",""]
,[,"(\\d)(\\d{4})(\\d{4})","$1-$2-$3",["2(?:[26]|3[0-467])","2(?:[26]|3(?:01|1[45]|2[17-9]|39|4|6[67]|7[078]))"]
,"0$1",""]
,[,"(\\d)(\\d{3})(\\d{4})","$1-$2-$3",["2(?:3[0-35-9]|[457-9])","2(?:3(?:0[02-9]|1[0-36-9]|2[02-6]|3[0-8]|6[0-589]|7[1-69]|[589])|[457-9])"]
,"0$1",""]
,[,"(\\d)(\\d{3,4})","$1-$2",["21[0-46-9]"]
,"0$1",""]
,[,"(\\d{2})(\\d{3,4})","$1-$2",["[3-9][1-9]1","[3-9][1-9]1(?:[0-46-9])"]
,"0$1",""]
,[,"(\\d{4})(\\d{4})","$1-$2",["1(?:5[46-9]|6[04678])","1(?:5(?:44|66|77|88|99)|6(?:00|44|6[16]|70|88))"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"KW":[,[,,"[12569]\\d{6,7}","\\d{7,8}"]
,[,,"(?:18\\d|2(?:[23]\\d{2}|4[1-35-9]\\d|5(?:0[034]|[2-46]\\d|5[1-3]|7[1-7])))\\d{4}","\\d{7,8}",,,"22345678"]
,[,,"(?:5[05]|6[05-7]|9[0479])\\d{6}","\\d{8}",,,"50012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KW",965,"00","0",,,"0",,,,[[,"(\\d{4})(\\d{3,4})","$1 $2",["[1269]"]
,"0$1",""]
,[,"(5[05]\\d)(\\d{5})","$1 $2",["5"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"KY":[,[,,"[389]\\d{9}","\\d{7,10}"]
,[,,"345(?:2(?:22|44)|444|6(?:23|38|40)|7(?:6[6-9]|77)|8(?:00|1[45]|25|4[89]|88)|9(?:14|4[035-9]))\\d{4}","\\d{7,10}",,,"3452221234"]
,[,,"345(?:32[3-79]|5(?:1[467]|2[5-7]|4[5-9])|9(?:1[679]|2[4-9]|3[89]))\\d{4}","\\d{10}",,,"3453231234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}|345976\\d{4}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KY",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"345"]
,"KZ":[,[,,"(?:[67]\\d{2}|80[09])\\d{7}","\\d{10}"]
,[,,"7(?:1(?:0(?:[23]\\d|4[023]|59|63)|1(?:[23]\\d|4[0-79]|59)|2(?:[23]\\d|59)|3(?:2\\d|3[1-7]|4[1235-9]|59)|4(?:2\\d|3[013-79]|4[0-58]|5[1-79])|5(?:2\\d|3[1-8]|4[1-7]|59)|6(?:22|[34]\\d|5[19])|72\\d|8(?:[27]\\d|3[1-46-9]|4[0-4]|))|2(?:1(?:[23]\\d|4[46-9]|5[3469])|2(?:2\\d|3[0679]|46|5[12679]|)|3(?:[234]\\d|5[139]|)|4(?:22|3[1235-8])|5(?:[23]\\d|4[0124-8]|59)|6(?:22|3[1-9]|4[0-4]|59)|7(?:[23]\\d|40|5[279]|7\\d)|8(?:[23]\\d|4[0-3]|59)|9(?:2\\d|3[12478]|59))|3622)\\d{5}","\\d{10}",,,"7123456789"]
,[,,"7(?:0[01257]\\d{2}|1[2-578]9[01]|2(?:[13-6]9[01]|7(?:58|9[01]))|6[02-4]\\d{2}|7[157]\\d{2})\\d{5}|6\\d{9}","\\d{10}",,,"7129012345"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"809\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"KZ",7,"8~10","8",,,"8",,,,,,[,,"NA","NA"]
]
,"LA":[,[,,"[2-57]\\d{7,9}","\\d{6,10}"]
,[,,"(?:[2-57]1|54)\\d{6}","\\d{6,8}",,,"21212862"]
,[,,"20(?:[23]|5[4-6]|77|9[89])\\d{6}","\\d{9,10}",,,"202345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LA",856,"00","0",,,"0",,,,[[,"(20)([23])(\\d{3})(\\d{3})","$1 $2 $3 $4",["20[23]"]
,"0$1",""]
,[,"(20)([579]\\d)(\\d{3})(\\d{3})","$1 $2 $3 $4",["20[579]"]
,"0$1",""]
,[,"([2-57]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["21|[3-57]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"LB":[,[,,"[13-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:[14-6]\\d|[7-9][2-9])\\d{5}","\\d{7}",,,"1123456"]
,[,,"(?:3\\d|7(?:0\\d|1[167]))\\d{5}","\\d{7,8}",,,"71123456"]
,[,,"NA","NA"]
,[,,"8[01]\\d{6}","\\d{8}",,,"80123456"]
,[,,"9[01]\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LB",961,"00","0",,,"0",,,,[[,"([13-6])(\\d{3})(\\d{3})","$1 $2 $3",["[13-6]"]
,"0$1",""]
,[,"([7-9][01])(\\d{3})(\\d{3})","$1 $2 $3",["[7-9][01]"]
,"0$1",""]
,[,"([7-9][2-9])(\\d{2})(\\d{3})","$1 $2 $3",["[7-9][2-9]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"LC":[,[,,"[789]\\d{9}","\\d{7,10}"]
,[,,"758(?:234|4(?:5[0-9]|6[2-9]|8[0-2])|638|758)\\d{4}","\\d{7,10}",,,"7582345678"]
,[,,"758(?:28[4-7]|384|4(?:6[01]|8[4-9])|5(?:1[89]|20|84)|7(?:1[2-9]|2[0-4]))\\d{4}","\\d{10}",,,"7582845678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"758"]
,"LI":[,[,,"(?:66|80|90)\\d{7}|[237-9]\\d{6}","\\d{7,9}"]
,[,,"(?:2(?:17|3\\d|6[02-58]|96)|3(?:02|7[01357]|8[048]|9[0269])|870)\\d{4}","\\d{7}",,,"2345678"]
,[,,"66(?:[0178][0-4]|2[025-9]|[36]\\d|4[129]|5[45]|9[019])\\d{5}|7(?:4[2-59]|56|[6-9]\\d)\\d{4}","\\d{7,9}",,,"661234567"]
,[,,"80(?:0(?:07|2[238]|79|\\d{4})|9\\d{2})\\d{2}","\\d{7,9}",,,"8002222"]
,[,,"NA","NA"]
,[,,"90(?:0(?:2[278]|79|\\d{4})|1(?:23|\\d{4})|6(?:66|\\d{4}))\\d{2}","\\d{7,9}",,,"9002222"]
,[,,"701\\d{4}","\\d{7}",,,"7011234"]
,[,,"NA","NA"]
,"LI",423,"00",,,,,,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",["[23]|7[4-9]|87"]
,"",""]
,[,"(6\\d)(\\d{3})(\\d{3})","$1 $2 $3",["6"]
,"",""]
,[,"([7-9]0\\d)(\\d{2})(\\d{2})","$1 $2 $3",["[7-9]0"]
,"",""]
,[,"([89]0\\d)(\\d{2})(\\d{2})(\\d{2})","0$1 $2 $3 $4",["[89]0"]
,"",""]
]
,,[,,"NA","NA"]
]
,"LK":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LK",94,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"LR":[,[,,"(?:[27]\\d|[4-6])\\d{6}","\\d{7,8}"]
,[,,"2\\d{7}","\\d{8}",,,"21234567"]
,[,,"(?:4[67]|5\\d|7\\d{2}|6[4-8])\\d{5}","\\d{7,8}",,,"4612345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LR",231,"00","0",,,"0",,,,[[,"([27]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[27]"]
,"0$1",""]
,[,"([4-6])(\\d{3})(\\d{3})","$1 $2 $3",["[4-6]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"LS":[,[,,"[2568]\\d{7}","\\d{8}"]
,[,,"2\\d{7}","\\d{8}",,,"22123456"]
,[,,"[56]\\d{7}","\\d{8}",,,"50123456"]
,[,,"800[256]\\d{4}","\\d{8}",,,"80021234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LS",266,"00",,,,,,,,[[,"(\\d{4})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"LT":[,[,,"[3-9]\\d{7}","\\d{8}"]
,[,,"(?:3[1478]|4[124-6]|52)\\d{6}","\\d{8}",,,"31234567"]
,[,,"6\\d{7}","\\d{8}",,,"61234567"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"90[0239]\\d{5}","\\d{8}",,,"90012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LT",370,"00","8",,,"8",,,,[[,"([34]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["37|4(?:1|5[45]|6[2-4])"]
,"8 $1",""]
,[,"([3-689]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["3[148]|4(?:[24]|6[09])|5(?:[0189]|28)|[689]"]
,"8 $1",""]
,[,"(5)(2[0-79]\\d)(\\d{4})","$1 $2 $3",["52[0-79]"]
,"8 $1",""]
]
,,[,,"NA","NA"]
]
,"LU":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LU",352,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"LV":[,[,,"[2689]\\d{7}","\\d{8}"]
,[,,"6\\d{7}","\\d{8}",,,"61234567"]
,[,,"2\\d{7}","\\d{8}",,,"21234567"]
,[,,"80\\d{6}","\\d{8}",,,"80123456"]
,[,,"90\\d{6}","\\d{8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LV",371,"00",,,,,,,,[[,"([2689]\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"LY":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"LY",218,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"MA":[,[,,"[5689]\\d{8}","\\d{9}"]
,[,,"5(?:2(?:[015-7]\\d{2}|(?:[28][2-9]|3[2-7]|4[2-8])\\d|9(?:0\\d|[89]0))|3(?:[0-4]\\d{2}|(?:[57][2-9]|6[2-8]|9[3-9])\\d|8(?:0\\d|[89]0)))\\d{4}","\\d{9}",,,"520123456"]
,[,,"6(?:00|33|[15-7]\\d|4[0-8]|99)\\d{6}","\\d{9}",,,"650123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89\\d{7}","\\d{9}",,,"891234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MA",212,"00","0",,,"0",,,,[[,"([56]\\d{2})(\\d{6})","$1-$2",["5(?:2[015-7]|3[0-4])|6"]
,"0$1",""]
,[,"([58]\\d{3})(\\d{5})","$1-$2",["5(?:2[2-489]|3[5-9])|892","5(?:2(?:[2-48]|90)|3(?:[5-79]|80))|892"]
,"0$1",""]
,[,"(5\\d{4})(\\d{4})","$1-$2",["5(?:29|38)","5(?:29|38)[89]"]
,"0$1",""]
,[,"(8[09])(\\d{7})","$1-$2",["8(?:0|9[013-9])"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"MC":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MC",377,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"MD":[,[,,"[256-9]\\d{7}","\\d{8}"]
,[,,"(?:2(?:1[0569]|2\\d|3[015-7]|4[1-46-9]|5[0-24689]|6[2-589]|7[1-37]|9[1347-9])|5(?:33|5[257]))\\d{5}","\\d{5,8}",,,"22212345"]
,[,,"(?:6(?:50|7[12]|[89]\\d)|7(?:80|9\\d))\\d{5}","\\d{8}",,,"65012345"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"900\\d{5}","\\d{8}",,,"90012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MD",373,"00","0",,,"0",,,,[[,"(22)(\\d{3})(\\d{3})","$1 $2 $3",["22"]
,"0$1",""]
,[,"([25-7]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["2[13-79]|[5-7]"]
,"0$1",""]
,[,"([89]00)(\\d{5})","$1 $2",["[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ME":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ME",382,"99","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"MG":[,[,,"[23]\\d{8}","\\d{7,9}"]
,[,,"2(?:0(?:(?:2\\d|4[47]|5[3467]|6[279]|8[268]|9[245])\\d|7(?:2[29]|[35]\\d))|210\\d)\\d{4}","\\d{7,9}",,,"202123456"]
,[,,"3[02-4]\\d{7}","\\d{9}",,,"301234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MG",261,"00","0",,,"0",,,,[[,"([23]\\d)(\\d{2})(\\d{3})(\\d{2})","$1 $2 $3 $4",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"MF":[,[,,"[56]\\d{8}","\\d{9}"]
,[,,"590(?:10|2[79]|5[128]|[78]7)\\d{4}","\\d{9}",,,"590271234"]
,[,,"690(?:10|2[27]|66|77|8[78])\\d{4}","\\d{9}",,,"690221234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MF",590,"00","0",,,"0",,,,,,[,,"NA","NA"]
]
,"MH":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MH",692,"011","1",,,"1",,,1,,,[,,"NA","NA"]
]
,"MK":[,[,,"[2-578]\\d{7}","\\d{8}"]
,[,,"(?:2\\d|3[1-4]|4[2-8])\\d{6}","\\d{6,8}",,,"22212345"]
,[,,"7\\d{7}","\\d{8}",,,"72345678"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"5[02-9]\\d{6}","\\d{8}",,,"50012345"]
,[,,"8(?:0[1-9]|[1-9]\\d)\\d{5}","\\d{8}",,,"80123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MK",389,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1",""]
,[,"([347]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[347]"]
,"0$1",""]
,[,"([58]\\d{2})(\\d)(\\d{2})(\\d{2})","$1 $2 $3 $4",["[58]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ML":[,[,,"[246-8]\\d{7}","\\d{8}"]
,[,,"(?:2(?:0(?:2[0-589]|7[027-9])|1(?:2[5-7]|[3-689]\\d))|442\\d)\\d{4}","\\d{8}",,,"20212345"]
,[,,"(?:6(?:[569]\\d)|7(?:[08][1-9]|[3579][0-4]|4[014-7]|6\\d))\\d{5}","\\d{8}",,,"65012345"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ML",223,"00","0",,,"0",,,,[[,"([246-8]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"MM":[,[,,"[124-8]\\d{5,7}|9\\d{7,8}","\\d{5,9}"]
,[,,"(?:1\\d|2|4[2-6]|5[2-9]|6\\d|7[0-5]|8[1-6])\\d{5}|1333\\d{4}","\\d{5,8}",,,"1234567"]
,[,,"9(?:[25689]\\d|444)\\d{5}","\\d{8,9}",,,"92123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MM",95,"00",,,,,,,,[[,"(1)(\\d{3})(\\d{3})","$1 $2 $3",["1"]
,"",""]
,[,"(1)(3)(33\\d)(\\d{3})","$1 $2 $3 $4",["133","1333"]
,"",""]
,[,"(2)(\\d{2})(\\d{3})","$1 $2 $3",["2"]
,"",""]
,[,"(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["[4-8]"]
,"",""]
,[,"(9444)(\\d{5})","$1 $2",["94"]
,"",""]
,[,"(9)([25689]\\d{2})(\\d{4})","$1 $2 $3",["9[25689]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"MN":[,[,,"[127-9]\\d{7}","\\d{8}"]
,[,,"(?:[12](?:1\\d|2[1-37]|3[2-8]|4[2-68]|5[1-4689])|70)\\d{6}","\\d{8}",,,"70123456"]
,[,,"(?:88|9[1569])\\d{6}","\\d{8}",,,"88123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MN",976,"001","0",,,"0",,,,[[,"([127-9]\\d)(\\d{2})(\\d{4})","$1 $2 $3",["[12]1|[7-9]"]
,"0$1",""]
,[,"([12]2\\d)(\\d{5})","$1 $2",["[12]2[1-3]"]
,"0$1",""]
,[,"([12]\\d{3})(\\d{4})","$1 $2",["[12](?:27|[3-5])","[12](?:27|[3-5]\\d)2"]
,"0$1",""]
,[,"([12]\\d{4})(\\d{3})","$1 $2",["[12](?:27|[3-5])","[12](?:27|[3-5]\\d)[4-9]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"MO":[,[,,"[268]\\d{7}","\\d{8}"]
,[,,"(?:28[2-57-9]|8[2-57-9]\\d)\\d{5}","\\d{8}",,,"28212345"]
,[,,"6[26]\\d{6}","\\d{8}",,,"66123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MO",853,"00",,,,,,,,[[,"([268]\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"MP":[,[,,"[689]\\d{9}","\\d{7,10}"]
,[,,"670(?:2(?:3[3-5]|88|56)|32[23]|4[38]3|532|6(?:64|70|8\\d))\\d{4}","\\d{7,10}",,,"6702345678"]
,[,,"670(?:2(?:3[3-5]|88|56)|32[23]|4[38]3|532|6(?:64|70|8\\d))\\d{4}","\\d{7,10}",,,"6702345678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MP",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"670"]
,"MQ":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MQ",596,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"MR":[,[,,"[2-7]\\d{6}","\\d{7}"]
,[,,"5(?:1[035]|2[0-69]|3[0348]|4[468]|5[02-467]|6[39]|7[4-69])\\d{4}","\\d{7}",,,"5131234"]
,[,,"(?:[23][0-4]|4[3-5]|6\\d|7[0-7])\\d{5}","\\d{7}",,,"3123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MR",222,"00",,,,,,,,[[,"([2-7]\\d{2})(\\d{2})(\\d{2})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"MS":[,[,,"[689]\\d{9}","\\d{7,10}"]
,[,,"664491\\d{4}","\\d{7,10}",,,"6644912345"]
,[,,"664492\\d{4}","\\d{10}",,,"6644923456"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002123456"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MS",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"664"]
,"MT":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MT",356,"00","21",,,"21",,,1,,,[,,"NA","NA"]
]
,"MU":[,[,,"[2-9]\\d{6}","\\d{7}"]
,[,,"(?:2(?:[034789]\\d|1[0-8]|2[0-79])|4(?:[013-8]\\d|2[4-7])|[56]\\d{2}|8(?:14|3[129]))\\d{4}","\\d{7}",,,"2012345"]
,[,,"(?:25\\d|4(?:2[12389]|9\\d)|7\\d{2}|87[15-7]|9[1-8]\\d)\\d{4}","\\d{7}",,,"2512345"]
,[,,"80[012]\\d{4}","\\d{7}",,,"8001234"]
,[,,"30\\d{5}","\\d{7}",,,"3012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MU",230,"020",,,,,,,,[[,"([2-9]\\d{2})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"MV":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MV",960,"020","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"MW":[,[,,"(?:[13-5]|[27]\\d{2}|[89](?:\\d{2})?)\\d{6}","\\d{7,9}"]
,[,,"(?:1[2-9]|21\\d{2})\\d{5}","\\d{7,9}",,,"1234567"]
,[,,"(?:[3-5]|77|8(?:8\\d)?|9(?:9\\d)?)\\d{6}","\\d{7,9}",,,"991234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MW",265,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[13-5]"]
,"0$1",""]
,[,"(2\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["2"]
,"0$1",""]
,[,"(\\d)(\\d{4})(\\d{4})","$1 $2 $3",["7"]
,"0$1",""]
,[,"(\\d)(\\d{3,4})(\\d{3,4})","$1 $2 $3",["[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"MX":[,[,,"[1-9]\\d{9,10}","\\d{7,11}"]
,[,,"(?:33|55|81)\\d{8}|(?:2(?:2[2-9]|3[1-35-8]|4[13-9]|7[1-689]|8[1-58]|9[467])|3(?:1[1-79]|[2458][1-9]|7[1-8]|9[1-5])|4(?:1[1-57-9]|[24-6][1-9]|[37][1-8]|8[1-35-9]|9[2-689])|5(?:88|9[1-79])|6(?:1[2-68]|[234][1-9]|5[1-3689]|6[12457-9]|7[1-7]|8[67]|9[4-8])|7(?:[13467][1-9]|2[1-8]|5[13-9]|8[1-69]|9[17])|8(?:2[13-689]|3[1-6]|4[124-6]|6[1246-9]|7[1-378]|9[12479])|9(?:1[346-9]|2[1-4]|3[2-46-8]|5[1348]|[69][1-9]|7[12]|8[1-8]))\\d{7}","\\d{7,10}",,,"2221234567"]
,[,,"1(?:(?:33|55|81)\\d{8}|(?:2(?:2[2-9]|3[1-35-8]|4[13-9]|7[1-689]|8[1-58]|9[467])|3(?:1[1-79]|[2458][1-9]|7[1-8]|9[1-5])|4(?:1[1-57-9]|[24-6][1-9]|[37][1-8]|8[1-35-9]|9[2-689])|5(?:88|9[1-79])|6(?:1[2-68]|[2-4][1-9]|5[1-3689]|6[12457-9]|7[1-7]|8[67]|9[4-8])|7(?:[13467][1-9]|2[1-8]|5[13-9]|8[1-69]|9[17])|8(?:2[13-689]|3[1-6]|4[124-6]|6[1246-9]|7[1-378]|9[12479])|9(?:1[346-9]|2[1-4]|3[2-46-8]|5[1348]|[69][1-9]|7[12]|8[1-8]))\\d{7})","\\d{11}",,,"12221234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MX",52,"0[09]","01",,,"0[12]|04[45](\\d{10})","1$1",,,[[,"([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["33|55|81"]
,"01 $1",""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[2467]|3[12457-9]|5[89]|8[02-9]|9[0-35-9]"]
,"01 $1",""]
,[,"1([358]\\d)(\\d{4})(\\d{4})","045 $1 $2 $3",["1(?:33|55|81)"]
,"$1",""]
,[,"1(\\d{3})(\\d{3})(\\d{4})","045 $1 $2 $3",["1(?:[2467]|3[12457-9]|5[89]|8[2-9]|9[1-35-9])"]
,"$1",""]
]
,[[,"([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3",["33|55|81"]
,,""]
,[,"(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3",["[2467]|3[12457-9]|5[89]|8[02-9]|9[0-35-9]"]
,,""]
,[,"(1)([358]\\d)(\\d{4})(\\d{4})","$1 $2 $3 $4",["1(?:33|55|81)"]
,,""]
,[,"(1)(\\d{3})(\\d{3})(\\d{4})","$1 $2 $3 $4",["1(?:[2467]|3[12457-9]|5[89]|8[2-9]|9[1-35-9])"]
,,""]
]
,[,,"NA","NA"]
]
,"MY":[,[,,"[13-9]\\d{7,9}","\\d{6,10}"]
,[,,"(?:3\\d{2}|[4-79]\\d|8[2-9])\\d{6}","\\d{6,9}",,,"312345678"]
,[,,"1[0-46-9]\\d{7}","\\d{9}",,,"123456789"]
,[,,"1[38]00\\d{6}","\\d{10}",,,"1300123456"]
,[,,"1600\\d{6}","\\d{10}",,,"1600123456"]
,[,,"NA","NA"]
,[,,"1700\\d{6}","\\d{10}",,,"1700123456"]
,[,,"154\\d{7}","\\d{10}",,,"1541234567"]
,"MY",60,"00","0",,,"0",,,,[[,"([4-79])(\\d{3})(\\d{4})","$1-$2 $3",["[4-79]"]
,"0$1",""]
,[,"(3)(\\d{4})(\\d{4})","$1-$2 $3",["3"]
,"0$1",""]
,[,"([18]\\d)(\\d{3})(\\d{3,4})","$1-$2 $3",["1[0-46-9][1-9]|8"]
,"0$1",""]
,[,"(1)([36-8]00)(\\d{2})(\\d{4})","$1-$2-$3-$4",["1[36-8]0"]
,"",""]
,[,"(154)(\\d{3})(\\d{4})","$1-$2 $3",["15"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"MZ":[,[,,"[28]\\d{7,8}","\\d{8,9}"]
,[,,"2(?:[1346]\\d|5[0-2]|[78][12]|93)\\d{5}","\\d{8}",,,"21123456"]
,[,,"8[24]\\d{7}","\\d{9}",,,"821234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"MZ",258,"00",,,,,,,,[[,"([28]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["2|8[24]"]
,"",""]
,[,"(80\\d)(\\d{3})(\\d{3})","$1 $2 $3",["80"]
,"",""]
]
,,[,,"NA","NA"]
]
,"NA":[,[,,"[68]\\d{5,9}","\\d{4,10}"]
,[,,"6(?:1(?:[136]|2\\d?)\\d|2(?:[25]\\d?|[134678])\\d|3(?:2\\d{0,3}|4\\d{1,2}|[135-8]\\d?)|4(?:[13-8]\\d|2\\d{1,2})|(?:5(?:[16-7]\\d|[3-58]\\d?|2\\d{1,2}))|6\\d{0,4}|7\\d{0,3})\\d{4}","\\d{4,10}",,,"612012345"]
,[,,"8(?:1(?:1[0-24]|[2-4]\\d|50|6[0-2])|5\\d{2})\\d{5}","\\d{9}",,,"811012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"88\\d{6}","\\d{8}",,,"88123456"]
,"NA",264,"00","0",,,"0",,,,[[,"(8\\d)(\\d{3})(\\d{4})","$1 $2 $3",["8[15]"]
,"0$1",""]
,[,"(632532)(\\d{2,4})","$1 $2",["632","6325","63253","632532"]
,"0$1",""]
,[,"(6\\d)(\\d{2,3})(\\d{4})","$1 $2 $3",["6(?:1|[245][1-7]|3[125-7]|6[1256]|7[1236])"]
,"0$1",""]
,[,"(6\\d)(\\d{4,5})","$1 $2",["6(?:3[12567]|5[3-5]|6[1256]|7[1236])"]
,"0$1",""]
,[,"(6\\d{2})(\\d{4,6})","$1 $2",["6[2356]8"]
,"0$1",""]
,[,"(6\\d{3})(\\d{4,5})","$1 $2",["6(?:34|6[34]|75)","6(?:342|6[34]|751)"]
,"0$1",""]
,[,"(88)(\\d{3})(\\d{3})","$1 $2 $3",["88"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"NC":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NC",687,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"NE":[,[,,"[029]\\d{7}","\\d{8}"]
,[,,"2(?:0(?:20|3[1-7]|4[134]|5[14]|6[14578]|7[1-578])|1(?:4[145]|5[14]|6[14-68]|7[169]|88))\\d{4}","\\d{8}",,,"20201234"]
,[,,"9[03467]\\d{6}","\\d{8}",,,"93123456"]
,[,,"08\\d{6}","\\d{8}",,,"08123456"]
,[,,"09\\d{6}","\\d{8}",,,"09123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NE",227,"00",,,,,,,,[[,"([029]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[29]|09"]
,"",""]
,[,"(08)(\\d{3})(\\d{3})","$1 $2 $3",["08"]
,"",""]
]
,,[,,"NA","NA"]
]
,"NF":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NF",672,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"NG":[,[,,"[1-69]\\d{5,8}|[78]\\d{5,13}","\\d{5,14}"]
,[,,"[12]\\d{6,7}|9\\d{7}|(?:4[023568]|5[02368]|6[02-469]|7[569]|8[2-9])\\d{6}|(?:4[47]|5[14579]|6[1578]|7[0-357])\\d{5,6}|(?:78|41)\\d{5}","\\d{5,9}",,,"12345678"]
,[,,"(?:70[3-9]|8(?:0[2-9]|1[23]))\\d{7}|(?:702[1-9]|819[01])\\d{6}","\\d{10}",,,"8021234567"]
,[,,"800\\d{7,11}","\\d{10,14}",,,"80017591759"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"700\\d{7,11}","\\d{10,14}",,,"7001234567"]
,[,,"NA","NA"]
,"NG",234,"009","0",,,"0",,,,[[,"([129])(\\d{3})(\\d{3,4})","$1 $2 $3",["[129]"]
,"0$1",""]
,[,"([3-8]\\d)(\\d{3})(\\d{2,3})","$1 $2 $3",["[3-6]|7(?:[1-79]|0[1-9])|8[2-9]"]
,"0$1",""]
,[,"([78]\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["70[03-9]|8(?:0|1[23])"]
,"0$1",""]
,[,"([78]\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["702|819"]
,"0$1",""]
,[,"([78]00)(\\d{4})(\\d{4,5})","$1 $2 $3",["[78]00"]
,"0$1",""]
,[,"([78]00)(\\d{5})(\\d{5,6})","$1 $2 $3",["[78]00"]
,"0$1",""]
,[,"(78)(\\d{2})(\\d{3})","$1 $2 $3",["78"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"NI":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NI",505,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"NL":[,[,,"[1-9]\\d{6,9}","\\d{7,10}"]
,[,,"(?:1[0135-8]|2[02-69]|3[0-68]|4[0135-9]|[57]\\d|8[478])\\d{7}","\\d{9}",,,"101234567"]
,[,,"6[1-58]\\d{7}","\\d{9}",,,"612345678"]
,[,,"800\\d{4,7}","\\d{7,10}",,,"8001234"]
,[,,"90[069]\\d{4,7}","\\d{7,10}",,,"9001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"85\\d{7}","\\d{9}"]
,"NL",31,"00","0",,,"0",,,,[[,"([1-578]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["1[035]|2[0346]|3[03568]|4[0356]|5[0358]|7|8[458]"]
,"0$1",""]
,[,"([1-5]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1[16-8]|2[259]|3[124]|4[17-9]|5[124679]"]
,"0$1",""]
,[,"(6)(\\d{8})","$1 $2",["6"]
,"0$1",""]
,[,"([89]0\\d)(\\d{4,7})","$1 $2",["80|9"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"NO":[,[,,"0\\d{4}|[2-9]\\d{7}","\\d{5}(?:\\d{3})?"]
,[,,"0\\d{4}|(?:2[1-4]|3[1-3578]|5[1-35-7]|6[1-4679]|7\\d)\\d{6}|81(?:0(?:0[7-9]|1\\d)|5\\d{2})\\d{3}","\\d{5}(?:\\d{3})?",,,"21234567"]
,[,,"(?:4[015-8]|9\\d)\\d{6}","\\d{8}",,,"41234567"]
,[,,"80[01]\\d{5}","\\d{8}",,,"80012345"]
,[,,"82[09]\\d{5}","\\d{8}",,,"82012345"]
,[,,"810(?:0[0-6]|[2-8]\\d)\\d{3}","\\d{8}",,,"81021234"]
,[,,"880\\d{5}","\\d{8}",,,"88012345"]
,[,,"NA","NA"]
,"NO",47,"00",,,,,,,,[[,"([489]\\d{2})(\\d{2})(\\d{3})","$1 $2 $3",["[489]"]
,"",""]
,[,"([235-7]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[235-7]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"NP":[,[,,"[1-8]\\d{5,7}|98[45]\\d{7}","\\d{6,10}"]
,[,,"(?:1[014-6]|2[13-79]|3[135-8]|4[146-9]|5[135-7]|6[13-9]|7[15-9]|8[1-4679]|9[1-79])\\d{6}","\\d{6,8}",,,"14567890"]
,[,,"98[45]\\d{7}","\\d{10}",,,"9841234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NP",977,"00","0",,,"0",,,,[[,"(1)([4-6]\\d{3})(\\d{3})","$1 $2 $3",["1[4-6]"]
,"0$1",""]
,[,"(\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["1[01]|[2-8]|9[1-79]"]
,"0$1",""]
,[,"(98[45])(\\d{3})(\\d{4})","$1 $2 $3",["98"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"NR":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NR",674,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"NU":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NU",683,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"NZ":[,[,,"[2-9]\\d{7,9}","\\d{7,10}"]
,[,,"(?:3[2-79]|[479][2-689]|6[235-9])\\d{6}|24099\\d{3}","\\d{7,8}",,,"32345678"]
,[,,"2(?:[027]\\d{7}|9\\d{6,7}|1(?:0\\d{5,7}|[12]\\d{5,6}|[3-9]\\d{5})|4[1-9]\\d{6}|8\\d{7,8})","\\d{8,10}",,,"211234567"]
,[,,"(?:800|508)\\d{6,7}","\\d{9,10}",,,"800123456"]
,[,,"900\\d{6,7}","\\d{9,10}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"NZ",64,"00","0",,,"0",,,,[[,"([34679])(\\d{3})(\\d{4})","$1-$2 $3",["[3467]|9[1-9]"]
,"0$1",""]
,[,"(21)(\\d{4})(\\d{3,4})","$1 $2 $3",["21"]
,"0$1",""]
,[,"([2589]\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["2[0247-9]|5|[89]00"]
,"0$1",""]
,[,"(2[019])(\\d{3})(\\d{3})","$1 $2 $3",["2[019]"]
,"0$1",""]
,[,"(24099)(\\d{3})","$1 $2",["240","2409","24099"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"OM":[,[,,"(?:2[3-6]|5|9[2-9])\\d{6}|800\\d{5,6}","\\d{7,9}"]
,[,,"2[3-6]\\d{6}","\\d{8}",,,"23123456"]
,[,,"9[2-9]\\d{6}","\\d{8}",,,"92123456"]
,[,,"8007\\d{4,5}|500\\d{4}","\\d{7,9}",,,"80071234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"OM",968,"00",,,,,,,,[[,"(2\\d)(\\d{6})","$1 $2",["2"]
,"",""]
,[,"(9\\d{3})(\\d{4})","$1 $2",["9"]
,"",""]
,[,"([58]00)(\\d{4,6})","$1 $2",["[58]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"PA":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PA",507,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"PE":[,[,,"[14-9]\\d{7,8}","\\d{6,9}"]
,[,,"(?:1\\d|4[1-4]|5[1-46]|6[1-7]|7[2-46]|8[2-4])\\d{6}","\\d{6,8}",,,"11234567"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PE",51,"00","0"," Anexo ",,"0",,,,[[,"(1)(\\d{7})","$1 $2",["1"]
,"($1)",""]
,[,"([4-8]\\d)(\\d{6})","$1 $2",["[4-8]"]
,"($1)",""]
,[,"(9\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["9"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"PF":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PF",689,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"PG":[,[,,"[1-9]\\d{6,7}","\\d{7,8}"]
,[,,"(?:3\\d{2}|4[257]\\d|5[34]\\d|6(?:29|4[1-9])|85[02-46-9]|9[78]\\d)\\d{4}","\\d{7}",,,"3123456"]
,[,,"(?:68|7(?:[126]\\d|3[34689]))\\d{5}","\\d{7,8}",,,"6812345"]
,[,,"180\\d{4}","\\d{7}",,,"1801234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"275\\d{4}","\\d{7}",,,"2751234"]
,"PG",675,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[1-689]"]
,"",""]
,[,"(7[1-36]\\d)(\\d{2})(\\d{3})","$1 $2 $3",["7[1-36]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"PH":[,[,,"[2-9]\\d{7,9}|1800\\d{7,9}","\\d{7,13}"]
,[,,"(?:2|3[2-68]|4[2-9]|5[2-6]|6[2-58]|7[24578]|8[2-8])\\d{7}","\\d{7,9}",,,"21234567"]
,[,,"9(?:0[5-9]|1[025-9]|2[0-36-9]|3[0235-9]|7[349]|[89]9)\\d{7}","\\d{10}",,,"9051234567"]
,[,,"1800\\d{7,9}","\\d{11,13}",,,"180012345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PH",63,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"(0$1)",""]
,[,"(\\d{4})(\\d{5})","$1 $2",["3(?:23|39|46)|4(?:2[3-6]|[35]9|4[26]|76)|5(?:22|44)|642|8(?:62|8[245])","3(?:230|397|461)|4(?:2(?:35|[46]4|51)|396|4(?:22|63)|59[347]|76[15])|5(?:221|446)|642[23]|8(?:622|8(?:[24]2|5[13]))"]
,"(0$1)",""]
,[,"(\\d{5})(\\d{4})","$1 $2",["346|4(?:27|9[35])|883","3469|4(?:279|9(?:30|56))|8834"]
,"(0$1)",""]
,[,"([3-8]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[3-8]"]
,"(0$1)",""]
,[,"(9\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"0$1",""]
,[,"(1800)(\\d{3})(\\d{4})","$1 $2 $3",["1"]
,"",""]
,[,"(1800)(\\d{1,2})(\\d{3})(\\d{4})","$1 $2 $3 $4",["1"]
,"",""]
]
,,[,,"NA","NA"]
]
,"PK":[,[,,"1\\d{8}|[2-8]\\d{5,11}|9(?:[013-9]\\d{4,9}|2\\d(?:111\\d{6}|\\d{3,7}))","\\d{6,12}"]
,[,,"(?:21|42)[2-9]\\d{7}|(?:2[25]|4[0146-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]\\d{6}|(?:2(?:3[2358]|4[2-4]|9[2-8])|45[3479]|54[2-467]|60[468]|72[236]|8(?:2[2-689]|3[23578]|4[3478]|5[2356])|9(?:1|2[2-8]|3[27-9]|4[2-6]|6[3569]|9[25-8]))[2-9]\\d{5,6}|58[126]\\d{7}","\\d{6,10}",,,"2123456789"]
,[,,"3(?:0\\d|1[2-5]|2[1-3]|3[1-6]|4[2-6]|64)\\d{7}","\\d{10}",,,"3012345678"]
,[,,"800\\d{5}","\\d{8}",,,"80012345"]
,[,,"900\\d{5}","\\d{8}",,,"90012345"]
,[,,"(?:2(?:[125]|3[2358]|4[2-4]|9[2-8])|4(?:[0-246-9]|5[3479])|5(?:[1-35-7]|4[2-467])|6(?:[1-8]|0[468])|7(?:[14]|2[236])|8(?:[16]|2[2-689]|3[23578]|4[3478]|5[2356])|9(?:1|22|3[27-9]|4[2-6]|6[3569]|9[2-7]))111\\d{6}","\\d{11,12}",,,"21111825888"]
,[,,"122\\d{6}","\\d{9}",,,"122044444"]
,[,,"NA","NA"]
,"PK",92,"00","0",,,"0",,,,[[,"(\\d{2})(111)(\\d{3})(\\d{3})","$1 $2 $3 $4",["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)1","(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)11","(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)111"]
,"(0$1)",""]
,[,"(\\d{3})(111)(\\d{3})(\\d{3})","$1 $2 $3 $4",["(?:2[349]|45|54|60|72|8[2-5]|9[2-9])","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d1","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d11","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d111"]
,"(0$1)",""]
,[,"(\\d{2})(\\d{7,8})","$1 $2",["(?:2[125]|4[0-246-9]|5[1-35-7]|6[1-8]|7[14]|8[16]|91)[2-9]"]
,"(0$1)",""]
,[,"(\\d{3})(\\d{6,7})","$1 $2",["2[349]|45|54|60|72|8[2-5]|9[2-9]","(?:2[349]|45|54|60|72|8[2-5]|9[2-9])\\d[2-9]"]
,"(0$1)",""]
,[,"(3\\d{2})(\\d{7})","$1 $2",["3"]
,"0$1",""]
,[,"([15]\\d{3})(\\d{5,6})","$1 $2",["58[12]|1"]
,"(0$1)",""]
,[,"(586\\d{2})(\\d{5})","$1 $2",["586"]
,"(0$1)",""]
,[,"([89]00)(\\d{3})(\\d{2})","$1 $2 $3",["[89]00"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"PL":[,[,,"[1-9]\\d{8}","\\d{9}"]
,[,,"(?:1[2-8]|2[2-59]|3[2-4]|4[1-468]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145])\\d{7}","\\d{9}",,,"123456789"]
,[,,"(?:5[013]|6[069]|7[289]|88)\\d{7}","\\d{9}",,,"512345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"70\\d{7}","\\d{9}",,,"701234567"]
,[,,"801\\d{6}","\\d{9}",,,"801234567"]
,[,,"NA","NA"]
,[,,"39\\d{7}","\\d{9}",,,"391234567"]
,"PL",48,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[124]|3[2-4]|5[24-689]|6[1-3578]|7[14-7]|8[1-79]|9[145]"]
,"",""]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["39|5[013]|6[069]|7[0289]|8[08]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"PM":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PM",508,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"PR":[,[,,"[789]\\d{9}","\\d{7,10}"]
,[,,"(?:787|939)[2-9]\\d{6}","\\d{7,10}",,,"7872345678"]
,[,,"(?:787|939)[2-9]\\d{6}","\\d{7,10}",,,"7872345678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PR",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"787|939"]
,"PS":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PS",970,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"PT":[,[,,"[2-46-9]\\d{8}","\\d{9}"]
,[,,"2(?:[12]\\d|[35][1-689]|4[1-59]|6[1-35689]|7[1-9]|8[1-69]|9[1256])\\d{6}","\\d{9}",,,"212345678"]
,[,,"9(?:[136]\\d{2}|2[25-79]\\d|4(?:80|9\\d))\\d{5}","\\d{9}",,,"912345678"]
,[,,"4\\d{8}|80[02]\\d{6}","\\d{9}",,,"800123456"]
,[,,"71\\d{7}","\\d{9}",,,"712345678"]
,[,,"808\\d{6}","\\d{9}",,,"808123456"]
,[,,"NA","NA"]
,[,,"30\\d{7}","\\d{9}",,,"301234567"]
,"PT",351,"00",,,,,,,,[[,"([2-46-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"PW":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PW",680,"011",,,,,,,1,,,[,,"NA","NA"]
]
,"PY":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"PY",595,"002","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"QA":[,[,,"[3-8]\\d{6,7}","\\d{7,8}"]
,[,,"44\\d{6}","\\d{7,8}",,,"44123456"]
,[,,"(?:33|55|66|77)\\d{6}","\\d{7,8}",,,"33123456"]
,[,,"800\\d{4}","\\d{7,8}",,,"8001234"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"QA",974,"00",,,,,,,,[[,"(8\\d{2})(\\d{4})","$1 $2",["8"]
,"",""]
,[,"([3-7]\\d{3})(\\d{4})","$1 $2",["[3-7]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"RE":[,[,,"[268]\\d{8}","\\d{9}"]
,[,,"262\\d{6}","\\d{9}",,,"262161234"]
,[,,"6(?:9[23]|47)\\d{6}","\\d{9}",,,"692123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"89[1-37-9]\\d{6}","\\d{9}",,,"891123456"]
,[,,"8(?:1[019]|2[0156]|84|90)\\d{6}","\\d{9}",,,"810123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RE",262,"00","0",,,"0",,,,[[,"([268]\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"0$1",""]
]
,,[,,"NA","NA"]
,1,"262|6[49]|8"]
,"RO":[,[,,"[237-9]\\d{8}","\\d{9}"]
,[,,"[23][13-6]\\d{7}","\\d{9}",,,"211234567"]
,[,,"7[1-8]\\d{7}","\\d{9}",,,"712345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"90[036]\\d{6}","\\d{9}",,,"900123456"]
,[,,"801\\d{6}","\\d{9}",,,"801123456"]
,[,,"802\\d{6}","\\d{9}",,,"802123456"]
,[,,"NA","NA"]
,"RO",40,"00","0"," int ",,"0",,,,[[,"([237]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[23]1|7"]
,"0$1",""]
,[,"(\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["[23][02-9]|[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"RS":[,[,,"[1-46-9]\\d{4,11}","\\d{5,12}"]
,[,,"[1-3]\\d{6,9}","\\d{5,10}",,,"1012345"]
,[,,"6[0-689]\\d{3,10}","\\d{5,12}",,,"6012345"]
,[,,"800\\d{3,6}","\\d{6,9}",,,"80012345"]
,[,,"(?:9[0-2]|42)\\d{4,7}","\\d{6,9}",,,"90012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RS",381,"00","0",,,"0",,,,[[,"([23]\\d{2})(\\d{4,7})","$1 $2",["(?:2[389]|39)0"]
,"0$1",""]
,[,"([1-4]\\d)(\\d{4,8})","$1 $2",["1|2(?:[0-24-7]|[389][1-9])|3(?:[0-8]|9[1-9])|42"]
,"0$1",""]
,[,"(6[0-689])(\\d{3,10})","$1 $2",["6"]
,"0$1",""]
,[,"([89]\\d{2})(\\d{3,6})","$1 $2",["[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"RU":[,[,,"[3489]\\d{9}","\\d{10}"]
,[,,"(?:3(?:0[12]|4[1-35-79]|5[1-3]|8[1-58]|9[0145])|4(?:01|1[1356]|2[13467]|7[1-5]|8[1-7]|9[1-689])|8(?:1[1-8]|2[01]|3[13-6]|4[0-8]|5[15]|6[1-35-7]|7[1-37-9]))\\d{7}","\\d{10}",,,"3011234567"]
,[,,"9\\d{9}","\\d{10}",,,"9123456789"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"809\\d{7}","\\d{10}",,,"8091234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RU",7,"8~10","8",,,"8",,,,[[,"([3489]\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2-$3-$4",["[34689]"]
,"8 ($1)",""]
,[,"([67]\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",["[67]"]
,"8 ($1)",""]
]
,,[,,"NA","NA"]
,1]
,"RW":[,[,,"[27-9]\\d{8}","\\d{9}"]
,[,,"25\\d{7}","\\d{9}",,,"250123456"]
,[,,"7[258]\\d{7}","\\d{9}",,,"720123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"RW",250,"000","0",,,"0",,,,[[,"(25\\d)(\\d{3})(\\d{3})","$1 $2 $3",["2"]
,"$1",""]
,[,"([7-9]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[7-9]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SA":[,[,,"[1-9]\\d{7,10}","\\d{7,11}"]
,[,,"(?:1[24-7]|2[24-8]|3[35-8]|4[34-68]|6[2-5]|7[235-7])\\d{6}","\\d{7,8}",,,"12345678"]
,[,,"(?:5[013-69]\\d|8111)\\d{6}","\\d{9,10}",,,"512345678"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"9200\\d{7}","\\d{11}",,,"92001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SA",966,"00","0",,,"0",,,,[[,"([1-467])(\\d{3})(\\d{4})","$1 $2 $3",["[1-467]"]
,"0$1",""]
,[,"(9200)(\\d{3})(\\d{4})","$1 $2 $3",["9"]
,"0$1",""]
,[,"(5\\d)(\\d{3})(\\d{4})","$1 $2 $3",["5"]
,"0$1",""]
,[,"(800)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"0$1",""]
,[,"(8111)(\\d{3})(\\d{3})","$1 $2 $3",["81"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SB":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SB",677,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"SC":[,[,,"[2-8]\\d{5}","\\d{6}"]
,[,,"(?:2(?:1[78]|2[14-69]|3[2-4]|4[1-36-8]|6[167]|[89]\\d)|3(?:2[1-6]|4[4-6]|55|6[016]|7\\d|8[0-589]|9[0-5])|5(?:5\\d|6[0-2])|6(?:0[0-27-9]|1[0-478]|2[145]|3[02-4]|4[124]|6[015]|7\\d|8[1-3])|78[0138])\\d{3}","\\d{6}",,,"217123"]
,[,,"(?:5(?:[1247-9]\\d|6[3-9])|7(?:[14679]\\d|2[1-9]|8[24-79]))\\d{3}","\\d{6}",,,"510123"]
,[,,"8000\\d{2}","\\d{6}",,,"800000"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"4[1-37]\\d{4}","\\d{6}",,,"410123"]
,"SC",248,"0[0-2]",,,,,,"00",,[[,"(\\d{3})(\\d{3})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"SD":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SD",249,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"SE":[,[,,"\\d{7,10}","\\d{5,10}"]
,[,,"1(?:0[1-8]\\d{6}|[136]\\d{5,7}|(?:2[0-35]|4[0-4]|5[0-25-9]|7[13-6]|[89]\\d)\\d{5,6})|2(?:[136]\\d{5,7}|(?:2[0-7]|4[0136-8]|5[0-38]|7[018]|8[01]|9[0-57])\\d{5,6})|3(?:[356]\\d{5,7}|(?:0[0-4]|1\\d|2[0-25]|4[056]|7[0-2]|8[0-3]|9[023])\\d{5,6})|4(?:[0246]\\d{5,7}|(?:1[01-8]|3[0135]|5[14-79]|7[0-246-9]|8[0156]|9[0-689])\\d{5,6})|5(?:0[0-6]|1[1-5]|2[0-68]|3[0-4]|4\\d|5[0-5]|6[03-5]|7[013]|8[0-79]|9[01])\\d{5,6}|6(?:[03]\\d{5,7}|(?:1[1-3]|2[0-4]|4[02-57]|5[0-37]|6[0-3]|7[0-2]|8[0247]|9[0-356])\\d{5,6})|8\\d{6,8}|9(?:0\\d{5,7}|(?:1[0-68]|2\\d|3[02-59]|4[0-4]|5[0-4]|6[01]|7[0135-8]|8[01])\\d{5,6})","\\d{5,9}",,,"8123456"]
,[,,"7[02-46]\\d{7}","\\d{9}",,,"701234567"]
,[,,"20\\d{4,7}","\\d{6,9}",,,"201234567"]
,[,,"9(?:00|39|44)\\d{7}","\\d{10}",,,"9001234567"]
,[,,"77\\d{7}","\\d{9}",,,"771234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SE",46,"00","0",,,"0",,,,[[,"(8)(\\d{2,3})(\\d{2,3})(\\d{2})","$1 $2 $3 $4",["8"]
,"0$1",""]
,[,"([1-69]\\d)(\\d{2,3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1[013689]|2[0136]|3[1356]|4[0246]|54|6[03]|90"]
,"0$1",""]
,[,"([1-69]\\d)(\\d{3})(\\d{2})","$1 $2 $3",["1[13689]|2[136]|3[1356]|4[0246]|54|6[03]|90"]
,"0$1",""]
,[,"(\\d{3})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
,"0$1",""]
,[,"(\\d{3})(\\d{2,3})(\\d{2})","$1 $2 $3",["1[2457]|2[2457-9]|3[0247-9]|4[1357-9]|5[0-35-9]|6[124-9]|9(?:[125-8]|3[0-5]|4[0-3])"]
,"0$1",""]
,[,"(7[02-467])(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["7[02-467]"]
,"0$1",""]
,[,"(20)(\\d{2,3})(\\d{2})","$1 $2 $3",["20"]
,"0$1",""]
,[,"(9[034]\\d)(\\d{2})(\\d{2})(\\d{3})","$1 $2 $3 $4",["9[034]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SG":[,[,,"[13689]\\d{7,10}","\\d{8,11}"]
,[,,"[36]\\d{7}","\\d{8}",,,"31234567"]
,[,,"[89]\\d{7}","\\d{8}",,,"81234567"]
,[,,"1?800\\d{7}","\\d{10,11}",,,"18001234567"]
,[,,"1900\\d{7}","\\d{11}",,,"19001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SG",65,"0[0-3][0-9]",,,,,,,,[[,"([3689]\\d{3})(\\d{4})","$1 $2",["[369]|8[1-9]"]
,"",""]
,[,"(1[89]00)(\\d{3})(\\d{4})","$1 $2 $3",["1[89]"]
,"",""]
,[,"(800)(\\d{3})(\\d{4})","$1 $2 $3",["80"]
,"",""]
]
,,[,,"NA","NA"]
]
,"SH":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SH",290,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"SI":[,[,,"[1-7]\\d{6,7}|[89]\\d{4,7}","\\d{5,8}"]
,[,,"(?:1\\d|2[2-8]|3[4-8]|4[24-8]|[57][3-8])\\d{6}","\\d{7,8}",,,"11234567"]
,[,,"(?:[37][01]|4[019]|51|64)\\d{6}","\\d{8}",,,"31234567"]
,[,,"80\\d{4,6}","\\d{6,8}",,,"80123456"]
,[,,"90\\d{4,6}|89[1-3]\\d{2,5}","\\d{5,8}",,,"90123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"(?:59|8[1-3])\\d{6}","\\d{8}",,,"59012345"]
,"SI",386,"00","0",,,"0",,,,[[,"(\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["[12]|3[4-8]|4[24-8]|5[3-8]|7[3-8]"]
,"(0$1)",""]
,[,"([3-7]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["[37][01]|4[019]|51|64"]
,"0$1",""]
,[,"([89][09])(\\d{3,6})","$1 $2",["[89][09]"]
,"0$1",""]
,[,"([58]\\d{2})(\\d{5})","$1 $2",["59|8[1-3]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SK":[,[,,"[2-689]\\d{8}","\\d{9}"]
,[,,"[2-5]\\d{8}","\\d{9}",,,"212345678"]
,[,,"9(?:0[1-8]|1[0-24-9]|4[0489])\\d{6}","\\d{9}",,,"912123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"9(?:[78]\\d{7}|00\\d{6})","\\d{9}",,,"900123456"]
,[,,"8[5-9]\\d{7}","\\d{9}",,,"850123456"]
,[,,"NA","NA"]
,[,,"6(?:5[0-4]|9[0-6])\\d{6}","\\d{9}",,,"690123456"]
,"SK",421,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{3})(\\d{2})","$1/$2 $3 $4",["2"]
,"0$1",""]
,[,"([3-5]\\d)(\\d{3})(\\d{2})(\\d{2})","$1/$2 $3 $4",["[3-5]"]
,"0$1",""]
,[,"([689]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[689]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SL":[,[,,"[2-578]\\d{7}","\\d{6,8}"]
,[,,"[235]2[2-4][2-9]\\d{4}","\\d{6,8}",,,"22221234"]
,[,,"(?:25|3[03]|44|5[056]|7[6-8]|88)[1-9]\\d{5}","\\d{6,8}",,,"25123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SL",232,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{6})","$1 $2",,"(0$1)",""]
]
,,[,,"NA","NA"]
]
,"SM":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SM",378,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"SN":[,[,,"[37]\\d{8}","\\d{9}"]
,[,,"3(?:010|3(?:8[1-9]|9[2-9]))\\d{5}","\\d{9}",,,"301012345"]
,[,,"7(?:0[1256]0|6(?:1[23]|2[89]|3[3489]|4[6-9]|5[1-389]|6[6-9]|7[45]|8[3-8])|7(?:1[014-8]|2[0-7]|3[0-35-8]|4[0-6]|[56]\\d|7[0-589]|8[01]|9[0-6]))\\d{5}","\\d{9}",,,"701012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"33301\\d{4}","\\d{9}",,,"333011234"]
,"SN",221,"00",,,,,,,,[[,"(\\d{2})(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"SO":[,[,,"[13-59]\\d{6,7}","\\d{7,8}"]
,[,,"(?:5[57-9]|[134]\\d)\\d{5}","\\d{7}",,,"5522010"]
,[,,"(?:9[01]|15)\\d{6}","\\d{8}",,,"90792024"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SO",252,"00",,,,,,,,[[,"([13-5])(\\d{6})","$1 $2",["[13-5]"]
,"",""]
,[,"([19]\\d)(\\d{6})","$1 $2",["[19]"]
,"",""]
]
,,[,,"NA","NA"]
]
,"SR":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SR",597,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"ST":[,[,,"[29]\\d{6}","\\d{7}"]
,[,,"22\\d{5}","\\d{7}",,,"2221234"]
,[,,"9[89]\\d{5}","\\d{7}",,,"9812345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ST",239,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"SV":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SV",503,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"SY":[,[,,"[1-59]\\d{7,8}","\\d{6,9}"]
,[,,"(?:1(?:1\\d?|4\\d|[2356])|2[1-35]|3(?:1\\d|[34])|4[13]|5[1-3])\\d{6}","\\d{6,9}",,,"112345678"]
,[,,"9(?:3[23]|4[457]|55|6[67]|88|9[19])\\d{6}","\\d{9}",,,"944567890"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SY",963,"00","0",,,"0",,,,[[,"(\\d{2})(\\d{3})(\\d{3,4})","$1 $2 $3",["[1-5]"]
,"0$1",""]
,[,"(9[3-689])(\\d{4})(\\d{3})","$1 $2 $3",["9"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"SZ":[,[,,"[2-7]\\d{6,7}","\\d{7,8}"]
,[,,"2?(?:2(?:0[07]|[13]7|2[57])|3(?:0[34]|[1278]3|3[23]|[46][34])|(?:40[4-69]|16|2[12]|3[57]|[4578]2|67)|5(?:0[5-7]|1[6-9]|[23][78]|48|5[01]))\\d{4}","\\d{7,8}",,,"2171234"]
,[,,"(?:6|7[67])\\d{6}","\\d{7,8}",,,"76123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"SZ",268,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",["[2-6]"]
,"",""]
,[,"(\\d{4})(\\d{4})","$1 $2",["7"]
,"",""]
]
,,[,,"NA","NA"]
]
,"TC":[,[,,"[689]\\d{9}","\\d{7,10}"]
,[,,"649(?:712|9(?:4\\d|50))\\d{4}","\\d{7,10}",,,"6497121234"]
,[,,"649(?:2(?:3[12]|4[1-5])|3(?:3[1-39]|4[1-57])|4[34][12])\\d{4}","\\d{10}",,,"6492311234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"64971[01]\\d{4}","\\d{10}",,,"6497101234"]
,"TC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"649"]
,"TD":[,[,,"[2679]\\d{7}","\\d{8}"]
,[,,"22(?:[3789]0|5[0-5]|6[89])\\d{4}","\\d{8}",,,"22501234"]
,[,,"(?:6(?:3[0-7]|6\\d)|77\\d|9(?:5[0-4]|9\\d))\\d{5}","\\d{8}",,,"63012345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TD",235,"00|16",,,,,,"00",,[[,"(\\d{2})(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"",""]
]
,,[,,"NA","NA"]
]
,"TF":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TF",262,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"TG":[,[,,"[02-9]\\d{6}","\\d{7}"]
,[,,"(?:2[2-7]|3[23]|44|55|66|77)\\d{5}","\\d{7}",,,"2212345"]
,[,,"(?:0[1-9]|7[56]|8[1-7]|9\\d)\\d{5}","\\d{7}",,,"0112345"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TG",228,"00",,,,,,,,[[,"(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"TH":[,[,,"[2-8]\\d{7,8}|1\\d{9}","\\d{8,10}"]
,[,,"(?:2[1-9]|3[24-9]|4[2-5]|5[3-6]|7[3-7])\\d{6}","\\d{8}",,,"21234567"]
,[,,"8\\d{8}","\\d{9}",,,"812345678"]
,[,,"1800\\d{6}","\\d{10}",,,"1800123456"]
,[,,"1900\\d{6}","\\d{10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"60\\d{7}","\\d{9}",,,"601234567"]
,"TH",66,"00","0",,,"0",,,,[[,"(2)(\\d{3})(\\d{4})","$1 $2 $3",["2"]
,"0$1",""]
,[,"([3-7]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[3-7]"]
,"0$1",""]
,[,"(8)(\\d{4})(\\d{4})","$1 $2 $3",["8"]
,"0$1",""]
,[,"(1[89]00)(\\d{3})(\\d{3})","$1 $2 $3",["1"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"TJ":[,[,,"[349]\\d{8}","\\d{3,9}"]
,[,,"(?:3(?:1[3-5]|2[245]|31|4[24-7]|5[25]|72)|4(?:46|74|87))\\d{6}","\\d{3,9}",,,"372123456"]
,[,,"9[0-35-9]\\d{7}","\\d{9}",,,"917123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TJ",992,"8~10","8",,,"8",,,,[[,"([349]\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",["[34]7|91[78]"]
,"8$1",""]
,[,"([49]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["4[48]|9(?:19|[0235-9])"]
,"8$1",""]
,[,"(331700)(\\d)(\\d{2})","$1 $2 $3",["331","3317","33170","331700"]
,"8$1",""]
,[,"(\\d{4})(\\d)(\\d{4})","$1 $2 $3",["3[1-5]","3(?:[1245]|3(?:[02-9]|1[0-589]))"]
,"8$1",""]
]
,,[,,"NA","NA"]
]
,"TK":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TK",690,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"TL":[,[,,"[2-47-9]\\d{6}","\\d{7}"]
,[,,"(?:2[1-5]|3[1-9]|4[1-4])\\d{5}","\\d{7}",,,"2112345"]
,[,,"7[2-4]\\d{5}","\\d{7}",,,"7212345"]
,[,,"80\\d{5}","\\d{7}",,,"8012345"]
,[,,"90\\d{5}","\\d{7}",,,"9012345"]
,[,,"NA","NA"]
,[,,"70\\d{5}","\\d{7}",,,"7012345"]
,[,,"NA","NA"]
,"TL",670,"00",,,,,,,,[[,"(\\d{3})(\\d{4})","$1 $2",,"",""]
]
,,[,,"NA","NA"]
]
,"TM":[,[,,"[1-6]\\d{7}","\\d{8}"]
,[,,"(?:12\\d|243|[3-5]22)\\d{5}","\\d{8}",,,"12345678"]
,[,,"6[6-8]\\d{6}","\\d{8}",,,"66123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TM",993,"8~10","8",,,"8",,,,[[,"([1-6]\\d)(\\d{2})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"8 $1",""]
]
,,[,,"NA","NA"]
]
,"TN":[,[,,"[247-9]\\d{7}","\\d{8}"]
,[,,"7\\d{7}","\\d{8}",,,"71234567"]
,[,,"(?:2[0-7]|40|9\\d)\\d{6}","\\d{8}",,,"20123456"]
,[,,"NA","NA"]
,[,,"8[028]\\d{6}","\\d{8}",,,"80123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TN",216,"00",,,,,,,,[[,"([247-9]\\d)(\\d{3})(\\d{3})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"TO":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TO",676,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"TR":[,[,,"[2-589]\\d{9}","\\d{10}"]
,[,,"[2-4]\\d{9}|850\\d{7}","\\d{10}",,,"2123456789"]
,[,,"5\\d{9}","\\d{10}",,,"5123456789"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TR",90,"00","0",,,"0",,,,[[,"([2-589]\\d{2})(\\d{3})(\\d{4})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"TT":[,[,,"[89]\\d{9}","\\d{7,10}"]
,[,,"868(?:2(?:01|2[1-4])|6(?:1[4-6]|2[1-9]|[3-6]\\d|7[0-79]|9[0-8])|82[12])\\d{4}","\\d{7,10}",,,"8682211234"]
,[,,"868(?:29\\d|3(?:0[1-9]|1[02-9]|[2-9]\\d)|4(?:[679]\\d|8[0-4])|6(?:20|78|8\\d)|7(?:1[02-9]|[2-9]\\d))\\d{4}","\\d{10}",,,"8682911234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TT",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"868"]
,"TV":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TV",688,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"TW":[,[,,"[2-9]\\d{7,8}","\\d{8,9}"]
,[,,"[2-8]\\d{7,8}","\\d{8,9}",,,"21234567"]
,[,,"9\\d{8}","\\d{9}",,,"912345678"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"TW",886,"0(?:0[25679]|19)","0","#",,"0",,,,[[,"([2-8])(\\d{3,4})(\\d{4})","$1 $2 $3",["[2-7]|8[1-9]"]
,"0$1",""]
,[,"([89]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["80|9"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"TZ":[,[,,"\\d{9}","\\d{7,9}"]
,[,,"2[2-8]\\d{7}","\\d{7,9}",,,"222345678"]
,[,,"(?:6[158]|7[1-9])(?:\\d{7})","\\d{9}",,,"612345678"]
,[,,"80[08]\\d{6}","\\d{9}",,,"800123456"]
,[,,"90\\d{7}","\\d{9}",,,"900123456"]
,[,,"8(?:40|6[01])\\d{6}","\\d{9}",,,"840123456"]
,[,,"NA","NA"]
,[,,"41\\d{7}","\\d{9}",,,"412345678"]
,"TZ",255,"00[056]","0",,,"0",,,,[[,"([24]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["[24]"]
,"0$1",""]
,[,"([67]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["[67]"]
,"0$1",""]
,[,"([89]\\d{2})(\\d{2})(\\d{4})","$1 $2 $3",["[89]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"UA":[,[,,"[3-689]\\d{8}","\\d{5,9}"]
,[,,"(?:3[1-8]|4[13-8]|5[1-7]|6[12459])\\d{7}","\\d{5,9}",,,"311234567"]
,[,,"(?:39|50|6[36-8]|9[1-9])\\d{7}","\\d{9}",,,"391234567"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"900\\d{6}","\\d{9}",,,"900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UA",380,"0~0","0",,,"0",,,,[[,"([3-69]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["39|4(?:[45][0-5]|87)|5(?:0|6[37]|7[37])|6[36-8]|9[1-9]","39|4(?:[45][0-5]|87)|5(?:0|6(?:3[14-7]|7)|7[37])|6[36-8]|9[1-9]"]
,"0$1",""]
,[,"([3-689]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["3[1-8]2|4[1378]2|5(?:[12457]2|6[24])|6(?:[49]2|[12][29]|5[24])|8|90","3(?:[1-46-8]2[013-9]|52)|4[1378]2|5(?:[12457]2|6[24])|6(?:[49]2|[12][29]|5[24])|8|90"]
,"0$1",""]
,[,"([3-6]\\d{3})(\\d{5})","$1 $2",["3(?:5[013-9]|[1-46-8])|4(?:[137][013-9]|6|[45][6-9]|8[4-6])|5(?:[1245][013-9]|6[0135-9]|3|7[4-6])|6(?:[49][013-9]|5[0135-9]|[12][13-8])","3(?:5[013-9]|[1-46-8](?:22|[013-9]))|4(?:[137][013-9]|6|[45][6-9]|8[4-6])|5(?:[1245][013-9]|6(?:3[02389]|[015689])|3|7[4-6])|6(?:[49][013-9]|5[0135-9]|[12][13-8])"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"UG":[,[,,"\\d{9}","\\d{5,9}"]
,[,,"3\\d{8}|4(?:[1-6]\\d|7[136]|8[1356]|96)\\d{6}|20(?:0\\d|24)\\d{5}","\\d{5,9}",,,"312345678"]
,[,,"7(?:[1578]\\d|0[0-4])\\d{6}","\\d{9}",,,"712345678"]
,[,,"800[123]\\d{5}","\\d{9}",,,"800123456"]
,[,,"90[123]\\d{6}","\\d{9}",,,"901123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UG",256,"00[057]","0",,,"0",,,,[[,"([247-9]\\d{2})(\\d{6})","$1 $2",["[7-9]|200|4(?:6[45]|[7-9])"]
,"0$1",""]
,[,"([34]\\d)(\\d{7})","$1 $2",["3|4(?:[1-5]|6[0-36-9])"]
,"0$1",""]
,[,"(2024)(\\d{5})","$1 $2",["202"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"US":[,[,,"[2-9]\\d{9}","\\d{7,10}"]
,[,,"(?:2(?:0[1-35-9]|1[02-9]|2[4589]|3[149]|4[08]|5[1-46]|6[0279]|7[06]|8[13])|3(?:0[1-57-9]|1[02-9]|2[0135]|3[014679]|47|5[12]|6[01]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[0235]|69|7[089]|8[04])|5(?:0[1-57-9]|1[0235-8]|[23]0|4[01]|5[19]|6[1-37]|7[013-5]|8[056])|6(?:0[1-35-9]|1[024-9]|2[036]|3[016]|4[16]|5[017]|6[0-29]|78|8[12])|7(?:0[1-46-8]|1[2-9]|2[047]|3[124]|4[07]|5[47]|6[02359]|7[02-59]|8[156])|8(?:0[1-68]|1[02-8]|28|3[0-25]|4[3578]|5[06-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[058]|3[167]|4[0179]|5[1246]|7[0-3589]|8[059]))[2-9]\\d{6}","\\d{7,10}",,,"2012345678"]
,[,,"(?:2(?:0[1-35-9]|1[02-9]|2[4589]|3[149]|4[08]|5[1-46]|6[0279]|7[06]|8[13])|3(?:0[1-57-9]|1[02-9]|2[0135]|3[014679]|47|5[12]|6[01]|8[056])|4(?:0[124-9]|1[02-579]|2[3-5]|3[0245]|4[0235]|69|7[089]|8[04])|5(?:0[1-57-9]|1[0235-8]|[23]0|4[01]|5[19]|6[1-37]|7[013-5]|8[056])|6(?:0[1-35-9]|1[024-9]|2[036]|3[016]|4[16]|5[017]|6[0-29]|78|8[12])|7(?:0[1-46-8]|1[2-9]|2[047]|3[124]|4[07]|5[47]|6[02359]|7[02-59]|8[156])|8(?:0[1-68]|1[02-8]|28|3[0-25]|4[3578]|5[06-9]|6[02-5]|7[028])|9(?:0[1346-9]|1[02-9]|2[058]|3[167]|4[0179]|5[1246]|7[0-3589]|8[059]))[2-9]\\d{6}","\\d{7,10}",,,"2012345678"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"US",1,"011","1",,,"1",,,1,[[,"(\\d{3})(\\d{3})(\\d{4})","($1) $2-$3",,"",""]
,[,"(\\d{3})(\\d{4})","$1-$2",,"",""]
]
,[[,"(\\d{3})(\\d{3})(\\d{4})","$1-$2-$3",,,""]
]
,[,,"NA","NA"]
,1]
,"UY":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UY",598,"00","0",,,"0",,,1,,,[,,"NA","NA"]
]
,"UZ":[,[,,"[679]\\d{8}","\\d{7,9}"]
,[,,"(?:6[125679]|7[0-69])\\d{7}","\\d{7,9}",,,"612345678"]
,[,,"9[0-57-9]\\d{7}","\\d{7,9}",,,"912345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"UZ",998,"8~10","8",,,"8",,,,[[,"([679]\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",,"8$1",""]
]
,,[,,"NA","NA"]
]
,"VA":[,[,,"06\\d{8}","\\d{10}"]
,[,,"06698\\d{5}","\\d{10}",,,"0669812345"]
,[,,"N/A","N/A"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VA",379,"00",,,,,,,,[[,"(06)(\\d{4})(\\d{4})","$1 $2 $3",,"",""]
]
,,[,,"NA","NA"]
]
,"VC":[,[,,"(?:784|8(?:00|66|77|88)|900)[2-9]\\d{6}","\\d{7,10}"]
,[,,"784(?:266|3(?:6[6-9]|7\\d|8[0-24-6])|4(?:38|5[0-36-8]|8\\d|9[01])|555|638|784)\\d{4}","\\d{7,10}",,,"7842661234"]
,[,,"784(?:4(?:3[0-24]|5[45]|9[2-5])|5(?:2[6-9]|3[0-3]|93))\\d{4}","\\d{10}",,,"7844301234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VC",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"784"]
,"VE":[,[,,"[24589]\\d{9}","\\d{7,10}"]
,[,,"(?:2(?:12|3[457-9]|[58][1-9]|[467]\\d|9[1-6])|50[01])\\d{7}","\\d{7,10}",,,"2121234567"]
,[,,"4(?:1[24-8]|2[46])\\d{7}","\\d{10}",,,"4121234567"]
,[,,"800\\d{7}","\\d{10}",,,"8001234567"]
,[,,"900\\d{7}","\\d{10}",,,"9001234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VE",58,"00","0",,,"1\\d{2}|0",,,,[[,"(\\d{3})(\\d{7})","$1-$2",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"VG":[,[,,"(?:284|8(?:00|66|77|88)|900)[2-9]\\d{6}","\\d{7,10}"]
,[,,"284(?:(?:229|4(?:46|9[45])|8(?:52|6[459]))\\d{4}|496[0-5]\\d{3})","\\d{7,10}",,,"2842291234"]
,[,,"284(?:(?:30[0-3]|4(?:4[0-5]|68|99)|54[0-4])\\d{4}|496[6-9]\\d{3})","\\d{10}",,,"2843001234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VG",1,"011","1",,,"1",,,,,,[,,"NA","NA"]
,,"284"]
,"VI":[,[,,"340(?:6[49]2|7[17]\\d)\\d{4}|(?:8(?:00|66|77|88)|900)[2-9]\\d{6}","\\d{7,10}"]
,[,,"340(?:6[49]2|7[17]\\d)\\d{4}|(?:8(?:00|66|77|88)|900)[2-9]\\d{6}","\\d{7,10}",,,"3406421234"]
,[,,"340(?:6[49]2|7[17]\\d)\\d{4}|(?:8(?:00|66|77|88)|900)[2-9]\\d{6}","\\d{7,10}",,,"3406421234"]
,[,,"8(?:00|55|66|77|88)[2-9]\\d{6}","\\d{10}",,,"8002345678"]
,[,,"900[2-9]\\d{6}","\\d{10}",,,"9002345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VI",1,"011","1",,,"1",,,1,,,[,,"NA","NA"]
,,"340"]
,"VN":[,[,,"8\\d{5,8}|[1-79]\\d{7,9}","\\d{7,10}"]
,[,,"(?:2(?:[025-79]|1[0189]|[348][01])|3(?:[0136-9]|[25][01])|[48]\\d|5(?:[01][01]|[2-9])|6(?:[0-46-8]|5[01])|7(?:[02-79]|[18][01]))\\d{7}|69\\d{5,6}|80\\d{5}","\\d{7,10}",,,"2101234567"]
,[,,"(?:9\\d|1(?:2[1-35-9]|6[3-9]|99))\\d{7}","\\d{9,10}",,,"912345678"]
,[,,"1800\\d{4,6}","\\d{8,10}",,,"1800123456"]
,[,,"1900\\d{4,6}","\\d{8,10}",,,"1900123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VN",84,"00","0",,,"0",,,,[[,"([48])(\\d{4})(\\d{4})","$1 $2 $3",["[48]"]
,"0$1",""]
,[,"([235-7]\\d)(\\d{4})(\\d{3})","$1 $2 $3",["2[025-79]|3[0136-9]|5[2-9]|6[0-46-9]|7[02-79]"]
,"0$1",""]
,[,"(80)(\\d{5})","$1 $2",["80"]
,"0$1",""]
,[,"(69\\d)(\\d{4,5})","$1 $2",["69"]
,"0$1",""]
,[,"([235-7]\\d{2})(\\d{4})(\\d{3})","$1 $2 $3",["2[1348]|3[25]|5[01]|65|7[18]"]
,"0$1",""]
,[,"(9\\d)(\\d{3})(\\d{2})(\\d{2})","$1 $2 $3 $4",["9"]
,"0$1",""]
,[,"(1[269]\\d)(\\d{3})(\\d{4})","$1 $2 $3",["1(?:[26]|99)"]
,"0$1",""]
,[,"(1[89]00)(\\d{4,6})","$1 $2",["1(?:8|90)"]
,"$1",""]
]
,,[,,"NA","NA"]
]
,"VU":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"VU",678,"00",,,,,,,1,,,[,,"NA","NA"]
]
,"WF":[,[]
,[]
,[]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"WF",681,"19",,,,,,,1,,,[,,"NA","NA"]
]
,"WS":[,[,,"[2-8]\\d{4,6}","\\d{5,7}"]
,[,,"(?:[2-5]\\d|6[1-9]|840\\d)\\d{3}","\\d{5,7}",,,"22123"]
,[,,"(?:60|7[25-7]\\d)\\d{4}","\\d{6,7}",,,"601234"]
,[,,"800\\d{3}","\\d{6}",,,"800123"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"WS",685,"0","0",,,"0",,,,[[,"(8[04]0)(\\d{3,4})","$1 $2",["8[04]0"]
,"0$1",""]
,[,"(7[25-7])(\\d{5})","$1 $2",["7[25-7]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"YE":[,[,,"[1-7]\\d{6,8}","\\d{6,9}"]
,[,,"(?:1(?:7\\d|[2-68])|2[2-68]|3[2358]|4[2-58]|5[2-6]|6[3-58]|7[24-68])\\d{5}","\\d{6,8}",,,"1234567"]
,[,,"7[137]\\d{7}","\\d{9}",,,"712345678"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"YE",967,"00","0",,,"0",,,,[[,"([1-7])(\\d{3})(\\d{3,4})","$1 $2 $3",["[1-6]|7[24-68]"]
,"0$1",""]
,[,"(7[137]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["7[137]"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"YT":[,[,,"[268]\\d{8}","\\d{9}"]
,[,,"2696[0-4]\\d{4}","\\d{9}",,,"269601234"]
,[,,"639\\d{6}","\\d{9}",,,"639123456"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"YT",262,"00","0",,,"0",,,,,,[,,"NA","NA"]
,,"269|63"]
,"ZA":[,[,,"\\d{9}","\\d{8,9}"]
,[,,"(?:1[0-8]|2[1-478]|3[1-69]|4\\d|5[1346-8])\\d{7}","\\d{8,9}",,,"101234567"]
,[,,"(?:7[1-4689]|8[1-5789])\\d{7}","\\d{9}",,,"711234567"]
,[,,"80\\d{7}","\\d{9}",,,"801234567"]
,[,,"86\\d{7}","\\d{9}",,,"861234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"87\\d{7}","\\d{9}",,,"871234567"]
,"ZA",27,"00","0",,,"0",,,,[[,"([1-578]\\d)(\\d{3})(\\d{4})","$1 $2 $3",,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ZM":[,[,,"[289]\\d{8}","\\d{9}"]
,[,,"21[1-8]\\d{6}","\\d{9}",,,"211234567"]
,[,,"9(?:55|6[4-9]|7[4-9])\\d{6}","\\d{9}",,,"955123456"]
,[,,"800\\d{6}","\\d{9}",,,"800123456"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,"ZM",260,"00","0",,,"0",,,,[[,"([29]\\d)(\\d{7})","$1 $2",["[29]"]
,"0$1",""]
,[,"(800)(\\d{3})(\\d{3})","$1 $2 $3",["8"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
,"ZW":[,[,,"2(?:[012457-9]\\d{3,8}|6\\d{3,6})|[13-79]\\d{4,8}|86\\d{8}","\\d{3,10}"]
,[,,"(?:1[3-9]|2(?:0[45]|[16]|2[28]|[49]8?|58[23]|7[246]|8[1346-9])|3(?:08?|17?|3[78]|[2456]|7[1569]|8[379])|5(?:[07-9]|1[78]|483|5(?:7?|8))|6(?:0|28|37?|[45][68][78]|98?)|848)\\d{3,6}|(?:2(?:27|5|7[135789]|8[25])|3[39]|5[1-46]|6[126-8])\\d{4,6}|2(?:0|70)\\d{5,6}|(?:4\\d|9[2-8])\\d{4,7}","\\d{3,10}",,,"1312345"]
,[,,"(?:[19]1|7[13])\\d{6,7}","\\d{8,9}",,,"911234567"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"NA","NA"]
,[,,"86(?:1[12]|22|30|44|8[367]|99)\\d{6}","\\d{10}",,,"8686123456"]
,"ZW",263,"00","0",,,"0",,,,[[,"([49])(\\d{3})(\\d{2,5})","$1 $2 $3",["4|9[2-9]"]
,"0$1",""]
,[,"([179]\\d)(\\d{3})(\\d{3,4})","$1 $2 $3",["[19]1|7"]
,"0$1",""]
,[,"([1-356]\\d)(\\d{3,5})","$1 $2",["1[3-9]|2(?:[1-469]|0[0-35-9]|[45][0-79])|3(?:0[0-79]|1[0-689]|[24-69]|3[0-69])|5(?:[02-46-9]|[15][0-69])|6(?:[0145]|[29][0-79]|3[0-689]|[68][0-69])"]
,"0$1",""]
,[,"([1-356]\\d)(\\d{3})(\\d{3})","$1 $2 $3",["1[3-9]|2(?:[1-469]|0[0-35-9]|[45][0-79])|3(?:0[0-79]|1[0-689]|[24-69]|3[0-69])|5(?:[02-46-9]|[15][0-69])|6(?:[0145]|[29][0-79]|3[0-689]|[68][0-69])"]
,"0$1",""]
,[,"([2356]\\d{2})(\\d{3,5})","$1 $2",["2(?:[278]|0[45]|48)|3(?:08|17|3[78]|[78])|5[15][78]|6(?:[29]8|37|[68][78])"]
,"0$1",""]
,[,"([2356]\\d{2})(\\d{3})(\\d{3})","$1 $2 $3",["2(?:[278]|0[45]|48)|3(?:08|17|3[78]|[78])|5[15][78]|6(?:[29]8|37|[68][78])"]
,"0$1",""]
,[,"([25]\\d{3})(\\d{3,5})","$1 $2",["(?:25|54)8","258[23]|5483"]
,"0$1",""]
,[,"([25]\\d{3})(\\d{3})(\\d{3})","$1 $2 $3",["(?:25|54)8","258[23]|5483"]
,"0$1",""]
,[,"(8\\d{3})(\\d{6})","$1 $2",["8"]
,"0$1",""]
]
,,[,,"NA","NA"]
]
};


/*
 * @license
 * Copyright (C) 2010 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview  Utility for international phone numbers.
 * Functionality includes formatting, parsing and validation.
 * (based on the java implementation).
 *
 * @author Nikolaos Trogkanis
 */

goog.provide('i18n.phonenumbers.PhoneNumberUtil');

goog.require('goog.array');
goog.require('goog.proto2.PbLiteSerializer');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('i18n.phonenumbers.NumberFormat');
goog.require('i18n.phonenumbers.PhoneMetadata');
goog.require('i18n.phonenumbers.PhoneMetadataCollection');
goog.require('i18n.phonenumbers.PhoneNumber');
goog.require('i18n.phonenumbers.PhoneNumber.CountryCodeSource');
goog.require('i18n.phonenumbers.PhoneNumberDesc');
goog.require('i18n.phonenumbers.metadata');

/**
 * @constructor
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil = function() {
  /**
   * A mapping from a region code to the PhoneMetadata for that region.
   * @type {Object.<string, i18n.phonenumbers.PhoneMetadata>}
   */
  this.countryToMetadata = {};
};
goog.addSingletonGetter(i18n.phonenumbers.PhoneNumberUtil);

/**
 * Errors encountered when parsing phone numbers.
 *
 * @enum {string}
 */
i18n.phonenumbers.Error = {
  INVALID_COUNTRY_CODE: 'Invalid country code',
  // This generally indicates the string passed in had less than 3 digits in it.
  // More specifically, the number failed to match the regular expression
  // VALID_PHONE_NUMBER.
  NOT_A_NUMBER: 'The string supplied did not seem to be a phone number',
  // This indicates the string started with an international dialing prefix, but
  // after this was stripped from the number, had less digits than any valid
  // phone number (including country code) could have.
  TOO_SHORT_AFTER_IDD: 'Phone number too short after IDD',
  // This indicates the string, after any country code has been stripped, had
  // less digits than any
  // valid phone number could have.
  TOO_SHORT_NSN: 'The string supplied is too short to be a phone number',
  // This indicates the string had more digits than any valid phone number could
  // have.
  TOO_LONG: 'The string supplied is too long to be a phone number'
}

/**
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_ = 1;

/**
 * The minimum length of the national significant number.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_ = 3;

/**
 * The maximum length of the national significant number.
 *
 * @const
 * @type {number}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_ = 15;

/**
 * The PLUS_SIGN signifies the international prefix.
 *
 * @const
 * @type {string}
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN = '+';

/**
 * These mappings map a character (key) to a specific digit that should replace
 * it for normalization purposes. Non-European digits that may be used in phone
 * numbers are mapped to a European equivalent.
 *
 * @const
 */
i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '\uFF10': '0', // Fullwidth digit 0
  '\uFF11': '1', // Fullwidth digit 1
  '\uFF12': '2', // Fullwidth digit 2
  '\uFF13': '3', // Fullwidth digit 3
  '\uFF14': '4', // Fullwidth digit 4
  '\uFF15': '5', // Fullwidth digit 5
  '\uFF16': '6', // Fullwidth digit 6
  '\uFF17': '7', // Fullwidth digit 7
  '\uFF18': '8', // Fullwidth digit 8
  '\uFF19': '9', // Fullwidth digit 9
  '\u0660': '0', // Arabic-indic digit 0
  '\u0661': '1', // Arabic-indic digit 1
  '\u0662': '2', // Arabic-indic digit 2
  '\u0663': '3', // Arabic-indic digit 3
  '\u0664': '4', // Arabic-indic digit 4
  '\u0665': '5', // Arabic-indic digit 5
  '\u0666': '6', // Arabic-indic digit 6
  '\u0667': '7', // Arabic-indic digit 7
  '\u0668': '8', // Arabic-indic digit 8
  '\u0669': '9'  // Arabic-indic digit 9
};

/**
 * Only upper-case variants of alpha characters are stored.
 *
 * @const
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.ALPHA_MAPPINGS_ = {
  'A': '2',
  'B': '2',
  'C': '2',
  'D': '3',
  'E': '3',
  'F': '3',
  'G': '4',
  'H': '4',
  'I': '4',
  'J': '5',
  'K': '5',
  'L': '5',
  'M': '6',
  'N': '6',
  'O': '6',
  'P': '7',
  'Q': '7',
  'R': '7',
  'S': '7',
  'T': '8',
  'U': '8',
  'V': '8',
  'W': '9',
  'X': '9',
  'Y': '9',
  'Z': '9'
};

/**
 * For performance reasons, amalgamate both into one map.
 *
 * @const
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_ = {
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '\uFF10': '0', // Fullwidth digit 0
  '\uFF11': '1', // Fullwidth digit 1
  '\uFF12': '2', // Fullwidth digit 2
  '\uFF13': '3', // Fullwidth digit 3
  '\uFF14': '4', // Fullwidth digit 4
  '\uFF15': '5', // Fullwidth digit 5
  '\uFF16': '6', // Fullwidth digit 6
  '\uFF17': '7', // Fullwidth digit 7
  '\uFF18': '8', // Fullwidth digit 8
  '\uFF19': '9', // Fullwidth digit 9
  '\u0660': '0', // Arabic-indic digit 0
  '\u0661': '1', // Arabic-indic digit 1
  '\u0662': '2', // Arabic-indic digit 2
  '\u0663': '3', // Arabic-indic digit 3
  '\u0664': '4', // Arabic-indic digit 4
  '\u0665': '5', // Arabic-indic digit 5
  '\u0666': '6', // Arabic-indic digit 6
  '\u0667': '7', // Arabic-indic digit 7
  '\u0668': '8', // Arabic-indic digit 8
  '\u0669': '9', // Arabic-indic digit 9
  'A': '2',
  'B': '2',
  'C': '2',
  'D': '3',
  'E': '3',
  'F': '3',
  'G': '4',
  'H': '4',
  'I': '4',
  'J': '5',
  'K': '5',
  'L': '5',
  'M': '6',
  'N': '6',
  'O': '6',
  'P': '7',
  'Q': '7',
  'R': '7',
  'S': '7',
  'T': '8',
  'U': '8',
  'V': '8',
  'W': '9',
  'X': '9',
  'Y': '9',
  'Z': '9'
};

/**
 * A list of all country codes where national significant numbers (excluding any
 * national prefix) exist that start with a leading zero.
 *
 * @const
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.LEADING_ZERO_COUNTRIES_ = {
  39: 1,  // Italy
  47: 1,  // Norway
  225: 1,  // Cote d'Ivoire
  227: 1,  // Niger
  228: 1,  // Togo
  241: 1,  // Gabon
  379: 1   // Vatican City
};

/**
 * Pattern that makes it easy to distinguish whether a country has a unique
 * international dialing prefix or not. If a country has a unique international
 * prefix (e.g. 011 in USA), it will be represented as a string that contains a
 * sequence of ASCII digits. If there are multiple available international
 * prefixes in a country, they will be represented as a regex string that always
 * contains character(s) other than ASCII digits. Note this regex also includes
 * tilde, which signals waiting for the tone.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.UNIQUE_INTERNATIONAL_PREFIX_ =
    /[\d]+(?:[~\u2053\u223C\uFF5E][\d]+)?/;

/**
 * Regular expression of acceptable punctuation found in phone numbers. This
 * excludes punctuation found as a leading character only. This consists of dash
 * characters, white space characters, full stops, slashes, square brackets,
 * parentheses and tildes. It also includes the letter 'x' as that is found as a
 * placeholder for carrier information in some phone numbers.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION_ =
    '-x\u2010-\u2015\u2212\uFF0D-\uFF0F \u00A0\u200B\u2060\u3000()' +
    '\uFF08\uFF09\uFF3B\uFF3D.\\[\\]/~\u2053\u223C\uFF5E';

/**
 * Digits accepted in phone numbers (ascii, fullwidth, and arabic-indic digits).
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ =
    '0-9\uFF10-\uFF19\u0660-\u0669';

/**
 * We accept alpha characters in phone numbers, ASCII only, upper and lower
 * case.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ = 'A-Za-z';

/**
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ = '+\uFF0B';

/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_PATTERN_ =
    new RegExp('^[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ + ']+');

/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.CAPTURING_DIGIT_PATTERN_ =
    new RegExp('([' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + '])');

/**
 * Regular expression of acceptable characters that may start a phone number for
 * the purposes of parsing. This allows us to strip away meaningless prefixes to
 * phone numbers that may be mistakenly given to us. This consists of digits,
 * the plus symbol and arabic-indic digits. This does not contain alpha
 * characters, although they may be used later in the number. It also does not
 * include other punctuation, as this will be stripped later during parsing and
 * is of no information value when parsing a number.
 *
 * @const
 * @type {RegExp}
 * @protected
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_START_CHAR_PATTERN =
    new RegExp('[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ +
               i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']');

/**
 * Regular expression of characters typically used to start a second phone
 * number for the purposes of parsing. This allows us to strip off parts of the
 * number that are actually the start of another number, such as for:
 * (530) 583-6985 x302/x2303 -> the second extension here makes this actually
 * two phone numbers, (530) 583-6985 x302 and (530) 583-6985 x2303. We remove
 * the second extension so that the first number is parsed correctly.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.SECOND_NUMBER_START_PATTERN_ = /[\\\/] *x/;

/**
 * Regular expression of trailing characters that we want to remove. We remove
 * all characters that are not alpha or numerical characters. The hash character
 * is retained here, as it may signify the previous block was an extension.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.UNWANTED_END_CHAR_PATTERN_ =
    new RegExp('[^' + i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ +
               i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ + '#]+$');

/**
 * We use this pattern to check if the phone number has at least three letters
 * in it - if so, then we treat it as a number where some phone-number digits
 * are represented by letters.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_PHONE_PATTERN_ =
    /(?:.*?[A-Za-z]){3}.*/;

/**
 * Regular expression of viable phone numbers. This is location independent.
 * Checks we have at least three leading digits, and only valid punctuation,
 * alpha characters and digits in the phone number. Does not include extension
 * data. The symbol 'x' is allowed here as valid punctuation since it is often
 * used as a placeholder for carrier codes, for example in Brazilian phone
 * numbers. We also allow multiple '+' characters at the start.
 * Corresponds to the following:
 * plus_sign*([punctuation]*[digits]){3,}([punctuation]|[digits]|[alpha])*
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_ =
    '[' + i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_ + ']*(?:[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION_ + ']*[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']){3,}[' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_ +
    i18n.phonenumbers.PhoneNumberUtil.VALID_PUNCTUATION_ +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']*';

/**
 * Default extension prefix to use when formatting. This will be put in front of
 * any extension component of the number, after the main national number is
 * formatted. For example, if you wish the default extension formatting to be
 * ' extn: 3456', then you should specify ' extn: ' here as the default
 * extension prefix. This can be overridden by country-specific preferences.
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.DEFAULT_EXTN_PREFIX_ = ' ext. ';

/**
 * Regexp of all possible ways to write extensions, for use when parsing. This
 * will be run as a case-insensitive regexp match. Wide character versions are
 * also provided after each ascii version. There are two regular expressions
 * here: the more generic one starts with optional white space and ends with an
 * optional full stop (.), followed by zero or more spaces/tabs and then the
 * numbers themselves. The other one covers the special case of American numbers
 * where the extension is written with a hash at the end, such as "- 503#". Note
 * that the only capturing groups should be around the digits that you want to
 * capture as part of the extension, or else parsing will fail!
 *
 * @const
 * @type {string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.KNOWN_EXTN_PATTERNS_ =
    '[ \u00A0\\t,]*' + '(?:ext(?:ensio)?n?|\uFF45\uFF58\uFF54\uFF4E?|' +
    '[,x\uFF58#\uFF03~\uFF5E]|int|anexo|\uFF49\uFF4E\uFF54)' +
    '[:\\.\uFF0E]?[ \u00A0\\t,-]*([' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']{1,7})#?|[- ]+([' +
    i18n.phonenumbers.PhoneNumberUtil.VALID_DIGITS_ + ']{1,5})#';

/**
 * Regexp of all known extension prefixes used by different countries followed
 * by 1 or more valid digits, for use when parsing.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_ =
    new RegExp('(?:' + i18n.phonenumbers.PhoneNumberUtil.KNOWN_EXTN_PATTERNS_ +
               ')$', 'i');

/**
 * We append optionally the extension pattern to the end here, as a valid phone
 * number may have an extension prefix appended, followed by 1 or more digits.
 *
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_PATTERN_ =
    new RegExp('^' + i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_ +
               '(?:' + i18n.phonenumbers.PhoneNumberUtil.KNOWN_EXTN_PATTERNS_ +
               ')?' + '$', 'i');

/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NON_DIGITS_PATTERN_ = /\D+/;
/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_ = /(\$1)/;
/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.NP_PATTERN_ = /\$NP/;
/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.FG_PATTERN_ = /\$FG/;
/**
 * @const
 * @type {RegExp}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.CC_PATTERN_ = /\$CC/;

/**
 * INTERNATIONAL and NATIONAL formats are consistent with the definition in
 * ITU-T Recommendation E. 123. For example, the number of the Google Zurich
 * office will be written as "+41 44 668 1800" in INTERNATIONAL format, and as
 * "044 668 1800" in NATIONAL format. E164 format is as per INTERNATIONAL format
 * but with no formatting applied, e.g. +41446681800.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberFormat = {
  E164: 0,
  INTERNATIONAL: 1,
  NATIONAL: 2
};

/**
 * Type of phone numbers.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberType = {
  FIXED_LINE: 0,
  MOBILE: 1,
  // In some countries (e.g. the USA), it is impossible to distinguish between
  // fixed-line and mobile numbers by looking at the phone number itself.
  FIXED_LINE_OR_MOBILE: 2,
  // Freephone lines
  TOLL_FREE: 3,
  PREMIUM_RATE: 4,
  // The cost of this call is shared between the caller and the recipient, and
  // is hence typically less than PREMIUM_RATE calls. See
  // http://en.wikipedia.org/wiki/Shared_Cost_Service for more information.
  SHARED_COST: 5,
  // Voice over IP numbers. This includes TSoIP (Telephony Service over IP).
  VOIP: 6,
  // A personal number is associated with a particular person, and may be routed
  // to either a MOBILE or FIXED_LINE number. Some more information can be found
  // here: http://en.wikipedia.org/wiki/Personal_Numbers
  PERSONAL_NUMBER: 7,
  PAGER: 8,
  // A phone number is of type UNKNOWN when it does not fit any of the known
  // patterns for a specific country.
  UNKNOWN: 9
};

/**
 * Types of phone number matches. See detailed description beside the
 * isNumberMatch() method.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberUtil.MatchType = {
  NO_MATCH: 0,
  SHORT_NSN_MATCH: 1,
  NSN_MATCH: 2,
  EXACT_MATCH: 3
};

/**
 * Possible outcomes when testing if a PhoneNumber is possible.
 *
 * @enum {number}
 */
i18n.phonenumbers.PhoneNumberUtil.ValidationResult = {
  IS_POSSIBLE: 0,
  INVALID_COUNTRY_CODE: 1,
  TOO_SHORT: 2,
  TOO_LONG: 3
};

/**
 * Attempts to extract a possible number from the string passed in. This
 * currently strips all leading characters that could not be used to start a
 * phone number. Characters that can be used to start a phone number are defined
 * in the VALID_START_CHAR_PATTERN. If none of these characters are found in the
 * number passed in, an empty string is returned. This function also attempts to
 * strip off any alternative extensions or endings if two or more are present,
 * such as in the case of: (530) 583-6985 x302/x2303. The second extension here
 * makes this actually two phone numbers, (530) 583-6985 x302 and (530) 583-6985
 * x2303. We remove the second extension so that the first number is parsed
 * correctly.
 *
 * @param {string} number the string that might contain a phone number.
 * @return {string} the number, stripped of any non-phone-number prefix (such as
 *     'Tel:') or an empty string if no character used to start phone numbers
 *     (such as + or any digit) is found in the number.
 */
i18n.phonenumbers.PhoneNumberUtil.extractPossibleNumber = function(number) {
  /** @type {string} */
  var possibleNumber;

  /** @type {number} */
  var start = number
      .search(i18n.phonenumbers.PhoneNumberUtil.VALID_START_CHAR_PATTERN);
  if (start >= 0) {
    possibleNumber = number.substring(start);
    // Remove trailing non-alpha non-numerical characters.
    possibleNumber = possibleNumber.replace(
        i18n.phonenumbers.PhoneNumberUtil.UNWANTED_END_CHAR_PATTERN_, '');

    // Check for extra numbers at the end.
    /** @type {number} */
    var secondNumberStart = possibleNumber
        .search(i18n.phonenumbers.PhoneNumberUtil.SECOND_NUMBER_START_PATTERN_);
    if (secondNumberStart >= 0) {
      possibleNumber = possibleNumber.substring(0, secondNumberStart);
    }
  } else {
    possibleNumber = '';
  }
  return possibleNumber;
};

/**
 * Checks to see if the string of characters could possibly be a phone number at
 * all. At the moment, checks to see that the string begins with at least 3
 * digits, ignoring any punctuation commonly found in phone numbers. This method
 * does not require the number to be normalized in advance - but does assume
 * that leading non-number symbols have been removed, such as by the method
 * extractPossibleNumber.
 *
 * @param {string} number string to be checked for viability as a phone number.
 * @return {boolean} true if the number could be a phone number of some sort,
 *     otherwise false.
 */
i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber = function(number) {
  if (number.length < i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    return false;
  }
  return i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.VALID_PHONE_NUMBER_PATTERN_, number);
};

/**
 * Normalizes a string of characters representing a phone number. This performs
 * the following conversions:
 *  - Wide-ascii digits are converted to normal ASCII (European) digits.
 *  - Letters are converted to their numeric representation on a telephone
 * keypad. The keypad used here is the one defined in ITU Recommendation E.161.
 * This is only done if there are 3 or more letters in the number, to lessen the
 * risk that such letters are typos - otherwise alpha characters are stripped.
 *  - Punctuation is stripped.
 *  - Arabic-Indic numerals are converted to European numerals.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.normalize = function(number) {
  if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.VALID_ALPHA_PHONE_PATTERN_, number)) {
    return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
        i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_, true);
  } else {
    return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
        i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS, true);
  }
};

/**
 * Normalizes a string of characters representing a phone number. This is a
 * wrapper for normalize(String number) but does in-place normalization of the
 * StringBuffer provided.
 *
 * @param {!goog.string.StringBuffer} number a StringBuffer of characters
 *     representing a phone number that will be normalized in place.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeSB_ = function(number) {
  /** @type {string} */
  var normalizedNumber = i18n.phonenumbers.PhoneNumberUtil.normalize(number
      .toString());
  number.clear();
  number.append(normalizedNumber);
};

/**
 * Normalizes a string of characters representing a phone number. This converts
 * wide-ascii and arabic-indic numerals to European numerals, and strips
 * punctuation and alpha characters.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeDigitsOnly = function(number) {
  return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
      i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS, true);
};

/**
 * Converts all alpha characters in a number to their respective digits on a
 * keypad, but retains existing formatting. Also converts wide-ascii digits to
 * normal ascii digits, and converts Arabic-Indic numerals to European numerals.
 *
 * @param {string} number a string of characters representing a phone number.
 * @return {string} the normalized string version of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.convertAlphaCharactersInNumber =
  function(number) {

  return i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(number,
      i18n.phonenumbers.PhoneNumberUtil.ALL_NORMALIZATION_MAPPINGS_, false);
};

/**
 * Gets the length of the geographical area code from the national_number field
 * of the PhoneNumber object passed in, so that clients could use it to split a
 * national significant number into geographical area code and subscriber
 * number. It works in such a way that the resultant subscriber number should be
 * diallable, at least on some devices. An example of how this could be used:
 *
 * var phoneUtil = i18n.phonenumbers.PhoneNumberUtil.getInstance();
 * var number = phoneUtil.parse('16502530000', 'US');
 * var nationalSignificantNumber =
 *     i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
 * var areaCode;
 * var subscriberNumber;
 *
 * var areaCodeLength = phoneUtil.getLengthOfGeographicalAreaCode(number);
 * if (areaCodeLength > 0) {
 *   areaCode = nationalSignificantNumber.substring(0, areaCodeLength);
 *   subscriberNumber = nationalSignificantNumber.substring(areaCodeLength);
 * } else {
 *   areaCode = '';
 *   subscriberNumber = nationalSignificantNumber;
 * }
 *
 * N.B.: area code is a very ambiguous concept, so the I18N team generally
 * recommends against using it for most purposes, but recommends using the more
 * general national_number instead. Read the following carefully before deciding
 * to use this method:
 *  - geographical area codes change over time, and this method honors those
 * changes; therefore, it doesn't guarantee the stability of the result it
 * produces.
 *  - subscriber numbers may not be diallable from all devices (notably mobile
 * devices, which typically requires the full national_number to be dialled in
 * most countries).
 *  - most non-geographical numbers have no area codes.
 *  - some geographical numbers have no area codes.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber object for
 *     which clients want to know the length of the area code in the
 *     national_number field.
 * @return {number} the length of area code of the PhoneNumber object passed in.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getLengthOfGeographicalAreaCode =
  function(number) {

  if (number == null) {
    return 0;
  }
  /** @type {string} */
  var regionCode = /** @type {string} */ (this.getRegionCodeForNumber(number));
  if (!this.isValidRegionCode_(regionCode)) {
    return 0;
  }
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  // For NANPA countries, national prefix is the same as country code, but it
  // is not stored in
  // the metadata.
  if (!metadata.hasNationalPrefix() && !this.isNANPACountry(regionCode)) {
    return 0;
  }

  /** @type {i18n.phonenumbers.PhoneNumberType} */
  var type = this.getNumberTypeHelper_(
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number),
      metadata);
  // Most numbers other than the two types below have to be dialled in full.
  if (type != i18n.phonenumbers.PhoneNumberType.FIXED_LINE &&
      type != i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE) {
    return 0;
  }

  /** @type {i18n.phonenumbers.PhoneNumber} */
  var copiedProto;
  if (number.hasExtension()) {
    // We don't want to alter the proto given to us, but we don't want to
    // include the extension when we format it, so we copy it and clear the
    // extension here.
    copiedProto = new i18n.phonenumbers.PhoneNumber();
    copiedProto.mergeFrom(number);
    copiedProto.clearExtension();
  } else {
    copiedProto = number;
  }

  /** @type {string} */
  var nationalSignificantNumber = this.format(copiedProto,
      i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  /** @type {!Array.<string>} */
  var numberGroups = nationalSignificantNumber.split(
      i18n.phonenumbers.PhoneNumberUtil.NON_DIGITS_PATTERN_);
  // The pattern will start with '+COUNTRY_CODE ' so the first group will always
  // be the empty string (before the + symbol) and the second group will be the
  // country code. The third group will be area code if it's not the last group.
  // NOTE: On IE the first group that is supposed to be the empty string does
  // not appear in the array of number groups... so make the result on non-IE
  // browsers to be that of IE.
  if (numberGroups[0].length == 0) {
    numberGroups.shift();
  }
  if (numberGroups.length <= 2) {
    return 0;
  }
  return numberGroups[1].length;
};

/**
 * Normalizes a string of characters representing a phone number by replacing
 * all characters found in the accompanying map with the values therein, and
 * stripping all other characters if removeNonMatches is true.
 *
 * @param {string} number a string of characters representing a phone number.
 * @param {!Object} normalizationReplacements a mapping of characters to what
 *     they should be replaced by in the normalized version of the phone number.
 * @param {boolean} removeNonMatches indicates whether characters that are not
 *     able to be replaced should be stripped from the number. If this is false,
 *     they will be left unchanged in the number.
 * @return {string} the normalized string version of the phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_ =
  function(number, normalizationReplacements, removeNonMatches) {

  /** @type {!goog.string.StringBuffer} */
  var normalizedNumber = new goog.string.StringBuffer();
  /** @type {string} */
  var character;
  /** @type {string} */
  var newDigit;
  /** @type {number} */
  var numberLength = number.length;
  for (var i = 0; i < numberLength; ++i) {
    character = number.charAt(i);
    newDigit = normalizationReplacements[character.toUpperCase()];
    if (newDigit != null) {
      normalizedNumber.append(newDigit);
    } else if (!removeNonMatches) {
      normalizedNumber.append(character);
    }
    // If neither of the above are true, we remove this character.
  }
  return normalizedNumber.toString();
};

/**
 * Helper function to check region code is not unknown or null.
 *
 * @param {?string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the country/region that we want to get the country code for.
 * @return {boolean} true if region code is valid.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidRegionCode_ =
  function(regionCode) {

  return regionCode != null &&
      regionCode.toUpperCase() in i18n.phonenumbers.metadata.countryToMetadata;
};

/**
 * Formats a phone number in the specified format using default rules. Note that
 * this does not promise to produce a phone number that the user can dial from
 * where they are - although we do format in either 'national' or
 * 'international' format depending on what the client asks for, we do not
 * currently support a more abbreviated format, such as for users in the same
 * "area" who could potentially dial the number without area code. Note that if
 * the phone number has a country code of 0 or an otherwise invalid country
 * code, we cannot work out which formatting rules to apply so we return the
 * national significant number with no formatting applied.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.format =
  function(number, numberFormat) {

  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber = i18n.phonenumbers.PhoneNumberUtil
      .getNationalSignificantNumber(number);
  if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.E164) {
    // Early exit for E164 case since no formatting of the national number needs
    // to be applied. Extensions are not formatted.
    return this.formatNumberByFormat_(countryCode,
                                      i18n.phonenumbers.PhoneNumberFormat.E164,
                                      nationalSignificantNumber, '');
  }
  // Note getRegionCodeForCountryCode() is used because formatting information
  // for countries which share a country code is contained by only one country
  // for performance reasons. For example, for NANPA countries it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  if (!this.isValidRegionCode_(regionCode)) {
    return nationalSignificantNumber;
  }

  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(number, regionCode);
  /** @type {string} */
  var formattedNationalNumber =
      this.formatNationalNumber_(nationalSignificantNumber,
                                 regionCode,
                                 numberFormat);
  return this.formatNumberByFormat_(countryCode,
                                    numberFormat,
                                    formattedNationalNumber,
                                    formattedExtension);
};

/**
 * Formats a phone number in the specified format using client-defined
 * formatting rules. Note that if the phone number has a country code of zero or
 * an otherwise invalid country code, we cannot work out things like whether
 * there should be a national prefix applied, or how to format extensions, so we
 * return the national significant number with no formatting applied.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone  number to be
 *     formatted.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {Array.<i18n.phonenumbers.NumberFormat>} userDefinedFormats formatting
 *     rules specified by clients.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatByPattern =
  function(number, numberFormat, userDefinedFormats) {

  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
  // Note getRegionCodeForCountryCode() is used because formatting information
  // for countries which share a country code is contained by only one country
  // for performance reasons. For example, for NANPA countries it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  if (!this.isValidRegionCode_(regionCode)) {
    return nationalSignificantNumber;
  }
  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var userDefinedFormatsCopy = [];
  /** @type {number} */
  var size = userDefinedFormats.length;
  for (var i = 0; i < size; ++i) {
    /** @type {i18n.phonenumbers.NumberFormat} */
    var numFormat = userDefinedFormats[i];
    /** @type {string} */
    var nationalPrefixFormattingRule =
        numFormat.getNationalPrefixFormattingRuleOrDefault();
    if (nationalPrefixFormattingRule.length > 0) {
      // Before we do a replacement of the national prefix pattern $NP with the
      // national prefix, we need to copy the rule so that subsequent
      // replacements for different numbers have the appropriate national
      // prefix.
      /** type {i18n.phonenumbers.NumberFormat} */
      var numFormatCopy = new i18n.phonenumbers.NumberFormat();
      numFormatCopy.mergeFrom(numFormat);
      /** @type {string} */
      var nationalPrefix =
          this.getMetadataForRegion(regionCode).getNationalPrefixOrDefault();
      if (nationalPrefix.length > 0) {
        // Replace $NP with national prefix and $FG with the first group ($1).
        nationalPrefixFormattingRule = nationalPrefixFormattingRule
            .replace(i18n.phonenumbers.PhoneNumberUtil.NP_PATTERN_,
                     nationalPrefix)
            .replace(i18n.phonenumbers.PhoneNumberUtil.FG_PATTERN_, '$1');
        numFormatCopy.setNationalPrefixFormattingRule(
            nationalPrefixFormattingRule);
      } else {
        // We don't want to have a rule for how to format the national prefix if
        // there isn't one.
        numFormatCopy.clearNationalPrefixFormattingRule();
      }
      userDefinedFormatsCopy.push(numFormatCopy);
    } else {
      // Otherwise, we just add the original rule to the modified list of
      // formats.
      userDefinedFormatsCopy.push(numFormat);
    }
  }

  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(number, regionCode);
  /** @type {string} */
  var formattedNationalNumber =
      this.formatAccordingToFormats_(nationalSignificantNumber,
                                     userDefinedFormatsCopy,
                                     numberFormat);
  return this.formatNumberByFormat_(countryCode,
                                    numberFormat,
                                    formattedNationalNumber,
                                    formattedExtension);
};

/**
 * @param {i18n.phonenumbers.PhoneNumber} number
 * @param {string} carrierCode
 * @return {string}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    formatNationalNumberWithCarrierCode = function(number, carrierCode) {

  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var nationalSignificantNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
  // Note getRegionCodeForCountryCode() is used because formatting information
  // for countries which share a country code is contained by only one country
  // for performance reasons. For example, for NANPA countries it will be
  // contained in the metadata for US.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  if (!this.isValidRegionCode_(regionCode)) {
    return nationalSignificantNumber;
  }

  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(number, regionCode);
  /** @type {string} */
  var formattedNationalNumber =
      this.formatNationalNumber_(nationalSignificantNumber,
                                 regionCode,
                                 i18n.phonenumbers.PhoneNumberFormat.NATIONAL,
                                 carrierCode);
  return this.formatNumberByFormat_(
      countryCode, i18n.phonenumbers.PhoneNumberFormat.NATIONAL,
      formattedNationalNumber, formattedExtension);
};

/**
 * Formats a phone number for out-of-country dialing purpose. If no
 * countryCallingFrom is supplied, we format the number in its INTERNATIONAL
 * format. If the countryCallingFrom is the same as the country where the number
 * is from, then NATIONAL formatting will be applied.
 *
 * If the number itself has a country code of zero or an otherwise invalid
 * country code, then we return the number with no formatting applied.
 *
 * Note this function takes care of the case for calling inside of NANPA and
 * between Russia and Kazakhstan (who share the same country code). In those
 * cases, no international prefix is used. For countries which have multiple
 * international prefixes, the number in its INTERNATIONAL format will be
 * returned instead.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number to be
 *     formatted.
 * @param {string} countryCallingFrom the ISO 3166-1 two-letter country code
 *     that denotes the foreign country where the call is being placed.
 * @return {string} the formatted phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatOutOfCountryCallingNumber =
  function(number, countryCallingFrom) {

  if (!this.isValidRegionCode_(countryCallingFrom)) {
    return this.format(number,
                       i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  }
  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  /** @type {string} */
  var nationalSignificantNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
  if (!this.isValidRegionCode_(regionCode)) {
    return nationalSignificantNumber;
  }
  if (countryCode == i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_) {
    if (this.isNANPACountry(countryCallingFrom)) {
      // For NANPA countries, return the national format for these countries but
      // prefix it with the country code.
      return countryCode + ' ' +
          this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
    }
  } else if (countryCode == this.getCountryCodeForRegion(countryCallingFrom)) {
  // For countries that share a country calling code, the country code need not
  // be dialled. This also applies when dialling within a country, so this if
  // clause covers both these cases. Technically this is the case for dialling
  // from la Reunion to other overseas departments of France (French Guiana,
  // Martinique, Guadeloupe), but not vice versa - so we don't cover this edge
  // case for now and for those cases return the version including country code.
  // Details here: http://www.petitfute.com/voyage/225-info-pratiques-reunion
    return this.format(number,
                       i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
  /** @type {string} */
  var formattedNationalNumber =
      this.formatNationalNumber_(nationalSignificantNumber, regionCode,
          i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(countryCallingFrom);
  /** @type {string} */
  var internationalPrefix = metadata.getInternationalPrefixOrDefault();
  /** @type {string} */
  var formattedExtension = this.maybeGetFormattedExtension_(number, regionCode);

  // For countries that have multiple international prefixes, the international
  // format of the number is returned, unless there is a preferred international
  // prefix.
  /** @type {string} */
  var internationalPrefixForFormatting = '';
  if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
      i18n.phonenumbers.PhoneNumberUtil.UNIQUE_INTERNATIONAL_PREFIX_,
      internationalPrefix)) {
    internationalPrefixForFormatting = internationalPrefix;
  } else if (metadata.hasPreferredInternationalPrefix()) {
    internationalPrefixForFormatting =
        metadata.getPreferredInternationalPrefixOrDefault();
  }

  return internationalPrefixForFormatting != '' ?
      internationalPrefixForFormatting + ' ' + countryCode + ' ' +
          formattedNationalNumber + formattedExtension :
      this.formatNumberByFormat_(
          countryCode, i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL,
          formattedNationalNumber, formattedExtension);
};

/**
 * Formats a phone number using the original phone number format that the number
 * is parsed from. The original format is embedded in the country_code_source
 * field of the PhoneNumber object passed in. If such information is missing,
 * the number will be formatted into the NATIONAL format by default.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber that needs to
 *     be formatted in its original number format.
 * @param {string} countryCallingFrom the country whose IDD needs to be prefixed
 *     if the original number has one.
 * @return {string} the formatted phone number in its original number format.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatInOriginalFormat =
  function(number, countryCallingFrom) {

  if (!number.hasCountryCodeSource()) {
    return this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
  switch (number.getCountryCodeSource()) {
  case i18n.phonenumbers.PhoneNumber.CountryCodeSource
      .FROM_NUMBER_WITH_PLUS_SIGN:
    return this.format(number,
        i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL);
  case i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_IDD:
    return this.formatOutOfCountryCallingNumber(number, countryCallingFrom);
  case i18n.phonenumbers.PhoneNumber.CountryCodeSource
      .FROM_NUMBER_WITHOUT_PLUS_SIGN:
    return this.format(number,
        i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL).substring(1);
  case i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY:
  default:
    return this.format(number, i18n.phonenumbers.PhoneNumberFormat.NATIONAL);
  }
};

/**
 * Gets the national significant number of the a phone number. Note a national
 * significant number doesn't contain a national prefix or any formatting.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber object for
 *     which the national significant number is needed.
 * @return {string} the national significant number of the PhoneNumber object
 *     passed in.
 */
i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber =
  function(number) {

  // The leading zero in the national (significant) number of an Italian phone
  // number has a special meaning. Unlike the rest of the world, it indicates
  // the number is a landline number. There have been plans to migrate landline
  // numbers to start with the digit two since December 2000, but it has not yet
  // happened. See http://en.wikipedia.org/wiki/%2B39 for more details.
  // Other countries such as Cote d'Ivoire and Gabon use this for their mobile
  // numbers.
  /** @type {string} */
  var nationalNumber = '' + number.getNationalNumber();
  if (number.hasItalianLeadingZero() && number.getItalianLeadingZero() &&
      i18n.phonenumbers.PhoneNumberUtil.isLeadingZeroCountry(
          number.getCountryCodeOrDefault())) {
    return '0' + nationalNumber;
  }
  return nationalNumber;
};

/**
 * A helper function that is used by format and formatByPattern.
 *
 * @param {number} countryCode the country calling code.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string} formattedNationalNumber
 * @param {string} formattedExtension
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatNumberByFormat_ =
  function(countryCode, numberFormat,
           formattedNationalNumber, formattedExtension) {

  switch (numberFormat) {
  case i18n.phonenumbers.PhoneNumberFormat.E164:
    return i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + countryCode +
        formattedNationalNumber + formattedExtension;
  case i18n.phonenumbers.PhoneNumberFormat.INTERNATIONAL:
    return i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN + countryCode + ' ' +
        formattedNationalNumber + formattedExtension;
  case i18n.phonenumbers.PhoneNumberFormat.NATIONAL:
  default:
    return formattedNationalNumber + formattedExtension;
  }
};

/**
 * Note in some countries, the national number can be written in two completely
 * different ways depending on whether it forms part of the NATIONAL format or
 * INTERNATIONAL format. The numberFormat parameter here is used to specify
 * which format to use for those cases. If a carrierCode is specified, this will
 * be inserted into the formatted string to replace $CC.
 *
 * @param {string} number a string of characters representing a phone number.
 * @param {string} regionCode the ISO 3166-1 two-letter country code.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string=} opt_carrierCode
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatNationalNumber_ =
  function(number, regionCode, numberFormat, opt_carrierCode) {

  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var intlNumberFormats = metadata.intlNumberFormatArray();
  // When the intlNumberFormats exists, we use that to format national number
  // for the INTERNATIONAL format instead of using the numberDesc.numberFormats.
  /** @type {Array.<i18n.phonenumbers.NumberFormat>} */
  var availableFormats =
      (intlNumberFormats.length == 0 ||
          numberFormat == i18n.phonenumbers.PhoneNumberFormat.NATIONAL) ?
      metadata.numberFormatArray() : metadata.intlNumberFormatArray();
  return this.formatAccordingToFormats_(number, availableFormats, numberFormat,
                                        opt_carrierCode);
};

/**
 * Note that carrierCode is optional - if NULL or an empty string, no carrier
 * code replacement will take place. Carrier code replacement occurs before
 * national prefix replacement.
 *
 * @param {string} nationalNumber a string of characters representing a phone
 *     number.
 * @param {Array.<i18n.phonenumbers.NumberFormat>} availableFormats the
 *     available formats the phone number could be formatted into.
 * @param {i18n.phonenumbers.PhoneNumberFormat} numberFormat the format the
 *     phone number should be formatted into.
 * @param {string=} opt_carrierCode
 * @return {string} the formatted phone number.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatAccordingToFormats_ =
  function(nationalNumber, availableFormats, numberFormat, opt_carrierCode) {

  /** @type {i18n.phonenumbers.NumberFormat} */
  var numFormat;
  /** @type {number} */
  var l = availableFormats.length;
  for (var i = 0; i < l; ++i) {
    numFormat = availableFormats[i];
    /** @type {number} */
    var size = numFormat.leadingDigitsPatternCount();
    if (size == 0 ||
        // We always use the last leading_digits_pattern, as it is the most
        // detailed.
        nationalNumber
            .search(numFormat.getLeadingDigitsPattern(size - 1)) == 0) {
      /** @type {RegExp} */
      var patternToMatch = new RegExp(numFormat.getPattern());
      /** @type {string} */
      var numberFormatRule = numFormat.getFormatOrDefault();
      if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(patternToMatch,
                                                             nationalNumber)) {
        if (opt_carrierCode != null && opt_carrierCode.length > 0) {
          /** @type {string} */
          var domesticCarrierCodeFormattingRule =
              numFormat.getDomesticCarrierCodeFormattingRuleOrDefault();
          if (domesticCarrierCodeFormattingRule.length > 0) {
            // Replace the $CC in the formatting rule with the desired carrier
            // code.
            /** @type {string} */
            var carrierCodeFormattingRule = domesticCarrierCodeFormattingRule
                .replace(i18n.phonenumbers.PhoneNumberUtil.CC_PATTERN_,
                         opt_carrierCode);
            // Now replace the $FG in the formatting rule with the first group
            // and the carrier code combined in the appropriate way.
            numberFormatRule = numberFormatRule.replace(
                i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_,
                carrierCodeFormattingRule);
          }
        }
        /** @type {string} */
        var nationalPrefixFormattingRule =
            numFormat.getNationalPrefixFormattingRuleOrDefault();
        if (numberFormat == i18n.phonenumbers.PhoneNumberFormat.NATIONAL &&
            nationalPrefixFormattingRule != null &&
            nationalPrefixFormattingRule.length > 0) {
          return nationalNumber.replace(patternToMatch, numberFormatRule
              .replace(i18n.phonenumbers.PhoneNumberUtil.FIRST_GROUP_PATTERN_,
                       nationalPrefixFormattingRule));
        } else {
          return nationalNumber.replace(patternToMatch, numberFormatRule);
        }
      }
    }
  }

  // If no pattern above is matched, we format the number as a whole.
  return nationalNumber;
};

/**
 * Gets a valid number for the specified country.
 *
 * @param {string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the country for which an example number is needed.
 * @return {i18n.phonenumbers.PhoneNumber} a valid fixed-line number for the
 *     specified country. Returns null when the metadata does not contain such
 *     information.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getExampleNumber =
  function(regionCode) {

  return this.getExampleNumberForType(regionCode,
      i18n.phonenumbers.PhoneNumberType.FIXED_LINE);
};

/**
 * Gets a valid number, if any, for the specified country and number type.
 *
 * @param {string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the country for which an example number is needed.
 * @param {i18n.phonenumbers.PhoneNumberType} type the type of number that is
 *     needed.
 * @return {i18n.phonenumbers.PhoneNumber} a valid number for the specified
 *     country and type. Returns null when the metadata does not contain such
 *     information.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getExampleNumberForType =
  function(regionCode, type) {

  /** @type {i18n.phonenumbers.PhoneNumberDesc} */
  var desc = this.getNumberDescByType_(
      this.getMetadataForRegion(regionCode), type);
  try {
    if (desc.hasExampleNumber()) {
      return this.parse(desc.getExampleNumberOrDefault(), regionCode);
    }
  } catch (e) {
  }
  return null;
};

/**
 * Gets the formatted extension of a phone number, if the phone number had an
 * extension specified. If not, it returns an empty string.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the PhoneNumber that might have
 *     an extension.
 * @param {string} regionCode the ISO 3166-1 two-letter country code.
 * @return {string} the formatted extension if any.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeGetFormattedExtension_ =
  function(number, regionCode) {

  if (!number.hasExtension()) {
    return '';
  } else {
    return this.formatExtension_(number.getExtensionOrDefault(), regionCode);
  }
};

/**
 * Formats the extension part of the phone number by prefixing it with the
 * appropriate extension prefix. This will be the default extension prefix,
 * unless overridden by a preferred extension prefix for this country.
 *
 * @param {string} extensionDigits the extension digits.
 * @param {string} regionCode the ISO 3166-1 two-letter country code.
 * @return {string} the formatted extension.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.formatExtension_ =
  function(extensionDigits, regionCode) {

  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  if (metadata.hasPreferredExtnPrefix()) {
    return metadata.getPreferredExtnPrefix() + extensionDigits;
  } else {
    return i18n.phonenumbers.PhoneNumberUtil.DEFAULT_EXTN_PREFIX_ +
        extensionDigits;
  }
};

/**
 * @param {i18n.phonenumbers.PhoneMetadata} metadata
 * @param {i18n.phonenumbers.PhoneNumberType} type
 * @return {i18n.phonenumbers.PhoneNumberDesc}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberDescByType_ =
  function(metadata, type) {

  switch (type) {
  case i18n.phonenumbers.PhoneNumberType.PREMIUM_RATE:
    return metadata.getPremiumRate();
  case i18n.phonenumbers.PhoneNumberType.TOLL_FREE:
    return metadata.getTollFree();
  case i18n.phonenumbers.PhoneNumberType.MOBILE:
    return metadata.getMobile();
  case i18n.phonenumbers.PhoneNumberType.FIXED_LINE:
  case i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE:
    return metadata.getFixedLine();
  case i18n.phonenumbers.PhoneNumberType.SHARED_COST:
    return metadata.getSharedCost();
  case i18n.phonenumbers.PhoneNumberType.VOIP:
    return metadata.getVoip();
  case i18n.phonenumbers.PhoneNumberType.PERSONAL_NUMBER:
    return metadata.getPersonalNumber();
  case i18n.phonenumbers.PhoneNumberType.PAGER:
    return metadata.getPager();
  default:
    return metadata.getGeneralDesc();
  }
};

/**
 * Gets the type of a phone number.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to know the type.
 * @return {i18n.phonenumbers.PhoneNumberType} the type of the phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberType =
  function(number) {

  /** @type {string} */
  var regionCode = /** @type {string} */ (this.getRegionCodeForNumber(number));
  if (!this.isValidRegionCode_(regionCode)) {
    return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
  }
  /** @type {string} */
  var nationalSignificantNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
  return this.getNumberTypeHelper_(nationalSignificantNumber,
      this.getMetadataForRegion(regionCode));
};

/**
 * @param {string} nationalNumber
 * @param {i18n.phonenumbers.PhoneMetadata} metadata
 * @return {i18n.phonenumbers.PhoneNumberType}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNumberTypeHelper_ =
  function(nationalNumber, metadata) {

  /** @type {i18n.phonenumbers.PhoneNumberDesc} */
  var generalNumberDesc = metadata.getGeneralDesc();
  if (!generalNumberDesc.hasNationalNumberPattern() ||
      !this.isNumberMatchingDesc_(nationalNumber, generalNumberDesc)) {
    return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
  }

  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getPremiumRate())) {
    return i18n.phonenumbers.PhoneNumberType.PREMIUM_RATE;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getTollFree())) {
    return i18n.phonenumbers.PhoneNumberType.TOLL_FREE;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getSharedCost())) {
    return i18n.phonenumbers.PhoneNumberType.SHARED_COST;
  }
  if (this.isNumberMatchingDesc_(nationalNumber, metadata.getVoip())) {
    return i18n.phonenumbers.PhoneNumberType.VOIP;
  }
  if (this.isNumberMatchingDesc_(nationalNumber,
                                 metadata.getPersonalNumber())) {
    return i18n.phonenumbers.PhoneNumberType.PERSONAL_NUMBER;
  }
  if (this.isNumberMatchingDesc_(nationalNumber,
                                 metadata.getPager())) {
    return i18n.phonenumbers.PhoneNumberType.PAGER;
  }

  /** @type {boolean} */
  var isFixedLine = this.isNumberMatchingDesc_(nationalNumber, metadata
      .getFixedLine());
  if (isFixedLine) {
    if (metadata.getSameMobileAndFixedLinePattern()) {
      return i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE;
    } else if (this.isNumberMatchingDesc_(nationalNumber,
                                          metadata.getMobile())) {
      return i18n.phonenumbers.PhoneNumberType.FIXED_LINE_OR_MOBILE;
    }
    return i18n.phonenumbers.PhoneNumberType.FIXED_LINE;
  }
  // Otherwise, test to see if the number is mobile. Only do this if certain
  // that the patterns for mobile and fixed line aren't the same.
  if (!metadata.getSameMobileAndFixedLinePattern() &&
      this.isNumberMatchingDesc_(nationalNumber, metadata.getMobile())) {
    return i18n.phonenumbers.PhoneNumberType.MOBILE;
  }
  return i18n.phonenumbers.PhoneNumberType.UNKNOWN;
};

/**
 * @param {?string} regionCode
 * @return {i18n.phonenumbers.PhoneMetadata}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getMetadataForRegion =
  function(regionCode) {

  if (regionCode == null) {
    return null;
  }
  regionCode = regionCode.toUpperCase();
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.countryToMetadata[regionCode];
  if (metadata == null) {
    /** @type {goog.proto2.PbLiteSerializer} */
    var serializer = new goog.proto2.PbLiteSerializer();
    /** @type {Array} */
    var metadataSerialized =
        i18n.phonenumbers.metadata.countryToMetadata[regionCode];
    if (metadataSerialized == null) {
      return null;
    }
    metadata = /** @type {i18n.phonenumbers.PhoneMetadata} */ (
        serializer.deserialize(i18n.phonenumbers.PhoneMetadata.getDescriptor(),
            metadataSerialized));
    this.countryToMetadata[regionCode] = metadata;
  }
  return metadata;
};

/**
 * @param {string} nationalNumber
 * @param {i18n.phonenumbers.PhoneNumberDesc} numberDesc
 * @return {boolean}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNumberMatchingDesc_ =
  function(nationalNumber, numberDesc) {

  return i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
             numberDesc.getPossibleNumberPattern(), nationalNumber) &&
         i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
             numberDesc.getNationalNumberPattern(), nationalNumber);
};

/**
 * Tests whether a phone number matches a valid pattern. Note this doesn't
 * verify the number is actually in use, which is impossible to tell by just
 * looking at a number itself.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to validate.
 * @return {boolean} a boolean that indicates whether the number is of a valid
 *     pattern.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidNumber = function(number) {
  /** @type {string} */
  var regionCode = /** @type {string} */ (this.getRegionCodeForNumber(number));
  return this.isValidRegionCode_(regionCode) &&
      this.isValidNumberForRegion(number, regionCode);
};

/**
 * Tests whether a phone number is valid for a certain region. Note this doesn't
 * verify the number is actually in use, which is impossible to tell by just
 * looking at a number itself. If the country code is not the same as the
 * country code for the region, this immediately exits with false. After this,
 * the specific number pattern rules for the region are examined. This is useful
 * for determining for example whether a particular number is valid for Canada,
 * rather than just a valid NANPA number.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number that we want
 *     to validate.
 * @param {string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the region/country that we want to validate the phone number for.
 * @return {boolean} a boolean that indicates whether the number is of a valid
 *     pattern.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isValidNumberForRegion =
  function(number, regionCode) {

  if (number.getCountryCodeOrDefault() !=
      this.getCountryCodeForRegion(regionCode)) {
    return false;
  }
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  /** @type {i18n.phonenumbers.PhoneNumberDesc} */
  var generalNumDesc = metadata.getGeneralDesc();
  /** @type {string} */
  var nationalSignificantNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);

  // For countries where we don't have metadata for PhoneNumberDesc, we treat
  // any number passed in as a valid number if its national significant number
  // is between the minimum and maximum lengths defined by ITU for a national
  // significant number.
  if (!generalNumDesc.hasNationalNumberPattern()) {
    /** @type {number} */
    var numberLength = nationalSignificantNumber.length;
    return numberLength >
        i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_ &&
        numberLength <= i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_;
  }
  return this.getNumberTypeHelper_(nationalSignificantNumber, metadata) !=
      i18n.phonenumbers.PhoneNumberType.UNKNOWN;
};

/**
 * Returns the country/region where a phone number is from. This could be used
 * for geo-coding in the country/region level.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the phone number whose origin
 *     we want to know.
 * @return {?string} the country/region where the phone number is from, or null
 *     if no country matches this calling code.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getRegionCodeForNumber =
  function(number) {

  if (number == null) {
    return null;
  }
  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  /** @type {Array.<string>} */
  var regions =
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[countryCode];
  if (regions == null) {
    return null;
  }
  if (regions.length == 1) {
    return regions[0];
  } else {
    return this.getRegionCodeForNumberFromRegionList_(number, regions);
  }
};

/**
 * @param {i18n.phonenumbers.PhoneNumber} number
 * @param {Array.<string>} regionCodes
 * @return {?string}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    getRegionCodeForNumberFromRegionList_ = function(number, regionCodes) {

  /** @type {string} */
  var nationalNumber = '' + number.getNationalNumber();
  /** @type {string} */
  var regionCode;
  /** @type {number} */
  var regionCodesLength = regionCodes.length;
  for (var i = 0; i < regionCodesLength; i++) {
    regionCode = regionCodes[i];
    // If leadingDigits is present, use this. Otherwise, do full validation.
    /** @type {i18n.phonenumbers.PhoneMetadata} */
    var metadata = this.getMetadataForRegion(regionCode);
    if (metadata.hasLeadingDigits()) {
      if (nationalNumber.search(metadata.getLeadingDigits()) == 0) {
        return regionCode;
      }
    } else if (this.getNumberTypeHelper_(nationalNumber, metadata) !=
          i18n.phonenumbers.PhoneNumberType.UNKNOWN) {
      return regionCode;
    }
  }
  return null;
};

/**
 * Returns the region code that matches the specific country code. In the case
 * of no region code being found, ZZ will be returned. In the case of multiple
 * regions, the one designated in the metadata as the "main" country for this
 * calling code will be returned.
 *
 * @param {number} countryCode the country calling code.
 * @return {string}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getRegionCodeForCountryCode =
  function(countryCode) {

  /** @type {Array.<string>} */
  var regionCodes =
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[countryCode];
  return regionCodes == null ? 'ZZ' : regionCodes[0];
};

/**
 * Returns the country calling code for a specific region. For example, this
 * would be 1 for the United States, and 64 for New Zealand.
 *
 * @param {?string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the country/region that we want to get the country code for.
 * @return {number} the country calling code for the country/region denoted by
 *     regionCode.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getCountryCodeForRegion =
  function(regionCode) {

  if (!this.isValidRegionCode_(regionCode)) {
    return 0;
  }
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  if (metadata == null) {
    return 0;
  }
  return metadata.getCountryCodeOrDefault();
};

/**
 * Returns the national dialling prefix for a specific region. For example, this
 * would be 1 for the United States, and 0 for New Zealand. Set stripNonDigits
 * to true to strip symbols like "~" (which indicates a wait for a dialling
 * tone) from the prefix returned. If no national prefix is present, we return
 * null.
 *
 * Warning: Do not use this method for do-your-own formatting - for some
 * countries, the national dialling prefix is used only for certain types of
 * numbers. Use the library's formatting functions to prefix the national prefix
 * when required.
 *
 * @param {string} regionCode the ISO 3166-1 two-letter country code that
 *     denotes the country/region that we want to get the dialling prefix for.
 * @param {boolean} stripNonDigits true to strip non-digits from the national
 *     dialling prefix.
 * @return {?string} the dialling prefix for the country/region denoted by
 *     regionCode.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.getNddPrefixForRegion = function(
    regionCode, stripNonDigits) {
  if (!this.isValidRegionCode_(regionCode)) {
    return null;
  }
  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var metadata = this.getMetadataForRegion(regionCode);
  if (metadata == null) {
    return null;
  }
  /** @type {string} */
  var nationalPrefix = metadata.getNationalPrefixOrDefault();
  // If no national prefix was found, we return null.
  if (nationalPrefix.length == 0) {
    return null;
  }
  if (stripNonDigits) {
    // Note: if any other non-numeric symbols are ever used in national
    // prefixes, these would have to be removed here as well.
    nationalPrefix = nationalPrefix.replace('~', '');
  }
  return nationalPrefix;
};

/**
 * Check if a country is one of the countries under the North American Numbering
 * Plan Administration (NANPA).
 *
 * @param {string} regionCode the ISO 3166-1 two-letter country code.
 * @return {boolean} true if regionCode is one of the countries under NANPA.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNANPACountry =
  function(regionCode) {

  return goog.array.contains(
      i18n.phonenumbers.metadata.countryCodeToRegionCodeMap[
          i18n.phonenumbers.PhoneNumberUtil.NANPA_COUNTRY_CODE_],
      regionCode.toUpperCase());
};

/**
 * Check whether countryCode represents the country calling code from a country
 * whose national significant number could contain a leading zero. An example of
 * such a country is Italy.
 *
 * @param {number} countryCode the country calling code.
 * @return {boolean}
 */
i18n.phonenumbers.PhoneNumberUtil.isLeadingZeroCountry = function(countryCode) {
  return countryCode in
      i18n.phonenumbers.PhoneNumberUtil.LEADING_ZERO_COUNTRIES_;
};

/**
 * Convenience wrapper around isPossibleNumberWithReason. Instead of returning
 * the reason for failure, this method returns a boolean value.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the number that needs to be
 *     checked.
 * @return {boolean} true if the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumber =
  function(number) {

  return this.isPossibleNumberWithReason(number) ==
      i18n.phonenumbers.PhoneNumberUtil.ValidationResult.IS_POSSIBLE;
};

/**
 * Check whether a phone number is a possible number. It provides a more lenient
 * check than isValidNumber in the following sense:
 *
 * 1. It only checks the length of phone numbers. In particular, it doesn't
 * check starting digits of the number.
 *
 * 2. It doesn't attempt to figure out the type of the number, but uses general
 * rules which applies to all types of phone numbers in a country. Therefore, it
 * is much faster than isValidNumber.
 *
 * 3. For fixed line numbers, many countries have the concept of area code,
 * which together with subscriber number constitute the national significant
 * number. It is sometimes okay to dial the subscriber number only when dialing
 * in the same area. This function will return true if the
 * subscriber-number-only version is passed in. On the other hand, because
 * isValidNumber validates using information on both starting digits (for fixed
 * line numbers, that would most likely be area codes) and length (obviously
 * includes the length of area codes for fixed line numbers), it will return
 * false for the subscriber-number-only version.
 *
 * @param {i18n.phonenumbers.PhoneNumber} number the number that needs to be
 *     checked.
 * @return {i18n.phonenumbers.PhoneNumberUtil.ValidationResult} a
 *     ValidationResult object which indicates whether the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumberWithReason =
  function(number) {

  /** @type {number} */
  var countryCode = number.getCountryCodeOrDefault();
  // Note: For Russian Fed and NANPA numbers, we just use the rules from the
  // default region (US or Russia) since the getRegionCodeForNumber will not
  // work if the number is possible but not valid. This would need to be
  // revisited if the possible number pattern ever differed between various
  // countries within those plans.
  /** @type {string} */
  var regionCode = this.getRegionCodeForCountryCode(countryCode);
  if (!this.isValidRegionCode_(regionCode)) {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult
        .INVALID_COUNTRY_CODE;
  }
  /** @type {string} */
  var nationalNumber =
      i18n.phonenumbers.PhoneNumberUtil.getNationalSignificantNumber(number);
  /** @type {i18n.phonenumbers.PhoneNumberDesc} */
  var generalNumDesc = this.getMetadataForRegion(regionCode).getGeneralDesc();
  // Handling case of numbers with no metadata.
  if (!generalNumDesc.hasNationalNumberPattern()) {
    /** @type {number} */
    var numberLength = nationalNumber.length;
    if (numberLength < i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
      return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
    } else if (numberLength >
               i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_) {
      return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG;
    } else {
      return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.IS_POSSIBLE;
    }
  }
  /** @type {string} */
  var possibleNumberPattern =
      generalNumDesc.getPossibleNumberPatternOrDefault();
  /** @type {Array.<string> } */
  var matchedGroups = nationalNumber.match('^' + possibleNumberPattern);
  /** @type {string} */
  var firstGroup = matchedGroups ? matchedGroups[0] : '';
  if (firstGroup.length > 0) {
    return (firstGroup.length == nationalNumber.length) ?
        i18n.phonenumbers.PhoneNumberUtil.ValidationResult.IS_POSSIBLE :
        i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_LONG;
  } else {
    return i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT;
  }
};

/**
 * Check whether a phone number is a possible number given a number in the form
 * of a string, and the country where the number could be dialed from. It
 * provides a more lenient check than isValidNumber. See
 * isPossibleNumber(number) for details.
 *
 * This method first parses the number, then invokes
 * isPossibleNumber(PhoneNumber number) with the resultant PhoneNumber object.
 *
 * @param {string} number the number that needs to be checked, in the form of a
 *     string.
 * @param {string} countryDialingFrom the ISO 3166-1 two-letter country code
 *     that denotes the country that we are expecting the number to be dialed
 *     from. Note this is different from the country where the number belongs.
 *     For example, the number +1 650 253 0000 is a number that belongs to US.
 *     When written in this form, it could be dialed from any country. When it
 *     is written as 00 1 650 253 0000, it could be dialed from any country
 *     which uses an international dialling prefix of 00. When it is written as
 *     650 253 0000, it could only be dialed from within the US, and when
 *     written as 253 0000, it could only be dialed from within a smaller area
 *     in the US (Mountain View, CA, to be more specific).
 * @return {boolean} true if the number is possible.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isPossibleNumberString =
  function(number, countryDialingFrom) {

  try {
    return this.isPossibleNumber(this.parse(number, countryDialingFrom));
  } catch (e) {
    return false;
  }
};

/**
 * Attempts to extract a valid number from a phone number that is too long to be
 * valid, and resets the PhoneNumber object passed in to that valid version. If
 * no valid number could be extracted, the PhoneNumber object passed in will not
 * be modified.
 * @param {i18n.phonenumbers.PhoneNumber} number a PhoneNumber object which
 *     contains a number that is too long to be valid.
 * @return {boolean} true if a valid phone number can be successfully extracted.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.truncateTooLongNumber =
    function(number) {

  if (this.isValidNumber(number)) {
    return true;
  }
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var numberCopy = new i18n.phonenumbers.PhoneNumber();
  numberCopy.mergeFrom(number);
  /** @type {number} */
  var nationalNumber = number.getNationalNumberOrDefault();
  do {
    nationalNumber = Math.floor(nationalNumber / 10);
    numberCopy.setNationalNumber(nationalNumber);
    if (nationalNumber == 0 ||
        this.isPossibleNumberWithReason(numberCopy) ==
            i18n.phonenumbers.PhoneNumberUtil.ValidationResult.TOO_SHORT) {
      return false;
    }
  } while (!this.isValidNumber(numberCopy));
  number.setNationalNumber(nationalNumber);
  return true;
};

/**
 * Extracts country code from fullNumber, returns it and places the remaining
 * number in nationalNumber. It assumes that the leading plus sign or IDD has
 * already been removed. Returns 0 if fullNumber doesn't start with a valid
 * country code, and leaves nationalNumber unmodified.
 *
 * @param {!goog.string.StringBuffer} fullNumber
 * @param {!goog.string.StringBuffer} nationalNumber
 * @return {number}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.extractCountryCode =
  function(fullNumber, nationalNumber) {

  /** @type {string} */
  var fullNumberStr = fullNumber.toString();
  /** @type {number} */
  var potentialCountryCode;
  /** @type {number} */
  var numberLength = fullNumberStr.length;
  for (var i = 1; i <= 3 && i <= numberLength; ++i) {
    potentialCountryCode = parseInt(fullNumberStr.substring(0, i), 10);
    if (potentialCountryCode in
        i18n.phonenumbers.metadata.countryCodeToRegionCodeMap) {
      nationalNumber.append(fullNumberStr.substring(i));
      return potentialCountryCode;
    }
  }
  return 0;
};

/**
 * Tries to extract a country code from a number. This method will return zero
 * if no country code is considered to be present. Country codes are extracted
 * in the following ways:
 *  - by stripping the international dialing prefix of the country the person is
 * dialing from, if this is present in the number, and looking at the next
 * digits
 *  - by stripping the '+' sign if present and then looking at the next digits
 *  - by comparing the start of the number and the country code of the default
 * region. If the number is not considered possible for the numbering plan of
 * the default region initially, but starts with the country code of this
 * region, validation will be reattempted after stripping this country code. If
 * this number is considered a possible number, then the first digits will be
 * considered the country code and removed as such.
 *
 * It will throw a i18n.phonenumbers.Error if the number starts with a '+' but
 * the country code supplied after this does not match that of any known
 * country.
 *
 * @param {string} number non-normalized telephone number that we wish to
 *     extract a country code from - may begin with '+'.
 * @param {i18n.phonenumbers.PhoneMetadata} defaultRegionMetadata metadata
 *     about the region this number may be from.
 * @param {!goog.string.StringBuffer} nationalNumber a string buffer to store
 *     the national significant number in, in the case that a country code was
 *     extracted. The number is appended to any existing contents. If no country
 *     code was extracted, this will be left unchanged.
 * @param {boolean} storeCountryCodeSource true if the country_code_source field
 *     of phoneNumber should be populated.
 * @param {i18n.phonenumbers.PhoneNumber} phoneNumber the PhoneNumber object
 *     that needs to be populated with country code and country code source.
 *     Note the country code is always populated, whereas country code source is
 *     only populated when keepCountryCodeSource is true.
 * @return {number} the country code extracted or 0 if none could be extracted.
 * @throws {i18n.phonenumbers.Error}
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeExtractCountryCode =
  function(number, defaultRegionMetadata, nationalNumber,
           storeCountryCodeSource, phoneNumber) {

  if (number.length == 0) {
    return 0;
  }
  /** @type {!goog.string.StringBuffer} */
  var fullNumber = new goog.string.StringBuffer(number);
  // Set the default prefix to be something that will never match.
  /** @type {?string} */
  var possibleCountryIddPrefix;
  if (defaultRegionMetadata != null) {
    possibleCountryIddPrefix = defaultRegionMetadata.getInternationalPrefix();
  }
  if (possibleCountryIddPrefix == null) {
    possibleCountryIddPrefix = 'NonMatch';
  }

  /** @type {i18n.phonenumbers.PhoneNumber.CountryCodeSource} */
  var countryCodeSource = this.maybeStripInternationalPrefixAndNormalize(
      fullNumber, possibleCountryIddPrefix);
  if (storeCountryCodeSource) {
    phoneNumber.setCountryCodeSource(countryCodeSource);
  }
  if (countryCodeSource !=
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY) {
    if (fullNumber.getLength() <
        i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
      throw i18n.phonenumbers.Error.TOO_SHORT_AFTER_IDD;
    }
    /** @type {number} */
    var potentialCountryCode = this.extractCountryCode(fullNumber,
                                                       nationalNumber);
    if (potentialCountryCode != 0) {
      phoneNumber.setCountryCode(potentialCountryCode);
      return potentialCountryCode;
    }

    // If this fails, they must be using a strange country code that we don't
    // recognize, or that doesn't exist.
    throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
  } else if (defaultRegionMetadata != null) {
    // Check to see if the number is valid for the default region already. If
    // not, we check to see if the country code for the default region is
    // present at the start of the number.
    /** @type {i18n.phonenumbers.PhoneNumberDesc} */
    var generalDesc = defaultRegionMetadata.getGeneralDesc();
    /** @type {RegExp} */
    var validNumberPattern = new RegExp(generalDesc.getNationalNumberPattern());
    if (!i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
        validNumberPattern, fullNumber.toString())) {
      /** @type {number} */
      var defaultCountryCode = defaultRegionMetadata.getCountryCodeOrDefault();
      /** @type {string} */
      var defaultCountryCodeString = '' + defaultCountryCode;
      /** @type {string} */
      var normalizedNumber = fullNumber.toString();
      if (goog.string.startsWith(normalizedNumber, defaultCountryCodeString)) {
        // If so, strip this, and see if the resultant number is valid.
        /** @type {!goog.string.StringBuffer} */
        var potentialNationalNumber = new goog.string.StringBuffer(
            normalizedNumber.substring(defaultCountryCodeString.length));
        this.maybeStripNationalPrefix(potentialNationalNumber,
            defaultRegionMetadata.getNationalPrefixForParsing(),
            defaultRegionMetadata.getNationalPrefixTransformRule(),
            validNumberPattern);
        /** @type {string} */
        var potentialNationalNumberStr = potentialNationalNumber.toString();
        /** @type {Array.<string> } */
        var matchedGroups = potentialNationalNumberStr.match(
            '^' + generalDesc.getPossibleNumberPattern());
        /** @type {number} */
        var possibleNumberMatchedLength = matchedGroups &&
            matchedGroups[0] != null && matchedGroups[0].length || 0;
        // If the resultant number is either valid, or still too long even with
        // the country code stripped, we consider this a better result and keep
        // the potential national number.
        if (i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(
            validNumberPattern, potentialNationalNumberStr) ||
            possibleNumberMatchedLength > 0 &&
            possibleNumberMatchedLength != potentialNationalNumberStr.length) {
          nationalNumber.append(potentialNationalNumberStr);
          if (storeCountryCodeSource) {
            phoneNumber.setCountryCodeSource(
                i18n.phonenumbers.PhoneNumber.CountryCodeSource
                    .FROM_NUMBER_WITHOUT_PLUS_SIGN);
          }
          phoneNumber.setCountryCode(defaultCountryCode);
          return defaultCountryCode;
        }
      }
    }
  }
  // No country code present.
  phoneNumber.setCountryCode(0);
  return 0;
};

/**
 * Strips the IDD from the start of the number if present. Helper function used
 * by maybeStripInternationalPrefixAndNormalize.
 *
 * @param {RegExp} iddPattern the regular expression for the international
 *     prefix.
 * @param {!goog.string.StringBuffer} number the phone number that we wish to
 *     strip any international dialing prefix from.
 * @return {boolean} true if an international prefix was present.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parsePrefixAsIdd_ =
  function(iddPattern, number) {

  /** @type {string} */
  var numberStr = number.toString();
  if (numberStr.search(iddPattern) == 0) {
    /** @type {number} */
    var matchEnd = numberStr.match(iddPattern)[0].length;
    /** @type {Array.<string> } */
    var matchedGroups = numberStr.substring(matchEnd).match(
        i18n.phonenumbers.PhoneNumberUtil.CAPTURING_DIGIT_PATTERN_);
    if (matchedGroups && matchedGroups[1] != null &&
        matchedGroups[1].length > 0) {
      /** @type {string} */
      var normalizedGroup = i18n.phonenumbers.PhoneNumberUtil.normalizeHelper_(
          matchedGroups[1], i18n.phonenumbers.PhoneNumberUtil.DIGIT_MAPPINGS,
          true);
      if (normalizedGroup == '0') {
        return false;
      }
    }
    number.clear();
    number.append(numberStr.substring(matchEnd));
    return true;
  }
  return false;
};

/**
 * Strips any international prefix (such as +, 00, 011) present in the number
 * provided, normalizes the resulting number, and indicates if an international
 * prefix was present.
 *
 * @param {!goog.string.StringBuffer} number the non-normalized telephone number
 *     that we wish to strip any international dialing prefix from.
 * @param {string} possibleIddPrefix the international direct dialing prefix
 *     from the country we think this number may be dialed in.
 * @return {i18n.phonenumbers.PhoneNumber.CountryCodeSource} the corresponding
 *     CountryCodeSource if an international dialing prefix could be removed
 *     from the number, otherwise CountryCodeSource.FROM_DEFAULT_COUNTRY if
 *     the number did not seem to be in international format.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.
    maybeStripInternationalPrefixAndNormalize = function(number,
                                                         possibleIddPrefix) {
  /** @type {string} */
  var numberStr = number.toString();
  if (numberStr.length == 0) {
    return i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY;
  }
  // Check to see if the number begins with one or more plus signs.
  if (i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_PATTERN_.test(numberStr)) {
    numberStr = numberStr.replace(
        i18n.phonenumbers.PhoneNumberUtil.PLUS_CHARS_PATTERN_, '');
    // Can now normalize the rest of the number since we've consumed the "+"
    // sign at the start.
    number.clear();
    number.append(i18n.phonenumbers.PhoneNumberUtil.normalize(numberStr));
    return i18n.phonenumbers.PhoneNumber.CountryCodeSource
        .FROM_NUMBER_WITH_PLUS_SIGN;
  }
  // Attempt to parse the first digits as an international prefix.
  /** @type {RegExp} */
  var iddPattern = new RegExp(possibleIddPrefix);
  if (this.parsePrefixAsIdd_(iddPattern, number)) {
    i18n.phonenumbers.PhoneNumberUtil.normalizeSB_(number);
    return i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_IDD;
  }
  // If still not found, then try and normalize the number and then try again.
  // This shouldn't be done before, since non-numeric characters (+ and ~) may
  // legally be in the international prefix.
  i18n.phonenumbers.PhoneNumberUtil.normalizeSB_(number);
  return this.parsePrefixAsIdd_(iddPattern, number) ?
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_NUMBER_WITH_IDD :
      i18n.phonenumbers.PhoneNumber.CountryCodeSource.FROM_DEFAULT_COUNTRY;
};

/**
 * Strips any national prefix (such as 0, 1) present in the number provided.
 *
 * @param {!goog.string.StringBuffer} number the normalized telephone number
 *     that we wish to strip any national dialing prefix from.
 * @param {?string} possibleNationalPrefix a regex that represents the national
 *     direct dialing prefix from the country we think this number may be dialed
 *     in.
 * @param {?string} transformRule the string that specifies how number should be
 *     transformed according to the regex specified in possibleNationalPrefix.
 * @param {RegExp} nationalNumberRule a regular expression that specifies what a
 *     valid phonenumber from this region should look like after any national
 *     prefix was stripped or transformed.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeStripNationalPrefix =
  function(number, possibleNationalPrefix, transformRule, nationalNumberRule) {

  /** @type {string} */
  var numberStr = number.toString();
  /** @type {number} */
  var numberLength = numberStr.length;
  if (numberLength == 0 || possibleNationalPrefix == null ||
      possibleNationalPrefix.length == 0) {
    // Early return for numbers of zero length.
    return;
  }
  // Attempt to parse the first digits as a national prefix.
  /** @type {RegExp} */
  var re = new RegExp('^' + possibleNationalPrefix);
  /** @type {Array.<string>} */
  var m = re.exec(numberStr);
  if (m) {
    /** @type {string} */
    var transformedNumber;
    // m[1] == null implies nothing was captured by the capturing groups in
    // possibleNationalPrefix; therefore, no transformation is necessary, and
    // we just remove the national prefix.
    if (transformRule == null || transformRule.length == 0 || m[1] == null ||
        m[1].length == 0) {
      transformedNumber = numberStr.substring(m[0].length);
    } else {
      transformedNumber = numberStr.replace(re, transformRule);
    }
    // Check that the resultant number is viable. If not, return.
    if (!i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_(nationalNumberRule,
        transformedNumber)) {
      return;
    }
    number.clear();
    number.append(transformedNumber);
  }
};

/**
 * Strips any extension (as in, the part of the number dialled after the call is
 * connected, usually indicated with extn, ext, x or similar) from the end of
 * the number, and returns it.
 *
 * @param {!goog.string.StringBuffer} number the non-normalized telephone number
 *     that we wish to strip the extension from.
 * @return {string} the phone extension.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.maybeStripExtension =
  function(number) {

  /** @type {string} */
  var numberStr = number.toString();
  /** @type {number} */
  var mStart =
      numberStr.search(i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_);
  // If we find a potential extension, and the number preceding this is a viable
  // number, we assume it is an extension.
  if (mStart >= 0 && i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber(
        numberStr.substring(0, mStart))) {
    // The numbers are captured into groups in the regular expression.
    /** @type {Array.<string>} */
    var matchedGroups =
        numberStr.match(i18n.phonenumbers.PhoneNumberUtil.EXTN_PATTERN_);
    /** @type {number} */
    var matchedGroupsLength = matchedGroups.length;
    for (var i = 1; i < matchedGroupsLength; ++i) {
      if (matchedGroups[i] != null && matchedGroups[i].length > 0) {
        number.clear();
        number.append(numberStr.substring(0, mStart));
        return matchedGroups[i];
      }
    }
  }
  return '';
};

/**
 * Parses a string and returns it in proto buffer format. This method will throw
 * a i18n.phonenumbers.Error if the number is not considered to be a possible
 * number. Note that validation of whether the number is actually a valid number
 * for a particular country/region is not performed. This can be done separately
 * with isValidNumber.
 *
 * @param {string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {?string} defaultCountry the ISO 3166-1 two-letter country code that
 *     denotes the country that we are expecting the number to be from. This is
 *     only used if the number being parsed is not written in international
 *     format. The country code for the number in this case would be stored as
 *     that of the default country supplied.  If the number is guaranteed to
 *     start with a '+' followed by the country code, then 'ZZ' or null can be
 *     supplied.
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error} if the string is not considered to be a
 *     viable phone number or if no default country was supplied and the number
 *     is not in international format (does not start with +).
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parse = function(numberToParse,
                                                             defaultCountry) {
  if (!this.isValidRegionCode_(defaultCountry)) {
    if (numberToParse.length > 0 && numberToParse.charAt(0) !=
        i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
      throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
    }
  }
  return this.parseHelper_(numberToParse, defaultCountry, false);
};

/**
 * Parses a string and returns it in proto buffer format. This method differs
 * from parse() in that it always populates the raw_input field of the protocol
 * buffer with numberToParse as well as the country_code_source field.
 *
 * @param {string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {?string} defaultCountry the ISO 3166-1 two-letter country code that
 *     denotes the country that we are expecting the number to be from. This is
 *     only used if the number being parsed is not written in international
 *     format. The country code for the number in this case would be stored as
 *     that of the default country supplied.
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error} if the string is not considered to be a
 *     viable phone number or if no default country was supplied and the number
 *     is not in international format (does not start with +).
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parseAndKeepRawInput =
  function(numberToParse, defaultCountry) {

  if (!this.isValidRegionCode_(defaultCountry)) {
    if (numberToParse.length > 0 && numberToParse.charAt(0) !=
        i18n.phonenumbers.PhoneNumberUtil.PLUS_SIGN) {
      throw i18n.phonenumbers.Error.INVALID_COUNTRY_CODE;
    }
  }
  return this.parseHelper_(numberToParse, defaultCountry, true);
};

/**
 * Parses a string and returns it in proto buffer format. This method is the
 * same as the public parse() method, with the exception that it allows the
 * default country to be null, for use by isNumberMatch().
 *
 * @param {string} numberToParse number that we are attempting to parse. This
 *     can contain formatting such as +, ( and -, as well as a phone number
 *     extension.
 * @param {?string} defaultCountry the ISO 3166-1 two-letter country code that
 *     denotes the country that we are expecting the number to be from. This is
 *     only used if the number being parsed is not written in international
 *     format. The country code for the number in this case would be stored as
 *     that of the default country supplied.
 * @param {boolean} keepRawInput whether to populate the raw_input field of the
 *     phoneNumber with numberToParse.
 * @return {i18n.phonenumbers.PhoneNumber} a phone number proto buffer filled
 *     with the parsed number.
 * @throws {i18n.phonenumbers.Error}
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.parseHelper_ =
  function(numberToParse, defaultCountry, keepRawInput) {

  // Extract a possible number from the string passed in (this strips leading
  // characters that could not be the start of a phone number.)
  /** @type {string} */
  var number =
      i18n.phonenumbers.PhoneNumberUtil.extractPossibleNumber(numberToParse);
  if (!i18n.phonenumbers.PhoneNumberUtil.isViablePhoneNumber(number)) {
    throw i18n.phonenumbers.Error.NOT_A_NUMBER;
  }

  /** @type {i18n.phonenumbers.PhoneNumber} */
  var phoneNumber = new i18n.phonenumbers.PhoneNumber();
  if (keepRawInput) {
    phoneNumber.setRawInput(numberToParse);
  }
  /** @type {!goog.string.StringBuffer} */
  var nationalNumber = new goog.string.StringBuffer(number);
  // Attempt to parse extension first, since it doesn't require
  // country-specific data and we want to have the non-normalised number here.
  /** @type {string} */
  var extension = this.maybeStripExtension(nationalNumber);
  if (extension.length > 0) {
    phoneNumber.setExtension(extension);
  }

  /** @type {i18n.phonenumbers.PhoneMetadata} */
  var countryMetadata = this.getMetadataForRegion(defaultCountry);
  // Check to see if the number is given in international format so we know
  // whether this number is from the default country or not.
  /** @type {!goog.string.StringBuffer} */
  var normalizedNationalNumber = new goog.string.StringBuffer();
  /** @type {number} */
  var countryCode = this.maybeExtractCountryCode(nationalNumber.toString(),
      countryMetadata, normalizedNationalNumber, keepRawInput, phoneNumber);
  if (countryCode != 0) {
    /** @type {string} */
    var phoneNumberRegion = this.getRegionCodeForCountryCode(countryCode);
    if (phoneNumberRegion != defaultCountry) {
      countryMetadata = this.getMetadataForRegion(phoneNumberRegion);
    }
  } else {
    // If no extracted country code, use the region supplied instead. The
    // national number is just the normalized version of the number we were
    // given to parse.
    i18n.phonenumbers.PhoneNumberUtil.normalizeSB_(nationalNumber);
    normalizedNationalNumber.append(nationalNumber.toString());
    if (defaultCountry != null) {
      countryCode = countryMetadata.getCountryCodeOrDefault();
      phoneNumber.setCountryCode(countryCode);
    } else if (keepRawInput) {
      phoneNumber.clearCountryCodeSource();
    }
  }
  if (normalizedNationalNumber.getLength() <
      i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_SHORT_NSN;
  }

  if (countryMetadata != null) {
    /** @type {RegExp} */
    var validNumberPattern =
        new RegExp(countryMetadata.getGeneralDesc().getNationalNumberPattern());
    this.maybeStripNationalPrefix(normalizedNationalNumber, countryMetadata
        .getNationalPrefixForParsing(), countryMetadata
        .getNationalPrefixTransformRule(), validNumberPattern);
  }
  /** @type {string} */
  var normalizedNationalNumberStr = normalizedNationalNumber.toString();
  /** @type {number} */
  var lengthOfNationalNumber = normalizedNationalNumberStr.length;
  if (lengthOfNationalNumber <
      i18n.phonenumbers.PhoneNumberUtil.MIN_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_SHORT_NSN;
  }
  if (lengthOfNationalNumber >
      i18n.phonenumbers.PhoneNumberUtil.MAX_LENGTH_FOR_NSN_) {
    throw i18n.phonenumbers.Error.TOO_LONG;
  }
  if (normalizedNationalNumberStr.charAt(0) == '0' &&
      i18n.phonenumbers.PhoneNumberUtil.isLeadingZeroCountry(countryCode)) {
    phoneNumber.setItalianLeadingZero(true);
  }
  phoneNumber.setNationalNumber(parseInt(normalizedNationalNumberStr, 10));
  return phoneNumber;
};

/**
 * Takes two phone numbers and compares them for equality.
 *
 * Returns EXACT_MATCH if the country code, NSN, presence of a leading zero for
 * Italian numbers and any extension present are the same. Returns NSN_MATCH if
 * either or both has no country specified, and the NSNs and extensions are the
 * same. Returns SHORT_NSN_MATCH if either or both has no country specified, or
 * the country specified is the same, and one NSN could be a shorter version of
 * the other number. This includes the case where one has an extension
 * specified, and the other does not. Returns NO_MATCH otherwise. For example,
 * the numbers +1 345 657 1234 and 657 1234 are a SHORT_NSN_MATCH. The numbers
 * +1 345 657 1234 and 345 657 are a NO_MATCH.
 *
 * @param {i18n.phonenumbers.PhoneNumber|string} firstNumberIn first number to
 *     compare. If it is a string it can contain formatting, and can have
 *     country code specified with + at the start.
 * @param {i18n.phonenumbers.PhoneNumber|string} secondNumberIn second number to
 *     compare. If it is a string it can contain formatting, and can have
 *     country code specified with + at the start.
 * @return {i18n.phonenumbers.PhoneNumberUtil.MatchType} NO_MATCH,
 *     SHORT_NSN_MATCH, NSN_MATCH or EXACT_MATCH depending on the level of
 *     equality of the two numbers, described in the method definition.
 * @throws {i18n.phonenumbers.Error} if either number is not considered to be
 *     a viable phone number.
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNumberMatch =
  function(firstNumberIn, secondNumberIn) {

  /** @type {i18n.phonenumbers.PhoneNumber} */
  var firstNumber;
  /** @type {i18n.phonenumbers.PhoneNumber} */
  var secondNumber;
  // If the input arguements are strings parse them to a proto buffer format.
  // Else make copies of the phone numbers so that the numbers passed in are not
  // edited.
  if (typeof firstNumberIn == 'string') {
    firstNumber = this.parseHelper_(firstNumberIn, null, false);
  } else {
    firstNumber = new i18n.phonenumbers.PhoneNumber();
    firstNumber.mergeFrom(firstNumberIn);
  }
  if (typeof secondNumberIn == 'string') {
    secondNumber = this.parseHelper_(secondNumberIn, null, false);
  } else {
    secondNumber = new i18n.phonenumbers.PhoneNumber();
    secondNumber.mergeFrom(secondNumberIn);
  }
  // First clear raw_input and country_code_source field and any empty-string
  // extensions so that
  // we can use the PhoneNumber.exactlySameAs() method.
  firstNumber.clearRawInput();
  firstNumber.clearCountryCodeSource();
  secondNumber.clearRawInput();
  secondNumber.clearCountryCodeSource();
  if (firstNumber.hasExtension() && firstNumber.getExtension().length == 0) {
    firstNumber.clearExtension();
  }
  if (secondNumber.hasExtension() && secondNumber.getExtension().length == 0) {
    secondNumber.clearExtension();
  }

  // Early exit if both had extensions and these are different.
  if (firstNumber.hasExtension() && secondNumber.hasExtension() &&
      firstNumber.getExtension() != secondNumber.getExtension()) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
  }
  /** @type {number} */
  var firstNumberCountryCode = firstNumber.getCountryCodeOrDefault();
  /** @type {number} */
  var secondNumberCountryCode = secondNumber.getCountryCodeOrDefault();
  // Both had country code specified.
  if (firstNumberCountryCode != 0 && secondNumberCountryCode != 0) {
    if (firstNumber.exactlySameAs(secondNumber)) {
      return i18n.phonenumbers.PhoneNumberUtil.MatchType.EXACT_MATCH;
    } else if (firstNumberCountryCode == secondNumberCountryCode &&
        this.isNationalNumberSuffixOfTheOther_(firstNumber, secondNumber)) {
      // A SHORT_NSN_MATCH occurs if there is a difference because of the
      // presence or absence of an 'Italian leading zero', the presence or
      // absence of an extension, or one NSN being a shorter variant of the
      // other.
      return i18n.phonenumbers.PhoneNumberUtil.MatchType.SHORT_NSN_MATCH;
    }
    // This is not a match.
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
  }
  // Checks cases where one or both country codes were not specified. To make
  // equality checks easier, we first set the country codes to be equal.
  firstNumber.setCountryCode(0);
  secondNumber.setCountryCode(0);
  // If all else was the same, then this is an NSN_MATCH.
  if (firstNumber.exactlySameAs(secondNumber)) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.NSN_MATCH;
  }
  if (this.isNationalNumberSuffixOfTheOther_(firstNumber, secondNumber)) {
    return i18n.phonenumbers.PhoneNumberUtil.MatchType.SHORT_NSN_MATCH;
  }
  return i18n.phonenumbers.PhoneNumberUtil.MatchType.NO_MATCH;
};

/**
 * Returns true when one national number is the suffix of the other or both are
 * the same.
 *
 * @param {i18n.phonenumbers.PhoneNumber} firstNumber the first PhoneNumber
 *     object.
 * @param {i18n.phonenumbers.PhoneNumber} secondNumber the second PhoneNumber
 *     object.
 * @return {boolean} true if one PhoneNumber is the suffix of the other one.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.prototype.isNationalNumberSuffixOfTheOther_ =
  function(firstNumber, secondNumber) {

  /** @type {string} */
  var firstNumberNationalNumber = '' + firstNumber.getNationalNumber();
  /** @type {string} */
  var secondNumberNationalNumber = '' + secondNumber.getNationalNumber();
  // Note that endsWith returns true if the numbers are equal.
  return goog.string.endsWith(firstNumberNationalNumber,
                              secondNumberNationalNumber) ||
         goog.string.endsWith(secondNumberNationalNumber,
                              firstNumberNationalNumber);
};

/**
 * Check whether the entire input sequence can be matched against the regular
 * expression.
 *
 * @param {RegExp|string} regex the regular expression to match against.
 * @param {string} str the string to test.
 * @return {boolean} true if str can be matched entirely against regex.
 * @private
 */
i18n.phonenumbers.PhoneNumberUtil.matchesEntirely_ = function(regex, str) {
  /** @type {Array.<string>} */
  var matchedGroups = str.match(regex);
  if (matchedGroups && matchedGroups[0].length == str.length) {
    return true;
  }
  return false;
};

/**
 * @param {i18n.phonenumbers.PhoneNumber} other
 * @return {boolean}
 */
i18n.phonenumbers.PhoneNumber.prototype.exactlySameAs = function(other) {
  return other != null &&
      this.getCountryCode() == other.getCountryCode() &&
      this.getNationalNumber() == other.getNationalNumber() &&
      this.getExtension() == other.getExtension() &&
      this.getItalianLeadingZero() == other.getItalianLeadingZero() &&
      this.getRawInput() == other.getRawInput() &&
      this.getCountryCodeSource() == other.getCountryCodeSource();
};

/**
 * @param {i18n.phonenumbers.PhoneNumberDesc} other
 * @return {boolean}
 */
i18n.phonenumbers.PhoneNumberDesc.prototype.exactlySameAs = function(other) {
  return other != null &&
      this.getNationalNumberPattern() == other.getNationalNumberPattern() &&
      this.getPossibleNumberPattern() == other.getPossibleNumberPattern() &&
      this.getExampleNumber() == other.getExampleNumber();
};

/**
 * @param {i18n.phonenumbers.PhoneNumber} other
 * @return {i18n.phonenumbers.PhoneNumber}
 * @suppress {accessControls}
 */
i18n.phonenumbers.PhoneNumber.prototype.mergeFrom = function(other) {
  if (other) {
    this.values_ = goog.cloneObject(other.values_);
  }
  return this;
};

/**
 * @param {i18n.phonenumbers.NumberFormat} other
 * @return {i18n.phonenumbers.NumberFormat}
 * @suppress {accessControls}
 */
i18n.phonenumbers.NumberFormat.prototype.mergeFrom = function(other) {
  if (other) {
    this.values_ = goog.cloneObject(other.values_);
  }
  return this;
};


