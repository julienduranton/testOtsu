(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process){
// https://github.com/electron/electron/issues/2288
function isElectron() {
    // Renderer process
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }

    // Main process
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }

    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }

    return false;
}

module.exports = isElectron;

}).call(this,require('_process'))
},{"_process":1}],3:[function(require,module,exports){
/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

var runtime = (function (exports) {
  "use strict";

  var Op = Object.prototype;
  var hasOwn = Op.hasOwnProperty;
  var undefined; // More compressible than void 0.
  var $Symbol = typeof Symbol === "function" ? Symbol : {};
  var iteratorSymbol = $Symbol.iterator || "@@iterator";
  var asyncIteratorSymbol = $Symbol.asyncIterator || "@@asyncIterator";
  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";

  function define(obj, key, value) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
    return obj[key];
  }
  try {
    // IE 8 has a broken Object.defineProperty that only works on DOM objects.
    define({}, "");
  } catch (err) {
    define = function(obj, key, value) {
      return obj[key] = value;
    };
  }

  function wrap(innerFn, outerFn, self, tryLocsList) {
    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
    var generator = Object.create(protoGenerator.prototype);
    var context = new Context(tryLocsList || []);

    // The ._invoke method unifies the implementations of the .next,
    // .throw, and .return methods.
    generator._invoke = makeInvokeMethod(innerFn, self, context);

    return generator;
  }
  exports.wrap = wrap;

  // Try/catch helper to minimize deoptimizations. Returns a completion
  // record like context.tryEntries[i].completion. This interface could
  // have been (and was previously) designed to take a closure to be
  // invoked without arguments, but in all the cases we care about we
  // already have an existing method we want to call, so there's no need
  // to create a new function object. We can even get away with assuming
  // the method takes exactly one argument, since that happens to be true
  // in every case, so we don't have to touch the arguments object. The
  // only additional allocation required is the completion record, which
  // has a stable shape and so hopefully should be cheap to allocate.
  function tryCatch(fn, obj, arg) {
    try {
      return { type: "normal", arg: fn.call(obj, arg) };
    } catch (err) {
      return { type: "throw", arg: err };
    }
  }

  var GenStateSuspendedStart = "suspendedStart";
  var GenStateSuspendedYield = "suspendedYield";
  var GenStateExecuting = "executing";
  var GenStateCompleted = "completed";

  // Returning this object from the innerFn has the same effect as
  // breaking out of the dispatch switch statement.
  var ContinueSentinel = {};

  // Dummy constructor functions that we use as the .constructor and
  // .constructor.prototype properties for functions that return Generator
  // objects. For full spec compliance, you may wish to configure your
  // minifier not to mangle the names of these two functions.
  function Generator() {}
  function GeneratorFunction() {}
  function GeneratorFunctionPrototype() {}

  // This is a polyfill for %IteratorPrototype% for environments that
  // don't natively support it.
  var IteratorPrototype = {};
  IteratorPrototype[iteratorSymbol] = function () {
    return this;
  };

  var getProto = Object.getPrototypeOf;
  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
  if (NativeIteratorPrototype &&
      NativeIteratorPrototype !== Op &&
      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
    // This environment has a native %IteratorPrototype%; use it instead
    // of the polyfill.
    IteratorPrototype = NativeIteratorPrototype;
  }

  var Gp = GeneratorFunctionPrototype.prototype =
    Generator.prototype = Object.create(IteratorPrototype);
  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
  GeneratorFunctionPrototype.constructor = GeneratorFunction;
  GeneratorFunction.displayName = define(
    GeneratorFunctionPrototype,
    toStringTagSymbol,
    "GeneratorFunction"
  );

  // Helper for defining the .next, .throw, and .return methods of the
  // Iterator interface in terms of a single ._invoke method.
  function defineIteratorMethods(prototype) {
    ["next", "throw", "return"].forEach(function(method) {
      define(prototype, method, function(arg) {
        return this._invoke(method, arg);
      });
    });
  }

  exports.isGeneratorFunction = function(genFun) {
    var ctor = typeof genFun === "function" && genFun.constructor;
    return ctor
      ? ctor === GeneratorFunction ||
        // For the native GeneratorFunction constructor, the best we can
        // do is to check its .name property.
        (ctor.displayName || ctor.name) === "GeneratorFunction"
      : false;
  };

  exports.mark = function(genFun) {
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
    } else {
      genFun.__proto__ = GeneratorFunctionPrototype;
      define(genFun, toStringTagSymbol, "GeneratorFunction");
    }
    genFun.prototype = Object.create(Gp);
    return genFun;
  };

  // Within the body of any async function, `await x` is transformed to
  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
  // `hasOwn.call(value, "__await")` to determine if the yielded value is
  // meant to be awaited.
  exports.awrap = function(arg) {
    return { __await: arg };
  };

  function AsyncIterator(generator, PromiseImpl) {
    function invoke(method, arg, resolve, reject) {
      var record = tryCatch(generator[method], generator, arg);
      if (record.type === "throw") {
        reject(record.arg);
      } else {
        var result = record.arg;
        var value = result.value;
        if (value &&
            typeof value === "object" &&
            hasOwn.call(value, "__await")) {
          return PromiseImpl.resolve(value.__await).then(function(value) {
            invoke("next", value, resolve, reject);
          }, function(err) {
            invoke("throw", err, resolve, reject);
          });
        }

        return PromiseImpl.resolve(value).then(function(unwrapped) {
          // When a yielded Promise is resolved, its final value becomes
          // the .value of the Promise<{value,done}> result for the
          // current iteration.
          result.value = unwrapped;
          resolve(result);
        }, function(error) {
          // If a rejected Promise was yielded, throw the rejection back
          // into the async generator function so it can be handled there.
          return invoke("throw", error, resolve, reject);
        });
      }
    }

    var previousPromise;

    function enqueue(method, arg) {
      function callInvokeWithMethodAndArg() {
        return new PromiseImpl(function(resolve, reject) {
          invoke(method, arg, resolve, reject);
        });
      }

      return previousPromise =
        // If enqueue has been called before, then we want to wait until
        // all previous Promises have been resolved before calling invoke,
        // so that results are always delivered in the correct order. If
        // enqueue has not been called before, then it is important to
        // call invoke immediately, without waiting on a callback to fire,
        // so that the async generator function has the opportunity to do
        // any necessary setup in a predictable way. This predictability
        // is why the Promise constructor synchronously invokes its
        // executor callback, and why async functions synchronously
        // execute code before the first await. Since we implement simple
        // async functions in terms of async generators, it is especially
        // important to get this right, even though it requires care.
        previousPromise ? previousPromise.then(
          callInvokeWithMethodAndArg,
          // Avoid propagating failures to Promises returned by later
          // invocations of the iterator.
          callInvokeWithMethodAndArg
        ) : callInvokeWithMethodAndArg();
    }

    // Define the unified helper method that is used to implement .next,
    // .throw, and .return (see defineIteratorMethods).
    this._invoke = enqueue;
  }

  defineIteratorMethods(AsyncIterator.prototype);
  AsyncIterator.prototype[asyncIteratorSymbol] = function () {
    return this;
  };
  exports.AsyncIterator = AsyncIterator;

  // Note that simple async functions are implemented on top of
  // AsyncIterator objects; they just return a Promise for the value of
  // the final result produced by the iterator.
  exports.async = function(innerFn, outerFn, self, tryLocsList, PromiseImpl) {
    if (PromiseImpl === void 0) PromiseImpl = Promise;

    var iter = new AsyncIterator(
      wrap(innerFn, outerFn, self, tryLocsList),
      PromiseImpl
    );

    return exports.isGeneratorFunction(outerFn)
      ? iter // If outerFn is a generator, return the full iterator.
      : iter.next().then(function(result) {
          return result.done ? result.value : iter.next();
        });
  };

  function makeInvokeMethod(innerFn, self, context) {
    var state = GenStateSuspendedStart;

    return function invoke(method, arg) {
      if (state === GenStateExecuting) {
        throw new Error("Generator is already running");
      }

      if (state === GenStateCompleted) {
        if (method === "throw") {
          throw arg;
        }

        // Be forgiving, per 25.3.3.3.3 of the spec:
        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
        return doneResult();
      }

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        // Note: ["return"] must be used for ES3 parsing compatibility.
        if (delegate.iterator["return"]) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
  }

  // Define Generator.prototype.{next,throw,return} in terms of the
  // unified ._invoke helper method.
  defineIteratorMethods(Gp);

  define(Gp, toStringTagSymbol, "Generator");

  // A Generator should always return itself as the iterator object when the
  // @@iterator function is called on it. Some browsers' implementations of the
  // iterator prototype chain incorrectly implement this, causing the Generator
  // object to not be returned from this call. This ensures that doesn't happen.
  // See https://github.com/facebook/regenerator/issues/274 for more details.
  Gp[iteratorSymbol] = function() {
    return this;
  };

  Gp.toString = function() {
    return "[object Generator]";
  };

  function pushTryEntry(locs) {
    var entry = { tryLoc: locs[0] };

    if (1 in locs) {
      entry.catchLoc = locs[1];
    }

    if (2 in locs) {
      entry.finallyLoc = locs[2];
      entry.afterLoc = locs[3];
    }

    this.tryEntries.push(entry);
  }

  function resetTryEntry(entry) {
    var record = entry.completion || {};
    record.type = "normal";
    delete record.arg;
    entry.completion = record;
  }

  function Context(tryLocsList) {
    // The root entry object (effectively a try statement without a catch
    // or a finally block) gives us a place to store values thrown from
    // locations where there is no enclosing try statement.
    this.tryEntries = [{ tryLoc: "root" }];
    tryLocsList.forEach(pushTryEntry, this);
    this.reset(true);
  }

  exports.keys = function(object) {
    var keys = [];
    for (var key in object) {
      keys.push(key);
    }
    keys.reverse();

    // Rather than returning an object with a next method, we keep
    // things simple and return the next function itself.
    return function next() {
      while (keys.length) {
        var key = keys.pop();
        if (key in object) {
          next.value = key;
          next.done = false;
          return next;
        }
      }

      // To avoid creating an additional object, we just hang the .value
      // and .done properties off the next function object itself. This
      // also ensures that the minifier will not anonymize the function.
      next.done = true;
      return next;
    };
  };

  function values(iterable) {
    if (iterable) {
      var iteratorMethod = iterable[iteratorSymbol];
      if (iteratorMethod) {
        return iteratorMethod.call(iterable);
      }

      if (typeof iterable.next === "function") {
        return iterable;
      }

      if (!isNaN(iterable.length)) {
        var i = -1, next = function next() {
          while (++i < iterable.length) {
            if (hasOwn.call(iterable, i)) {
              next.value = iterable[i];
              next.done = false;
              return next;
            }
          }

          next.value = undefined;
          next.done = true;

          return next;
        };

        return next.next = next;
      }
    }

    // Return an iterator with no values.
    return { next: doneResult };
  }
  exports.values = values;

  function doneResult() {
    return { value: undefined, done: true };
  }

  Context.prototype = {
    constructor: Context,

    reset: function(skipTempReset) {
      this.prev = 0;
      this.next = 0;
      // Resetting context._sent for legacy support of Babel's
      // function.sent implementation.
      this.sent = this._sent = undefined;
      this.done = false;
      this.delegate = null;

      this.method = "next";
      this.arg = undefined;

      this.tryEntries.forEach(resetTryEntry);

      if (!skipTempReset) {
        for (var name in this) {
          // Not sure about the optimal order of these conditions:
          if (name.charAt(0) === "t" &&
              hasOwn.call(this, name) &&
              !isNaN(+name.slice(1))) {
            this[name] = undefined;
          }
        }
      }
    },

    stop: function() {
      this.done = true;

      var rootEntry = this.tryEntries[0];
      var rootRecord = rootEntry.completion;
      if (rootRecord.type === "throw") {
        throw rootRecord.arg;
      }

      return this.rval;
    },

    dispatchException: function(exception) {
      if (this.done) {
        throw exception;
      }

      var context = this;
      function handle(loc, caught) {
        record.type = "throw";
        record.arg = exception;
        context.next = loc;

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
      }

      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        var record = entry.completion;

        if (entry.tryLoc === "root") {
          // Exception thrown outside of any try block that could handle
          // it, so set the completion value of the entire function to
          // throw the exception.
          return handle("end");
        }

        if (entry.tryLoc <= this.prev) {
          var hasCatch = hasOwn.call(entry, "catchLoc");
          var hasFinally = hasOwn.call(entry, "finallyLoc");

          if (hasCatch && hasFinally) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            } else if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else if (hasCatch) {
            if (this.prev < entry.catchLoc) {
              return handle(entry.catchLoc, true);
            }

          } else if (hasFinally) {
            if (this.prev < entry.finallyLoc) {
              return handle(entry.finallyLoc);
            }

          } else {
            throw new Error("try statement without catch or finally");
          }
        }
      }
    },

    abrupt: function(type, arg) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc <= this.prev &&
            hasOwn.call(entry, "finallyLoc") &&
            this.prev < entry.finallyLoc) {
          var finallyEntry = entry;
          break;
        }
      }

      if (finallyEntry &&
          (type === "break" ||
           type === "continue") &&
          finallyEntry.tryLoc <= arg &&
          arg <= finallyEntry.finallyLoc) {
        // Ignore the finally entry if control is not jumping to a
        // location outside the try/catch block.
        finallyEntry = null;
      }

      var record = finallyEntry ? finallyEntry.completion : {};
      record.type = type;
      record.arg = arg;

      if (finallyEntry) {
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
    },

    finish: function(finallyLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.finallyLoc === finallyLoc) {
          this.complete(entry.completion, entry.afterLoc);
          resetTryEntry(entry);
          return ContinueSentinel;
        }
      }
    },

    "catch": function(tryLoc) {
      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
        var entry = this.tryEntries[i];
        if (entry.tryLoc === tryLoc) {
          var record = entry.completion;
          if (record.type === "throw") {
            var thrown = record.arg;
            resetTryEntry(entry);
          }
          return thrown;
        }
      }

      // The context.catch method must only be called with a location
      // argument that corresponds to a known catch block.
      throw new Error("illegal catch attempt");
    },

    delegateYield: function(iterable, resultName, nextLoc) {
      this.delegate = {
        iterator: values(iterable),
        resultName: resultName,
        nextLoc: nextLoc
      };

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

      return ContinueSentinel;
    }
  };

  // Regardless of whether this script is executing as a CommonJS module
  // or not, return the runtime object so that we can declare the variable
  // regeneratorRuntime in the outer scope, which allows this module to be
  // injected easily by `bin/regenerator --include-runtime script.js`.
  return exports;

}(
  // If this script is executing as a CommonJS module, use module.exports
  // as the regeneratorRuntime namespace. Otherwise create a new empty
  // object. Either way, the resulting object will be used to initialize
  // the regeneratorRuntime variable at the top of this file.
  typeof module === "object" ? module.exports : {}
));

