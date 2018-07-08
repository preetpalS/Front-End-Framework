"use strict";
// This file contains types and internal state used by the framework that individual components
// in the library need knowledge of such as FrontEndFramework.ObjectLifeCycle.
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.gHndl = window;
    ;
    FrontEndFramework.HtmlInputChangeEvents = 'change textInput input';
    ;
    ;
    // TODO: Add support for other SPA frameworks here.
    FrontEndFramework.WindowsUwpEnvironment = (typeof FrontEndFramework.gHndl.Windows !== 'undefined') && (FrontEndFramework.gHndl.Windows != null);
    FrontEndFramework.TurbolinksAvailable = (typeof Turbolinks !== 'undefined') && (Turbolinks != null);
    FrontEndFramework.SinglePageApplication = FrontEndFramework.TurbolinksAvailable;
    FrontEndFramework.RuntimeSupportedIntegration = 0 /* NoFramework */;
    // TODO: Support Turbolinks in Windows UWP Environment
    if (FrontEndFramework.WindowsUwpEnvironment) {
        FrontEndFramework.RuntimeSupportedIntegration = 2 /* WindowsUWP */;
    }
    else if (FrontEndFramework.TurbolinksAvailable) {
        FrontEndFramework.RuntimeSupportedIntegration = 1 /* Turbolinks */;
    }
    // TODO: Add support for other SPA frameworks here.
    FrontEndFramework.PagePreCacheEvent = FrontEndFramework.TurbolinksAvailable ? 'turbolinks:before-cache' : null;
    // To be set by user (fired when DOM is ready)
    FrontEndFramework.readyFunc = null;
    // For users to supply hooks (lambda functions) that they want to fire on each navigation (note
    // that these arrays are not emptied as executed).
    FrontEndFramework.cleanupHooks = [];
    FrontEndFramework.preReadyHooks = [];
    FrontEndFramework.postReadyHooks = [];
})(FrontEndFramework || (FrontEndFramework = {}));
var FrontEndFramework;
(function (FrontEndFramework) {
    var ScreenDimensions;
    (function (ScreenDimensions) {
        ScreenDimensions.GetScreenDimensions = function () {
            return {
                availableHeight: window.screen.availHeight,
                availableWidth: window.screen.availWidth,
                deviceHeight: window.screen.height,
                deviceWidth: window.screen.width
            };
        };
    })(ScreenDimensions = FrontEndFramework.ScreenDimensions || (FrontEndFramework.ScreenDimensions = {}));
})(FrontEndFramework || (FrontEndFramework = {}));
/// <reference path="./base.js.ts" />
// Depends on JQuery
// Depends on ./base.js.ts due to the fact that the future IUserInterfaceElement might rely on cleanupHooks
// for teardown logic.
var FrontEndFramework;
(function (FrontEndFramework) {
    var MiniHtmlViewModel;
    (function (MiniHtmlViewModel) {
        MiniHtmlViewModel.VERSION = '0.7.0';
        ;
        ;
        // Should inherit from this class instead of instantiating it directly.
        var ViewModel = /** @class */ (function () {
            function ViewModel(objectLifeCycle) {
                var bindableProperties = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    bindableProperties[_i - 1] = arguments[_i];
                }
                this.objectLifeCycle = objectLifeCycle;
                this.idToBindableProperty = {};
                bindableProperties.forEach(this.processBindableProperty, this);
                if (this.objectLifeCycle === 0 /* Transient */ &&
                    FrontEndFramework.SinglePageApplication &&
                    (FrontEndFramework.hooks.pageCleanup != null)) {
                    FrontEndFramework.hooks.pageCleanup.push(this.genTeardownFunc(this));
                }
            }
            ViewModel.prototype.processBindableProperty = function (bP) {
                switch (bP.id.constructor) {
                    case String:
                        this.processBindablePropertySingle(bP);
                        break;
                    case Array:
                        for (var i = 0; i < bP.id.length; i++) {
                            this.processBindablePropertySingle({
                                id: bP.id[i],
                                bindingMode: bP.bindingMode,
                                value: bP.value,
                                setDataFunc: bP.setDataFunc,
                                getDataFunc: bP.getDataFunc,
                                onChangeFunc: bP.onChangeFunc,
                                converterFunc: bP.converterFunc,
                                viewModelRef: bP.viewModelRef,
                                changeEvents: bP.changeEvents
                            });
                        }
                        break;
                    default:
                        console.error("Unacceptable id detected in IViewModelPropertyBase: " + bP);
                        break;
                }
            };
            ViewModel.prototype.processBindablePropertySingle = function (bP) {
                var _this = this;
                var bindablePropertyId = bP.id;
                try {
                    // Store and attach bindable properties that do not have a OneTime bindingMode.
                    // Note that OneTime bindingMode properties are not stored.
                    if (bP.bindingMode !== 0 /* OneTime */) {
                        bP.viewModelRef = this;
                        this.idToBindableProperty[bindablePropertyId] = bP;
                    }
                    // BindingMode.OneTime is set always
                    if ((bP.value !== undefined) || (bP.bindingMode === 0 /* OneTime */)) {
                        ViewModel.setValueForBindableProperty(bP, bindablePropertyId);
                    }
                    else {
                        ViewModel.retrieveAndSetValueForBindableProperty(bP, bindablePropertyId);
                    }
                    // Attach onChange event handler for TwoWay and OneWayRead properties.
                    if (bP.bindingMode === 3 /* TwoWay */ ||
                        bP.bindingMode === 1 /* OneWayRead */) {
                        var boundedFunc_1 = function (_ev) {
                            console.info("Detected change in: " + bindablePropertyId);
                            _this.handlePropertyChangedEvent(bindablePropertyId, 0 /* Read */);
                            if (bP.onChangeFunc != null) {
                                bP.onChangeFunc(bP.viewModelRef);
                            }
                            else if (typeof bP.viewModelRef.onChange === 'function') {
                                bP.viewModelRef.onChange(bindablePropertyId);
                            }
                            else {
                                console.error('Failed to provide onChangeFunc (alternatively implement onChange [(htmlId: string) => void] method) for implentation of IViewModelProperty for id: ' + bindablePropertyId);
                            }
                        };
                        ((bP.changeEvents == null) ? ViewModel.ChangeEvents : bP.changeEvents).split(' ').forEach(function (evString) {
                            switch (bP.id.constructor) {
                                case String:
                                    bP.boundEventFunc = boundedFunc_1;
                                    document.getElementById(bindablePropertyId).addEventListener(evString, bP.boundEventFunc);
                                    break;
                                case Array:
                                    if (bP.boundEventFuncs == null) {
                                        bP.boundEventFuncs = [];
                                    }
                                    bP.boundEventFuncs.push(boundedFunc_1);
                                    document.getElementById(bindablePropertyId).addEventListener(evString, bP.boundEventFuncs[(bP.boundEventFuncs).length - 1]);
                                    break;
                                default:
                                    console.error("Unacceptable id detected in IViewModelPropertyBase: " + bP);
                                    break;
                            }
                        });
                    }
                }
                catch (e) {
                    console.error(e);
                }
            };
            // Triggers change in UI to match value of property in idToBindableProperty.
            ViewModel.prototype.handlePropertyChangedEvent = function (propertyId, bindingOperationType) {
                if (bindingOperationType === void 0) { bindingOperationType = 1 /* Write */; }
                try {
                    var bindableProperty = this.idToBindableProperty[propertyId];
                    switch (bindingOperationType) {
                        case 1 /* Write */:
                            switch (bindableProperty.bindingMode) {
                                case 0 /* OneTime */:
                                case 1 /* OneWayRead */:
                                    console.warn("NOOP");
                                    break;
                                case 2 /* OneWayWrite */:
                                    ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                                    break;
                                case 3 /* TwoWay */:
                                    ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                                    break;
                                default:
                                    console.warn("Invalid bindingMode (" + bindableProperty.bindingMode + ") for Binding Property associated with id: " + propertyId);
                                    break;
                            }
                            break;
                        case 0 /* Read */:
                            switch (bindableProperty.bindingMode) {
                                case 0 /* OneTime */:
                                case 2 /* OneWayWrite */:
                                    console.warn("NOOP");
                                    break;
                                case 1 /* OneWayRead */:
                                    ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty, propertyId);
                                    break;
                                case 3 /* TwoWay */:
                                    ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty, propertyId);
                                    break;
                                default:
                                    console.warn("Invalid bindingMode (" + bindableProperty.bindingMode + ") for Binding Property associated with id: " + propertyId);
                                    break;
                            }
                            break;
                        default:
                            console.error("Invalid bindingOperationType: " + bindingOperationType);
                            break;
                    }
                }
                catch (e) {
                    console.log(e);
                }
            };
            ViewModel.prototype.genTeardownFunc = function (self) {
                return function () { self.teardown.call(self); };
            };
            ViewModel.prototype.teardown = function (overrideObjectLifeCycle) {
                var _this = this;
                if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
                if (this.objectLifeCycle === 2 /* InfinitePersistence */ &&
                    !overrideObjectLifeCycle) {
                    console.error('Failed to teardown FrontEndFramework.MiniHtmlViewModel.ViewModel instance due to objectLifeCycle not being overridden');
                    return;
                }
                Object.keys(this.idToBindableProperty).forEach(function (id) {
                    console.log("Cleaning up event handlers set up in ViewModel (id: " + id + ")");
                    var bP = _this.idToBindableProperty[id];
                    switch (bP.id.constructor) {
                        case String:
                            if (bP.boundEventFunc != null) {
                                ViewModel.ChangeEvents.split(' ').forEach(function (evString) {
                                    if (document.getElementById(id) != null)
                                        document.getElementById(id).removeEventListener(evString, bP.boundEventFunc);
                                });
                            }
                            break;
                        case Array:
                            if ((bP.boundEventFuncs != null) &&
                                (bP.boundEventFuncs.constructor === Array) &&
                                (bP.boundEventFuncs.length === bP.id.length)) {
                                var idx_1 = bP.id.indexOf(id);
                                if (idx_1 !== -1) {
                                    ViewModel.ChangeEvents.split(' ').forEach(function (evString) {
                                        if (document.getElementById(id) != null)
                                            document.getElementById(id).removeEventListener(evString, bP.boundEventFuncs[idx_1]);
                                    });
                                }
                                else {
                                    console.error('Internal invariant violated (guid: Dtsa43252xxq)');
                                }
                            }
                            else {
                                console.error('Internal invariant violated (guid: pta423taDTD)');
                            }
                            break;
                        default:
                            console.error("Unacceptable id detected in IViewModelPropertyBase: " + bP);
                            break;
                    }
                }, this);
            };
            ViewModel.retrieveAndSetValueForBindableProperty = function (bP, propertyId) {
                if (bP.getDataFunc != null) {
                    bP.value = bP.getDataFunc();
                }
                else {
                    bP.value = document.getElementById(propertyId).value;
                }
                return bP;
            };
            ViewModel.setValueForBindableProperty = function (bP, propertyId) {
                var cnvrtr = bP.converterFunc || function (x) { return x; };
                if (bP.setDataFunc == null) {
                    if (typeof FrontEndFramework.gHndl.$ === 'undefined') {
                        // Replaces: $('#' + propertyId).val(bP.value);
                        document.getElementById(propertyId).value = cnvrtr(bP.value);
                    }
                    else {
                        FrontEndFramework.gHndl.$('#' + propertyId).val(bP.value);
                    }
                }
                else {
                    bP.setDataFunc(cnvrtr(bP.value));
                }
            };
            ViewModel.ChangeEvents = FrontEndFramework.HtmlInputChangeEvents;
            return ViewModel;
        }());
        MiniHtmlViewModel.ViewModel = ViewModel;
        var ViewModelProperty = /** @class */ (function () {
            function ViewModelProperty(bindingMode, id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc, viewModelRef, changeEvents) {
                this.bindingMode = bindingMode;
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.changeEvents = changeEvents;
            }
            return ViewModelProperty;
        }());
        MiniHtmlViewModel.ViewModelProperty = ViewModelProperty;
        var ViewModelPropertyOneTimeBinding = /** @class */ (function () {
            function ViewModelPropertyOneTimeBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, converterFunc, viewModelRef, changeEvents) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.changeEvents = changeEvents;
                this.bindingMode = 0 /* OneTime */;
            }
            return ViewModelPropertyOneTimeBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneTimeBinding = ViewModelPropertyOneTimeBinding;
        var ViewModelPropertyOneWayReadBinding = /** @class */ (function () {
            function ViewModelPropertyOneWayReadBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
            viewModelRef, changeEvents) {
                this.id = id;
                this.value = value;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.viewModelRef = viewModelRef;
                this.changeEvents = changeEvents;
                this.bindingMode = 1 /* OneWayRead */;
            }
            return ViewModelPropertyOneWayReadBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneWayReadBinding = ViewModelPropertyOneWayReadBinding;
        var ViewModelPropertyOneWayWriteBinding = /** @class */ (function () {
            function ViewModelPropertyOneWayWriteBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, converterFunc, viewModelRef, changeEvents) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.changeEvents = changeEvents;
                this.bindingMode = 2 /* OneWayWrite */;
            }
            return ViewModelPropertyOneWayWriteBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneWayWriteBinding = ViewModelPropertyOneWayWriteBinding;
        var ViewModelPropertyTwoWayBinding = /** @class */ (function () {
            function ViewModelPropertyTwoWayBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc, viewModelRef, changeEvents) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.changeEvents = changeEvents;
                this.bindingMode = 3 /* TwoWay */;
            }
            return ViewModelPropertyTwoWayBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyTwoWayBinding = ViewModelPropertyTwoWayBinding;
    })(MiniHtmlViewModel = FrontEndFramework.MiniHtmlViewModel || (FrontEndFramework.MiniHtmlViewModel = {}));
})(FrontEndFramework || (FrontEndFramework = {}));
/// <reference path="./base.js.ts"/>
// Relies on ./base.js.ts because this library should be able to take advantage of Turbolinks not reloading page.
var FrontEndFramework;
(function (FrontEndFramework) {
    var Storage;
    (function (Storage) {
        Storage.VERSION = '0.1.0';
        var ExpiringCacheDuration = /** @class */ (function () {
            function ExpiringCacheDuration(expiryDate) {
                this.expiryDate = expiryDate;
                this.indefinite = false;
            }
            return ExpiringCacheDuration;
        }());
        Storage.ExpiringCacheDuration = ExpiringCacheDuration;
        var IndefiniteCacheDuration = /** @class */ (function () {
            function IndefiniteCacheDuration() {
                this.indefinite = true;
            }
            return IndefiniteCacheDuration;
        }());
        Storage.IndefiniteCacheDuration = IndefiniteCacheDuration;
        // This is needed for browsers that say that they have SessionStorage but in reality throw an Error as soon
        // as you try to do something.
        var is_session_storage_available = true;
        try {
            sessionStorage.setItem('testa890a809', 'val');
            sessionStorage.removeItem('testa890a809');
        }
        catch (_error) {
            is_session_storage_available = false;
        }
        finally {
            // Nothing to do...
        }
        Storage.IsSessionStorageAvailable = is_session_storage_available;
        var ClientStorageProfile = /** @class */ (function () {
            function ClientStorageProfile() {
                this.DataPersistanceDurationCapabilities = [0 /* Transient */];
                if (FrontEndFramework.TurbolinksAvailable || FrontEndFramework.Storage.IsSessionStorageAvailable)
                    this.DataPersistanceDurationCapabilities.push(1 /* Session */);
            }
            return ClientStorageProfile;
        }());
        Storage.ClientStorageProfile = ClientStorageProfile;
        /*
        export class TransientStorage implements IKeyValueStorage {
            constructor() {
            }

            set(key:any, val:any) : void => {
            }

            get(key:any) : any => {
            }
        }
        */
        var ClientStorage = /** @class */ (function () {
            function ClientStorage(errorOnFail) {
                if (errorOnFail === void 0) { errorOnFail = false; }
                this.errorOnFail = errorOnFail;
                this.clientProfile = new ClientStorageProfile();
            }
            ClientStorage.prototype.set = function (key, val, dataPersistenceDuration, cacheExpirationDuration) {
                if (dataPersistenceDuration === void 0) { dataPersistenceDuration = 1 /* Session */; }
                try {
                    // TODO: Remove upon adding support for DataPersistenceDuration.AcrossSessions
                    if (cacheExpirationDuration != null)
                        console.error("cacheExpirationDuration ignored in Database#set.");
                    switch (dataPersistenceDuration) {
                        case 0 /* Transient */:
                            break;
                        case 1 /* Session */:
                            sessionStorage.setItem(key, val);
                            break;
                        case 2 /* AcrossSessions */:
                            break;
                        default:
                            break;
                    }
                }
                catch (e) {
                    if (this.errorOnFail)
                        throw e;
                }
            };
            ClientStorage.prototype.get = function (key, dataPersistenceDuration) {
                try {
                    if (dataPersistenceDuration != null) {
                        switch (dataPersistenceDuration) {
                            case 0 /* Transient */:
                                break;
                            case 1 /* Session */:
                                return sessionStorage.getItem(key);
                            case 2 /* AcrossSessions */:
                                break;
                            default:
                                break;
                        }
                    }
                    else {
                    }
                }
                catch (e) {
                    if (this.errorOnFail)
                        throw e;
                }
                return null;
            };
            ClientStorage.prototype.forceCacheExpiry = function (key) { console.error("Unimplemented Database#forceCacheExpiry: Failed to expire key: " + key); throw key; };
            return ClientStorage;
        }());
        Storage.ClientStorage = ClientStorage;
    })(Storage = FrontEndFramework.Storage || (FrontEndFramework.Storage = {}));
})(FrontEndFramework || (FrontEndFramework = {}));
/// <reference path="./base.js.ts"/>
/// <reference path="./storage.js.ts"/>
var FrontEndFramework;
(function (FrontEndFramework) {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    FrontEndFramework.visitLink = function (link, _a) {
        var _b = _a === void 0 ? { forceReload: false, newTab: false } : _a, forceReload = _b.forceReload, newTab = _b.newTab;
        if ((newTab != null) && newTab) {
            window.open(link, "_blank");
        }
        else {
            if (FrontEndFramework.SinglePageApplication && !((forceReload != null) && forceReload)) {
                // TODO: Add support for other SPA frameworks here.
                if ((FrontEndFramework.RuntimeSupportedIntegration ===
                    1 /* Turbolinks */) &&
                    (typeof (Turbolinks.visit) === 'function')) {
                    Turbolinks.visit(link);
                }
            }
            else {
                window.location.href = link;
            }
        }
    };
    var cleanupFunc = function () {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (FrontEndFramework.SinglePageApplication) {
            for (var i = 0; i < FrontEndFramework.cleanupHooks.length; i++) {
                try {
                    FrontEndFramework.cleanupHooks[i]();
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    };
    var preReadyFunc = function () {
        for (var i = 0; i < FrontEndFramework.preReadyHooks.length; i++) {
            try {
                FrontEndFramework.preReadyHooks[i]();
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    var postReadyFunc = function () {
        for (var i = 0; i < FrontEndFramework.postReadyHooks.length; i++) {
            try {
                FrontEndFramework.postReadyHooks[i]();
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    var clearStateOnNavigationFunc = function () {
        FrontEndFramework.stateToClearOnNavigation = {};
    };
    var PubSub;
    (function (PubSub) {
        var PubSubRelay = /** @class */ (function () {
            function PubSubRelay(subscriptionIdentifier) {
                this.pubSubRelaySubscribers = [];
                this.firstMessageSentP = false;
                this.subscriptionIdentifier = subscriptionIdentifier;
                this.objectLifeCycle = PubSubRelay.DefaultObjectLifeCycle;
            }
            PubSubRelay.prototype.addSubscriber = function (subscriberInfo) {
                if (subscriberInfo.objectLifeCycle != null) {
                    if (this.objectLifeCycle < subscriberInfo.objectLifeCycle) {
                        this.objectLifeCycle = subscriberInfo.objectLifeCycle;
                    }
                }
                for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    if (this.pubSubRelaySubscribers[i].subscriberIdentifier ===
                        subscriberInfo.subscriberIdentifier) {
                        console.warn("Cannot subscribe more than once to (" + this.subscriptionIdentifier + ") with (" + subscriberInfo.subscriberIdentifier + ").");
                        return;
                    }
                }
                this.pubSubRelaySubscribers.push(subscriberInfo);
            };
            PubSubRelay.prototype.relayMessage = function (sendingSubscriberIdentifier, message) {
                //console.info(`Relaying message from PubSubRelay#relayMessage for subscription: ${this.subscriptionIdentifier}}`)
                this.lastSentMessage = message;
                this.firstMessageSentP = true;
                for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    var relevantSubscriber = this.pubSubRelaySubscribers[i];
                    //console.info(`Printing ${i}-th relevantSubscriber`);
                    //console.info(relevantSubscriber);
                    if (relevantSubscriber.subscriberIdentifier !==
                        sendingSubscriberIdentifier) {
                        try {
                            if (relevantSubscriber.subscriberSetter != null &&
                                typeof (relevantSubscriber.subscriberSetter) === 'function') {
                                relevantSubscriber.subscriberSetter(message);
                            }
                            else {
                                // Assumes that a trigger change event should not be fired on setting value.
                                // Use subscriberSetter arg when subscribing.
                                // console.info(`Setting value (${message}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                                // Replaces: $(relevantSubscriber.subscriberIdentifier).val(message);
                                if (typeof FrontEndFramework.gHndl.$ === 'undefined') {
                                    var elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                                    for (var x = 0; x < elemsOfInterest.length; x++) {
                                        if (message.constructor === Array) {
                                            console.warn("Something probably is not going to work as planned in setting values (" + message + ") for element with id: " + relevantSubscriber.subscriberIdentifier);
                                        }
                                        elemsOfInterest[x].value = message;
                                    }
                                }
                                else {
                                    FrontEndFramework.gHndl.$(relevantSubscriber.subscriberIdentifier).val(message);
                                }
                            }
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }
            };
            PubSubRelay.prototype.rebroadcastLastSentMessage = function () {
                if (!this.firstMessageSentP)
                    return;
                //console.info(`Relaying message from PubSubRelay#rebroadcastLastSentMessage for subscription: ${this.subscriptionIdentifier}}`)
                for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    var relevantSubscriber = this.pubSubRelaySubscribers[i];
                    try {
                        if (relevantSubscriber.subscriberSetter != null &&
                            typeof (relevantSubscriber.subscriberSetter) === 'function') {
                            relevantSubscriber.subscriberSetter(this.lastSentMessage);
                        }
                        else {
                            // Assumes that a trigger change event should not be fired on setting value.
                            // Use subscriberSetter arg when subscribing.
                            // console.info(`Setting value (${this.lastSentMessage}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                            // Replaces: $(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage)
                            if (typeof FrontEndFramework.gHndl.$ === 'undefined') {
                                var elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                                for (var x = 0; x < elemsOfInterest.length; x++) {
                                    if (this.lastSentMessage.constructor === Array) {
                                        console.warn("Something probably is not going to work as planned in setting values (" + this.lastSentMessage + ") for element with id: " + relevantSubscriber.subscriberIdentifier);
                                    }
                                    elemsOfInterest[x].value = this.lastSentMessage;
                                }
                            }
                            else {
                                FrontEndFramework.gHndl.$(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage);
                            }
                        }
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            };
            PubSubRelay.prototype.handleNavigation = function () {
                if (this.objectLifeCycle == 0 /* Transient */)
                    return; // Short-circuit if item will be PubSubRelay itself will be destroyed anyways
                var toRemove = []; // indices (this.pubSubRelaySubscribers) of subscribers to remove
                for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    if (this.pubSubRelaySubscribers[i].objectLifeCycle != null) {
                        toRemove.push(i);
                    }
                }
                while (toRemove.length !== 0) {
                    this.pubSubRelaySubscribers.splice(toRemove.pop(), 1);
                }
            };
            PubSubRelay.DefaultObjectLifeCycle = 0 /* Transient */;
            return PubSubRelay;
        }());
        var PubSubRelayStorage = /** @class */ (function () {
            function PubSubRelayStorage() {
                // TODO: Allow the PubSubRelayStorage to have a transient object life cycle
                this.objectLifeCycle = 2 /* InfinitePersistence */;
                this.mapFromSubscriptionIdentifierToPubSubRelays = {};
            }
            PubSubRelayStorage.prototype.get = function (subscriptionIdentifier) {
                return this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
            };
            PubSubRelayStorage.prototype.set = function (subscriptionIdentifier, pubSubRelay) {
                this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier] = pubSubRelay;
            };
            PubSubRelayStorage.prototype.handleNavigation = function () {
                var _this = this;
                var keysToDelete = [];
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach(function (subscriptionIdentifier) {
                    var pubSubRelayInstance = _this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
                    pubSubRelayInstance.handleNavigation();
                    if (pubSubRelayInstance.objectLifeCycle === 0 /* Transient */) {
                        // Remove pubSubRelayInstance
                        keysToDelete.push(subscriptionIdentifier);
                    }
                });
                for (var i = 0; i < keysToDelete.length; i++) {
                    delete this.mapFromSubscriptionIdentifierToPubSubRelays[keysToDelete[i]];
                }
            };
            PubSubRelayStorage.prototype.rebroadcastAllMessageLastRelayedByStoredPubSubRelays = function () {
                var _this = this;
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach(function (subscriptionIdentifier) {
                    _this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier].rebroadcastLastSentMessage();
                });
            };
            return PubSubRelayStorage;
        }());
        var PubSubRelayManager = /** @class */ (function () {
            function PubSubRelayManager() {
                // TODO: Allow the PubSubRelayManager to have a transient object life cycle
                this.objectLifeCycle = 2 /* InfinitePersistence */;
                this.pubSubRelayStorage = new PubSubRelayStorage();
                if (FrontEndFramework.SinglePageApplication) {
                    FrontEndFramework.cleanupHooks.push(this.genHandleNavigationFunc(this));
                    FrontEndFramework.postReadyHooks.push(this.genRebroadcastLastMessagesFunc(this));
                }
            }
            PubSubRelayManager.prototype.handleNavigation = function () {
                this.pubSubRelayStorage.handleNavigation();
            };
            PubSubRelayManager.prototype.rebroadcastLastSentMessages = function () {
                this.pubSubRelayStorage.rebroadcastAllMessageLastRelayedByStoredPubSubRelays();
            };
            PubSubRelayManager.prototype.genHandleNavigationFunc = function (self) {
                return self.handleNavigation.bind(self);
            };
            PubSubRelayManager.prototype.genRebroadcastLastMessagesFunc = function (self) {
                return self.rebroadcastLastSentMessages.bind(self);
            };
            PubSubRelayManager.prototype.handleSubscription = function (subscriptionIdentifier, selfIdentifier, // should be a CSS selector (JQuery selector)
            selfSetter, objectLifeCycle) {
                if (selfSetter === void 0) { selfSetter = undefined; }
                if (objectLifeCycle === void 0) { objectLifeCycle = 0 /* Transient */; }
                var pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
                // TODO: See if given `objectLifeCycle` is greater than designated objectLifeCycle,
                // if it is, change how it is managed (not relevant until object life cycle other
                // than FrontEndFramework.ObjectLifeCycle.InfinitePersistence is supported).
                pubSubRelay.addSubscriber({
                    subscriberIdentifier: selfIdentifier,
                    subscriberSetter: selfSetter,
                    objectLifeCycle: objectLifeCycle
                });
            };
            PubSubRelayManager.prototype.handlePublishedMessage = function (subscriptionIdentifier, message) {
                var pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
                pubSubRelay.relayMessage(subscriptionIdentifier, message);
            };
            PubSubRelayManager.prototype.handlePubSubRelayInitializationAndRetrieval = function (subscriptionIdentifier) {
                var pubSubRelay = null;
                // Create pub sub relay if it does not exist
                if ((pubSubRelay = this.pubSubRelayStorage.get(subscriptionIdentifier)) == null) {
                    pubSubRelay = new PubSubRelay(subscriptionIdentifier);
                    this.pubSubRelayStorage.set(subscriptionIdentifier, pubSubRelay);
                }
                return pubSubRelay;
            };
            return PubSubRelayManager;
        }());
        // Internal library state
        // TODO: Manage internal library state without using globals
        var pubSubRelayManager = new PubSubRelayManager();
        ;
        // Treat the first two arguments to this function as being more a part of a stable
        // API vs the the third and fourth arguments which are subject to change.
        PubSub.subscribe = function (subscriptionIdentifier, selfIdentifier, // should be a CSS selector (JQuery selector) unless providing `selfSetter` argument
        selfSetter, objectLifeCycle) {
            if (selfSetter === void 0) { selfSetter = undefined; }
            if (objectLifeCycle === void 0) { objectLifeCycle = 0 /* Transient */; }
            //console.info("Printing FrontEndFramework.PubSub.subscribe args");
            //console.info(subscriptionIdentifier);
            //console.info(selfIdentifier);
            //console.info(selfSetter);
            //console.info(objectLifeCycle);
            pubSubRelayManager.handleSubscription(subscriptionIdentifier, selfIdentifier, selfSetter, objectLifeCycle);
        };
        PubSub.publish = function (subscriptionIdentifier, message) {
            //console.info("Printing FrontEndFramework.PubSub.publish args");
            //console.info(subscriptionIdentifier);
            //console.info(message);
            pubSubRelayManager.handlePublishedMessage(subscriptionIdentifier, message);
        };
        // Usage: During initialization subscribe before post-hooks (preferably pre-hooks) and publish in post-hooks.
        // Assumed to be constructed in pre-hook
        var PubSubSessionStorageSubscriber = /** @class */ (function () {
            function PubSubSessionStorageSubscriber(subscriptionIdentifier, storageKey, publishExistingStoredValue) {
                if (publishExistingStoredValue === void 0) { publishExistingStoredValue = true; }
                // TODO: Support other object life cycles
                this.objectLifeCycle = 2 /* InfinitePersistence */;
                this.storageKey = storageKey;
                // TODO: Short-Circuit if session storage not available
                if (!FrontEndFramework.Storage.IsSessionStorageAvailable) {
                    console.log('Abandoning PubSubSessionStorageSubscriber initialization since session storage is not available');
                    return;
                }
                PubSub.subscribe(subscriptionIdentifier, storageKey, this.genStoreInSessionStorageFunc(this), this.objectLifeCycle);
                var initialStoredValue = sessionStorage.getItem(storageKey);
                if (initialStoredValue != null &&
                    publishExistingStoredValue)
                    FrontEndFramework.hooks.post.push(function () {
                        PubSub.publish(subscriptionIdentifier, initialStoredValue);
                    });
            }
            PubSubSessionStorageSubscriber.prototype.storeInSessionStorageFunc = function (val) {
                sessionStorage.setItem(this.storageKey, val.toString());
            };
            PubSubSessionStorageSubscriber.prototype.genStoreInSessionStorageFunc = function (self) {
                return function (message) { self.storeInSessionStorageFunc.call(self, message); };
            };
            return PubSubSessionStorageSubscriber;
        }());
        PubSub.PubSubSessionStorageSubscriber = PubSubSessionStorageSubscriber;
        // Assumed to be constructed in pre-hook
        var HtmlInputElementPublisherAndSubscriber = /** @class */ (function () {
            function HtmlInputElementPublisherAndSubscriber(subscriptionIdentifier, htmlId, onChangeFunc, objectLifeCycle, publishValuePredicate) {
                if (onChangeFunc === void 0) { onChangeFunc = null; }
                if (objectLifeCycle === void 0) { objectLifeCycle = 0 /* Transient */; }
                if (publishValuePredicate === void 0) { publishValuePredicate = false; }
                var _this = this;
                this.subscriptionIdentifier = subscriptionIdentifier;
                this.htmlId = htmlId;
                this.onChangeFunc = onChangeFunc;
                this.objectLifeCycle = objectLifeCycle;
                this.publishValuePredicate = publishValuePredicate;
                // Publish value when appropriate
                if (publishValuePredicate &&
                    (document.getElementById(htmlId).value != null)) {
                    FrontEndFramework.hooks.post.push(function () {
                        PubSub.publish(subscriptionIdentifier, document.getElementById(htmlId).value);
                    });
                }
                // Subscribe
                PubSub.subscribe(subscriptionIdentifier, "#" + htmlId, function (message) {
                    if (typeof FrontEndFramework.gHndl.$ === 'undefined') {
                        // Replaces: $(`#${htmlId}`).val(message);
                        var elemsOfInterest = document.querySelectorAll("#" + htmlId);
                        for (var x = 0; x < elemsOfInterest.length; x++) {
                            elemsOfInterest[x].value = message;
                        }
                    }
                    else {
                        FrontEndFramework.gHndl.$("#" + htmlId).val(message);
                    }
                    if (_this.onChangeFunc != null) {
                        try {
                            _this.onChangeFunc();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }, this.objectLifeCycle);
                this._publishOnChangeFunc = (function (_ev) {
                    PubSub.publish(_this.subscriptionIdentifier, document.getElementById(_this.htmlId).value);
                    // console.info(`Detected change in (${htmlId}): ${(<HTMLInputElement>document.getElementById(htmlId)).value}`)
                    if (_this.onChangeFunc != null) {
                        try {
                            _this.onChangeFunc();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    } // else { console.info('Did not fire null onChangeFunc') }
                }).bind(this);
                // Publish on changes
                FrontEndFramework.HtmlInputChangeEvents.split(' ').forEach(function (evString) {
                    document.getElementById(htmlId).addEventListener(evString, _this._publishOnChangeFunc);
                });
                if (this.objectLifeCycle === 0 /* Transient */ &&
                    FrontEndFramework.SinglePageApplication &&
                    (FrontEndFramework.hooks.pageCleanup != null)) {
                    FrontEndFramework.hooks.pageCleanup.push(this.genHandleNavigationFunc(this));
                }
            }
            HtmlInputElementPublisherAndSubscriber.prototype.handleNavigation = function () {
                if (this.objectLifeCycle === 0 /* Transient */) {
                    this.teardown();
                }
            };
            HtmlInputElementPublisherAndSubscriber.prototype.genHandleNavigationFunc = function (self) {
                return function () { self.handleNavigation.call(self); };
            };
            HtmlInputElementPublisherAndSubscriber.prototype.teardown = function (overrideObjectLifeCycle) {
                var _this = this;
                if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
                if (this.objectLifeCycle === 2 /* InfinitePersistence */ &&
                    !overrideObjectLifeCycle) {
                    console.error('Failed to teardown FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscrber instance due to objectLifeCycle not being overridden');
                    return;
                }
                console.log("Cleaning up event handlers set up in HtmlInputElementPublisherAndSubscrber (id: " + this.htmlId + ")");
                // Replaces: $('#' + this.htmlId).off(FrontEndFramework.HtmlInputChangeEvents);
                FrontEndFramework.HtmlInputChangeEvents.split(' ').forEach(function (evString) {
                    if (document.getElementById(_this.htmlId) != null)
                        document.getElementById(_this.htmlId).removeEventListener(evString, _this._publishOnChangeFunc);
                });
            };
            return HtmlInputElementPublisherAndSubscriber;
        }());
        PubSub.HtmlInputElementPublisherAndSubscriber = HtmlInputElementPublisherAndSubscriber;
    })(PubSub = FrontEndFramework.PubSub || (FrontEndFramework.PubSub = {}));
    var READY_FUNC = function () {
        // Fire functions in hooks.pre Array
        while (FrontEndFramework.hooks.pre.length > 0) {
            try {
                FrontEndFramework.hooks.pre.shift()();
            }
            catch (e) {
                console.error(e);
            }
        }
        ;
        try {
            preReadyFunc();
        }
        catch (e) {
            console.error(e);
        }
        if ((FrontEndFramework.readyFunc != null) &&
            (typeof (FrontEndFramework.readyFunc) === 'function')) {
            try {
                FrontEndFramework.readyFunc();
            }
            catch (e) {
                console.error(e);
            }
        }
        try {
            postReadyFunc();
        }
        catch (e) {
            console.error(e);
        }
        // Fire functions in hooks.post Array
        while (FrontEndFramework.hooks.post.length > 0) {
            try {
                FrontEndFramework.hooks.post.shift()();
            }
            catch (e) {
                console.error(e);
            }
        }
        ;
    };
    switch (FrontEndFramework.RuntimeSupportedIntegration) {
        case 1 /* Turbolinks */:
            document.addEventListener('turbolinks:load', READY_FUNC);
            break;
        case 0 /* NoFramework */:
        case 2 /* WindowsUWP */:
        default:
            document.addEventListener('DOMContentLoaded', READY_FUNC);
    }
    if (FrontEndFramework.SinglePageApplication) {
        // TODO: Add support for other SPA frameworks here.
        if (FrontEndFramework.RuntimeSupportedIntegration === 1 /* Turbolinks */ &&
            FrontEndFramework.TurbolinksAvailable) {
            document.addEventListener('turbolinks:before-render', cleanupFunc);
            if (FrontEndFramework.hooks.pageCleanup != null)
                document.addEventListener('turbolinks:before-render', function () {
                    // Fire functions in hooks.pageCleanup Array
                    while (FrontEndFramework.hooks.pageCleanup.length > 0) {
                        try {
                            FrontEndFramework.hooks.pageCleanup.shift()();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    ;
                });
            if ((clearStateOnNavigationFunc != null) && (typeof (clearStateOnNavigationFunc) === 'function'))
                document.addEventListener('turbolinks:visit', clearStateOnNavigationFunc);
        }
    }
})(FrontEndFramework || (FrontEndFramework = {}));
//= require ./base
//= require ./screen_resolutions
//= require ./mini_html_view_model
//= require ./storage
//= require ./core
/// <reference path="./base.js.ts"/>
/// <reference path="./screen_resolutions.js.ts"/>
/// <reference path="./mini_html_view_model.js.ts"/>
/// <reference path="./storage.js.ts"/>
/// <reference path="./core.js.ts"/>
// Note that the above references do not work if you have the TypeScript compiler set to remove comments.
// Use something like the uglifier gem for removing comments/obfuscation.
// The load order currently matters.
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.VERSION = '0.7.0';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsK0ZBQStGO0FBQy9GLDhFQUE4RTtBQUk5RSxJQUFVLGlCQUFpQixDQXlFMUI7QUF6RUQsV0FBVSxpQkFBaUI7SUFxQlosdUJBQUssR0FBa0IsTUFBTSxDQUFDO0lBUXhDLENBQUM7SUFFVyx1Q0FBcUIsR0FBRyx3QkFBd0IsQ0FBQztJQVU3RCxDQUFDO0lBTUQsQ0FBQztJQUNGLG1EQUFtRDtJQUN0Qyx1Q0FBcUIsR0FBRyxDQUFDLE9BQU8sa0JBQUEsS0FBSyxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFBLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUM7SUFDMUYscUNBQW1CLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsRix1Q0FBcUIsR0FBRyxrQkFBQSxtQkFBbUIsQ0FBQztJQUU5Qyw2Q0FBMkIsc0JBQTBELENBQUM7SUFF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QUFrQztBQUNsQyxxQkFBcUI7QUFDckIsa0JBQWtCO0FBRWxCLG9DQUFvQztBQUNwQyxrREFBa0Q7QUFDbEQsb0RBQW9EO0FBQ3BELHVDQUF1QztBQUN2QyxvQ0FBb0M7QUFFcEMseUdBQXlHO0FBQ3pHLHlFQUF5RTtBQUV6RSxvQ0FBb0M7QUFFcEMsSUFBVSxpQkFBaUIsQ0FBb0M7QUFBL0QsV0FBVSxpQkFBaUI7SUFBZ0IseUJBQU8sR0FBRyxPQUFPLENBQUM7QUFBQyxDQUFDLEVBQXJELGlCQUFpQixLQUFqQixpQkFBaUIsUUFBb0MiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIFRoaXMgZmlsZSBjb250YWlucyB0eXBlcyBhbmQgaW50ZXJuYWwgc3RhdGUgdXNlZCBieSB0aGUgZnJhbWV3b3JrIHRoYXQgaW5kaXZpZHVhbCBjb21wb25lbnRzXG4vLyBpbiB0aGUgbGlicmFyeSBuZWVkIGtub3dsZWRnZSBvZiBzdWNoIGFzIEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5cblxuZGVjbGFyZSB2YXIgVHVyYm9saW5rcyA6IGFueTtcblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICAvLyBIYXMgYSBkZXBlbmRlbmN5IG9uIEpRdWVyeS4gU2hvdWxkIGJlIGxvYWRlZCBhZnRlciBUdXJib2xpbmtzIHRvIHJlZ2lzdGVyXG4gICAgLy8gY2xlYW51cEZ1bmMgb24gJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicgZXZlbnQuXG4gICAgZXhwb3J0IGludGVyZmFjZSBHbG9iYWxIYW5kbGUgZXh0ZW5kcyBXaW5kb3cge1xuICAgICAgICBXaW5kb3dzPzogYW55O1xuICAgICAgICAkPzogYW55O1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgc2NyaXB0IHRhZyBiZWxvdyBpbiB0aGUgaGVhZGVyIG9mIHlvdXIgcGFnZTpcbiAgICAvLyA8c2NyaXB0PiBcInVzZSBzdHJpY3RcIjsgdmFyIGdIbmRsID0gdGhpczsgdmFyIHN0YXRlVG9DbGVhck9uTmF2aWdhdGlvbiA9IHt9OyB2YXIgaG9va3MgPSB7IHByZTogW10sIHBvc3Q6IFtdLCBwYWdlQ2xlYW51cDogW10gfTsgPC9zY3JpcHQ+XG4gICAgZXhwb3J0IGRlY2xhcmUgdmFyIGhvb2tzIDoge1xuICAgICAgICAvLyBJbnZva2VkIGFmdGVyIGRvY3VtZW50IGlzIHJlYWR5IChidXQgYmVmb3JlIE1pbmlIdG1sVmlld01vZGVsLnJlYWR5RnVuYylcbiAgICAgICAgcHJlOiAoKCkgPT4gdm9pZClbXSxcblxuICAgICAgICAvLyBJbnZva2VkIGFmdGVyIGRvY3VtZW50IGlzIHJlYWR5IChidXQgYWZ0ZXIgTWluaUh0bWxWaWV3TW9kZWwucmVhZHlGdW5jKVxuICAgICAgICBwb3N0OiAoKCkgPT4gdm9pZClbXSxcblxuICAgICAgICAvLyBFeHBlcmltZW50YWw6IE9ubHkgbWFrZXMgc2Vuc2UgaWYgdXNlZCB3aXRoIFR1cmJvbGlua3NcbiAgICAgICAgcGFnZUNsZWFudXA/OiAoKCkgPT4gdm9pZClbXVxuICAgIH07XG5cbiAgICBleHBvcnQgbGV0IGdIbmRsIDogR2xvYmFsSGFuZGxlID0gd2luZG93O1xuICAgIGV4cG9ydCBkZWNsYXJlIHZhciBzdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gOiBhbnk7XG5cbiAgICAvLyBBIHBhcnQgb2YgdGhlIFNQQSBzdXBwcG9ydFxuICAgIGV4cG9ydCBjb25zdCBlbnVtIE9iamVjdExpZmVDeWNsZSB7XG4gICAgICAgIFRyYW5zaWVudCA9IDAsIC8vIE9ubHkgZm9yIHNpbmdsZSBwYWdlLCBvYmplY3Qgc2hvdWxkIGF1dG9tYXRpY2FsbHkgYmUgZGVzdHJveWVkIHdoZW4gbmF2aWdhdGluZyBmcm9tIHBhZ2VcbiAgICAgICAgVmFyaWFibGVQZXJzaXN0ZW5jZSA9IDEsIC8vIExpZmV0aW1lIGlzIG1hbmFnZWQgbWFudWFsbHkgKHNob3VsZCBub3QgYmUgYXV0b21hdGljYWxseSBkZXN0cm95ZWQgd2hlbiBuYXZpZ2F0aW5nIHBhZ2VzKVxuICAgICAgICBJbmZpbml0ZVBlcnNpc3RlbmNlID0gMiAvLyBOb3QgdG8gYmUgZGVzdHJveWVkIChpbnRlbmRlZCB0byBiZSBwZXJzaXN0ZW50IGFjcm9zcyBwYWdlIG5hdmlnYXRpb24pXG4gICAgfTtcblxuICAgIGV4cG9ydCBjb25zdCBIdG1sSW5wdXRDaGFuZ2VFdmVudHMgPSAnY2hhbmdlIHRleHRJbnB1dCBpbnB1dCc7XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICBvYmplY3RMaWZlQ3ljbGU/OiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgfVxuXG4gICAgZXhwb3J0IGNvbnN0IGVudW0gU3VwcG9ydGVkSW50ZWdyYXRpb24ge1xuICAgICAgICBOb0ZyYW1ld29yayA9IDAsXG4gICAgICAgIFR1cmJvbGlua3MgPSAxLFxuICAgICAgICBXaW5kb3dzVVdQID0gMlxuICAgIH07XG5cbiAgICBleHBvcnQgaW50ZXJmYWNlIFN1cHBvcnRlZEludGVncmF0aW9uTWV0YWRhdGEge1xuICAgICAgICBzdXBwb3J0ZWRJbnRlZ3JhdGlvbjogU3VwcG9ydGVkSW50ZWdyYXRpb247XG4gICAgICAgIHNpbmdsZVBhZ2VBcHBsaWNhdGlvblN1cHBvcnQ6IGJvb2xlYW47XG4gICAgICAgIHBhZ2VQcmVDYWNoZUV2ZW50Pzogc3RyaW5nfG51bGw7IC8vIFByb2JhYmx5IGdvaW5nIHRvIGJlIHJlbW92ZWRcbiAgICB9O1xuICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgIGV4cG9ydCBjb25zdCBXaW5kb3dzVXdwRW52aXJvbm1lbnQgPSAodHlwZW9mIGdIbmRsLldpbmRvd3MgIT09ICd1bmRlZmluZWQnKSAmJiAoZ0huZGwuV2luZG93cyAhPSBudWxsKTtcbiAgICBleHBvcnQgY29uc3QgVHVyYm9saW5rc0F2YWlsYWJsZSA9ICh0eXBlb2YgVHVyYm9saW5rcyAhPT0gJ3VuZGVmaW5lZCcpICYmIChUdXJib2xpbmtzICE9IG51bGwpO1xuICAgIGV4cG9ydCBjb25zdCBTaW5nbGVQYWdlQXBwbGljYXRpb24gPSBUdXJib2xpbmtzQXZhaWxhYmxlO1xuXG4gICAgZXhwb3J0IGxldCBSdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24gOiBTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA9IFN1cHBvcnRlZEludGVncmF0aW9uLk5vRnJhbWV3b3JrO1xuXG4gICAgLy8gVE9ETzogU3VwcG9ydCBUdXJib2xpbmtzIGluIFdpbmRvd3MgVVdQIEVudmlyb25tZW50XG4gICAgaWYgKFdpbmRvd3NVd3BFbnZpcm9ubWVudCkge1xuICAgICAgICBSdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24gPSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbi5XaW5kb3dzVVdQO1xuICAgIH0gZWxzZSBpZiAoVHVyYm9saW5rc0F2YWlsYWJsZSkge1xuICAgICAgICBSdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24gPSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbi5UdXJib2xpbmtzO1xuICAgIH1cblxuICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgIGV4cG9ydCBsZXQgUGFnZVByZUNhY2hlRXZlbnQ6IHN0cmluZ3xudWxsID0gVHVyYm9saW5rc0F2YWlsYWJsZSA/ICd0dXJib2xpbmtzOmJlZm9yZS1jYWNoZScgOiBudWxsO1xuXG4gICAgLy8gVG8gYmUgc2V0IGJ5IHVzZXIgKGZpcmVkIHdoZW4gRE9NIGlzIHJlYWR5KVxuICAgIGV4cG9ydCBsZXQgcmVhZHlGdW5jIDogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gICAgLy8gRm9yIHVzZXJzIHRvIHN1cHBseSBob29rcyAobGFtYmRhIGZ1bmN0aW9ucykgdGhhdCB0aGV5IHdhbnQgdG8gZmlyZSBvbiBlYWNoIG5hdmlnYXRpb24gKG5vdGVcbiAgICAvLyB0aGF0IHRoZXNlIGFycmF5cyBhcmUgbm90IGVtcHRpZWQgYXMgZXhlY3V0ZWQpLlxuICAgIGV4cG9ydCBsZXQgY2xlYW51cEhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBleHBvcnQgbGV0IHByZVJlYWR5SG9va3MgOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICAgIGV4cG9ydCBsZXQgcG9zdFJlYWR5SG9va3MgOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xufVxuIiwiXG4vLyBEb2VzIG5vdCByZWFsbHkgZGVwZW5kIG9uIGFueXRoaW5nXG5cblwidXNlIHN0cmljdFwiO1xuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuZXhwb3J0IG5hbWVzcGFjZSBTY3JlZW5EaW1lbnNpb25zIHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIFNjcmVlbkRpbWVuc2lvbnMge1xuICAgICAgICBhdmFpbGFibGVIZWlnaHQgOiBudW1iZXI7XG4gICAgICAgIGF2YWlsYWJsZVdpZHRoIDogbnVtYmVyO1xuICAgICAgICBkZXZpY2VIZWlnaHQgOiBudW1iZXI7XG4gICAgICAgIGRldmljZVdpZHRoIDogbnVtYmVyO1xuICAgIH1cblxuICAgIGV4cG9ydCB2YXIgR2V0U2NyZWVuRGltZW5zaW9ucyA9IGZ1bmN0aW9uKCkgOiBTY3JlZW5EaW1lbnNpb25zIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGF2YWlsYWJsZUhlaWdodDogd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodCxcbiAgICAgICAgICAgIGF2YWlsYWJsZVdpZHRoOiB3aW5kb3cuc2NyZWVuLmF2YWlsV2lkdGgsXG4gICAgICAgICAgICBkZXZpY2VIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uaGVpZ2h0LFxuICAgICAgICAgICAgZGV2aWNlV2lkdGg6IHdpbmRvdy5zY3JlZW4ud2lkdGhcbiAgICAgICAgfTtcbiAgICB9XG59XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIgLz5cblxuLy8gRGVwZW5kcyBvbiBKUXVlcnlcbi8vIERlcGVuZHMgb24gLi9iYXNlLmpzLnRzIGR1ZSB0byB0aGUgZmFjdCB0aGF0IHRoZSBmdXR1cmUgSVVzZXJJbnRlcmZhY2VFbGVtZW50IG1pZ2h0IHJlbHkgb24gY2xlYW51cEhvb2tzXG4vLyBmb3IgdGVhcmRvd24gbG9naWMuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBNaW5pSHRtbFZpZXdNb2RlbCB7XG4gICAgICAgIGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuNy4wJztcblxuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBCaW5kaW5nTW9kZSB7IE9uZVRpbWUsIE9uZVdheVJlYWQsIE9uZVdheVdyaXRlLCBUd29XYXkgfTtcblxuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBCaW5kaW5nT3BlcmF0aW9uVHlwZSB7IFJlYWQsIFdyaXRlIH07XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZTtcbiAgICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW107IC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgdmFsdWU/OiBhbnk7IC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgIHZpZXdNb2RlbFJlZj86IFQ7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuYz86IEV2ZW50TGlzdGVuZXI7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuY3M/OiBFdmVudExpc3RlbmVyW107XG4gICAgICAgICAgICBjaGFuZ2VFdmVudHM/OiBzdHJpbmc7IC8vIFRPRE86IEludmVzdGlnYXRlIGFsc28gYWxsb3dpbmcgYW4gYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8VD4ge1xuICAgICAgICAgICAgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCk7XG4gICAgICAgICAgICBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUPiB7XG4gICAgICAgICAgICBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpO1xuICAgICAgICAgICAgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCk7IC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiB7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGNhbiBiZSB0aG91Z2h0IG9mIGFzIHNldCB2YWx1ZSBvbmNlIGFuZCBmb3JnZXQgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBvciBJVmlld01vZGVsUHJvcGVydHkgc3RvcmVkKVxuICAgICAgICAvLyBWYWx1ZSBpcyBOT1QgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5UmVhZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlIGlzIGEgd2F5IHRvIHNldCB2YWx1ZXMgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBidXQgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IGFyZSBzdG9yZWQpLlxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOkJpbmRpbmdNb2RlLk9uZVdheVdyaXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3VsZCBpbmhlcml0IGZyb20gdGhpcyBjbGFzcyBpbnN0ZWFkIG9mIGluc3RhbnRpYXRpbmcgaXQgZGlyZWN0bHkuXG4gICAgICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3TW9kZWwgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHByb3RlY3RlZCBpZFRvQmluZGFibGVQcm9wZXJ0eTogeyBbaW5kZXg6IHN0cmluZ106IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPiB9O1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ2hhbmdlRXZlbnRzID0gRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzO1xuICAgICAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLFxuICAgICAgICAgICAgICAgIC4uLmJpbmRhYmxlUHJvcGVydGllczogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+W11cbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHkgPSB7fTtcbiAgICAgICAgICAgICAgICBiaW5kYWJsZVByb3BlcnRpZXMuZm9yRWFjaCh0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5LCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnB1c2godGhpcy5nZW5UZWFyZG93bkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvdGVjdGVkIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5KGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGJQLmlkLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoYlApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJQLmlkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKDxhbnk+YlApLmlkW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRpbmdNb2RlOiAoPGFueT5iUCkuYmluZGluZ01vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICg8YW55PmJQKS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRnVuYzogKDxhbnk+YlApLnNldERhdGFGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldERhdGFGdW5jOiAoPGFueT5iUCkuZ2V0RGF0YUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VGdW5jOiAoPGFueT5iUCkub25DaGFuZ2VGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlckZ1bmM6ICg8YW55PmJQKS5jb252ZXJ0ZXJGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbFJlZjogKDxhbnk+YlApLnZpZXdNb2RlbFJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VFdmVudHM6ICg8YW55PmJQKS5jaGFuZ2VFdmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFjY2VwdGFibGUgaWQgZGV0ZWN0ZWQgaW4gSVZpZXdNb2RlbFByb3BlcnR5QmFzZTogJHtiUH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBsZXQgYmluZGFibGVQcm9wZXJ0eUlkOiBzdHJpbmcgPSA8c3RyaW5nPmJQLmlkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGFuZCBhdHRhY2ggYmluZGFibGUgcHJvcGVydGllcyB0aGF0IGRvIG5vdCBoYXZlIGEgT25lVGltZSBiaW5kaW5nTW9kZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IE9uZVRpbWUgYmluZGluZ01vZGUgcHJvcGVydGllcyBhcmUgbm90IHN0b3JlZC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJpbmRpbmdNb2RlICE9PSBCaW5kaW5nTW9kZS5PbmVUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiUC52aWV3TW9kZWxSZWYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtiaW5kYWJsZVByb3BlcnR5SWRdID0gYlA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGlzIHNldCBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKChiUC52YWx1ZSAhPT0gdW5kZWZpbmVkKSB8fCAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVRpbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQXR0YWNoIG9uQ2hhbmdlIGV2ZW50IGhhbmRsZXIgZm9yIFR3b1dheSBhbmQgT25lV2F5UmVhZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLlR3b1dheSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3VuZGVkRnVuYyA9IChfZXYgOiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluOiAke2JpbmRhYmxlUHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVByb3BlcnR5Q2hhbmdlZEV2ZW50KGJpbmRhYmxlUHJvcGVydHlJZCwgQmluZGluZ09wZXJhdGlvblR5cGUuUmVhZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPCgodm06IFZpZXdNb2RlbCkgPT4gdm9pZCk+KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMpKDxWaWV3TW9kZWw+YlAudmlld01vZGVsUmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoPGFueT5iUC52aWV3TW9kZWxSZWYpLm9uQ2hhbmdlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmJQLnZpZXdNb2RlbFJlZikub25DaGFuZ2UoYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcHJvdmlkZSBvbkNoYW5nZUZ1bmMgKGFsdGVybmF0aXZlbHkgaW1wbGVtZW50IG9uQ2hhbmdlIFsoaHRtbElkOiBzdHJpbmcpID0+IHZvaWRdIG1ldGhvZCkgZm9yIGltcGxlbnRhdGlvbiBvZiBJVmlld01vZGVsUHJvcGVydHkgZm9yIGlkOiAnICsgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgKChiUC5jaGFuZ2VFdmVudHMgPT0gbnVsbCkgPyBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzIDogYlAuY2hhbmdlRXZlbnRzKS5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiUC5pZC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJvdW5kRXZlbnRGdW5jID0gYm91bmRlZEZ1bmM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJpbmRhYmxlUHJvcGVydHlJZCkpLmFkZEV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBBcnJheTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiUC5ib3VuZEV2ZW50RnVuY3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJvdW5kRXZlbnRGdW5jcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jcy5wdXNoKGJvdW5kZWRGdW5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmluZGFibGVQcm9wZXJ0eUlkKSkuYWRkRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jc1s8bnVtYmVyPigoPGFueT5iUCkuYm91bmRFdmVudEZ1bmNzKS5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWNjZXB0YWJsZSBpZCBkZXRlY3RlZCBpbiBJVmlld01vZGVsUHJvcGVydHlCYXNlOiAke2JQfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyaWdnZXJzIGNoYW5nZSBpbiBVSSB0byBtYXRjaCB2YWx1ZSBvZiBwcm9wZXJ0eSBpbiBpZFRvQmluZGFibGVQcm9wZXJ0eS5cbiAgICAgICAgICAgIHByb3RlY3RlZCBoYW5kbGVQcm9wZXJ0eUNoYW5nZWRFdmVudChwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ09wZXJhdGlvblR5cGUgPSBCaW5kaW5nT3BlcmF0aW9uVHlwZS5Xcml0ZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaW5kYWJsZVByb3BlcnR5ID0gdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtwcm9wZXJ0eUlkXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiaW5kaW5nT3BlcmF0aW9uVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nT3BlcmF0aW9uVHlwZS5Xcml0ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5PbmVUaW1lOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJOT09QXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuT25lV2F5V3JpdGU6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLlR3b1dheTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5zZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGJpbmRpbmdNb2RlICgke2JpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGV9KSBmb3IgQmluZGluZyBQcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggaWQ6ICR7cHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ09wZXJhdGlvblR5cGUuUmVhZDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5PbmVUaW1lOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTk9PUFwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwucmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5Ud29XYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwucmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGJpbmRpbmdNb2RlICgke2JpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGV9KSBmb3IgQmluZGluZyBQcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggaWQ6ICR7cHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgSW52YWxpZCBiaW5kaW5nT3BlcmF0aW9uVHlwZTogJHtiaW5kaW5nT3BlcmF0aW9uVHlwZX1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuVGVhcmRvd25GdW5jKHNlbGY6IFZpZXdNb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi50ZWFyZG93bi5jYWxsKHNlbGYpO307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlYXJkb3duKG92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlOmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgIW92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0ZWFyZG93biBGcm9udEVuZEZyYW1ld29yay5NaW5pSHRtbFZpZXdNb2RlbC5WaWV3TW9kZWwgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eSkuZm9yRWFjaCgoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2xlYW5pbmcgdXAgZXZlbnQgaGFuZGxlcnMgc2V0IHVwIGluIFZpZXdNb2RlbCAoaWQ6ICR7aWR9KWApO1xuICAgICAgICAgICAgICAgICAgICBsZXQgYlAgPSB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5W2lkXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiUC5pZC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJvdW5kRXZlbnRGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLkNoYW5nZUV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChiUC5ib3VuZEV2ZW50RnVuY3MgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJQLmJvdW5kRXZlbnRGdW5jcy5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChiUC5ib3VuZEV2ZW50RnVuY3MubGVuZ3RoID09PSAoPHN0cmluZ1tdPmJQLmlkKS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpZHggPSAoPHN0cmluZ1tdPmJQLmlkKS5pbmRleE9mKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5DaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuY3NbaWR4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludGVybmFsIGludmFyaWFudCB2aW9sYXRlZCAoZ3VpZDogRHRzYTQzMjUyeHhxKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW50ZXJuYWwgaW52YXJpYW50IHZpb2xhdGVkIChndWlkOiBwdGE0MjN0YURURCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWNjZXB0YWJsZSBpZCBkZXRlY3RlZCBpbiBJVmlld01vZGVsUHJvcGVydHlCYXNlOiAke2JQfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpOiBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICAgICAgaWYgKGJQLmdldERhdGFGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgYlAudmFsdWUgPSBiUC5nZXREYXRhRnVuYygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnZhbHVlID0gKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByb3BlcnR5SWQpKS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJQO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyBzZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgY252cnRyID0gYlAuY29udmVydGVyRnVuYyB8fCBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuICAgICAgICAgICAgICAgIGlmIChiUC5zZXREYXRhRnVuYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ0huZGwuJCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKCcjJyArIHByb3BlcnR5SWQpLnZhbChiUC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJvcGVydHlJZCkpLnZhbHVlID0gY252cnRyKGJQLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdIbmRsLiQpKCcjJyArIHByb3BlcnR5SWQpLnZhbChiUC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiUC5zZXREYXRhRnVuYyhjbnZydHIoYlAudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVCxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhbmdlRXZlbnRzPzogc3RyaW5nXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVUaW1lQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWUgPSA8QmluZGluZ01vZGUuT25lVGltZT5CaW5kaW5nTW9kZS5PbmVUaW1lO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBULFxuICAgICAgICAgICAgICAgIHB1YmxpYyBjaGFuZ2VFdmVudHM/OiBzdHJpbmdcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBpbXBsZW1lbnRzIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5UmVhZCA9IDxCaW5kaW5nTW9kZS5PbmVXYXlSZWFkPkJpbmRpbmdNb2RlLk9uZVdheVJlYWQ7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIGdldERhdGFGdW5jPzogKCgpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIG9uQ2hhbmdlRnVuYz86ICgodm06IFQpID0+IHZvaWQpLCAvLyBFaXRoZXIgaW1wbGVtZW50IG9uQ2hhbmdlIG9uIElWaWV3TW9kZWwgT1IgcHJvdmlkZSBvbkNoYW5nZUZ1bmNcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVCxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhbmdlRXZlbnRzPzogc3RyaW5nXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5V3JpdGUgPSA8QmluZGluZ01vZGUuT25lV2F5V3JpdGU+QmluZGluZ01vZGUuT25lV2F5V3JpdGU7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFQsXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYW5nZUV2ZW50cz86IHN0cmluZ1xuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuVHdvV2F5ID0gPEJpbmRpbmdNb2RlLlR3b1dheT5CaW5kaW5nTW9kZS5Ud29XYXk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVCxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhbmdlRXZlbnRzPzogc3RyaW5nXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiLz5cblxuLy8gUmVsaWVzIG9uIC4vYmFzZS5qcy50cyBiZWNhdXNlIHRoaXMgbGlicmFyeSBzaG91bGQgYmUgYWJsZSB0byB0YWtlIGFkdmFudGFnZSBvZiBUdXJib2xpbmtzIG5vdCByZWxvYWRpbmcgcGFnZS5cblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICBleHBvcnQgbmFtZXNwYWNlIFN0b3JhZ2Uge1xuICAgICAgICBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjEuMCc7XG4gICAgICAgIGV4cG9ydCBjb25zdCBlbnVtIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uIHsgVHJhbnNpZW50LCBTZXNzaW9uLCBBY3Jvc3NTZXNzaW9ucyB9XG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIHtcbiAgICAgICAgICAgIGluZGVmaW5pdGU/OiBib29sZWFuO1xuICAgICAgICAgICAgZXhwaXJ5RGF0ZT86IERhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElFeHBpcmluZ0NhY2hlRHVyYXRpb24gZXh0ZW5kcyBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24ge1xuICAgICAgICAgICAgaW5kZWZpbml0ZT86IGJvb2xlYW47IC8vIE1VU1QgQkUgYGZhbHNlYFxuICAgICAgICAgICAgZXhwaXJ5RGF0ZTogRGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIGV4dGVuZHMgSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIHtcbiAgICAgICAgICAgIGluZGVmaW5pdGU6IGJvb2xlYW47IC8vIE1VU1QgQkUgYHRydWVgXG4gICAgICAgICAgICBleHBpcnlEYXRlPzogRGF0ZTsgLy8gIElHTk9SRURcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBFeHBpcmluZ0NhY2hlRHVyYXRpb24gaW1wbGVtZW50cyBJRXhwaXJpbmdDYWNoZUR1cmF0aW9uIHtcbiAgICAgICAgICAgIHB1YmxpYyBpbmRlZmluaXRlID0gZmFsc2U7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihwdWJsaWMgZXhwaXJ5RGF0ZTogRGF0ZSkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgSW5kZWZpbml0ZUNhY2hlRHVyYXRpb24gaW1wbGVtZW50cyBJSW5kZWZpbml0ZUNhY2hlRHVyYXRpb24ge1xuICAgICAgICAgICAgcHVibGljIGluZGVmaW5pdGUgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRoaXMgaXMgbmVlZGVkIGZvciBicm93c2VycyB0aGF0IHNheSB0aGF0IHRoZXkgaGF2ZSBTZXNzaW9uU3RvcmFnZSBidXQgaW4gcmVhbGl0eSB0aHJvdyBhbiBFcnJvciBhcyBzb29uXG4gICAgICAgIC8vIGFzIHlvdSB0cnkgdG8gZG8gc29tZXRoaW5nLlxuICAgICAgICBsZXQgaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZSA9IHRydWU7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCd0ZXN0YTg5MGE4MDknLCAndmFsJyk7XG4gICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5yZW1vdmVJdGVtKCd0ZXN0YTg5MGE4MDknKTtcbiAgICAgICAgfSBjYXRjaCAoX2Vycm9yKSB7XG4gICAgICAgICAgICBpc19zZXNzaW9uX3N0b3JhZ2VfYXZhaWxhYmxlID0gZmFsc2U7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAvLyBOb3RoaW5nIHRvIGRvLi4uXG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0IGNvbnN0IElzU2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUgPSBpc19zZXNzaW9uX3N0b3JhZ2VfYXZhaWxhYmxlO1xuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUtleVZhbHVlU3RvcmFnZVByb2ZpbGUge1xuICAgICAgICAgICAgRGF0YVBlcnNpc3RhbmNlRHVyYXRpb25DYXBhYmlsaXRpZXM6IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uW107XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgQ2xpZW50U3RvcmFnZVByb2ZpbGUgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlUHJvZmlsZSB7XG4gICAgICAgICAgICBwdWJsaWMgRGF0YVBlcnNpc3RhbmNlRHVyYXRpb25DYXBhYmlsaXRpZXM6IEFycmF5PERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uPjtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMuRGF0YVBlcnNpc3RhbmNlRHVyYXRpb25DYXBhYmlsaXRpZXMgPSBbRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uVHJhbnNpZW50XTtcbiAgICAgICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuVHVyYm9saW5rc0F2YWlsYWJsZSB8fCBGcm9udEVuZEZyYW1ld29yay5TdG9yYWdlLklzU2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuRGF0YVBlcnNpc3RhbmNlRHVyYXRpb25DYXBhYmlsaXRpZXMucHVzaChEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUtleVZhbHVlU3RvcmFnZSB7XG4gICAgICAgICAgICBzZXQ6ICgoa2V5OmFueSwgdmFsOmFueSkgPT4gdm9pZCk7XG4gICAgICAgICAgICBnZXQ6ICgoa2V5OmFueSkgPT4gYW55KTtcbiAgICAgICAgfVxuICAgICAgICAvKlxuICAgICAgICBleHBvcnQgY2xhc3MgVHJhbnNpZW50U3RvcmFnZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldChrZXk6YW55LCB2YWw6YW55KSA6IHZvaWQgPT4ge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBnZXQoa2V5OmFueSkgOiBhbnkgPT4ge1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgICovXG4gICAgICAgIGV4cG9ydCBjbGFzcyBDbGllbnRTdG9yYWdlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZSB7XG4gICAgICAgICAgICBwdWJsaWMgY2xpZW50UHJvZmlsZSA9IG5ldyBDbGllbnRTdG9yYWdlUHJvZmlsZSgpO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHJpdmF0ZSBlcnJvck9uRmFpbCA9IGZhbHNlXG4gICAgICAgICAgICApIHsgfVxuXG4gICAgICAgICAgICBwdWJsaWMgc2V0KGtleTogYW55LFxuICAgICAgICAgICAgICAgICAgICAgICB2YWw6IGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24gPSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uLFxuICAgICAgICAgICAgICAgICAgICAgICBjYWNoZUV4cGlyYXRpb25EdXJhdGlvbj86IElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbikge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFJlbW92ZSB1cG9uIGFkZGluZyBzdXBwb3J0IGZvciBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5BY3Jvc3NTZXNzaW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJjYWNoZUV4cGlyYXRpb25EdXJhdGlvbiBpZ25vcmVkIGluIERhdGFiYXNlI3NldC5cIik7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uVHJhbnNpZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbjpcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oa2V5LCB2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnM6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lcnJvck9uRmFpbCkgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBnZXQoa2V5OiBhbnksIGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uPzogRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24pIDogYW55fG51bGx8dW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoKGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbjpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5BY3Jvc3NTZXNzaW9uczpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVycm9yT25GYWlsKSB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGZvcmNlQ2FjaGVFeHBpcnkoa2V5OiBhbnkpIHsgY29uc29sZS5lcnJvcihgVW5pbXBsZW1lbnRlZCBEYXRhYmFzZSNmb3JjZUNhY2hlRXhwaXJ5OiBGYWlsZWQgdG8gZXhwaXJlIGtleTogJHtrZXl9YCk7IHRocm93IGtleTsgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3N0b3JhZ2UuanMudHNcIi8+XG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgLy8gVmlzaXRzIHNpdGUgdXNpbmcgVHVyYm9saW5rcyAob3IgYW5vdGhlciBTUEEgZnJhbWV3b3JrIHdoZW4gc3VwcG9ydCBpcyBhZGRlZCkgaWYgcG9zc2libGUuXG4gICAgLy8gU2hvdWxkIGFsd2F5cyByZXN1bHQgaW4gb3BlbmluZyBnaXZlbiBsaW5rIChpZiBnaXZlbiBhcmd1bWVudCBmb3IgYGxpbmtgIGlzIHZhbGlkIFVSTCkuXG4gICAgZXhwb3J0IGxldCB2aXNpdExpbmsgPSBmdW5jdGlvbihsaW5rIDogc3RyaW5nLCB7Zm9yY2VSZWxvYWQsIG5ld1RhYn06IHtmb3JjZVJlbG9hZD86IGJvb2xlYW4sIG5ld1RhYj86IGJvb2xlYW59ID0ge2ZvcmNlUmVsb2FkOiBmYWxzZSwgbmV3VGFiOiBmYWxzZX0pIHtcbiAgICAgICAgaWYgKChuZXdUYWIgIT0gbnVsbCkgJiYgPGJvb2xlYW4+bmV3VGFiKSB7XG4gICAgICAgICAgICB3aW5kb3cub3BlbihsaW5rLCBcIl9ibGFua1wiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiYgISgoZm9yY2VSZWxvYWQgIT0gbnVsbCkgJiYgPGJvb2xlYW4+Zm9yY2VSZWxvYWQpKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETzogQWRkIHN1cHBvcnQgZm9yIG90aGVyIFNQQSBmcmFtZXdvcmtzIGhlcmUuXG4gICAgICAgICAgICAgICAgaWYgKChGcm9udEVuZEZyYW1ld29yay5SdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24gPT09XG4gICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5UdXJib2xpbmtzKSAmJlxuICAgICAgICAgICAgICAgICAgICAodHlwZW9mKFR1cmJvbGlua3MudmlzaXQpID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICBUdXJib2xpbmtzLnZpc2l0KGxpbmspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBsaW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxldCBjbGVhbnVwRnVuYyA9ICgpID0+IHtcbiAgICAgICAgLy8gT25seSBleGVjdXRlIGluIHNpbmdsZSBwYWdlIGFwcGxpY2F0aW9ucyAoaW4gb3RoZXIgY2FzZSwgcGFnZSB3b3VsZCBiZSByZXNldCBhbnl3YXlzKVxuICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXBIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGNsZWFudXBIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgcHJlUmVhZHlGdW5jID0gKCkgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZVJlYWR5SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyeSB7IHByZVJlYWR5SG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHBvc3RSZWFkeUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zdFJlYWR5SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyeSB7IHBvc3RSZWFkeUhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcm9udEVuZEZyYW1ld29yay5zdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gPSB7fTtcbiAgICB9O1xuXG4gICAgZXhwb3J0IG5hbWVzcGFjZSBQdWJTdWIge1xuICAgICAgICBpbnRlcmZhY2UgUHViU3ViUmVsYXlTdWJzY3JpYmVySW5mbyBleHRlbmRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgc3Vic2NyaWJlcklkZW50aWZpZXI6IHN0cmluZztcbiAgICAgICAgICAgIHN1YnNjcmliZXJTZXR0ZXI6ICgobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkO1xuICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheSBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgcHVibGljIHN0YXRpYyBEZWZhdWx0T2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudDtcbiAgICAgICAgICAgIHB1YmxpYyBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBzdWJzY3JpcHRpb25JZGVudGlmaWVyOiBzdHJpbmc7XG4gICAgICAgICAgICBwcml2YXRlIHB1YlN1YlJlbGF5U3Vic2NyaWJlcnM6IFB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm9bXSA9IFtdO1xuICAgICAgICAgICAgcHJpdmF0ZSBsYXN0U2VudE1lc3NhZ2U6IGFueTsgLy8gVG8gYmUgcmUtYnJvYWRjYXN0IGFmdGVyIG5hdmlnYXRpbmcgcGFnZXNcbiAgICAgICAgICAgIHByaXZhdGUgZmlyc3RNZXNzYWdlU2VudFA6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgY29uc3RydWN0b3Ioc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIgPSBzdWJzY3JpcHRpb25JZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gUHViU3ViUmVsYXkuRGVmYXVsdE9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGFkZFN1YnNjcmliZXIoc3Vic2NyaWJlckluZm86UHViU3ViUmVsYXlTdWJzY3JpYmVySW5mbykgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCg8bnVtYmVyPnRoaXMub2JqZWN0TGlmZUN5Y2xlKSA8ICg8bnVtYmVyPnN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gc3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXS5zdWJzY3JpYmVySWRlbnRpZmllciA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJJbmZvLnN1YnNjcmliZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbm5vdCBzdWJzY3JpYmUgbW9yZSB0aGFuIG9uY2UgdG8gKCR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfSkgd2l0aCAoJHtzdWJzY3JpYmVySW5mby5zdWJzY3JpYmVySWRlbnRpZmllcn0pLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLnB1c2goc3Vic2NyaWJlckluZm8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVsYXlNZXNzYWdlKHNlbmRpbmdTdWJzY3JpYmVySWRlbnRpZmllcjpzdHJpbmcsIG1lc3NhZ2U6YW55KSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFJlbGF5aW5nIG1lc3NhZ2UgZnJvbSBQdWJTdWJSZWxheSNyZWxheU1lc3NhZ2UgZm9yIHN1YnNjcmlwdGlvbjogJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9fWApXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0U2VudE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RNZXNzYWdlU2VudFAgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWxldmFudFN1YnNjcmliZXIgPSB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBQcmludGluZyAke2l9LXRoIHJlbGV2YW50U3Vic2NyaWJlcmApO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhyZWxldmFudFN1YnNjcmliZXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZGluZ1N1YnNjcmliZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZihyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lcyB0aGF0IGEgdHJpZ2dlciBjaGFuZ2UgZXZlbnQgc2hvdWxkIG5vdCBiZSBmaXJlZCBvbiBzZXR0aW5nIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugc3Vic2NyaWJlclNldHRlciBhcmcgd2hlbiBzdWJzY3JpYmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5pbmZvKGBTZXR0aW5nIHZhbHVlICgke21lc3NhZ2V9KSBmb3IgJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9IGlkLmApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdIbmRsLiQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbXNPZkludGVyZXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBlbGVtc09mSW50ZXJlc3QubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobWVzc2FnZS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBTb21ldGhpbmcgcHJvYmFibHkgaXMgbm90IGdvaW5nIHRvIHdvcmsgYXMgcGxhbm5lZCBpbiBzZXR0aW5nIHZhbHVlcyAoJHttZXNzYWdlfSkgZm9yIGVsZW1lbnQgd2l0aCBpZDogJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5lbGVtc09mSW50ZXJlc3RbeF0pLnZhbHVlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdIbmRsLiQpKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5maXJzdE1lc3NhZ2VTZW50UCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBSZWxheWluZyBtZXNzYWdlIGZyb20gUHViU3ViUmVsYXkjcmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UgZm9yIHN1YnNjcmlwdGlvbjogJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9fWApXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbGV2YW50U3Vic2NyaWJlciA9IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKHRoaXMubGFzdFNlbnRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lcyB0aGF0IGEgdHJpZ2dlciBjaGFuZ2UgZXZlbnQgc2hvdWxkIG5vdCBiZSBmaXJlZCBvbiBzZXR0aW5nIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSBzdWJzY3JpYmVyU2V0dGVyIGFyZyB3aGVuIHN1YnNjcmliaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgU2V0dGluZyB2YWx1ZSAoJHt0aGlzLmxhc3RTZW50TWVzc2FnZX0pIGZvciAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn0gaWQuYCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbCh0aGlzLmxhc3RTZW50TWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdIbmRsLiQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtc09mSW50ZXJlc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgZWxlbXNPZkludGVyZXN0Lmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sYXN0U2VudE1lc3NhZ2UuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBTb21ldGhpbmcgcHJvYmFibHkgaXMgbm90IGdvaW5nIHRvIHdvcmsgYXMgcGxhbm5lZCBpbiBzZXR0aW5nIHZhbHVlcyAoJHt0aGlzLmxhc3RTZW50TWVzc2FnZX0pIGZvciBlbGVtZW50IHdpdGggaWQ6ICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmVsZW1zT2ZJbnRlcmVzdFt4XSkudmFsdWUgPSB0aGlzLmxhc3RTZW50TWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdIbmRsLiQpKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKHRoaXMubGFzdFNlbnRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZU5hdmlnYXRpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gU2hvcnQtY2lyY3VpdCBpZiBpdGVtIHdpbGwgYmUgUHViU3ViUmVsYXkgaXRzZWxmIHdpbGwgYmUgZGVzdHJveWVkIGFueXdheXNcblxuICAgICAgICAgICAgICAgIGxldCB0b1JlbW92ZSA6IG51bWJlcltdID0gW107IC8vIGluZGljZXMgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycykgb2Ygc3Vic2NyaWJlcnMgdG8gcmVtb3ZlXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldLm9iamVjdExpZmVDeWNsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b1JlbW92ZS5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgd2hpbGUgKHRvUmVtb3ZlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMuc3BsaWNlKDxudW1iZXI+dG9SZW1vdmUucG9wKCksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzIFB1YlN1YlJlbGF5U3RvcmFnZSBpbXBsZW1lbnRzIFN0b3JhZ2UuSUtleVZhbHVlU3RvcmFnZSwgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbGxvdyB0aGUgUHViU3ViUmVsYXlTdG9yYWdlIHRvIGhhdmUgYSB0cmFuc2llbnQgb2JqZWN0IGxpZmUgY3ljbGVcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZTtcbiAgICAgICAgICAgIHByaXZhdGUgbWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5czogYW55O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzID0ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBnZXQoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpIDogUHViU3ViUmVsYXl8bnVsbHx1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBzZXQoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsIHB1YlN1YlJlbGF5OiBQdWJTdWJSZWxheSkgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl0gPSBwdWJTdWJSZWxheTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZU5hdmlnYXRpb24oKSB7XG4gICAgICAgICAgICAgICAgbGV0IGtleXNUb0RlbGV0ZSA6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzKS5mb3JFYWNoKChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXlJbnN0YW5jZSA9IHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXTtcbiAgICAgICAgICAgICAgICAgICAgcHViU3ViUmVsYXlJbnN0YW5jZS5oYW5kbGVOYXZpZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHB1YlN1YlJlbGF5SW5zdGFuY2Uub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgcHViU3ViUmVsYXlJbnN0YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAga2V5c1RvRGVsZXRlLnB1c2goc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzVG9EZWxldGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1trZXlzVG9EZWxldGVbaV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHJlYnJvYWRjYXN0QWxsTWVzc2FnZUxhc3RSZWxheWVkQnlTdG9yZWRQdWJTdWJSZWxheXMoKSA6IHZvaWQge1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cykuZm9yRWFjaCgoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdLnJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheU1hbmFnZXIge1xuICAgICAgICAgICAgLy8gVE9ETzogQWxsb3cgdGhlIFB1YlN1YlJlbGF5TWFuYWdlciB0byBoYXZlIGEgdHJhbnNpZW50IG9iamVjdCBsaWZlIGN5Y2xlXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwcml2YXRlIHB1YlN1YlJlbGF5U3RvcmFnZTogUHViU3ViUmVsYXlTdG9yYWdlID0gbmV3IFB1YlN1YlJlbGF5U3RvcmFnZSgpO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPmNsZWFudXBIb29rcykucHVzaCh0aGlzLmdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHRoaXMpKTtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5wb3N0UmVhZHlIb29rcykucHVzaCh0aGlzLmdlblJlYnJvYWRjYXN0TGFzdE1lc3NhZ2VzRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdG9yYWdlLmhhbmRsZU5hdmlnYXRpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2VzKCkge1xuICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdG9yYWdlLnJlYnJvYWRjYXN0QWxsTWVzc2FnZUxhc3RSZWxheWVkQnlTdG9yZWRQdWJTdWJSZWxheXMoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyhzZWxmOiBQdWJTdWJSZWxheU1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5oYW5kbGVOYXZpZ2F0aW9uLmJpbmQoc2VsZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuUmVicm9hZGNhc3RMYXN0TWVzc2FnZXNGdW5jKHNlbGY6IFB1YlN1YlJlbGF5TWFuYWdlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLnJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlcy5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIHNlbGZJZGVudGlmaWVyOnN0cmluZywgLy8gc2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yIChKUXVlcnkgc2VsZWN0b3IpXG4gICAgICAgICAgICAgICAgc2VsZlNldHRlcjooKG1lc3NhZ2U6YW55KSA9PiB2b2lkKXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXkgPSB0aGlzLmhhbmRsZVB1YlN1YlJlbGF5SW5pdGlhbGl6YXRpb25BbmRSZXRyaWV2YWwoc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTZWUgaWYgZ2l2ZW4gYG9iamVjdExpZmVDeWNsZWAgaXMgZ3JlYXRlciB0aGFuIGRlc2lnbmF0ZWQgb2JqZWN0TGlmZUN5Y2xlLFxuICAgICAgICAgICAgICAgIC8vIGlmIGl0IGlzLCBjaGFuZ2UgaG93IGl0IGlzIG1hbmFnZWQgKG5vdCByZWxldmFudCB1bnRpbCBvYmplY3QgbGlmZSBjeWNsZSBvdGhlclxuICAgICAgICAgICAgICAgIC8vIHRoYW4gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgaXMgc3VwcG9ydGVkKS5cblxuICAgICAgICAgICAgICAgICg8UHViU3ViUmVsYXk+cHViU3ViUmVsYXkpLmFkZFN1YnNjcmliZXIoe1xuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVySWRlbnRpZmllcjogc2VsZklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJTZXR0ZXI6IHNlbGZTZXR0ZXIsXG4gICAgICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogb2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVQdWJsaXNoZWRNZXNzYWdlKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6YW55XG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXkgPSB0aGlzLmhhbmRsZVB1YlN1YlJlbGF5SW5pdGlhbGl6YXRpb25BbmRSZXRyaWV2YWwoc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgcHViU3ViUmVsYXkucmVsYXlNZXNzYWdlKHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIG1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGhhbmRsZVB1YlN1YlJlbGF5SW5pdGlhbGl6YXRpb25BbmRSZXRyaWV2YWwoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpIDogUHViU3ViUmVsYXkge1xuICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheSA6IFB1YlN1YlJlbGF5fG51bGx8dW5kZWZpbmVkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgcHViIHN1YiByZWxheSBpZiBpdCBkb2VzIG5vdCBleGlzdFxuICAgICAgICAgICAgICAgIGlmICgocHViU3ViUmVsYXkgPSB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5nZXQoc3Vic2NyaXB0aW9uSWRlbnRpZmllcikpID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcHViU3ViUmVsYXkgPSBuZXcgUHViU3ViUmVsYXkoc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdG9yYWdlLnNldChcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICA8UHViU3ViUmVsYXk+cHViU3ViUmVsYXlcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIDxQdWJTdWJSZWxheT5wdWJTdWJSZWxheTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEludGVybmFsIGxpYnJhcnkgc3RhdGVcbiAgICAgICAgLy8gVE9ETzogTWFuYWdlIGludGVybmFsIGxpYnJhcnkgc3RhdGUgd2l0aG91dCB1c2luZyBnbG9iYWxzXG4gICAgICAgIGxldCBwdWJTdWJSZWxheU1hbmFnZXIgOiBQdWJTdWJSZWxheU1hbmFnZXIgPSBuZXcgUHViU3ViUmVsYXlNYW5hZ2VyKCk7O1xuXG4gICAgICAgIC8vIFRyZWF0IHRoZSBmaXJzdCB0d28gYXJndW1lbnRzIHRvIHRoaXMgZnVuY3Rpb24gYXMgYmVpbmcgbW9yZSBhIHBhcnQgb2YgYSBzdGFibGVcbiAgICAgICAgLy8gQVBJIHZzIHRoZSB0aGUgdGhpcmQgYW5kIGZvdXJ0aCBhcmd1bWVudHMgd2hpY2ggYXJlIHN1YmplY3QgdG8gY2hhbmdlLlxuICAgICAgICBleHBvcnQgbGV0IHN1YnNjcmliZSA9IChcbiAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgc2VsZklkZW50aWZpZXI6c3RyaW5nLCAvLyBzaG91bGQgYmUgYSBDU1Mgc2VsZWN0b3IgKEpRdWVyeSBzZWxlY3RvcikgdW5sZXNzIHByb3ZpZGluZyBgc2VsZlNldHRlcmAgYXJndW1lbnRcbiAgICAgICAgICAgIHNlbGZTZXR0ZXI6KChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50XG4gICAgICAgICkgOiBhbnl8dm9pZCA9PiB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhcIlByaW50aW5nIEZyb250RW5kRnJhbWV3b3JrLlB1YlN1Yi5zdWJzY3JpYmUgYXJnc1wiKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oc2VsZklkZW50aWZpZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oc2VsZlNldHRlcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhvYmplY3RMaWZlQ3ljbGUpO1xuICAgICAgICAgICAgcHViU3ViUmVsYXlNYW5hZ2VyLmhhbmRsZVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBzZWxmSWRlbnRpZmllciwgc2VsZlNldHRlciwgb2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGxldCBwdWJsaXNoID0gKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLCBtZXNzYWdlOmFueSkgPT4ge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oXCJQcmludGluZyBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIucHVibGlzaCBhcmdzXCIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhtZXNzYWdlKTtcbiAgICAgICAgICAgIHB1YlN1YlJlbGF5TWFuYWdlci5oYW5kbGVQdWJsaXNoZWRNZXNzYWdlKHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIG1lc3NhZ2UpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNhZ2U6IER1cmluZyBpbml0aWFsaXphdGlvbiBzdWJzY3JpYmUgYmVmb3JlIHBvc3QtaG9va3MgKHByZWZlcmFibHkgcHJlLWhvb2tzKSBhbmQgcHVibGlzaCBpbiBwb3N0LWhvb2tzLlxuXG4gICAgICAgIC8vIEFzc3VtZWQgdG8gYmUgY29uc3RydWN0ZWQgaW4gcHJlLWhvb2tcbiAgICAgICAgZXhwb3J0IGNsYXNzIFB1YlN1YlNlc3Npb25TdG9yYWdlU3Vic2NyaWJlciBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgLy8gVE9ETzogU3VwcG9ydCBvdGhlciBvYmplY3QgbGlmZSBjeWNsZXNcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZTtcbiAgICAgICAgICAgIHB1YmxpYyBzdG9yYWdlS2V5OiBzdHJpbmc7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBzdG9yYWdlS2V5OnN0cmluZyxcbiAgICAgICAgICAgICAgICBwdWJsaXNoRXhpc3RpbmdTdG9yZWRWYWx1ZTpib29sZWFuID0gdHJ1ZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9yYWdlS2V5ID0gc3RvcmFnZUtleTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IFNob3J0LUNpcmN1aXQgaWYgc2Vzc2lvbiBzdG9yYWdlIG5vdCBhdmFpbGFibGVcbiAgICAgICAgICAgICAgICBpZiAoIVN0b3JhZ2UuSXNTZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQWJhbmRvbmluZyBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIgaW5pdGlhbGl6YXRpb24gc2luY2Ugc2Vzc2lvbiBzdG9yYWdlIGlzIG5vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgc3RvcmFnZUtleSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nZW5TdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgIClcblxuICAgICAgICAgICAgICAgIGxldCBpbml0aWFsU3RvcmVkVmFsdWUgPSBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKHN0b3JhZ2VLZXkpO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluaXRpYWxTdG9yZWRWYWx1ZSAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgIHB1Ymxpc2hFeGlzdGluZ1N0b3JlZFZhbHVlKVxuICAgICAgICAgICAgICAgICAgICBob29rcy5wb3N0LnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaChzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBpbml0aWFsU3RvcmVkVmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyh2YWw6YW55KSB7XG4gICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSh0aGlzLnN0b3JhZ2VLZXksIHZhbC50b1N0cmluZygpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5TdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jKHNlbGY6IFB1YlN1YlNlc3Npb25TdG9yYWdlU3Vic2NyaWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAobWVzc2FnZTphbnkpID0+IHtzZWxmLnN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmMuY2FsbChzZWxmLCBtZXNzYWdlKTt9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBc3N1bWVkIHRvIGJlIGNvbnN0cnVjdGVkIGluIHByZS1ob29rXG4gICAgICAgIGV4cG9ydCBjbGFzcyBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyaWJlciBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IHN1YnNjcmlwdGlvbklkZW50aWZpZXIgOiBzdHJpbmc7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlIDogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGh0bWxJZCA6IHN0cmluZztcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvbkNoYW5nZUZ1bmMgOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBwdWJsaXNoVmFsdWVQcmVkaWNhdGUgOiBib29sZWFuO1xuICAgICAgICAgICAgcHJpdmF0ZSBfcHVibGlzaE9uQ2hhbmdlRnVuYz86ICgoZXY6IEV2ZW50KSA9PiB2b2lkKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIGh0bWxJZDpzdHJpbmcsXG4gICAgICAgICAgICAgICAgb25DaGFuZ2VGdW5jOigoKSA9PiB2b2lkKXxudWxsID0gbnVsbCxcbiAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50LFxuICAgICAgICAgICAgICAgIHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZTpib29sZWFuID0gZmFsc2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllciA9IHN1YnNjcmlwdGlvbklkZW50aWZpZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sSWQgPSBodG1sSWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNoYW5nZUZ1bmMgPSBvbkNoYW5nZUZ1bmM7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBvYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJsaXNoVmFsdWVQcmVkaWNhdGUgPSBwdWJsaXNoVmFsdWVQcmVkaWNhdGU7XG5cbiAgICAgICAgICAgICAgICAvLyBQdWJsaXNoIHZhbHVlIHdoZW4gYXBwcm9wcmlhdGVcbiAgICAgICAgICAgICAgICBpZiAocHVibGlzaFZhbHVlUHJlZGljYXRlICYmXG4gICAgICAgICAgICAgICAgICAgICgoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWUgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaG9va3MucG9zdC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN1YnNjcmliZVxuICAgICAgICAgICAgICAgIHN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgYCMke2h0bWxJZH1gLFxuICAgICAgICAgICAgICAgICAgICAobWVzc2FnZTphbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ0huZGwuJCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJChgIyR7aHRtbElkfWApLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbXNPZkludGVyZXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChgIyR7aHRtbElkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgZWxlbXNPZkludGVyZXN0Lmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5lbGVtc09mSW50ZXJlc3RbeF0pLnZhbHVlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdIbmRsLiQpKGAjJHtodG1sSWR9YCkudmFsKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PnRoaXMub25DaGFuZ2VGdW5jKSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuX3B1Ymxpc2hPbkNoYW5nZUZ1bmMgPSAoKF9ldjogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHVibGlzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmh0bWxJZCkpLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5pbmZvKGBEZXRlY3RlZCBjaGFuZ2UgaW4gKCR7aHRtbElkfSk6ICR7KDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlfWApXG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25DaGFuZ2VGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkNoYW5nZUZ1bmMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKSB9XG4gICAgICAgICAgICAgICAgICAgIH0gLy8gZWxzZSB7IGNvbnNvbGUuaW5mbygnRGlkIG5vdCBmaXJlIG51bGwgb25DaGFuZ2VGdW5jJykgfVxuICAgICAgICAgICAgICAgIH0pLmJpbmQodGhpcyk7XG5cbiAgICAgICAgICAgICAgICAvLyBQdWJsaXNoIG9uIGNoYW5nZXNcbiAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLmFkZEV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8KChldjogRXZlbnQpID0+IHZvaWQpPnRoaXMuX3B1Ymxpc2hPbkNoYW5nZUZ1bmMpKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnB1c2godGhpcy5nZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlYXJkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHNlbGY6IEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHtzZWxmLmhhbmRsZU5hdmlnYXRpb24uY2FsbChzZWxmKTt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlYXJkb3duKG92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlOmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgIW92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0ZWFyZG93biBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIuSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmJlciBpbnN0YW5jZSBkdWUgdG8gb2JqZWN0TGlmZUN5Y2xlIG5vdCBiZWluZyBvdmVycmlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2xlYW5pbmcgdXAgZXZlbnQgaGFuZGxlcnMgc2V0IHVwIGluIEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JiZXIgKGlkOiAke3RoaXMuaHRtbElkfSlgKTtcbiAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJCgnIycgKyB0aGlzLmh0bWxJZCkub2ZmKEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cyk7XG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuaHRtbElkKSAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmh0bWxJZCkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8KChldjogRXZlbnQpID0+IHZvaWQpPnRoaXMuX3B1Ymxpc2hPbkNoYW5nZUZ1bmMpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IFJFQURZX0ZVTkMgPSAoKSA9PiB7XG4gICAgICAgIC8vIEZpcmUgZnVuY3Rpb25zIGluIGhvb2tzLnByZSBBcnJheVxuICAgICAgICB3aGlsZSAoaG9va3MucHJlLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPmhvb2tzLnByZS5zaGlmdCgpKSgpOyB9XG4gICAgICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfTtcblxuICAgICAgICB0cnkgeyBwcmVSZWFkeUZ1bmMoKTsgfVxuICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cblxuICAgICAgICBpZiAoKEZyb250RW5kRnJhbWV3b3JrLnJlYWR5RnVuYyAhPSBudWxsKSAmJlxuICAgICAgICAgICAgKHR5cGVvZihGcm9udEVuZEZyYW1ld29yay5yZWFkeUZ1bmMpID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5yZWFkeUZ1bmMoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJ5IHsgcG9zdFJlYWR5RnVuYygpOyB9XG4gICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuXG4gICAgICAgIC8vIEZpcmUgZnVuY3Rpb25zIGluIGhvb2tzLnBvc3QgQXJyYXlcbiAgICAgICAgd2hpbGUgKGhvb2tzLnBvc3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdHJ5IHsgKDwoKCkgPT4gdm9pZCk+aG9va3MucG9zdC5zaGlmdCgpKSgpOyB9XG4gICAgICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgc3dpdGNoIChGcm9udEVuZEZyYW1ld29yay5SdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24pIHtcbiAgICAgICAgY2FzZSBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5UdXJib2xpbmtzOlxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczpsb2FkJywgUkVBRFlfRlVOQyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5Ob0ZyYW1ld29yazpcbiAgICAgICAgY2FzZSBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5XaW5kb3dzVVdQOlxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIFJFQURZX0ZVTkMpO1xuICAgIH1cblxuICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgLy8gVE9ETzogQWRkIHN1cHBvcnQgZm9yIG90aGVyIFNQQSBmcmFtZXdvcmtzIGhlcmUuXG4gICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5SdW50aW1lU3VwcG9ydGVkSW50ZWdyYXRpb24gPT09IEZyb250RW5kRnJhbWV3b3JrLlN1cHBvcnRlZEludGVncmF0aW9uLlR1cmJvbGlua3MgJiZcbiAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLlR1cmJvbGlua3NBdmFpbGFibGUpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicsIGNsZWFudXBGdW5jKTtcbiAgICAgICAgICAgIGlmIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wYWdlQ2xlYW51cCBBcnJheVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgKDwoKCkgPT4gdm9pZCk+KDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkuc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoKGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jICE9IG51bGwpICYmICh0eXBlb2YoY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMpID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOnZpc2l0JywgY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy89IHJlcXVpcmUgLi9iYXNlXG4vLz0gcmVxdWlyZSAuL3NjcmVlbl9yZXNvbHV0aW9uc1xuLy89IHJlcXVpcmUgLi9taW5pX2h0bWxfdmlld19tb2RlbFxuLy89IHJlcXVpcmUgLi9zdG9yYWdlXG4vLz0gcmVxdWlyZSAuL2NvcmVcblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL21pbmlfaHRtbF92aWV3X21vZGVsLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RvcmFnZS5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2NvcmUuanMudHNcIi8+XG5cbi8vIE5vdGUgdGhhdCB0aGUgYWJvdmUgcmVmZXJlbmNlcyBkbyBub3Qgd29yayBpZiB5b3UgaGF2ZSB0aGUgVHlwZVNjcmlwdCBjb21waWxlciBzZXQgdG8gcmVtb3ZlIGNvbW1lbnRzLlxuLy8gVXNlIHNvbWV0aGluZyBsaWtlIHRoZSB1Z2xpZmllciBnZW0gZm9yIHJlbW92aW5nIGNvbW1lbnRzL29iZnVzY2F0aW9uLlxuXG4vLyBUaGUgbG9hZCBvcmRlciBjdXJyZW50bHkgbWF0dGVycy5cblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHsgZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnMC43LjAnOyB9XG4iXX0=