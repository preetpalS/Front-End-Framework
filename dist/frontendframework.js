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
        MiniHtmlViewModel.VERSION = '0.6.1';
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
                                viewModelRef: bP.viewModelRef
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
                        ViewModel.ChangeEvents.split(' ').forEach(function (evString) {
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
            converterFunc, viewModelRef) {
                this.bindingMode = bindingMode;
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
            }
            return ViewModelProperty;
        }());
        MiniHtmlViewModel.ViewModelProperty = ViewModelProperty;
        var ViewModelPropertyOneTimeBinding = /** @class */ (function () {
            function ViewModelPropertyOneTimeBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, converterFunc, viewModelRef) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.bindingMode = 0 /* OneTime */;
            }
            return ViewModelPropertyOneTimeBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneTimeBinding = ViewModelPropertyOneTimeBinding;
        var ViewModelPropertyOneWayReadBinding = /** @class */ (function () {
            function ViewModelPropertyOneWayReadBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
            viewModelRef) {
                this.id = id;
                this.value = value;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.viewModelRef = viewModelRef;
                this.bindingMode = 1 /* OneWayRead */;
            }
            return ViewModelPropertyOneWayReadBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneWayReadBinding = ViewModelPropertyOneWayReadBinding;
        var ViewModelPropertyOneWayWriteBinding = /** @class */ (function () {
            function ViewModelPropertyOneWayWriteBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, converterFunc, viewModelRef) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
                this.bindingMode = 2 /* OneWayWrite */;
            }
            return ViewModelPropertyOneWayWriteBinding;
        }());
        MiniHtmlViewModel.ViewModelPropertyOneWayWriteBinding = ViewModelPropertyOneWayWriteBinding;
        var ViewModelPropertyTwoWayBinding = /** @class */ (function () {
            function ViewModelPropertyTwoWayBinding(id, // Represents HTML id
            value, // Represents displayed initial value
            setDataFunc, getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc, viewModelRef) {
                this.id = id;
                this.value = value;
                this.setDataFunc = setDataFunc;
                this.getDataFunc = getDataFunc;
                this.onChangeFunc = onChangeFunc;
                this.converterFunc = converterFunc;
                this.viewModelRef = viewModelRef;
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
    FrontEndFramework.VERSION = '0.6.11';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsK0ZBQStGO0FBQy9GLDhFQUE4RTtBQUk5RSxJQUFVLGlCQUFpQixDQXlFMUI7QUF6RUQsV0FBVSxpQkFBaUI7SUFxQlosdUJBQUssR0FBa0IsTUFBTSxDQUFDO0lBUXhDLENBQUM7SUFFVyx1Q0FBcUIsR0FBRyx3QkFBd0IsQ0FBQztJQVU3RCxDQUFDO0lBTUQsQ0FBQztJQUNGLG1EQUFtRDtJQUN0Qyx1Q0FBcUIsR0FBRyxDQUFDLE9BQU8sa0JBQUEsS0FBSyxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFBLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUM7SUFDMUYscUNBQW1CLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsRix1Q0FBcUIsR0FBRyxrQkFBQSxtQkFBbUIsQ0FBQztJQUU5Qyw2Q0FBMkIsc0JBQTBELENBQUM7SUFFakcsc0RBQXNEO0lBQ3RELEVBQUUsQ0FBQyxDQUFDLGtCQUFBLHFCQUFxQixDQUFDLENBQUMsQ0FBQztRQUN4QixrQkFBQSwyQkFBMkIscUJBQWtDLENBQUM7SUFDbEUsQ0FBQztJQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxrQkFBQSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7UUFDN0Isa0JBQUEsMkJBQTJCLHFCQUFrQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxtREFBbUQ7SUFDeEMsbUNBQWlCLEdBQWdCLGtCQUFBLG1CQUFtQixDQUFDLENBQUMsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRW5HLDhDQUE4QztJQUNuQywyQkFBUyxHQUF1QixJQUFJLENBQUM7SUFFaEQsK0ZBQStGO0lBQy9GLGtEQUFrRDtJQUN2Qyw4QkFBWSxHQUFvQixFQUFFLENBQUM7SUFDbkMsK0JBQWEsR0FBb0IsRUFBRSxDQUFDO0lBQ3BDLGdDQUFjLEdBQW9CLEVBQUUsQ0FBQztBQUNwRCxDQUFDLEVBekVTLGlCQUFpQixLQUFqQixpQkFBaUIsUUF5RTFCO0FDMUVELElBQVUsaUJBQWlCLENBa0IxQjtBQWxCRCxXQUFVLGlCQUFpQjtJQUMzQixJQUFpQixnQkFBZ0IsQ0FnQmhDO0lBaEJELFdBQWlCLGdCQUFnQjtRQVFsQixvQ0FBbUIsR0FBRztZQUM3QixNQUFNLENBQUM7Z0JBQ0gsZUFBZSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVztnQkFDMUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVTtnQkFDeEMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTTtnQkFDbEMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSzthQUNuQyxDQUFDO1FBQ04sQ0FBQyxDQUFBO0lBQ0wsQ0FBQyxFQWhCZ0IsZ0JBQWdCLEdBQWhCLGtDQUFnQixLQUFoQixrQ0FBZ0IsUUFnQmhDO0FBQ0QsQ0FBQyxFQWxCUyxpQkFBaUIsS0FBakIsaUJBQWlCLFFBa0IxQjtBQ3ZCRCxxQ0FBcUM7QUFFckMsb0JBQW9CO0FBQ3BCLDJHQUEyRztBQUMzRyxzQkFBc0I7QUFFdEIsSUFBVSxpQkFBaUIsQ0FtVDFCO0FBblRELFdBQVUsaUJBQWlCO0lBQ3ZCLElBQWlCLGlCQUFpQixDQWlUakM7SUFqVEQsV0FBaUIsaUJBQWlCO1FBQ2pCLHlCQUFPLEdBQUcsT0FBTyxDQUFDO1FBRTJDLENBQUM7UUErQzNFLHVFQUF1RTtRQUN2RTtZQUlJLG1CQUNJLGVBQWtEO2dCQUNsRCw0QkFBMEQ7cUJBQTFELFVBQTBELEVBQTFELHFCQUEwRCxFQUExRCxJQUEwRDtvQkFBMUQsMkNBQTBEOztnQkFFMUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7Z0JBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUM7Z0JBQy9CLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRS9ELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLHNCQUFnRDtvQkFDcEUsaUJBQWlCLENBQUMscUJBQXFCO29CQUN2QyxDQUFDLGtCQUFBLEtBQUssQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNiLGtCQUFBLEtBQUssQ0FBQyxXQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDekUsQ0FBQztZQUNMLENBQUM7WUFFUywyQ0FBdUIsR0FBakMsVUFBa0MsRUFBcUM7Z0JBQ25FLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztvQkFDNUIsS0FBSyxNQUFNO3dCQUNQLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDdkMsS0FBSyxDQUFDO29CQUNWLEtBQUssS0FBSzt3QkFDTixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQ3BDLElBQUksQ0FBQyw2QkFBNkIsQ0FBQztnQ0FDL0IsRUFBRSxFQUFRLEVBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dDQUNuQixXQUFXLEVBQVEsRUFBRyxDQUFDLFdBQVc7Z0NBQ2xDLEtBQUssRUFBUSxFQUFHLENBQUMsS0FBSztnQ0FDdEIsV0FBVyxFQUFRLEVBQUcsQ0FBQyxXQUFXO2dDQUNsQyxXQUFXLEVBQVEsRUFBRyxDQUFDLFdBQVc7Z0NBQ2xDLFlBQVksRUFBUSxFQUFHLENBQUMsWUFBWTtnQ0FDcEMsYUFBYSxFQUFRLEVBQUcsQ0FBQyxhQUFhO2dDQUN0QyxZQUFZLEVBQVEsRUFBRyxDQUFDLFlBQVk7NkJBQ0YsQ0FBQyxDQUFDO3dCQUM1QyxDQUFDO3dCQUNELEtBQUssQ0FBQztvQkFDVjt3QkFDSSxPQUFPLENBQUMsS0FBSyxDQUFDLHlEQUF1RCxFQUFJLENBQUMsQ0FBQzt3QkFDM0UsS0FBSyxDQUFDO2dCQUNWLENBQUM7WUFDTCxDQUFDO1lBRU8saURBQTZCLEdBQXJDLFVBQXNDLEVBQXFDO2dCQUEzRSxpQkFzREM7Z0JBckRHLElBQUksa0JBQWtCLEdBQW1CLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQy9DLElBQUksQ0FBQztvQkFDRCwrRUFBK0U7b0JBQy9FLDJEQUEyRDtvQkFDM0QsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsb0JBQXdCLENBQUMsQ0FBQyxDQUFDO3dCQUN6QyxFQUFFLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQzt3QkFDdkIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGtCQUFrQixDQUFDLEdBQUcsRUFBRSxDQUFDO29CQUN2RCxDQUFDO29CQUVELG9DQUFvQztvQkFDcEMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsb0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQ3ZFLFNBQVMsQ0FBQywyQkFBMkIsQ0FBd0MsRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBQ3pHLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osU0FBUyxDQUFDLHNDQUFzQyxDQUF3QyxFQUFFLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztvQkFDcEgsQ0FBQztvQkFFRCxzRUFBc0U7b0JBQ3RFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLG1CQUF1Qjt3QkFDckMsRUFBRSxDQUFDLFdBQVcsdUJBQTJCLENBQUMsQ0FBQyxDQUFDO3dCQUM1QyxJQUFJLGFBQVcsR0FBRyxVQUFDLEdBQVc7NEJBQzFCLE9BQU8sQ0FBQyxJQUFJLENBQUMseUJBQXVCLGtCQUFvQixDQUFDLENBQUM7NEJBQzFELEtBQUksQ0FBQywwQkFBMEIsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOzRCQUVwRCxFQUFFLENBQUMsQ0FBeUMsRUFBRyxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO2dDQUNDLEVBQUcsQ0FBQyxZQUFhLENBQVksRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDOzRCQUN0SCxDQUFDOzRCQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxPQUFhLEVBQUUsQ0FBQyxZQUFhLENBQUMsUUFBUSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0NBQ3pELEVBQUUsQ0FBQyxZQUFhLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7NEJBQ3hELENBQUM7NEJBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxxSkFBcUosR0FBRyxrQkFBa0IsQ0FBQyxDQUFDOzRCQUM5TCxDQUFDO3dCQUNMLENBQUMsQ0FBQzt3QkFDRixTQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxRQUFROzRCQUMvQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7Z0NBQ3hCLEtBQUssTUFBTTtvQ0FDUCxFQUFFLENBQUMsY0FBYyxHQUFHLGFBQVcsQ0FBQztvQ0FDbEIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBUSxFQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7b0NBQ2hILEtBQUssQ0FBQztnQ0FDVixLQUFLLEtBQUs7b0NBQ04sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dDQUM3QixFQUFFLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztvQ0FDNUIsQ0FBQztvQ0FDSyxFQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFXLENBQUMsQ0FBQztvQ0FDOUIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsQ0FBRSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBUSxFQUFHLENBQUMsZUFBZSxDQUFTLENBQU8sRUFBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO29DQUNqSyxLQUFLLENBQUM7Z0NBQ1Y7b0NBQ0ksT0FBTyxDQUFDLEtBQUssQ0FBQyx5REFBdUQsRUFBSSxDQUFDLENBQUM7b0NBQzNFLEtBQUssQ0FBQzs0QkFDZCxDQUFDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO29CQUNQLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxLQUFLLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLENBQUM7WUFDTCxDQUFDO1lBRUQsNEVBQTRFO1lBQ2xFLDhDQUEwQixHQUFwQyxVQUFxQyxVQUFrQjtnQkFDbkQsSUFBSSxDQUFDO29CQUNELElBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM3RCxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO3dCQUN2Qyw0QkFBNEI7d0JBQzVCLG1DQUFtQzt3QkFDbkMsYUFBYTt3QkFDYjs0QkFDSSxTQUFTLENBQUMsc0NBQXNDLENBQWlELGdCQUFnQixFQUFFLFVBQVUsQ0FBQyxDQUFDOzRCQUMvSCxLQUFLLENBQUM7d0JBQ1Y7NEJBQ0ksU0FBUyxDQUFDLDJCQUEyQixDQUFrRCxnQkFBZ0IsRUFBRSxVQUFVLENBQUMsQ0FBQzs0QkFDckgsS0FBSyxDQUFDO3dCQUNWOzRCQUNJLFNBQVMsQ0FBQywyQkFBMkIsQ0FBNkMsZ0JBQWdCLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBQ2hILEtBQUssQ0FBQzt3QkFDVjs0QkFDSSxPQUFPLENBQUMsSUFBSSxDQUFDLGtFQUFnRSxVQUFZLENBQUMsQ0FBQzs0QkFDM0YsS0FBSyxDQUFDO29CQUNWLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ25CLENBQUM7WUFDTCxDQUFDO1lBRU8sbUNBQWUsR0FBdkIsVUFBd0IsSUFBZTtnQkFDbkMsTUFBTSxDQUFDLGNBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQSxDQUFDLENBQUM7WUFDN0MsQ0FBQztZQUVELDRCQUFRLEdBQVIsVUFBUyx1QkFBdUM7Z0JBQWhELGlCQXdDQztnQkF4Q1Esd0NBQUEsRUFBQSwrQkFBdUM7Z0JBQzVDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLGdDQUEwRDtvQkFDOUUsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLENBQUM7b0JBQzNCLE9BQU8sQ0FBQyxLQUFLLENBQUMsdUhBQXVILENBQUMsQ0FBQztvQkFDdkksTUFBTSxDQUFDO2dCQUNYLENBQUM7Z0JBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxFQUFVO29CQUN0RCxPQUFPLENBQUMsR0FBRyxDQUFDLHlEQUF1RCxFQUFFLE1BQUcsQ0FBQyxDQUFDO29CQUMxRSxJQUFJLEVBQUUsR0FBRyxLQUFJLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ3ZDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDeEIsS0FBSyxNQUFNOzRCQUNQLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztnQ0FDNUIsU0FBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUTtvQ0FDakMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLEVBQVEsRUFBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dDQUN2RyxDQUFDLENBQUMsQ0FBQzs0QkFDUCxDQUFDOzRCQUNELEtBQUssQ0FBQzt3QkFDVixLQUFLLEtBQUs7NEJBQ04sRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQztnQ0FDNUIsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLFdBQVcsS0FBSyxLQUFLLENBQUM7Z0NBQzFDLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEtBQWdCLEVBQUUsQ0FBQyxFQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dDQUMzRCxJQUFJLEtBQUcsR0FBYyxFQUFFLENBQUMsRUFBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztnQ0FDeEMsRUFBRSxDQUFDLENBQUMsS0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQ0FDYixTQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxRQUFRO3dDQUNqQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBRSxDQUFDLG1CQUFtQixDQUFDLFFBQVEsRUFBUSxFQUFHLENBQUMsZUFBZSxDQUFDLEtBQUcsQ0FBQyxDQUFDLENBQUM7b0NBQzdHLENBQUMsQ0FBQyxDQUFDO2dDQUNQLENBQUM7Z0NBQUMsSUFBSSxDQUFDLENBQUM7b0NBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxrREFBa0QsQ0FBQyxDQUFDO2dDQUN0RSxDQUFDOzRCQUNMLENBQUM7NEJBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ0osT0FBTyxDQUFDLEtBQUssQ0FBQyxpREFBaUQsQ0FBQyxDQUFDOzRCQUNyRSxDQUFDOzRCQUNELEtBQUssQ0FBQzt3QkFDVjs0QkFDSSxPQUFPLENBQUMsS0FBSyxDQUFDLHlEQUF1RCxFQUFJLENBQUMsQ0FBQzs0QkFDM0UsS0FBSyxDQUFDO29CQUNkLENBQUM7Z0JBRUwsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2IsQ0FBQztZQUVjLGdEQUFzQyxHQUFyRCxVQUEyRSxFQUFpQyxFQUFFLFVBQWtCO2dCQUM1SCxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQ3pCLEVBQUUsQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNoQyxDQUFDO2dCQUFDLElBQUksQ0FBQyxDQUFDO29CQUNKLEVBQUUsQ0FBQyxLQUFLLEdBQXNCLFFBQVEsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFFLENBQUMsS0FBSyxDQUFDO2dCQUM3RSxDQUFDO2dCQUNELE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDZCxDQUFDO1lBRWMscUNBQTJCLEdBQTFDLFVBQWdFLEVBQWlDLEVBQUUsVUFBa0I7Z0JBQ2pILElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxhQUFhLElBQUksVUFBUyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0QsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO29CQUN6QixFQUFFLENBQUMsQ0FBQyxPQUFPLGtCQUFBLEtBQUssQ0FBQyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDakMsK0NBQStDO3dCQUM1QixRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBRSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNyRixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNFLGtCQUFBLEtBQUssQ0FBQyxDQUFFLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQ25ELENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxJQUFJLENBQUMsQ0FBQztvQkFDSixFQUFFLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDckMsQ0FBQztZQUNMLENBQUM7WUE5THVCLHNCQUFZLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUM7WUErTG5GLGdCQUFDO1NBQUEsQUFsTUQsSUFrTUM7UUFsTXFCLDJCQUFTLFlBa005QixDQUFBO1FBRUQ7WUFDSSwyQkFDb0IsV0FBd0IsRUFDeEIsRUFBbUIsRUFBRSxxQkFBcUI7WUFDbkQsS0FBVyxFQUFFLHFDQUFxQztZQUNsRCxXQUFnQyxFQUNoQyxXQUF5QixFQUN6QixZQUFnQyxFQUFFLGtFQUFrRTtZQUNwRyxhQUFpQyxFQUNqQyxZQUFnQjtnQkFQUCxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtnQkFDeEIsT0FBRSxHQUFGLEVBQUUsQ0FBaUI7Z0JBQzVCLFVBQUssR0FBTCxLQUFLLENBQU07Z0JBQ1gsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO2dCQUNoQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztnQkFDekIsaUJBQVksR0FBWixZQUFZLENBQW9CO2dCQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBb0I7Z0JBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUFJO1lBQ3ZCLENBQUM7WUFDVCx3QkFBQztRQUFELENBQUMsQUFYRCxJQVdDO1FBWFksbUNBQWlCLG9CQVc3QixDQUFBO1FBRUQ7WUFFSSx5Q0FDb0IsRUFBbUIsRUFBRSxxQkFBcUI7WUFDbkQsS0FBVyxFQUFFLHFDQUFxQztZQUNsRCxXQUFnQyxFQUNoQyxhQUFpQyxFQUNqQyxZQUFnQjtnQkFKUCxPQUFFLEdBQUYsRUFBRSxDQUFpQjtnQkFDNUIsVUFBSyxHQUFMLEtBQUssQ0FBTTtnQkFDWCxnQkFBVyxHQUFYLFdBQVcsQ0FBcUI7Z0JBQ2hDLGtCQUFhLEdBQWIsYUFBYSxDQUFvQjtnQkFDakMsaUJBQVksR0FBWixZQUFZLENBQUk7Z0JBTlgsZ0JBQVcsR0FBd0IsZUFBd0MsQ0FBQztZQU94RixDQUFDO1lBQ1Qsc0NBQUM7UUFBRCxDQUFDLEFBVEQsSUFTQztRQVRZLGlEQUErQixrQ0FTM0MsQ0FBQTtRQUVEO1lBRUksNENBQ29CLEVBQW1CLEVBQUUscUJBQXFCO1lBQ25ELEtBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsV0FBeUIsRUFDekIsWUFBZ0MsRUFBRSxrRUFBa0U7WUFDcEcsWUFBZ0I7Z0JBSlAsT0FBRSxHQUFGLEVBQUUsQ0FBaUI7Z0JBQzVCLFVBQUssR0FBTCxLQUFLLENBQU07Z0JBQ1gsZ0JBQVcsR0FBWCxXQUFXLENBQWM7Z0JBQ3pCLGlCQUFZLEdBQVosWUFBWSxDQUFvQjtnQkFDaEMsaUJBQVksR0FBWixZQUFZLENBQUk7Z0JBTlgsZ0JBQVcsR0FBMkIsa0JBQThDLENBQUM7WUFPakcsQ0FBQztZQUNULHlDQUFDO1FBQUQsQ0FBQyxBQVRELElBU0M7UUFUWSxvREFBa0MscUNBUzlDLENBQUE7UUFFRDtZQUVJLDZDQUNvQixFQUFtQixFQUFFLHFCQUFxQjtZQUNuRCxLQUFXLEVBQUUscUNBQXFDO1lBQ2xELFdBQWdDLEVBQ2hDLGFBQWlDLEVBQ2pDLFlBQWdCO2dCQUpQLE9BQUUsR0FBRixFQUFFLENBQWlCO2dCQUM1QixVQUFLLEdBQUwsS0FBSyxDQUFNO2dCQUNYLGdCQUFXLEdBQVgsV0FBVyxDQUFxQjtnQkFDaEMsa0JBQWEsR0FBYixhQUFhLENBQW9CO2dCQUNqQyxpQkFBWSxHQUFaLFlBQVksQ0FBSTtnQkFOWCxnQkFBVyxHQUE0QixtQkFBZ0QsQ0FBQztZQU9wRyxDQUFDO1lBQ1QsMENBQUM7UUFBRCxDQUFDLEFBVEQsSUFTQztRQVRZLHFEQUFtQyxzQ0FTL0MsQ0FBQTtRQUVEO1lBRUksd0NBQ29CLEVBQW1CLEVBQUUscUJBQXFCO1lBQ25ELEtBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsV0FBZ0MsRUFDaEMsV0FBeUIsRUFDekIsWUFBZ0MsRUFBRSxrRUFBa0U7WUFDcEcsYUFBaUMsRUFDakMsWUFBZ0I7Z0JBTlAsT0FBRSxHQUFGLEVBQUUsQ0FBaUI7Z0JBQzVCLFVBQUssR0FBTCxLQUFLLENBQU07Z0JBQ1gsZ0JBQVcsR0FBWCxXQUFXLENBQXFCO2dCQUNoQyxnQkFBVyxHQUFYLFdBQVcsQ0FBYztnQkFDekIsaUJBQVksR0FBWixZQUFZLENBQW9CO2dCQUNoQyxrQkFBYSxHQUFiLGFBQWEsQ0FBb0I7Z0JBQ2pDLGlCQUFZLEdBQVosWUFBWSxDQUFJO2dCQVJYLGdCQUFXLEdBQXVCLGNBQXNDLENBQUM7WUFTckYsQ0FBQztZQUNULHFDQUFDO1FBQUQsQ0FBQyxBQVhELElBV0M7UUFYWSxnREFBOEIsaUNBVzFDLENBQUE7SUFDTCxDQUFDLEVBalRnQixpQkFBaUIsR0FBakIsbUNBQWlCLEtBQWpCLG1DQUFpQixRQWlUakM7QUFDTCxDQUFDLEVBblRTLGlCQUFpQixLQUFqQixpQkFBaUIsUUFtVDFCO0FDelRELG9DQUFvQztBQUVwQyxpSEFBaUg7QUFFakgsSUFBVSxpQkFBaUIsQ0E4SDFCO0FBOUhELFdBQVUsaUJBQWlCO0lBQ3ZCLElBQWlCLE9BQU8sQ0E0SHZCO0lBNUhELFdBQWlCLE9BQU87UUFDUCxlQUFPLEdBQUcsT0FBTyxDQUFDO1FBaUIvQjtZQUVJLCtCQUFtQixVQUFnQjtnQkFBaEIsZUFBVSxHQUFWLFVBQVUsQ0FBTTtnQkFENUIsZUFBVSxHQUFHLEtBQUssQ0FBQztZQUNhLENBQUM7WUFDNUMsNEJBQUM7UUFBRCxDQUFDLEFBSEQsSUFHQztRQUhZLDZCQUFxQix3QkFHakMsQ0FBQTtRQUVEO1lBRUk7Z0JBRE8sZUFBVSxHQUFHLElBQUksQ0FBQztZQUNULENBQUM7WUFDckIsOEJBQUM7UUFBRCxDQUFDLEFBSEQsSUFHQztRQUhZLCtCQUF1QiwwQkFHbkMsQ0FBQTtRQUVELDJHQUEyRztRQUMzRyw4QkFBOEI7UUFDOUIsSUFBSSw0QkFBNEIsR0FBRyxJQUFJLENBQUM7UUFDeEMsSUFBSSxDQUFDO1lBQ0QsY0FBYyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDOUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUM5QyxDQUFDO1FBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUNkLDRCQUE0QixHQUFHLEtBQUssQ0FBQztRQUN6QyxDQUFDO2dCQUFTLENBQUM7WUFDUCxtQkFBbUI7UUFDdkIsQ0FBQztRQUNZLGlDQUF5QixHQUFHLDRCQUE0QixDQUFDO1FBTXRFO1lBRUk7Z0JBQ0ksSUFBSSxDQUFDLG1DQUFtQyxHQUFHLG1CQUFtQyxDQUFDO2dCQUMvRSxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxtQkFBbUIsSUFBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMseUJBQXlCLENBQUM7b0JBQzdGLElBQUksQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLGlCQUFpQyxDQUFDO1lBQ3ZGLENBQUM7WUFDTCwyQkFBQztRQUFELENBQUMsQUFQRCxJQU9DO1FBUFksNEJBQW9CLHVCQU9oQyxDQUFBO1FBTUQ7Ozs7Ozs7Ozs7O1VBV0U7UUFDRjtZQUVJLHVCQUNZLFdBQW1CO2dCQUFuQiw0QkFBQSxFQUFBLG1CQUFtQjtnQkFBbkIsZ0JBQVcsR0FBWCxXQUFXLENBQVE7Z0JBRnhCLGtCQUFhLEdBQUcsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1lBRzlDLENBQUM7WUFFRSwyQkFBRyxHQUFWLFVBQVcsR0FBUSxFQUNSLEdBQVEsRUFDUix1QkFBeUQsRUFDekQsdUJBQWtEO2dCQURsRCx3Q0FBQSxFQUFBLHlDQUF5RDtnQkFFaEUsSUFBSSxDQUFDO29CQUNELDhFQUE4RTtvQkFDOUUsRUFBRSxDQUFDLENBQUMsdUJBQXVCLElBQUksSUFBSSxDQUFDO3dCQUNoQyxPQUFPLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7b0JBRXRFLE1BQU0sQ0FBQSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQzt3QkFDakM7NEJBQ0ksS0FBSyxDQUFDO3dCQUNWOzRCQUNJLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDOzRCQUNqQyxLQUFLLENBQUM7d0JBQ1Y7NEJBQ0ksS0FBSyxDQUFDO3dCQUNWOzRCQUNJLEtBQUssQ0FBQztvQkFDVixDQUFDO2dCQUNMLENBQUM7Z0JBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDVCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO3dCQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNsQyxDQUFDO1lBQ0wsQ0FBQztZQUVNLDJCQUFHLEdBQVYsVUFBVyxHQUFRLEVBQUUsdUJBQWlEO2dCQUNsRSxJQUFJLENBQUM7b0JBQ0QsRUFBRSxDQUFDLENBQUMsdUJBQXVCLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDbEMsTUFBTSxDQUFBLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDOzRCQUNqQztnQ0FDSSxLQUFLLENBQUM7NEJBQ1Y7Z0NBQ0ksTUFBTSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7NEJBQ3ZDO2dDQUNJLEtBQUssQ0FBQzs0QkFDVjtnQ0FDSSxLQUFLLENBQUM7d0JBQ1YsQ0FBQztvQkFDTCxDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO29CQUNSLENBQUM7Z0JBQ0wsQ0FBQztnQkFBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNULEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7d0JBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ2xDLENBQUM7Z0JBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQztZQUNoQixDQUFDO1lBRU0sd0NBQWdCLEdBQXZCLFVBQXdCLEdBQVEsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLG9FQUFrRSxHQUFLLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1SSxvQkFBQztRQUFELENBQUMsQUFyREQsSUFxREM7UUFyRFkscUJBQWEsZ0JBcUR6QixDQUFBO0lBQ0wsQ0FBQyxFQTVIZ0IsT0FBTyxHQUFQLHlCQUFPLEtBQVAseUJBQU8sUUE0SHZCO0FBQ0wsQ0FBQyxFQTlIUyxpQkFBaUIsS0FBakIsaUJBQWlCLFFBOEgxQjtBQ2xJRCxvQ0FBb0M7QUFDcEMsdUNBQXVDO0FBRXZDLElBQVUsaUJBQWlCLENBcWdCMUI7QUFyZ0JELFdBQVUsaUJBQWlCO0lBQ3ZCLDZGQUE2RjtJQUM3RiwwRkFBMEY7SUFDL0UsMkJBQVMsR0FBRyxVQUFTLElBQWEsRUFBRSxFQUFzRztZQUF0RywrREFBc0csRUFBckcsNEJBQVcsRUFBRSxrQkFBTTtRQUMvRCxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsSUFBYSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hDLENBQUM7UUFBQyxJQUFJLENBQUMsQ0FBQztZQUNKLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsSUFBYSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlGLG1EQUFtRDtnQkFDbkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQywyQkFBMkI7c0NBQ0ksQ0FBQztvQkFDbkQsQ0FBQyxPQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDNUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsQ0FBQztZQUNMLENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7WUFDaEMsQ0FBQztRQUNMLENBQUM7SUFDTCxDQUFDLENBQUM7SUFFRixJQUFJLFdBQVcsR0FBRztRQUNkLHdGQUF3RjtRQUN4RixFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7WUFDMUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBQSxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7Z0JBQzNDLElBQUksQ0FBQztvQkFBQyxrQkFBQSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFBQyxDQUFDO2dCQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxDQUFDO1lBQzlELENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQyxDQUFBO0lBQ0QsSUFBSSxZQUFZLEdBQUc7UUFDZixHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFBLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztZQUM1QyxJQUFJLENBQUM7Z0JBQUMsa0JBQUEsYUFBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFBQyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQztRQUMvRCxDQUFDO0lBQ0wsQ0FBQyxDQUFBO0lBQ0QsSUFBSSxhQUFhLEdBQUc7UUFDaEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxrQkFBQSxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7WUFDN0MsSUFBSSxDQUFDO2dCQUFDLGtCQUFBLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQUMsQ0FBQztZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUFDLENBQUM7UUFDaEUsQ0FBQztJQUNMLENBQUMsQ0FBQTtJQUNELElBQUksMEJBQTBCLEdBQUc7UUFDN0IsaUJBQWlCLENBQUMsd0JBQXdCLEdBQUcsRUFBRSxDQUFDO0lBQ3BELENBQUMsQ0FBQztJQUVGLElBQWlCLE1BQU0sQ0FpYXRCO0lBamFELFdBQWlCLE1BQU07UUFPbkI7WUFRSSxxQkFBWSxzQkFBNkI7Z0JBSmpDLDJCQUFzQixHQUFnQyxFQUFFLENBQUM7Z0JBRXpELHNCQUFpQixHQUFZLEtBQUssQ0FBQztnQkFHdkMsSUFBSSxDQUFDLHNCQUFzQixHQUFHLHNCQUFzQixDQUFDO2dCQUNyRCxJQUFJLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQztZQUM5RCxDQUFDO1lBRU0sbUNBQWEsR0FBcEIsVUFBcUIsY0FBd0M7Z0JBQ3pELEVBQUUsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDekMsRUFBRSxDQUFDLENBQVUsSUFBSSxDQUFDLGVBQWdCLEdBQVksY0FBYyxDQUFDLGVBQWdCLENBQUMsQ0FBQyxDQUFDO3dCQUM1RSxJQUFJLENBQUMsZUFBZSxHQUFHLGNBQWMsQ0FBQyxlQUFlLENBQUM7b0JBQzFELENBQUM7Z0JBQ0wsQ0FBQztnQkFFRCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztvQkFDMUQsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjt3QkFDbkQsY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQzt3QkFDdEMsT0FBTyxDQUFDLElBQUksQ0FBQyx5Q0FBdUMsSUFBSSxDQUFDLHNCQUFzQixnQkFBVyxjQUFjLENBQUMsb0JBQW9CLE9BQUksQ0FBQyxDQUFDO3dCQUNuSSxNQUFNLENBQUM7b0JBQ1gsQ0FBQztnQkFDTCxDQUFDO2dCQUVELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUVNLGtDQUFZLEdBQW5CLFVBQW9CLDJCQUFrQyxFQUFFLE9BQVc7Z0JBQy9ELGtIQUFrSDtnQkFDbEgsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUM7Z0JBQy9CLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7Z0JBQzlCLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMxRCxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsc0RBQXNEO29CQUN0RCxtQ0FBbUM7b0JBQ25DLEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQjt3QkFDdkMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO3dCQUM5QixJQUFJLENBQUM7NEJBQ0QsRUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLElBQUksSUFBSTtnQ0FDM0MsT0FBTSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQztnQ0FDN0Qsa0JBQWtCLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7NEJBQ2pELENBQUM7NEJBQUMsSUFBSSxDQUFDLENBQUM7Z0NBQ0osNEVBQTRFO2dDQUM1RSw2Q0FBNkM7Z0NBQzdDLGlHQUFpRztnQ0FFakcscUVBQXFFO2dDQUNyRSxFQUFFLENBQUMsQ0FBQyxPQUFPLGtCQUFBLEtBQUssQ0FBQyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQztvQ0FDakMsSUFBSSxlQUFlLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUM7b0NBQ3pGLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO3dDQUM5QyxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7NENBQ2hDLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkVBQXlFLE9BQU8sK0JBQTBCLGtCQUFrQixDQUFDLG9CQUFzQixDQUFDLENBQUM7d0NBQ3RLLENBQUM7d0NBQ2tCLGVBQWUsQ0FBQyxDQUFDLENBQUUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO29DQUMzRCxDQUFDO2dDQUNMLENBQUM7Z0NBQUMsSUFBSSxDQUFDLENBQUM7b0NBQ0Usa0JBQUEsS0FBSyxDQUFDLENBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQ0FDekUsQ0FBQzs0QkFDTCxDQUFDO3dCQUNMLENBQUM7d0JBQUMsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNyQixDQUFDO29CQUNMLENBQUM7Z0JBQ0wsQ0FBQztZQUNMLENBQUM7WUFFTSxnREFBMEIsR0FBakM7Z0JBQ0ksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7b0JBQUMsTUFBTSxDQUFDO2dCQUNwQyxnSUFBZ0k7Z0JBQ2hJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMxRCxJQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDeEQsSUFBSSxDQUFDO3dCQUNELEVBQUUsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixJQUFJLElBQUk7NEJBQzNDLE9BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUM7NEJBQzdELGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzt3QkFDOUQsQ0FBQzt3QkFBQyxJQUFJLENBQUMsQ0FBQzs0QkFDSiw0RUFBNEU7NEJBQzVFLDZDQUE2Qzs0QkFDN0MsOEdBQThHOzRCQUU5RyxpRkFBaUY7NEJBQ2pGLEVBQUUsQ0FBQyxDQUFDLE9BQU8sa0JBQUEsS0FBSyxDQUFDLENBQUMsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dDQUNqQyxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQ0FDekYsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0NBQzlDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUM7d0NBQzdDLE9BQU8sQ0FBQyxJQUFJLENBQUMsMkVBQXlFLElBQUksQ0FBQyxlQUFlLCtCQUEwQixrQkFBa0IsQ0FBQyxvQkFBc0IsQ0FBQyxDQUFDO29DQUNuTCxDQUFDO29DQUNrQixlQUFlLENBQUMsQ0FBQyxDQUFFLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7Z0NBQ3hFLENBQUM7NEJBQ0wsQ0FBQzs0QkFBQyxJQUFJLENBQUMsQ0FBQztnQ0FDRSxrQkFBQSxLQUFLLENBQUMsQ0FBRSxDQUFDLGtCQUFrQixDQUFDLG9CQUFvQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzs0QkFDdEYsQ0FBQzt3QkFDTCxDQUFDO29CQUNMLENBQUM7b0JBQUMsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt3QkFDUixPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUNyQixDQUFDO2dCQUNMLENBQUM7WUFDTCxDQUFDO1lBRU0sc0NBQWdCLEdBQXZCO2dCQUNJLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLHFCQUErQyxDQUFDO29CQUNwRSxNQUFNLENBQUMsQ0FBQyw2RUFBNkU7Z0JBRXpGLElBQUksUUFBUSxHQUFjLEVBQUUsQ0FBQyxDQUFDLGlFQUFpRTtnQkFFL0YsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQzFELEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQzt3QkFDekQsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckIsQ0FBQztnQkFDTCxDQUFDO2dCQUVELE9BQU8sUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFDM0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sQ0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7WUFDTCxDQUFDO1lBckhhLGtDQUFzQixxQkFBK0M7WUFzSHZGLGtCQUFDO1NBQUEsQUF2SEQsSUF1SEM7UUFFRDtZQUlJO2dCQUhBLDJFQUEyRTtnQkFDM0Qsb0JBQWUsK0JBQXlEO2dCQUdwRixJQUFJLENBQUMsMkNBQTJDLEdBQUcsRUFBRSxDQUFDO1lBQzFELENBQUM7WUFFTSxnQ0FBRyxHQUFWLFVBQVcsc0JBQTZCO2dCQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDcEYsQ0FBQztZQUVNLGdDQUFHLEdBQVYsVUFBVyxzQkFBNkIsRUFBRSxXQUF3QjtnQkFDOUQsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLHNCQUFzQixDQUFDLEdBQUcsV0FBVyxDQUFDO1lBQzNGLENBQUM7WUFFTSw2Q0FBZ0IsR0FBdkI7Z0JBQUEsaUJBZUM7Z0JBZEcsSUFBSSxZQUFZLEdBQWMsRUFBRSxDQUFDO2dCQUNqQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLHNCQUE2QjtvQkFDaEcsSUFBSSxtQkFBbUIsR0FBRyxLQUFJLENBQUMsMkNBQTJDLENBQUMsc0JBQXNCLENBQUMsQ0FBQztvQkFDbkcsbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztvQkFFdkMsRUFBRSxDQUFDLENBQUMsbUJBQW1CLENBQUMsZUFBZSxzQkFBZ0QsQ0FBQyxDQUFDLENBQUM7d0JBQ3RGLDZCQUE2Qjt3QkFDN0IsWUFBWSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO29CQUM5QyxDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFBO2dCQUVGLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO29CQUMzQyxPQUFPLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0UsQ0FBQztZQUNMLENBQUM7WUFFTSxpRkFBb0QsR0FBM0Q7Z0JBQUEsaUJBSUM7Z0JBSEcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQyxPQUFPLENBQUMsVUFBQyxzQkFBNkI7b0JBQ2hHLEtBQUksQ0FBQywyQ0FBMkMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLDBCQUEwQixFQUFFLENBQUM7Z0JBQzFHLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUNMLHlCQUFDO1FBQUQsQ0FBQyxBQXRDRCxJQXNDQztRQUVEO1lBSUk7Z0JBSEEsMkVBQTJFO2dCQUMzRCxvQkFBZSwrQkFBeUQ7Z0JBQ2hGLHVCQUFrQixHQUF1QixJQUFJLGtCQUFrQixFQUFFLENBQUM7Z0JBRXRFLEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQztvQkFDekIsa0JBQUEsWUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztvQkFDdkQsa0JBQUEsY0FBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDckYsQ0FBQztZQUNMLENBQUM7WUFFRCw2Q0FBZ0IsR0FBaEI7Z0JBQ0ksSUFBSSxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDL0MsQ0FBQztZQUVELHdEQUEyQixHQUEzQjtnQkFDSSxJQUFJLENBQUMsa0JBQWtCLENBQUMsb0RBQW9ELEVBQUUsQ0FBQztZQUNuRixDQUFDO1lBRU8sb0RBQXVCLEdBQS9CLFVBQWdDLElBQXdCO2dCQUNwRCxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxDQUFDO1lBRU8sMkRBQThCLEdBQXRDLFVBQXVDLElBQXdCO2dCQUMzRCxNQUFNLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2RCxDQUFDO1lBRU0sK0NBQWtCLEdBQXpCLFVBQ0ksc0JBQTZCLEVBQzdCLGNBQXFCLEVBQUUsNkNBQTZDO1lBQ3BFLFVBQTZELEVBQzdELGVBQTZEO2dCQUQ3RCwyQkFBQSxFQUFBLHNCQUE2RDtnQkFDN0QsZ0NBQUEsRUFBQSxtQ0FBNkQ7Z0JBRTdELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUUzRixtRkFBbUY7Z0JBQ25GLGlGQUFpRjtnQkFDakYsNEVBQTRFO2dCQUU5RCxXQUFZLENBQUMsYUFBYSxDQUFDO29CQUNyQyxvQkFBb0IsRUFBRSxjQUFjO29CQUNwQyxnQkFBZ0IsRUFBRSxVQUFVO29CQUM1QixlQUFlLEVBQUUsZUFBZTtpQkFDbkMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQztZQUVNLG1EQUFzQixHQUE3QixVQUNJLHNCQUE2QixFQUM3QixPQUFXO2dCQUVYLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQywyQ0FBMkMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUMzRixXQUFXLENBQUMsWUFBWSxDQUFDLHNCQUFzQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzlELENBQUM7WUFFTyx3RUFBMkMsR0FBbkQsVUFBb0Qsc0JBQTZCO2dCQUM3RSxJQUFJLFdBQVcsR0FBZ0MsSUFBSSxDQUFDO2dCQUNwRCw0Q0FBNEM7Z0JBQzVDLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7b0JBQzlFLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO29CQUN0RCxJQUFJLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUN2QixzQkFBc0IsRUFDVCxXQUFXLENBQzNCLENBQUM7Z0JBQ04sQ0FBQztnQkFDRCxNQUFNLENBQWMsV0FBVyxDQUFDO1lBQ3BDLENBQUM7WUFDTCx5QkFBQztRQUFELENBQUMsQUFsRUQsSUFrRUM7UUFFRCx5QkFBeUI7UUFDekIsNERBQTREO1FBQzVELElBQUksa0JBQWtCLEdBQXdCLElBQUksa0JBQWtCLEVBQUUsQ0FBQztRQUFBLENBQUM7UUFFeEUsa0ZBQWtGO1FBQ2xGLHlFQUF5RTtRQUM5RCxnQkFBUyxHQUFHLFVBQ25CLHNCQUE2QixFQUM3QixjQUFxQixFQUFFLG9GQUFvRjtRQUMzRyxVQUE2RCxFQUM3RCxlQUE2RDtZQUQ3RCwyQkFBQSxFQUFBLHNCQUE2RDtZQUM3RCxnQ0FBQSxFQUFBLG1DQUE2RDtZQUU3RCxtRUFBbUU7WUFDbkUsdUNBQXVDO1lBQ3ZDLCtCQUErQjtZQUMvQiwyQkFBMkI7WUFDM0IsZ0NBQWdDO1lBQ2hDLGtCQUFrQixDQUFDLGtCQUFrQixDQUNqQyxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLGVBQWUsQ0FDdEUsQ0FBQztRQUNOLENBQUMsQ0FBQTtRQUVVLGNBQU8sR0FBRyxVQUFDLHNCQUE2QixFQUFFLE9BQVc7WUFDNUQsaUVBQWlFO1lBQ2pFLHVDQUF1QztZQUN2Qyx3QkFBd0I7WUFDeEIsa0JBQWtCLENBQUMsc0JBQXNCLENBQUMsc0JBQXNCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDL0UsQ0FBQyxDQUFBO1FBRUQsNkdBQTZHO1FBRTdHLHdDQUF3QztRQUN4QztZQUlJLHdDQUNJLHNCQUE2QixFQUM3QixVQUFpQixFQUNqQiwwQkFBeUM7Z0JBQXpDLDJDQUFBLEVBQUEsaUNBQXlDO2dCQU43Qyx5Q0FBeUM7Z0JBQ3pCLG9CQUFlLCtCQUF5RDtnQkFPcEYsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7Z0JBRTdCLHVEQUF1RDtnQkFDdkQsRUFBRSxDQUFDLENBQUMsQ0FBQyxrQkFBQSxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDO29CQUNyQyxPQUFPLENBQUMsR0FBRyxDQUFDLGlHQUFpRyxDQUFDLENBQUM7b0JBQy9HLE1BQU0sQ0FBQztnQkFDWCxDQUFDO2dCQUVELE9BQUEsU0FBUyxDQUNMLHNCQUFzQixFQUN0QixVQUFVLEVBQ1YsSUFBSSxDQUFDLDRCQUE0QixDQUFDLElBQUksQ0FBQyxFQUN2QyxJQUFJLENBQUMsZUFBZSxDQUN2QixDQUFBO2dCQUVELElBQUksa0JBQWtCLEdBQUcsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFNUQsRUFBRSxDQUFDLENBQUMsa0JBQWtCLElBQUksSUFBSTtvQkFDMUIsMEJBQTBCLENBQUM7b0JBQzNCLGtCQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO3dCQUNaLE9BQUEsT0FBTyxDQUFDLHNCQUFzQixFQUFFLGtCQUFrQixDQUFDLENBQUM7b0JBQ3hELENBQUMsQ0FBQyxDQUFDO1lBQ1gsQ0FBQztZQUVELGtFQUF5QixHQUF6QixVQUEwQixHQUFPO2dCQUM3QixjQUFjLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7WUFDNUQsQ0FBQztZQUVPLHFFQUE0QixHQUFwQyxVQUFxQyxJQUFvQztnQkFDckUsTUFBTSxDQUFDLFVBQUMsT0FBVyxJQUFNLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUEsQ0FBQyxDQUFBO1lBQ2pGLENBQUM7WUFDTCxxQ0FBQztRQUFELENBQUMsQUF4Q0QsSUF3Q0M7UUF4Q1kscUNBQThCLGlDQXdDMUMsQ0FBQTtRQUVELHdDQUF3QztRQUN4QztZQU9JLGdEQUNJLHNCQUE2QixFQUM3QixNQUFhLEVBQ2IsWUFBcUMsRUFDckMsZUFBNkQsRUFDN0QscUJBQXFDO2dCQUZyQyw2QkFBQSxFQUFBLG1CQUFxQztnQkFDckMsZ0NBQUEsRUFBQSxtQ0FBNkQ7Z0JBQzdELHNDQUFBLEVBQUEsNkJBQXFDO2dCQUx6QyxpQkF5RUM7Z0JBbEVHLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxzQkFBc0IsQ0FBQztnQkFDckQsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLHFCQUFxQixHQUFHLHFCQUFxQixDQUFDO2dCQUVuRCxpQ0FBaUM7Z0JBQ2pDLEVBQUUsQ0FBQyxDQUFDLHFCQUFxQjtvQkFDckIsQ0FBb0IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUN0RSxrQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQzt3QkFDWixPQUFBLE9BQU8sQ0FDSCxzQkFBc0IsRUFDSCxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBRSxDQUFDLEtBQUssQ0FDNUQsQ0FBQztvQkFDTixDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDO2dCQUVELFlBQVk7Z0JBQ1osT0FBQSxTQUFTLENBQ0wsc0JBQXNCLEVBQ3RCLE1BQUksTUFBUSxFQUNaLFVBQUMsT0FBVztvQkFDUixFQUFFLENBQUMsQ0FBQyxPQUFPLGtCQUFBLEtBQUssQ0FBQyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQzt3QkFDakMsMENBQTBDO3dCQUMxQyxJQUFJLGVBQWUsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsTUFBSSxNQUFRLENBQUMsQ0FBQzt3QkFDOUQsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7NEJBQzNCLGVBQWUsQ0FBQyxDQUFDLENBQUUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDO3dCQUMzRCxDQUFDO29CQUNMLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0Usa0JBQUEsS0FBSyxDQUFDLENBQUUsQ0FBQyxNQUFJLE1BQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztvQkFDOUMsQ0FBQztvQkFFRCxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7d0JBQzVCLElBQUksQ0FBQzs0QkFDSyxLQUFJLENBQUMsWUFBYSxFQUFFLENBQUM7d0JBQy9CLENBQUM7d0JBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUFDLENBQUM7b0JBQ3BDLENBQUM7Z0JBQ0wsQ0FBQyxFQUNELElBQUksQ0FBQyxlQUFlLENBQ3ZCLENBQUM7Z0JBRUYsSUFBSSxDQUFDLG9CQUFvQixHQUFHLENBQUMsVUFBQyxHQUFVO29CQUNwQyxPQUFBLE9BQU8sQ0FDSCxLQUFJLENBQUMsc0JBQXNCLEVBQ1IsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsS0FBSyxDQUNqRSxDQUFDO29CQUVGLCtHQUErRztvQkFFL0csRUFBRSxDQUFDLENBQUMsS0FBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO3dCQUM1QixJQUFJLENBQUM7NEJBQ0QsS0FBSSxDQUFDLFlBQVksRUFBRSxDQUFDO3dCQUN4QixDQUFDO3dCQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7NEJBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTt3QkFBQyxDQUFDO29CQUNwQyxDQUFDLENBQUMsMERBQTBEO2dCQUNoRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRWQscUJBQXFCO2dCQUNyQixpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUTtvQkFDbEQsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQTBCLEtBQUksQ0FBQyxvQkFBcUIsQ0FBQyxDQUFDO2dCQUNsSSxDQUFDLENBQUMsQ0FBQztnQkFFSCxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxzQkFBZ0Q7b0JBQ3BFLGlCQUFpQixDQUFDLHFCQUFxQjtvQkFDdkMsQ0FBQyxrQkFBQSxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDYixrQkFBQSxLQUFLLENBQUMsV0FBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDakYsQ0FBQztZQUNMLENBQUM7WUFFRCxpRUFBZ0IsR0FBaEI7Z0JBQ0ksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsc0JBQWdELENBQUMsQ0FBQyxDQUFDO29CQUN2RSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQ3BCLENBQUM7WUFDTCxDQUFDO1lBRU8sd0VBQXVCLEdBQS9CLFVBQWdDLElBQTRDO2dCQUN4RSxNQUFNLENBQUMsY0FBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUEsQ0FBQyxDQUFBO1lBQ3BELENBQUM7WUFFRCx5REFBUSxHQUFSLFVBQVMsdUJBQXVDO2dCQUFoRCxpQkFZQztnQkFaUSx3Q0FBQSxFQUFBLCtCQUF1QztnQkFDNUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsZ0NBQTBEO29CQUM5RSxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQztvQkFDM0IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3SUFBd0ksQ0FBQyxDQUFDO29CQUN4SixNQUFNLENBQUM7Z0JBQ1gsQ0FBQztnQkFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFGQUFtRixJQUFJLENBQUMsTUFBTSxNQUFHLENBQUMsQ0FBQztnQkFDL0csK0VBQStFO2dCQUMvRSxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUMsUUFBUTtvQkFDbEQsUUFBUSxDQUFDLGNBQWMsQ0FBQyxLQUFJLENBQUMsTUFBTSxDQUFFLENBQUMsbUJBQW1CLENBQUMsUUFBUSxFQUEwQixLQUFJLENBQUMsb0JBQXFCLENBQUMsQ0FBQztnQkFDMUksQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBQ0wsNkNBQUM7UUFBRCxDQUFDLEFBekdELElBeUdDO1FBekdZLDZDQUFzQyx5Q0F5R2xELENBQUE7SUFDTCxDQUFDLEVBamFnQixNQUFNLEdBQU4sd0JBQU0sS0FBTix3QkFBTSxRQWlhdEI7SUFFRCxJQUFNLFVBQVUsR0FBRztRQUNmLG9DQUFvQztRQUNwQyxPQUFPLGtCQUFBLEtBQUssQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFCLElBQUksQ0FBQztnQkFBZ0Isa0JBQUEsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUcsRUFBRSxDQUFDO1lBQUMsQ0FBQztZQUM1QyxLQUFLLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxDQUFDO1FBQ2xDLENBQUM7UUFBQSxDQUFDO1FBRUYsSUFBSSxDQUFDO1lBQUMsWUFBWSxFQUFFLENBQUM7UUFBQyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUU5QixFQUFFLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUM7WUFDckMsQ0FBQyxPQUFNLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3ZELElBQUksQ0FBQztnQkFDRCxpQkFBaUIsQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsQyxDQUFDO1lBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLENBQUM7UUFDTCxDQUFDO1FBRUQsSUFBSSxDQUFDO1lBQUMsYUFBYSxFQUFFLENBQUM7UUFBQyxDQUFDO1FBQ3hCLEtBQUssQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUU5QixxQ0FBcUM7UUFDckMsT0FBTyxrQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMzQixJQUFJLENBQUM7Z0JBQWdCLGtCQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFHLEVBQUUsQ0FBQztZQUFDLENBQUM7WUFDN0MsS0FBSyxDQUFBLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQUEsQ0FBQztJQUNOLENBQUMsQ0FBQztJQUVGLE1BQU0sQ0FBQyxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixDQUFDLENBQUMsQ0FBQztRQUNwRDtZQUNJLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxpQkFBaUIsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUN6RCxLQUFLLENBQUM7UUFDVix5QkFBd0Q7UUFDeEQsd0JBQXVEO1FBQ3ZEO1lBQ0ksUUFBUSxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxFQUFFLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFDMUMsbURBQW1EO1FBQ25ELEVBQUUsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQix1QkFBc0Q7WUFDbkcsaUJBQWlCLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQywwQkFBMEIsRUFBRSxXQUFXLENBQUMsQ0FBQztZQUNuRSxFQUFFLENBQUMsQ0FBQyxrQkFBQSxLQUFLLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQztnQkFDMUIsUUFBUSxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixFQUFFO29CQUNsRCw0Q0FBNEM7b0JBQzVDLE9BQXdCLGtCQUFBLEtBQUssQ0FBQyxXQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO3dCQUNwRCxJQUFJLENBQUM7NEJBQWlDLGtCQUFBLEtBQUssQ0FBQyxXQUFZLENBQUMsS0FBSyxFQUFHLEVBQUUsQ0FBQzt3QkFBQyxDQUFDO3dCQUN0RSxLQUFLLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzRCQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7d0JBQUMsQ0FBQztvQkFDbEMsQ0FBQztvQkFBQSxDQUFDO2dCQUNOLENBQUMsQ0FBQyxDQUFDO1lBQ1AsRUFBRSxDQUFDLENBQUMsQ0FBQywwQkFBMEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU0sQ0FBQywwQkFBMEIsQ0FBQyxLQUFLLFVBQVUsQ0FBQyxDQUFDO2dCQUM1RixRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztRQUNsRixDQUFDO0lBQ0wsQ0FBQztBQUNMLENBQUMsRUFyZ0JTLGlCQUFpQixLQUFqQixpQkFBaUIsUUFxZ0IxQjtBQ3hnQkQsa0JBQWtCO0FBQ2xCLGdDQUFnQztBQUNoQyxrQ0FBa0M7QUFDbEMscUJBQXFCO0FBQ3JCLGtCQUFrQjtBQUVsQixvQ0FBb0M7QUFDcEMsa0RBQWtEO0FBQ2xELG9EQUFvRDtBQUNwRCx1Q0FBdUM7QUFDdkMsb0NBQW9DO0FBRXBDLHlHQUF5RztBQUN6Ryx5RUFBeUU7QUFFekUsb0NBQW9DO0FBRXBDLElBQVUsaUJBQWlCLENBQXFDO0FBQWhFLFdBQVUsaUJBQWlCO0lBQWdCLHlCQUFPLEdBQUcsUUFBUSxDQUFDO0FBQUMsQ0FBQyxFQUF0RCxpQkFBaUIsS0FBakIsaUJBQWlCLFFBQXFDIiwic291cmNlc0NvbnRlbnQiOlsiXG4vLyBUaGlzIGZpbGUgY29udGFpbnMgdHlwZXMgYW5kIGludGVybmFsIHN0YXRlIHVzZWQgYnkgdGhlIGZyYW1ld29yayB0aGF0IGluZGl2aWR1YWwgY29tcG9uZW50c1xuLy8gaW4gdGhlIGxpYnJhcnkgbmVlZCBrbm93bGVkZ2Ugb2Ygc3VjaCBhcyBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuXG5cbmRlY2xhcmUgdmFyIFR1cmJvbGlua3MgOiBhbnk7XG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgLy8gSGFzIGEgZGVwZW5kZW5jeSBvbiBKUXVlcnkuIFNob3VsZCBiZSBsb2FkZWQgYWZ0ZXIgVHVyYm9saW5rcyB0byByZWdpc3RlclxuICAgIC8vIGNsZWFudXBGdW5jIG9uICd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInIGV2ZW50LlxuICAgIGV4cG9ydCBpbnRlcmZhY2UgR2xvYmFsSGFuZGxlIGV4dGVuZHMgV2luZG93IHtcbiAgICAgICAgV2luZG93cz86IGFueTtcbiAgICAgICAgJD86IGFueTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIHNjcmlwdCB0YWcgYmVsb3cgaW4gdGhlIGhlYWRlciBvZiB5b3VyIHBhZ2U6XG4gICAgLy8gPHNjcmlwdD4gXCJ1c2Ugc3RyaWN0XCI7IHZhciBnSG5kbCA9IHRoaXM7IHZhciBzdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gPSB7fTsgdmFyIGhvb2tzID0geyBwcmU6IFtdLCBwb3N0OiBbXSwgcGFnZUNsZWFudXA6IFtdIH07IDwvc2NyaXB0PlxuICAgIGV4cG9ydCBkZWNsYXJlIHZhciBob29rcyA6IHtcbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGJlZm9yZSBNaW5pSHRtbFZpZXdNb2RlbC5yZWFkeUZ1bmMpXG4gICAgICAgIHByZTogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGFmdGVyIE1pbmlIdG1sVmlld01vZGVsLnJlYWR5RnVuYylcbiAgICAgICAgcG9zdDogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gRXhwZXJpbWVudGFsOiBPbmx5IG1ha2VzIHNlbnNlIGlmIHVzZWQgd2l0aCBUdXJib2xpbmtzXG4gICAgICAgIHBhZ2VDbGVhbnVwPzogKCgpID0+IHZvaWQpW11cbiAgICB9O1xuXG4gICAgZXhwb3J0IGxldCBnSG5kbCA6IEdsb2JhbEhhbmRsZSA9IHdpbmRvdztcbiAgICBleHBvcnQgZGVjbGFyZSB2YXIgc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uIDogYW55O1xuXG4gICAgLy8gQSBwYXJ0IG9mIHRoZSBTUEEgc3VwcHBvcnRcbiAgICBleHBvcnQgY29uc3QgZW51bSBPYmplY3RMaWZlQ3ljbGUge1xuICAgICAgICBUcmFuc2llbnQgPSAwLCAvLyBPbmx5IGZvciBzaW5nbGUgcGFnZSwgb2JqZWN0IHNob3VsZCBhdXRvbWF0aWNhbGx5IGJlIGRlc3Ryb3llZCB3aGVuIG5hdmlnYXRpbmcgZnJvbSBwYWdlXG4gICAgICAgIFZhcmlhYmxlUGVyc2lzdGVuY2UgPSAxLCAvLyBMaWZldGltZSBpcyBtYW5hZ2VkIG1hbnVhbGx5IChzaG91bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgZGVzdHJveWVkIHdoZW4gbmF2aWdhdGluZyBwYWdlcylcbiAgICAgICAgSW5maW5pdGVQZXJzaXN0ZW5jZSA9IDIgLy8gTm90IHRvIGJlIGRlc3Ryb3llZCAoaW50ZW5kZWQgdG8gYmUgcGVyc2lzdGVudCBhY3Jvc3MgcGFnZSBuYXZpZ2F0aW9uKVxuICAgIH07XG5cbiAgICBleHBvcnQgY29uc3QgSHRtbElucHV0Q2hhbmdlRXZlbnRzID0gJ2NoYW5nZSB0ZXh0SW5wdXQgaW5wdXQnO1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgb2JqZWN0TGlmZUN5Y2xlPzogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgIH1cblxuICAgIGV4cG9ydCBjb25zdCBlbnVtIFN1cHBvcnRlZEludGVncmF0aW9uIHtcbiAgICAgICAgTm9GcmFtZXdvcmsgPSAwLFxuICAgICAgICBUdXJib2xpbmtzID0gMSxcbiAgICAgICAgV2luZG93c1VXUCA9IDJcbiAgICB9O1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbk1ldGFkYXRhIHtcbiAgICAgICAgc3VwcG9ydGVkSW50ZWdyYXRpb246IFN1cHBvcnRlZEludGVncmF0aW9uO1xuICAgICAgICBzaW5nbGVQYWdlQXBwbGljYXRpb25TdXBwb3J0OiBib29sZWFuO1xuICAgICAgICBwYWdlUHJlQ2FjaGVFdmVudD86IHN0cmluZ3xudWxsOyAvLyBQcm9iYWJseSBnb2luZyB0byBiZSByZW1vdmVkXG4gICAgfTtcbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgY29uc3QgV2luZG93c1V3cEVudmlyb25tZW50ID0gKHR5cGVvZiBnSG5kbC5XaW5kb3dzICE9PSAndW5kZWZpbmVkJykgJiYgKGdIbmRsLldpbmRvd3MgIT0gbnVsbCk7XG4gICAgZXhwb3J0IGNvbnN0IFR1cmJvbGlua3NBdmFpbGFibGUgPSAodHlwZW9mIFR1cmJvbGlua3MgIT09ICd1bmRlZmluZWQnKSAmJiAoVHVyYm9saW5rcyAhPSBudWxsKTtcbiAgICBleHBvcnQgY29uc3QgU2luZ2xlUGFnZUFwcGxpY2F0aW9uID0gVHVyYm9saW5rc0F2YWlsYWJsZTtcblxuICAgIGV4cG9ydCBsZXQgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uIDogU3VwcG9ydGVkSW50ZWdyYXRpb24gPSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbi5Ob0ZyYW1ld29yaztcblxuICAgIC8vIFRPRE86IFN1cHBvcnQgVHVyYm9saW5rcyBpbiBXaW5kb3dzIFVXUCBFbnZpcm9ubWVudFxuICAgIGlmIChXaW5kb3dzVXdwRW52aXJvbm1lbnQpIHtcbiAgICAgICAgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID0gU3VwcG9ydGVkSW50ZWdyYXRpb24uV2luZG93c1VXUDtcbiAgICB9IGVsc2UgaWYgKFR1cmJvbGlua3NBdmFpbGFibGUpIHtcbiAgICAgICAgUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID0gU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rcztcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgbGV0IFBhZ2VQcmVDYWNoZUV2ZW50OiBzdHJpbmd8bnVsbCA9IFR1cmJvbGlua3NBdmFpbGFibGUgPyAndHVyYm9saW5rczpiZWZvcmUtY2FjaGUnIDogbnVsbDtcblxuICAgIC8vIFRvIGJlIHNldCBieSB1c2VyIChmaXJlZCB3aGVuIERPTSBpcyByZWFkeSlcbiAgICBleHBvcnQgbGV0IHJlYWR5RnVuYyA6ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAgIC8vIEZvciB1c2VycyB0byBzdXBwbHkgaG9va3MgKGxhbWJkYSBmdW5jdGlvbnMpIHRoYXQgdGhleSB3YW50IHRvIGZpcmUgb24gZWFjaCBuYXZpZ2F0aW9uIChub3RlXG4gICAgLy8gdGhhdCB0aGVzZSBhcnJheXMgYXJlIG5vdCBlbXB0aWVkIGFzIGV4ZWN1dGVkKS5cbiAgICBleHBvcnQgbGV0IGNsZWFudXBIb29rcyA6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gICAgZXhwb3J0IGxldCBwcmVSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBleHBvcnQgbGV0IHBvc3RSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbn1cbiIsIlxuLy8gRG9lcyBub3QgcmVhbGx5IGRlcGVuZCBvbiBhbnl0aGluZ1xuXG5cInVzZSBzdHJpY3RcIjtcblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbmV4cG9ydCBuYW1lc3BhY2UgU2NyZWVuRGltZW5zaW9ucyB7XG4gICAgZXhwb3J0IGludGVyZmFjZSBTY3JlZW5EaW1lbnNpb25zIHtcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0IDogbnVtYmVyO1xuICAgICAgICBhdmFpbGFibGVXaWR0aCA6IG51bWJlcjtcbiAgICAgICAgZGV2aWNlSGVpZ2h0IDogbnVtYmVyO1xuICAgICAgICBkZXZpY2VXaWR0aCA6IG51bWJlcjtcbiAgICB9XG5cbiAgICBleHBvcnQgdmFyIEdldFNjcmVlbkRpbWVuc2lvbnMgPSBmdW5jdGlvbigpIDogU2NyZWVuRGltZW5zaW9ucyB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhdmFpbGFibGVIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uYXZhaWxIZWlnaHQsXG4gICAgICAgICAgICBhdmFpbGFibGVXaWR0aDogd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoLFxuICAgICAgICAgICAgZGV2aWNlSGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodCxcbiAgICAgICAgICAgIGRldmljZVdpZHRoOiB3aW5kb3cuc2NyZWVuLndpZHRoXG4gICAgICAgIH07XG4gICAgfVxufVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiIC8+XG5cbi8vIERlcGVuZHMgb24gSlF1ZXJ5XG4vLyBEZXBlbmRzIG9uIC4vYmFzZS5qcy50cyBkdWUgdG8gdGhlIGZhY3QgdGhhdCB0aGUgZnV0dXJlIElVc2VySW50ZXJmYWNlRWxlbWVudCBtaWdodCByZWx5IG9uIGNsZWFudXBIb29rc1xuLy8gZm9yIHRlYXJkb3duIGxvZ2ljLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgTWluaUh0bWxWaWV3TW9kZWwge1xuICAgICAgICBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjYuMSc7XG5cbiAgICAgICAgZXhwb3J0IGNvbnN0IGVudW0gQmluZGluZ01vZGUgeyBPbmVUaW1lLCBPbmVXYXlSZWFkLCBPbmVXYXlXcml0ZSwgVHdvV2F5IH07XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZTtcbiAgICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW107IC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgdmFsdWU/OiBhbnk7IC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgIHZpZXdNb2RlbFJlZj86IFQ7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuYz86IEV2ZW50TGlzdGVuZXI7XG4gICAgICAgICAgICBib3VuZEV2ZW50RnVuY3M/OiBFdmVudExpc3RlbmVyW107XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUPiB7XG4gICAgICAgICAgICBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKTtcbiAgICAgICAgICAgIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQ+IHtcbiAgICAgICAgICAgIGdldERhdGFGdW5jPzogKCgpID0+IGFueSk7XG4gICAgICAgICAgICBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKTsgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4sIElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+IHtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVRpbWUgY2FuIGJlIHRob3VnaHQgb2YgYXMgc2V0IHZhbHVlIG9uY2UgYW5kIGZvcmdldCAobm8gZXZlbnQgaGFuZGxlcnMgc2V0IG9yIElWaWV3TW9kZWxQcm9wZXJ0eSBzdG9yZWQpXG4gICAgICAgIC8vIFZhbHVlIGlzIE5PVCByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lVGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmluZGluZ01vZGUuT25lV2F5V3JpdGUgaXMgYSB3YXkgdG8gc2V0IHZhbHVlcyAobm8gZXZlbnQgaGFuZGxlcnMgc2V0IGJ1dCBJVmlld01vZGVsUHJvcGVydHk8VD4gYXJlIHN0b3JlZCkuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6QmluZGluZ01vZGUuT25lV2F5V3JpdGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuVHdvV2F5O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdWxkIGluaGVyaXQgZnJvbSB0aGlzIGNsYXNzIGluc3RlYWQgb2YgaW5zdGFudGlhdGluZyBpdCBkaXJlY3RseS5cbiAgICAgICAgZXhwb3J0IGFic3RyYWN0IGNsYXNzIFZpZXdNb2RlbCBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgcHJvdGVjdGVkIGlkVG9CaW5kYWJsZVByb3BlcnR5OiB7IFtpbmRleDogc3RyaW5nXTogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+IH07XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDaGFuZ2VFdmVudHMgPSBGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHM7XG4gICAgICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUsXG4gICAgICAgICAgICAgICAgLi4uYmluZGFibGVQcm9wZXJ0aWVzOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD5bXVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBvYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eSA9IHt9O1xuICAgICAgICAgICAgICAgIGJpbmRhYmxlUHJvcGVydGllcy5mb3JFYWNoKHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHksIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50ICYmXG4gICAgICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAoaG9va3MucGFnZUNsZWFudXAgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkucHVzaCh0aGlzLmdlblRlYXJkb3duRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm90ZWN0ZWQgcHJvY2Vzc0JpbmRhYmxlUHJvcGVydHkoYlA6IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYlAuaWQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQmluZGFibGVQcm9wZXJ0eVNpbmdsZShiUCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYlAuaWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAoPGFueT5iUCkuaWRbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ01vZGU6ICg8YW55PmJQKS5iaW5kaW5nTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogKDxhbnk+YlApLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERhdGFGdW5jOiAoPGFueT5iUCkuc2V0RGF0YUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGF0YUZ1bmM6ICg8YW55PmJQKS5nZXREYXRhRnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZUZ1bmM6ICg8YW55PmJQKS5vbkNoYW5nZUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVyRnVuYzogKDxhbnk+YlApLmNvbnZlcnRlckZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsUmVmOiAoPGFueT5iUCkudmlld01vZGVsUmVmXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGFzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hY2NlcHRhYmxlIGlkIGRldGVjdGVkIGluIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U6ICR7YlB9YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBwcm9jZXNzQmluZGFibGVQcm9wZXJ0eVNpbmdsZShiUDogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KSB7XG4gICAgICAgICAgICAgICAgbGV0IGJpbmRhYmxlUHJvcGVydHlJZDogc3RyaW5nID0gPHN0cmluZz5iUC5pZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSBhbmQgYXR0YWNoIGJpbmRhYmxlIHByb3BlcnRpZXMgdGhhdCBkbyBub3QgaGF2ZSBhIE9uZVRpbWUgYmluZGluZ01vZGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBPbmVUaW1lIGJpbmRpbmdNb2RlIHByb3BlcnRpZXMgYXJlIG5vdCBzdG9yZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChiUC5iaW5kaW5nTW9kZSAhPT0gQmluZGluZ01vZGUuT25lVGltZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYlAudmlld01vZGVsUmVmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHlbYmluZGFibGVQcm9wZXJ0eUlkXSA9IGJQO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQmluZGluZ01vZGUuT25lVGltZSBpcyBzZXQgYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgIGlmICgoYlAudmFsdWUgIT09IHVuZGVmaW5lZCkgfHwgKGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5PbmVUaW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8Vmlld01vZGVsPj5iUCwgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5yZXRyaWV2ZUFuZFNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8Vmlld01vZGVsPj5iUCwgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEF0dGFjaCBvbkNoYW5nZSBldmVudCBoYW5kbGVyIGZvciBUd29XYXkgYW5kIE9uZVdheVJlYWQgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5Ud29XYXkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgYm91bmRlZEZ1bmMgPSAoX2V2IDogRXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oYERldGVjdGVkIGNoYW5nZSBpbjogJHtiaW5kYWJsZVByb3BlcnR5SWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5oYW5kbGVQcm9wZXJ0eUNoYW5nZWRFdmVudChiaW5kYWJsZVByb3BlcnR5SWQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCg8SVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8Vmlld01vZGVsPj5iUCkub25DaGFuZ2VGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDwoKHZtOiBWaWV3TW9kZWwpID0+IHZvaWQpPig8SVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8Vmlld01vZGVsPj5iUCkub25DaGFuZ2VGdW5jKSg8Vmlld01vZGVsPmJQLnZpZXdNb2RlbFJlZik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgKDxhbnk+YlAudmlld01vZGVsUmVmKS5vbkNoYW5nZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5iUC52aWV3TW9kZWxSZWYpLm9uQ2hhbmdlKGJpbmRhYmxlUHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHByb3ZpZGUgb25DaGFuZ2VGdW5jIChhbHRlcm5hdGl2ZWx5IGltcGxlbWVudCBvbkNoYW5nZSBbKGh0bWxJZDogc3RyaW5nKSA9PiB2b2lkXSBtZXRob2QpIGZvciBpbXBsZW50YXRpb24gb2YgSVZpZXdNb2RlbFByb3BlcnR5IGZvciBpZDogJyArIGJpbmRhYmxlUHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5DaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYlAuaWQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiUC5ib3VuZEV2ZW50RnVuYyA9IGJvdW5kZWRGdW5jO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChiaW5kYWJsZVByb3BlcnR5SWQpKS5hZGRFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYm91bmRFdmVudEZ1bmNzID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiUC5ib3VuZEV2ZW50RnVuY3MgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuY3MucHVzaChib3VuZGVkRnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGJpbmRhYmxlUHJvcGVydHlJZCkpLmFkZEV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuY3NbPG51bWJlcj4oKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jcykubGVuZ3RoIC0gMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFjY2VwdGFibGUgaWQgZGV0ZWN0ZWQgaW4gSVZpZXdNb2RlbFByb3BlcnR5QmFzZTogJHtiUH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcmlnZ2VycyBjaGFuZ2UgaW4gVUkgdG8gbWF0Y2ggdmFsdWUgb2YgcHJvcGVydHkgaW4gaWRUb0JpbmRhYmxlUHJvcGVydHkuXG4gICAgICAgICAgICBwcm90ZWN0ZWQgaGFuZGxlUHJvcGVydHlDaGFuZ2VkRXZlbnQocHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRhYmxlUHJvcGVydHkgPSB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5W3Byb3BlcnR5SWRdO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FzZSBCaW5kaW5nTW9kZS5PbmVUaW1lOlxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihcIklNUE9TU0lCTEVcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkOlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxWaWV3TW9kZWw+PmJpbmRhYmxlUHJvcGVydHksIHByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuT25lV2F5V3JpdGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLlR3b1dheTpcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5zZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGJpbmRpbmdNb2RlIGZvciBCaW5kaW5nIFByb3BlcnR5IGFzc29jaWF0ZWQgd2l0aCBpZDogJHtwcm9wZXJ0eUlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5UZWFyZG93bkZ1bmMoc2VsZjogVmlld01vZGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHtzZWxmLnRlYXJkb3duLmNhbGwoc2VsZik7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGVhcmRvd24ob3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGU6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZSAmJlxuICAgICAgICAgICAgICAgICAgICAhb3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHRlYXJkb3duIEZyb250RW5kRnJhbWV3b3JrLk1pbmlIdG1sVmlld01vZGVsLlZpZXdNb2RlbCBpbnN0YW5jZSBkdWUgdG8gb2JqZWN0TGlmZUN5Y2xlIG5vdCBiZWluZyBvdmVycmlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5KS5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDbGVhbmluZyB1cCBldmVudCBoYW5kbGVycyBzZXQgdXAgaW4gVmlld01vZGVsIChpZDogJHtpZH0pYCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBiUCA9IHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHlbaWRdO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJQLmlkLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYm91bmRFdmVudEZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpKS5yZW1vdmVFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoYlAuYm91bmRFdmVudEZ1bmNzICE9IG51bGwpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChiUC5ib3VuZEV2ZW50RnVuY3MuY29uc3RydWN0b3IgPT09IEFycmF5KSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYlAuYm91bmRFdmVudEZ1bmNzLmxlbmd0aCA9PT0gKDxzdHJpbmdbXT5iUC5pZCkubGVuZ3RoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgaWR4ID0gKDxzdHJpbmdbXT5iUC5pZCkuaW5kZXhPZihpZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpZHggIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKSkucmVtb3ZlRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jc1tpZHhdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW50ZXJuYWwgaW52YXJpYW50IHZpb2xhdGVkIChndWlkOiBEdHNhNDMyNTJ4eHEpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdJbnRlcm5hbCBpbnZhcmlhbnQgdmlvbGF0ZWQgKGd1aWQ6IHB0YTQyM3RhRFREKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hY2NlcHRhYmxlIGlkIGRldGVjdGVkIGluIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U6ICR7YlB9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyByZXRyaWV2ZUFuZFNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPihiUDogSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4sIHByb3BlcnR5SWQ6IHN0cmluZyk6IElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+IHtcbiAgICAgICAgICAgICAgICBpZiAoYlAuZ2V0RGF0YUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBiUC52YWx1ZSA9IGJQLmdldERhdGFGdW5jKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYlAudmFsdWUgPSAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJvcGVydHlJZCkpLnZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gYlA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgc3RhdGljIHNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPihiUDogSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VD4sIHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHZhciBjbnZydHIgPSBiUC5jb252ZXJ0ZXJGdW5jIHx8IGZ1bmN0aW9uKHgpIHsgcmV0dXJuIHg7IH07XG4gICAgICAgICAgICAgICAgaWYgKGJQLnNldERhdGFGdW5jID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQoJyMnICsgcHJvcGVydHlJZCkudmFsKGJQLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcm9wZXJ0eUlkKSkudmFsdWUgPSBjbnZydHIoYlAudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z0huZGwuJCkoJyMnICsgcHJvcGVydHlJZCkudmFsKGJQLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnNldERhdGFGdW5jKGNudnJ0cihiUC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPiBpbXBsZW1lbnRzIElWaWV3TW9kZWxQcm9wZXJ0eTxUPiB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGdldERhdGFGdW5jPzogKCgpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIG9uQ2hhbmdlRnVuYz86ICgodm06IFQpID0+IHZvaWQpLCAvLyBFaXRoZXIgaW1wbGVtZW50IG9uQ2hhbmdlIG9uIElWaWV3TW9kZWwgT1IgcHJvdmlkZSBvbkNoYW5nZUZ1bmNcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVUaW1lQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWUgPSA8QmluZGluZ01vZGUuT25lVGltZT5CaW5kaW5nTW9kZS5PbmVUaW1lO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQgPSA8QmluZGluZ01vZGUuT25lV2F5UmVhZD5CaW5kaW5nTW9kZS5PbmVXYXlSZWFkO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZSA9IDxCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZT5CaW5kaW5nTW9kZS5PbmVXYXlXcml0ZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuVHdvV2F5ID0gPEJpbmRpbmdNb2RlLlR3b1dheT5CaW5kaW5nTW9kZS5Ud29XYXk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG5cbi8vIFJlbGllcyBvbiAuL2Jhc2UuanMudHMgYmVjYXVzZSB0aGlzIGxpYnJhcnkgc2hvdWxkIGJlIGFibGUgdG8gdGFrZSBhZHZhbnRhZ2Ugb2YgVHVyYm9saW5rcyBub3QgcmVsb2FkaW5nIHBhZ2UuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBTdG9yYWdlIHtcbiAgICAgICAgZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnMC4xLjAnO1xuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiB7IFRyYW5zaWVudCwgU2Vzc2lvbiwgQWNyb3NzU2Vzc2lvbnMgfVxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlPzogYm9vbGVhbjtcbiAgICAgICAgICAgIGV4cGlyeURhdGU/OiBEYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGV4dGVuZHMgSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIHtcbiAgICAgICAgICAgIGluZGVmaW5pdGU/OiBib29sZWFuOyAvLyBNVVNUIEJFIGBmYWxzZWBcbiAgICAgICAgICAgIGV4cGlyeURhdGU6IERhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiBleHRlbmRzIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlOiBib29sZWFuOyAvLyBNVVNUIEJFIGB0cnVlYFxuICAgICAgICAgICAgZXhwaXJ5RGF0ZT86IERhdGU7IC8vICBJR05PUkVEXG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUV4cGlyaW5nQ2FjaGVEdXJhdGlvbiB7XG4gICAgICAgICAgICBwdWJsaWMgaW5kZWZpbml0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3RydWN0b3IocHVibGljIGV4cGlyeURhdGU6IERhdGUpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIEluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIHtcbiAgICAgICAgICAgIHB1YmxpYyBpbmRlZmluaXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGlzIG5lZWRlZCBmb3IgYnJvd3NlcnMgdGhhdCBzYXkgdGhhdCB0aGV5IGhhdmUgU2Vzc2lvblN0b3JhZ2UgYnV0IGluIHJlYWxpdHkgdGhyb3cgYW4gRXJyb3IgYXMgc29vblxuICAgICAgICAvLyBhcyB5b3UgdHJ5IHRvIGRvIHNvbWV0aGluZy5cbiAgICAgICAgbGV0IGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndGVzdGE4OTBhODA5JywgJ3ZhbCcpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgndGVzdGE4OTBhODA5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8gTm90aGluZyB0byBkby4uLlxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydCBjb25zdCBJc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlID0gaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZTtcblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2VQcm9maWxlIHtcbiAgICAgICAgICAgIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbltdO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIENsaWVudFN0b3JhZ2VQcm9maWxlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZVByb2ZpbGUge1xuICAgICAgICAgICAgcHVibGljIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBBcnJheTxEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj47XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzID0gW0RhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudF07XG4gICAgICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlR1cmJvbGlua3NBdmFpbGFibGUgfHwgRnJvbnRFbmRGcmFtZXdvcmsuU3RvcmFnZS5Jc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzLnB1c2goRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgc2V0OiAoKGtleTphbnksIHZhbDphbnkpID0+IHZvaWQpO1xuICAgICAgICAgICAgZ2V0OiAoKGtleTphbnkpID0+IGFueSk7XG4gICAgICAgIH1cbiAgICAgICAgLypcbiAgICAgICAgZXhwb3J0IGNsYXNzIFRyYW5zaWVudFN0b3JhZ2UgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXQoa2V5OmFueSwgdmFsOmFueSkgOiB2b2lkID0+IHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0KGtleTphbnkpIDogYW55ID0+IHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICBleHBvcnQgY2xhc3MgQ2xpZW50U3RvcmFnZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgcHVibGljIGNsaWVudFByb2ZpbGUgPSBuZXcgQ2xpZW50U3RvcmFnZVByb2ZpbGUoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHByaXZhdGUgZXJyb3JPbkZhaWwgPSBmYWxzZVxuICAgICAgICAgICAgKSB7IH1cblxuICAgICAgICAgICAgcHVibGljIHNldChrZXk6IGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsOiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uID0gRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24/OiBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdXBvbiBhZGRpbmcgc3VwcG9ydCBmb3IgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24gaWdub3JlZCBpbiBEYXRhYmFzZSNzZXQuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JPbkZhaWwpIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KGtleTogYW55LCBkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj86IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uKSA6IGFueXxudWxsfHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnM6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lcnJvck9uRmFpbCkgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBmb3JjZUNhY2hlRXhwaXJ5KGtleTogYW55KSB7IGNvbnNvbGUuZXJyb3IoYFVuaW1wbGVtZW50ZWQgRGF0YWJhc2UjZm9yY2VDYWNoZUV4cGlyeTogRmFpbGVkIHRvIGV4cGlyZSBrZXk6ICR7a2V5fWApOyB0aHJvdyBrZXk7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdG9yYWdlLmpzLnRzXCIvPlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIC8vIFZpc2l0cyBzaXRlIHVzaW5nIFR1cmJvbGlua3MgKG9yIGFub3RoZXIgU1BBIGZyYW1ld29yayB3aGVuIHN1cHBvcnQgaXMgYWRkZWQpIGlmIHBvc3NpYmxlLlxuICAgIC8vIFNob3VsZCBhbHdheXMgcmVzdWx0IGluIG9wZW5pbmcgZ2l2ZW4gbGluayAoaWYgZ2l2ZW4gYXJndW1lbnQgZm9yIGBsaW5rYCBpcyB2YWxpZCBVUkwpLlxuICAgIGV4cG9ydCBsZXQgdmlzaXRMaW5rID0gZnVuY3Rpb24obGluayA6IHN0cmluZywge2ZvcmNlUmVsb2FkLCBuZXdUYWJ9OiB7Zm9yY2VSZWxvYWQ/OiBib29sZWFuLCBuZXdUYWI/OiBib29sZWFufSA9IHtmb3JjZVJlbG9hZDogZmFsc2UsIG5ld1RhYjogZmFsc2V9KSB7XG4gICAgICAgIGlmICgobmV3VGFiICE9IG51bGwpICYmIDxib29sZWFuPm5ld1RhYikge1xuICAgICAgICAgICAgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmICEoKGZvcmNlUmVsb2FkICE9IG51bGwpICYmIDxib29sZWFuPmZvcmNlUmVsb2FkKSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICAgICAgICAgIGlmICgoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID09PVxuICAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rcykgJiZcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZihUdXJib2xpbmtzLnZpc2l0KSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgICAgICAgICAgVHVyYm9saW5rcy52aXNpdChsaW5rKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gbGluaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsZXQgY2xlYW51cEZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIC8vIE9ubHkgZXhlY3V0ZSBpbiBzaW5nbGUgcGFnZSBhcHBsaWNhdGlvbnMgKGluIG90aGVyIGNhc2UsIHBhZ2Ugd291bGQgYmUgcmVzZXQgYW55d2F5cylcbiAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbikge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjbGVhbnVwSG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0cnkgeyBjbGVhbnVwSG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHByZVJlYWR5RnVuYyA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcmVSZWFkeUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cnkgeyBwcmVSZWFkeUhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBwb3N0UmVhZHlGdW5jID0gKCkgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvc3RSZWFkeUhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0cnkgeyBwb3N0UmVhZHlIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uID0ge307XG4gICAgfTtcblxuICAgIGV4cG9ydCBuYW1lc3BhY2UgUHViU3ViIHtcbiAgICAgICAgaW50ZXJmYWNlIFB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm8gZXh0ZW5kcyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHN1YnNjcmliZXJJZGVudGlmaWVyOiBzdHJpbmc7XG4gICAgICAgICAgICBzdWJzY3JpYmVyU2V0dGVyOiAoKG1lc3NhZ2U6YW55KSA9PiB2b2lkKXxudWxsfHVuZGVmaW5lZDtcbiAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXkgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHB1YmxpYyBzdGF0aWMgRGVmYXVsdE9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQ7XG4gICAgICAgICAgICBwdWJsaWMgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjogc3RyaW5nO1xuICAgICAgICAgICAgcHJpdmF0ZSBwdWJTdWJSZWxheVN1YnNjcmliZXJzOiBQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvW10gPSBbXTtcbiAgICAgICAgICAgIHByaXZhdGUgbGFzdFNlbnRNZXNzYWdlOiBhbnk7IC8vIFRvIGJlIHJlLWJyb2FkY2FzdCBhZnRlciBuYXZpZ2F0aW5nIHBhZ2VzXG4gICAgICAgICAgICBwcml2YXRlIGZpcnN0TWVzc2FnZVNlbnRQOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyID0gc3Vic2NyaXB0aW9uSWRlbnRpZmllcjtcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IFB1YlN1YlJlbGF5LkRlZmF1bHRPYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBhZGRTdWJzY3JpYmVyKHN1YnNjcmliZXJJbmZvOlB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm8pIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgaWYgKHN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoPG51bWJlcj50aGlzLm9iamVjdExpZmVDeWNsZSkgPCAoPG51bWJlcj5zdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IHN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV0uc3Vic2NyaWJlcklkZW50aWZpZXIgPT09XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVySW5mby5zdWJzY3JpYmVySWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBDYW5ub3Qgc3Vic2NyaWJlIG1vcmUgdGhhbiBvbmNlIHRvICgke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn0pIHdpdGggKCR7c3Vic2NyaWJlckluZm8uc3Vic2NyaWJlcklkZW50aWZpZXJ9KS5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5wdXNoKHN1YnNjcmliZXJJbmZvKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHJlbGF5TWVzc2FnZShzZW5kaW5nU3Vic2NyaWJlcklkZW50aWZpZXI6c3RyaW5nLCBtZXNzYWdlOmFueSkge1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBSZWxheWluZyBtZXNzYWdlIGZyb20gUHViU3ViUmVsYXkjcmVsYXlNZXNzYWdlIGZvciBzdWJzY3JpcHRpb246ICR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfX1gKVxuICAgICAgICAgICAgICAgIHRoaXMubGFzdFNlbnRNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgICAgICB0aGlzLmZpcnN0TWVzc2FnZVNlbnRQID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVsZXZhbnRTdWJzY3JpYmVyID0gdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUHJpbnRpbmcgJHtpfS10aCByZWxldmFudFN1YnNjcmliZXJgKTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8ocmVsZXZhbnRTdWJzY3JpYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllciAhPT1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbmRpbmdTdWJzY3JpYmVySWRlbnRpZmllcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZXMgdGhhdCBhIHRyaWdnZXIgY2hhbmdlIGV2ZW50IHNob3VsZCBub3QgYmUgZmlyZWQgb24gc2V0dGluZyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHN1YnNjcmliZXJTZXR0ZXIgYXJnIHdoZW4gc3Vic2NyaWJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgU2V0dGluZyB2YWx1ZSAoJHttZXNzYWdlfSkgZm9yICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfSBpZC5gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBSZXBsYWNlczogJChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1zT2ZJbnRlcmVzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgZWxlbXNPZkludGVyZXN0Lmxlbmd0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1lc3NhZ2UuY29uc3RydWN0b3IgPT09IEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgU29tZXRoaW5nIHByb2JhYmx5IGlzIG5vdCBnb2luZyB0byB3b3JrIGFzIHBsYW5uZWQgaW4gc2V0dGluZyB2YWx1ZXMgKCR7bWVzc2FnZX0pIGZvciBlbGVtZW50IHdpdGggaWQ6ICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbXNPZkludGVyZXN0W3hdKS52YWx1ZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSgpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuZmlyc3RNZXNzYWdlU2VudFApIHJldHVybjtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUmVsYXlpbmcgbWVzc2FnZSBmcm9tIFB1YlN1YlJlbGF5I3JlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlIGZvciBzdWJzY3JpcHRpb246ICR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfX1gKVxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWxldmFudFN1YnNjcmliZXIgPSB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZihyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcih0aGlzLmxhc3RTZW50TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZXMgdGhhdCBhIHRyaWdnZXIgY2hhbmdlIGV2ZW50IHNob3VsZCBub3QgYmUgZmlyZWQgb24gc2V0dGluZyB2YWx1ZS5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugc3Vic2NyaWJlclNldHRlciBhcmcgd2hlbiBzdWJzY3JpYmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYFNldHRpbmcgdmFsdWUgKCR7dGhpcy5sYXN0U2VudE1lc3NhZ2V9KSBmb3IgJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9IGlkLmApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwodGhpcy5sYXN0U2VudE1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxlbXNPZkludGVyZXN0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGVsZW1zT2ZJbnRlcmVzdC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGFzdFNlbnRNZXNzYWdlLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgU29tZXRoaW5nIHByb2JhYmx5IGlzIG5vdCBnb2luZyB0byB3b3JrIGFzIHBsYW5uZWQgaW4gc2V0dGluZyB2YWx1ZXMgKCR7dGhpcy5sYXN0U2VudE1lc3NhZ2V9KSBmb3IgZWxlbWVudCB3aXRoIGlkOiAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5lbGVtc09mSW50ZXJlc3RbeF0pLnZhbHVlID0gdGhpcy5sYXN0U2VudE1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbCh0aGlzLmxhc3RTZW50TWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIFNob3J0LWNpcmN1aXQgaWYgaXRlbSB3aWxsIGJlIFB1YlN1YlJlbGF5IGl0c2VsZiB3aWxsIGJlIGRlc3Ryb3llZCBhbnl3YXlzXG5cbiAgICAgICAgICAgICAgICBsZXQgdG9SZW1vdmUgOiBudW1iZXJbXSA9IFtdOyAvLyBpbmRpY2VzICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMpIG9mIHN1YnNjcmliZXJzIHRvIHJlbW92ZVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXS5vYmplY3RMaWZlQ3ljbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlICh0b1JlbW92ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLnNwbGljZSg8bnVtYmVyPnRvUmVtb3ZlLnBvcCgpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheVN0b3JhZ2UgaW1wbGVtZW50cyBTdG9yYWdlLklLZXlWYWx1ZVN0b3JhZ2UsIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgLy8gVE9ETzogQWxsb3cgdGhlIFB1YlN1YlJlbGF5U3RvcmFnZSB0byBoYXZlIGEgdHJhbnNpZW50IG9iamVjdCBsaWZlIGN5Y2xlXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwcml2YXRlIG1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXM6IGFueTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5fG51bGx8dW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgc2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLCBwdWJTdWJSZWxheTogUHViU3ViUmVsYXkpIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdID0gcHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBrZXlzVG9EZWxldGUgOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cykuZm9yRWFjaCgoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5SW5zdGFuY2UgPSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl07XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5SW5zdGFuY2UuaGFuZGxlTmF2aWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwdWJTdWJSZWxheUluc3RhbmNlLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHB1YlN1YlJlbGF5SW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNUb0RlbGV0ZS5wdXNoKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c1RvRGVsZXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNba2V5c1RvRGVsZXRlW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCkgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMpLmZvckVhY2goKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXS5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXlNYW5hZ2VyIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEFsbG93IHRoZSBQdWJTdWJSZWxheU1hbmFnZXIgdG8gaGF2ZSBhIHRyYW5zaWVudCBvYmplY3QgbGlmZSBjeWNsZVxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHJpdmF0ZSBwdWJTdWJSZWxheVN0b3JhZ2U6IFB1YlN1YlJlbGF5U3RvcmFnZSA9IG5ldyBQdWJTdWJSZWxheVN0b3JhZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5jbGVhbnVwSG9va3MpLnB1c2godGhpcy5nZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+cG9zdFJlYWR5SG9va3MpLnB1c2godGhpcy5nZW5SZWJyb2FkY2FzdExhc3RNZXNzYWdlc0Z1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5oYW5kbGVOYXZpZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlcygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5yZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmMoc2VsZjogUHViU3ViUmVsYXlNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuaGFuZGxlTmF2aWdhdGlvbi5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblJlYnJvYWRjYXN0TGFzdE1lc3NhZ2VzRnVuYyhzZWxmOiBQdWJTdWJSZWxheU1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZXMuYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBzZWxmSWRlbnRpZmllcjpzdHJpbmcsIC8vIHNob3VsZCBiZSBhIENTUyBzZWxlY3RvciAoSlF1ZXJ5IHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIHNlbGZTZXR0ZXI6KChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2VlIGlmIGdpdmVuIGBvYmplY3RMaWZlQ3ljbGVgIGlzIGdyZWF0ZXIgdGhhbiBkZXNpZ25hdGVkIG9iamVjdExpZmVDeWNsZSxcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcywgY2hhbmdlIGhvdyBpdCBpcyBtYW5hZ2VkIChub3QgcmVsZXZhbnQgdW50aWwgb2JqZWN0IGxpZmUgY3ljbGUgb3RoZXJcbiAgICAgICAgICAgICAgICAvLyB0aGFuIEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlIGlzIHN1cHBvcnRlZCkuXG5cbiAgICAgICAgICAgICAgICAoPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5KS5hZGRTdWJzY3JpYmVyKHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcklkZW50aWZpZXI6IHNlbGZJZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyU2V0dGVyOiBzZWxmU2V0dGVyLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlUHVibGlzaGVkTWVzc2FnZShcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOmFueVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5LnJlbGF5TWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBoYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5IHtcbiAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXkgOiBQdWJTdWJSZWxheXxudWxsfHVuZGVmaW5lZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHB1YiBzdWIgcmVsYXkgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgICAgICAgICAgICAgICBpZiAoKHB1YlN1YlJlbGF5ID0gdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UuZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5ID0gbmV3IFB1YlN1YlJlbGF5KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5zZXQoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiA8UHViU3ViUmVsYXk+cHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbnRlcm5hbCBsaWJyYXJ5IHN0YXRlXG4gICAgICAgIC8vIFRPRE86IE1hbmFnZSBpbnRlcm5hbCBsaWJyYXJ5IHN0YXRlIHdpdGhvdXQgdXNpbmcgZ2xvYmFsc1xuICAgICAgICBsZXQgcHViU3ViUmVsYXlNYW5hZ2VyIDogUHViU3ViUmVsYXlNYW5hZ2VyID0gbmV3IFB1YlN1YlJlbGF5TWFuYWdlcigpOztcblxuICAgICAgICAvLyBUcmVhdCB0aGUgZmlyc3QgdHdvIGFyZ3VtZW50cyB0byB0aGlzIGZ1bmN0aW9uIGFzIGJlaW5nIG1vcmUgYSBwYXJ0IG9mIGEgc3RhYmxlXG4gICAgICAgIC8vIEFQSSB2cyB0aGUgdGhlIHRoaXJkIGFuZCBmb3VydGggYXJndW1lbnRzIHdoaWNoIGFyZSBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgZXhwb3J0IGxldCBzdWJzY3JpYmUgPSAoXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgIHNlbGZJZGVudGlmaWVyOnN0cmluZywgLy8gc2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yIChKUXVlcnkgc2VsZWN0b3IpIHVubGVzcyBwcm92aWRpbmcgYHNlbGZTZXR0ZXJgIGFyZ3VtZW50XG4gICAgICAgICAgICBzZWxmU2V0dGVyOigobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICApIDogYW55fHZvaWQgPT4ge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oXCJQcmludGluZyBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIuc3Vic2NyaWJlIGFyZ3NcIik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZJZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZTZXR0ZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8ob2JqZWN0TGlmZUN5Y2xlKTtcbiAgICAgICAgICAgIHB1YlN1YlJlbGF5TWFuYWdlci5oYW5kbGVTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgc2VsZklkZW50aWZpZXIsIHNlbGZTZXR0ZXIsIG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBsZXQgcHVibGlzaCA9IChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZywgbWVzc2FnZTphbnkpID0+IHtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiUHJpbnRpbmcgRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLnB1Ymxpc2ggYXJnc1wiKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8obWVzc2FnZSk7XG4gICAgICAgICAgICBwdWJTdWJSZWxheU1hbmFnZXIuaGFuZGxlUHVibGlzaGVkTWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzYWdlOiBEdXJpbmcgaW5pdGlhbGl6YXRpb24gc3Vic2NyaWJlIGJlZm9yZSBwb3N0LWhvb2tzIChwcmVmZXJhYmx5IHByZS1ob29rcykgYW5kIHB1Ymxpc2ggaW4gcG9zdC1ob29rcy5cblxuICAgICAgICAvLyBBc3N1bWVkIHRvIGJlIGNvbnN0cnVjdGVkIGluIHByZS1ob29rXG4gICAgICAgIGV4cG9ydCBjbGFzcyBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFN1cHBvcnQgb3RoZXIgb2JqZWN0IGxpZmUgY3ljbGVzXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwdWJsaWMgc3RvcmFnZUtleTogc3RyaW5nO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUtleTpzdHJpbmcsXG4gICAgICAgICAgICAgICAgcHVibGlzaEV4aXN0aW5nU3RvcmVkVmFsdWU6Ym9vbGVhbiA9IHRydWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZUtleSA9IHN0b3JhZ2VLZXk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTaG9ydC1DaXJjdWl0IGlmIHNlc3Npb24gc3RvcmFnZSBub3QgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgaWYgKCFTdG9yYWdlLklzU2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FiYW5kb25pbmcgUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyIGluaXRpYWxpemF0aW9uIHNpbmNlIHNlc3Npb24gc3RvcmFnZSBpcyBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICBsZXQgaW5pdGlhbFN0b3JlZFZhbHVlID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsU3RvcmVkVmFsdWUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoRXhpc3RpbmdTdG9yZWRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgaG9va3MucG9zdC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgaW5pdGlhbFN0b3JlZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmModmFsOmFueSkge1xuICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0odGhpcy5zdG9yYWdlS2V5LCB2YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyhzZWxmOiBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKG1lc3NhZ2U6YW55KSA9PiB7c2VsZi5zdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jLmNhbGwoc2VsZiwgbWVzc2FnZSk7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1lZCB0byBiZSBjb25zdHJ1Y3RlZCBpbiBwcmUtaG9va1xuICAgICAgICBleHBvcnQgY2xhc3MgSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBzdWJzY3JpcHRpb25JZGVudGlmaWVyIDogc3RyaW5nO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBodG1sSWQgOiBzdHJpbmc7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb25DaGFuZ2VGdW5jIDogKCgpID0+IHZvaWQpfG51bGw7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgcHVibGlzaFZhbHVlUHJlZGljYXRlIDogYm9vbGVhbjtcbiAgICAgICAgICAgIHByaXZhdGUgX3B1Ymxpc2hPbkNoYW5nZUZ1bmM/OiAoKGV2OiBFdmVudCkgPT4gdm9pZCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBodG1sSWQ6c3RyaW5nLFxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlRnVuYzooKCkgPT4gdm9pZCl8bnVsbCA9IG51bGwsXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCxcbiAgICAgICAgICAgICAgICBwdWJsaXNoVmFsdWVQcmVkaWNhdGU6Ym9vbGVhbiA9IGZhbHNlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIgPSBzdWJzY3JpcHRpb25JZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbElkID0gaHRtbElkO1xuICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jID0gb25DaGFuZ2VGdW5jO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMucHVibGlzaFZhbHVlUHJlZGljYXRlID0gcHVibGlzaFZhbHVlUHJlZGljYXRlO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCB2YWx1ZSB3aGVuIGFwcHJvcHJpYXRlXG4gICAgICAgICAgICAgICAgaWYgKHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZSAmJlxuICAgICAgICAgICAgICAgICAgICAoKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzLnBvc3QucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTdWJzY3JpYmVcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIGAjJHtodG1sSWR9YCxcbiAgICAgICAgICAgICAgICAgICAgKG1lc3NhZ2U6YW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGdIbmRsLiQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQoYCMke2h0bWxJZH1gKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1zT2ZJbnRlcmVzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYCMke2h0bWxJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGVsZW1zT2ZJbnRlcmVzdC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbXNPZkludGVyZXN0W3hdKS52YWx1ZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5nSG5kbC4kKShgIyR7aHRtbElkfWApLnZhbChtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25DaGFuZ2VGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT50aGlzLm9uQ2hhbmdlRnVuYykoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jID0gKChfZXY6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5odG1sSWQpKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluICgke2h0bWxJZH0pOiAkeyg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZX1gKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuICAgICAgICAgICAgICAgICAgICB9IC8vIGVsc2UgeyBjb25zb2xlLmluZm8oJ0RpZCBub3QgZmlyZSBudWxsIG9uQ2hhbmdlRnVuYycpIH1cbiAgICAgICAgICAgICAgICB9KS5iaW5kKHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCBvbiBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS5hZGRFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPCgoZXY6IEV2ZW50KSA9PiB2b2lkKT50aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jKSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgICAgIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5wdXNoKHRoaXMuZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyhzZWxmOiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyaWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi5oYW5kbGVOYXZpZ2F0aW9uLmNhbGwoc2VsZik7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZWFyZG93bihvdmVycmlkZU9iamVjdExpZmVDeWNsZTpib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlICYmXG4gICAgICAgICAgICAgICAgICAgICFvdmVycmlkZU9iamVjdExpZmVDeWNsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gdGVhcmRvd24gRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLkh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JiZXIgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENsZWFuaW5nIHVwIGV2ZW50IGhhbmRsZXJzIHNldCB1cCBpbiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyYmVyIChpZDogJHt0aGlzLmh0bWxJZH0pYCk7XG4gICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQoJyMnICsgdGhpcy5odG1sSWQpLm9mZihGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHMpO1xuICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5odG1sSWQpKS5yZW1vdmVFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPCgoZXY6IEV2ZW50KSA9PiB2b2lkKT50aGlzLl9wdWJsaXNoT25DaGFuZ2VGdW5jKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBSRUFEWV9GVU5DID0gKCkgPT4ge1xuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wcmUgQXJyYXlcbiAgICAgICAgd2hpbGUgKGhvb2tzLnByZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT5ob29rcy5wcmUuc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHsgcHJlUmVhZHlGdW5jKCk7IH1cbiAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG5cbiAgICAgICAgaWYgKChGcm9udEVuZEZyYW1ld29yay5yZWFkeUZ1bmMgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICh0eXBlb2YoRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7IHBvc3RSZWFkeUZ1bmMoKTsgfVxuICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cblxuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wb3N0IEFycmF5XG4gICAgICAgIHdoaWxlIChob29rcy5wb3N0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPmhvb2tzLnBvc3Quc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHN3aXRjaCAoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uKSB7XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rczpcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6bG9hZCcsIFJFQURZX0ZVTkMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uTm9GcmFtZXdvcms6XG4gICAgICAgIGNhc2UgRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uV2luZG93c1VXUDpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBSRUFEWV9GVU5DKTtcbiAgICB9XG5cbiAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuUnVudGltZVN1cHBvcnRlZEludGVncmF0aW9uID09PSBGcm9udEVuZEZyYW1ld29yay5TdXBwb3J0ZWRJbnRlZ3JhdGlvbi5UdXJib2xpbmtzICYmXG4gICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5UdXJib2xpbmtzQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInLCBjbGVhbnVwRnVuYyk7XG4gICAgICAgICAgICBpZiAoaG9va3MucGFnZUNsZWFudXAgIT0gbnVsbClcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucGFnZUNsZWFudXAgQXJyYXlcbiAgICAgICAgICAgICAgICAgICAgd2hpbGUgKCg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPig8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKChjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyAhPSBudWxsKSAmJiAodHlwZW9mKGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jKSA9PT0gJ2Z1bmN0aW9uJykpXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczp2aXNpdCcsIGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vPSByZXF1aXJlIC4vYmFzZVxuLy89IHJlcXVpcmUgLi9zY3JlZW5fcmVzb2x1dGlvbnNcbi8vPSByZXF1aXJlIC4vbWluaV9odG1sX3ZpZXdfbW9kZWxcbi8vPSByZXF1aXJlIC4vc3RvcmFnZVxuLy89IHJlcXVpcmUgLi9jb3JlXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zY3JlZW5fcmVzb2x1dGlvbnMuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9taW5pX2h0bWxfdmlld19tb2RlbC5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3N0b3JhZ2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9jb3JlLmpzLnRzXCIvPlxuXG4vLyBOb3RlIHRoYXQgdGhlIGFib3ZlIHJlZmVyZW5jZXMgZG8gbm90IHdvcmsgaWYgeW91IGhhdmUgdGhlIFR5cGVTY3JpcHQgY29tcGlsZXIgc2V0IHRvIHJlbW92ZSBjb21tZW50cy5cbi8vIFVzZSBzb21ldGhpbmcgbGlrZSB0aGUgdWdsaWZpZXIgZ2VtIGZvciByZW1vdmluZyBjb21tZW50cy9vYmZ1c2NhdGlvbi5cblxuLy8gVGhlIGxvYWQgb3JkZXIgY3VycmVudGx5IG1hdHRlcnMuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7IGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuNi4xMSc7IH1cbiJdfQ==