try {
  regeneratorRuntime = runtime;
} catch (accidentalStrictMode) {
  // This module should not be running in strict mode, so the above
  // assignment should always work unless something is misconfigured. Just
  // in case runtime.js accidentally runs in strict mode, we can escape
  // strict mode using a global Function call. This could conceivably fail
  // if a Content Security Policy forbids using Function, but in that case
  // the proper solution is to fix the accidental strict mode problem. If
  // you've misconfigured your bundler to force strict mode and applied a
  // CSP to forbid Function, and you're not willing to fix either of those
  // problems, please detail your unique predicament in a GitHub issue.
  Function("r", "regeneratorRuntime = r")(runtime);
}

},{}],4:[function(require,module,exports){
// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

void (function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define(factory)
  } else if (typeof exports === "object") {
    module.exports = factory()
  } else {
    root.resolveUrl = factory()
  }
}(this, function() {

  function resolveUrl(/* ...urls */) {
    var numUrls = arguments.length

    if (numUrls === 0) {
      throw new Error("resolveUrl requires at least one argument; got none.")
    }

    var base = document.createElement("base")
    base.href = arguments[0]

    if (numUrls === 1) {
      return base.href
    }

    var head = document.getElementsByTagName("head")[0]
    head.insertBefore(base, head.firstChild)

    var a = document.createElement("a")
    var resolved

    for (var index = 1; index < numUrls; index++) {
      a.href = arguments[index]
      resolved = a.href
      base.href = resolved
    }

    head.removeChild(base)

    return resolved
  }

  return resolveUrl

}));

},{}],5:[function(require,module,exports){
module.exports={
  "_from": "tesseract.js@2.1.1",
  "_id": "tesseract.js@2.1.1",
  "_inBundle": false,
  "_integrity": "sha512-utg0A8UzT1KwBvZf+UMGmM8LU6izeol6yIem0Z44+7Qqd/YWgRVQ99XOG18ApTOXX48lGE++PDwlcZYkv0ygRQ==",
  "_location": "/tesseract.js",
  "_phantomChildren": {},
  "_requested": {
    "type": "version",
    "registry": true,
    "raw": "tesseract.js@2.1.1",
    "name": "tesseract.js",
    "escapedName": "tesseract.js",
    "rawSpec": "2.1.1",
    "saveSpec": null,
    "fetchSpec": "2.1.1"
  },
  "_requiredBy": [
    "#USER",
    "/"
  ],
  "_resolved": "https://registry.npmjs.org/tesseract.js/-/tesseract.js-2.1.1.tgz",
  "_shasum": "5c50fc95542ce8d834cb952bfb75a8fc85f1441d",
  "_spec": "tesseract.js@2.1.1",
  "_where": "C:\\Users\\julie\\Documents\\GitHub\\testOtsu",
  "author": "",
  "browser": {
    "./src/worker/node/index.js": "./src/worker/browser/index.js"
  },
  "bugs": {
    "url": "https://github.com/naptha/tesseract.js/issues"
  },
  "bundleDependencies": false,
  "collective": {
    "type": "opencollective",
    "url": "https://opencollective.com/tesseractjs"
  },
  "contributors": [
    {
      "name": "jeromewu"
    }
  ],
  "dependencies": {
    "bmp-js": "^0.1.0",
    "file-type": "^12.4.1",
    "idb-keyval": "^3.2.0",
    "is-electron": "^2.2.0",
    "is-url": "^1.2.4",
    "node-fetch": "^2.6.0",
    "opencollective-postinstall": "^2.0.2",
    "regenerator-runtime": "^0.13.3",
    "resolve-url": "^0.2.1",
    "tesseract.js-core": "^2.2.0",
    "zlibjs": "^0.3.1"
  },
  "deprecated": false,
  "description": "Pure Javascript Multilingual OCR",
  "devDependencies": {
    "@babel/core": "^7.7.7",
    "@babel/preset-env": "^7.7.7",
    "acorn": "^6.4.0",
    "babel-loader": "^8.0.6",
    "cors": "^2.8.5",
    "eslint": "^5.16.0",
    "eslint-config-airbnb": "^17.1.1",
    "eslint-plugin-import": "^2.19.1",
    "eslint-plugin-jsx-a11y": "^6.2.3",
    "eslint-plugin-react": "^7.17.0",
    "expect.js": "^0.3.1",
    "express": "^4.17.1",
    "mocha": "^5.2.0",
    "mocha-headless-chrome": "^2.0.3",
    "npm-run-all": "^4.1.5",
    "nyc": "^15.0.0",
    "rimraf": "^2.7.1",
    "wait-on": "^3.3.0",
    "webpack": "^4.41.4",
    "webpack-bundle-analyzer": "^3.6.0",
    "webpack-cli": "^3.3.10",
    "webpack-dev-middleware": "^3.7.2"
  },
  "homepage": "https://github.com/naptha/tesseract.js",
  "jsdelivr": "dist/tesseract.min.js",
  "license": "Apache-2.0",
  "main": "src/index.js",
  "name": "tesseract.js",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/naptha/tesseract.js.git"
  },
  "scripts": {
    "build": "rimraf dist && webpack --config scripts/webpack.config.prod.js",
    "lint": "eslint src",
    "postinstall": "opencollective-postinstall || true",
    "prepublishOnly": "npm run build",
    "profile:tesseract": "webpack-bundle-analyzer dist/tesseract-stats.json",
    "profile:worker": "webpack-bundle-analyzer dist/worker-stats.json",
    "start": "node scripts/server.js",
    "test": "npm-run-all -p -r start test:all",
    "test:all": "npm-run-all wait test:browser:* test:node:all",
    "test:browser-tpl": "mocha-headless-chrome -a incognito -a no-sandbox -a disable-setuid-sandbox -a disable-logging -t 300000",
    "test:browser:FS": "npm run test:browser-tpl -- -f ./tests/FS.test.html",
    "test:browser:detect": "npm run test:browser-tpl -- -f ./tests/detect.test.html",
    "test:browser:recognize": "npm run test:browser-tpl -- -f ./tests/recognize.test.html",
    "test:browser:scheduler": "npm run test:browser-tpl -- -f ./tests/scheduler.test.html",
    "test:node": "nyc mocha --exit --bail --require ./scripts/test-helper.js",
    "test:node:all": "npm run test:node -- ./tests/*.test.js",
    "wait": "rimraf dist && wait-on http://localhost:3000/dist/tesseract.dev.js"
  },
  "types": "src/index.d.ts",
  "unpkg": "dist/tesseract.min.js",
  "version": "2.1.1"
}

},{}],6:[function(require,module,exports){
const createWorker = require('./createWorker');

const recognize = async (image, langs, options) => {
  const worker = createWorker(options);
  await worker.load();
  await worker.loadLanguage(langs);
  await worker.initialize(langs);
  return worker.recognize(image)
    .finally(async () => {
      await worker.terminate();
    });
};

const detect = async (image, options) => {
  const worker = createWorker(options);
  await worker.load();
  await worker.loadLanguage('osd');
  await worker.initialize('osd');
  return worker.detect(image)
    .finally(async () => {
      await worker.terminate();
    });
};

module.exports = {
  recognize,
  detect,
};

},{"./createWorker":13}],7:[function(require,module,exports){
/*
 * OEM = OCR Engine Mode, and there are 4 possible modes.
 *
 * By default tesseract.js uses LSTM_ONLY mode.
 *
 */
module.exports = {
  TESSERACT_ONLY: 0,
  LSTM_ONLY: 1,
  TESSERACT_LSTM_COMBINED: 2,
  DEFAULT: 3,
};

},{}],8:[function(require,module,exports){
/*
 * PSM = Page Segmentation Mode
 */
module.exports = {
  OSD_ONLY: '0',
  AUTO_OSD: '1',
  AUTO_ONLY: '2',
  AUTO: '3',
  SINGLE_COLUMN: '4',
  SINGLE_BLOCK_VERT_TEXT: '5',
  SINGLE_BLOCK: '6',
  SINGLE_LINE: '7',
  SINGLE_WORD: '8',
  CIRCLE_WORD: '9',
  SINGLE_CHAR: '10',
  SPARSE_TEXT: '11',
  SPARSE_TEXT_OSD: '12',
};

},{}],9:[function(require,module,exports){
const OEM = require('./OEM');

module.exports = {
  defaultOEM: OEM.DEFAULT,
};

},{"./OEM":7}],10:[function(require,module,exports){
module.exports = {
  /*
   * default path for downloading *.traineddata
   */
  langPath: 'https://tessdata.projectnaptha.com/4.0.0',
  /*
   * Use BlobURL for worker script by default
   * TODO: remove this option
   *
   */
  workerBlobURL: true,
  logger: () => {},
};

},{}],11:[function(require,module,exports){
const getId = require('./utils/getId');

let jobCounter = 0;

module.exports = ({
  id: _id,
  action,
  payload = {},
}) => {
  let id = _id;
  if (typeof id === 'undefined') {
    id = getId('Job', jobCounter);
    jobCounter += 1;
  }

  return {
    id,
    action,
    payload,
  };
};

},{"./utils/getId":17}],12:[function(require,module,exports){
const createJob = require('./createJob');
const { log } = require('./utils/log');
const getId = require('./utils/getId');

let schedulerCounter = 0;

module.exports = () => {
  const id = getId('Scheduler', schedulerCounter);
  const workers = {};
  const runningWorkers = {};
  let jobQueue = [];

  schedulerCounter += 1;

  const getQueueLen = () => jobQueue.length;
  const getNumWorkers = () => Object.keys(workers).length;

  const dequeue = () => {
    if (jobQueue.length !== 0) {
      const wIds = Object.keys(workers);
      for (let i = 0; i < wIds.length; i += 1) {
        if (typeof runningWorkers[wIds[i]] === 'undefined') {
          jobQueue[0](workers[wIds[i]]);
          break;
        }
      }
    }
  };

  const queue = (action, payload) => (
    new Promise((resolve, reject) => {
      const job = createJob({ action, payload });
      jobQueue.push(async (w) => {
        jobQueue.shift();
        runningWorkers[w.id] = job;
        try {
          resolve(await w[action].apply(this, [...payload, job.id]));
        } catch (err) {
          reject(err);
        } finally {
          delete runningWorkers[w.id];
          dequeue();
        }
      });
      log(`[${id}]: Add ${job.id} to JobQueue`);
      log(`[${id}]: JobQueue length=${jobQueue.length}`);
      dequeue();
    })
  );

  const addWorker = (w) => {
    workers[w.id] = w;
    log(`[${id}]: Add ${w.id}`);
    log(`[${id}]: Number of workers=${getNumWorkers()}`);
    dequeue();
    return w.id;
  };

  const addJob = async (action, ...payload) => {
    if (getNumWorkers() === 0) {
      throw Error(`[${id}]: You need to have at least one worker before adding jobs`);
    }
    return queue(action, payload);
  };

  const terminate = async () => {
    Object.keys(workers).forEach(async (wid) => {
      await workers[wid].terminate();
    });
    jobQueue = [];
  };

  return {
    addWorker,
    addJob,
    terminate,
    getQueueLen,
    getNumWorkers,
  };
};

},{"./createJob":11,"./utils/getId":17,"./utils/log":18}],13:[function(require,module,exports){
const resolvePaths = require('./utils/resolvePaths');
const circularize = require('./utils/circularize');
const createJob = require('./createJob');
const { log } = require('./utils/log');
const getId = require('./utils/getId');
const { defaultOEM } = require('./constants/config');
const {
  defaultOptions,
  spawnWorker,
  terminateWorker,
  onMessage,
  loadImage,
  send,
} = require('./worker/node');

let workerCounter = 0;

module.exports = (_options = {}) => {
  const id = getId('Worker', workerCounter);
  const {
    logger,
    errorHandler,
    ...options
  } = resolvePaths({
    ...defaultOptions,
    ..._options,
  });
  const resolves = {};
  const rejects = {};
  let worker = spawnWorker(options);

  workerCounter += 1;

  const setResolve = (action, res) => {
    resolves[action] = res;
  };

  const setReject = (action, rej) => {
    rejects[action] = rej;
  };

  const startJob = ({ id: jobId, action, payload }) => (
    new Promise((resolve, reject) => {
      log(`[${id}]: Start ${jobId}, action=${action}`);
      setResolve(action, resolve);
      setReject(action, reject);
      send(worker, {
        workerId: id,
        jobId,
        action,
        payload,
      });
    })
  );

  const load = jobId => (
    startJob(createJob({
      id: jobId, action: 'load', payload: { options },
    }))
  );

  const writeText = (path, text, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: { method: 'writeFile', args: [path, text] },
    }))
  );

  const readText = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: { method: 'readFile', args: [path, { encoding: 'utf8' }] },
    }))
  );

  const removeFile = (path, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: { method: 'unlink', args: [path] },
    }))
  );

  const FS = (method, args, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'FS',
      payload: { method, args },
    }))
  );

  const loadLanguage = (langs = 'eng', jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'loadLanguage',
      payload: { langs, options },
    }))
  );

  const initialize = (langs = 'eng', oem = defaultOEM, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'initialize',
      payload: { langs, oem },
    }))
  );

  const setParameters = (params = {}, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'setParameters',
      payload: { params },
    }))
  );

  const recognize = async (image, opts = {}, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'recognize',
      payload: { image: await loadImage(image), options: opts },
    }))
  );

  const getPDF = (title = 'Tesseract OCR Result', textonly = false, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'getPDF',
      payload: { title, textonly },
    }))
  );

  const detect = async (image, jobId) => (
    startJob(createJob({
      id: jobId,
      action: 'detect',
      payload: { image: await loadImage(image) },
    }))
  );

  const terminate = async () => {
    if (worker !== null) {
      /*
      await startJob(createJob({
        id: jobId,
        action: 'terminate',
      }));
      */
      terminateWorker(worker);
      worker = null;
    }
    return Promise.resolve();
  };

  onMessage(worker, ({
    workerId, jobId, status, action, data,
  }) => {
    if (status === 'resolve') {
      log(`[${workerId}]: Complete ${jobId}`);
      let d = data;
      if (action === 'recognize') {
        d = circularize(data);
      } else if (action === 'getPDF') {
        d = Array.from({ ...data, length: Object.keys(data).length });
      }
      resolves[action]({ jobId, data: d });
    } else if (status === 'reject') {
      rejects[action](data);
      if (errorHandler) {
        errorHandler(data);
      } else {
        throw Error(data);
      }
    } else if (status === 'progress') {
      logger(data);
    }
  });

  return {
    id,
    worker,
    setResolve,
    setReject,
    load,
    writeText,
    readText,
    removeFile,
    FS,
    loadLanguage,
    initialize,
    setParameters,
    recognize,
    getPDF,
    detect,
    terminate,
  };
};

},{"./constants/config":9,"./createJob":11,"./utils/circularize":15,"./utils/getId":17,"./utils/log":18,"./utils/resolvePaths":19,"./worker/node":21}],14:[function(require,module,exports){
/**
 *
 * Entry point for tesseract.js, should be the entry when bundling.
 *
 * @fileoverview entry point for tesseract.js
 * @author Kevin Kwok <antimatter15@gmail.com>
 * @author Guillermo Webster <gui@mit.edu>
 * @author Jerome Wu <jeromewus@gmail.com>
 */
require('regenerator-runtime/runtime');
const createScheduler = require('./createScheduler');
const createWorker = require('./createWorker');
const Tesseract = require('./Tesseract');
const OEM = require('./constants/OEM');
const PSM = require('./constants/PSM');
const { setLogging } = require('./utils/log');

module.exports = {
  OEM,
  PSM,
  createScheduler,
  createWorker,
  setLogging,
  ...Tesseract,
};

},{"./Tesseract":6,"./constants/OEM":7,"./constants/PSM":8,"./createScheduler":12,"./createWorker":13,"./utils/log":18,"regenerator-runtime/runtime":3}],15:[function(require,module,exports){
/**
 * In the recognition result of tesseract, there
 * is a deep JSON object for details, it has around
 *
 * The result of dump.js is a big JSON tree
 * which can be easily serialized (for instance
 * to be sent from a webworker to the main app
 * or through Node's IPC), but we want
 * a (circular) DOM-like interface for walking
 * through the data.
 *
 * @fileoverview DOM-like interface for walking through data
 * @author Kevin Kwok <antimatter15@gmail.com>
 * @author Guillermo Webster <gui@mit.edu>
 * @author Jerome Wu <jeromewus@gmail.com>
 */

module.exports = (page) => {
  const blocks = [];
  const paragraphs = [];
  const lines = [];
  const words = [];
  const symbols = [];

  page.blocks.forEach((block) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.lines.forEach((line) => {
        line.words.forEach((word) => {
          word.symbols.forEach((sym) => {
            symbols.push({
              ...sym, page, block, paragraph, line, word,
            });
          });
          words.push({
            ...word, page, block, paragraph, line,
          });
        });
        lines.push({
          ...line, page, block, paragraph,
        });
      });
      paragraphs.push({
        ...paragraph, page, block,
      });
    });
    blocks.push({
      ...block, page,
    });
  });

  return {
    ...page, blocks, paragraphs, lines, words, symbols,
  };
};

},{}],16:[function(require,module,exports){
(function (process){
const isElectron = require('is-electron');

module.exports = (key) => {
  const env = {};

  if (isElectron()) {
    env.type = 'electron';
  } else if (typeof window === 'object') {
    env.type = 'browser';
  } else if (typeof importScripts === 'function') {
    env.type = 'webworker';
  } else if (typeof process === 'object' && typeof require === 'function') {
    env.type = 'node';
  }

  if (typeof key === 'undefined') {
    return env;
  }

  return env[key];
};

}).call(this,require('_process'))
},{"_process":1,"is-electron":2}],17:[function(require,module,exports){
module.exports = (prefix, cnt) => (
  `${prefix}-${cnt}-${Math.random().toString(16).slice(3, 8)}`
);

},{}],18:[function(require,module,exports){
let logging = false;

exports.logging = logging;

exports.setLogging = (_logging) => {
  logging = _logging;
};

exports.log = (...args) => (logging ? console.log.apply(this, args) : null);

},{}],19:[function(require,module,exports){
const isBrowser = require('./getEnvironment')('type') === 'browser';
const resolveURL = isBrowser ? require('resolve-url') : s => s; // eslint-disable-line

module.exports = (options) => {
  const opts = { ...options };
  ['corePath', 'workerPath', 'langPath'].forEach((key) => {
    if (typeof options[key] !== 'undefined') {
      opts[key] = resolveURL(opts[key]);
    }
  });
  return opts;
};

},{"./getEnvironment":16,"resolve-url":4}],20:[function(require,module,exports){
(function (process){
const resolveURL = require('resolve-url');
const { version, dependencies } = require('../../../package.json');
const defaultOptions = require('../../constants/defaultOptions');

/*
 * Default options for browser worker
 */
module.exports = {
  ...defaultOptions,
  workerPath: (typeof process !== 'undefined' && process.env.TESS_ENV === 'development')
    ? resolveURL(`/dist/worker.dev.js?nocache=${Math.random().toString(36).slice(3)}`)
    : `https://unpkg.com/tesseract.js@v${version}/dist/worker.min.js`,
  /*
   * If browser doesn't support WebAssembly,
   * load ASM version instead
   */
  corePath: `https://unpkg.com/tesseract.js-core@v${dependencies['tesseract.js-core'].substring(1)}/tesseract-core.${typeof WebAssembly === 'object' ? 'wasm' : 'asm'}.js`,
};

}).call(this,require('_process'))
},{"../../../package.json":5,"../../constants/defaultOptions":10,"_process":1,"resolve-url":4}],21:[function(require,module,exports){
/**
 *
 * Tesseract Worker adapter for browser
 *
 * @fileoverview Tesseract Worker adapter for browser
 * @author Kevin Kwok <antimatter15@gmail.com>
 * @author Guillermo Webster <gui@mit.edu>
 * @author Jerome Wu <jeromewus@gmail.com>
 */
const defaultOptions = require('./defaultOptions');
const spawnWorker = require('./spawnWorker');
const terminateWorker = require('./terminateWorker');
const onMessage = require('./onMessage');
const send = require('./send');
const loadImage = require('./loadImage');

module.exports = {
  defaultOptions,
  spawnWorker,
  terminateWorker,
  onMessage,
  send,
  loadImage,
};

},{"./defaultOptions":20,"./loadImage":22,"./onMessage":23,"./send":24,"./spawnWorker":25,"./terminateWorker":26}],22:[function(require,module,exports){
const resolveURL = require('resolve-url');

/**
 * readFromBlobOrFile
 *
 * @name readFromBlobOrFile
 * @function
 * @access private
 */
const readFromBlobOrFile = blob => (
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.onerror = ({ target: { error: { code } } }) => {
      reject(Error(`File could not be read! Code=${code}`));
    };
    fileReader.readAsArrayBuffer(blob);
  })
);

