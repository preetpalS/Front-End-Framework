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
        MiniHtmlViewModel.VERSION = '0.6.3';
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
                            _this.handlePropertyChangedEvent(bindablePropertyId);
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
            ViewModel.prototype.handlePropertyChangedEvent = function (propertyId) {
                try {
                    var bindableProperty = this.idToBindableProperty[propertyId];
                    switch (bindableProperty.bindingMode) {
                        // case BindingMode.OneTime:
                        //     console.error("IMPOSSIBLE");
                        //     break;
                        case 1 /* OneWayRead */:
                            ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty, propertyId);
                            break;
                        case 2 /* OneWayWrite */:
                            ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                            break;
                        case 3 /* TwoWay */:
                            ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                            break;
                        default:
                            console.warn("Invalid bindingMode for Binding Property associated with id: " + propertyId);
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
    FrontEndFramework.VERSION = '0.6.13';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsK0ZBQStGO0FBQy9GLDhFQUE4RTtBQUk5RSxJQUFVLGlCQUFpQixDQXlFMUI7QUF6RUQsV0FBVSxpQkFBaUI7SUFxQlosdUJBQUssR0FBa0IsTUFBTSxDQUFDO0lBUXhDLENBQUM7SUFFVyx1Q0FBcUIsR0FBRyx3QkFBd0IsQ0FBQztJQVU3RCxDQUFDO0lBTUQsQ0FBQztJQUNGLG1EQUFtRDtJQUN0Qyx1Q0FBcUIsR0FBRyxDQUFDLE9BQU8sa0JBQUEsS0FBSyxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFBLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUM7SUFDMUYscUNBQW1CLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsRix1Q0FBcUIsR0FBRyxrQkFBQSxtQkFBbUIsQ0FBQztJQUU5Qyw2Q0FBMkIsc0JBQTBELENBQUM7SUFF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bEMsQ0FBQztvQkFBQSxDQUFDO2dCQUNOLENBQUMsQ0FBQyxDQUFDO1lBQ1AsRUFBRSxDQUFDLENBQUMsQ0FBQywwQkFBMEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU0sQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RixRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNsRixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMsRUF0Z0JTLGlCQUFpQixLQUFqQixpQkFBaUIsUUFzZ0IxQjtBQ3pnQkQsa0JBQWtCO0FBQ2xCLGdDQUFnQztBQUNoQyxrQ0FBa0M7QUFDbEMscUJBQXFCO0FBQ3JCLGtCQUFrQjtBQUVsQixvQ0FBb0M7QUFDcEMsa0RBQWtEO0FBQ2xELG9EQUFvRDtBQUNwRCx1Q0FBdUM7QUFDdkMsb0NBQW9DO0FBRXBDLHlHQUF5RztBQUN6Ryx5RUFBeUU7QUFFekUsb0NBQW9DO0FBRXBDLElBQVUsaUJBQWlCLENBQXFDO0FBQWhFLFdBQVUsaUJBQWlCO0lBQWdCLHlCQUFPLEdBQUcsUUFBUSxDQUFDO0FBQUMsQ0FBQyxFQUF0RCxpQkFBaUIsS0FBakIsaUJBQWlCLFFBQXFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBUaGlzIGZpbGUgY29udGFpbnMgdHlwZXMgYW5kIGludGVybmFsIHN0YXRlIHVzZWQgYnkgdGhlIGZyYW1ld29yayB0aGF0IGluZGl2aWR1YWwgY29tcG9uZW50c1xuLy8gaW4gdGhlIGxpYnJhcnkgbmVlZCBrbm93bGVkZ2Ugb2Ygc3VjaCBhcyBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuXG5cbmRlY2xhcmUgdmFyIFR1cmJvbGlua3MgOiBhbnk7XG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgLy8gSGFzIGEgZGVwZW5kZW5jeSBvbiBKUXVlcnkuIFNob3VsZCBiZSBsb2FkZWQgYWZ0ZXIgVHVyYm9saW5rcyB0byByZWdpc3RlclxuICAgIC8vIGNsZWFudXBGdW5jIG9uICd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInIGV2ZW50LlxuICAgIGV4cG9ydCBpbnRlcmZhY2UgR2xvYmFsSGFuZGxlIGV4dGVuZHMgV2luZG93IHtcbiAgICAgICAgV2luZG93cz86IGFueTtcbiAgICAgICAgJD86IGFueTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIHNjcmlwdCB0YWcgYmVsb3cgaW4gdGhlIGhlYWRlciBvZiB5b3VyIHBhZ2U6XG4gICAgLy8gPHNjcmlwdD4gXCJ1c2Ugc3RyaWN0XCI7IHZhciBnSG5kbCA9IHRoaXM7IHZhciBzdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gPSB7fTsgdmFyIGhvb2tzID0geyBwcmU6IFtdLCBwb3N0OiBbXSwgcGFnZUNsZWFudXA6IFtdIH07IDwvc2NyaXB0PlxuICAgIGV4cG9ydCBkZWNsYXJlIHZhciBob29rcyA6IHtcbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGJlZm9yZSBNaW5pSHRtbFZpZXdNb2RlbC5yZWFkeUZ1bmMpXG4gICAgICAgIHByZTogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGFmdGVyIE1pbmlIdG1sVmlld01vZGVsLnJlYWR5RnVuYylcbiAgICAgICAgcG9zdDogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gRXhwZXJpbWVudGFsOiBPbmx5IG1ha2VzIHNlbnNlIGlmIHVzZWQgd2l0aCBUdXJib2xpbmtzXG4gICAgICAgIHBhZ2VDbGVhbnVwPzogKCgpID0+IHZvaWQpW11cbiAgICB9O1xuXG4gICAgZXhwb3J0IGxldCBnSG5kbCA6IEdsb2JhbEhhbmRsZSA9IHdpbmRvdztcbiAgICBleHBvcnQgZGVjbGFyZSB2YXIgc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uIDogYW55O1xuXG4gICAgLy8gQSBwYXJ0IG9mIHRoZSBTUEEgc3VwcHBvcnRcbiAgICBleHBvcnQgY29uc3QgZW51bSBPYmplY3RMaWZlQ3ljbGUge1xuICAgICAgICBUcmFuc2llbnQgPSAwLCAvLyBPbmx5IGZvciBzaW5nbGUgcGFnZSwgb2JqZWN0IHNob3VsZCBhdXRvbWF0aWNhbGx5IGJlIGRlc3Ryb3llZCB3aGVuIG5hdmlnYXRpbmcgZnJvbSBwYWdlXG4gICAgICAgIFZhcmlhYmxlUGVyc2lzdGVuY2UgPSAxLCAvLyBMaWZldGltZSBpcyBtYW5hZ2VkIG1hbnVhbGx5IChzaG91bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgZGVzdHJveWVkIHdoZW4gbmF2aWdhdGluZyBwYWdlcylcbiAgICAgICAgSW5maW5pdGVQZXJzaXN0ZW5jZSA9IDIgLy8gTm90IHRvIGJlIGRlc3Ryb3llZCAoaW50ZW5kZWQgdG8gYmUgcGVyc2lzdGVudCBhY3Jvc3MgcGFnZSBuYXZpZ2F0aW9uKVxuICAgIH07XG5cbiAgICBleHBvcnQgY29uc3QgSHRtbElucHV0Q2hhbmdlRXZlbnRzID0gJ2NoYW5nZSB0ZXh0SW5wdXQgaW5wdXQnO1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgb2JqZWN0TGlmZUN5Y2xlPzogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgIH1cblxuICAgIGV4cG9ydCBjb25zdCBlbnVtIFN1cHBvcnRlZEludGVncmF0aW9uIHtcbiAgICAgICAgTm9GcmFtZXdvcmsgPSAwLFxuICAgICAgICBUdXJib2xpbmtzID0gMSxcbiAgICAgICAgV2luZG93c1VXUCA9IDJcbiAgICB9O1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbk1ldGFkYXRhIHtcbiAgICAgICAgc3VwcG9ydGVkSW50ZWdyYXRpb246IFN1cHBvcnRlZEludGVncmF0aW9uO1xuICAgICAgICBzaW5nbGVQYWdlQXBwbGljYXRpb25TdXBwb3J0OiBib29sZWFuO1xuICAgICAgICBwYWdlUHJlQ2FjaGVFdmVudD86IHN0cmluZ3xudWxsOyAvLyBQcm9iYWJseSBnb2luZyB0byBiZSByZW1vdmVkXG4gICAgfTtcbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgY29uc3QgV2luZG93c1V3cEVudmlyb25tZW50ID0gKHR5cGVvZiBnSG5kbC5XaW5kb3dzICE9PSAndW5kZWZpbmVkJykgJiYgKGdIbmRsLldpbmRvd3MgIT0gbnVsbCk7XG4gICAgZXhwb3J0IGNvbnN0IFR1cmJvbGlua3NBdmFpbGFibGUgPSAodHlwZW9mIFR1cmJvbGlua3MgIT09ICd1bmRlZmluZWQnKSAmJiAoVHVyYm9saW5rcyAhPSBudWxsKTtcbiAgICBleHBvcnQgY29uc3QgU2luZ2xlUGFnZUFwcGxpY2F0aW9uID0gVHVyYm9saW5rc0F2YWlsYWJsZTtcblxuICAgIGV4cG9ydCBsZXQgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uIDogU3VwcG9ydGVkSW50ZWdyYXRpb24gPSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbi5Ob0ZyYW1ld29yaztcblxuICAgIC8vIFRPRE86IFN1cHBvcnQgVHVyYm9saW5rcyBpbiBXaW5kb3dzIFVXUCBFbnZpcm9ubWVudFxuICAgIGlmIChXaW5kb3dzVXdwRW52aXJvbm1lbnQpIHtcbiAgICAgICAgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID0gU3VwcG9ydGVkSW50ZWdyYXRpb24uV2luZG93c1VXUDtcbiAgICB9IGVsc2UgaWYgKFR1cmJvbGlua3NBdmFpbGFibGUpIHtcbiAgICAgICAgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID0gU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgbGV0IFBhZ2VQcmVDYWNoZUV2ZW50OiBzdHJpbmd8bnVsbCA9IFR1cmJvbGlua3NBdmFpbGFibGUgPyAndHVyYm9saW5rczpiZWZvcmUtY2FjaGUnIDogbnVsbDtcblxuICAgIC8vIFRvIGJlIHNldCBieSB1c2VyIChmaXJlZCB3aGVuIERPTSBpcyByZWFkeSlcbiAgICBleHBvcnQgbGV0IHJlYWR5RnVuYyA6ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAgIC8vIEZvciB1c2VycyB0byBzdXBwbHkgaG9va3MgKGxhbWJkYSBmdW5jdGlvbnMpIHRoYXQgdGhleSB3YW50IHRvIGZpcmUgb24gZWFjaCBuYXZpZ2F0aW9uIChub3RlXG4gICAgLy8gdGhhdCB0aGVzZSBhcnJheXMgYXJlIG5vdCBlbXB0aWVkIGFzIGV4ZWN1dGVkKS5cbiAgICBleHBvcnQgbGV0IGNsZWFudXBIb29rcyA6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gICAgZXhwb3J0IGxldCBwcmVSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBleHBvcnQgbGV0IHBvc3RSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbn1cbiIsIlxuLy8gRG9lcyBub3QgcmVhbGx5IGRlcGVuZCBvbiBhbnl0aGluZ1xuXG5cInVzZSBzdHJpY3RcIjtcblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbmV4cG9ydCBuYW1lc3BhY2UgU2NyZWVuRGltZW5zaW9ucyB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBTY3JlZW5EaW1lbnNpb25zIHtcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0IDogbnVtYmVyO1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA6IG51bWJlcjtcbiAgICAgICAgZGV2aWNlSGVpZ2h0IDogbnVtYmVyO1xuICAgICAgICBkZXZpY2VXaWR0aCA6IG51bWJlcjtcbiAgICB9XG5cbiAgICBleHBvcnQgdmFyIEdldFNjcmVlbkRpbWVuc2lvbnMgPSBmdW5jdGlvbigpIDogU2NyZWVuRGltZW5zaW9ucyB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhdmFpbGFibGVIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQsXG4gICAgICAgICAgICBhdmFpbGFibGVXaWR0aDogd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoLFxuICAgICAgICAgICAgZGV2aWNlSGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodCxcbiAgICAgICAgICAgIGRldmljZVdpZHRoOiB3aW5kb3cuc2NyZWVuLndpZHRoXG4gICAgICAgIH07XG4gICAgfVxufVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiIC8+XG5cbi8vIERlcGVuZHMgb24gSlF1ZXJ5XG4vLyBEZXBlbmRzIG9uIC4vYmFzZS5qcy50cyBkdWUgdG8gdGhlIGZhY3QgdGhhdCB0aGUgZnV0dXJlIElVc2VySW50ZXJmYWNlRWxlbWVudCBtaWdodCByZWx5IG9uIGNsZWFudXBIb29rc1xuLy8gZm9yIHRlYXJkb3duIGxvZ2ljLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgTWluaUh0bWxWaWV3TW9kZWwge1xuICAgICAgICBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjYuMyc7XG5cbiAgICAgICAgZXhwb3J0IGNvbnN0IGVudW0gQmluZGluZ01vZGUgeyBPbmVUaW1lLCBPbmVXYXlSZWFkLCBPbmVXYXlXcml0ZSwgVHdvV2F5IH07XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZTtcbiAgICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW107IC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgdmFsdWU/OiBhbnk7IC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgIHZpZXdNb2RlbFJlZj86IFQ7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuYz86IEV2ZW50TGlzdGVuZXI7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuY3M/OiBFdmVudExpc3RlbmVyW107XG4gICAgICAgICAgICBjaGFuZ2VFdmVudHM/OiBzdHJpbmc7IC8vIFRPRE86IEludmVzdGlnYXRlIGFsc28gYWxsb3dpbmcgYW4gYXJyYXkgb2Ygc3RyaW5nc1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8VD4ge1xuICAgICAgICAgICAgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCk7XG4gICAgICAgICAgICBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUPiB7XG4gICAgICAgICAgICBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpO1xuICAgICAgICAgICAgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCk7IC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiB7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGNhbiBiZSB0aG91Z2h0IG9mIGFzIHNldCB2YWx1ZSBvbmNlIGFuZCBmb3JnZXQgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBvciBJVmlld01vZGVsUHJvcGVydHkgc3RvcmVkKVxuICAgICAgICAvLyBWYWx1ZSBpcyBOT1QgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5UmVhZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlIGlzIGEgd2F5IHRvIHNldCB2YWx1ZXMgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBidXQgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IGFyZSBzdG9yZWQpLlxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOkJpbmRpbmdNb2RlLk9uZVdheVdyaXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3VsZCBpbmhlcml0IGZyb20gdGhpcyBjbGFzcyBpbnN0ZWFkIG9mIGluc3RhbnRpYXRpbmcgaXQgZGlyZWN0bHkuXG4gICAgICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3TW9kZWwgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHByb3RlY3RlZCBpZFRvQmluZGFibGVQcm9wZXJ0eTogeyBbaW5kZXg6IHN0cmluZ106IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPiB9O1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ2hhbmdlRXZlbnRzID0gRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzO1xuICAgICAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLFxuICAgICAgICAgICAgICAgIC4uLmJpbmRhYmxlUHJvcGVydGllczogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+W11cbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHkgPSB7fTtcbiAgICAgICAgICAgICAgICBiaW5kYWJsZVByb3BlcnRpZXMuZm9yRWFjaCh0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5LCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnB1c2godGhpcy5nZW5UZWFyZG93bkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvdGVjdGVkIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5KGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGJQLmlkLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoYlApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJQLmlkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKDxhbnk+YlApLmlkW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRpbmdNb2RlOiAoPGFueT5iUCkuYmluZGluZ01vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICg8YW55PmJQKS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRnVuYzogKDxhbnk+YlApLnNldERhdGFGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldERhdGFGdW5jOiAoPGFueT5iUCkuZ2V0RGF0YUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VGdW5jOiAoPGFueT5iUCkub25DaGFuZ2VGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlckZ1bmM6ICg8YW55PmJQKS5jb252ZXJ0ZXJGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbFJlZjogKDxhbnk+YlApLnZpZXdNb2RlbFJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGFuZ2VFdmVudHM6ICg8YW55PmJQKS5jaGFuZ2VFdmVudHNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFjY2VwdGFibGUgaWQgZGV0ZWN0ZWQgaW4gSVZpZXdNb2RlbFByb3BlcnR5QmFzZTogJHtiUH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBsZXQgYmluZGFibGVQcm9wZXJ0eUlkOiBzdHJpbmcgPSA8c3RyaW5nPmJQLmlkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGFuZCBhdHRhY2ggYmluZGFibGUgcHJvcGVydGllcyB0aGF0IGRvIG5vdCBoYXZlIGEgT25lVGltZSBiaW5kaW5nTW9kZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IE9uZVRpbWUgYmluZGluZ01vZGUgcHJvcGVydGllcyBhcmUgbm90IHN0b3JlZC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJpbmRpbmdNb2RlICE9PSBCaW5kaW5nTW9kZS5PbmVUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiUC52aWV3TW9kZWxSZWYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtiaW5kYWJsZVByb3BlcnR5SWRdID0gYlA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGlzIHNldCBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKChiUC52YWx1ZSAhPT0gdW5kZWZpbmVkKSB8fCAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVRpbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQXR0YWNoIG9uQ2hhbmdlIGV2ZW50IGhhbmRsZXIgZm9yIFR3b1dheSBhbmQgT25lV2F5UmVhZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLlR3b1dheSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBib3VuZGVkRnVuYyA9IChfZXYgOiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluOiAke2JpbmRhYmxlUHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVByb3BlcnR5Q2hhbmdlZEV2ZW50KGJpbmRhYmxlUHJvcGVydHlJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPCgodm06IFZpZXdNb2RlbCkgPT4gdm9pZCk+KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMpKDxWaWV3TW9kZWw+YlAudmlld01vZGVsUmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoPGFueT5iUC52aWV3TW9kZWxSZWYpLm9uQ2hhbmdlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmJQLnZpZXdNb2RlbFJlZikub25DaGFuZ2UoYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcHJvdmlkZSBvbkNoYW5nZUZ1bmMgKGFsdGVybmF0aXZlbHkgaW1wbGVtZW50IG9uQ2hhbmdlIFsoaHRtbElkOiBzdHJpbmcpID0+IHZvaWRdIG1ldGhvZCkgZm9yIGltcGxlbnRhdGlvbiBvZiBJVmlld01vZGVsUHJvcGVydHkgZm9yIGlkOiAnICsgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgKChiUC5jaGFuZ2VFdmVudHMgPT0gbnVsbCkgPyBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzIDogYlAuY2hhbmdlRXZlbnRzKS5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiUC5pZC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJvdW5kRXZlbnRGdW5jID0gYm91bmRlZEZ1bmM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJpbmRhYmxlUHJvcGVydHlJZCkpLmFkZEV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBBcnJheTpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiUC5ib3VuZEV2ZW50RnVuY3MgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJvdW5kRXZlbnRGdW5jcyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jcy5wdXNoKGJvdW5kZWRGdW5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmluZGFibGVQcm9wZXJ0eUlkKSkuYWRkRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jc1s8bnVtYmVyPigoPGFueT5iUCkuYm91bmRFdmVudEZ1bmNzKS5sZW5ndGggLSAxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWNjZXB0YWJsZSBpZCBkZXRlY3RlZCBpbiBJVmlld01vZGVsUHJvcGVydHlCYXNlOiAke2JQfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRyaWdnZXJzIGNoYW5nZSBpbiBVSSB0byBtYXRjaCB2YWx1ZSBvZiBwcm9wZXJ0eSBpbiBpZFRvQmluZGFibGVQcm9wZXJ0eS5cbiAgICAgICAgICAgIHByb3RlY3RlZCBoYW5kbGVQcm9wZXJ0eUNoYW5nZWRFdmVudChwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmluZGFibGVQcm9wZXJ0eSA9IHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHlbcHJvcGVydHlJZF07XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYmluZGFibGVQcm9wZXJ0eS5iaW5kaW5nTW9kZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjYXNlIEJpbmRpbmdNb2RlLk9uZVRpbWU6XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmVycm9yKFwiSU1QT1NTSUJMRVwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwucmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZTpcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5zZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVdyaXRlQmluZGluZzxWaWV3TW9kZWw+PmJpbmRhYmxlUHJvcGVydHksIHByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuVHdvV2F5OlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxWaWV3TW9kZWw+PmJpbmRhYmxlUHJvcGVydHksIHByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYEludmFsaWQgYmluZGluZ01vZGUgZm9yIEJpbmRpbmcgUHJvcGVydHkgYXNzb2NpYXRlZCB3aXRoIGlkOiAke3Byb3BlcnR5SWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblRlYXJkb3duRnVuYyhzZWxmOiBWaWV3TW9kZWwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge3NlbGYudGVhcmRvd24uY2FsbChzZWxmKTt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZWFyZG93bihvdmVycmlkZU9iamVjdExpZmVDeWNsZTpib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlICYmXG4gICAgICAgICAgICAgICAgICAgICFvdmVycmlkZU9iamVjdExpZmVDeWNsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gdGVhcmRvd24gRnJvbnRFbmRGcmFtZXdvcmsuTWluaUh0bWxWaWV3TW9kZWwuVmlld01vZGVsIGluc3RhbmNlIGR1ZSB0byBvYmplY3RMaWZlQ3ljbGUgbm90IGJlaW5nIG92ZXJyaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHkpLmZvckVhY2goKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENsZWFuaW5nIHVwIGV2ZW50IGhhbmRsZXJzIHNldCB1cCBpbiBWaWV3TW9kZWwgKGlkOiAke2lkfSlgKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJQID0gdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtpZF07XG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYlAuaWQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChiUC5ib3VuZEV2ZW50RnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5DaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKS5yZW1vdmVFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYlAuYm91bmRFdmVudEZ1bmNzICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChiUC5ib3VuZEV2ZW50RnVuY3MuY29uc3RydWN0b3IgPT09IEFycmF5KSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYlAuYm91bmRFdmVudEZ1bmNzLmxlbmd0aCA9PT0gKDxzdHJpbmdbXT5iUC5pZCkubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaWR4ID0gKDxzdHJpbmdbXT5iUC5pZCkuaW5kZXhPZihpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKS5yZW1vdmVFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmNzW2lkeF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnRlcm5hbCBpbnZhcmlhbnQgdmlvbGF0ZWQgKGd1aWQ6IER0c2E0MzI1Mnh4cSknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludGVybmFsIGludmFyaWFudCB2aW9sYXRlZCAoZ3VpZDogcHRhNDIzdGFEVEQpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFjY2VwdGFibGUgaWQgZGV0ZWN0ZWQgaW4gSVZpZXdNb2RlbFByb3BlcnR5QmFzZTogJHtiUH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgc3RhdGljIHJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+KGJQOiBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiwgcHJvcGVydHlJZDogc3RyaW5nKTogSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4ge1xuICAgICAgICAgICAgICAgIGlmIChiUC5nZXREYXRhRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnZhbHVlID0gYlAuZ2V0RGF0YUZ1bmMoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiUC52YWx1ZSA9ICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcm9wZXJ0eUlkKSkudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBiUDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+KGJQOiBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNudnJ0ciA9IGJQLmNvbnZlcnRlckZ1bmMgfHwgZnVuY3Rpb24oeCkgeyByZXR1cm4geDsgfTtcbiAgICAgICAgICAgICAgICBpZiAoYlAuc2V0RGF0YUZ1bmMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdIbmRsLiQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJCgnIycgKyBwcm9wZXJ0eUlkKS52YWwoYlAudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByb3BlcnR5SWQpKS52YWx1ZSA9IGNudnJ0cihiUC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKSgnIycgKyBwcm9wZXJ0eUlkKS52YWwoYlAudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYlAuc2V0RGF0YUZ1bmMoY252cnRyKGJQLnZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUsXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFQsXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYW5nZUV2ZW50cz86IHN0cmluZ1xuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVUaW1lID0gPEJpbmRpbmdNb2RlLk9uZVRpbWU+QmluZGluZ01vZGUuT25lVGltZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVCxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY2hhbmdlRXZlbnRzPzogc3RyaW5nXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQgPSA8QmluZGluZ01vZGUuT25lV2F5UmVhZD5CaW5kaW5nTW9kZS5PbmVXYXlSZWFkO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFQsXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYW5nZUV2ZW50cz86IHN0cmluZ1xuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVdyaXRlQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBpbXBsZW1lbnRzIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVdyaXRlQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlID0gPEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlPkJpbmRpbmdNb2RlLk9uZVdheVdyaXRlO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBULFxuICAgICAgICAgICAgICAgIHB1YmxpYyBjaGFuZ2VFdmVudHM/OiBzdHJpbmdcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheSA9IDxCaW5kaW5nTW9kZS5Ud29XYXk+QmluZGluZ01vZGUuVHdvV2F5O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFQsXG4gICAgICAgICAgICAgICAgcHVibGljIGNoYW5nZUV2ZW50cz86IHN0cmluZ1xuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG5cbi8vIFJlbGllcyBvbiAuL2Jhc2UuanMudHMgYmVjYXVzZSB0aGlzIGxpYnJhcnkgc2hvdWxkIGJlIGFibGUgdG8gdGFrZSBhZHZhbnRhZ2Ugb2YgVHVyYm9saW5rcyBub3QgcmVsb2FkaW5nIHBhZ2UuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBTdG9yYWdlIHtcbiAgICAgICAgZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnMC4xLjAnO1xuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiB7IFRyYW5zaWVudCwgU2Vzc2lvbiwgQWNyb3NzU2Vzc2lvbnMgfVxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlPzogYm9vbGVhbjtcbiAgICAgICAgICAgIGV4cGlyeURhdGU/OiBEYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGV4dGVuZHMgSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIHtcbiAgICAgICAgICAgIGluZGVmaW5pdGU/OiBib29sZWFuOyAvLyBNVVNUIEJFIGBmYWxzZWBcbiAgICAgICAgICAgIGV4cGlyeURhdGU6IERhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiBleHRlbmRzIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlOiBib29sZWFuOyAvLyBNVVNUIEJFIGB0cnVlYFxuICAgICAgICAgICAgZXhwaXJ5RGF0ZT86IERhdGU7IC8vICBJR05PUkVEXG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUV4cGlyaW5nQ2FjaGVEdXJhdGlvbiB7XG4gICAgICAgICAgICBwdWJsaWMgaW5kZWZpbml0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3RydWN0b3IocHVibGljIGV4cGlyeURhdGU6IERhdGUpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIEluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIHtcbiAgICAgICAgICAgIHB1YmxpYyBpbmRlZmluaXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGlzIG5lZWRlZCBmb3IgYnJvd3NlcnMgdGhhdCBzYXkgdGhhdCB0aGV5IGhhdmUgU2Vzc2lvblN0b3JhZ2UgYnV0IGluIHJlYWxpdHkgdGhyb3cgYW4gRXJyb3IgYXMgc29vblxuICAgICAgICAvLyBhcyB5b3UgdHJ5IHRvIGRvIHNvbWV0aGluZy5cbiAgICAgICAgbGV0IGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndGVzdGE4OTBhODA5JywgJ3ZhbCcpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgndGVzdGE4OTBhODA5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8gTm90aGluZyB0byBkby4uLlxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydCBjb25zdCBJc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlID0gaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZTtcblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2VQcm9maWxlIHtcbiAgICAgICAgICAgIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbltdO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIENsaWVudFN0b3JhZ2VQcm9maWxlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZVByb2ZpbGUge1xuICAgICAgICAgICAgcHVibGljIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBBcnJheTxEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj47XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzID0gW0RhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudF07XG4gICAgICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlR1cmJvbGlua3NBdmFpbGFibGUgfHwgRnJvbnRFbmRGcmFtZXdvcmsuU3RvcmFnZS5Jc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzLnB1c2goRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgc2V0OiAoKGtleTphbnksIHZhbDphbnkpID0+IHZvaWQpO1xuICAgICAgICAgICAgZ2V0OiAoKGtleTphbnkpID0+IGFueSk7XG4gICAgICAgIH1cbiAgICAgICAgLypcbiAgICAgICAgZXhwb3J0IGNsYXNzIFRyYW5zaWVudFN0b3JhZ2UgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXQoa2V5OmFueSwgdmFsOmFueSkgOiB2b2lkID0+IHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0KGtleTphbnkpIDogYW55ID0+IHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICBleHBvcnQgY2xhc3MgQ2xpZW50U3RvcmFnZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgcHVibGljIGNsaWVudFByb2ZpbGUgPSBuZXcgQ2xpZW50U3RvcmFnZVByb2ZpbGUoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHByaXZhdGUgZXJyb3JPbkZhaWwgPSBmYWxzZVxuICAgICAgICAgICAgKSB7IH1cblxuICAgICAgICAgICAgcHVibGljIHNldChrZXk6IGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsOiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uID0gRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24/OiBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdXBvbiBhZGRpbmcgc3VwcG9ydCBmb3IgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24gaWdub3JlZCBpbiBEYXRhYmFzZSNzZXQuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JPbkZhaWwpIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KGtleTogYW55LCBkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj86IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uKSA6IGFueXxudWxsfHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnM6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lcnJvck9uRmFpbCkgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBmb3JjZUNhY2hlRXhwaXJ5KGtleTogYW55KSB7IGNvbnNvbGUuZXJyb3IoYFVuaW1wbGVtZW50ZWQgRGF0YWJhc2UjZm9yY2VDYWNoZUV4cGlyeTogRmFpbGVkIHRvIGV4cGlyZSBrZXk6ICR7a2V5fWApOyB0aHJvdyBrZXk7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdG9yYWdlLmpzLnRzXCIvPlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIC8vIFZpc2l0cyBzaXRlIHVzaW5nIFR1cmJvbGlua3MgKG9yIGFub3RoZXIgU1BBIGZyYW1ld29yayB3aGVuIHN1cHBvcnQgaXMgYWRkZWQpIGlmIHBvc3NpYmxlLlxuICAgIC8vIFNob3VsZCBhbHdheXMgcmVzdWx0IGluIG9wZW5pbmcgZ2l2ZW4gbGluayAoaWYgZ2l2ZW4gYXJndW1lbnQgZm9yIGBsaW5rYCBpcyB2YWxpZCBVUkwpLlxuICAgIGV4cG9ydCBsZXQgdmlzaXRMaW5rID0gZnVuY3Rpb24obGluayA6IHN0cmluZywge2ZvcmNlUmVsb2FkLCBuZXdUYWJ9OiB7Zm9yY2VSZWxvYWQ/OiBib29sZWFuLCBuZXdUYWI/OiBib29sZWFufSA9IHtmb3JjZVJlbG9hZDogZmFsc2UsIG5ld1RhYjogZmFsc2V9KSB7XG4gICAgICAgIGlmICgobmV3VGFiICE9IG51bGwpICYmIDxib29sZWFuPm5ld1RhYikge1xuICAgICAgICAgICAgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmICEoKGZvcmNlUmVsb2FkICE9IG51bGwpICYmIDxib29sZWFuPmZvcmNlUmVsb2FkKSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICAgICAgICAgIGlmICgoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID09PVxuICAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rcykgJiZcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZihUdXJib2xpbmtzLnZpc2l0KSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgVHVyYm9saW5rcy52aXNpdChsaW5rKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbGluaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgY2xlYW51cEZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIC8vIE9ubHkgZXhlY3V0ZSBpbiBzaW5nbGUgcGFnZSBhcHBsaWNhdGlvbnMgKGluIG90aGVyIGNhc2UsIHBhZ2Ugd291bGQgYmUgcmVzZXQgYW55d2F5cylcbiAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwSG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBjbGVhbnVwSG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHByZVJlYWR5RnVuYyA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVSZWFkeUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cnkgeyBwcmVSZWFkeUhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBwb3N0UmVhZHlGdW5jID0gKCkgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvc3RSZWFkeUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cnkgeyBwb3N0UmVhZHlIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uID0ge307XG4gICAgfTtcblxuICAgIGV4cG9ydCBuYW1lc3BhY2UgUHViU3ViIHtcbiAgICAgICAgaW50ZXJmYWNlIFB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm8gZXh0ZW5kcyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHN1YnNjcmliZXJJZGVudGlmaWVyOiBzdHJpbmc7XG4gICAgICAgICAgICBzdWJzY3JpYmVyU2V0dGVyOiAoKG1lc3NhZ2U6YW55KSA9PiB2b2lkKXxudWxsfHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXkgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHB1YmxpYyBzdGF0aWMgRGVmYXVsdE9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQ7XG4gICAgICAgICAgICBwdWJsaWMgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjogc3RyaW5nO1xuICAgICAgICAgICAgcHJpdmF0ZSBwdWJTdWJSZWxheVN1YnNjcmliZXJzOiBQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvW10gPSBbXTtcbiAgICAgICAgICAgIHByaXZhdGUgbGFzdFNlbnRNZXNzYWdlOiBhbnk7IC8vIFRvIGJlIHJlLWJyb2FkY2FzdCBhZnRlciBuYXZpZ2F0aW5nIHBhZ2VzXG4gICAgICAgICAgICBwcml2YXRlIGZpcnN0TWVzc2FnZVNlbnRQOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyID0gc3Vic2NyaXB0aW9uSWRlbnRpZmllcjtcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IFB1YlN1YlJlbGF5LkRlZmF1bHRPYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBhZGRTdWJzY3JpYmVyKHN1YnNjcmliZXJJbmZvOlB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm8pIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoPG51bWJlcj50aGlzLm9iamVjdExpZmVDeWNsZSkgPCAoPG51bWJlcj5zdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IHN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV0uc3Vic2NyaWJlcklkZW50aWZpZXIgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVySW5mby5zdWJzY3JpYmVySWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW5ub3Qgc3Vic2NyaWJlIG1vcmUgdGhhbiBvbmNlIHRvICgke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn0pIHdpdGggKCR7c3Vic2NyaWJlckluZm8uc3Vic2NyaWJlcklkZW50aWZpZXJ9KS5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXJJbmZvKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHJlbGF5TWVzc2FnZShzZW5kaW5nU3Vic2NyaWJlcklkZW50aWZpZXI6c3RyaW5nLCBtZXNzYWdlOmFueSkge1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBSZWxheWluZyBtZXNzYWdlIGZyb20gUHViU3ViUmVsYXkjcmVsYXlNZXNzYWdlIGZvciBzdWJzY3JpcHRpb246ICR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfX1gKVxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFNlbnRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0TWVzc2FnZVNlbnRQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVsZXZhbnRTdWJzY3JpYmVyID0gdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUHJpbnRpbmcgJHtpfS10aCByZWxldmFudFN1YnNjcmliZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8ocmVsZXZhbnRTdWJzY3JpYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllciAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRpbmdTdWJzY3JpYmVySWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZXMgdGhhdCBhIHRyaWdnZXIgY2hhbmdlIGV2ZW50IHNob3VsZCBub3QgYmUgZmlyZWQgb24gc2V0dGluZyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHN1YnNjcmliZXJTZXR0ZXIgYXJnIHdoZW4gc3Vic2NyaWJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgU2V0dGluZyB2YWx1ZSAoJHttZXNzYWdlfSkgZm9yICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfSBpZC5gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1zT2ZJbnRlcmVzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgZWxlbXNPZkludGVyZXN0Lmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgU29tZXRoaW5nIHByb2JhYmx5IGlzIG5vdCBnb2luZyB0byB3b3JrIGFzIHBsYW5uZWQgaW4gc2V0dGluZyB2YWx1ZXMgKCR7bWVzc2FnZX0pIGZvciBlbGVtZW50IHdpdGggaWQ6ICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbXNPZkludGVyZXN0W3hdKS52YWx1ZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZmlyc3RNZXNzYWdlU2VudFApIHJldHVybjtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUmVsYXlpbmcgbWVzc2FnZSBmcm9tIFB1YlN1YlJlbGF5I3JlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlIGZvciBzdWJzY3JpcHRpb246ICR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfX1gKVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWxldmFudFN1YnNjcmliZXIgPSB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZihyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcih0aGlzLmxhc3RTZW50TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZXMgdGhhdCBhIHRyaWdnZXIgY2hhbmdlIGV2ZW50IHNob3VsZCBub3QgYmUgZmlyZWQgb24gc2V0dGluZyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugc3Vic2NyaWJlclNldHRlciBhcmcgd2hlbiBzdWJzY3JpYmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYFNldHRpbmcgdmFsdWUgKCR7dGhpcy5sYXN0U2VudE1lc3NhZ2V9KSBmb3IgJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9IGlkLmApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwodGhpcy5sYXN0U2VudE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbXNPZkludGVyZXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGVsZW1zT2ZJbnRlcmVzdC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFNlbnRNZXNzYWdlLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgU29tZXRoaW5nIHByb2JhYmx5IGlzIG5vdCBnb2luZyB0byB3b3JrIGFzIHBsYW5uZWQgaW4gc2V0dGluZyB2YWx1ZXMgKCR7dGhpcy5sYXN0U2VudE1lc3NhZ2V9KSBmb3IgZWxlbWVudCB3aXRoIGlkOiAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5lbGVtc09mSW50ZXJlc3RbeF0pLnZhbHVlID0gdGhpcy5sYXN0U2VudE1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbCh0aGlzLmxhc3RTZW50TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIFNob3J0LWNpcmN1aXQgaWYgaXRlbSB3aWxsIGJlIFB1YlN1YlJlbGF5IGl0c2VsZiB3aWxsIGJlIGRlc3Ryb3llZCBhbnl3YXlzXG5cbiAgICAgICAgICAgICAgICBsZXQgdG9SZW1vdmUgOiBudW1iZXJbXSA9IFtdOyAvLyBpbmRpY2VzICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMpIG9mIHN1YnNjcmliZXJzIHRvIHJlbW92ZVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXS5vYmplY3RMaWZlQ3ljbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlICh0b1JlbW92ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLnNwbGljZSg8bnVtYmVyPnRvUmVtb3ZlLnBvcCgpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheVN0b3JhZ2UgaW1wbGVtZW50cyBTdG9yYWdlLklLZXlWYWx1ZVN0b3JhZ2UsIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgLy8gVE9ETzogQWxsb3cgdGhlIFB1YlN1YlJlbGF5U3RvcmFnZSB0byBoYXZlIGEgdHJhbnNpZW50IG9iamVjdCBsaWZlIGN5Y2xlXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwcml2YXRlIG1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXM6IGFueTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5fG51bGx8dW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgc2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLCBwdWJTdWJSZWxheTogUHViU3ViUmVsYXkpIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdID0gcHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBrZXlzVG9EZWxldGUgOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cykuZm9yRWFjaCgoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5SW5zdGFuY2UgPSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl07XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5SW5zdGFuY2UuaGFuZGxlTmF2aWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwdWJTdWJSZWxheUluc3RhbmNlLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHB1YlN1YlJlbGF5SW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNUb0RlbGV0ZS5wdXNoKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c1RvRGVsZXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNba2V5c1RvRGVsZXRlW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCkgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMpLmZvckVhY2goKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXS5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXlNYW5hZ2VyIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEFsbG93IHRoZSBQdWJTdWJSZWxheU1hbmFnZXIgdG8gaGF2ZSBhIHRyYW5zaWVudCBvYmplY3QgbGlmZSBjeWNsZVxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHJpdmF0ZSBwdWJTdWJSZWxheVN0b3JhZ2U6IFB1YlN1YlJlbGF5U3RvcmFnZSA9IG5ldyBQdWJTdWJSZWxheVN0b3JhZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5jbGVhbnVwSG9va3MpLnB1c2godGhpcy5nZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+cG9zdFJlYWR5SG9va3MpLnB1c2godGhpcy5nZW5SZWJyb2FkY2FzdExhc3RNZXNzYWdlc0Z1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5oYW5kbGVOYXZpZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlcygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5yZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmMoc2VsZjogUHViU3ViUmVsYXlNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuaGFuZGxlTmF2aWdhdGlvbi5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblJlYnJvYWRjYXN0TGFzdE1lc3NhZ2VzRnVuYyhzZWxmOiBQdWJTdWJSZWxheU1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZXMuYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBzZWxmSWRlbnRpZmllcjpzdHJpbmcsIC8vIHNob3VsZCBiZSBhIENTUyBzZWxlY3RvciAoSlF1ZXJ5IHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIHNlbGZTZXR0ZXI6KChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2VlIGlmIGdpdmVuIGBvYmplY3RMaWZlQ3ljbGVgIGlzIGdyZWF0ZXIgdGhhbiBkZXNpZ25hdGVkIG9iamVjdExpZmVDeWNsZSxcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcywgY2hhbmdlIGhvdyBpdCBpcyBtYW5hZ2VkIChub3QgcmVsZXZhbnQgdW50aWwgb2JqZWN0IGxpZmUgY3ljbGUgb3RoZXJcbiAgICAgICAgICAgICAgICAvLyB0aGFuIEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlIGlzIHN1cHBvcnRlZCkuXG5cbiAgICAgICAgICAgICAgICAoPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5KS5hZGRTdWJzY3JpYmVyKHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcklkZW50aWZpZXI6IHNlbGZJZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyU2V0dGVyOiBzZWxmU2V0dGVyLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlUHVibGlzaGVkTWVzc2FnZShcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOmFueVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5LnJlbGF5TWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBoYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5IHtcbiAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXkgOiBQdWJTdWJSZWxheXxudWxsfHVuZGVmaW5lZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHB1YiBzdWIgcmVsYXkgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgICAgICAgICAgICAgICBpZiAoKHB1YlN1YlJlbGF5ID0gdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UuZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5ID0gbmV3IFB1YlN1YlJlbGF5KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5zZXQoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiA8UHViU3ViUmVsYXk+cHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbnRlcm5hbCBsaWJyYXJ5IHN0YXRlXG4gICAgICAgIC8vIFRPRE86IE1hbmFnZSBpbnRlcm5hbCBsaWJyYXJ5IHN0YXRlIHdpdGhvdXQgdXNpbmcgZ2xvYmFsc1xuICAgICAgICBsZXQgcHViU3ViUmVsYXlNYW5hZ2VyIDogUHViU3ViUmVsYXlNYW5hZ2VyID0gbmV3IFB1YlN1YlJlbGF5TWFuYWdlcigpOztcblxuICAgICAgICAvLyBUcmVhdCB0aGUgZmlyc3QgdHdvIGFyZ3VtZW50cyB0byB0aGlzIGZ1bmN0aW9uIGFzIGJlaW5nIG1vcmUgYSBwYXJ0IG9mIGEgc3RhYmxlXG4gICAgICAgIC8vIEFQSSB2cyB0aGUgdGhlIHRoaXJkIGFuZCBmb3VydGggYXJndW1lbnRzIHdoaWNoIGFyZSBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgZXhwb3J0IGxldCBzdWJzY3JpYmUgPSAoXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgIHNlbGZJZGVudGlmaWVyOnN0cmluZywgLy8gc2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yIChKUXVlcnkgc2VsZWN0b3IpIHVubGVzcyBwcm92aWRpbmcgYHNlbGZTZXR0ZXJgIGFyZ3VtZW50XG4gICAgICAgICAgICBzZWxmU2V0dGVyOigobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICApIDogYW55fHZvaWQgPT4ge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oXCJQcmludGluZyBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIuc3Vic2NyaWJlIGFyZ3NcIik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZJZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZTZXR0ZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8ob2JqZWN0TGlmZUN5Y2xlKTtcbiAgICAgICAgICAgIHB1YlN1YlJlbGF5TWFuYWdlci5oYW5kbGVTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgc2VsZklkZW50aWZpZXIsIHNlbGZTZXR0ZXIsIG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBsZXQgcHVibGlzaCA9IChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZywgbWVzc2FnZTphbnkpID0+IHtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiUHJpbnRpbmcgRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLnB1Ymxpc2ggYXJnc1wiKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8obWVzc2FnZSk7XG4gICAgICAgICAgICBwdWJTdWJSZWxheU1hbmFnZXIuaGFuZGxlUHVibGlzaGVkTWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzYWdlOiBEdXJpbmcgaW5pdGlhbGl6YXRpb24gc3Vic2NyaWJlIGJlZm9yZSBwb3N0LWhvb2tzIChwcmVmZXJhYmx5IHByZS1ob29rcykgYW5kIHB1Ymxpc2ggaW4gcG9zdC1ob29rcy5cblxuICAgICAgICAvLyBBc3N1bWVkIHRvIGJlIGNvbnN0cnVjdGVkIGluIHByZS1ob29rXG4gICAgICAgIGV4cG9ydCBjbGFzcyBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFN1cHBvcnQgb3RoZXIgb2JqZWN0IGxpZmUgY3ljbGVzXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwdWJsaWMgc3RvcmFnZUtleTogc3RyaW5nO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUtleTpzdHJpbmcsXG4gICAgICAgICAgICAgICAgcHVibGlzaEV4aXN0aW5nU3RvcmVkVmFsdWU6Ym9vbGVhbiA9IHRydWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZUtleSA9IHN0b3JhZ2VLZXk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTaG9ydC1DaXJjdWl0IGlmIHNlc3Npb24gc3RvcmFnZSBub3QgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgaWYgKCFTdG9yYWdlLklzU2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FiYW5kb25pbmcgUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyIGluaXRpYWxpemF0aW9uIHNpbmNlIHNlc3Npb24gc3RvcmFnZSBpcyBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICBsZXQgaW5pdGlhbFN0b3JlZFZhbHVlID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsU3RvcmVkVmFsdWUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoRXhpc3RpbmdTdG9yZWRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgaG9va3MucG9zdC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgaW5pdGlhbFN0b3JlZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmModmFsOmFueSkge1xuICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0odGhpcy5zdG9yYWdlS2V5LCB2YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyhzZWxmOiBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKG1lc3NhZ2U6YW55KSA9PiB7c2VsZi5zdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jLmNhbGwoc2VsZiwgbWVzc2FnZSk7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1lZCB0byBiZSBjb25zdHJ1Y3RlZCBpbiBwcmUtaG9va1xuICAgICAgICBleHBvcnQgY2xhc3MgSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBzdWJzY3JpcHRpb25JZGVudGlmaWVyIDogc3RyaW5nO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBodG1sSWQgOiBzdHJpbmc7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb25DaGFuZ2VGdW5jIDogKCgpID0+IHZvaWQpfG51bGw7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgcHVibGlzaFZhbHVlUHJlZGljYXRlIDogYm9vbGVhbjtcbiAgICAgICAgICAgIHByaXZhdGUgX3B1Ymxpc2hPbkNoYW5nZUZ1bmM/OiAoKGV2OiBFdmVudCkgPT4gdm9pZCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBodG1sSWQ6c3RyaW5nLFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlRnVuYzooKCkgPT4gdm9pZCl8bnVsbCA9IG51bGwsXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCxcbiAgICAgICAgICAgICAgICBwdWJsaXNoVmFsdWVQcmVkaWNhdGU6Ym9vbGVhbiA9IGZhbHNlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIgPSBzdWJzY3JpcHRpb25JZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbElkID0gaHRtbElkO1xuICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jID0gb25DaGFuZ2VGdW5jO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaFZhbHVlUHJlZGljYXRlID0gcHVibGlzaFZhbHVlUHJlZGljYXRlO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCB2YWx1ZSB3aGVuIGFwcHJvcHJpYXRlXG4gICAgICAgICAgICAgICAgaWYgKHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZSAmJlxuICAgICAgICAgICAgICAgICAgICAoKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzLnBvc3QucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTdWJzY3JpYmVcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIGAjJHtodG1sSWR9YCxcbiAgICAgICAgICAgICAgICAgICAgKG1lc3NhZ2U6YW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdIbmRsLiQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQoYCMke2h0bWxJZH1gKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1zT2ZJbnRlcmVzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCMke2h0bWxJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGVsZW1zT2ZJbnRlcmVzdC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbXNPZkludGVyZXN0W3hdKS52YWx1ZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShgIyR7aHRtbElkfWApLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25DaGFuZ2VGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT50aGlzLm9uQ2hhbmdlRnVuYykoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jID0gKChfZXY6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5odG1sSWQpKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluICgke2h0bWxJZH0pOiAkeyg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZX1gKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuICAgICAgICAgICAgICAgICAgICB9IC8vIGVsc2UgeyBjb25zb2xlLmluZm8oJ0RpZCBub3QgZmlyZSBudWxsIG9uQ2hhbmdlRnVuYycpIH1cbiAgICAgICAgICAgICAgICB9KS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCBvbiBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS5hZGRFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPCgoZXY6IEV2ZW50KSA9PiB2b2lkKT50aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jKSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgICAgIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5wdXNoKHRoaXMuZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyhzZWxmOiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyaWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi5oYW5kbGVOYXZpZ2F0aW9uLmNhbGwoc2VsZik7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZWFyZG93bihvdmVycmlkZU9iamVjdExpZmVDeWNsZTpib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlICYmXG4gICAgICAgICAgICAgICAgICAgICFvdmVycmlkZU9iamVjdExpZmVDeWNsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gdGVhcmRvd24gRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLkh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JiZXIgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENsZWFuaW5nIHVwIGV2ZW50IGhhbmRsZXJzIHNldCB1cCBpbiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyYmVyIChpZDogJHt0aGlzLmh0bWxJZH0pYCk7XG4gICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQoJyMnICsgdGhpcy5odG1sSWQpLm9mZihGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHMpO1xuICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLmh0bWxJZCkgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5odG1sSWQpKS5yZW1vdmVFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPCgoZXY6IEV2ZW50KSA9PiB2b2lkKT50aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBSRUFEWV9GVU5DID0gKCkgPT4ge1xuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wcmUgQXJyYXlcbiAgICAgICAgd2hpbGUgKGhvb2tzLnByZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT5ob29rcy5wcmUuc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHsgcHJlUmVhZHlGdW5jKCk7IH1cbiAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG5cbiAgICAgICAgaWYgKChGcm9udEVuZEZyYW1ld29yay5yZWFkeUZ1bmMgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICh0eXBlb2YoRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7IHBvc3RSZWFkeUZ1bmMoKTsgfVxuICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cblxuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wb3N0IEFycmF5XG4gICAgICAgIHdoaWxlIChob29rcy5wb3N0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPmhvb2tzLnBvc3Quc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHN3aXRjaCAoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uKSB7XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rczpcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6bG9hZCcsIFJFQURZX0ZVTkMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uTm9GcmFtZXdvcms6XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uV2luZG93c1VXUDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBSRUFEWV9GVU5DKTtcbiAgICB9XG5cbiAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID09PSBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5UdXJib2xpbmtzICYmXG4gICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5UdXJib2xpbmtzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInLCBjbGVhbnVwRnVuYyk7XG4gICAgICAgICAgICBpZiAoaG9va3MucGFnZUNsZWFudXAgIT0gbnVsbClcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucGFnZUNsZWFudXAgQXJyYXlcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPig8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKChjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyAhPSBudWxsKSAmJiAodHlwZW9mKGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jKSA9PT0gJ2Z1bmN0aW9uJykpXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczp2aXNpdCcsIGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vPSByZXF1aXJlIC4vYmFzZVxuLy89IHJlcXVpcmUgLi9zY3JlZW5fcmVzb2x1dGlvbnNcbi8vPSByZXF1aXJlIC4vbWluaV9odG1sX3ZpZXdfbW9kZWxcbi8vPSByZXF1aXJlIC4vc3RvcmFnZVxuLy89IHJlcXVpcmUgLi9jb3JlXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zY3JlZW5fcmVzb2x1dGlvbnMuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9taW5pX2h0bWxfdmlld19tb2RlbC5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3N0b3JhZ2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9jb3JlLmpzLnRzXCIvPlxuXG4vLyBOb3RlIHRoYXQgdGhlIGFib3ZlIHJlZmVyZW5jZXMgZG8gbm90IHdvcmsgaWYgeW91IGhhdmUgdGhlIFR5cGVTY3JpcHQgY29tcGlsZXIgc2V0IHRvIHJlbW92ZSBjb21tZW50cy5cbi8vIFVzZSBzb21ldGhpbmcgbGlrZSB0aGUgdWdsaWZpZXIgZ2VtIGZvciByZW1vdmluZyBjb21tZW50cy9vYmZ1c2NhdGlvbi5cblxuLy8gVGhlIGxvYWQgb3JkZXIgY3VycmVudGx5IG1hdHRlcnMuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7IGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuNi4xMyc7IH1cbiJdfQ==