import {
  __commonJS,
  __esm,
  __export,
  __toCommonJS
} from "./chunk-KW76NYFZ.js";

// node_modules/penpal/lib/enums.js
var MessageType, Resolution, ErrorCode, NativeErrorName, NativeEventType;
var init_enums = __esm({
  "node_modules/penpal/lib/enums.js"() {
    (function(MessageType2) {
      MessageType2["Call"] = "call";
      MessageType2["Reply"] = "reply";
      MessageType2["Syn"] = "syn";
      MessageType2["SynAck"] = "synAck";
      MessageType2["Ack"] = "ack";
    })(MessageType || (MessageType = {}));
    (function(Resolution2) {
      Resolution2["Fulfilled"] = "fulfilled";
      Resolution2["Rejected"] = "rejected";
    })(Resolution || (Resolution = {}));
    (function(ErrorCode2) {
      ErrorCode2["ConnectionDestroyed"] = "ConnectionDestroyed";
      ErrorCode2["ConnectionTimeout"] = "ConnectionTimeout";
      ErrorCode2["NoIframeSrc"] = "NoIframeSrc";
    })(ErrorCode || (ErrorCode = {}));
    (function(NativeErrorName2) {
      NativeErrorName2["DataCloneError"] = "DataCloneError";
    })(NativeErrorName || (NativeErrorName = {}));
    (function(NativeEventType2) {
      NativeEventType2["Message"] = "message";
    })(NativeEventType || (NativeEventType = {}));
  }
});

// node_modules/penpal/lib/createDestructor.js
var createDestructor_default;
var init_createDestructor = __esm({
  "node_modules/penpal/lib/createDestructor.js"() {
    createDestructor_default = (localName, log) => {
      const callbacks = [];
      let destroyed = false;
      return {
        destroy(error) {
          if (!destroyed) {
            destroyed = true;
            log(`${localName}: Destroying connection`);
            callbacks.forEach((callback) => {
              callback(error);
            });
          }
        },
        onDestroy(callback) {
          destroyed ? callback() : callbacks.push(callback);
        }
      };
    };
  }
});

// node_modules/penpal/lib/createLogger.js
var createLogger_default;
var init_createLogger = __esm({
  "node_modules/penpal/lib/createLogger.js"() {
    createLogger_default = (debug) => {
      return (...args) => {
        if (debug) {
          console.log("[Penpal]", ...args);
        }
      };
    };
  }
});

// node_modules/penpal/lib/parent/getOriginFromSrc.js
var DEFAULT_PORT_BY_PROTOCOL, URL_REGEX, opaqueOriginSchemes, getOriginFromSrc_default;
var init_getOriginFromSrc = __esm({
  "node_modules/penpal/lib/parent/getOriginFromSrc.js"() {
    DEFAULT_PORT_BY_PROTOCOL = {
      "http:": "80",
      "https:": "443"
    };
    URL_REGEX = /^(https?:)?\/\/([^/:]+)?(:(\d+))?/;
    opaqueOriginSchemes = ["file:", "data:"];
    getOriginFromSrc_default = (src) => {
      if (src && opaqueOriginSchemes.find((scheme) => src.startsWith(scheme))) {
        return "null";
      }
      const location = document.location;
      const regexResult = URL_REGEX.exec(src);
      let protocol;
      let hostname;
      let port;
      if (regexResult) {
        protocol = regexResult[1] ? regexResult[1] : location.protocol;
        hostname = regexResult[2];
        port = regexResult[4];
      } else {
        protocol = location.protocol;
        hostname = location.hostname;
        port = location.port;
      }
      const portSuffix = port && port !== DEFAULT_PORT_BY_PROTOCOL[protocol] ? `:${port}` : "";
      return `${protocol}//${hostname}${portSuffix}`;
    };
  }
});

// node_modules/penpal/lib/errorSerialization.js
var serializeError, deserializeError;
var init_errorSerialization = __esm({
  "node_modules/penpal/lib/errorSerialization.js"() {
    serializeError = ({ name, message, stack }) => ({
      name,
      message,
      stack
    });
    deserializeError = (obj) => {
      const deserializedError = new Error();
      Object.keys(obj).forEach((key) => deserializedError[key] = obj[key]);
      return deserializedError;
    };
  }
});