/**
 * loadImage
 *
 * @name loadImage
 * @function load image from different source
 * @access private
 */
const loadImage = async (image) => {
  let data = image;
  if (typeof image === 'undefined') {
    return 'undefined';
  }

  if (typeof image === 'string') {
    // Base64 Image
    if (/data:image\/([a-zA-Z]*);base64,([^"]*)/.test(image)) {
      data = atob(image.split(',')[1])
        .split('')
        .map(c => c.charCodeAt(0));
    } else {
      const resp = await fetch(resolveURL(image));
      data = await resp.arrayBuffer();
    }
  } else if (image instanceof HTMLElement) {
    if (image.tagName === 'IMG') {
      data = await loadImage(image.src);
    }
    if (image.tagName === 'VIDEO') {
      data = await loadImage(image.poster);
    }
    if (image.tagName === 'CANVAS') {
      await new Promise((resolve) => {
        image.toBlob(async (blob) => {
          data = await readFromBlobOrFile(blob);
          resolve();
        });
      });
    }
  } else if (image instanceof File || image instanceof Blob) {
    data = await readFromBlobOrFile(image);
  }

  return new Uint8Array(data);
};

module.exports = loadImage;

},{"resolve-url":4}],23:[function(require,module,exports){
module.exports = (worker, handler) => {
  worker.onmessage = ({ data }) => { // eslint-disable-line
    handler(data);
  };
};

},{}],24:[function(require,module,exports){
/**
 * send
 *
 * @name send
 * @function send packet to worker and create a job
 * @access public
 */
module.exports = async (worker, packet) => {
  worker.postMessage(packet);
};

},{}],25:[function(require,module,exports){
/**
 * spawnWorker
 *
 * @name spawnWorker
 * @function create a new Worker in browser
 * @access public
 */
module.exports = ({ workerPath, workerBlobURL }) => {
  let worker;
  if (Blob && URL && workerBlobURL) {
    const blob = new Blob([`importScripts("${workerPath}");`], {
      type: 'application/javascript',
    });
    worker = new Worker(URL.createObjectURL(blob));
  } else {
    worker = new Worker(workerPath);
  }

  return worker;
};

},{}],26:[function(require,module,exports){
/**
 * terminateWorker
 *
 * @name terminateWorker
 * @function terminate worker
 * @access public
 */
module.exports = (worker) => {
  worker.terminate();
};

},{}],27:[function(require,module,exports){
/**
 * Module containing the different filters and pre-processing functions
 */
class Filters {
  constructor() {
    this.tmpCanvas = document.createElement("canvas");
    this.tmpCtx = this.tmpCanvas.getContext("2d");
    this.maxSum = 0;
    this.thresholds = [];
  }

  /**
   *
   * @param {*} filter
   * @param {ImageData} imgData
   * @param {*} var_args
   */
  filterImage = function (filter, imgData, var_args) {
    var args = [imgData];
    for (var i = 2; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    return filter.apply(null, args);
  };
  /**
   *
   * @param {ImageData} pixels
   * @param {*} args
   */
  grayscale = function (pixels, args) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      // CIE luminance for the RGB
      // The human eye is bad at seeing red and blue, so we de-emphasize them.
      var v = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return pixels;
  };
  /**
   *
   * @param {ImageData} pixels
   * @param {Number} adjustment
   */
  brightness = function (pixels, adjustment) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] += adjustment;
      d[i + 1] += adjustment;
      d[i + 2] += adjustment;
    }
    return pixels;
  };

  /**
   *
   * @param {ImageData} pixels
   * @param {Number} threshold
   */
  threshold = function (pixels, threshold) {
    var d = pixels.data;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i];
      var g = d[i + 1];
      var b = d[i + 2];
      var v = 0.2126 * r + 0.7152 * g + 0.0722 * b >= threshold ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return pixels;
  };

  createImageData = function (w, h) {
    return this.tmpCtx.createImageData(w, h);
  };

  /**
   *
   * @param {ImageData} pixels
   * @param {Number[]} weights
   * @param {*} opaque
   */
  convolute = function (pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);
    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;
    // pad output by the convolution matrix
    var w = sw;
    var h = sh;
    var output = this.createImageData(w, h);
    var dst = output.data;
    // go through the destination image pixels
    var alphaFac = opaque ? 1 : 0;
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y * w + x) * 4;
        // calculate the weighed sum of the source image pixels that
        // fall under the convolution matrix
        var r = 0,
          g = 0,
          b = 0,
          a = 0;
        for (var cy = 0; cy < side; cy++) {
          for (var cx = 0; cx < side; cx++) {
            var scy = sy + cy - halfSide;
            var scx = sx + cx - halfSide;
            if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
              var srcOff = (scy * sw + scx) * 4;
              var wt = weights[cy * side + cx];
              r += src[srcOff] * wt;
              g += src[srcOff + 1] * wt;
              b += src[srcOff + 2] * wt;
              a += src[srcOff + 3] * wt;
            }
          }
        }
        dst[dstOff] = r;
        dst[dstOff + 1] = g;
        dst[dstOff + 2] = b;
        dst[dstOff + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  sharpen = function (pixels) {
    let output = this.convolute(pixels, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
    return output;
  };

  convoluteFloat32 = function (pixels, weights, opaque) {
    var side = Math.round(Math.sqrt(weights.length));
    var halfSide = Math.floor(side / 2);

    var src = pixels.data;
    var sw = pixels.width;
    var sh = pixels.height;

    var w = sw;
    var h = sh;
    var output = {
      width: w,
      height: h,
      data: new Float32Array(w * h * 4),
    };
    var dst = output.data;

    var alphaFac = opaque ? 1 : 0;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var sy = y;
        var sx = x;
        var dstOff = (y * w + x) * 4;
        var r = 0,
          g = 0,
          b = 0,
          a = 0;
        for (var cy = 0; cy < side; cy++) {
          for (var cx = 0; cx < side; cx++) {
            var scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
            var scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
            var srcOff = (scy * sw + scx) * 4;
            var wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
            a += src[srcOff + 3] * wt;
          }
        }
        dst[dstOff] = r;
        dst[dstOff + 1] = g;
        dst[dstOff + 2] = b;
        dst[dstOff + 3] = a + alphaFac * (255 - a);
      }
    }
    return output;
  };

  /**
   *
   * @param {ImageData} image
   */
  sobel = function (image) {
    var grayscale = this.filterImage(this.grayscale, image);
    // Note that ImageData values are clamped between 0 and 255, so we need
    // to use a Float32Array for the gradient values because they
    // range between -255 and 255.
    var vertical = this.convoluteFloat32(grayscale, [-1, 0, 1, -2, 0, 2, -1, 0, 1]);
    var horizontal = this.convoluteFloat32(grayscale, [-1, -2, -1, 0, 0, 0, 1, 2, 1]);
    var final_image = this.createImageData(vertical.width, vertical.height);
    for (var i = 0; i < final_image.data.length; i += 4) {
      // make the vertical gradient black
      var v = Math.abs(vertical.data[i]);
      final_image.data[i] = v;
      // make the horizontal gradient green
      var h = Math.abs(horizontal.data[i]);
      final_image.data[i + 1] = h;
      // and mix in some blue for aesthetics
      final_image.data[i + 2] = (v + h) / 4;
      final_image.data[i + 3] = 255; // opaque alpha
    }
    return final_image;
  };
  /**
   *
   * @param {*} img
   */
  getPixels = function (img) {
    var c = this.getCanvas(img.width, img.height);
    var ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  };

  getCanvas = function (w, h) {
    var c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  };

  histogram(image) {
    // Create the histogram
    var histogram = new Array(256);
    histogram.fill(0);

    for (var i = 0; i < image.data.length; i += 4) {
      var luma = (11 * image.data[i] + 16 * image.data[i + 1] + 5 * image.data[i + 2]) >> 5;
      histogram[luma]++;
    }

    // Since we use sum tables add one more to avoid unexistent colors.
    for (var j = 0; j < histogram.length; j++) histogram[j]++;

    return histogram;
  }

  buildTables(histogram) {
    // Create cumulative sum tables.
    var P = new Array(histogram.length + 1);
    var S = new Array(histogram.length + 1);
    P[0] = 0;
    S[0] = 0;

    var sumP = 0;
    var sumS = 0;

    for (var i = 0; i < histogram.length; i++) {
      sumP += histogram[i];
      sumS += i * histogram[i];
      P[i + 1] = sumP;
      S[i + 1] = sumS;
    }

    // Calculate the between-class variance for the interval u-v
    var H = new Array(histogram.length * histogram.length);
    H.fill(0);

    for (var u = 0; u < histogram.length; u++)
      for (var v = u + 1; v < histogram.length; v++)
        H[v + u * histogram.length] = Math.pow(S[v] - S[u], 2) / (P[v] - P[u]);

    return H;
  }

  for_loop(H, u, vmax, level, levels, index) {
    var classes = index.length - 1;

    for (var i = u; i < vmax; i++) {
      index[level] = i;

      if (level + 1 >= classes) {
        // Reached the end of the for loop.

        // Calculate the quadratic sum of al intervals.
        var sum = 0;

        for (var c = 0; c < classes; c++) {
          u = index[c];
          var v = index[c + 1];
          var s = H[v + u * levels];
          sum += s;
        }

        if (this.maxSum < sum) {
          // Return calculated threshold.
          this.thresholds = index.slice(1, index.length - 1);
          this.maxSum = sum;
        }
      } else {
        // Start a new for loop level, one position after current one.
        this.for_loop(H, i + 1, vmax + 1, level + 1, levels, index);
      }
    }
  }

  otsu(histogram, classes) {
    this.maxSum = 0;
    this.thresholds = new Array(classes - 1);
    this.thresholds.fill(0);
    var H = this.buildTables(histogram);
    var index = new Array(classes + 1);
    index[0] = 0;
    index[index.length - 1] = histogram.length - 1;

    this.for_loop(H, 1, histogram.length - classes + 1, 1, histogram.length, index);

    return this.thresholds;
  }

  drawResultInverted(thresholds, classes, colorList) {
    // var src = srcImgData;
    // var dst = this.tmpCanvas;
    // dst.width = src.width;
    // dst.height = src.height;
    // var ctx = dst.getContext("2d");
    // ctx.drawImage(src, 0, 0, dst.width, dst.height);
    // var imageData = ctx.getImageData(0, 0, dst.width, dst.height);
    // var dstData = imageData.data;
    var newColors = new Array(classes);

    if (colorList && colorList.length === classes) {
      newColors = colorList;
    } else {
      for (var i = 0; i < classes; i++) {
        newColors[i] = Math.round((255 * i) / (classes - 1));
      }
    }
    var colorTable = new Array(256);
    var j = 0;

    for (var k = 0; k < colorTable.length; k++) {
      if (j < thresholds.length && k >= thresholds[j]) j++;

      colorTable[k] = newColors[j];
    }

    // for (var p = 0; p < dstData.length; p += 4) {
    //   var luma =
    //     (11 * dstData[p] + 16 * dstData[p + 1] + 5 * dstData[p + 2]) >> 5;
    //   luma = colorTable[luma];

    //   dstData[p] = luma;
    //   dstData[p + 1] = luma;
    //   dstData[p + 2] = luma;
    //   dstData[p + 3] = 255;
    // }

    // ctx.putImageData(imageData, 0, 0); //, 0, 0, dst.width, dst.height);
    return newColors;
  }

  firstOtsu(imgData, nclasses) {
    var colorList = null;
    var hist = this.histogram(imgData);
    var thresholds = this.otsu(hist, nclasses);
    const newColors = this.drawResultInverted(thresholds, nclasses, colorList);
    const params = { threshold: thresholds, colors: newColors };
    const dstImgData = this.otsuFilter(imgData, params);
    return dstImgData;
  }

  /**
   * Code to apply OTSU thresholding on bounding-boxes
   * @param {ImageData} imgData -
   * @param {Object} params - Object containting thresholding parameters
   * @param {Number[]} params.threshold - Array of the thresholds
   * @param {Number[]} params.colors - Array of the colors by class
   * @returns {ImageData}
   */
  otsuFilter(imgData, params) {
    var dstData = imgData.data;

    const thresholds = params.threshold;
    const colors = params.colors;

    var colorTable = new Array(256);
    var j = 0;

    for (var k = 0; k < colorTable.length; k++) {
      if (j < thresholds.length && k >= thresholds[j]) j++;

      colorTable[k] = colors[j];
    }

    for (var i = 0; i < dstData.length; i += 4) {
      var luma = (11 * dstData[i] + 16 * dstData[i + 1] + 5 * dstData[i + 2]) >> 5;
      luma = colorTable[luma];

      dstData[i] = luma;
      dstData[i + 1] = luma;
      dstData[i + 2] = luma;
      dstData[i + 3] = 255;
    }
    return imgData;
  }
}

