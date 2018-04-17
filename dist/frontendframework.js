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
        MiniHtmlViewModel.VERSION = '0.6.2';
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
    FrontEndFramework.VERSION = '0.6.12';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQ0EsK0ZBQStGO0FBQy9GLDhFQUE4RTtBQUk5RSxJQUFVLGlCQUFpQixDQXlFMUI7QUF6RUQsV0FBVSxpQkFBaUI7SUFxQlosdUJBQUssR0FBa0IsTUFBTSxDQUFDO0lBUXhDLENBQUM7SUFFVyx1Q0FBcUIsR0FBRyx3QkFBd0IsQ0FBQztJQVU3RCxDQUFDO0lBTUQsQ0FBQztJQUNGLG1EQUFtRDtJQUN0Qyx1Q0FBcUIsR0FBRyxDQUFDLE9BQU8sa0JBQUEsS0FBSyxDQUFDLE9BQU8sS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFBLEtBQUssQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLENBQUM7SUFDMUYscUNBQW1CLEdBQUcsQ0FBQyxPQUFPLFVBQVUsS0FBSyxXQUFXLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsQ0FBQztJQUNsRix1Q0FBcUIsR0FBRyxrQkFBQSxtQkFBbUIsQ0FBQztJQUU5Qyw2Q0FBMkIsc0JBQTBELENBQUM7SUFF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a0I7QUFFbEIsb0NBQW9DO0FBQ3BDLGtEQUFrRDtBQUNsRCxvREFBb0Q7QUFDcEQsdUNBQXVDO0FBQ3ZDLG9DQUFvQztBQUVwQyx5R0FBeUc7QUFDekcseUVBQXlFO0FBRXpFLG9DQUFvQztBQUVwQyxJQUFVLGlCQUFpQixDQUFxQztBQUFoRSxXQUFVLGlCQUFpQjtJQUFnQix5QkFBTyxHQUFHLFFBQVEsQ0FBQztBQUFDLENBQUMsRUFBdEQsaUJBQWlCLEtBQWpCLGlCQUFpQixRQUFxQyIsInNvdXJjZXNDb250ZW50IjpbIlxuLy8gVGhpcyBmaWxlIGNvbnRhaW5zIHR5cGVzIGFuZCBpbnRlcm5hbCBzdGF0ZSB1c2VkIGJ5IHRoZSBmcmFtZXdvcmsgdGhhdCBpbmRpdmlkdWFsIGNvbXBvbmVudHNcbi8vIGluIHRoZSBsaWJyYXJ5IG5lZWQga25vd2xlZGdlIG9mIHN1Y2ggYXMgRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlxuXG5kZWNsYXJlIHZhciBUdXJib2xpbmtzIDogYW55O1xuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIC8vIEhhcyBhIGRlcGVuZGVuY3kgb24gSlF1ZXJ5LiBTaG91bGQgYmUgbG9hZGVkIGFmdGVyIFR1cmJvbGlua3MgdG8gcmVnaXN0ZXJcbiAgICAvLyBjbGVhbnVwRnVuYyBvbiAndHVyYm9saW5rczpiZWZvcmUtcmVuZGVyJyBldmVudC5cbiAgICBleHBvcnQgaW50ZXJmYWNlIEdsb2JhbEhhbmRsZSBleHRlbmRzIFdpbmRvdyB7XG4gICAgICAgIFdpbmRvd3M/OiBhbnk7XG4gICAgICAgICQ/OiBhbnk7XG4gICAgfVxuXG4gICAgLy8gQWRkIHRoZSBzY3JpcHQgdGFnIGJlbG93IGluIHRoZSBoZWFkZXIgb2YgeW91ciBwYWdlOlxuICAgIC8vIDxzY3JpcHQ+IFwidXNlIHN0cmljdFwiOyB2YXIgZ0huZGwgPSB0aGlzOyB2YXIgc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uID0ge307IHZhciBob29rcyA9IHsgcHJlOiBbXSwgcG9zdDogW10sIHBhZ2VDbGVhbnVwOiBbXSB9OyA8L3NjcmlwdD5cbiAgICBleHBvcnQgZGVjbGFyZSB2YXIgaG9va3MgOiB7XG4gICAgICAgIC8vIEludm9rZWQgYWZ0ZXIgZG9jdW1lbnQgaXMgcmVhZHkgKGJ1dCBiZWZvcmUgTWluaUh0bWxWaWV3TW9kZWwucmVhZHlGdW5jKVxuICAgICAgICBwcmU6ICgoKSA9PiB2b2lkKVtdLFxuXG4gICAgICAgIC8vIEludm9rZWQgYWZ0ZXIgZG9jdW1lbnQgaXMgcmVhZHkgKGJ1dCBhZnRlciBNaW5pSHRtbFZpZXdNb2RlbC5yZWFkeUZ1bmMpXG4gICAgICAgIHBvc3Q6ICgoKSA9PiB2b2lkKVtdLFxuXG4gICAgICAgIC8vIEV4cGVyaW1lbnRhbDogT25seSBtYWtlcyBzZW5zZSBpZiB1c2VkIHdpdGggVHVyYm9saW5rc1xuICAgICAgICBwYWdlQ2xlYW51cD86ICgoKSA9PiB2b2lkKVtdXG4gICAgfTtcblxuICAgIGV4cG9ydCBsZXQgZ0huZGwgOiBHbG9iYWxIYW5kbGUgPSB3aW5kb3c7XG4gICAgZXhwb3J0IGRlY2xhcmUgdmFyIHN0YXRlVG9DbGVhck9uTmF2aWdhdGlvbiA6IGFueTtcblxuICAgIC8vIEEgcGFydCBvZiB0aGUgU1BBIHN1cHBwb3J0XG4gICAgZXhwb3J0IGNvbnN0IGVudW0gT2JqZWN0TGlmZUN5Y2xlIHtcbiAgICAgICAgVHJhbnNpZW50ID0gMCwgLy8gT25seSBmb3Igc2luZ2xlIHBhZ2UsIG9iamVjdCBzaG91bGQgYXV0b21hdGljYWxseSBiZSBkZXN0cm95ZWQgd2hlbiBuYXZpZ2F0aW5nIGZyb20gcGFnZVxuICAgICAgICBWYXJpYWJsZVBlcnNpc3RlbmNlID0gMSwgLy8gTGlmZXRpbWUgaXMgbWFuYWdlZCBtYW51YWxseSAoc2hvdWxkIG5vdCBiZSBhdXRvbWF0aWNhbGx5IGRlc3Ryb3llZCB3aGVuIG5hdmlnYXRpbmcgcGFnZXMpXG4gICAgICAgIEluZmluaXRlUGVyc2lzdGVuY2UgPSAyIC8vIE5vdCB0byBiZSBkZXN0cm95ZWQgKGludGVuZGVkIHRvIGJlIHBlcnNpc3RlbnQgYWNyb3NzIHBhZ2UgbmF2aWdhdGlvbilcbiAgICB9O1xuXG4gICAgZXhwb3J0IGNvbnN0IEh0bWxJbnB1dENoYW5nZUV2ZW50cyA9ICdjaGFuZ2UgdGV4dElucHV0IGlucHV0JztcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgIG9iamVjdExpZmVDeWNsZT86IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICB9XG5cbiAgICBleHBvcnQgY29uc3QgZW51bSBTdXBwb3J0ZWRJbnRlZ3JhdGlvbiB7XG4gICAgICAgIE5vRnJhbWV3b3JrID0gMCxcbiAgICAgICAgVHVyYm9saW5rcyA9IDEsXG4gICAgICAgIFdpbmRvd3NVV1AgPSAyXG4gICAgfTtcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgU3VwcG9ydGVkSW50ZWdyYXRpb25NZXRhZGF0YSB7XG4gICAgICAgIHN1cHBvcnRlZEludGVncmF0aW9uOiBTdXBwb3J0ZWRJbnRlZ3JhdGlvbjtcbiAgICAgICAgc2luZ2xlUGFnZUFwcGxpY2F0aW9uU3VwcG9ydDogYm9vbGVhbjtcbiAgICAgICAgcGFnZVByZUNhY2hlRXZlbnQ/OiBzdHJpbmd8bnVsbDsgLy8gUHJvYmFibHkgZ29pbmcgdG8gYmUgcmVtb3ZlZFxuICAgIH07XG4gICAgLy8gVE9ETzogQWRkIHN1cHBvcnQgZm9yIG90aGVyIFNQQSBmcmFtZXdvcmtzIGhlcmUuXG4gICAgZXhwb3J0IGNvbnN0IFdpbmRvd3NVd3BFbnZpcm9ubWVudCA9ICh0eXBlb2YgZ0huZGwuV2luZG93cyAhPT0gJ3VuZGVmaW5lZCcpICYmIChnSG5kbC5XaW5kb3dzICE9IG51bGwpO1xuICAgIGV4cG9ydCBjb25zdCBUdXJib2xpbmtzQXZhaWxhYmxlID0gKHR5cGVvZiBUdXJib2xpbmtzICE9PSAndW5kZWZpbmVkJykgJiYgKFR1cmJvbGlua3MgIT0gbnVsbCk7XG4gICAgZXhwb3J0IGNvbnN0IFNpbmdsZVBhZ2VBcHBsaWNhdGlvbiA9IFR1cmJvbGlua3NBdmFpbGFibGU7XG5cbiAgICBleHBvcnQgbGV0IFJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA6IFN1cHBvcnRlZEludGVncmF0aW9uID0gU3VwcG9ydGVkSW50ZWdyYXRpb24uTm9GcmFtZXdvcms7XG5cbiAgICAvLyBUT0RPOiBTdXBwb3J0IFR1cmJvbGlua3MgaW4gV2luZG93cyBVV1AgRW52aXJvbm1lbnRcbiAgICBpZiAoV2luZG93c1V3cEVudmlyb25tZW50KSB7XG4gICAgICAgIFJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA9IFN1cHBvcnRlZEludGVncmF0aW9uLldpbmRvd3NVV1A7XG4gICAgfSBlbHNlIGlmIChUdXJib2xpbmtzQXZhaWxhYmxlKSB7XG4gICAgICAgIFJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA9IFN1cHBvcnRlZEludGVncmF0aW9uLlR1cmJvbGlua3M7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogQWRkIHN1cHBvcnQgZm9yIG90aGVyIFNQQSBmcmFtZXdvcmtzIGhlcmUuXG4gICAgZXhwb3J0IGxldCBQYWdlUHJlQ2FjaGVFdmVudDogc3RyaW5nfG51bGwgPSBUdXJib2xpbmtzQXZhaWxhYmxlID8gJ3R1cmJvbGlua3M6YmVmb3JlLWNhY2hlJyA6IG51bGw7XG5cbiAgICAvLyBUbyBiZSBzZXQgYnkgdXNlciAoZmlyZWQgd2hlbiBET00gaXMgcmVhZHkpXG4gICAgZXhwb3J0IGxldCByZWFkeUZ1bmMgOiAoKCkgPT4gdm9pZCl8bnVsbCA9IG51bGw7XG5cbiAgICAvLyBGb3IgdXNlcnMgdG8gc3VwcGx5IGhvb2tzIChsYW1iZGEgZnVuY3Rpb25zKSB0aGF0IHRoZXkgd2FudCB0byBmaXJlIG9uIGVhY2ggbmF2aWdhdGlvbiAobm90ZVxuICAgIC8vIHRoYXQgdGhlc2UgYXJyYXlzIGFyZSBub3QgZW1wdGllZCBhcyBleGVjdXRlZCkuXG4gICAgZXhwb3J0IGxldCBjbGVhbnVwSG9va3MgOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICAgIGV4cG9ydCBsZXQgcHJlUmVhZHlIb29rcyA6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gICAgZXhwb3J0IGxldCBwb3N0UmVhZHlIb29rcyA6ICgoKSA9PiB2b2lkKVtdID0gW107XG59XG4iLCJcbi8vIERvZXMgbm90IHJlYWxseSBkZXBlbmQgb24gYW55dGhpbmdcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG5leHBvcnQgbmFtZXNwYWNlIFNjcmVlbkRpbWVuc2lvbnMge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgU2NyZWVuRGltZW5zaW9ucyB7XG4gICAgICAgIGF2YWlsYWJsZUhlaWdodCA6IG51bWJlcjtcbiAgICAgICAgYXZhaWxhYmxlV2lkdGggOiBudW1iZXI7XG4gICAgICAgIGRldmljZUhlaWdodCA6IG51bWJlcjtcbiAgICAgICAgZGV2aWNlV2lkdGggOiBudW1iZXI7XG4gICAgfVxuXG4gICAgZXhwb3J0IHZhciBHZXRTY3JlZW5EaW1lbnNpb25zID0gZnVuY3Rpb24oKSA6IFNjcmVlbkRpbWVuc2lvbnMge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYXZhaWxhYmxlSGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmF2YWlsSGVpZ2h0LFxuICAgICAgICAgICAgYXZhaWxhYmxlV2lkdGg6IHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aCxcbiAgICAgICAgICAgIGRldmljZUhlaWdodDogd2luZG93LnNjcmVlbi5oZWlnaHQsXG4gICAgICAgICAgICBkZXZpY2VXaWR0aDogd2luZG93LnNjcmVlbi53aWR0aFxuICAgICAgICB9O1xuICAgIH1cbn1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIiAvPlxuXG4vLyBEZXBlbmRzIG9uIEpRdWVyeVxuLy8gRGVwZW5kcyBvbiAuL2Jhc2UuanMudHMgZHVlIHRvIHRoZSBmYWN0IHRoYXQgdGhlIGZ1dHVyZSBJVXNlckludGVyZmFjZUVsZW1lbnQgbWlnaHQgcmVseSBvbiBjbGVhbnVwSG9va3Ncbi8vIGZvciB0ZWFyZG93biBsb2dpYy5cblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICBleHBvcnQgbmFtZXNwYWNlIE1pbmlIdG1sVmlld01vZGVsIHtcbiAgICAgICAgZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnMC42LjInO1xuXG4gICAgICAgIGV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdNb2RlIHsgT25lVGltZSwgT25lV2F5UmVhZCwgT25lV2F5V3JpdGUsIFR3b1dheSB9O1xuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUIGV4dGVuZHMgVmlld01vZGVsPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGU7XG4gICAgICAgICAgICByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdOyAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgIHZhbHVlPzogYW55OyAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICB2aWV3TW9kZWxSZWY/OiBUO1xuICAgICAgICAgICAgYm91bmRFdmVudEZ1bmM/OiBFdmVudExpc3RlbmVyO1xuICAgICAgICAgICAgYm91bmRFdmVudEZ1bmNzPzogRXZlbnRMaXN0ZW5lcltdO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8VD4ge1xuICAgICAgICAgICAgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCk7XG4gICAgICAgICAgICBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUPiB7XG4gICAgICAgICAgICBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpO1xuICAgICAgICAgICAgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCk7IC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiB7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGNhbiBiZSB0aG91Z2h0IG9mIGFzIHNldCB2YWx1ZSBvbmNlIGFuZCBmb3JnZXQgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBvciBJVmlld01vZGVsUHJvcGVydHkgc3RvcmVkKVxuICAgICAgICAvLyBWYWx1ZSBpcyBOT1QgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5UmVhZDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlIGlzIGEgd2F5IHRvIHNldCB2YWx1ZXMgKG5vIGV2ZW50IGhhbmRsZXJzIHNldCBidXQgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IGFyZSBzdG9yZWQpLlxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOkJpbmRpbmdNb2RlLk9uZVdheVdyaXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFNob3VsZCBpbmhlcml0IGZyb20gdGhpcyBjbGFzcyBpbnN0ZWFkIG9mIGluc3RhbnRpYXRpbmcgaXQgZGlyZWN0bHkuXG4gICAgICAgIGV4cG9ydCBhYnN0cmFjdCBjbGFzcyBWaWV3TW9kZWwgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHByb3RlY3RlZCBpZFRvQmluZGFibGVQcm9wZXJ0eTogeyBbaW5kZXg6IHN0cmluZ106IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPiB9O1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgQ2hhbmdlRXZlbnRzID0gRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzO1xuICAgICAgICAgICAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLFxuICAgICAgICAgICAgICAgIC4uLmJpbmRhYmxlUHJvcGVydGllczogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+W11cbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHkgPSB7fTtcbiAgICAgICAgICAgICAgICBiaW5kYWJsZVByb3BlcnRpZXMuZm9yRWFjaCh0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5LCB0aGlzKTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnB1c2godGhpcy5nZW5UZWFyZG93bkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJvdGVjdGVkIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5KGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGJQLmlkLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoYlApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJQLmlkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogKDxhbnk+YlApLmlkW2ldLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJpbmRpbmdNb2RlOiAoPGFueT5iUCkuYmluZGluZ01vZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICg8YW55PmJQKS52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXREYXRhRnVuYzogKDxhbnk+YlApLnNldERhdGFGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdldERhdGFGdW5jOiAoPGFueT5iUCkuZ2V0RGF0YUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2VGdW5jOiAoPGFueT5iUCkub25DaGFuZ2VGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnZlcnRlckZ1bmM6ICg8YW55PmJQKS5jb252ZXJ0ZXJGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXdNb2RlbFJlZjogKDxhbnk+YlApLnZpZXdNb2RlbFJlZlxuICAgICAgICAgICAgICAgICAgICAgICAgfSBhcyBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWNjZXB0YWJsZSBpZCBkZXRlY3RlZCBpbiBJVmlld01vZGVsUHJvcGVydHlCYXNlOiAke2JQfWApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgcHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoYlA6IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPikge1xuICAgICAgICAgICAgICAgIGxldCBiaW5kYWJsZVByb3BlcnR5SWQ6IHN0cmluZyA9IDxzdHJpbmc+YlAuaWQ7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU3RvcmUgYW5kIGF0dGFjaCBiaW5kYWJsZSBwcm9wZXJ0aWVzIHRoYXQgZG8gbm90IGhhdmUgYSBPbmVUaW1lIGJpbmRpbmdNb2RlLlxuICAgICAgICAgICAgICAgICAgICAvLyBOb3RlIHRoYXQgT25lVGltZSBiaW5kaW5nTW9kZSBwcm9wZXJ0aWVzIGFyZSBub3Qgc3RvcmVkLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYmluZGluZ01vZGUgIT09IEJpbmRpbmdNb2RlLk9uZVRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJQLnZpZXdNb2RlbFJlZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5W2JpbmRhYmxlUHJvcGVydHlJZF0gPSBiUDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVRpbWUgaXMgc2V0IGFsd2F5c1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGJQLnZhbHVlICE9PSB1bmRlZmluZWQpIHx8IChiUC5iaW5kaW5nTW9kZSA9PT0gQmluZGluZ01vZGUuT25lVGltZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5zZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFZpZXdNb2RlbD4+YlAsIGJpbmRhYmxlUHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwucmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFZpZXdNb2RlbD4+YlAsIGJpbmRhYmxlUHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBBdHRhY2ggb25DaGFuZ2UgZXZlbnQgaGFuZGxlciBmb3IgVHdvV2F5IGFuZCBPbmVXYXlSZWFkIHByb3BlcnRpZXMuXG4gICAgICAgICAgICAgICAgICAgIGlmIChiUC5iaW5kaW5nTW9kZSA9PT0gQmluZGluZ01vZGUuVHdvV2F5IHx8XG4gICAgICAgICAgICAgICAgICAgICAgICBiUC5iaW5kaW5nTW9kZSA9PT0gQmluZGluZ01vZGUuT25lV2F5UmVhZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGJvdW5kZWRGdW5jID0gKF9ldiA6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBEZXRlY3RlZCBjaGFuZ2UgaW46ICR7YmluZGFibGVQcm9wZXJ0eUlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlUHJvcGVydHlDaGFuZ2VkRXZlbnQoYmluZGFibGVQcm9wZXJ0eUlkKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoPElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFZpZXdNb2RlbD4+YlApLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8KCh2bTogVmlld01vZGVsKSA9PiB2b2lkKT4oPElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFZpZXdNb2RlbD4+YlApLm9uQ2hhbmdlRnVuYykoPFZpZXdNb2RlbD5iUC52aWV3TW9kZWxSZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mICg8YW55PmJQLnZpZXdNb2RlbFJlZikub25DaGFuZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+YlAudmlld01vZGVsUmVmKS5vbkNoYW5nZShiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwcm92aWRlIG9uQ2hhbmdlRnVuYyAoYWx0ZXJuYXRpdmVseSBpbXBsZW1lbnQgb25DaGFuZ2UgWyhodG1sSWQ6IHN0cmluZykgPT4gdm9pZF0gbWV0aG9kKSBmb3IgaW1wbGVudGF0aW9uIG9mIElWaWV3TW9kZWxQcm9wZXJ0eSBmb3IgaWQ6ICcgKyBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzLnNwbGl0KCcgJykuZm9yRWFjaCgoZXZTdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJQLmlkLmNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYlAuYm91bmRFdmVudEZ1bmMgPSBib3VuZGVkRnVuYztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYmluZGFibGVQcm9wZXJ0eUlkKSkuYWRkRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDxhbnk+YlApLmJvdW5kRXZlbnRGdW5jKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlIEFycmF5OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJvdW5kRXZlbnRGdW5jcyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYlAuYm91bmRFdmVudEZ1bmNzID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmNzLnB1c2goYm91bmRlZEZ1bmMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChiaW5kYWJsZVByb3BlcnR5SWQpKS5hZGRFdmVudExpc3RlbmVyKGV2U3RyaW5nLCAoPGFueT5iUCkuYm91bmRFdmVudEZ1bmNzWzxudW1iZXI+KCg8YW55PmJQKS5ib3VuZEV2ZW50RnVuY3MpLmxlbmd0aCAtIDFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hY2NlcHRhYmxlIGlkIGRldGVjdGVkIGluIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U6ICR7YlB9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJpZ2dlcnMgY2hhbmdlIGluIFVJIHRvIG1hdGNoIHZhbHVlIG9mIHByb3BlcnR5IGluIGlkVG9CaW5kYWJsZVByb3BlcnR5LlxuICAgICAgICAgICAgcHJvdGVjdGVkIGhhbmRsZVByb3BlcnR5Q2hhbmdlZEV2ZW50KHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaW5kYWJsZVByb3BlcnR5ID0gdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtwcm9wZXJ0eUlkXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiaW5kYWJsZVByb3BlcnR5LmJpbmRpbmdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgQmluZGluZ01vZGUuT25lVGltZTpcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoXCJJTVBPU1NJQkxFXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuT25lV2F5UmVhZDpcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5yZXRyaWV2ZUFuZFNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlOlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5Ud29XYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBiaW5kaW5nTW9kZSBmb3IgQmluZGluZyBQcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggaWQ6ICR7cHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuVGVhcmRvd25GdW5jKHNlbGY6IFZpZXdNb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi50ZWFyZG93bi5jYWxsKHNlbGYpO307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlYXJkb3duKG92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlOmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgIW92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0ZWFyZG93biBGcm9udEVuZEZyYW1ld29yay5NaW5pSHRtbFZpZXdNb2RlbC5WaWV3TW9kZWwgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eSkuZm9yRWFjaCgoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2xlYW5pbmcgdXAgZXZlbnQgaGFuZGxlcnMgc2V0IHVwIGluIFZpZXdNb2RlbCAoaWQ6ICR7aWR9KWApO1xuICAgICAgICAgICAgICAgICAgICBsZXQgYlAgPSB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5W2lkXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiUC5pZC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBTdHJpbmc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJvdW5kRXZlbnRGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLkNoYW5nZUV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuYyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKChiUC5ib3VuZEV2ZW50RnVuY3MgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJQLmJvdW5kRXZlbnRGdW5jcy5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChiUC5ib3VuZEV2ZW50RnVuY3MubGVuZ3RoID09PSAoPHN0cmluZ1tdPmJQLmlkKS5sZW5ndGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpZHggPSAoPHN0cmluZ1tdPmJQLmlkKS5pbmRleE9mKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5DaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCkpLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZTdHJpbmcsICg8YW55PmJQKS5ib3VuZEV2ZW50RnVuY3NbaWR4XSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ludGVybmFsIGludmFyaWFudCB2aW9sYXRlZCAoZ3VpZDogRHRzYTQzMjUyeHhxKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignSW50ZXJuYWwgaW52YXJpYW50IHZpb2xhdGVkIChndWlkOiBwdGE0MjN0YURURCknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoYFVuYWNjZXB0YWJsZSBpZCBkZXRlY3RlZCBpbiBJVmlld01vZGVsUHJvcGVydHlCYXNlOiAke2JQfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpOiBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICAgICAgaWYgKGJQLmdldERhdGFGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgYlAudmFsdWUgPSBiUC5nZXREYXRhRnVuYygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnZhbHVlID0gKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByb3BlcnR5SWQpKS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJQO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyBzZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgY252cnRyID0gYlAuY29udmVydGVyRnVuYyB8fCBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuICAgICAgICAgICAgICAgIGlmIChiUC5zZXREYXRhRnVuYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ0huZGwuJCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKCcjJyArIHByb3BlcnR5SWQpLnZhbChiUC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocHJvcGVydHlJZCkpLnZhbHVlID0gY252cnRyKGJQLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmdIbmRsLiQpKCcjJyArIHByb3BlcnR5SWQpLnZhbChiUC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiUC5zZXREYXRhRnVuYyhjbnZydHIoYlAudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVUaW1lID0gPEJpbmRpbmdNb2RlLk9uZVRpbWU+QmluZGluZ01vZGUuT25lVGltZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkID0gPEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ+QmluZGluZ01vZGUuT25lV2F5UmVhZDtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5V3JpdGUgPSA8QmluZGluZ01vZGUuT25lV2F5V3JpdGU+QmluZGluZ01vZGUuT25lV2F5V3JpdGU7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheSA9IDxCaW5kaW5nTW9kZS5Ud29XYXk+QmluZGluZ01vZGUuVHdvV2F5O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuXG4vLyBSZWxpZXMgb24gLi9iYXNlLmpzLnRzIGJlY2F1c2UgdGhpcyBsaWJyYXJ5IHNob3VsZCBiZSBhYmxlIHRvIHRha2UgYWR2YW50YWdlIG9mIFR1cmJvbGlua3Mgbm90IHJlbG9hZGluZyBwYWdlLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgU3RvcmFnZSB7XG4gICAgICAgIGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuMS4wJztcbiAgICAgICAgZXhwb3J0IGNvbnN0IGVudW0gRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24geyBUcmFuc2llbnQsIFNlc3Npb24sIEFjcm9zc1Nlc3Npb25zIH1cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24ge1xuICAgICAgICAgICAgaW5kZWZpbml0ZT86IGJvb2xlYW47XG4gICAgICAgICAgICBleHBpcnlEYXRlPzogRGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUV4cGlyaW5nQ2FjaGVEdXJhdGlvbiBleHRlbmRzIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlPzogYm9vbGVhbjsgLy8gTVVTVCBCRSBgZmFsc2VgXG4gICAgICAgICAgICBleHBpcnlEYXRlOiBEYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJSW5kZWZpbml0ZUNhY2hlRHVyYXRpb24gZXh0ZW5kcyBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24ge1xuICAgICAgICAgICAgaW5kZWZpbml0ZTogYm9vbGVhbjsgLy8gTVVTVCBCRSBgdHJ1ZWBcbiAgICAgICAgICAgIGV4cGlyeURhdGU/OiBEYXRlOyAvLyAgSUdOT1JFRFxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIEV4cGlyaW5nQ2FjaGVEdXJhdGlvbiBpbXBsZW1lbnRzIElFeHBpcmluZ0NhY2hlRHVyYXRpb24ge1xuICAgICAgICAgICAgcHVibGljIGluZGVmaW5pdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBleHBpcnlEYXRlOiBEYXRlKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiBpbXBsZW1lbnRzIElJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiB7XG4gICAgICAgICAgICBwdWJsaWMgaW5kZWZpbml0ZSA9IHRydWU7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIGJyb3dzZXJzIHRoYXQgc2F5IHRoYXQgdGhleSBoYXZlIFNlc3Npb25TdG9yYWdlIGJ1dCBpbiByZWFsaXR5IHRocm93IGFuIEVycm9yIGFzIHNvb25cbiAgICAgICAgLy8gYXMgeW91IHRyeSB0byBkbyBzb21ldGhpbmcuXG4gICAgICAgIGxldCBpc19zZXNzaW9uX3N0b3JhZ2VfYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3Rlc3RhODkwYTgwOScsICd2YWwnKTtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rlc3RhODkwYTgwOScpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgIGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGUgPSBmYWxzZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgdG8gZG8uLi5cbiAgICAgICAgfVxuICAgICAgICBleHBvcnQgY29uc3QgSXNTZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSA9IGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGU7XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJS2V5VmFsdWVTdG9yYWdlUHJvZmlsZSB7XG4gICAgICAgICAgICBEYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllczogRGF0YVBlcnNpc3RlbmNlRHVyYXRpb25bXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBDbGllbnRTdG9yYWdlUHJvZmlsZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2VQcm9maWxlIHtcbiAgICAgICAgICAgIHB1YmxpYyBEYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllczogQXJyYXk8RGF0YVBlcnNpc3RlbmNlRHVyYXRpb24+O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5EYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllcyA9IFtEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnRdO1xuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5UdXJib2xpbmtzQXZhaWxhYmxlIHx8IEZyb250RW5kRnJhbWV3b3JrLlN0b3JhZ2UuSXNTZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5EYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllcy5wdXNoKERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIHNldDogKChrZXk6YW55LCB2YWw6YW55KSA9PiB2b2lkKTtcbiAgICAgICAgICAgIGdldDogKChrZXk6YW55KSA9PiBhbnkpO1xuICAgICAgICB9XG4gICAgICAgIC8qXG4gICAgICAgIGV4cG9ydCBjbGFzcyBUcmFuc2llbnRTdG9yYWdlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZSB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0KGtleTphbnksIHZhbDphbnkpIDogdm9pZCA9PiB7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldChrZXk6YW55KSA6IGFueSA9PiB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgZXhwb3J0IGNsYXNzIENsaWVudFN0b3JhZ2UgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIHB1YmxpYyBjbGllbnRQcm9maWxlID0gbmV3IENsaWVudFN0b3JhZ2VQcm9maWxlKCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwcml2YXRlIGVycm9yT25GYWlsID0gZmFsc2VcbiAgICAgICAgICAgICkgeyB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBzZXQoa2V5OiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIHZhbDogYW55LFxuICAgICAgICAgICAgICAgICAgICAgICBkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiA9IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgIGNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uPzogSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIHVwb24gYWRkaW5nIHN1cHBvcnQgZm9yIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZUV4cGlyYXRpb25EdXJhdGlvbiAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIGlnbm9yZWQgaW4gRGF0YWJhc2Ujc2V0LlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2goZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5BY3Jvc3NTZXNzaW9uczpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVycm9yT25GYWlsKSB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGdldChrZXk6IGFueSwgZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24/OiBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikgOiBhbnl8bnVsbHx1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2goZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uVHJhbnNpZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JPbkZhaWwpIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZm9yY2VDYWNoZUV4cGlyeShrZXk6IGFueSkgeyBjb25zb2xlLmVycm9yKGBVbmltcGxlbWVudGVkIERhdGFiYXNlI2ZvcmNlQ2FjaGVFeHBpcnk6IEZhaWxlZCB0byBleHBpcmUga2V5OiAke2tleX1gKTsgdGhyb3cga2V5OyB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RvcmFnZS5qcy50c1wiLz5cblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICAvLyBWaXNpdHMgc2l0ZSB1c2luZyBUdXJib2xpbmtzIChvciBhbm90aGVyIFNQQSBmcmFtZXdvcmsgd2hlbiBzdXBwb3J0IGlzIGFkZGVkKSBpZiBwb3NzaWJsZS5cbiAgICAvLyBTaG91bGQgYWx3YXlzIHJlc3VsdCBpbiBvcGVuaW5nIGdpdmVuIGxpbmsgKGlmIGdpdmVuIGFyZ3VtZW50IGZvciBgbGlua2AgaXMgdmFsaWQgVVJMKS5cbiAgICBleHBvcnQgbGV0IHZpc2l0TGluayA9IGZ1bmN0aW9uKGxpbmsgOiBzdHJpbmcsIHtmb3JjZVJlbG9hZCwgbmV3VGFifToge2ZvcmNlUmVsb2FkPzogYm9vbGVhbiwgbmV3VGFiPzogYm9vbGVhbn0gPSB7Zm9yY2VSZWxvYWQ6IGZhbHNlLCBuZXdUYWI6IGZhbHNlfSkge1xuICAgICAgICBpZiAoKG5ld1RhYiAhPSBudWxsKSAmJiA8Ym9vbGVhbj5uZXdUYWIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbiAmJiAhKChmb3JjZVJlbG9hZCAhPSBudWxsKSAmJiA8Ym9vbGVhbj5mb3JjZVJlbG9hZCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICAgICAgICAgICAgICBpZiAoKEZyb250RW5kRnJhbWV3b3JrLlJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA9PT1cbiAgICAgICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLlN1cHBvcnRlZEludGVncmF0aW9uLlR1cmJvbGlua3MpICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YoVHVyYm9saW5rcy52aXNpdCkgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIFR1cmJvbGlua3MudmlzaXQobGluayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGxpbms7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IGNsZWFudXBGdW5jID0gKCkgPT4ge1xuICAgICAgICAvLyBPbmx5IGV4ZWN1dGUgaW4gc2luZ2xlIHBhZ2UgYXBwbGljYXRpb25zIChpbiBvdGhlciBjYXNlLCBwYWdlIHdvdWxkIGJlIHJlc2V0IGFueXdheXMpXG4gICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cEhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgY2xlYW51cEhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBwcmVSZWFkeUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlUmVhZHlIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHsgcHJlUmVhZHlIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgcG9zdFJlYWR5RnVuYyA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3N0UmVhZHlIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHsgcG9zdFJlYWR5SG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyb250RW5kRnJhbWV3b3JrLnN0YXRlVG9DbGVhck9uTmF2aWdhdGlvbiA9IHt9O1xuICAgIH07XG5cbiAgICBleHBvcnQgbmFtZXNwYWNlIFB1YlN1YiB7XG4gICAgICAgIGludGVyZmFjZSBQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvIGV4dGVuZHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVySWRlbnRpZmllcjogc3RyaW5nO1xuICAgICAgICAgICAgc3Vic2NyaWJlclNldHRlcjogKChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQ7XG4gICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzIFB1YlN1YlJlbGF5IGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBwdWJsaWMgc3RhdGljIERlZmF1bHRPYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50O1xuICAgICAgICAgICAgcHVibGljIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IHN1YnNjcmlwdGlvbklkZW50aWZpZXI6IHN0cmluZztcbiAgICAgICAgICAgIHByaXZhdGUgcHViU3ViUmVsYXlTdWJzY3JpYmVyczogUHViU3ViUmVsYXlTdWJzY3JpYmVySW5mb1tdID0gW107XG4gICAgICAgICAgICBwcml2YXRlIGxhc3RTZW50TWVzc2FnZTogYW55OyAvLyBUbyBiZSByZS1icm9hZGNhc3QgYWZ0ZXIgbmF2aWdhdGluZyBwYWdlc1xuICAgICAgICAgICAgcHJpdmF0ZSBmaXJzdE1lc3NhZ2VTZW50UDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllciA9IHN1YnNjcmlwdGlvbklkZW50aWZpZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBQdWJTdWJSZWxheS5EZWZhdWx0T2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgYWRkU3Vic2NyaWJlcihzdWJzY3JpYmVySW5mbzpQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvKSA6IHZvaWQge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKDxudW1iZXI+dGhpcy5vYmplY3RMaWZlQ3ljbGUpIDwgKDxudW1iZXI+c3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBzdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldLnN1YnNjcmliZXJJZGVudGlmaWVyID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlckluZm8uc3Vic2NyaWJlcklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2Fubm90IHN1YnNjcmliZSBtb3JlIHRoYW4gb25jZSB0byAoJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9KSB3aXRoICgke3N1YnNjcmliZXJJbmZvLnN1YnNjcmliZXJJZGVudGlmaWVyfSkuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVySW5mbyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWxheU1lc3NhZ2Uoc2VuZGluZ1N1YnNjcmliZXJJZGVudGlmaWVyOnN0cmluZywgbWVzc2FnZTphbnkpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUmVsYXlpbmcgbWVzc2FnZSBmcm9tIFB1YlN1YlJlbGF5I3JlbGF5TWVzc2FnZSBmb3Igc3Vic2NyaXB0aW9uOiAke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn19YClcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RTZW50TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdE1lc3NhZ2VTZW50UCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbGV2YW50U3Vic2NyaWJlciA9IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFByaW50aW5nICR7aX0tdGggcmVsZXZhbnRTdWJzY3JpYmVyYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHJlbGV2YW50U3Vic2NyaWJlcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIgIT09XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kaW5nU3Vic2NyaWJlcklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWVzIHRoYXQgYSB0cmlnZ2VyIGNoYW5nZSBldmVudCBzaG91bGQgbm90IGJlIGZpcmVkIG9uIHNldHRpbmcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSBzdWJzY3JpYmVyU2V0dGVyIGFyZyB3aGVuIHN1YnNjcmliaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYFNldHRpbmcgdmFsdWUgKCR7bWVzc2FnZX0pIGZvciAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn0gaWQuYCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVwbGFjZXM6ICQocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ0huZGwuJCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtc09mSW50ZXJlc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGVsZW1zT2ZJbnRlcmVzdC5sZW5ndGg7IHgrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtZXNzYWdlLmNvbnN0cnVjdG9yID09PSBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFNvbWV0aGluZyBwcm9iYWJseSBpcyBub3QgZ29pbmcgdG8gd29yayBhcyBwbGFubmVkIGluIHNldHRpbmcgdmFsdWVzICgke21lc3NhZ2V9KSBmb3IgZWxlbWVudCB3aXRoIGlkOiAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmVsZW1zT2ZJbnRlcmVzdFt4XSkudmFsdWUgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z0huZGwuJCkocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZpcnN0TWVzc2FnZVNlbnRQKSByZXR1cm47XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFJlbGF5aW5nIG1lc3NhZ2UgZnJvbSBQdWJTdWJSZWxheSNyZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSBmb3Igc3Vic2NyaXB0aW9uOiAke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn19YClcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVsZXZhbnRTdWJzY3JpYmVyID0gdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIodGhpcy5sYXN0U2VudE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWVzIHRoYXQgYSB0cmlnZ2VyIGNoYW5nZSBldmVudCBzaG91bGQgbm90IGJlIGZpcmVkIG9uIHNldHRpbmcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHN1YnNjcmliZXJTZXR0ZXIgYXJnIHdoZW4gc3Vic2NyaWJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5pbmZvKGBTZXR0aW5nIHZhbHVlICgke3RoaXMubGFzdFNlbnRNZXNzYWdlfSkgZm9yICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfSBpZC5gKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKHRoaXMubGFzdFNlbnRNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZ0huZGwuJCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1zT2ZJbnRlcmVzdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBlbGVtc09mSW50ZXJlc3QubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmxhc3RTZW50TWVzc2FnZS5jb25zdHJ1Y3RvciA9PT0gQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFNvbWV0aGluZyBwcm9iYWJseSBpcyBub3QgZ29pbmcgdG8gd29yayBhcyBwbGFubmVkIGluIHNldHRpbmcgdmFsdWVzICgke3RoaXMubGFzdFNlbnRNZXNzYWdlfSkgZm9yIGVsZW1lbnQgd2l0aCBpZDogJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZWxlbXNPZkludGVyZXN0W3hdKS52YWx1ZSA9IHRoaXMubGFzdFNlbnRNZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z0huZGwuJCkocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwodGhpcy5sYXN0U2VudE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBTaG9ydC1jaXJjdWl0IGlmIGl0ZW0gd2lsbCBiZSBQdWJTdWJSZWxheSBpdHNlbGYgd2lsbCBiZSBkZXN0cm95ZWQgYW55d2F5c1xuXG4gICAgICAgICAgICAgICAgbGV0IHRvUmVtb3ZlIDogbnVtYmVyW10gPSBbXTsgLy8gaW5kaWNlcyAodGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzKSBvZiBzdWJzY3JpYmVycyB0byByZW1vdmVcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV0ub2JqZWN0TGlmZUN5Y2xlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAodG9SZW1vdmUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5zcGxpY2UoPG51bWJlcj50b1JlbW92ZS5wb3AoKSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXlTdG9yYWdlIGltcGxlbWVudHMgU3RvcmFnZS5JS2V5VmFsdWVTdG9yYWdlLCBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEFsbG93IHRoZSBQdWJTdWJSZWxheVN0b3JhZ2UgdG8gaGF2ZSBhIHRyYW5zaWVudCBvYmplY3QgbGlmZSBjeWNsZVxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHJpdmF0ZSBtYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzOiBhbnk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGdldChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgOiBQdWJTdWJSZWxheXxudWxsfHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHNldChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZywgcHViU3ViUmVsYXk6IFB1YlN1YlJlbGF5KSA6IHZvaWQge1xuICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXSA9IHB1YlN1YlJlbGF5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQga2V5c1RvRGVsZXRlIDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMpLmZvckVhY2goKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheUluc3RhbmNlID0gdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdO1xuICAgICAgICAgICAgICAgICAgICBwdWJTdWJSZWxheUluc3RhbmNlLmhhbmRsZU5hdmlnYXRpb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocHViU3ViUmVsYXlJbnN0YW5jZS5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBwdWJTdWJSZWxheUluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzVG9EZWxldGUucHVzaChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNUb0RlbGV0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW2tleXNUb0RlbGV0ZVtpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVicm9hZGNhc3RBbGxNZXNzYWdlTGFzdFJlbGF5ZWRCeVN0b3JlZFB1YlN1YlJlbGF5cygpIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzKS5mb3JFYWNoKChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl0ucmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzIFB1YlN1YlJlbGF5TWFuYWdlciB7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbGxvdyB0aGUgUHViU3ViUmVsYXlNYW5hZ2VyIHRvIGhhdmUgYSB0cmFuc2llbnQgb2JqZWN0IGxpZmUgY3ljbGVcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZTtcbiAgICAgICAgICAgIHByaXZhdGUgcHViU3ViUmVsYXlTdG9yYWdlOiBQdWJTdWJSZWxheVN0b3JhZ2UgPSBuZXcgUHViU3ViUmVsYXlTdG9yYWdlKCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+Y2xlYW51cEhvb2tzKS5wdXNoKHRoaXMuZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPnBvc3RSZWFkeUhvb2tzKS5wdXNoKHRoaXMuZ2VuUmVicm9hZGNhc3RMYXN0TWVzc2FnZXNGdW5jKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGhhbmRsZU5hdmlnYXRpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UuaGFuZGxlTmF2aWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZXMoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UucmVicm9hZGNhc3RBbGxNZXNzYWdlTGFzdFJlbGF5ZWRCeVN0b3JlZFB1YlN1YlJlbGF5cygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHNlbGY6IFB1YlN1YlJlbGF5TWFuYWdlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmhhbmRsZU5hdmlnYXRpb24uYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5SZWJyb2FkY2FzdExhc3RNZXNzYWdlc0Z1bmMoc2VsZjogUHViU3ViUmVsYXlNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2VzLmJpbmQoc2VsZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgc2VsZklkZW50aWZpZXI6c3RyaW5nLCAvLyBzaG91bGQgYmUgYSBDU1Mgc2VsZWN0b3IgKEpRdWVyeSBzZWxlY3RvcilcbiAgICAgICAgICAgICAgICBzZWxmU2V0dGVyOigobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheSA9IHRoaXMuaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IFNlZSBpZiBnaXZlbiBgb2JqZWN0TGlmZUN5Y2xlYCBpcyBncmVhdGVyIHRoYW4gZGVzaWduYXRlZCBvYmplY3RMaWZlQ3ljbGUsXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQgaXMsIGNoYW5nZSBob3cgaXQgaXMgbWFuYWdlZCAobm90IHJlbGV2YW50IHVudGlsIG9iamVjdCBsaWZlIGN5Y2xlIG90aGVyXG4gICAgICAgICAgICAgICAgLy8gdGhhbiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZSBpcyBzdXBwb3J0ZWQpLlxuXG4gICAgICAgICAgICAgICAgKDxQdWJTdWJSZWxheT5wdWJTdWJSZWxheSkuYWRkU3Vic2NyaWJlcih7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJJZGVudGlmaWVyOiBzZWxmSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlclNldHRlcjogc2VsZlNldHRlcixcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBvYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZVB1Ymxpc2hlZE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTphbnlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheSA9IHRoaXMuaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICBwdWJTdWJSZWxheS5yZWxheU1lc3NhZ2Uoc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgOiBQdWJTdWJSZWxheSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5IDogUHViU3ViUmVsYXl8bnVsbHx1bmRlZmluZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwdWIgc3ViIHJlbGF5IGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gICAgICAgICAgICAgICAgaWYgKChwdWJTdWJSZWxheSA9IHRoaXMucHViU3ViUmVsYXlTdG9yYWdlLmdldChzdWJzY3JpcHRpb25JZGVudGlmaWVyKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwdWJTdWJSZWxheSA9IG5ldyBQdWJTdWJSZWxheShzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2Uuc2V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgIDxQdWJTdWJSZWxheT5wdWJTdWJSZWxheVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW50ZXJuYWwgbGlicmFyeSBzdGF0ZVxuICAgICAgICAvLyBUT0RPOiBNYW5hZ2UgaW50ZXJuYWwgbGlicmFyeSBzdGF0ZSB3aXRob3V0IHVzaW5nIGdsb2JhbHNcbiAgICAgICAgbGV0IHB1YlN1YlJlbGF5TWFuYWdlciA6IFB1YlN1YlJlbGF5TWFuYWdlciA9IG5ldyBQdWJTdWJSZWxheU1hbmFnZXIoKTs7XG5cbiAgICAgICAgLy8gVHJlYXQgdGhlIGZpcnN0IHR3byBhcmd1bWVudHMgdG8gdGhpcyBmdW5jdGlvbiBhcyBiZWluZyBtb3JlIGEgcGFydCBvZiBhIHN0YWJsZVxuICAgICAgICAvLyBBUEkgdnMgdGhlIHRoZSB0aGlyZCBhbmQgZm91cnRoIGFyZ3VtZW50cyB3aGljaCBhcmUgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgIGV4cG9ydCBsZXQgc3Vic2NyaWJlID0gKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICBzZWxmSWRlbnRpZmllcjpzdHJpbmcsIC8vIHNob3VsZCBiZSBhIENTUyBzZWxlY3RvciAoSlF1ZXJ5IHNlbGVjdG9yKSB1bmxlc3MgcHJvdmlkaW5nIGBzZWxmU2V0dGVyYCBhcmd1bWVudFxuICAgICAgICAgICAgc2VsZlNldHRlcjooKG1lc3NhZ2U6YW55KSA9PiB2b2lkKXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnRcbiAgICAgICAgKSA6IGFueXx2b2lkID0+IHtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiUHJpbnRpbmcgRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLnN1YnNjcmliZSBhcmdzXCIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzZWxmSWRlbnRpZmllcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzZWxmU2V0dGVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKG9iamVjdExpZmVDeWNsZSk7XG4gICAgICAgICAgICBwdWJTdWJSZWxheU1hbmFnZXIuaGFuZGxlU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIHNlbGZJZGVudGlmaWVyLCBzZWxmU2V0dGVyLCBvYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgbGV0IHB1Ymxpc2ggPSAoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsIG1lc3NhZ2U6YW55KSA9PiB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhcIlByaW50aW5nIEZyb250RW5kRnJhbWV3b3JrLlB1YlN1Yi5wdWJsaXNoIGFyZ3NcIik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKG1lc3NhZ2UpO1xuICAgICAgICAgICAgcHViU3ViUmVsYXlNYW5hZ2VyLmhhbmRsZVB1Ymxpc2hlZE1lc3NhZ2Uoc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgbWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2FnZTogRHVyaW5nIGluaXRpYWxpemF0aW9uIHN1YnNjcmliZSBiZWZvcmUgcG9zdC1ob29rcyAocHJlZmVyYWJseSBwcmUtaG9va3MpIGFuZCBwdWJsaXNoIGluIHBvc3QtaG9va3MuXG5cbiAgICAgICAgLy8gQXNzdW1lZCB0byBiZSBjb25zdHJ1Y3RlZCBpbiBwcmUtaG9va1xuICAgICAgICBleHBvcnQgY2xhc3MgUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyIGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IG90aGVyIG9iamVjdCBsaWZlIGN5Y2xlc1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHVibGljIHN0b3JhZ2VLZXk6IHN0cmluZztcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXk6c3RyaW5nLFxuICAgICAgICAgICAgICAgIHB1Ymxpc2hFeGlzdGluZ1N0b3JlZFZhbHVlOmJvb2xlYW4gPSB0cnVlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2VLZXkgPSBzdG9yYWdlS2V5O1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2hvcnQtQ2lyY3VpdCBpZiBzZXNzaW9uIHN0b3JhZ2Ugbm90IGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgIGlmICghU3RvcmFnZS5Jc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBYmFuZG9uaW5nIFB1YlN1YlNlc3Npb25TdG9yYWdlU3Vic2NyaWJlciBpbml0aWFsaXphdGlvbiBzaW5jZSBzZXNzaW9uIHN0b3JhZ2UgaXMgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlS2V5LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdlblN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmModGhpcyksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgbGV0IGluaXRpYWxTdG9yZWRWYWx1ZSA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbFN0b3JlZFZhbHVlICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgcHVibGlzaEV4aXN0aW5nU3RvcmVkVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIGhvb2tzLnBvc3QucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIGluaXRpYWxTdG9yZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jKHZhbDphbnkpIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKHRoaXMuc3RvcmFnZUtleSwgdmFsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmMoc2VsZjogUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChtZXNzYWdlOmFueSkgPT4ge3NlbGYuc3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYy5jYWxsKHNlbGYsIG1lc3NhZ2UpO31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFzc3VtZWQgdG8gYmUgY29uc3RydWN0ZWQgaW4gcHJlLWhvb2tcbiAgICAgICAgZXhwb3J0IGNsYXNzIEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JpYmVyIGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgc3Vic2NyaXB0aW9uSWRlbnRpZmllciA6IHN0cmluZztcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaHRtbElkIDogc3RyaW5nO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9uQ2hhbmdlRnVuYyA6ICgoKSA9PiB2b2lkKXxudWxsO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZSA6IGJvb2xlYW47XG4gICAgICAgICAgICBwcml2YXRlIF9wdWJsaXNoT25DaGFuZ2VGdW5jPzogKChldjogRXZlbnQpID0+IHZvaWQpO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgaHRtbElkOnN0cmluZyxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZUZ1bmM6KCgpID0+IHZvaWQpfG51bGwgPSBudWxsLFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQsXG4gICAgICAgICAgICAgICAgcHVibGlzaFZhbHVlUHJlZGljYXRlOmJvb2xlYW4gPSBmYWxzZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyID0gc3Vic2NyaXB0aW9uSWRlbnRpZmllcjtcbiAgICAgICAgICAgICAgICB0aGlzLmh0bWxJZCA9IGh0bWxJZDtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlRnVuYyA9IG9uQ2hhbmdlRnVuYztcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IG9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgICAgICB0aGlzLnB1Ymxpc2hWYWx1ZVByZWRpY2F0ZSA9IHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZTtcblxuICAgICAgICAgICAgICAgIC8vIFB1Ymxpc2ggdmFsdWUgd2hlbiBhcHByb3ByaWF0ZVxuICAgICAgICAgICAgICAgIGlmIChwdWJsaXNoVmFsdWVQcmVkaWNhdGUgJiZcbiAgICAgICAgICAgICAgICAgICAgKCg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZSAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICBob29rcy5wb3N0LnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHVibGlzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gU3Vic2NyaWJlXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBgIyR7aHRtbElkfWAsXG4gICAgICAgICAgICAgICAgICAgIChtZXNzYWdlOmFueSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBnSG5kbC4kID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKGAjJHtodG1sSWR9YCkudmFsKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtc09mSW50ZXJlc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGAjJHtodG1sSWR9YCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBlbGVtc09mSW50ZXJlc3QubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmVsZW1zT2ZJbnRlcmVzdFt4XSkudmFsdWUgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+Z0huZGwuJCkoYCMke2h0bWxJZH1gKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+dGhpcy5vbkNoYW5nZUZ1bmMpKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcHVibGlzaE9uQ2hhbmdlRnVuYyA9ICgoX2V2OiBFdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuaHRtbElkKSkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYERldGVjdGVkIGNoYW5nZSBpbiAoJHtodG1sSWR9KTogJHsoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWV9YClcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlRnVuYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpIH1cbiAgICAgICAgICAgICAgICAgICAgfSAvLyBlbHNlIHsgY29uc29sZS5pbmZvKCdEaWQgbm90IGZpcmUgbnVsbCBvbkNoYW5nZUZ1bmMnKSB9XG4gICAgICAgICAgICAgICAgfSkuYmluZCh0aGlzKTtcblxuICAgICAgICAgICAgICAgIC8vIFB1Ymxpc2ggb24gY2hhbmdlc1xuICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cy5zcGxpdCgnICcpLmZvckVhY2goKGV2U3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICg8SFRNTEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkuYWRkRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDwoKGV2OiBFdmVudCkgPT4gdm9pZCk+dGhpcy5fcHVibGlzaE9uQ2hhbmdlRnVuYykpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50ICYmXG4gICAgICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAoaG9va3MucGFnZUNsZWFudXAgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkucHVzaCh0aGlzLmdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGhhbmRsZU5hdmlnYXRpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGVhcmRvd24oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmMoc2VsZjogSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCkgPT4ge3NlbGYuaGFuZGxlTmF2aWdhdGlvbi5jYWxsKHNlbGYpO31cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGVhcmRvd24ob3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGU6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZSAmJlxuICAgICAgICAgICAgICAgICAgICAhb3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHRlYXJkb3duIEZyb250RW5kRnJhbWV3b3JrLlB1YlN1Yi5IdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyYmVyIGluc3RhbmNlIGR1ZSB0byBvYmplY3RMaWZlQ3ljbGUgbm90IGJlaW5nIG92ZXJyaWRkZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDbGVhbmluZyB1cCBldmVudCBoYW5kbGVycyBzZXQgdXAgaW4gSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmJlciAoaWQ6ICR7dGhpcy5odG1sSWR9KWApO1xuICAgICAgICAgICAgICAgIC8vIFJlcGxhY2VzOiAkKCcjJyArIHRoaXMuaHRtbElkKS5vZmYoRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzKTtcbiAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHMuc3BsaXQoJyAnKS5mb3JFYWNoKChldlN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy5odG1sSWQpICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuaHRtbElkKSkucmVtb3ZlRXZlbnRMaXN0ZW5lcihldlN0cmluZywgKDwoKGV2OiBFdmVudCkgPT4gdm9pZCk+dGhpcy5fcHVibGlzaE9uQ2hhbmdlRnVuYykpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgUkVBRFlfRlVOQyA9ICgpID0+IHtcbiAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucHJlIEFycmF5XG4gICAgICAgIHdoaWxlIChob29rcy5wcmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdHJ5IHsgKDwoKCkgPT4gdm9pZCk+aG9va3MucHJlLnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7IHByZVJlYWR5RnVuYygpOyB9XG4gICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuXG4gICAgICAgIGlmICgoRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jICE9IG51bGwpICYmXG4gICAgICAgICAgICAodHlwZW9mKEZyb250RW5kRnJhbWV3b3JrLnJlYWR5RnVuYykgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLnJlYWR5RnVuYygpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkgeyBwb3N0UmVhZHlGdW5jKCk7IH1cbiAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG5cbiAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucG9zdCBBcnJheVxuICAgICAgICB3aGlsZSAoaG9va3MucG9zdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT5ob29rcy5wb3N0LnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICBzd2l0Y2ggKEZyb250RW5kRnJhbWV3b3JrLlJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbikge1xuICAgICAgICBjYXNlIEZyb250RW5kRnJhbWV3b3JrLlN1cHBvcnRlZEludGVncmF0aW9uLlR1cmJvbGlua3M6XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOmxvYWQnLCBSRUFEWV9GVU5DKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEZyb250RW5kRnJhbWV3b3JrLlN1cHBvcnRlZEludGVncmF0aW9uLk5vRnJhbWV3b3JrOlxuICAgICAgICBjYXNlIEZyb250RW5kRnJhbWV3b3JrLlN1cHBvcnRlZEludGVncmF0aW9uLldpbmRvd3NVV1A6XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgUkVBRFlfRlVOQyk7XG4gICAgfVxuXG4gICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbikge1xuICAgICAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlJ1bnRpbWVTdXBwb3J0ZWRJbnRlZ3JhdGlvbiA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuU3VwcG9ydGVkSW50ZWdyYXRpb24uVHVyYm9saW5rcyAmJlxuICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuVHVyYm9saW5rc0F2YWlsYWJsZSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczpiZWZvcmUtcmVuZGVyJywgY2xlYW51cEZ1bmMpO1xuICAgICAgICAgICAgaWYgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczpiZWZvcmUtcmVuZGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgZnVuY3Rpb25zIGluIGhvb2tzLnBhZ2VDbGVhbnVwIEFycmF5XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT4oPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5zaGlmdCgpKSgpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICgoY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMgIT0gbnVsbCkgJiYgKHR5cGVvZihjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYykgPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6dmlzaXQnLCBjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLz0gcmVxdWlyZSAuL2Jhc2Vcbi8vPSByZXF1aXJlIC4vc2NyZWVuX3Jlc29sdXRpb25zXG4vLz0gcmVxdWlyZSAuL21pbmlfaHRtbF92aWV3X21vZGVsXG4vLz0gcmVxdWlyZSAuL3N0b3JhZ2Vcbi8vPSByZXF1aXJlIC4vY29yZVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc2NyZWVuX3Jlc29sdXRpb25zLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdG9yYWdlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vY29yZS5qcy50c1wiLz5cblxuLy8gTm90ZSB0aGF0IHRoZSBhYm92ZSByZWZlcmVuY2VzIGRvIG5vdCB3b3JrIGlmIHlvdSBoYXZlIHRoZSBUeXBlU2NyaXB0IGNvbXBpbGVyIHNldCB0byByZW1vdmUgY29tbWVudHMuXG4vLyBVc2Ugc29tZXRoaW5nIGxpa2UgdGhlIHVnbGlmaWVyIGdlbSBmb3IgcmVtb3ZpbmcgY29tbWVudHMvb2JmdXNjYXRpb24uXG5cbi8vIFRoZSBsb2FkIG9yZGVyIGN1cnJlbnRseSBtYXR0ZXJzLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsgeyBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjYuMTInOyB9XG4iXX0=