// node_modules/penpal/lib/connectCallReceiver.js
var connectCallReceiver_default;
var init_connectCallReceiver = __esm({
  "node_modules/penpal/lib/connectCallReceiver.js"() {
    init_errorSerialization();
    init_enums();
    connectCallReceiver_default = (info, serializedMethods, log) => {
      const { localName, local, remote, originForSending, originForReceiving } = info;
      let destroyed = false;
      const handleMessageEvent = (event) => {
        if (event.source !== remote || event.data.penpal !== MessageType.Call) {
          return;
        }
        if (originForReceiving !== "*" && event.origin !== originForReceiving) {
          log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
          return;
        }
        const callMessage = event.data;
        const { methodName, args, id: id2 } = callMessage;
        log(`${localName}: Received ${methodName}() call`);
        const createPromiseHandler = (resolution) => {
          return (returnValue) => {
            log(`${localName}: Sending ${methodName}() reply`);
            if (destroyed) {
              log(`${localName}: Unable to send ${methodName}() reply due to destroyed connection`);
              return;
            }
            const message = {
              penpal: MessageType.Reply,
              id: id2,
              resolution,
              returnValue
            };
            if (resolution === Resolution.Rejected && returnValue instanceof Error) {
              message.returnValue = serializeError(returnValue);
              message.returnValueIsError = true;
            }
            try {
              remote.postMessage(message, originForSending);
            } catch (err) {
              if (err.name === NativeErrorName.DataCloneError) {
                const errorReplyMessage = {
                  penpal: MessageType.Reply,
                  id: id2,
                  resolution: Resolution.Rejected,
                  returnValue: serializeError(err),
                  returnValueIsError: true
                };
                remote.postMessage(errorReplyMessage, originForSending);
              }
              throw err;
            }
          };
        };
        new Promise((resolve) => resolve(serializedMethods[methodName].apply(serializedMethods, args))).then(createPromiseHandler(Resolution.Fulfilled), createPromiseHandler(Resolution.Rejected));
      };
      local.addEventListener(NativeEventType.Message, handleMessageEvent);
      return () => {
        destroyed = true;
        local.removeEventListener(NativeEventType.Message, handleMessageEvent);
      };
    };
  }
});

// node_modules/penpal/lib/generateId.js
var id, generateId_default;
var init_generateId = __esm({
  "node_modules/penpal/lib/generateId.js"() {
    id = 0;
    generateId_default = () => ++id;
  }
});

// node_modules/penpal/lib/methodSerialization.js
var KEY_PATH_DELIMITER, keyPathToSegments, segmentsToKeyPath, createKeyPath, setAtKeyPath, serializeMethods, deserializeMethods;
var init_methodSerialization = __esm({
  "node_modules/penpal/lib/methodSerialization.js"() {
    KEY_PATH_DELIMITER = ".";
    keyPathToSegments = (keyPath) => keyPath ? keyPath.split(KEY_PATH_DELIMITER) : [];
    segmentsToKeyPath = (segments) => segments.join(KEY_PATH_DELIMITER);
    createKeyPath = (key, prefix) => {
      const segments = keyPathToSegments(prefix || "");
      segments.push(key);
      return segmentsToKeyPath(segments);
    };
    setAtKeyPath = (subject, keyPath, value) => {
      const segments = keyPathToSegments(keyPath);
      segments.reduce((prevSubject, key, idx) => {
        if (typeof prevSubject[key] === "undefined") {
          prevSubject[key] = {};
        }
        if (idx === segments.length - 1) {
          prevSubject[key] = value;
        }
        return prevSubject[key];
      }, subject);
      return subject;
    };
    serializeMethods = (methods, prefix) => {
      const flattenedMethods = {};
      Object.keys(methods).forEach((key) => {
        const value = methods[key];
        const keyPath = createKeyPath(key, prefix);
        if (typeof value === "object") {
          Object.assign(flattenedMethods, serializeMethods(value, keyPath));
        }
        if (typeof value === "function") {
          flattenedMethods[keyPath] = value;
        }
      });
      return flattenedMethods;
    };
    deserializeMethods = (flattenedMethods) => {
      const methods = {};
      for (const keyPath in flattenedMethods) {
        setAtKeyPath(methods, keyPath, flattenedMethods[keyPath]);
      }
      return methods;
    };
  }
});

// node_modules/penpal/lib/connectCallSender.js
var connectCallSender_default;
var init_connectCallSender = __esm({
  "node_modules/penpal/lib/connectCallSender.js"() {
    init_generateId();
    init_errorSerialization();
    init_methodSerialization();
    init_enums();
    connectCallSender_default = (callSender, info, methodKeyPaths, destroyConnection, log) => {
      const { localName, local, remote, originForSending, originForReceiving } = info;
      let destroyed = false;
      log(`${localName}: Connecting call sender`);
      const createMethodProxy = (methodName) => {
        return (...args) => {
          log(`${localName}: Sending ${methodName}() call`);
          let iframeRemoved;
          try {
            if (remote.closed) {
              iframeRemoved = true;
            }
          } catch (e) {
            iframeRemoved = true;
          }
          if (iframeRemoved) {
            destroyConnection();
          }
          if (destroyed) {
            const error = new Error(`Unable to send ${methodName}() call due to destroyed connection`);
            error.code = ErrorCode.ConnectionDestroyed;
            throw error;
          }
          return new Promise((resolve, reject) => {
            const id2 = generateId_default();
            const handleMessageEvent = (event) => {
              if (event.source !== remote || event.data.penpal !== MessageType.Reply || event.data.id !== id2) {
                return;
              }
              if (originForReceiving !== "*" && event.origin !== originForReceiving) {
                log(`${localName} received message from origin ${event.origin} which did not match expected origin ${originForReceiving}`);
                return;
              }
              const replyMessage = event.data;
              log(`${localName}: Received ${methodName}() reply`);
              local.removeEventListener(NativeEventType.Message, handleMessageEvent);
              let returnValue = replyMessage.returnValue;
              if (replyMessage.returnValueIsError) {
                returnValue = deserializeError(returnValue);
              }
              (replyMessage.resolution === Resolution.Fulfilled ? resolve : reject)(returnValue);
            };
            local.addEventListener(NativeEventType.Message, handleMessageEvent);
            const callMessage = {
              penpal: MessageType.Call,
              id: id2,
              methodName,
              args
            };
            remote.postMessage(callMessage, originForSending);
          });
        };
      };
      const flattenedMethods = methodKeyPaths.reduce((api, name) => {
        api[name] = createMethodProxy(name);
        return api;
      }, {});
      Object.assign(callSender, deserializeMethods(flattenedMethods));
      return () => {
        destroyed = true;
      };
    };
  }
});

