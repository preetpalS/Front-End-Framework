"use strict";
/// <reference path="../__jquery.d.ts" />
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
    FrontEndFramework.VERSION = '0.6.8';
})(FrontEndFramework || (FrontEndFramework = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmRmcmFtZXdvcmsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2Jhc2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50cyIsIi4uL2FwcC9hc3NldHMvamF2YXNjcmlwdHMvZnJvbnRlbmRmcmFtZXdvcmsvbWluaV9odG1sX3ZpZXdfbW9kZWwuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL3N0b3JhZ2UuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2NvcmUuanMudHMiLCIuLi9hcHAvYXNzZXRzL2phdmFzY3JpcHRzL2Zyb250ZW5kZnJhbWV3b3JrL2FsbC5qcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEseUNBQXlDO0FBT3pDLElBQVUsaUJBQWlCLENBa0QxQjtBQWxERCxXQUFVLGlCQUFpQjtJQW1CWix1QkFBSyxHQUFrQixNQUFNLENBQUM7SUFReEMsQ0FBQztJQUVXLHVDQUFxQixHQUFHLHdCQUF3QixDQUFDO0lBTTlELG1EQUFtRDtJQUN0QyxxQ0FBbUIsR0FBRyxDQUFDLENBQUMsT0FBTyxVQUFVLEtBQUssV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDbkcsdUNBQXFCLEdBQUcsa0JBQUEsbUJBQW1CLENBQUM7SUFFekQsbURBQW1EO0lBQ3hDLG1DQUFpQixHQUFnQixrQkFBQSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMseUJBQXlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUVuRyw4Q0FBOEM7SUFDbkMsMkJBQVMsR0FBdUIsSUFB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akIsaUJBQWlCLFFBQW9DIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL19fanF1ZXJ5LmQudHNcIiAvPlxuXG4vLyBUaGlzIGZpbGUgY29udGFpbnMgdHlwZXMgYW5kIGludGVybmFsIHN0YXRlIHVzZWQgYnkgdGhlIGZyYW1ld29yayB0aGF0IGluZGl2aWR1YWwgY29tcG9uZW50c1xuLy8gaW4gdGhlIGxpYnJhcnkgbmVlZCBrbm93bGVkZ2Ugb2Ygc3VjaCBhcyBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuXG5cbmRlY2xhcmUgdmFyIFR1cmJvbGlua3MgOiBhbnk7XG5cbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XG4gICAgLy8gSGFzIGEgZGVwZW5kZW5jeSBvbiBKUXVlcnkuIFNob3VsZCBiZSBsb2FkZWQgYWZ0ZXIgVHVyYm9saW5rcyB0byByZWdpc3RlclxuICAgIC8vIGNsZWFudXBGdW5jIG9uICd0dXJib2xpbmtzOmJlZm9yZS1yZW5kZXInIGV2ZW50LlxuICAgIGV4cG9ydCBpbnRlcmZhY2UgR2xvYmFsSGFuZGxlIGV4dGVuZHMgV2luZG93IHtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGhlIHNjcmlwdCB0YWcgYmVsb3cgaW4gdGhlIGhlYWRlciBvZiB5b3VyIHBhZ2U6XG4gICAgLy8gPHNjcmlwdD4gXCJ1c2Ugc3RyaWN0XCI7IHZhciBnSG5kbCA9IHRoaXM7IHZhciBzdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gPSB7fTsgdmFyIGhvb2tzID0geyBwcmU6IFtdLCBwb3N0OiBbXSwgcGFnZUNsZWFudXA6IFtdIH07IDwvc2NyaXB0PlxuICAgIGV4cG9ydCBkZWNsYXJlIHZhciBob29rcyA6IHtcbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGJlZm9yZSBNaW5pSHRtbFZpZXdNb2RlbC5yZWFkeUZ1bmMpXG4gICAgICAgIHByZTogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gSW52b2tlZCBhZnRlciBkb2N1bWVudCBpcyByZWFkeSAoYnV0IGFmdGVyIE1pbmlIdG1sVmlld01vZGVsLnJlYWR5RnVuYylcbiAgICAgICAgcG9zdDogKCgpID0+IHZvaWQpW10sXG5cbiAgICAgICAgLy8gRXhwZXJpbWVudGFsOiBPbmx5IG1ha2VzIHNlbnNlIGlmIHVzZWQgd2l0aCBUdXJib2xpbmtzXG4gICAgICAgIHBhZ2VDbGVhbnVwPzogKCgpID0+IHZvaWQpW11cbiAgICB9O1xuXG4gICAgZXhwb3J0IGxldCBnSG5kbCA6IEdsb2JhbEhhbmRsZSA9IHdpbmRvdztcbiAgICBleHBvcnQgZGVjbGFyZSB2YXIgc3RhdGVUb0NsZWFyT25OYXZpZ2F0aW9uIDogYW55O1xuXG4gICAgLy8gQSBwYXJ0IG9mIHRoZSBTUEEgc3VwcHBvcnRcbiAgICBleHBvcnQgY29uc3QgZW51bSBPYmplY3RMaWZlQ3ljbGUge1xuICAgICAgICBUcmFuc2llbnQgPSAwLCAvLyBPbmx5IGZvciBzaW5nbGUgcGFnZSwgb2JqZWN0IHNob3VsZCBhdXRvbWF0aWNhbGx5IGJlIGRlc3Ryb3llZCB3aGVuIG5hdmlnYXRpbmcgZnJvbSBwYWdlXG4gICAgICAgIFZhcmlhYmxlUGVyc2lzdGVuY2UgPSAxLCAvLyBMaWZldGltZSBpcyBtYW5hZ2VkIG1hbnVhbGx5IChzaG91bGQgbm90IGJlIGF1dG9tYXRpY2FsbHkgZGVzdHJveWVkIHdoZW4gbmF2aWdhdGluZyBwYWdlcylcbiAgICAgICAgSW5maW5pdGVQZXJzaXN0ZW5jZSA9IDIgLy8gTm90IHRvIGJlIGRlc3Ryb3llZCAoaW50ZW5kZWQgdG8gYmUgcGVyc2lzdGVudCBhY3Jvc3MgaW5maW5pdGUgcGFnZSBuYXZpZ2F0aW9ucylcbiAgICB9O1xuXG4gICAgZXhwb3J0IGNvbnN0IEh0bWxJbnB1dENoYW5nZUV2ZW50cyA9ICdjaGFuZ2UgdGV4dElucHV0IGlucHV0JztcblxuICAgIGV4cG9ydCBpbnRlcmZhY2UgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgIG9iamVjdExpZmVDeWNsZT86IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgY29uc3QgVHVyYm9saW5rc0F2YWlsYWJsZSA9ICgodHlwZW9mIFR1cmJvbGlua3MgIT09ICd1bmRlZmluZWQnKSAmJiAoVHVyYm9saW5rcyAhPSBudWxsKSkgPyB0cnVlIDogZmFsc2U7XG4gICAgZXhwb3J0IGNvbnN0IFNpbmdsZVBhZ2VBcHBsaWNhdGlvbiA9IFR1cmJvbGlua3NBdmFpbGFibGU7XG5cbiAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICBleHBvcnQgbGV0IFBhZ2VQcmVDYWNoZUV2ZW50OiBzdHJpbmd8bnVsbCA9IFR1cmJvbGlua3NBdmFpbGFibGUgPyAndHVyYm9saW5rczpiZWZvcmUtY2FjaGUnIDogbnVsbDtcblxuICAgIC8vIFRvIGJlIHNldCBieSB1c2VyIChmaXJlZCB3aGVuIERPTSBpcyByZWFkeSlcbiAgICBleHBvcnQgbGV0IHJlYWR5RnVuYyA6ICgoKSA9PiB2b2lkKXxudWxsID0gbnVsbDtcblxuICAgIC8vIEZvciB1c2VycyB0byBzdXBwbHkgaG9va3MgKGxhbWJkYSBmdW5jdGlvbnMpIHRoYXQgdGhleSB3YW50IHRvIGZpcmUgb24gZWFjaCBuYXZpZ2F0aW9uIChub3RlXG4gICAgLy8gdGhhdCB0aGVzZSBhcnJheXMgYXJlIG5vdCBlbXB0aWVkIGFzIGV4ZWN1dGVkKS5cbiAgICBleHBvcnQgbGV0IGNsZWFudXBIb29rcyA6ICgoKSA9PiB2b2lkKVtdID0gW107XG4gICAgZXhwb3J0IGxldCBwcmVSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbiAgICBleHBvcnQgbGV0IHBvc3RSZWFkeUhvb2tzIDogKCgpID0+IHZvaWQpW10gPSBbXTtcbn1cbiIsIlxyXG4vLyBEb2VzIG5vdCByZWFsbHkgZGVwZW5kIG9uIGFueXRoaW5nXHJcblxyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbm5hbWVzcGFjZSBGcm9udEVuZEZyYW1ld29yayB7XHJcbmV4cG9ydCBuYW1lc3BhY2UgU2NyZWVuRGltZW5zaW9ucyB7XHJcbiAgICBleHBvcnQgaW50ZXJmYWNlIFNjcmVlbkRpbWVuc2lvbnMge1xyXG4gICAgICAgIGF2YWlsYWJsZUhlaWdodCA6IG51bWJlcjtcclxuICAgICAgICBhdmFpbGFibGVXaWR0aCA6IG51bWJlcjtcclxuICAgICAgICBkZXZpY2VIZWlnaHQgOiBudW1iZXI7XHJcbiAgICAgICAgZGV2aWNlV2lkdGggOiBudW1iZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZXhwb3J0IHZhciBHZXRTY3JlZW5EaW1lbnNpb25zID0gZnVuY3Rpb24oKSA6IFNjcmVlbkRpbWVuc2lvbnMge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGF2YWlsYWJsZUhlaWdodDogd2luZG93LnNjcmVlbi5hdmFpbEhlaWdodCxcclxuICAgICAgICAgICAgYXZhaWxhYmxlV2lkdGg6IHdpbmRvdy5zY3JlZW4uYXZhaWxXaWR0aCxcclxuICAgICAgICAgICAgZGV2aWNlSGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodCxcclxuICAgICAgICAgICAgZGV2aWNlV2lkdGg6IHdpbmRvdy5zY3JlZW4ud2lkdGhcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG59XHJcbn1cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiIC8+XG5cbi8vIERlcGVuZHMgb24gSlF1ZXJ5XG4vLyBEZXBlbmRzIG9uIC4vYmFzZS5qcy50cyBkdWUgdG8gdGhlIGZhY3QgdGhhdCB0aGUgZnV0dXJlIElVc2VySW50ZXJmYWNlRWxlbWVudCBtaWdodCByZWx5IG9uIGNsZWFudXBIb29rc1xuLy8gZm9yIHRlYXJkb3duIGxvZ2ljLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgTWluaUh0bWxWaWV3TW9kZWwge1xuICAgICAgICBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjYuMCc7XG5cbiAgICAgICAgZXhwb3J0IGNvbnN0IGVudW0gQmluZGluZ01vZGUgeyBPbmVUaW1lLCBPbmVXYXlSZWFkLCBPbmVXYXlXcml0ZSwgVHdvV2F5IH07XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZTtcbiAgICAgICAgICAgIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW107IC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgdmFsdWU/OiBhbnk7IC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgIHZpZXdNb2RlbFJlZj86IFQ7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgaW50ZXJmYWNlIElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxUPiB7XG4gICAgICAgICAgICBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKTtcbiAgICAgICAgICAgIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlCYXNlPFQ+IHtcbiAgICAgICAgICAgIGdldERhdGFGdW5jPzogKCgpID0+IGFueSk7XG4gICAgICAgICAgICBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKTsgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGV4dGVuZHMgSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4sIElWaWV3TW9kZWxQcm9wZXJ0eVdyaXRhYmxlPFQ+IHtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEJpbmRpbmdNb2RlLk9uZVRpbWUgY2FuIGJlIHRob3VnaHQgb2YgYXMgc2V0IHZhbHVlIG9uY2UgYW5kIGZvcmdldCAobm8gZXZlbnQgaGFuZGxlcnMgc2V0IG9yIElWaWV3TW9kZWxQcm9wZXJ0eSBzdG9yZWQpXG4gICAgICAgIC8vIFZhbHVlIGlzIE5PVCByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lVGltZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlSZWFkQmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eVJlYWRhYmxlPFQ+IHtcbiAgICAgICAgICAgIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQmluZGluZ01vZGUuT25lV2F5V3JpdGUgaXMgYSB3YXkgdG8gc2V0IHZhbHVlcyAobm8gZXZlbnQgaGFuZGxlcnMgc2V0IGJ1dCBJVmlld01vZGVsUHJvcGVydHk8VD4gYXJlIHN0b3JlZCkuXG4gICAgICAgIC8vIFZhbHVlIGlzIHJlYWQgZnJvbSBIVE1MIGVsZW1lbnQgb24gVmlld01vZGVsIGNvbnN0cnVjdGlvbiAodW5sZXNzIHZhbHVlIHByb3ZpZGVkIGZvciBJVmlld01vZGVsUHJvcGVydHlCYXNlKS5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJVmlld01vZGVsUHJvcGVydHlPbmVXYXlXcml0ZUJpbmRpbmc8VCBleHRlbmRzIFZpZXdNb2RlbD4gZXh0ZW5kcyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgcmVhZG9ubHkgYmluZGluZ01vZGU6QmluZGluZ01vZGUuT25lV2F5V3JpdGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyByZWFkIGZyb20gSFRNTCBlbGVtZW50IG9uIFZpZXdNb2RlbCBjb25zdHJ1Y3Rpb24gKHVubGVzcyB2YWx1ZSBwcm92aWRlZCBmb3IgSVZpZXdNb2RlbFByb3BlcnR5QmFzZSkuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxUIGV4dGVuZHMgVmlld01vZGVsPiBleHRlbmRzIElWaWV3TW9kZWxQcm9wZXJ0eTxUPiB7XG4gICAgICAgICAgICByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuVHdvV2F5O1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2hvdWxkIGluaGVyaXQgZnJvbSB0aGlzIGNsYXNzIGluc3RlYWQgb2YgaW5zdGFudGlhdGluZyBpdCBkaXJlY3RseS5cbiAgICAgICAgZXhwb3J0IGFic3RyYWN0IGNsYXNzIFZpZXdNb2RlbCBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgcHJvdGVjdGVkIGlkVG9CaW5kYWJsZVByb3BlcnR5OiB7IFtpbmRleDogc3RyaW5nXTogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+IH07XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICBwcml2YXRlIHN0YXRpYyByZWFkb25seSBDaGFuZ2VFdmVudHMgPSBGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHM7XG4gICAgICAgICAgICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUsXG4gICAgICAgICAgICAgICAgLi4uYmluZGFibGVQcm9wZXJ0aWVzOiBJVmlld01vZGVsUHJvcGVydHlCYXNlPFZpZXdNb2RlbD5bXVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RMaWZlQ3ljbGUgPSBvYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgICAgICAgICAgdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eSA9IHt9O1xuICAgICAgICAgICAgICAgIGJpbmRhYmxlUHJvcGVydGllcy5mb3JFYWNoKHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHksIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0TGlmZUN5Y2xlID09PSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50ICYmXG4gICAgICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbiAmJlxuICAgICAgICAgICAgICAgICAgICAoaG9va3MucGFnZUNsZWFudXAgIT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgKDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkucHVzaCh0aGlzLmdlblRlYXJkb3duRnVuYyh0aGlzKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcm90ZWN0ZWQgcHJvY2Vzc0JpbmRhYmxlUHJvcGVydHkoYlA6IElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPikge1xuICAgICAgICAgICAgICAgIHN3aXRjaCAoYlAuaWQuY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFN0cmluZzpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzQmluZGFibGVQcm9wZXJ0eVNpbmdsZShiUCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgQXJyYXk6XG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYlAuaWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvY2Vzc0JpbmRhYmxlUHJvcGVydHlTaW5nbGUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAoPGFueT5iUCkuaWRbaV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmluZGluZ01vZGU6ICg8YW55PmJQKS5iaW5kaW5nTW9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogKDxhbnk+YlApLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldERhdGFGdW5jOiAoPGFueT5iUCkuc2V0RGF0YUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0RGF0YUZ1bmM6ICg8YW55PmJQKS5nZXREYXRhRnVuYyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZUZ1bmM6ICg8YW55PmJQKS5vbkNoYW5nZUZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udmVydGVyRnVuYzogKDxhbnk+YlApLmNvbnZlcnRlckZ1bmMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVsUmVmOiAoPGFueT5iUCkudmlld01vZGVsUmVmXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGFzIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U8Vmlld01vZGVsPik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihgVW5hY2NlcHRhYmxlIGlkIGRldGVjdGVkIGluIElWaWV3TW9kZWxQcm9wZXJ0eUJhc2U6ICR7YlB9YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBwcm9jZXNzQmluZGFibGVQcm9wZXJ0eVNpbmdsZShiUDogSVZpZXdNb2RlbFByb3BlcnR5QmFzZTxWaWV3TW9kZWw+KSB7XG4gICAgICAgICAgICAgICAgbGV0IGJpbmRhYmxlUHJvcGVydHlJZDogc3RyaW5nID0gPHN0cmluZz5iUC5pZDtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAvLyBTdG9yZSBhbmQgYXR0YWNoIGJpbmRhYmxlIHByb3BlcnRpZXMgdGhhdCBkbyBub3QgaGF2ZSBhIE9uZVRpbWUgYmluZGluZ01vZGUuXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdGUgdGhhdCBPbmVUaW1lIGJpbmRpbmdNb2RlIHByb3BlcnRpZXMgYXJlIG5vdCBzdG9yZWQuXG4gICAgICAgICAgICAgICAgICAgIGlmIChiUC5iaW5kaW5nTW9kZSAhPT0gQmluZGluZ01vZGUuT25lVGltZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYlAudmlld01vZGVsUmVmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaWRUb0JpbmRhYmxlUHJvcGVydHlbYmluZGFibGVQcm9wZXJ0eUlkXSA9IGJQO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQmluZGluZ01vZGUuT25lVGltZSBpcyBzZXQgYWx3YXlzXG4gICAgICAgICAgICAgICAgICAgIGlmICgoYlAudmFsdWUgIT09IHVuZGVmaW5lZCkgfHwgKGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5PbmVUaW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5V3JpdGFibGU8Vmlld01vZGVsPj5iUCwgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5yZXRyaWV2ZUFuZFNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8Vmlld01vZGVsPj5iUCwgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEF0dGFjaCBvbkNoYW5nZSBldmVudCBoYW5kbGVyIGZvciBUd29XYXkgYW5kIE9uZVdheVJlYWQgcHJvcGVydGllcy5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5Ud29XYXkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJQLmJpbmRpbmdNb2RlID09PSBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcjJyArIGJpbmRhYmxlUHJvcGVydHlJZCkub24oVmlld01vZGVsLkNoYW5nZUV2ZW50cywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhgRGV0ZWN0ZWQgY2hhbmdlIGluOiAke2JpbmRhYmxlUHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmhhbmRsZVByb3BlcnR5Q2hhbmdlZEV2ZW50KGJpbmRhYmxlUHJvcGVydHlJZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoKDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoPCgodm06IFZpZXdNb2RlbCkgPT4gdm9pZCk+KDxJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxWaWV3TW9kZWw+PmJQKS5vbkNoYW5nZUZ1bmMpKDxWaWV3TW9kZWw+YlAudmlld01vZGVsUmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiAoPGFueT5iUC52aWV3TW9kZWxSZWYpLm9uQ2hhbmdlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICg8YW55PmJQLnZpZXdNb2RlbFJlZikub25DaGFuZ2UoYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gcHJvdmlkZSBvbkNoYW5nZUZ1bmMgKGFsdGVybmF0aXZlbHkgaW1wbGVtZW50IG9uQ2hhbmdlIFsoaHRtbElkOiBzdHJpbmcpID0+IHZvaWRdIG1ldGhvZCkgZm9yIGltcGxlbnRhdGlvbiBvZiBJVmlld01vZGVsUHJvcGVydHkgZm9yIGlkOiAnICsgYmluZGFibGVQcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVHJpZ2dlcnMgY2hhbmdlIGluIFVJIHRvIG1hdGNoIHZhbHVlIG9mIHByb3BlcnR5IGluIGlkVG9CaW5kYWJsZVByb3BlcnR5LlxuICAgICAgICAgICAgcHJvdGVjdGVkIGhhbmRsZVByb3BlcnR5Q2hhbmdlZEV2ZW50KHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBiaW5kYWJsZVByb3BlcnR5ID0gdGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eVtwcm9wZXJ0eUlkXTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChiaW5kYWJsZVByb3BlcnR5LmJpbmRpbmdNb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNhc2UgQmluZGluZ01vZGUuT25lVGltZTpcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUuZXJyb3IoXCJJTVBPU1NJQkxFXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQmluZGluZ01vZGUuT25lV2F5UmVhZDpcbiAgICAgICAgICAgICAgICAgICAgICAgIFZpZXdNb2RlbC5yZXRyaWV2ZUFuZFNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8Vmlld01vZGVsPj5iaW5kYWJsZVByb3BlcnR5LCBwcm9wZXJ0eUlkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIEJpbmRpbmdNb2RlLk9uZVdheVdyaXRlOlxuICAgICAgICAgICAgICAgICAgICAgICAgVmlld01vZGVsLnNldFZhbHVlRm9yQmluZGFibGVQcm9wZXJ0eSg8SVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBCaW5kaW5nTW9kZS5Ud29XYXk6XG4gICAgICAgICAgICAgICAgICAgICAgICBWaWV3TW9kZWwuc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5KDxJVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFZpZXdNb2RlbD4+YmluZGFibGVQcm9wZXJ0eSwgcHJvcGVydHlJZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgSW52YWxpZCBiaW5kaW5nTW9kZSBmb3IgQmluZGluZyBQcm9wZXJ0eSBhc3NvY2lhdGVkIHdpdGggaWQ6ICR7cHJvcGVydHlJZH1gKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgZ2VuVGVhcmRvd25GdW5jKHNlbGY6IFZpZXdNb2RlbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi50ZWFyZG93bi5jYWxsKHNlbGYpO307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRlYXJkb3duKG92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlOmJvb2xlYW4gPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLm9iamVjdExpZmVDeWNsZSA9PT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLkluZmluaXRlUGVyc2lzdGVuY2UgJiZcbiAgICAgICAgICAgICAgICAgICAgIW92ZXJyaWRlT2JqZWN0TGlmZUN5Y2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byB0ZWFyZG93biBGcm9udEVuZEZyYW1ld29yay5NaW5pSHRtbFZpZXdNb2RlbC5WaWV3TW9kZWwgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5pZFRvQmluZGFibGVQcm9wZXJ0eSkuZm9yRWFjaCgoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQ2xlYW5pbmcgdXAgZXZlbnQgaGFuZGxlcnMgc2V0IHVwIGluIFZpZXdNb2RlbCAoaWQ6ICR7aWR9KWApO1xuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIGlkKS5vZmYoVmlld01vZGVsLkNoYW5nZUV2ZW50cyk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgc3RhdGljIHJldHJpZXZlQW5kU2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+KGJQOiBJVmlld01vZGVsUHJvcGVydHlSZWFkYWJsZTxUPiwgcHJvcGVydHlJZDogc3RyaW5nKTogSVZpZXdNb2RlbFByb3BlcnR5UmVhZGFibGU8VD4ge1xuICAgICAgICAgICAgICAgIGlmIChiUC5nZXREYXRhRnVuYyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGJQLnZhbHVlID0gYlAuZ2V0RGF0YUZ1bmMoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiUC52YWx1ZSA9ICg8SFRNTElucHV0RWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChwcm9wZXJ0eUlkKSkudmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBiUDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBzdGF0aWMgc2V0VmFsdWVGb3JCaW5kYWJsZVByb3BlcnR5PFQgZXh0ZW5kcyBWaWV3TW9kZWw+KGJQOiBJVmlld01vZGVsUHJvcGVydHlXcml0YWJsZTxUPiwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNudnJ0ciA9IGJQLmNvbnZlcnRlckZ1bmMgfHwgZnVuY3Rpb24oeCkgeyByZXR1cm4geDsgfTtcbiAgICAgICAgICAgICAgICBpZiAoYlAuc2V0RGF0YUZ1bmMgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAkKCcjJyArIHByb3BlcnR5SWQpLnZhbChjbnZydHIoYlAudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiUC5zZXREYXRhRnVuYyhjbnZydHIoYlAudmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHk8VCBleHRlbmRzIFZpZXdNb2RlbD4gaW1wbGVtZW50cyBJVmlld01vZGVsUHJvcGVydHk8VD4ge1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBnZXREYXRhRnVuYz86ICgoKSA9PiBhbnkpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBvbkNoYW5nZUZ1bmM/OiAoKHZtOiBUKSA9PiB2b2lkKSwgLy8gRWl0aGVyIGltcGxlbWVudCBvbkNoYW5nZSBvbiBJVmlld01vZGVsIE9SIHByb3ZpZGUgb25DaGFuZ2VGdW5jXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVRpbWVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lVGltZUJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVUaW1lID0gPEJpbmRpbmdNb2RlLk9uZVRpbWU+QmluZGluZ01vZGUuT25lVGltZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgc2V0RGF0YUZ1bmM/OiAoKGE6IGFueSkgPT4gdm9pZCksXG4gICAgICAgICAgICAgICAgcHVibGljIGNvbnZlcnRlckZ1bmM/OiAoKGE6IGFueSkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmlld01vZGVsUmVmPzogVFxuICAgICAgICAgICAgKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBWaWV3TW9kZWxQcm9wZXJ0eU9uZVdheVJlYWRCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5UmVhZEJpbmRpbmc8VD4ge1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGJpbmRpbmdNb2RlOiBCaW5kaW5nTW9kZS5PbmVXYXlSZWFkID0gPEJpbmRpbmdNb2RlLk9uZVdheVJlYWQ+QmluZGluZ01vZGUuT25lV2F5UmVhZDtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBpZDogc3RyaW5nfHN0cmluZ1tdLCAvLyBSZXByZXNlbnRzIEhUTUwgaWRcbiAgICAgICAgICAgICAgICBwdWJsaWMgdmFsdWU/OiBhbnksIC8vIFJlcHJlc2VudHMgZGlzcGxheWVkIGluaXRpYWwgdmFsdWVcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyB2aWV3TW9kZWxSZWY/OiBUXG4gICAgICAgICAgICApIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIFZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5T25lV2F5V3JpdGVCaW5kaW5nPFQ+IHtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBiaW5kaW5nTW9kZTogQmluZGluZ01vZGUuT25lV2F5V3JpdGUgPSA8QmluZGluZ01vZGUuT25lV2F5V3JpdGU+QmluZGluZ01vZGUuT25lV2F5V3JpdGU7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgaWQ6IHN0cmluZ3xzdHJpbmdbXSwgLy8gUmVwcmVzZW50cyBIVE1MIGlkXG4gICAgICAgICAgICAgICAgcHVibGljIHZhbHVlPzogYW55LCAvLyBSZXByZXNlbnRzIGRpc3BsYXllZCBpbml0aWFsIHZhbHVlXG4gICAgICAgICAgICAgICAgcHVibGljIHNldERhdGFGdW5jPzogKChhOiBhbnkpID0+IHZvaWQpLFxuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgY2xhc3MgVmlld01vZGVsUHJvcGVydHlUd29XYXlCaW5kaW5nPFQgZXh0ZW5kcyBWaWV3TW9kZWw+IGltcGxlbWVudHMgSVZpZXdNb2RlbFByb3BlcnR5VHdvV2F5QmluZGluZzxUPiB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgYmluZGluZ01vZGU6IEJpbmRpbmdNb2RlLlR3b1dheSA9IDxCaW5kaW5nTW9kZS5Ud29XYXk+QmluZGluZ01vZGUuVHdvV2F5O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGlkOiBzdHJpbmd8c3RyaW5nW10sIC8vIFJlcHJlc2VudHMgSFRNTCBpZFxuICAgICAgICAgICAgICAgIHB1YmxpYyB2YWx1ZT86IGFueSwgLy8gUmVwcmVzZW50cyBkaXNwbGF5ZWQgaW5pdGlhbCB2YWx1ZVxuICAgICAgICAgICAgICAgIHB1YmxpYyBzZXREYXRhRnVuYz86ICgoYTogYW55KSA9PiB2b2lkKSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgZ2V0RGF0YUZ1bmM/OiAoKCkgPT4gYW55KSxcbiAgICAgICAgICAgICAgICBwdWJsaWMgb25DaGFuZ2VGdW5jPzogKCh2bTogVCkgPT4gdm9pZCksIC8vIEVpdGhlciBpbXBsZW1lbnQgb25DaGFuZ2Ugb24gSVZpZXdNb2RlbCBPUiBwcm92aWRlIG9uQ2hhbmdlRnVuY1xuICAgICAgICAgICAgICAgIHB1YmxpYyBjb252ZXJ0ZXJGdW5jPzogKChhOiBhbnkpID0+IGFueSksXG4gICAgICAgICAgICAgICAgcHVibGljIHZpZXdNb2RlbFJlZj86IFRcbiAgICAgICAgICAgICkgeyB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuXG4vLyBSZWxpZXMgb24gLi9iYXNlLmpzLnRzIGJlY2F1c2UgdGhpcyBsaWJyYXJ5IHNob3VsZCBiZSBhYmxlIHRvIHRha2UgYWR2YW50YWdlIG9mIFR1cmJvbGlua3Mgbm90IHJlbG9hZGluZyBwYWdlLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsge1xuICAgIGV4cG9ydCBuYW1lc3BhY2UgU3RvcmFnZSB7XG4gICAgICAgIGV4cG9ydCBjb25zdCBWRVJTSU9OID0gJzAuMS4wJztcbiAgICAgICAgZXhwb3J0IGNvbnN0IGVudW0gRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24geyBUcmFuc2llbnQsIFNlc3Npb24sIEFjcm9zc1Nlc3Npb25zIH1cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24ge1xuICAgICAgICAgICAgaW5kZWZpbml0ZT86IGJvb2xlYW47XG4gICAgICAgICAgICBleHBpcnlEYXRlPzogRGF0ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBpbnRlcmZhY2UgSUV4cGlyaW5nQ2FjaGVEdXJhdGlvbiBleHRlbmRzIElDYWNoZUV4cGlyYXRpb25EdXJhdGlvbiB7XG4gICAgICAgICAgICBpbmRlZmluaXRlPzogYm9vbGVhbjsgLy8gTVVTVCBCRSBgZmFsc2VgXG4gICAgICAgICAgICBleHBpcnlEYXRlOiBEYXRlO1xuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJSW5kZWZpbml0ZUNhY2hlRHVyYXRpb24gZXh0ZW5kcyBJQ2FjaGVFeHBpcmF0aW9uRHVyYXRpb24ge1xuICAgICAgICAgICAgaW5kZWZpbml0ZTogYm9vbGVhbjsgLy8gTVVTVCBCRSBgdHJ1ZWBcbiAgICAgICAgICAgIGV4cGlyeURhdGU/OiBEYXRlOyAvLyAgSUdOT1JFRFxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGNsYXNzIEV4cGlyaW5nQ2FjaGVEdXJhdGlvbiBpbXBsZW1lbnRzIElFeHBpcmluZ0NhY2hlRHVyYXRpb24ge1xuICAgICAgICAgICAgcHVibGljIGluZGVmaW5pdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBleHBpcnlEYXRlOiBEYXRlKSB7IH1cbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiBpbXBsZW1lbnRzIElJbmRlZmluaXRlQ2FjaGVEdXJhdGlvbiB7XG4gICAgICAgICAgICBwdWJsaWMgaW5kZWZpbml0ZSA9IHRydWU7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHsgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVGhpcyBpcyBuZWVkZWQgZm9yIGJyb3dzZXJzIHRoYXQgc2F5IHRoYXQgdGhleSBoYXZlIFNlc3Npb25TdG9yYWdlIGJ1dCBpbiByZWFsaXR5IHRocm93IGFuIEVycm9yIGFzIHNvb25cbiAgICAgICAgLy8gYXMgeW91IHRyeSB0byBkbyBzb21ldGhpbmcuXG4gICAgICAgIGxldCBpc19zZXNzaW9uX3N0b3JhZ2VfYXZhaWxhYmxlID0gdHJ1ZTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ3Rlc3RhODkwYTgwOScsICd2YWwnKTtcbiAgICAgICAgICAgIHNlc3Npb25TdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rlc3RhODkwYTgwOScpO1xuICAgICAgICB9IGNhdGNoIChfZXJyb3IpIHtcbiAgICAgICAgICAgIGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGUgPSBmYWxzZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIC8vIE5vdGhpbmcgdG8gZG8uLi5cbiAgICAgICAgfVxuICAgICAgICBleHBvcnQgY29uc3QgSXNTZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSA9IGlzX3Nlc3Npb25fc3RvcmFnZV9hdmFpbGFibGU7XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJS2V5VmFsdWVTdG9yYWdlUHJvZmlsZSB7XG4gICAgICAgICAgICBEYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllczogRGF0YVBlcnNpc3RlbmNlRHVyYXRpb25bXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV4cG9ydCBjbGFzcyBDbGllbnRTdG9yYWdlUHJvZmlsZSBpbXBsZW1lbnRzIElLZXlWYWx1ZVN0b3JhZ2VQcm9maWxlIHtcbiAgICAgICAgICAgIHB1YmxpYyBEYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllczogQXJyYXk8RGF0YVBlcnNpc3RlbmNlRHVyYXRpb24+O1xuICAgICAgICAgICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5EYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllcyA9IFtEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnRdO1xuICAgICAgICAgICAgICAgIGlmIChGcm9udEVuZEZyYW1ld29yay5UdXJib2xpbmtzQXZhaWxhYmxlIHx8IEZyb250RW5kRnJhbWV3b3JrLlN0b3JhZ2UuSXNTZXNzaW9uU3RvcmFnZUF2YWlsYWJsZSlcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5EYXRhUGVyc2lzdGFuY2VEdXJhdGlvbkNhcGFiaWxpdGllcy5wdXNoKERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZXhwb3J0IGludGVyZmFjZSBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIHNldDogKChrZXk6YW55LCB2YWw6YW55KSA9PiB2b2lkKTtcbiAgICAgICAgICAgIGdldDogKChrZXk6YW55KSA9PiBhbnkpO1xuICAgICAgICB9XG4gICAgICAgIC8qXG4gICAgICAgIGV4cG9ydCBjbGFzcyBUcmFuc2llbnRTdG9yYWdlIGltcGxlbWVudHMgSUtleVZhbHVlU3RvcmFnZSB7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0KGtleTphbnksIHZhbDphbnkpIDogdm9pZCA9PiB7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGdldChrZXk6YW55KSA6IGFueSA9PiB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgKi9cbiAgICAgICAgZXhwb3J0IGNsYXNzIENsaWVudFN0b3JhZ2UgaW1wbGVtZW50cyBJS2V5VmFsdWVTdG9yYWdlIHtcbiAgICAgICAgICAgIHB1YmxpYyBjbGllbnRQcm9maWxlID0gbmV3IENsaWVudFN0b3JhZ2VQcm9maWxlKCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICBwcml2YXRlIGVycm9yT25GYWlsID0gZmFsc2VcbiAgICAgICAgICAgICkgeyB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBzZXQoa2V5OiBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIHZhbDogYW55LFxuICAgICAgICAgICAgICAgICAgICAgICBkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiA9IERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLlNlc3Npb24sXG4gICAgICAgICAgICAgICAgICAgICAgIGNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uPzogSUNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogUmVtb3ZlIHVwb24gYWRkaW5nIHN1cHBvcnQgZm9yIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYWNoZUV4cGlyYXRpb25EdXJhdGlvbiAhPSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImNhY2hlRXhwaXJhdGlvbkR1cmF0aW9uIGlnbm9yZWQgaW4gRGF0YWJhc2Ujc2V0LlwiKTtcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2goZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5UcmFuc2llbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbShrZXksIHZhbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5BY3Jvc3NTZXNzaW9uczpcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmVycm9yT25GYWlsKSB0aHJvdyBlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGdldChrZXk6IGFueSwgZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24/OiBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbikgOiBhbnl8bnVsbHx1bmRlZmluZWQge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhUGVyc2lzdGVuY2VEdXJhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2goZGF0YVBlcnNpc3RlbmNlRHVyYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgRGF0YVBlcnNpc3RlbmNlRHVyYXRpb24uVHJhbnNpZW50OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBEYXRhUGVyc2lzdGVuY2VEdXJhdGlvbi5TZXNzaW9uOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIERhdGFQZXJzaXN0ZW5jZUR1cmF0aW9uLkFjcm9zc1Nlc3Npb25zOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZXJyb3JPbkZhaWwpIHRocm93IGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgZm9yY2VDYWNoZUV4cGlyeShrZXk6IGFueSkgeyBjb25zb2xlLmVycm9yKGBVbmltcGxlbWVudGVkIERhdGFiYXNlI2ZvcmNlQ2FjaGVFeHBpcnk6IEZhaWxlZCB0byBleHBpcmUga2V5OiAke2tleX1gKTsgdGhyb3cga2V5OyB9XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9iYXNlLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RvcmFnZS5qcy50c1wiLz5cblxubmFtZXNwYWNlIEZyb250RW5kRnJhbWV3b3JrIHtcbiAgICAvLyBWaXNpdHMgc2l0ZSB1c2luZyBUdXJib2xpbmtzIChvciBhbm90aGVyIFNQQSBmcmFtZXdvcmsgd2hlbiBzdXBwb3J0IGlzIGFkZGVkKSBpZiBwb3NzaWJsZS5cbiAgICAvLyBTaG91bGQgYWx3YXlzIHJlc3VsdCBpbiBvcGVuaW5nIGdpdmVuIGxpbmsgKGlmIGdpdmVuIGFyZ3VtZW50IGZvciBgbGlua2AgaXMgdmFsaWQgVVJMKS5cbiAgICBleHBvcnQgbGV0IHZpc2l0TGluayA9IGZ1bmN0aW9uKGxpbmsgOiBzdHJpbmcsIHtmb3JjZVJlbG9hZCwgbmV3VGFifToge2ZvcmNlUmVsb2FkPzogYm9vbGVhbiwgbmV3VGFiPzogYm9vbGVhbn0gPSB7Zm9yY2VSZWxvYWQ6IGZhbHNlLCBuZXdUYWI6IGZhbHNlfSkge1xuICAgICAgICBpZiAoKG5ld1RhYiAhPSBudWxsKSAmJiA8Ym9vbGVhbj5uZXdUYWIpIHtcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGxpbmssIFwiX2JsYW5rXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbiAmJiAhKChmb3JjZVJlbG9hZCAhPSBudWxsKSAmJiA8Ym9vbGVhbj5mb3JjZVJlbG9hZCkpIHtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICAgICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuVHVyYm9saW5rc0F2YWlsYWJsZSAmJlxuICAgICAgICAgICAgICAgICAgICAodHlwZW9mKFR1cmJvbGlua3MudmlzaXQpID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICAgICAgICAgICAgICBUdXJib2xpbmtzLnZpc2l0KGxpbmspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBsaW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxldCBjbGVhbnVwRnVuYyA9ICgpID0+IHtcbiAgICAgICAgLy8gT25seSBleGVjdXRlIGluIHNpbmdsZSBwYWdlIGFwcGxpY2F0aW9ucyAoaW4gb3RoZXIgY2FzZSwgcGFnZSB3b3VsZCBiZSByZXNldCBhbnl3YXlzKVxuICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNsZWFudXBIb29rcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRyeSB7IGNsZWFudXBIb29rc1tpXSgpOyB9IGNhdGNoIChlKSB7IGNvbnNvbGUuZXJyb3IoZSk7IH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgcHJlUmVhZHlGdW5jID0gKCkgPT4ge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByZVJlYWR5SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyeSB7IHByZVJlYWR5SG9va3NbaV0oKTsgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IHBvc3RSZWFkeUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG9zdFJlYWR5SG9va3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRyeSB7IHBvc3RSZWFkeUhvb2tzW2ldKCk7IH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBjbGVhclN0YXRlT25OYXZpZ2F0aW9uRnVuYyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBGcm9udEVuZEZyYW1ld29yay5zdGF0ZVRvQ2xlYXJPbk5hdmlnYXRpb24gPSB7fTtcbiAgICB9O1xuXG4gICAgZXhwb3J0IG5hbWVzcGFjZSBQdWJTdWIge1xuICAgICAgICBpbnRlcmZhY2UgUHViU3ViUmVsYXlTdWJzY3JpYmVySW5mbyBleHRlbmRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgc3Vic2NyaWJlcklkZW50aWZpZXI6IHN0cmluZztcbiAgICAgICAgICAgIHN1YnNjcmliZXJTZXR0ZXI6ICgobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkO1xuICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGU7XG4gICAgICAgIH1cblxuICAgICAgICBjbGFzcyBQdWJTdWJSZWxheSBpbXBsZW1lbnRzIElPYmplY3RMaWZlQ3ljbGVEZXRlcm1pbmFibGUge1xuICAgICAgICAgICAgcHVibGljIHN0YXRpYyBEZWZhdWx0T2JqZWN0TGlmZUN5Y2xlID0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudDtcbiAgICAgICAgICAgIHB1YmxpYyBvYmplY3RMaWZlQ3ljbGU6IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBzdWJzY3JpcHRpb25JZGVudGlmaWVyOiBzdHJpbmc7XG4gICAgICAgICAgICBwcml2YXRlIHB1YlN1YlJlbGF5U3Vic2NyaWJlcnM6IFB1YlN1YlJlbGF5U3Vic2NyaWJlckluZm9bXSA9IFtdO1xuICAgICAgICAgICAgcHJpdmF0ZSBsYXN0U2VudE1lc3NhZ2U6IGFueTsgLy8gVG8gYmUgcmUtYnJvYWRjYXN0IGFmdGVyIG5hdmlnYXRpbmcgcGFnZXNcbiAgICAgICAgICAgIHByaXZhdGUgZmlyc3RNZXNzYWdlU2VudFA6IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgICAgICAgICAgY29uc3RydWN0b3Ioc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXIgPSBzdWJzY3JpcHRpb25JZGVudGlmaWVyO1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gUHViU3ViUmVsYXkuRGVmYXVsdE9iamVjdExpZmVDeWNsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGFkZFN1YnNjcmliZXIoc3Vic2NyaWJlckluZm86UHViU3ViUmVsYXlTdWJzY3JpYmVySW5mbykgOiB2b2lkIHtcbiAgICAgICAgICAgICAgICBpZiAoc3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCg8bnVtYmVyPnRoaXMub2JqZWN0TGlmZUN5Y2xlKSA8ICg8bnVtYmVyPnN1YnNjcmliZXJJbmZvLm9iamVjdExpZmVDeWNsZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gc3Vic2NyaWJlckluZm8ub2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXS5zdWJzY3JpYmVySWRlbnRpZmllciA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJJbmZvLnN1YnNjcmliZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYENhbm5vdCBzdWJzY3JpYmUgbW9yZSB0aGFuIG9uY2UgdG8gKCR7dGhpcy5zdWJzY3JpcHRpb25JZGVudGlmaWVyfSkgd2l0aCAoJHtzdWJzY3JpYmVySW5mby5zdWJzY3JpYmVySWRlbnRpZmllcn0pLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLnB1c2goc3Vic2NyaWJlckluZm8pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVsYXlNZXNzYWdlKHNlbmRpbmdTdWJzY3JpYmVySWRlbnRpZmllcjpzdHJpbmcsIG1lc3NhZ2U6YW55KSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oYFJlbGF5aW5nIG1lc3NhZ2UgZnJvbSBQdWJTdWJSZWxheSNyZWxheU1lc3NhZ2UgZm9yIHN1YnNjcmlwdGlvbjogJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9fWApXG4gICAgICAgICAgICAgICAgdGhpcy5sYXN0U2VudE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3RNZXNzYWdlU2VudFAgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWxldmFudFN1YnNjcmliZXIgPSB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBQcmludGluZyAke2l9LXRoIHJlbGV2YW50U3Vic2NyaWJlcmApO1xuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhyZWxldmFudFN1YnNjcmliZXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJJZGVudGlmaWVyICE9PVxuICAgICAgICAgICAgICAgICAgICAgICAgc2VuZGluZ1N1YnNjcmliZXJJZGVudGlmaWVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGVvZihyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlcikgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVsZXZhbnRTdWJzY3JpYmVyLnN1YnNjcmliZXJTZXR0ZXIobWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lcyB0aGF0IGEgdHJpZ2dlciBjaGFuZ2UgZXZlbnQgc2hvdWxkIG5vdCBiZSBmaXJlZCBvbiBzZXR0aW5nIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBVc2Ugc3Vic2NyaWJlclNldHRlciBhcmcgd2hlbiBzdWJzY3JpYmluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5pbmZvKGBTZXR0aW5nIHZhbHVlICgke21lc3NhZ2V9KSBmb3IgJHtyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXJ9IGlkLmApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcikudmFsKG1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHJlYnJvYWRjYXN0TGFzdFNlbnRNZXNzYWdlKCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5maXJzdE1lc3NhZ2VTZW50UCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKGBSZWxheWluZyBtZXNzYWdlIGZyb20gUHViU3ViUmVsYXkjcmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UgZm9yIHN1YnNjcmlwdGlvbjogJHt0aGlzLnN1YnNjcmlwdGlvbklkZW50aWZpZXJ9fWApXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbGV2YW50U3Vic2NyaWJlciA9IHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlclNldHRlciAhPSBudWxsICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZW9mKHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVyU2V0dGVyKHRoaXMubGFzdFNlbnRNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lcyB0aGF0IGEgdHJpZ2dlciBjaGFuZ2UgZXZlbnQgc2hvdWxkIG5vdCBiZSBmaXJlZCBvbiBzZXR0aW5nIHZhbHVlLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFVzZSBzdWJzY3JpYmVyU2V0dGVyIGFyZyB3aGVuIHN1YnNjcmliaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUuaW5mbyhgU2V0dGluZyB2YWx1ZSAoJHt0aGlzLmxhc3RTZW50TWVzc2FnZX0pIGZvciAke3JlbGV2YW50U3Vic2NyaWJlci5zdWJzY3JpYmVySWRlbnRpZmllcn0gaWQuYCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChyZWxldmFudFN1YnNjcmliZXIuc3Vic2NyaWJlcklkZW50aWZpZXIpLnZhbCh0aGlzLmxhc3RTZW50TWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT0gRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlLlRyYW5zaWVudClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBTaG9ydC1jaXJjdWl0IGlmIGl0ZW0gd2lsbCBiZSBQdWJTdWJSZWxheSBpdHNlbGYgd2lsbCBiZSBkZXN0cm95ZWQgYW55d2F5c1xuXG4gICAgICAgICAgICAgICAgbGV0IHRvUmVtb3ZlIDogbnVtYmVyW10gPSBbXTsgLy8gaW5kaWNlcyAodGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzKSBvZiBzdWJzY3JpYmVycyB0byByZW1vdmVcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5wdWJTdWJSZWxheVN1YnNjcmliZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnB1YlN1YlJlbGF5U3Vic2NyaWJlcnNbaV0ub2JqZWN0TGlmZUN5Y2xlICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAodG9SZW1vdmUubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHViU3ViUmVsYXlTdWJzY3JpYmVycy5zcGxpY2UoPG51bWJlcj50b1JlbW92ZS5wb3AoKSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY2xhc3MgUHViU3ViUmVsYXlTdG9yYWdlIGltcGxlbWVudHMgU3RvcmFnZS5JS2V5VmFsdWVTdG9yYWdlLCBJT2JqZWN0TGlmZUN5Y2xlRGV0ZXJtaW5hYmxlIHtcbiAgICAgICAgICAgIC8vIFRPRE86IEFsbG93IHRoZSBQdWJTdWJSZWxheVN0b3JhZ2UgdG8gaGF2ZSBhIHRyYW5zaWVudCBvYmplY3QgbGlmZSBjeWNsZVxuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHJpdmF0ZSBtYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzOiBhbnk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMgPSB7fTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGdldChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgOiBQdWJTdWJSZWxheXxudWxsfHVuZGVmaW5lZCB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIHNldChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZywgcHViU3ViUmVsYXk6IFB1YlN1YlJlbGF5KSA6IHZvaWQge1xuICAgICAgICAgICAgICAgIHRoaXMubWFwRnJvbVN1YnNjcmlwdGlvbklkZW50aWZpZXJUb1B1YlN1YlJlbGF5c1tzdWJzY3JpcHRpb25JZGVudGlmaWVyXSA9IHB1YlN1YlJlbGF5O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBsZXQga2V5c1RvRGVsZXRlIDogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXMpLmZvckVhY2goKHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheUluc3RhbmNlID0gdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW3N1YnNjcmlwdGlvbklkZW50aWZpZXJdO1xuICAgICAgICAgICAgICAgICAgICBwdWJTdWJSZWxheUluc3RhbmNlLmhhbmRsZU5hdmlnYXRpb24oKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocHViU3ViUmVsYXlJbnN0YW5jZS5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbW92ZSBwdWJTdWJSZWxheUluc3RhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICBrZXlzVG9EZWxldGUucHVzaChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNUb0RlbGV0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzW2tleXNUb0RlbGV0ZVtpXV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwdWJsaWMgcmVicm9hZGNhc3RBbGxNZXNzYWdlTGFzdFJlbGF5ZWRCeVN0b3JlZFB1YlN1YlJlbGF5cygpIDogdm9pZCB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5tYXBGcm9tU3Vic2NyaXB0aW9uSWRlbnRpZmllclRvUHViU3ViUmVsYXlzKS5mb3JFYWNoKChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm1hcEZyb21TdWJzY3JpcHRpb25JZGVudGlmaWVyVG9QdWJTdWJSZWxheXNbc3Vic2NyaXB0aW9uSWRlbnRpZmllcl0ucmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNsYXNzIFB1YlN1YlJlbGF5TWFuYWdlciB7XG4gICAgICAgICAgICAvLyBUT0RPOiBBbGxvdyB0aGUgUHViU3ViUmVsYXlNYW5hZ2VyIHRvIGhhdmUgYSB0cmFuc2llbnQgb2JqZWN0IGxpZmUgY3ljbGVcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZTtcbiAgICAgICAgICAgIHByaXZhdGUgcHViU3ViUmVsYXlTdG9yYWdlOiBQdWJTdWJSZWxheVN0b3JhZ2UgPSBuZXcgUHViU3ViUmVsYXlTdG9yYWdlKCk7XG4gICAgICAgICAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgICAgICAgICBpZiAoRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICg8KCgpID0+IHZvaWQpW10+Y2xlYW51cEhvb2tzKS5wdXNoKHRoaXMuZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPnBvc3RSZWFkeUhvb2tzKS5wdXNoKHRoaXMuZ2VuUmVicm9hZGNhc3RMYXN0TWVzc2FnZXNGdW5jKHRoaXMpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGhhbmRsZU5hdmlnYXRpb24oKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UuaGFuZGxlTmF2aWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZWJyb2FkY2FzdExhc3RTZW50TWVzc2FnZXMoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2UucmVicm9hZGNhc3RBbGxNZXNzYWdlTGFzdFJlbGF5ZWRCeVN0b3JlZFB1YlN1YlJlbGF5cygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlbkhhbmRsZU5hdmlnYXRpb25GdW5jKHNlbGY6IFB1YlN1YlJlbGF5TWFuYWdlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZWxmLmhhbmRsZU5hdmlnYXRpb24uYmluZChzZWxmKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5SZWJyb2FkY2FzdExhc3RNZXNzYWdlc0Z1bmMoc2VsZjogUHViU3ViUmVsYXlNYW5hZ2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNlbGYucmVicm9hZGNhc3RMYXN0U2VudE1lc3NhZ2VzLmJpbmQoc2VsZik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHB1YmxpYyBoYW5kbGVTdWJzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgc2VsZklkZW50aWZpZXI6c3RyaW5nLCAvLyBzaG91bGQgYmUgYSBDU1Mgc2VsZWN0b3IgKEpRdWVyeSBzZWxlY3RvcilcbiAgICAgICAgICAgICAgICBzZWxmU2V0dGVyOigobWVzc2FnZTphbnkpID0+IHZvaWQpfG51bGx8dW5kZWZpbmVkID0gdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnRcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheSA9IHRoaXMuaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcblxuICAgICAgICAgICAgICAgIC8vIFRPRE86IFNlZSBpZiBnaXZlbiBgb2JqZWN0TGlmZUN5Y2xlYCBpcyBncmVhdGVyIHRoYW4gZGVzaWduYXRlZCBvYmplY3RMaWZlQ3ljbGUsXG4gICAgICAgICAgICAgICAgLy8gaWYgaXQgaXMsIGNoYW5nZSBob3cgaXQgaXMgbWFuYWdlZCAobm90IHJlbGV2YW50IHVudGlsIG9iamVjdCBsaWZlIGN5Y2xlIG90aGVyXG4gICAgICAgICAgICAgICAgLy8gdGhhbiBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuSW5maW5pdGVQZXJzaXN0ZW5jZSBpcyBzdXBwb3J0ZWQpLlxuXG4gICAgICAgICAgICAgICAgKDxQdWJTdWJSZWxheT5wdWJTdWJSZWxheSkuYWRkU3Vic2NyaWJlcih7XG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmliZXJJZGVudGlmaWVyOiBzZWxmSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgc3Vic2NyaWJlclNldHRlcjogc2VsZlNldHRlcixcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0TGlmZUN5Y2xlOiBvYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHVibGljIGhhbmRsZVB1Ymxpc2hlZE1lc3NhZ2UoXG4gICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTphbnlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIGxldCBwdWJTdWJSZWxheSA9IHRoaXMuaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICBwdWJTdWJSZWxheS5yZWxheU1lc3NhZ2Uoc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgbWVzc2FnZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByaXZhdGUgaGFuZGxlUHViU3ViUmVsYXlJbml0aWFsaXphdGlvbkFuZFJldHJpZXZhbChzdWJzY3JpcHRpb25JZGVudGlmaWVyOnN0cmluZykgOiBQdWJTdWJSZWxheSB7XG4gICAgICAgICAgICAgICAgbGV0IHB1YlN1YlJlbGF5IDogUHViU3ViUmVsYXl8bnVsbHx1bmRlZmluZWQgPSBudWxsO1xuICAgICAgICAgICAgICAgIC8vIENyZWF0ZSBwdWIgc3ViIHJlbGF5IGlmIGl0IGRvZXMgbm90IGV4aXN0XG4gICAgICAgICAgICAgICAgaWYgKChwdWJTdWJSZWxheSA9IHRoaXMucHViU3ViUmVsYXlTdG9yYWdlLmdldChzdWJzY3JpcHRpb25JZGVudGlmaWVyKSkgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBwdWJTdWJSZWxheSA9IG5ldyBQdWJTdWJSZWxheShzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdWJTdWJSZWxheVN0b3JhZ2Uuc2V0KFxuICAgICAgICAgICAgICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcixcbiAgICAgICAgICAgICAgICAgICAgICAgIDxQdWJTdWJSZWxheT5wdWJTdWJSZWxheVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gPFB1YlN1YlJlbGF5PnB1YlN1YlJlbGF5O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSW50ZXJuYWwgbGlicmFyeSBzdGF0ZVxuICAgICAgICAvLyBUT0RPOiBNYW5hZ2UgaW50ZXJuYWwgbGlicmFyeSBzdGF0ZSB3aXRob3V0IHVzaW5nIGdsb2JhbHNcbiAgICAgICAgbGV0IHB1YlN1YlJlbGF5TWFuYWdlciA6IFB1YlN1YlJlbGF5TWFuYWdlciA9IG5ldyBQdWJTdWJSZWxheU1hbmFnZXIoKTs7XG5cbiAgICAgICAgLy8gVHJlYXQgdGhlIGZpcnN0IHR3byBhcmd1bWVudHMgdG8gdGhpcyBmdW5jdGlvbiBhcyBiZWluZyBtb3JlIGEgcGFydCBvZiBhIHN0YWJsZVxuICAgICAgICAvLyBBUEkgdnMgdGhlIHRoZSB0aGlyZCBhbmQgZm91cnRoIGFyZ3VtZW50cyB3aGljaCBhcmUgc3ViamVjdCB0byBjaGFuZ2UuXG4gICAgICAgIGV4cG9ydCBsZXQgc3Vic2NyaWJlID0gKFxuICAgICAgICAgICAgc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsXG4gICAgICAgICAgICBzZWxmSWRlbnRpZmllcjpzdHJpbmcsIC8vIHNob3VsZCBiZSBhIENTUyBzZWxlY3RvciAoSlF1ZXJ5IHNlbGVjdG9yKSB1bmxlc3MgcHJvdmlkaW5nIGBzZWxmU2V0dGVyYCBhcmd1bWVudFxuICAgICAgICAgICAgc2VsZlNldHRlcjooKG1lc3NhZ2U6YW55KSA9PiB2b2lkKXxudWxsfHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnRcbiAgICAgICAgKSA6IGFueXx2b2lkID0+IHtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKFwiUHJpbnRpbmcgRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLnN1YnNjcmliZSBhcmdzXCIpO1xuICAgICAgICAgICAgLy9jb25zb2xlLmluZm8oc3Vic2NyaXB0aW9uSWRlbnRpZmllcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzZWxmSWRlbnRpZmllcik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzZWxmU2V0dGVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKG9iamVjdExpZmVDeWNsZSk7XG4gICAgICAgICAgICBwdWJTdWJSZWxheU1hbmFnZXIuaGFuZGxlU3Vic2NyaXB0aW9uKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIHNlbGZJZGVudGlmaWVyLCBzZWxmU2V0dGVyLCBvYmplY3RMaWZlQ3ljbGVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBleHBvcnQgbGV0IHB1Ymxpc2ggPSAoc3Vic2NyaXB0aW9uSWRlbnRpZmllcjpzdHJpbmcsIG1lc3NhZ2U6YW55KSA9PiB7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhcIlByaW50aW5nIEZyb250RW5kRnJhbWV3b3JrLlB1YlN1Yi5wdWJsaXNoIGFyZ3NcIik7XG4gICAgICAgICAgICAvL2NvbnNvbGUuaW5mbyhzdWJzY3JpcHRpb25JZGVudGlmaWVyKTtcbiAgICAgICAgICAgIC8vY29uc29sZS5pbmZvKG1lc3NhZ2UpO1xuICAgICAgICAgICAgcHViU3ViUmVsYXlNYW5hZ2VyLmhhbmRsZVB1Ymxpc2hlZE1lc3NhZ2Uoc3Vic2NyaXB0aW9uSWRlbnRpZmllciwgbWVzc2FnZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVc2FnZTogRHVyaW5nIGluaXRpYWxpemF0aW9uIHN1YnNjcmliZSBiZWZvcmUgcG9zdC1ob29rcyAocHJlZmVyYWJseSBwcmUtaG9va3MpIGFuZCBwdWJsaXNoIGluIHBvc3QtaG9va3MuXG5cbiAgICAgICAgLy8gQXNzdW1lZCB0byBiZSBjb25zdHJ1Y3RlZCBpbiBwcmUtaG9va1xuICAgICAgICBleHBvcnQgY2xhc3MgUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyIGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBTdXBwb3J0IG90aGVyIG9iamVjdCBsaWZlIGN5Y2xlc1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IG9iamVjdExpZmVDeWNsZSA9IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlO1xuICAgICAgICAgICAgcHVibGljIHN0b3JhZ2VLZXk6IHN0cmluZztcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VLZXk6c3RyaW5nLFxuICAgICAgICAgICAgICAgIHB1Ymxpc2hFeGlzdGluZ1N0b3JlZFZhbHVlOmJvb2xlYW4gPSB0cnVlXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3JhZ2VLZXkgPSBzdG9yYWdlS2V5O1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogU2hvcnQtQ2lyY3VpdCBpZiBzZXNzaW9uIHN0b3JhZ2Ugbm90IGF2YWlsYWJsZVxuICAgICAgICAgICAgICAgIGlmICghU3RvcmFnZS5Jc1Nlc3Npb25TdG9yYWdlQXZhaWxhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBYmFuZG9uaW5nIFB1YlN1YlNlc3Npb25TdG9yYWdlU3Vic2NyaWJlciBpbml0aWFsaXphdGlvbiBzaW5jZSBzZXNzaW9uIHN0b3JhZ2UgaXMgbm90IGF2YWlsYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc3Vic2NyaWJlKFxuICAgICAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZGVudGlmaWVyLFxuICAgICAgICAgICAgICAgICAgICBzdG9yYWdlS2V5LFxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdlblN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmModGhpcyksXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICAgICAgbGV0IGluaXRpYWxTdG9yZWRWYWx1ZSA9IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oc3RvcmFnZUtleSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5pdGlhbFN0b3JlZFZhbHVlICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgICAgICAgcHVibGlzaEV4aXN0aW5nU3RvcmVkVmFsdWUpXG4gICAgICAgICAgICAgICAgICAgIGhvb2tzLnBvc3QucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKHN1YnNjcmlwdGlvbklkZW50aWZpZXIsIGluaXRpYWxTdG9yZWRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdG9yZUluU2Vzc2lvblN0b3JhZ2VGdW5jKHZhbDphbnkpIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKHRoaXMuc3RvcmFnZUtleSwgdmFsLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcml2YXRlIGdlblN0b3JlSW5TZXNzaW9uU3RvcmFnZUZ1bmMoc2VsZjogUHViU3ViU2Vzc2lvblN0b3JhZ2VTdWJzY3JpYmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIChtZXNzYWdlOmFueSkgPT4ge3NlbGYuc3RvcmVJblNlc3Npb25TdG9yYWdlRnVuYy5jYWxsKHNlbGYsIG1lc3NhZ2UpO31cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFzc3VtZWQgdG8gYmUgY29uc3RydWN0ZWQgaW4gcHJlLWhvb2tcbiAgICAgICAgZXhwb3J0IGNsYXNzIEh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JpYmVyIGltcGxlbWVudHMgSU9iamVjdExpZmVDeWNsZURldGVybWluYWJsZSB7XG4gICAgICAgICAgICBwdWJsaWMgcmVhZG9ubHkgb2JqZWN0TGlmZUN5Y2xlIDogRnJvbnRFbmRGcmFtZXdvcmsuT2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgcHVibGljIHJlYWRvbmx5IGh0bWxJZCA6IHN0cmluZztcbiAgICAgICAgICAgIHB1YmxpYyByZWFkb25seSBvbkNoYW5nZUZ1bmMgOiAoKCkgPT4gdm9pZCl8bnVsbDtcbiAgICAgICAgICAgIGNvbnN0cnVjdG9yKFxuICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXI6c3RyaW5nLFxuICAgICAgICAgICAgICAgIGh0bWxJZDpzdHJpbmcsXG4gICAgICAgICAgICAgICAgb25DaGFuZ2VGdW5jOigoKSA9PiB2b2lkKXxudWxsID0gbnVsbCxcbiAgICAgICAgICAgICAgICBvYmplY3RMaWZlQ3ljbGUgPSBGcm9udEVuZEZyYW1ld29yay5PYmplY3RMaWZlQ3ljbGUuVHJhbnNpZW50LFxuICAgICAgICAgICAgICAgIHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZTpib29sZWFuID0gZmFsc2VcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlID0gb2JqZWN0TGlmZUN5Y2xlO1xuICAgICAgICAgICAgICAgIHRoaXMuaHRtbElkID0gaHRtbElkO1xuICAgICAgICAgICAgICAgIHRoaXMub25DaGFuZ2VGdW5jID0gb25DaGFuZ2VGdW5jO1xuXG4gICAgICAgICAgICAgICAgLy8gUHVibGlzaCB2YWx1ZSB3aGVuIGFwcHJvcHJpYXRlXG4gICAgICAgICAgICAgICAgaWYgKHB1Ymxpc2hWYWx1ZVByZWRpY2F0ZSAmJlxuICAgICAgICAgICAgICAgICAgICAoKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlICE9IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGhvb2tzLnBvc3QucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwdWJsaXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGh0bWxJZCkpLnZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBTdWJzY3JpYmVcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmUoXG4gICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgIGAjJHtodG1sSWR9YCxcbiAgICAgICAgICAgICAgICAgICAgKG1lc3NhZ2U6YW55KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGAjJHtodG1sSWR9YCkudmFsKG1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub25DaGFuZ2VGdW5jICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlRnVuYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgY29uc29sZS5lcnJvcihlKSB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2JqZWN0TGlmZUN5Y2xlXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgIC8vIFB1Ymxpc2ggb24gY2hhbmdlc1xuICAgICAgICAgICAgICAgICQoYCMke2h0bWxJZH1gKS5vbihGcm9udEVuZEZyYW1ld29yay5IdG1sSW5wdXRDaGFuZ2VFdmVudHMsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcHVibGlzaChcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1YnNjcmlwdGlvbklkZW50aWZpZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICAoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWVcbiAgICAgICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmluZm8oYERldGVjdGVkIGNoYW5nZSBpbiAoJHtodG1sSWR9KTogJHsoPEhUTUxJbnB1dEVsZW1lbnQ+ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaHRtbElkKSkudmFsdWV9YClcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vbkNoYW5nZUZ1bmMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm9uQ2hhbmdlRnVuYygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBjb25zb2xlLmVycm9yKGUpIH1cbiAgICAgICAgICAgICAgICAgICAgfSAvLyBlbHNlIHsgY29uc29sZS5pbmZvKCdEaWQgbm90IGZpcmUgbnVsbCBvbkNoYW5nZUZ1bmMnKSB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQgJiZcbiAgICAgICAgICAgICAgICAgICAgRnJvbnRFbmRGcmFtZXdvcmsuU2luZ2xlUGFnZUFwcGxpY2F0aW9uICYmXG4gICAgICAgICAgICAgICAgICAgIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICAoPCgoKSA9PiB2b2lkKVtdPmhvb2tzLnBhZ2VDbGVhbnVwKS5wdXNoKHRoaXMuZ2VuSGFuZGxlTmF2aWdhdGlvbkZ1bmModGhpcykpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaGFuZGxlTmF2aWdhdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5UcmFuc2llbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZWFyZG93bigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcHJpdmF0ZSBnZW5IYW5kbGVOYXZpZ2F0aW9uRnVuYyhzZWxmOiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyaWJlcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKSA9PiB7c2VsZi5oYW5kbGVOYXZpZ2F0aW9uLmNhbGwoc2VsZik7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0ZWFyZG93bihvdmVycmlkZU9iamVjdExpZmVDeWNsZTpib29sZWFuID0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5vYmplY3RMaWZlQ3ljbGUgPT09IEZyb250RW5kRnJhbWV3b3JrLk9iamVjdExpZmVDeWNsZS5JbmZpbml0ZVBlcnNpc3RlbmNlICYmXG4gICAgICAgICAgICAgICAgICAgICFvdmVycmlkZU9iamVjdExpZmVDeWNsZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gdGVhcmRvd24gRnJvbnRFbmRGcmFtZXdvcmsuUHViU3ViLkh0bWxJbnB1dEVsZW1lbnRQdWJsaXNoZXJBbmRTdWJzY3JiZXIgaW5zdGFuY2UgZHVlIHRvIG9iamVjdExpZmVDeWNsZSBub3QgYmVpbmcgb3ZlcnJpZGRlbicpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coYENsZWFuaW5nIHVwIGV2ZW50IGhhbmRsZXJzIHNldCB1cCBpbiBIdG1sSW5wdXRFbGVtZW50UHVibGlzaGVyQW5kU3Vic2NyYmVyIChpZDogJHt0aGlzLmh0bWxJZH0pYCk7XG4gICAgICAgICAgICAgICAgJCgnIycgKyB0aGlzLmh0bWxJZCkub2ZmKEZyb250RW5kRnJhbWV3b3JrLkh0bWxJbnB1dENoYW5nZUV2ZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucHJlIEFycmF5XG4gICAgICAgIHdoaWxlIChob29rcy5wcmUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdHJ5IHsgKDwoKCkgPT4gdm9pZCk+aG9va3MucHJlLnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRyeSB7IHByZVJlYWR5RnVuYygpOyB9XG4gICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuXG4gICAgICAgIGlmICgoRnJvbnRFbmRGcmFtZXdvcmsucmVhZHlGdW5jICE9IG51bGwpICYmXG4gICAgICAgICAgICAodHlwZW9mKEZyb250RW5kRnJhbWV3b3JrLnJlYWR5RnVuYykgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIEZyb250RW5kRnJhbWV3b3JrLnJlYWR5RnVuYygpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0cnkgeyBwb3N0UmVhZHlGdW5jKCk7IH1cbiAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG5cbiAgICAgICAgLy8gRmlyZSBmdW5jdGlvbnMgaW4gaG9va3MucG9zdCBBcnJheVxuICAgICAgICB3aGlsZSAoaG9va3MucG9zdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0cnkgeyAoPCgoKSA9PiB2b2lkKT5ob29rcy5wb3N0LnNoaWZ0KCkpKCk7IH1cbiAgICAgICAgICAgIGNhdGNoKGUpIHsgY29uc29sZS5lcnJvcihlKTsgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlNpbmdsZVBhZ2VBcHBsaWNhdGlvbikge1xuICAgICAgICAvLyBUT0RPOiBBZGQgc3VwcG9ydCBmb3Igb3RoZXIgU1BBIGZyYW1ld29ya3MgaGVyZS5cbiAgICAgICAgaWYgKEZyb250RW5kRnJhbWV3b3JrLlR1cmJvbGlua3NBdmFpbGFibGUpIHtcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicsIGNsZWFudXBGdW5jKTtcbiAgICAgICAgICAgIGlmIChob29rcy5wYWdlQ2xlYW51cCAhPSBudWxsKVxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3R1cmJvbGlua3M6YmVmb3JlLXJlbmRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGaXJlIGZ1bmN0aW9ucyBpbiBob29rcy5wYWdlQ2xlYW51cCBBcnJheVxuICAgICAgICAgICAgICAgICAgICB3aGlsZSAoKDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHsgKDwoKCkgPT4gdm9pZCk+KDwoKCkgPT4gdm9pZClbXT5ob29rcy5wYWdlQ2xlYW51cCkuc2hpZnQoKSkoKTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0Y2goZSkgeyBjb25zb2xlLmVycm9yKGUpOyB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoKGNsZWFyU3RhdGVPbk5hdmlnYXRpb25GdW5jICE9IG51bGwpICYmICh0eXBlb2YoY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMpID09PSAnZnVuY3Rpb24nKSlcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0dXJib2xpbmtzOnZpc2l0JywgY2xlYXJTdGF0ZU9uTmF2aWdhdGlvbkZ1bmMpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy89IHJlcXVpcmUgLi9iYXNlXG4vLz0gcmVxdWlyZSAuL3NjcmVlbl9yZXNvbHV0aW9uc1xuLy89IHJlcXVpcmUgLi9taW5pX2h0bWxfdmlld19tb2RlbFxuLy89IHJlcXVpcmUgLi9zdG9yYWdlXG4vLz0gcmVxdWlyZSAuL2NvcmVcblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vYmFzZS5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3NjcmVlbl9yZXNvbHV0aW9ucy5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL21pbmlfaHRtbF92aWV3X21vZGVsLmpzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vc3RvcmFnZS5qcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2NvcmUuanMudHNcIi8+XG5cbi8vIE5vdGUgdGhhdCB0aGUgYWJvdmUgcmVmZXJlbmNlcyBkbyBub3Qgd29yayBpZiB5b3UgaGF2ZSB0aGUgVHlwZVNjcmlwdCBjb21waWxlciBzZXQgdG8gcmVtb3ZlIGNvbW1lbnRzLlxuLy8gVXNlIHNvbWV0aGluZyBsaWtlIHRoZSB1Z2xpZmllciBnZW0gZm9yIHJlbW92aW5nIGNvbW1lbnRzL29iZnVzY2F0aW9uLlxuXG4vLyBBbHNvIG5vdGUgdGhhdCByZXF1aXJlIG9yZGVyIGRvZXMgbm90IGNvbnNpZGVyIGRlcGVuZGVuY3kgY2hhaW4uIFRoZXJlZm9yZSwgZGVwZW5kZW5jaWVzIGJldHdlZW4gZmlsZXNcbi8vIG11c3Qgbm90IGJlIGFmZmVjdGVkIGJ5IGEgcmFuZG9tIGxvYWQgb3JkZXIuXG5cbi8vIEFVVE8tR0VORVJBVEVEIGJ5IGEgUmFrZSB0YXNrLCBkbyBub3QgZWRpdCBieSBoYW5kLlxuXG5uYW1lc3BhY2UgRnJvbnRFbmRGcmFtZXdvcmsgeyBleHBvcnQgY29uc3QgVkVSU0lPTiA9ICcwLjYuOCc7IH1cbiJdfQ==