module.exports = Filters;

},{}],28:[function(require,module,exports){
const { createWorker } = require("tesseract.js");
const Otsu = require("./otsu");
const Filters = require("./filters");

let textworker = null;
let digitworker = null;
let f = new Filters();
let otsu = new Otsu();
let dstCanvas = document.getElementById("dstCanvas");
let dstCtx = dstCanvas.getContext("2d");
let startButton = document.getElementById("startButton");

startButton.addEventListener("click", buttonStart());

async function buttonStart() {
  try {
    let originalImage = document.getElementById("originalImg");
    let zoneType = document.getElementById("zoneType");
    let tValue = document.getElementById("tValue");
    let imgData = f.getPixels(originalImage);
    await load_allWorkers();
    console.log("workers loaded");
    let results = await getbestOtsu(imgData, tValue, zoneType, 5);
    let bestImg = await otsuFilter(imgData, results.params);
    console.log(results);
    dstCtx.putImageData(
      bestImg,
      originalImage.clientWidth,
      originalImage.clientHeight
    );
  } catch (e) {
    console.log("crashed in main");
    console.log(JSON.stringify(e));
  }
}

async function getbestOtsu(imgData, targetValue, zoneType, n_max) {
  let n_classes = 2;
  let params = {};
  let confidence = 0;
  let result = {};
  let result_dict = {};
  let bestConfidence = 0;
  let bestParams = {};
  let tmpCanvas = document.createElement("canvas");
  let tmpCtx = tmpCanvas.getContext("2d");

  if (zoneType !== "digit" || zoneType !== "text") {
    return;
  }
  for (let j = n_classes; j <= n_max; j += 1) {
    params = otsu.firstOtsu(imgData, j);
    let permutations = getFlips(j);
    let colorLists = convertList(permutations);
    for (let i = 0; i < colorLists.length; i += 1) {
      params.colors = colorLists[i];
      let imgDataFilt = await otsuFilter(imgData, params);
      tmpCtx.putImageData(imgDataFilt);
      if (zoneType === "text") {
        result = await ZoneLogic.textworker.recognize(tmpCanvas);
      } else {
        result = await ZoneLogic.digitworker.recognize(tmpCanvas);
      }
      result_dict = shapeZoneResult(result);
      confidence = result_dict.confidence;
      if (result_dict.value === targetValue) {
        if (confidence > 90) {
          bestConfidence = confidence;
          bestParams = params;
          break;
        } else if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestParams = params;
        } else {
          // do nothing
        }
      } else {
        // do nothing
      }
    }
    if (confidence > 90 && result_dict.value === targetValue) {
      break;
    }
  }
  return { params: bestParams, results: result_dict };
}

function getFlips(n) {
  if (n <= 0) {
    return [""];
  } else {
    const prev = getFlips(n - 1).flatMap((r) => [r + "W", r + "B"]);
    return prev;
  }
}

function shapeZoneResult(ocrprom) {
  const currtime = new Date();
  const toStringTime = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(currtime);
  const result_dict = {
    time: toStringTime,
    value: ocrprom ? ocrprom.data.text.replace("\n", "") : "",
    confidence: ocrprom ? ocrprom.data.confidence : 0,
  };
  return result_dict;
}

function convertList(colorPerm) {
  let colorList = [];
  for (let i = 0; i < colorPerm.length; i += 1) {
    let colors = [];
    let val = null;
    for (let j = 0; j < colorPerm[i].length; j += 1) {
      if (colorPerm[i][j] === "W") {
        val = 255;
      } else {
        val = 0;
      }
      colors.push(val);
    }
    colorList.push(colors);
  }
  return colorList;
}

async function load_allWorkers() {
  // Load text worker
  textworker = createWorker();
  digitworker = createWorker();

  await Promise.all([textworker.load(), digitworker.load()]);

  await Promise.all([
    textworker.loadLanguage("eng"),
    digitworker.loadLanguage("eng"),
  ]);

  await Promise.all([
    digitworker.initialize("eng"),
    textworker.initialize("eng"),
  ]);

  await Promise.all([
    textworker.setParameters({
      tessedit_char_whitelist:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz! ",
      preserve_interword_spaces: "1",
    }),
    digitworker.setParameters({
      tessedit_char_whitelist: "0123456789Xx",
    }),
  ]);
  console.log("Workers Loaded");
}

async function killWorkers() {
  if (textworker && digitworker) {
    await textworker.terminate();
    await digitworker.terminate();
    console.log("workers terminated...");
  }
}

async function otsuFilter(imgData, params = null) {
  var dstData = imgData.data;

  if (params === null) {
    params = otsu.firstOtsu(imgData, 2);
  }

  const hist = otsu.histogram(imgData);
  const autoThresholds = otsu.otsu(hist, params.colors.length);

  imgData.threshold = autoThresholds;

  const thresholds = params.threshold || autoThresholds;
  const colors = params.colors;
  this.nclasses = colors.length;

  var colorTable = new Array(256);
  var j = 0;

  for (var i = 0; i < colorTable.length; i++) {
    if (j < thresholds.length && i >= thresholds[j]) j++;

    colorTable[i] = colors[j];
  }

  for (var i = 0; i < dstData.length; i += 4) {
    var luma =
      (11 * dstData[i] + 16 * dstData[i + 1] + 5 * dstData[i + 2]) >> 5;
    luma = colorTable[luma];

    dstData[i] = luma;
    dstData[i + 1] = luma;
    dstData[i + 2] = luma;
    dstData[i + 3] = 255;
  }
  return imgData;
}

},{"./filters":27,"./otsu":29,"tesseract.js":14}],29:[function(require,module,exports){
class Otsu {
  constructor() {
    this.maxSum = 0;
    this.thresholds = [];
  }

  histogram(image) {
    // Create the histogram
    var histogram = new Array(256);
    histogram.fill(0);

    for (var i = 0; i < image.data.length; i += 4) {
      var luma =
        (11 * image.data[i] + 16 * image.data[i + 1] + 5 * image.data[i + 2]) >>
        5;
      histogram[luma]++;
    }

    // Since we use sum tables add one more to avoid unexistent colors.
    for (var i = 0; i < histogram.length; i++) histogram[i]++;

    return histogram;
  }

  buildTables(histogram) {
    // Create cumulative sum tables.
    var P = new Array(histogram.length + 1);
    var S = new Array(histogram.length + 1);
    P[0] = 0;
    S[0] = 0;

    var sumP = 0;
    var sumS = 0;

    for (var i = 0; i < histogram.length; i++) {
      sumP += histogram[i];
      sumS += i * histogram[i];
      P[i + 1] = sumP;
      S[i + 1] = sumS;
    }

    // Calculate the between-class variance for the interval u-v
    var H = new Array(histogram.length * histogram.length);
    H.fill(0);

    for (var u = 0; u < histogram.length; u++)
      for (var v = u + 1; v < histogram.length; v++)
        H[v + u * histogram.length] = Math.pow(S[v] - S[u], 2) / (P[v] - P[u]);

    return H;
  }

  for_loop(H, u, vmax, level, levels, index) {
    var classes = index.length - 1;

    for (var i = u; i < vmax; i++) {
      index[level] = i;

      if (level + 1 >= classes) {
        // Reached the end of the for loop.

        // Calculate the quadratic sum of al intervals.
        var sum = 0;

        for (var c = 0; c < classes; c++) {
          var u = index[c];
          var v = index[c + 1];
          var s = H[v + u * levels];
          sum += s;
        }

        if (maxSum < sum) {
          // Return calculated threshold.
          thresholds = index.slice(1, index.length - 1);
          maxSum = sum;
        }
      } else {
        // Start a new for loop level, one position after current one.
        this.for_loop(H, i + 1, vmax + 1, level + 1, levels, index);
      }
    }
  }

  otsu(histogram, classes) {
    maxSum = 0;
    thresholds = new Array(classes - 1);
    thresholds.fill(0);
    var H = this.buildTables(histogram);
    var index = new Array(classes + 1);
    index[0] = 0;
    index[index.length - 1] = histogram.length - 1;

    this.for_loop(
      H,
      1,
      histogram.length - classes + 1,
      1,
      histogram.length,
      index
    );

    return thresholds;
  }

  drawResultInverted(thresholds, classes, colorList) {
    var src = document.getElementById("otsu-test-src");
    var dst = document.getElementById("otsu-test-dst");
    dst.width = src.width;
    dst.height = src.height;
    var ctx = dst.getContext("2d");
    ctx.drawImage(src, 0, 0, dst.width, dst.height);
    var imageData = ctx.getImageData(0, 0, dst.width, dst.height);
    var dstData = imageData.data;
    var newColors = new Array(classes);

    if (colorList && colorList.length === classes) {
      newColors = colorList;
    } else {
      for (var i = 0; i < classes; i++) {
        newColors[i] = Math.round((255 * i) / (classes - 1));
      }
    }
    var colorTable = new Array(256);
    var j = 0;

    for (var i = 0; i < colorTable.length; i++) {
      if (j < thresholds.length && i >= thresholds[j]) j++;

      colorTable[i] = newColors[j];
    }

    for (var i = 0; i < dstData.length; i += 4) {
      var luma =
        (11 * dstData[i] + 16 * dstData[i + 1] + 5 * dstData[i + 2]) >> 5;
      luma = colorTable[luma];

      dstData[i] = luma;
      dstData[i + 1] = luma;
      dstData[i + 2] = luma;
      dstData[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0); //, 0, 0, dst.width, dst.height);
    return newColors;
  }

  firstOtsu(imgData, nclasses) {
    var colorList = null;
    var hist = this.histogram(imgData);
    var thresholds = this.otsu(hist, nclasses);
    const newColors = this.drawResultInverted(thresholds, nclasses, colorList);
    const params = { threshold: thresholds, colors: newColors };
    return params;
  }
}

module.exports = Otsu;

},{}]},{},[28]);
