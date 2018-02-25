"use strict";
/// <reference types="jquery"/>
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.gHndl = window;
    ;
    FrontEndFramework.HtmlInputChangeEvents = 'change textInput input';
    // TODO: Add support for other SPA frameworks here.
    FrontEndFramework.TurbolinksAvailable = ((typeof Turbolinks !== 'undefined') && (Turbolinks != null)) ? true : false;
    FrontEndFramework.SinglePageApplication = FrontEndFramework.TurbolinksAvailable;
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
        MiniHtmlViewModel.VERSION = '0.6.0';
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
                        $('#' + bindablePropertyId).on(ViewModel.ChangeEvents, function () {
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
                if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
                if (this.objectLifeCycle === 2 /* InfinitePersistence */ &&
                    !overrideObjectLifeCycle) {
                    console.error('Failed to teardown FrontEndFramework.MiniHtmlViewModel.ViewModel instance due to objectLifeCycle not being overridden');
                    return;
                }
                Object.keys(this.idToBindableProperty).forEach(function (id) {
                    console.log("Cleaning up event handlers set up in ViewModel (id: " + id + ")");
                    $('#' + id).off(ViewModel.ChangeEvents);
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
                    $('#' + propertyId).val(cnvrtr(bP.value));
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
                if (FrontEndFramework.TurbolinksAvailable &&
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
                                $(relevantSubscriber.subscriberIdentifier).val(message);
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
                            $(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage);
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
                this.objectLifeCycle = objectLifeCycle;
                this.htmlId = htmlId;
                this.onChangeFunc = onChangeFunc;
                // Publish value when appropriate
                if (publishValuePredicate &&
                    (document.getElementById(htmlId).value != null)) {
                    FrontEndFramework.hooks.post.push(function () {
                        PubSub.publish(subscriptionIdentifier, document.getElementById(htmlId).value);
                    });
                }
                // Subscribe
                PubSub.subscribe(subscriptionIdentifier, "#" + htmlId, function (message) {
                    $("#" + htmlId).val(message);
                    if (_this.onChangeFunc != null) {
                        try {
                            _this.onChangeFunc();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                }, this.objectLifeCycle);
                // Publish on changes
                $("#" + htmlId).on(FrontEndFramework.HtmlInputChangeEvents, function () {
                    PubSub.publish(subscriptionIdentifier, document.getElementById(htmlId).value);
                    // console.info(`Detected change in (${htmlId}): ${(<HTMLInputElement>document.getElementById(htmlId)).value}`)
                    if (_this.onChangeFunc != null) {
                        try {
                            _this.onChangeFunc();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    } // else { console.info('Did not fire null onChangeFunc') }
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
                if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
                if (this.objectLifeCycle === 2 /* InfinitePersistence */ &&
                    !overrideObjectLifeCycle) {
                    console.error('Failed to teardown FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscrber instance due to objectLifeCycle not being overridden');
                    return;
                }
                console.log("Cleaning up event handlers set up in HtmlInputElementPublisherAndSubscrber (id: " + this.htmlId + ")");
                $('#' + this.htmlId).off(FrontEndFramework.HtmlInputChangeEvents);
            };
            return HtmlInputElementPublisherAndSubscriber;
        }());
        PubSub.HtmlInputElementPublisherAndSubscriber = HtmlInputElementPublisherAndSubscriber;
    })(PubSub = FrontEndFramework.PubSub || (FrontEndFramework.PubSub = {}));
    $(document).ready(function () {
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
    });
    if (FrontEndFramework.SinglePageApplication) {
        // TODO: Add support for other SPA frameworks here.
        if (FrontEndFramework.TurbolinksAvailable) {
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
// Also note that require order does not consider dependency chain. Therefore, dependencies between files
// must not be affected by a random load order.
// AUTO-GENERATED by a Rake task, do not edit by hand.
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.VERSION = '0.6.10';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsK0JBQStCO0FBTy9CLElBQVUsaUJBQWlCLENBa0QxQjtBQWxERCxXQUFVLGlCQUFpQjtJQW1CWix1QkFBSyxHQUFrQixNQUFNLENBQUM7SUFReEMsQ0FBQztJQUVXLHVDQUFxQixHQUFHLHdCQUF3QixDQUFDO0lBTTlELG1EQUFtRDtJQUN0QyxxQ0FBbUIsR0FBRyxDQUFDLENBQUMsT0FBTyxVQUFVLEtBQUssV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDbkcsdUNBQXFCLEdBQUcsa0JBQUEsbUJBQW1CLENBQUM7SUFFekQsbURBQW1EO0lBQ3hDLG1DQUFpQixHQUFnQixrQkFBQSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVuRyw4Q0FBOEM7SUFDbkMsMkJBQVMsR0FBdUIsSUFB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akIsaUJBQWlCLFFBQXFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJqcXVlcnlcIi8+XG5cbi8vIFRoaXMgZmlsZSBjb250YWlucyB0eXBlcyBhbmQgaW50ZXJuYWwgc3RhdGUgdXNlZCBieSB0aGUgZnJhbWV3b3JrIHRoYXQgaW5kaXZpZHVhbCBjb21wb25lbnRzXG4vLyBpbiB0aGUgbGlicmFyeSBuZWVkIGtub3dsZWRnZSBvZiBzdWNoIGFzIEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5cblxuZGVjbGFyZSB2YXIgVHVyYm9saW5rcyA6IGFueTtcblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICAvLyBIYXMgYSBkZXBlbmRlbmN5IG9uIEpRdWVyeS4gU2hvdWxkIGJlIGxvYWRlZCBhZnRlciBUdXJib2xpbmtzIHRvIHJlZ2lzdGVyXG4gICAgLy8gY2xlYW51cEZ1bmMgb24gJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicgZXZlbnQuXG4gICAgZXhwb3J0IGludGVyZmFjZSBHbG9iYWxIYW5kbGUgZXh0ZW5kcyBXaW5kb3cge1xuICAgIH1cblxuICAgIC8vIEFkZCB0aGUgc2NyaXB0IHRhZyBiZWxvdyBpbiB0aGUgaGVhZGVyIG9mIHlvdXIgcGFnZTpcbiAgICAvLyA8c2NyaXB0PiBcInVzZSBzdHJpY3RcIjsgdmFyIGdIbmRsID0gdGhpczsgdmFyIHN0YXRlVG9DbGVhck9uTmF2aWdhdGlvbiA9IHt9OyB2YXIgaG9va3MgPSB7IHByZTogW10sIHBvc3Q6IFtdLCBwYWdlQ2xlYW51cDogW10gfTsgPC9zY3JpcHQ+XG4gICAgZXhwb3J0IGRlY2xhcmUgdmFyIGhvb2tzIDoge1xuICAgICAgICAvLyBJbnZva2VkIGFmdGVyIGRvY3VtZW50IGlzIHJlYWR5IChidXQgYmVmb3JlIE1pbmlIdG1sVmlld01vZGVsLnJlYWR5RnVuYylcbiAgICAgICAgcHJlOiAoKCkgPT4gdm9pZClbXSxcblxuICAgICAgICAvLyBJbnZva2VkIGFmdGVyIGRvY3VtZW50IGlzIHJlYWR5IChidXQgYWZ0ZXIgTWluaUh0bWxWaWV3TW9kZWwucmVhZHlGdW5jKVxuICAgICAgICBwb3N0OiAoKCkgPT4gdm9pZClbXSxcblxuICAgICAgICAvLyBFeHBlcmltZW50YWw6IE9ubHkgbWFrZXMgc2Vuc2UgaWYgdXNlZCB3aXRoIFR1cmJvbGlua3NcbiAgICAgICAgcGFnZUNsZWFudXA/OiAoKCkgPT4gdm9pZClbXVxuICAgIH07XG5cbiAgICBleHBvcnQgbGV0IGdIbmRsIDogR2xvYmFsSGFuZGxlID0gd2luZG93O1xuICAgIGV4cG9ydCBkZWNsYXJlIHZhciBzdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gOiBhbnk7XG5cbiAgICAvLyBBIHBhcnQgb2YgdGhlIFNQQSBzdXBwcG9ydFxuICAgIGV4cG9ydCBjb25zdCBlbnVtIE9iamVjdExpZmVDeWNsZSB7XG4gICAgICAgIFRyYW5zaWVudCA9IDAsIC8vIE9ubHkgZm9yIHNpbmdsZSBwYWdlLCBvYmplY3Qgc2hvdWxkIGF1dG9tYXRpY2FsbHkgYmUgZGVzdHJveWVkIHdoZW4gbmF2aWdhdGluZyBmcm9tIHBhZ2VcbiAgICAgICAgVmFyaWFibGVQZXJzaXN0ZW5jZSA9IDEsIC8vIExpZmV0aW1lIGlzIG1hbmFnZWQgbWFudWFsbHkgKHNob3VsZCBub3QgYmUgYXV0b21hdGljYWxseSBkZXN0cm95ZWQgd2hlbiBuYXZpZ2F0aW5nIHBhZ2VzKVxuICAgICAgICBJbmZpbml0ZVBlcnNpc3RlbmNlID0gMiAvLyBOb3QgdG8gYmUgZGVzdHJveWVkIChpbnRlbmRlZCB0byBiZSBwZXJzaXN0ZW50IGFjcm9zcyBpbmZpbml0ZSBwYWdlIG5hdmlnYXRpb25zKVxuICAgIH07XG5cbiAgICBleHBvcnQgY29uc3QgSHRtbElucHV0Q2hhbmdlRXZlbnRzID0gJ2NoYW5nZSB0ZXh0SW5wdXQgaW5wdXQnO1xuXG4gICAgZXhwb3J0IGludGVyZmFjZSBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgb2JqZWN0TGlmZUN5Y2xlPzogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgIH1cblxuICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgIGV4cG9ydCBjb25zdCBUdXJib2xpbmtzQXZhaWxhYmxlID0gKCh0eXBlb2YgVHVyYm9saW5rcyAhPT0gJ3VuZGVmaW5lZCcpICYmIChUdXJib2xpbmtzICE9IG51bGwpKSA/IHRydWUgOiBmYWxzZTtcbiAgICBleHBvcnQgY29uc3QgU2luZ2xlUGFnZUFwcGxpY2F0aW9uID0gVHVyYm9saW5rc0F2YWlsYWJsZTtcblxuICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgIGV4cG9ydCBsZXQgUGFnZVByZUNhY2hlRXZlbnQ6IHN0cmluZ3xudWxsID0gVHVyYm9saW5rc0F2YWlsYWJsZSA/ICd0dXJib2xpbmtzOmJlZm9yZS1jYWNoZScgOiBudWxsO1xuXG4gICAgLy8gVG8gYmUgc2V0IGJ5IHVzZXIgKGZpcmVkIHdoZW4gRE9NIGlzIHJlYWR5KVxuICAgIGV4cG9ydCBsZXQgcmVhZHlGdW5jIDogKCgpID0+IHZvaWQpfG51bGwgPSBudWxsO1xuXG4gICAgLy8gRm9yIHVzZXJzIHRvIHN1cHBseSBob29rcyAobGFtYmRhIGZ1bmN0aW9ucykgdGhhdCB0aGV5IHdhbnQgdG8gZmlyZSBvbiBlYWNoIG5hdmlnYXRpb24gKG5vdGVcbiAgICAvLyB0aGF0IHRoZXNlIGFycmF5cyBhcmUgbm90IGVtcHRpZWQgYXMgZXhlY3V0ZWQpLlxuICAgIGV4cG9ydCBsZXQgY2xlYW51cEhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBleHBvcnQgbGV0IHByZVJlYWR5SG9va3MgOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xuICAgIGV4cG9ydCBsZXQgcG9zdFJlYWR5SG9va3MgOiAoKCkgPT4gdm9pZClbXSA9IFtdO1xufVxuIiwiXHJcbi8vIERvZXMgbm90IHJlYWxseSBkZXBlbmQgb24gYW55dGhpbmdcclxuXHJcblwidXNlIHN0cmljdFwiO1xyXG5cclxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcclxuZXhwb3J0IG5hbWVzcGFjZSBTY3JlZW5EaW1lbnNpb25zIHtcclxuICAgIGV4cG9ydCBpbnRlcmZhY2UgU2NyZWVuRGltZW5zaW9ucyB7XHJcbiAgICAgICAgYXZhaWxhYmxlSGVpZ2h0IDogbnVtYmVyO1xyXG4gICAgICAgIGF2YWlsYWJsZVdpZHRoIDogbnVtYmVyO1xyXG4gICAgICAgIGRldmljZUhlaWdodCA6IG51bWJlcjtcclxuICAgICAgICBkZXZpY2VXaWR0aCA6IG51bWJlcjtcclxuICAgIH1cclxuXHJcbiAgICBleHBvcnQgdmFyIEdldFNjcmVlbkRpbWVuc2lvbnMgPSBmdW5jdGlvbigpIDogU2NyZWVuRGltZW5zaW9ucyB7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgYXZhaWxhYmxlSGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmF2YWlsSGVpZ2h0LFxyXG4gICAgICAgICAgICBhdmFpbGFibGVXaWR0aDogd2luZG93LnNjcmVlbi5hdmFpbFdpZHRoLFxyXG4gICAgICAgICAgICBkZXZpY2VIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uaGVpZ2h0LFxyXG4gICAgICAgICAgICBkZXZpY2VXaWR0aDogd2luZG93LnNjcmVlbi53aWR0aFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIgLz5cblxuLy8gRGVwZW5kcyBvbiBKUXVlcnlcbi8vIERlcGVuZHMgb24gLi9iYXNlLmpzLnRzIGR1ZSB0byB0aGUgZmFjdCB0aGF0IHRoZSBmdXR1cmUgSVVzZXJJbnRlcmZhY2VFbGVtZW50IG1pZ2h0IHJlbHkgb24gY2xlYW51cEhvb2tzXG4vLyBmb3IgdGVhcmRvd24gbG9naWMuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBNaW5pSHRtbFZpZXdNb2RlbCB7XG4gICAgICAgIGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuNi4wJztcblxuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBCaW5kaW5nTW9kZSB7IE9uZVRpbWUsIE9uZVdheVJlYWQsIE9uZVdheVdyaXRlLCBUd29XYXkgfTtcblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8VCBleHRlbmRzIFZpZXdNb2RlbD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlO1xuICAgICAgICAgICAgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXTsgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICB2YWx1ZT86IGFueTsgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgdmlld01vZGVsUmVmPzogVDtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQ+IHtcbiAgICAgICAgICAgIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpO1xuICAgICAgICAgICAgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8VD4ge1xuICAgICAgICAgICAgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KTtcbiAgICAgICAgICAgIG9uQ2hhbmdlRnVuYz86ICgodm06IFQpID0+IHZvaWQpOyAvLyBFaXRoZXIgaW1wbGVtZW50IG9uQ2hhbmdlIG9uIElWaWV3TW9kZWwgT1IgcHJvdmlkZSBvbkNoYW5nZUZ1bmNcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiwgSVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8VD4ge1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmluZGluZ01vZGUuT25lVGltZSBjYW4gYmUgdGhvdWdodCBvZiBhcyBzZXQgdmFsdWUgb25jZSBhbmQgZm9yZ2V0IChubyBldmVudCBoYW5kbGVycyBzZXQgb3IgSVZpZXdNb2RlbFByb3BlcnR5IHN0b3JlZClcbiAgICAgICAgLy8gVmFsdWUgaXMgTk9UIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlPbmVUaW1lQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVUaW1lO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZSBpcyBhIHdheSB0byBzZXQgdmFsdWVzIChubyBldmVudCBoYW5kbGVycyBzZXQgYnV0IElWaWV3TW9kZWxQcm9wZXJ0eTxUPiBhcmUgc3RvcmVkKS5cbiAgICAgICAgLy8gVmFsdWUgaXMgcmVhZCBmcm9tIEhUTUwgZWxlbWVudCBvbiBWaWV3TW9kZWwgY29uc3RydWN0aW9uICh1bmxlc3MgdmFsdWUgcHJvdmlkZWQgZm9yIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2UpLlxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVdyaXRlQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTpCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5PFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5Ud29XYXk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTaG91bGQgaW5oZXJpdCBmcm9tIHRoaXMgY2xhc3MgaW5zdGVhZCBvZiBpbnN0YW50aWF0aW5nIGl0IGRpcmVjdGx5LlxuICAgICAgICBleHBvcnQgYWJzdHJhY3QgY2xhc3MgVmlld01vZGVsIGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBwcm90ZWN0ZWQgaWRUb0JpbmRhYmxlUHJvcGVydHk6IHsgW2luZGV4OiBzdHJpbmddOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4gfTtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIHByaXZhdGUgc3RhdGljIHJlYWRvbmx5IENoYW5nZUV2ZW50cyA9IEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cztcbiAgICAgICAgICAgIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZSxcbiAgICAgICAgICAgICAgICAuLi5iaW5kYWJsZVByb3BlcnRpZXM6IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPltdXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9iamVjdExpZmVDeWNsZSA9IG9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgICAgICB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5ID0ge307XG4gICAgICAgICAgICAgICAgYmluZGFibGVQcm9wZXJ0aWVzLmZvckVhY2godGhpcy5wcm9jZXNzQmluZGFibGVQcm9wZXJ0eSwgdGhpcyk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgICAgIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5wdXNoKHRoaXMuZ2VuVGVhcmRvd25GdW5jKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByb3RlY3RlZCBwcm9jZXNzQmluZGFibGVQcm9wZXJ0eShiUDogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KSB7XG4gICAgICAgICAgICAgICAgc3dpdGNoIChiUC5pZC5jb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGNhc2UgU3RyaW5nOlxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKGJQKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBBcnJheTpcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiUC5pZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQmluZGFibGVQcm9wZXJ0eVNpbmdsZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICg8YW55PmJQKS5pZFtpXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiaW5kaW5nTW9kZTogKDxhbnk+YlApLmJpbmRpbmdNb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAoPGFueT5iUCkudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0RGF0YUZ1bmM6ICg8YW55PmJQKS5zZXREYXRhRnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREYXRhRnVuYzogKDxhbnk+YlApLmdldERhdGFGdW5jLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlRnVuYzogKDxhbnk+YlApLm9uQ2hhbmdlRnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb252ZXJ0ZXJGdW5jOiAoPGFueT5iUCkuY29udmVydGVyRnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZWxSZWY6ICg8YW55PmJQKS52aWV3TW9kZWxSZWZcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gYXMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBVbmFjY2VwdGFibGUgaWQgZGV0ZWN0ZWQgaW4gSVZpZXdNb2RlbFByb3BlcnR5QmFzZTogJHtiUH1gKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHByb2Nlc3NCaW5kYWJsZVByb3BlcnR5U2luZ2xlKGJQOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD4pIHtcbiAgICAgICAgICAgICAgICBsZXQgYmluZGFibGVQcm9wZXJ0eUlkOiBzdHJpbmcgPSA8c3RyaW5nPmJQLmlkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFN0b3JlIGFuZCBhdHRhY2ggYmluZGFibGUgcHJvcGVydGllcyB0aGF0IGRvIG5vdCBoYXZlIGEgT25lVGltZSBiaW5kaW5nTW9kZS5cbiAgICAgICAgICAgICAgICAgICAgLy8gTm90ZSB0aGF0IE9uZVRpbWUgYmluZGluZ01vZGUgcHJvcGVydGllcyBhcmUgbm90IHN0b3JlZC5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJpbmRpbmdNb2RlICE9PSBCaW5kaW5nTW9kZS5PbmVUaW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiUC52aWV3TW9kZWxSZWYgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtiaW5kYWJsZVByb3BlcnR5SWRdID0gYlA7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBCaW5kaW5nTW9kZS5PbmVUaW1lIGlzIHNldCBhbHdheXNcbiAgICAgICAgICAgICAgICAgICAgaWYgKChiUC52YWx1ZSAhPT0gdW5kZWZpbmVkKSB8fCAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVRpbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQLCBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQXR0YWNoIG9uQ2hhbmdlIGV2ZW50IGhhbmRsZXIgZm9yIFR3b1dheSBhbmQgT25lV2F5UmVhZCBwcm9wZXJ0aWVzLlxuICAgICAgICAgICAgICAgICAgICBpZiAoYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLlR3b1dheSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgYlAuYmluZGluZ01vZGUgPT09IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJyMnICsgYmluZGFibGVQcm9wZXJ0eUlkKS5vbihWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKGBEZXRlY3RlZCBjaGFuZ2UgaW46ICR7YmluZGFibGVQcm9wZXJ0eUlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaGFuZGxlUHJvcGVydHlDaGFuZ2VkRXZlbnQoYmluZGFibGVQcm9wZXJ0eUlkKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgoPElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFZpZXdNb2RlbD4+YlApLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8KCh2bTogVmlld01vZGVsKSA9PiB2b2lkKT4oPElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFZpZXdNb2RlbD4+YlApLm9uQ2hhbmdlRnVuYykoPFZpZXdNb2RlbD5iUC52aWV3TW9kZWxSZWYpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mICg8YW55PmJQLnZpZXdNb2RlbFJlZikub25DaGFuZ2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxhbnk+YlAudmlld01vZGVsUmVmKS5vbkNoYW5nZShiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBwcm92aWRlIG9uQ2hhbmdlRnVuYyAoYWx0ZXJuYXRpdmVseSBpbXBsZW1lbnQgb25DaGFuZ2UgWyhodG1sSWQ6IHN0cmluZykgPT4gdm9pZF0gbWV0aG9kKSBmb3IgaW1wbGVudGF0aW9uIG9mIElWaWV3TW9kZWxQcm9wZXJ0eSBmb3IgaWQ6ICcgKyBiaW5kYWJsZVByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUcmlnZ2VycyBjaGFuZ2UgaW4gVUkgdG8gbWF0Y2ggdmFsdWUgb2YgcHJvcGVydHkgaW4gaWRUb0JpbmRhYmxlUHJvcGVydHkuXG4gICAgICAgICAgICBwcm90ZWN0ZWQgaGFuZGxlUHJvcGVydHlDaGFuZ2VkRXZlbnQocHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJpbmRhYmxlUHJvcGVydHkgPSB0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5W3Byb3BlcnR5SWRdO1xuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGJpbmRhYmxlUHJvcGVydHkuYmluZGluZ01vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2FzZSBCaW5kaW5nTW9kZS5PbmVUaW1lOlxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgY29uc29sZS5lcnJvcihcIklNUE9TU0lCTEVcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkOlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxWaWV3TW9kZWw+PmJpbmRhYmxlUHJvcGVydHksIHByb3BlcnR5SWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuT25lV2F5V3JpdGU6XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLlR3b1dheTpcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5zZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHkoPElWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBJbnZhbGlkIGJpbmRpbmdNb2RlIGZvciBCaW5kaW5nIFByb3BlcnR5IGFzc29jaWF0ZWQgd2l0aCBpZDogJHtwcm9wZXJ0eUlkfWApO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5UZWFyZG93bkZ1bmMoc2VsZjogVmlld01vZGVsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHtzZWxmLnRlYXJkb3duLmNhbGwoc2VsZik7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGVhcmRvd24ob3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGU6Ym9vbGVhbiA9IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZSAmJlxuICAgICAgICAgICAgICAgICAgICAhb3ZlcnJpZGVPYmplY3RMaWZlQ3ljbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIHRlYXJkb3duIEZyb250RW5kRnJhbWV3b3JrLk1pbmlIdG1sVmlld01vZGVsLlZpZXdNb2RlbCBpbnN0YW5jZSBkdWUgdG8gb2JqZWN0TGlmZUN5Y2xlIG5vdCBiZWluZyBvdmVycmlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLmlkVG9CaW5kYWJsZVByb3BlcnR5KS5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDbGVhbmluZyB1cCBldmVudCBoYW5kbGVycyBzZXQgdXAgaW4gVmlld01vZGVsIChpZDogJHtpZH0pYCk7XG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgaWQpLm9mZihWaWV3TW9kZWwuQ2hhbmdlRXZlbnRzKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgcmV0cmlldmVBbmRTZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpOiBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiB7XG4gICAgICAgICAgICAgICAgaWYgKGJQLmdldERhdGFGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgYlAudmFsdWUgPSBiUC5nZXREYXRhRnVuYygpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnZhbHVlID0gKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHByb3BlcnR5SWQpKS52YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJQO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyBzZXRWYWx1ZUZvckJpbmRhYmxlUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4oYlA6IElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB2YXIgY252cnRyID0gYlAuY29udmVydGVyRnVuYyB8fCBmdW5jdGlvbih4KSB7IHJldHVybiB4OyB9O1xuICAgICAgICAgICAgICAgIGlmIChiUC5zZXREYXRhRnVuYyA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJyMnICsgcHJvcGVydHlJZCkudmFsKGNudnJ0cihiUC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnNldERhdGFGdW5jKGNudnJ0cihiUC52YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eTxUIGV4dGVuZHMgVmlld01vZGVsPiBpbXBsZW1lbnRzIElWaWV3TW9kZWxQcm9wZXJ0eTxUPiB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGdldERhdGFGdW5jPzogKCgpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIG9uQ2hhbmdlRnVuYz86ICgodm06IFQpID0+IHZvaWQpLCAvLyBFaXRoZXIgaW1wbGVtZW50IG9uQ2hhbmdlIG9uIElWaWV3TW9kZWwgT1IgcHJvdmlkZSBvbkNoYW5nZUZ1bmNcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVUaW1lQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVRpbWUgPSA8QmluZGluZ01vZGUuT25lVGltZT5CaW5kaW5nTW9kZS5PbmVUaW1lO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgY29udmVydGVyRnVuYz86ICgoYTogYW55KSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLk9uZVdheVJlYWQgPSA8QmluZGluZ01vZGUuT25lV2F5UmVhZD5CaW5kaW5nTW9kZS5PbmVXYXlSZWFkO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZSA9IDxCaW5kaW5nTW9kZS5PbmVXYXlXcml0ZT5CaW5kaW5nTW9kZS5PbmVXYXlXcml0ZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eVR3b1dheUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuVHdvV2F5ID0gPEJpbmRpbmdNb2RlLlR3b1dheT5CaW5kaW5nTW9kZS5Ud29XYXk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG5cbi8vIFJlbGllcyBvbiAuL2Jhc2UuanMudHMgYmVjYXVzZSB0aGlzIGxpYnJhcnkgc2hvdWxkIGJlIGFibGUgdG8gdGFrZSBhZHZhbnRhZ2Ugb2YgVHVyYm9saW5rcyBub3QgcmVsb2FkaW5nIHBhZ2UuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgZXhwb3J0IG5hbWVzcGFjZSBTdG9yYWdlIHtcbiAgICAgICAgZXhwb3J0IGNvbnN0IFZFUlNJT04gPSAnMC4xLjAnO1xuICAgICAgICBleHBvcnQgY29uc3QgZW51bSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiB7IFRyYW5zaWVudCwgU2Vzc2lvbiwgQWNyb3NzU2Vzc2lvbnMgfVxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlPzogYm9vbGVhbjtcbiAgICAgICAgICAgIGV4cGlyeURhdGU/OiBEYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGV4dGVuZHMgSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIHtcbiAgICAgICAgICAgIGluZGVmaW5pdGU/OiBib29sZWFuOyAvLyBNVVNUIEJFIGBmYWxzZWBcbiAgICAgICAgICAgIGV4cGlyeURhdGU6IERhdGU7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiBleHRlbmRzIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlOiBib29sZWFuOyAvLyBNVVNUIEJFIGB0cnVlYFxuICAgICAgICAgICAgZXhwaXJ5RGF0ZT86IERhdGU7IC8vICBJR05PUkVEXG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgRXhwaXJpbmdDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUV4cGlyaW5nQ2FjaGVEdXJhdGlvbiB7XG4gICAgICAgICAgICBwdWJsaWMgaW5kZWZpbml0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgY29uc3RydWN0b3IocHVibGljIGV4cGlyeURhdGU6IERhdGUpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIEluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIGltcGxlbWVudHMgSUluZGVmaW5pdGVDYWNoZUR1cmF0aW9uIHtcbiAgICAgICAgICAgIHB1YmxpYyBpbmRlZmluaXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBUaGlzIGlzIG5lZWRlZCBmb3IgYnJvd3NlcnMgdGhhdCBzYXkgdGhhdCB0aGV5IGhhdmUgU2Vzc2lvblN0b3JhZ2UgYnV0IGluIHJlYWxpdHkgdGhyb3cgYW4gRXJyb3IgYXMgc29vblxuICAgICAgICAvLyBhcyB5b3UgdHJ5IHRvIGRvIHNvbWV0aGluZy5cbiAgICAgICAgbGV0IGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGUgPSB0cnVlO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgndGVzdGE4OTBhODA5JywgJ3ZhbCcpO1xuICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2UucmVtb3ZlSXRlbSgndGVzdGE4OTBhODA5Jyk7XG4gICAgICAgIH0gY2F0Y2ggKF9lcnJvcikge1xuICAgICAgICAgICAgaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZSA9IGZhbHNlO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgLy8gTm90aGluZyB0byBkby4uLlxuICAgICAgICB9XG4gICAgICAgIGV4cG9ydCBjb25zdCBJc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlID0gaXNfc2Vzc2lvbl9zdG9yYWdlX2F2YWlsYWJsZTtcblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2VQcm9maWxlIHtcbiAgICAgICAgICAgIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbltdO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIENsaWVudFN0b3JhZ2VQcm9maWxlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZVByb2ZpbGUge1xuICAgICAgICAgICAgcHVibGljIERhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzOiBBcnJheTxEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj47XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzID0gW0RhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudF07XG4gICAgICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlR1cmJvbGlua3NBdmFpbGFibGUgfHwgRnJvbnRFbmRGcmFtZXdvcmsuU3RvcmFnZS5Jc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlKVxuICAgICAgICAgICAgICAgICAgICB0aGlzLkRhdGFQZXJzaXN0YW5jZUR1cmF0aW9uQ2FwYWJpbGl0aWVzLnB1c2goRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgc2V0OiAoKGtleTphbnksIHZhbDphbnkpID0+IHZvaWQpO1xuICAgICAgICAgICAgZ2V0OiAoKGtleTphbnkpID0+IGFueSk7XG4gICAgICAgIH1cbiAgICAgICAgLypcbiAgICAgICAgZXhwb3J0IGNsYXNzIFRyYW5zaWVudFN0b3JhZ2UgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXQoa2V5OmFueSwgdmFsOmFueSkgOiB2b2lkID0+IHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZ2V0KGtleTphbnkpIDogYW55ID0+IHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAqL1xuICAgICAgICBleHBvcnQgY2xhc3MgQ2xpZW50U3RvcmFnZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2Uge1xuICAgICAgICAgICAgcHVibGljIGNsaWVudFByb2ZpbGUgPSBuZXcgQ2xpZW50U3RvcmFnZVByb2ZpbGUoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHByaXZhdGUgZXJyb3JPbkZhaWwgPSBmYWxzZVxuICAgICAgICAgICAgKSB7IH1cblxuICAgICAgICAgICAgcHVibGljIHNldChrZXk6IGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgdmFsOiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uID0gRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uU2Vzc2lvbixcbiAgICAgICAgICAgICAgICAgICAgICAgY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24/OiBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBSZW1vdmUgdXBvbiBhZGRpbmcgc3VwcG9ydCBmb3IgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uICE9IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiY2FjaGVFeHBpcmF0aW9uRHVyYXRpb24gaWdub3JlZCBpbiBEYXRhYmFzZSNzZXQuXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlRyYW5zaWVudDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKGtleSwgdmFsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JPbkZhaWwpIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KGtleTogYW55LCBkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbj86IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uKSA6IGFueXxudWxsfHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb246XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uQWNyb3NzU2Vzc2lvbnM6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lcnJvck9uRmFpbCkgdGhyb3cgZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBmb3JjZUNhY2hlRXhwaXJ5KGtleTogYW55KSB7IGNvbnNvbGUuZXJyb3IoYFVuaW1wbGVtZW50ZWQgRGF0YWJhc2UjZm9yY2VDYWNoZUV4cGlyeTogRmFpbGVkIHRvIGV4cGlyZSBrZXk6ICR7a2V5fWApOyB0aHJvdyBrZXk7IH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2Jhc2UuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdG9yYWdlLmpzLnRzXCIvPlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIC8vIFZpc2l0cyBzaXRlIHVzaW5nIFR1cmJvbGlua3MgKG9yIGFub3RoZXIgU1BBIGZyYW1ld29yayB3aGVuIHN1cHBvcnQgaXMgYWRkZWQpIGlmIHBvc3NpYmxlLlxuICAgIC8vIFNob3VsZCBhbHdheXMgcmVzdWx0IGluIG9wZW5pbmcgZ2l2ZW4gbGluayAoaWYgZ2l2ZW4gYXJndW1lbnQgZm9yIGBsaW5rYCBpcyB2YWxpZCBVUkwpLlxuICAgIGV4cG9ydCBsZXQgdmlzaXRMaW5rID0gZnVuY3Rpb24obGluayA6IHN0cmluZywge2ZvcmNlUmVsb2FkLCBuZXdUYWJ9OiB7Zm9yY2VSZWxvYWQ/OiBib29sZWFuLCBuZXdUYWI/OiBib29sZWFufSA9IHtmb3JjZVJlbG9hZDogZmFsc2UsIG5ld1RhYjogZmFsc2V9KSB7XG4gICAgICAgIGlmICgobmV3VGFiICE9IG51bGwpICYmIDxib29sZWFuPm5ld1RhYikge1xuICAgICAgICAgICAgd2luZG93Lm9wZW4obGluaywgXCJfYmxhbmtcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmICEoKGZvcmNlUmVsb2FkICE9IG51bGwpICYmIDxib29sZWFuPmZvcmNlUmVsb2FkKSkge1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5UdXJib2xpbmtzQXZhaWxhYmxlICYmXG4gICAgICAgICAgICAgICAgICAgICh0eXBlb2YoVHVyYm9saW5rcy52aXNpdCkgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgIFR1cmJvbGlua3MudmlzaXQobGluayk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGxpbms7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGV0IGNsZWFudXBGdW5jID0gKCkgPT4ge1xuICAgICAgICAvLyBPbmx5IGV4ZWN1dGUgaW4gc2luZ2xlIHBhZ2UgYXBwbGljYXRpb25zIChpbiBvdGhlciBjYXNlLCBwYWdlIHdvdWxkIGJlIHJlc2V0IGFueXdheXMpXG4gICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2xlYW51cEhvb2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHsgY2xlYW51cEhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBwcmVSZWFkeUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJlUmVhZHlIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHsgcHJlUmVhZHlIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgcG9zdFJlYWR5RnVuYyA9ICgpID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3N0UmVhZHlIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdHJ5IHsgcG9zdFJlYWR5SG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEZyb250RW5kRnJhbWV3b3JrLnN0YXRlVG9DbGVhck9uTmF2aWdhdGlvbiA9IHt9O1xuICAgIH07XG5cbiAgICBleHBvcnQgbmFtZXNwYWNlIFB1YlN1YiB7XG4gICAgICAgIGludGVyZmFjZSBQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvIGV4dGVuZHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBzdWJzY3JpYmVySWRlbnRpZmllcjogc3RyaW5nO1xuICAgICAgICAgICAgc3Vic2NyaWJlclNldHRlcjogKChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQ7XG4gICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzIFB1YlN1YlJlbGF5IGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBwdWJsaWMgc3RhdGljIERlZmF1bHRPYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50O1xuICAgICAgICAgICAgcHVibGljIG9iamVjdExpZmVDeWNsZTogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IHN1YnNjcmlwdGlvbklkZW50aWZpZXI6IHN0cmluZztcbiAgICAgICAgICAgIHByaXZhdGUgcHViU3ViUmVsYXlTdWJzY3JpYmVyczogUHViU3ViUmVsYXlTdWJzY3JpYmVySW5mb1tdID0gW107XG4gICAgICAgICAgICBwcml2YXRlIGxhc3RTZW50TWVzc2FnZTogYW55OyAvLyBUbyBiZSByZS1icm9hZGNhc3QgYWZ0ZXIgbmF2aWdhdGluZyBwYWdlc1xuICAgICAgICAgICAgcHJpdmF0ZSBmaXJzdE1lc3NhZ2VTZW50UDogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykge1xuICAgICAgICAgICAgICAgIHRoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllciA9IHN1YnNjcmlwdGlvbklkZW50aWZpZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBQdWJTdWJSZWxheS5EZWZhdWx0T2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgYWRkU3Vic2NyaWJlcihzdWJzY3JpYmVySW5mbzpQdWJTdWJSZWxheVN1YnNjcmliZXJJbmZvKSA6IHZvaWQge1xuICAgICAgICAgICAgICAgIGlmIChzdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoKDxudW1iZXI+dGhpcy5vYmplY3RMaWZlQ3ljbGUpIDwgKDxudW1iZXI+c3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBzdWJzY3JpYmVySW5mby5vYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldLnN1YnNjcmliZXJJZGVudGlmaWVyID09PVxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlckluZm8uc3Vic2NyaWJlcklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgQ2Fubm90IHN1YnNjcmliZSBtb3JlIHRoYW4gb25jZSB0byAoJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9KSB3aXRoICgke3N1YnNjcmliZXJJbmZvLnN1YnNjcmliZXJJZGVudGlmaWVyfSkuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMucHVzaChzdWJzY3JpYmVySW5mbyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWxheU1lc3NhZ2Uoc2VuZGluZ1N1YnNjcmliZXJJZGVudGlmaWVyOnN0cmluZywgbWVzc2FnZTphbnkpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhgUmVsYXlpbmcgbWVzc2FnZSBmcm9tIFB1YlN1YlJlbGF5I3JlbGF5TWVzc2FnZSBmb3Igc3Vic2NyaXB0aW9uOiAke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn19YClcbiAgICAgICAgICAgICAgICB0aGlzLmxhc3RTZW50TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdE1lc3NhZ2VTZW50UCA9IHRydWU7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbGV2YW50U3Vic2NyaWJlciA9IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFByaW50aW5nICR7aX0tdGggcmVsZXZhbnRTdWJzY3JpYmVyYCk7XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHJlbGV2YW50U3Vic2NyaWJlcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIgIT09XG4gICAgICAgICAgICAgICAgICAgICAgICBzZW5kaW5nU3Vic2NyaWJlcklkZW50aWZpZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcihtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWVzIHRoYXQgYSB0cmlnZ2VyIGNoYW5nZSBldmVudCBzaG91bGQgbm90IGJlIGZpcmVkIG9uIHNldHRpbmcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSBzdWJzY3JpYmVyU2V0dGVyIGFyZyB3aGVuIHN1YnNjcmliaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYFNldHRpbmcgdmFsdWUgKCR7bWVzc2FnZX0pIGZvciAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn0gaWQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyKS52YWwobWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmZpcnN0TWVzc2FnZVNlbnRQKSByZXR1cm47XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFJlbGF5aW5nIG1lc3NhZ2UgZnJvbSBQdWJTdWJSZWxheSNyZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSBmb3Igc3Vic2NyaXB0aW9uOiAke3RoaXMuc3Vic2NyaXB0aW9uSWRlbnRpZmllcn19YClcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVsZXZhbnRTdWJzY3JpYmVyID0gdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIpID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIodGhpcy5sYXN0U2VudE1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWVzIHRoYXQgYSB0cmlnZ2VyIGNoYW5nZSBldmVudCBzaG91bGQgbm90IGJlIGZpcmVkIG9uIHNldHRpbmcgdmFsdWUuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIHN1YnNjcmliZXJTZXR0ZXIgYXJnIHdoZW4gc3Vic2NyaWJpbmcuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5pbmZvKGBTZXR0aW5nIHZhbHVlICgke3RoaXMubGFzdFNlbnRNZXNzYWdlfSkgZm9yICR7cmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyfSBpZC5gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKHRoaXMubGFzdFNlbnRNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50KVxuICAgICAgICAgICAgICAgICAgICByZXR1cm47IC8vIFNob3J0LWNpcmN1aXQgaWYgaXRlbSB3aWxsIGJlIFB1YlN1YlJlbGF5IGl0c2VsZiB3aWxsIGJlIGRlc3Ryb3llZCBhbnl3YXlzXG5cbiAgICAgICAgICAgICAgICBsZXQgdG9SZW1vdmUgOiBudW1iZXJbXSA9IFtdOyAvLyBpbmRpY2VzICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMpIG9mIHN1YnNjcmliZXJzIHRvIHJlbW92ZVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXS5vYmplY3RMaWZlQ3ljbGUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlICh0b1JlbW92ZS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLnNwbGljZSg8bnVtYmVyPnRvUmVtb3ZlLnBvcCgpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheVN0b3JhZ2UgaW1wbGVtZW50cyBTdG9yYWdlLklLZXlWYWx1ZVN0b3JhZ2UsIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgLy8gVE9ETzogQWxsb3cgdGhlIFB1YlN1YlJlbGF5U3RvcmFnZSB0byBoYXZlIGEgdHJhbnNpZW50IG9iamVjdCBsaWZlIGN5Y2xlXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwcml2YXRlIG1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXM6IGFueTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cyA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5fG51bGx8dW5kZWZpbmVkIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgc2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLCBwdWJTdWJSZWxheTogUHViU3ViUmVsYXkpIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdID0gcHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGxldCBrZXlzVG9EZWxldGUgOiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5cykuZm9yRWFjaCgoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5SW5zdGFuY2UgPSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl07XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5SW5zdGFuY2UuaGFuZGxlTmF2aWdhdGlvbigpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwdWJTdWJSZWxheUluc3RhbmNlLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHB1YlN1YlJlbGF5SW5zdGFuY2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleXNUb0RlbGV0ZS5wdXNoKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c1RvRGVsZXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNba2V5c1RvRGVsZXRlW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyByZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCkgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMpLmZvckVhY2goKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXS5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXlNYW5hZ2VyIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEFsbG93IHRoZSBQdWJTdWJSZWxheU1hbmFnZXIgdG8gaGF2ZSBhIHRyYW5zaWVudCBvYmplY3QgbGlmZSBjeWNsZVxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHJpdmF0ZSBwdWJTdWJSZWxheVN0b3JhZ2U6IFB1YlN1YlJlbGF5U3RvcmFnZSA9IG5ldyBQdWJTdWJSZWxheVN0b3JhZ2UoKTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5jbGVhbnVwSG9va3MpLnB1c2godGhpcy5nZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+cG9zdFJlYWR5SG9va3MpLnB1c2godGhpcy5nZW5SZWJyb2FkY2FzdExhc3RNZXNzYWdlc0Z1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5oYW5kbGVOYXZpZ2F0aW9uKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlcygpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5yZWJyb2FkY2FzdEFsbE1lc3NhZ2VMYXN0UmVsYXllZEJ5U3RvcmVkUHViU3ViUmVsYXlzKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmMoc2VsZjogUHViU3ViUmVsYXlNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYuaGFuZGxlTmF2aWdhdGlvbi5iaW5kKHNlbGYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblJlYnJvYWRjYXN0TGFzdE1lc3NhZ2VzRnVuYyhzZWxmOiBQdWJTdWJSZWxheU1hbmFnZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5yZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZXMuYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZVN1YnNjcmlwdGlvbihcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBzZWxmSWRlbnRpZmllcjpzdHJpbmcsIC8vIHNob3VsZCBiZSBhIENTUyBzZWxlY3RvciAoSlF1ZXJ5IHNlbGVjdG9yKVxuICAgICAgICAgICAgICAgIHNlbGZTZXR0ZXI6KChtZXNzYWdlOmFueSkgPT4gdm9pZCl8bnVsbHx1bmRlZmluZWQgPSB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2VlIGlmIGdpdmVuIGBvYmplY3RMaWZlQ3ljbGVgIGlzIGdyZWF0ZXIgdGhhbiBkZXNpZ25hdGVkIG9iamVjdExpZmVDeWNsZSxcbiAgICAgICAgICAgICAgICAvLyBpZiBpdCBpcywgY2hhbmdlIGhvdyBpdCBpcyBtYW5hZ2VkIChub3QgcmVsZXZhbnQgdW50aWwgb2JqZWN0IGxpZmUgY3ljbGUgb3RoZXJcbiAgICAgICAgICAgICAgICAvLyB0aGFuIEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlIGlzIHN1cHBvcnRlZCkuXG5cbiAgICAgICAgICAgICAgICAoPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5KS5hZGRTdWJzY3JpYmVyKHtcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlcklkZW50aWZpZXI6IHNlbGZJZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpYmVyU2V0dGVyOiBzZWxmU2V0dGVyLFxuICAgICAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGU6IG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlUHVibGlzaGVkTWVzc2FnZShcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOmFueVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5ID0gdGhpcy5oYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5LnJlbGF5TWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBoYW5kbGVQdWJTdWJSZWxheUluaXRpYWxpemF0aW9uQW5kUmV0cmlldmFsKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA6IFB1YlN1YlJlbGF5IHtcbiAgICAgICAgICAgICAgICBsZXQgcHViU3ViUmVsYXkgOiBQdWJTdWJSZWxheXxudWxsfHVuZGVmaW5lZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIHB1YiBzdWIgcmVsYXkgaWYgaXQgZG9lcyBub3QgZXhpc3RcbiAgICAgICAgICAgICAgICBpZiAoKHB1YlN1YlJlbGF5ID0gdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UuZ2V0KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpKSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHB1YlN1YlJlbGF5ID0gbmV3IFB1YlN1YlJlbGF5KHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnB1YlN1YlJlbGF5U3RvcmFnZS5zZXQoXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiA8UHViU3ViUmVsYXk+cHViU3ViUmVsYXk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJbnRlcm5hbCBsaWJyYXJ5IHN0YXRlXG4gICAgICAgIC8vIFRPRE86IE1hbmFnZSBpbnRlcm5hbCBsaWJyYXJ5IHN0YXRlIHdpdGhvdXQgdXNpbmcgZ2xvYmFsc1xuICAgICAgICBsZXQgcHViU3ViUmVsYXlNYW5hZ2VyIDogUHViU3ViUmVsYXlNYW5hZ2VyID0gbmV3IFB1YlN1YlJlbGF5TWFuYWdlcigpOztcblxuICAgICAgICAvLyBUcmVhdCB0aGUgZmlyc3QgdHdvIGFyZ3VtZW50cyB0byB0aGlzIGZ1bmN0aW9uIGFzIGJlaW5nIG1vcmUgYSBwYXJ0IG9mIGEgc3RhYmxlXG4gICAgICAgIC8vIEFQSSB2cyB0aGUgdGhlIHRoaXJkIGFuZCBmb3VydGggYXJndW1lbnRzIHdoaWNoIGFyZSBzdWJqZWN0IHRvIGNoYW5nZS5cbiAgICAgICAgZXhwb3J0IGxldCBzdWJzY3JpYmUgPSAoXG4gICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZyxcbiAgICAgICAgICAgIHNlbGZJZGVudGlmaWVyOnN0cmluZywgLy8gc2hvdWxkIGJlIGEgQ1NTIHNlbGVjdG9yIChKUXVlcnkgc2VsZWN0b3IpIHVubGVzcyBwcm92aWRpbmcgYHNlbGZTZXR0ZXJgIGFyZ3VtZW50XG4gICAgICAgICAgICBzZWxmU2V0dGVyOigobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudFxuICAgICAgICApIDogYW55fHZvaWQgPT4ge1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oXCJQcmludGluZyBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIuc3Vic2NyaWJlIGFyZ3NcIik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZJZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHNlbGZTZXR0ZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8ob2JqZWN0TGlmZUN5Y2xlKTtcbiAgICAgICAgICAgIHB1YlN1YlJlbGF5TWFuYWdlci5oYW5kbGVTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgc2VsZklkZW50aWZpZXIsIHNlbGZTZXR0ZXIsIG9iamVjdExpZmVDeWNsZVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBsZXQgcHVibGlzaCA9IChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZywgbWVzc2FnZTphbnkpID0+IHtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiUHJpbnRpbmcgRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLnB1Ymxpc2ggYXJnc1wiKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKHN1YnNjcmlwdGlvbklkZW50aWZpZXIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8obWVzc2FnZSk7XG4gICAgICAgICAgICBwdWJTdWJSZWxheU1hbmFnZXIuaGFuZGxlUHVibGlzaGVkTWVzc2FnZShzdWJzY3JpcHRpb25JZGVudGlmaWVyLCBtZXNzYWdlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzYWdlOiBEdXJpbmcgaW5pdGlhbGl6YXRpb24gc3Vic2NyaWJlIGJlZm9yZSBwb3N0LWhvb2tzIChwcmVmZXJhYmx5IHByZS1ob29rcykgYW5kIHB1Ymxpc2ggaW4gcG9zdC1ob29rcy5cblxuICAgICAgICAvLyBBc3N1bWVkIHRvIGJlIGNvbnN0cnVjdGVkIGluIHByZS1ob29rXG4gICAgICAgIGV4cG9ydCBjbGFzcyBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFN1cHBvcnQgb3RoZXIgb2JqZWN0IGxpZmUgY3ljbGVzXG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2U7XG4gICAgICAgICAgICBwdWJsaWMgc3RvcmFnZUtleTogc3RyaW5nO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgc3RvcmFnZUtleTpzdHJpbmcsXG4gICAgICAgICAgICAgICAgcHVibGlzaEV4aXN0aW5nU3RvcmVkVmFsdWU6Ym9vbGVhbiA9IHRydWVcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmFnZUtleSA9IHN0b3JhZ2VLZXk7XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBTaG9ydC1DaXJjdWl0IGlmIHNlc3Npb24gc3RvcmFnZSBub3QgYXZhaWxhYmxlXG4gICAgICAgICAgICAgICAgaWYgKCFTdG9yYWdlLklzU2Vzc2lvblN0b3JhZ2VBdmFpbGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FiYW5kb25pbmcgUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyIGluaXRpYWxpemF0aW9uIHNpbmNlIHNlc3Npb24gc3RvcmFnZSBpcyBub3QgYXZhaWxhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyh0aGlzKSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICApXG5cbiAgICAgICAgICAgICAgICBsZXQgaW5pdGlhbFN0b3JlZFZhbHVlID0gc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbShzdG9yYWdlS2V5KTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsU3RvcmVkVmFsdWUgIT0gbnVsbCAmJlxuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoRXhpc3RpbmdTdG9yZWRWYWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgaG9va3MucG9zdC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgaW5pdGlhbFN0b3JlZFZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmModmFsOmFueSkge1xuICAgICAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0odGhpcy5zdG9yYWdlS2V5LCB2YWwudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuU3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYyhzZWxmOiBQdWJTdWJTZXNzaW9uU3RvcmFnZVN1YnNjcmliZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKG1lc3NhZ2U6YW55KSA9PiB7c2VsZi5zdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jLmNhbGwoc2VsZiwgbWVzc2FnZSk7fVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXNzdW1lZCB0byBiZSBjb25zdHJ1Y3RlZCBpbiBwcmUtaG9va1xuICAgICAgICBleHBvcnQgY2xhc3MgSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmliZXIgaW1wbGVtZW50cyBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaHRtbElkIDogc3RyaW5nO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9uQ2hhbmdlRnVuYyA6ICgoKSA9PiB2b2lkKXxudWxsO1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgaHRtbElkOnN0cmluZyxcbiAgICAgICAgICAgICAgICBvbkNoYW5nZUZ1bmM6KCgpID0+IHZvaWQpfG51bGwgPSBudWxsLFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQsXG4gICAgICAgICAgICAgICAgcHVibGlzaFZhbHVlUHJlZGljYXRlOmJvb2xlYW4gPSBmYWxzZVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBvYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgdGhpcy5odG1sSWQgPSBodG1sSWQ7XG4gICAgICAgICAgICAgICAgdGhpcy5vbkNoYW5nZUZ1bmMgPSBvbkNoYW5nZUZ1bmM7XG5cbiAgICAgICAgICAgICAgICAvLyBQdWJsaXNoIHZhbHVlIHdoZW4gYXBwcm9wcmlhdGVcbiAgICAgICAgICAgICAgICBpZiAocHVibGlzaFZhbHVlUHJlZGljYXRlICYmXG4gICAgICAgICAgICAgICAgICAgICgoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWUgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaG9va3MucG9zdC5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHB1Ymxpc2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFN1YnNjcmliZVxuICAgICAgICAgICAgICAgIHN1YnNjcmliZShcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgYCMke2h0bWxJZH1gLFxuICAgICAgICAgICAgICAgICAgICAobWVzc2FnZTphbnkpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoYCMke2h0bWxJZH1gKS52YWwobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCBvbiBjaGFuZ2VzXG4gICAgICAgICAgICAgICAgJChgIyR7aHRtbElkfWApLm9uKEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluICgke2h0bWxJZH0pOiAkeyg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChodG1sSWQpKS52YWx1ZX1gKVxuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLm9uQ2hhbmdlRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSkgfVxuICAgICAgICAgICAgICAgICAgICB9IC8vIGVsc2UgeyBjb25zb2xlLmluZm8oJ0RpZCBub3QgZmlyZSBudWxsIG9uQ2hhbmdlRnVuYycpIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCAmJlxuICAgICAgICAgICAgICAgICAgICBGcm9udEVuZEZyYW1ld29yay5TaW5nbGVQYWdlQXBwbGljYXRpb24gJiZcbiAgICAgICAgICAgICAgICAgICAgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+aG9va3MucGFnZUNsZWFudXApLnB1c2godGhpcy5nZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBoYW5kbGVOYXZpZ2F0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlYXJkb3duKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHNlbGY6IEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgpID0+IHtzZWxmLmhhbmRsZU5hdmlnYXRpb24uY2FsbChzZWxmKTt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlYXJkb3duKG92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlOmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgIW92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0ZWFyZG93biBGcm9udEVuZEZyYW1ld29yay5QdWJTdWIuSHRtbElucHV0RWxlbWVudFB1Ymxpc2hlckFuZFN1YnNjcmJlciBpbnN0YW5jZSBkdWUgdG8gb2JqZWN0TGlmZUN5Y2xlIG5vdCBiZWluZyBvdmVycmlkZGVuJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2xlYW5pbmcgdXAgZXZlbnQgaGFuZGxlcnMgc2V0IHVwIGluIEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JiZXIgKGlkOiAke3RoaXMuaHRtbElkfSlgKTtcbiAgICAgICAgICAgICAgICAkKCcjJyArIHRoaXMuaHRtbElkKS5vZmYoRnJvbnRFbmRGcmFtZXdvcmsuSHRtbElucHV0Q2hhbmdlRXZlbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wcmUgQXJyYXlcbiAgICAgICAgd2hpbGUgKGhvb2tzLnByZS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT5ob29rcy5wcmUuc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdHJ5IHsgcHJlUmVhZHlGdW5jKCk7IH1cbiAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG5cbiAgICAgICAgaWYgKChGcm9udEVuZEZyYW1ld29yay5yZWFkeUZ1bmMgIT0gbnVsbCkgJiZcbiAgICAgICAgICAgICh0eXBlb2YoRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKSA9PT0gJ2Z1bmN0aW9uJykpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jKCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRyeSB7IHBvc3RSZWFkeUZ1bmMoKTsgfVxuICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cblxuICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wb3N0IEFycmF5XG4gICAgICAgIHdoaWxlIChob29rcy5wb3N0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRyeSB7ICg8KCgpID0+IHZvaWQpPmhvb2tzLnBvc3Quc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgIC8vIFRPRE86IEFkZCBzdXBwb3J0IGZvciBvdGhlciBTUEEgZnJhbWV3b3JrcyBoZXJlLlxuICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuVHVyYm9saW5rc0F2YWlsYWJsZSkge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczpiZWZvcmUtcmVuZGVyJywgY2xlYW51cEZ1bmMpO1xuICAgICAgICAgICAgaWYgKGhvb2tzLnBhZ2VDbGVhbnVwICE9IG51bGwpXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndHVyYm9saW5rczpiZWZvcmUtcmVuZGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZpcmUgZnVuY3Rpb25zIGluIGhvb2tzLnBhZ2VDbGVhbnVwIEFycmF5XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICgoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT4oPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5zaGlmdCgpKSgpOyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRjaChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICgoY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMgIT0gbnVsbCkgJiYgKHR5cGVvZihjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYykgPT09ICdmdW5jdGlvbicpKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6dmlzaXQnLCBjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLz0gcmVxdWlyZSAuL2Jhc2Vcbi8vPSByZXF1aXJlIC4vc2NyZWVuX3Jlc29sdXRpb25zXG4vLz0gcmVxdWlyZSAuL21pbmlfaHRtbF92aWV3X21vZGVsXG4vLz0gcmVxdWlyZSAuL3N0b3JhZ2Vcbi8vPSByZXF1aXJlIC4vY29yZVxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc2NyZWVuX3Jlc29sdXRpb25zLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9zdG9yYWdlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vY29yZS5qcy50c1wiLz5cblxuLy8gTm90ZSB0aGF0IHRoZSBhYm92ZSByZWZlcmVuY2VzIGRvIG5vdCB3b3JrIGlmIHlvdSBoYXZlIHRoZSBUeXBlU2NyaXB0IGNvbXBpbGVyIHNldCB0byByZW1vdmUgY29tbWVudHMuXG4vLyBVc2Ugc29tZXRoaW5nIGxpa2UgdGhlIHVnbGlmaWVyIGdlbSBmb3IgcmVtb3ZpbmcgY29tbWVudHMvb2JmdXNjYXRpb24uXG5cbi8vIEFsc28gbm90ZSB0aGF0IHJlcXVpcmUgb3JkZXIgZG9lcyBub3QgY29uc2lkZXIgZGVwZW5kZW5jeSBjaGFpbi4gVGhlcmVmb3JlLCBkZXBlbmRlbmNpZXMgYmV0d2VlbiBmaWxlc1xuLy8gbXVzdCBub3QgYmUgYWZmZWN0ZWQgYnkgYSByYW5kb20gbG9hZCBvcmRlci5cblxuLy8gQVVUTy1HRU5FUkFURUQgYnkgYSBSYWtlIHRhc2ssIGRvIG5vdCBlZGl0IGJ5IGhhbmQuXG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7IGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuNi4xMCc7IH1cbiJdfQ==