// node_modules/penpal/lib/parent/handleAckMessageFactory.js
var handleAckMessageFactory_default;
var init_handleAckMessageFactory = __esm({
  "node_modules/penpal/lib/parent/handleAckMessageFactory.js"() {
    init_connectCallReceiver();
    init_connectCallSender();
    handleAckMessageFactory_default = (serializedMethods, childOrigin, originForSending, destructor, log) => {
      const { destroy, onDestroy } = destructor;
      let destroyCallReceiver;
      let receiverMethodNames;
      const callSender = {};
      return (event) => {
        if (childOrigin !== "*" && event.origin !== childOrigin) {
          log(`Parent: Handshake - Received ACK message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
          return;
        }
        log("Parent: Handshake - Received ACK");
        const info = {
          localName: "Parent",
          local: window,
          remote: event.source,
          originForSending,
          originForReceiving: childOrigin
        };
        if (destroyCallReceiver) {
          destroyCallReceiver();
        }
        destroyCallReceiver = connectCallReceiver_default(info, serializedMethods, log);
        onDestroy(destroyCallReceiver);
        if (receiverMethodNames) {
          receiverMethodNames.forEach((receiverMethodName) => {
            delete callSender[receiverMethodName];
          });
        }
        receiverMethodNames = event.data.methodNames;
        const destroyCallSender = connectCallSender_default(callSender, info, receiverMethodNames, destroy, log);
        onDestroy(destroyCallSender);
        return callSender;
      };
    };
  }
});

// node_modules/penpal/lib/parent/handleSynMessageFactory.js
var handleSynMessageFactory_default;
var init_handleSynMessageFactory = __esm({
  "node_modules/penpal/lib/parent/handleSynMessageFactory.js"() {
    init_enums();
    handleSynMessageFactory_default = (log, serializedMethods, childOrigin, originForSending) => {
      return (event) => {
        if (!event.source) {
          return;
        }
        if (childOrigin !== "*" && event.origin !== childOrigin) {
          log(`Parent: Handshake - Received SYN message from origin ${event.origin} which did not match expected origin ${childOrigin}`);
          return;
        }
        log("Parent: Handshake - Received SYN, responding with SYN-ACK");
        const synAckMessage = {
          penpal: MessageType.SynAck,
          methodNames: Object.keys(serializedMethods)
        };
        event.source.postMessage(synAckMessage, originForSending);
      };
    };
  }
});

// node_modules/penpal/lib/parent/monitorIframeRemoval.js
var CHECK_IFRAME_IN_DOC_INTERVAL, monitorIframeRemoval_default;
var init_monitorIframeRemoval = __esm({
  "node_modules/penpal/lib/parent/monitorIframeRemoval.js"() {
    CHECK_IFRAME_IN_DOC_INTERVAL = 6e4;
    monitorIframeRemoval_default = (iframe, destructor) => {
      const { destroy, onDestroy } = destructor;
      const checkIframeInDocIntervalId = setInterval(() => {
        if (!iframe.isConnected) {
          clearInterval(checkIframeInDocIntervalId);
          destroy();
        }
      }, CHECK_IFRAME_IN_DOC_INTERVAL);
      onDestroy(() => {
        clearInterval(checkIframeInDocIntervalId);
      });
    };
  }
});

// node_modules/penpal/lib/startConnectionTimeout.js
var startConnectionTimeout_default;
var init_startConnectionTimeout = __esm({
  "node_modules/penpal/lib/startConnectionTimeout.js"() {
    init_enums();
    startConnectionTimeout_default = (timeout, callback) => {
      let timeoutId;
      if (timeout !== void 0) {
        timeoutId = window.setTimeout(() => {
          const error = new Error(`Connection timed out after ${timeout}ms`);
          error.code = ErrorCode.ConnectionTimeout;
          callback(error);
        }, timeout);
      }
      return () => {
        clearTimeout(timeoutId);
      };
    };
  }
});

// node_modules/penpal/lib/parent/validateIframeHasSrcOrSrcDoc.js
var validateIframeHasSrcOrSrcDoc_default;
var init_validateIframeHasSrcOrSrcDoc = __esm({
  "node_modules/penpal/lib/parent/validateIframeHasSrcOrSrcDoc.js"() {
    init_enums();
    validateIframeHasSrcOrSrcDoc_default = (iframe) => {
      if (!iframe.src && !iframe.srcdoc) {
        const error = new Error("Iframe must have src or srcdoc property defined.");
        error.code = ErrorCode.NoIframeSrc;
        throw error;
      }
    };
  }
});

// node_modules/penpal/lib/parent/connectToChild.js
var connectToChild_default;
var init_connectToChild = __esm({
  "node_modules/penpal/lib/parent/connectToChild.js"() {
    init_enums();
    init_createDestructor();
    init_createLogger();
    init_getOriginFromSrc();
    init_handleAckMessageFactory();
    init_handleSynMessageFactory();
    init_methodSerialization();
    init_monitorIframeRemoval();
    init_startConnectionTimeout();
    init_validateIframeHasSrcOrSrcDoc();
    connectToChild_default = (options) => {
      let { iframe, methods = {}, childOrigin, timeout, debug = false } = options;
      const log = createLogger_default(debug);
      const destructor = createDestructor_default("Parent", log);
      const { onDestroy, destroy } = destructor;
      if (!childOrigin) {
        validateIframeHasSrcOrSrcDoc_default(iframe);
        childOrigin = getOriginFromSrc_default(iframe.src);
      }
      const originForSending = childOrigin === "null" ? "*" : childOrigin;
      const serializedMethods = serializeMethods(methods);
      const handleSynMessage = handleSynMessageFactory_default(log, serializedMethods, childOrigin, originForSending);
      const handleAckMessage = handleAckMessageFactory_default(serializedMethods, childOrigin, originForSending, destructor, log);
      const promise = new Promise((resolve, reject) => {
        const stopConnectionTimeout = startConnectionTimeout_default(timeout, destroy);
        const handleMessage = (event) => {
          if (event.source !== iframe.contentWindow || !event.data) {
            return;
          }
          if (event.data.penpal === MessageType.Syn) {
            handleSynMessage(event);
            return;
          }
          if (event.data.penpal === MessageType.Ack) {
            const callSender = handleAckMessage(event);
            if (callSender) {
              stopConnectionTimeout();
              resolve(callSender);
            }
            return;
          }
        };
        window.addEventListener(NativeEventType.Message, handleMessage);
        log("Parent: Awaiting handshake");
        monitorIframeRemoval_default(iframe, destructor);
        onDestroy((error) => {
          window.removeEventListener(NativeEventType.Message, handleMessage);
          if (error) {
            reject(error);
          }
        });
      });
      return {
        promise,
        destroy() {
          destroy();
        }
      };
    };
  }
});

// node_modules/penpal/lib/child/handleSynAckMessageFactory.js
var handleSynAckMessageFactory_default;
var init_handleSynAckMessageFactory = __esm({
  "node_modules/penpal/lib/child/handleSynAckMessageFactory.js"() {
    init_enums();
    init_connectCallReceiver();
    init_connectCallSender();
    handleSynAckMessageFactory_default = (parentOrigin, serializedMethods, destructor, log) => {
      const { destroy, onDestroy } = destructor;
      return (event) => {
        let originQualifies = parentOrigin instanceof RegExp ? parentOrigin.test(event.origin) : parentOrigin === "*" || parentOrigin === event.origin;
        if (!originQualifies) {
          log(`Child: Handshake - Received SYN-ACK from origin ${event.origin} which did not match expected origin ${parentOrigin}`);
          return;
        }
        log("Child: Handshake - Received SYN-ACK, responding with ACK");
        const originForSending = event.origin === "null" ? "*" : event.origin;
        const ackMessage = {
          penpal: MessageType.Ack,
          methodNames: Object.keys(serializedMethods)
        };
        window.parent.postMessage(ackMessage, originForSending);
        const info = {
          localName: "Child",
          local: window,
          remote: window.parent,
          originForSending,
          originForReceiving: event.origin
        };
        const destroyCallReceiver = connectCallReceiver_default(info, serializedMethods, log);
        onDestroy(destroyCallReceiver);
        const callSender = {};
        const destroyCallSender = connectCallSender_default(callSender, info, event.data.methodNames, destroy, log);
        onDestroy(destroyCallSender);
        return callSender;
      };
    };
  }
});

// node_modules/penpal/lib/child/connectToParent.js
var areGlobalsAccessible, connectToParent_default;
var init_connectToParent = __esm({
  "node_modules/penpal/lib/child/connectToParent.js"() {
    init_createDestructor();
    init_createLogger();
    init_enums();
    init_handleSynAckMessageFactory();
    init_methodSerialization();
    init_startConnectionTimeout();
    areGlobalsAccessible = () => {
      try {
        clearTimeout();
      } catch (e) {
        return false;
      }
      return true;
    };
    connectToParent_default = (options = {}) => {
      const { parentOrigin = "*", methods = {}, timeout, debug = false } = options;
      const log = createLogger_default(debug);
      const destructor = createDestructor_default("Child", log);
      const { destroy, onDestroy } = destructor;
      const serializedMethods = serializeMethods(methods);
      const handleSynAckMessage = handleSynAckMessageFactory_default(parentOrigin, serializedMethods, destructor, log);
      const sendSynMessage = () => {
        log("Child: Handshake - Sending SYN");
        const synMessage = { penpal: MessageType.Syn };
        const parentOriginForSyn = parentOrigin instanceof RegExp ? "*" : parentOrigin;
        window.parent.postMessage(synMessage, parentOriginForSyn);
      };
      const promise = new Promise((resolve, reject) => {
        const stopConnectionTimeout = startConnectionTimeout_default(timeout, destroy);
        const handleMessage = (event) => {
          if (!areGlobalsAccessible()) {
            return;
          }
          if (event.source !== parent || !event.data) {
            return;
          }
          if (event.data.penpal === MessageType.SynAck) {
            const callSender = handleSynAckMessage(event);
            if (callSender) {
              window.removeEventListener(NativeEventType.Message, handleMessage);
              stopConnectionTimeout();
              resolve(callSender);
            }
          }
        };
        window.addEventListener(NativeEventType.Message, handleMessage);
        sendSynMessage();
        onDestroy((error) => {
          window.removeEventListener(NativeEventType.Message, handleMessage);
          if (error) {
            reject(error);
          }
        });
      });
      return {
        promise,
        destroy() {
          destroy();
        }
      };
    };
  }
});

// node_modules/penpal/lib/index.js
var lib_exports = {};
__export(lib_exports, {
  ErrorCode: () => ErrorCode,
  connectToChild: () => connectToChild_default,
  connectToParent: () => connectToParent_default
});
var init_lib = __esm({
  "node_modules/penpal/lib/index.js"() {
    init_connectToChild();
    init_connectToParent();
    init_enums();
  }
});

// node_modules/@chili-publish/publisher-interface/lib/PublisherInterface.js
var require_PublisherInterface = __commonJS({
  "node_modules/@chili-publish/publisher-interface/lib/PublisherInterface.js"(exports, module) {
    var $7i1sb$penpal = (init_lib(), __toCommonJS(lib_exports));
    function $parcel$export(e, n, v, s) {
      Object.defineProperty(e, n, { get: v, set: s, enumerable: true, configurable: true });
    }
    $parcel$export(module.exports, "PublisherInterface", () => $3db7bcc71a7ab568$export$a13915682e709c4f, (v) => $3db7bcc71a7ab568$export$a13915682e709c4f = v);
    var $3db7bcc71a7ab568$var$__awaiter = function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var $3db7bcc71a7ab568$var$__classPrivateFieldGet = function(receiver, state, kind, f) {
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var $3db7bcc71a7ab568$var$__classPrivateFieldSet = function(receiver, state, value, kind, f) {
      if (kind === "m")
        throw new TypeError("Private method is not writable");
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var $3db7bcc71a7ab568$var$_PublisherInterface_editorObject;
    var $3db7bcc71a7ab568$var$createCustomFunctionsInterface = function(chiliWrapper, createDebugLog) {
      return {
        register: function(name, body) {
          return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
            createDebugLog({
              functionName: "registerFunction()"
            });
            const response = yield chiliWrapper.registerFunction(name, body);
            if (response.isError)
              throw new Error(response.error);
          });
        },
        registerOnEvent: function(eventName, body) {
          return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
            createDebugLog({
              functionName: "registerFunction()"
            });
            const response = yield chiliWrapper.registerFunctionOnEvent(eventName, body);
            if (response.isError)
              throw new Error(response.error);
          });
        },
        execute: function(name, ...args) {
          return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
            createDebugLog({
              functionName: "executeRegisteredFunction()"
            });
            const response = yield chiliWrapper.executeRegisteredFunction(name, args);
            if (response.isError)
              throw new Error(response.error);
            return response.ok;
          });
        }
      };
    };
    var $3db7bcc71a7ab568$export$a13915682e709c4f = class _$3db7bcc71a7ab568$export$a13915682e709c4f {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {
        this.customFunction = {
          register: function(name, body) {
            throw new Error("Function not implemented.");
          },
          registerOnEvent: function(eventName, body) {
            throw new Error("Function not implemented.");
          },
          execute: function(name, args) {
            throw new Error("Function not implemented.");
          }
        };
        this.chiliEventListenerCallbacks = /* @__PURE__ */ new Map();
        this.debug = false;
        this.creationTime = "";
        $3db7bcc71a7ab568$var$_PublisherInterface_editorObject.set(this, null);
        this.getProperty = this.getObject;
      }
      static buildWithIframe(targetIframe, options) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          return _$3db7bcc71a7ab568$export$a13915682e709c4f.build(Object.assign({
            targetIframe
          }, options));
        });
      }
      static buildOnElement(parentElement, editorURL, options) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          return _$3db7bcc71a7ab568$export$a13915682e709c4f.build(Object.assign({
            parentElement,
            editorURL
          }, options));
        });
      }
      /**
       * The build method will wait for a connection to the other side of iframe. Must be called before iframe `onload` event is fired.
       *
       * @param iframe
       * @param options
       * @returns {PublisherInterface}
       */
      static build(options) {
        var _a, _b, _c, _d;
        return $3db7bcc71a7ab568$var$__awaiter(this, arguments, void 0, function* () {
          if (arguments[0].tagName == "IFRAME") {
            const originalOptions = (_a = arguments[1]) !== null && _a !== void 0 ? _a : {};
            options = Object.assign(Object.assign({}, originalOptions), {
              targetIframe: arguments[0],
              debug: (_b = options.debug) !== null && _b !== void 0 ? _b : originalOptions["penpalDebug"]
            });
          }
          const stringifiedOptions = ((opts) => {
            try {
              return JSON.stringify(opts);
            } catch (e) {
              return e.toString();
            }
          })(options);
          const publisherInterface = new _$3db7bcc71a7ab568$export$a13915682e709c4f();
          publisherInterface.creationTime = (/* @__PURE__ */ new Date()).toLocaleString();
          publisherInterface.debug = (_c = options.debug) !== null && _c !== void 0 ? _c : false;
          publisherInterface.createDebugLog({
            functionName: "build()",
            customMessage: "Calling build() with options: " + stringifiedOptions
          });
          const iframe = (_d = options.targetIframe) !== null && _d !== void 0 ? _d : document.createElement("iframe");
          publisherInterface.iframe = iframe;
          if (options.editorURL != null)
            iframe.src = options.editorURL;
          const connectionPromise = (0, $7i1sb$penpal.connectToChild)({
            iframe: (
              // The iframe to which a connection should be made
              iframe
            ),
            // Methods the parent is exposing to the child
            methods: {
              handleEvents: publisherInterface.handleEvents.bind(publisherInterface)
            },
            timeout: options.timeout,
            debug: options.debug
          });
          if (options.parentElement != null)
            options.parentElement.appendChild(iframe);
          publisherInterface.child = yield connectionPromise.promise;
          publisherInterface.customFunction = $3db7bcc71a7ab568$var$createCustomFunctionsInterface(publisherInterface.child, publisherInterface.createDebugLog.bind(publisherInterface));
          const events = options.events;
          if (events != null && events.length > 0) {
            for (const event of events)
              if (typeof event == "string")
                publisherInterface.addListener(event);
              else
                publisherInterface.addListener(event.name, event.func);
          }
          return publisherInterface;
        });
      }
      handleEvents(eventName, id2) {
        var _a;
        this.chiliEventListenerCallbacks.has(eventName) && ((_a = this.chiliEventListenerCallbacks.get(eventName)) === null || _a === void 0 || _a(id2));
        return eventName;
      }
      /**
       * Logs a function call creation if debug is enabled
       * @param functionName The name of the function being executed
       */
      createDebugLog({ functionName, customMessage }) {
        if (this.debug) {
          if (customMessage != null)
            console.log(`[PublisherInterface - ${this.creationTime}]`, `${functionName} : ${customMessage}`);
          else
            console.log(`[PublisherInterface - ${this.creationTime}]`, `Creating ${functionName} call request`);
        }
      }
      /**
       * Returns an alias for editorObject with similarly named functions. This is to help with backwards compatibility, but these functions still return a Promise.
       */
      get editorObject() {
        if ($3db7bcc71a7ab568$var$__classPrivateFieldGet(this, $3db7bcc71a7ab568$var$_PublisherInterface_editorObject, "f") == null)
          $3db7bcc71a7ab568$var$__classPrivateFieldSet(this, $3db7bcc71a7ab568$var$_PublisherInterface_editorObject, {
            Alert: this.alert.bind(this),
            GetDirtyState: this.getDirtyState.bind(this),
            NextPage: this.nextPage.bind(this),
            PreviousPage: this.previousPage.bind(this),
            SetSelectedPage: this.setSelectedPage.bind(this),
            GetSelectedPage: this.getSelectedPage.bind(this),
            GetSelectedPageName: this.getSelectedPageName.bind(this),
            GetNumPages: this.getNumPages.bind(this),
            RemoveListener: this.removeListener.bind(this),
            AddListener: this.addListener.bind(this),
            GetObject: this.getObject.bind(this),
            SetProperty: this.setProperty.bind(this),
            ExecuteFunction: this.executeFunction.bind(this),
            GetPageSnapshot: this.getPageSnapshot.bind(this),
            GetFrameSnapshot: this.getFrameSnapshot.bind(this),
            GetFrameSubjectArea: this.getFrameSubjectArea.bind(this),
            SetFrameSubjectArea: this.setFrameSubjectArea.bind(this),
            ClearFrameSubjectArea: this.clearFrameSubjectArea.bind(this),
            GetAssetSubjectInfo: this.getAssetSubjectInfo.bind(this),
            SetAssetSubjectInfo: this.setAssetSubjectInfo.bind(this),
            ClearAssetSubjectInfo: this.clearAssetSubjectInfo.bind(this),
            SetVariableIsLocked: this.setVariableIsLocked.bind(this)
          }, "f");
        return $3db7bcc71a7ab568$var$__classPrivateFieldGet(this, $3db7bcc71a7ab568$var$_PublisherInterface_editorObject, "f");
      }
      /**
       * Displays a modal box within the editor UI containing a title with a message.
       *
       * @param message - The message to be displayed.
       * @param title - The title/header of the modal.
       */
      alert(message, title) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "alert()"
          });
          const response = yield this.child.alert(message, title);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Returns value of document.isDirty which signifies if the document has been changed since previous save.
       *
       * @returns Returns boolean to signify if the document has been changed since previous save.
       */
      getDirtyState() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getDirtyState()"
          });
          const response = yield this.child.getDirtyState();
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Selects the next page in the document.pages list.
       * If the current selected page has the beginning index 0 then nothing happens.
       */
      nextPage() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "nextPage()"
          });
          const response = yield this.child.nextPage();
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Selects the previous page in the document.pages list.
       * If the current selected page has the last index then nothing happens.
       */
      previousPage() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "previousPage()"
          });
          const response = yield this.child.previousPage();
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Selects page by common language page number causing the editor to visually jump to that page.
       *
       * @param page - Common language page number (page index + 1) to select.
       */
      setSelectedPage(page) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "setSelectedPage()"
          });
          const response = yield this.child.setSelectedPage(page);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Returns the common language page number, which is page index + 1.
       * So if you have page with index 0 selected, this would return 1.
       *
       * @returns Page index + 1 of the selected page.
       */
      getSelectedPage() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getSelectedPage()"
          });
          const response = yield this.child.getSelectedPage();
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Returns the name of the selected page.
       *
       * @returns Name of the page.
       */
      getSelectedPageName() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getSelectedPageName()"
          });
          const response = yield this.child.getSelectedPageName();
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Returns the total number of pages.
       *
       * @returns The total number of pages.
       */
      getNumPages() {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getNumPages()"
          });
          const response = yield this.child.getNumPages();
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Removes the listener for the specified editor event.
       *
       * @param eventName - A case-sensitive string representing the editor event type to stop listening to.
       */
      removeListener(eventName) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "removeListener()"
          });
          this.chiliEventListenerCallbacks.delete(eventName);
          const response = yield this.child.removeListener(eventName);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Adds a listener to an editor event and a user defined callback function when event is fired.
       * The function will receive the target id of the event and is executed when the event is triggered.
       *
       * @example
       * ```ts
       * publisherInterface.addListener("FrameMoved", (targetId)=>{console.log(targetId)}));
       * ```
       * @param eventName - A case-sensitive string representing the editor event type to listen for.
       * @param callbackFunction - A function that executes when the event is triggered. If callback is null, the listener will instead call window.OnEditorEvent
       */
      addListener(eventName, callbackFunction) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "addListener()"
          });
          this.chiliEventListenerCallbacks.set(eventName, callbackFunction == null ? (targetID) => {
            if (window.OnEditorEvent != null)
              window.OnEditorEvent(eventName, targetID);
          } : callbackFunction);
          const response = yield this.child.addListener(eventName);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Gets the value of the property or object found at given chiliPath.
       *
       * @param chiliPath - A case-sensitive string query path for selecting properties and objects in a CHILI document.
       * @returns Returns the value of the property or object found at given chiliPath.
       */
      getObject(chiliPath) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getObject()"
          });
          const response = yield this.child.getObject(chiliPath);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Sets the value of the property defined by property on the object defined by the chiliPath
       *
       * @param chiliPath - A case-sensitive string query path for selecting properties and objects in a CHILI document.
       * @param property - The case-sensitive string name of the property found on the object of the chiliPath.
       * @param value - The value to set the property.
       */
      setProperty(chiliPath, property, value) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "setProperty()"
          });
          const response = yield this.child.setProperty(chiliPath, property, value);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Executes function of functionName found as a property or method on the object defined in the chiliPath.
       *
       * @example
       * // Will add a new frame of type text on page of index 0 at coordinates X: 10 mm and Y: 15 mm with width: 100 mm and height: 50 mm
       * ```ts
       * publisherInterface.executeFunction('document.pages[0].frames', 'Add', 'text', '10 mm', '15 mm', '100 mm', '50 mm');
       * ```
       * @param chiliPath - A case-sensitive string query path for selecting properties and objects in a CHILI document.
       * @param functionName - A case-sensitive string of the name of the function to execute.
       * @param args - Parameters to be passed to function of functionName.
       * @returns Returns the return of executed function.
       */
      executeFunction(chiliPath, functionName, ...args) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "executeFunction()"
          });
          const response = yield this.child.executeFunction(chiliPath, functionName, args);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Returns a base64 encoded PNG snapshot image of a specific page.
       *
       * @example
       * ```ts
       * \\ This will get a 1000 by 1000 image of the first page and open it in a popup.
       * let base64 = publisherInterface.getPageSnapshot('0', '1000x1000', null, null, 'preview', true);
       *
       * let newImage = new Image();
       * newImage.src = "data:image/png;base64," + base64;
       *
       * let popup = open("", "Popup", "width=1000,height=1000,top="+(window.screen.height/2)+",left="+(window.screen.height/2));
       * popup.document.body.appendChild(newImage);
       * ```
       *
       * @param pageIndex - The page index to return as an image.
       * @param size - The size of the returned png. This can be set as an image size in pixels by using a string width x height. For example "1000x1500". This can be set as a zoom level. For example "75" would be 75% zoom of the document. This can be set as an object of width and height. For example \{width:1000 height:1000\}. If the size is set in pixels and the ratio is different from the page ratio, the image is scaled to fit entirely in the png and placed at (0,0) top left. The extra space at the bottom or the right is filled with background color. If a zoom percentage is given, the output size is automatically calculated using the document dimensions, assuming the resolution is 72 dpi.
       * @param layers - An array of layers that are to be visible in the png. An array of visible layers can be provided using the layer "name" property or layer "id" property. If no list is passed, the layer visibility is the same as in the editor window.
       * @param frames - An array of frames that are visible in the png. An array of visible frame elements can be provided using the frame "tag" property or layer "id" property. If no list is passed, the frame visibility is the same as in the editor window.
       * @param viewMode - A string that is either: preview, edit, or technical. "preview" shows the page in standard preview mode in the same way as the editor does. If there is an active selection, it should not be indicated in the resulting png. Annotations should be hidden. "edit" shows the page in standard edit mode in the same way as the editor does. The view can be identical to the editor view, with active selections and frame handles. "technical" shows the page in edit mode, but without the control handles and selections. Annotations should be hidden.
       * @param transparentBackground - A boolean that determines if the png document background should be transparent.
       * @returns A base64 encoded PNG image of the document.
       */
      getPageSnapshot(pageIndex, size, layers, frames, viewMode, transparentBackground) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getPageSnapshot()"
          });
          const response = yield this.child.getPageSnapshot(pageIndex, size, layers, frames, viewMode, transparentBackground);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Returns a base64 encoded PNG snapshot image of a specific frame
       *
       * @param idOrTag - The id or tag of the frame to return as an image.
       * @param size - The size of the returned png. This can be set as an image size in pixels by using a string width x height. For example "1000x1500". This can be set as a zoom level. For example "75" would be 75% zoom of the document. This can be set as an object of width and height. For example \{width:1000 height:1000\}. If the size is set in pixels and the ratio is different from the page ratio, the image is scaled to fit entirely in the png and placed at (0,0) top left. The extra space at the bottom or the right is filled with background color. If a zoom percentage is given, the output size is automatically calculated using the document dimensions, assuming the resolution is 72 dpi.
       * @param transparentBackground - A boolean that determines if the png document background should be transparent.
       * @returns A base64 encoded PNG image of the frame.
       */
      getFrameSnapshot(idOrTag, size, transparentBackground) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getFrameSnapshot()"
          });
          const response = yield this.child.getFrameSnapshot(idOrTag, size, transparentBackground);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Gets the frame subject area for the image fit mode Smart Fit.
       *
       * @param idOrTag - The string id or tag of the frame.
       * @returns - The subject area of the frame.
       */
      getFrameSubjectArea(idOrTag) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getFrameSubjectArea()"
          });
          const response = yield this.child.getFrameSubjectArea(idOrTag);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Sets the frame subject area for the image fit mode Smart Fit.
       *
       * @param idOrTag - The string id or tag of the frame.
       * @param x - A number 0 to 1 representing the x coordinate. Setting the number outside that range will clip the result to 0 or 1.
       * @param y - A number 0 to 1 representing the y coordinate. Setting the number outside that range will clip the result to 0 or 1.
       * @param width - A number 0 to 1 representing width. Setting the number outside that range will clip the result to 0 or 1.
       * @param height -A number 0 to 1 representing height. Setting the number outside that range will clip the result to 0 or 1.
       */
      setFrameSubjectArea(idOrTag, x, y, width, height) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "setFrameSubjectArea()"
          });
          const response = yield this.child.setFrameSubjectArea(idOrTag, x, y, width, height);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Resets the frame subject area to \{height: "0", width: "0", x: "1", y: "1"\}.
       *
       * @param idOrTag - The string id or tag of the frame to clear the subject area.
       */
      clearFrameSubjectArea(idOrTag) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "clearFrameSubjectArea()"
          });
          const response = yield this.child.clearFrameSubjectArea(idOrTag);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Gets the asset subject area for the target frame for image fit mode Smart Fit.
       *
       * @param frameIdOrTag - The string id or tag of the frame.
       * @returns The asset subject area.
       */
      getAssetSubjectInfo(frameIdOrTag) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "getAssetSubjectInfo()"
          });
          const response = yield this.child.getAssetSubjectInfo(frameIdOrTag);
          if (response.isError)
            throw new Error(response.error);
          return response.ok;
        });
      }
      /**
       * Sets the asset subject area for the target frame for image fit mode Smart Fit.
       *
       * @param frameIdOrTag - The string id or tag of the frame.
       * @param x - A number 0 to 1 representing the x coordinate. Setting the number outside that range will clip the result to 0 or 1.
       * @param y - A number 0 to 1 representing the y coordinate. Setting the number outside that range will clip the result to 0 or 1.
       * @param width - A number 0 to 1 representing width. Setting the number outside that range will clip the result to 0 or 1.
       * @param height - A number 0 to 1 representing height. Setting the number outside that range will clip the result to 0 or 1.
       * @param poiX - A number 0 to 1 representing x coordinate of teh point of interest. Setting the number outside that range will clip the result to 0 or 1.
       * @param poiY - A number 0 to 1 representing y coordinate of teh point of interest.
       */
      setAssetSubjectInfo(frameIdOrTag, x, y, width, height, poiX, poiY) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "setAssetSubjectInfo()"
          });
          const response = yield this.child.setAssetSubjectInfo(frameIdOrTag, x, y, width, height, poiX, poiY);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       * Resets the asset subject area of target to \{height: "0", width: "0", x: "1", y: "1", poiX: "0.5", poiY: "0.5"\}.
       *
       * @param frameIdOrTag - The string id or tag of the frame to clear the asset subject area.
       */
      clearAssetSubjectInfo(frameIdOrTag) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "clearAssetSubjectInfo()"
          });
          const response = yield this.child.clearAssetSubjectInfo(frameIdOrTag);
          if (response.isError)
            throw new Error(response.error);
        });
      }
      /**
       *  Sets the locked (editable) state of a variable.
       *
       * @param variableName - A case-sensitive string of the variable name to target.
       * @param isLocked - A boolean to set the variable as locked or unlocked.
       */
      setVariableIsLocked(variableName, isLocked) {
        return $3db7bcc71a7ab568$var$__awaiter(this, void 0, void 0, function* () {
          this.createDebugLog({
            functionName: "setVariableIsLocked()"
          });
          const response = yield this.child.setVariableIsLocked(variableName, isLocked);
          if (response.isError)
            throw new Error(response.error);
        });
      }
    };
    $3db7bcc71a7ab568$var$_PublisherInterface_editorObject = /* @__PURE__ */ new WeakMap();
  }
});
export default require_PublisherInterface();
//# sourceMappingURL=@chili-publish_publisher-interface.js.map
