// Does not really depend on anything
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
/// <reference path="./base.ts" />
// Depends on JQuery
// Depends on ./base.ts due to the fact that the future IUserInterfaceElement might rely on cleanupHooks
// for teardown logic.
var FrontEndFramework;
(function (FrontEndFramework) {
    var MiniHtmlViewModel;
    (function (MiniHtmlViewModel) {
        MiniHtmlViewModel.VERSION = '0.7.1';
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
                                    // For debugging
                                    console.error("Unacceptable id detected in IViewModelPropertyBase (bindable property displayed below): " + bP.id);
                                    console.info(bP);
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
                var valueToSet = cnvrtr(bP.value);
                if (bP.setDataFunc == null) {
                    if (typeof FrontEndFramework.gHndl.$ === 'undefined') {
                        // Replaces: $('#' + propertyId).val(bP.value);
                        document.getElementById(propertyId).value = valueToSet;
                    }
                    else {
                        FrontEndFramework.gHndl.$('#' + propertyId).val(valueToSet);
                    }
                }
                else {
                    bP.setDataFunc(valueToSet);
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
/// <reference path="./base.ts"/>
// Relies on ./base.ts because this library should be able to take advantage of Turbolinks not reloading page.
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
/// <reference path="./base.ts"/>
/// <reference path="./storage.ts"/>
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
var FrontEndFramework;
(function (FrontEndFramework) {
    var BodyScriptActivation;
    (function (BodyScriptActivation) {
        BodyScriptActivation.VERSION = '0.1.0';
        BodyScriptActivation.BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR = ".front_end_framework-body_script_activator";
        BodyScriptActivation.BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY = "activationIndex";
        // OPTIMIZE: Investigate using an alternative data structure.
        var BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE = {};
        BodyScriptActivation.AddEntryToLookupTable = function (key, value) {
            BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE[key] = value;
        };
        FrontEndFramework.preReadyHooks.push(function () {
            try {
                // console.log('before func eval');
                (function () {
                    var activatedActivationIndices = []; // Needed to prevent double usage of activation indices.
                    // console.log('at start of func eval');
                    var activationSections = Array.prototype.slice.call(document.querySelectorAll(BodyScriptActivation.BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR));
                    // console.log('after querySelectorAll invocation');
                    for (var i = 0; i < activationSections.length; i++) {
                        var activationSection = activationSections[i];
                        // console.log(activationSection);
                        if (activationSection != null) {
                            var activationIndex = activationSection.dataset[BodyScriptActivation.BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY];
                            if (activatedActivationIndices.indexOf(activationIndex) === -1) {
                                activatedActivationIndices.push(activationIndex);
                                try {
                                    // console.log(activationIndex);
                                    BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE[activationIndex](activationSection);
                                }
                                catch (error) {
                                    console.log(error);
                                    console.error("Failed to successfully execute lookup value func for activation index: " + activationIndex);
                                }
                                // console.log(`after body script invocation (activationIndex: ${activationIndex})`);
                            }
                            else {
                                console.error("Refusing to re-activate activationIndex: " + activationIndex);
                            }
                        }
                    }
                    // console.log('at end of func eval');
                })();
                // console.log('after func eval');
            }
            catch (error) {
                console.error(error);
                console.error("Failed to execute body script evaluation logic");
            }
        });
    })(BodyScriptActivation = FrontEndFramework.BodyScriptActivation || (FrontEndFramework.BodyScriptActivation = {}));
})(FrontEndFramework || (FrontEndFramework = {}));
/// <reference path="./base.ts"/>
/// <reference path="./screen_resolutions.ts"/>
/// <reference path="./mini_html_view_model.ts"/>
/// <reference path="./storage.ts"/>
/// <reference path="./core.ts"/>
/// <reference path="./body_script_activation.ts"/>
// The load order currently matters (except for reference paths that come after "./core.ts").
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.VERSION = '0.8.1';
})(FrontEndFramework || (FrontEndFramework = {}));
