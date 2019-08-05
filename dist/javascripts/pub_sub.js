"use strict";
exports.__esModule = true;
var base_1 = require("./base");
var html_input_change_events_1 = require("./constants/html_input_change_events");
var storage_1 = require("./storage");
var PubSubRelay = /** @class */ (function () {
    function PubSubRelay(subscriptionIdentifier) {
        this.pubSubRelaySubscribers = [];
        this.firstMessageSentP = false;
        this.subscriptionIdentifier = subscriptionIdentifier;
        this.objectLifeCycle = PubSubRelay.DEFAULT_OBJECT_LIFE_CYCLE;
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
        // console.info(`Relaying message from PubSubRelay#relayMessage for subscription: ${this.subscriptionIdentifier}}`)
        this.lastSentMessage = message;
        this.firstMessageSentP = true;
        for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
            var relevantSubscriber = this.pubSubRelaySubscribers[i];
            // console.info(`Printing ${i}-th relevantSubscriber`);
            // console.info(relevantSubscriber);
            if (relevantSubscriber.subscriberIdentifier !==
                sendingSubscriberIdentifier) {
                try {
                    if (relevantSubscriber.subscriberSetter != null &&
                        typeof (relevantSubscriber.subscriberSetter) === "function") {
                        relevantSubscriber.subscriberSetter(message);
                    }
                    else {
                        // Assumes that a trigger change event should not be fired on setting value.
                        // Use subscriberSetter arg when subscribing.
                        // console.info(`Setting value (${message}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                        // Replaces: $(relevantSubscriber.subscriberIdentifier).val(message);
                        if (typeof base_1["default"].getInstance().gHndl.$ === "undefined") {
                            var elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                            for (var x = 0; x < elemsOfInterest.length; x++) {
                                if (message.constructor === Array) {
                                    console.warn("Something probably is not going to work as planned in setting values (" + message + ") for element with id: " + relevantSubscriber.subscriberIdentifier);
                                }
                                elemsOfInterest[x].value = message;
                            }
                        }
                        else {
                            base_1["default"].getInstance().gHndl.$(relevantSubscriber.subscriberIdentifier).val(message);
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
        if (!this.firstMessageSentP) {
            return;
        }
        // console.info(`Relaying message from PubSubRelay#rebroadcastLastSentMessage for subscription: ${this.subscriptionIdentifier}}`)
        for (var i = 0; i < this.pubSubRelaySubscribers.length; i++) {
            var relevantSubscriber = this.pubSubRelaySubscribers[i];
            try {
                if (relevantSubscriber.subscriberSetter != null &&
                    typeof (relevantSubscriber.subscriberSetter) === "function") {
                    relevantSubscriber.subscriberSetter(this.lastSentMessage);
                }
                else {
                    // Assumes that a trigger change event should not be fired on setting value.
                    // Use subscriberSetter arg when subscribing.
                    // console.info(`Setting value (${this.lastSentMessage}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                    // Replaces: $(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage)
                    if (typeof base_1["default"].getInstance().gHndl.$ === "undefined") {
                        var elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                        for (var x = 0; x < elemsOfInterest.length; x++) {
                            if (this.lastSentMessage.constructor === Array) {
                                console.warn("Something probably is not going to work as planned in setting values (" + this.lastSentMessage + ") for element with id: " + relevantSubscriber.subscriberIdentifier);
                            }
                            elemsOfInterest[x].value = this.lastSentMessage;
                        }
                    }
                    else {
                        base_1["default"].getInstance().gHndl.$(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage);
                    }
                }
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    PubSubRelay.prototype.handleNavigation = function () {
        if (this.objectLifeCycle === 0 /* Transient */) {
            return;
        } // Short-circuit if item will be PubSubRelay itself will be destroyed anyways
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
    PubSubRelay.DEFAULT_OBJECT_LIFE_CYCLE = 0 /* Transient */;
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
        if (base_1["default"].getInstance().SINGLE_PAGE_APPLICATION_SUPPORT) {
            base_1["default"].getInstance().cleanupHooks.push(this.genHandleNavigationFunc(this));
            base_1["default"].getInstance().postReadyHooks.push(this.genRebroadcastLastMessagesFunc(this));
        }
    }
    PubSubRelayManager.prototype.handleNavigation = function () {
        this.pubSubRelayStorage.handleNavigation();
    };
    PubSubRelayManager.prototype.rebroadcastLastSentMessages = function () {
        this.pubSubRelayStorage.rebroadcastAllMessageLastRelayedByStoredPubSubRelays();
    };
    PubSubRelayManager.prototype.handleSubscription = function (subscriptionIdentifier, selfIdentifier, // should be a CSS selector (JQuery selector)
    selfSetter, objectLifeCycle) {
        if (objectLifeCycle === void 0) { objectLifeCycle = 0 /* Transient */; }
        var pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
        // TODO: See if given `objectLifeCycle` is greater than designated objectLifeCycle,
        // if it is, change how it is managed (not relevant until object life cycle other
        // than FrontEndFramework.ObjectLifeCycle.InfinitePersistence is supported).
        pubSubRelay.addSubscriber({
            objectLifeCycle: objectLifeCycle,
            subscriberIdentifier: selfIdentifier,
            subscriberSetter: selfSetter
        });
    };
    PubSubRelayManager.prototype.handlePublishedMessage = function (subscriptionIdentifier, message) {
        var pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
        pubSubRelay.relayMessage(subscriptionIdentifier, message);
    };
    PubSubRelayManager.prototype.genHandleNavigationFunc = function (self) {
        return self.handleNavigation.bind(self);
    };
    PubSubRelayManager.prototype.genRebroadcastLastMessagesFunc = function (self) {
        return self.rebroadcastLastSentMessages.bind(self);
    };
    PubSubRelayManager.prototype.handlePubSubRelayInitializationAndRetrieval = function (subscriptionIdentifier) {
        var pubSubRelay = this.pubSubRelayStorage.get(subscriptionIdentifier);
        // Create pub sub relay if it does not exist
        if (pubSubRelay == null) {
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
// Treat the first two arguments to this function as being more a part of a stable
// API vs the the third and fourth arguments which are subject to change.
exports.subscribe = function (subscriptionIdentifier, selfIdentifier, // should be a CSS selector (JQuery selector) unless providing `selfSetter` argument
selfSetter, objectLifeCycle) {
    if (selfSetter === void 0) { selfSetter = undefined; }
    if (objectLifeCycle === void 0) { objectLifeCycle = 0 /* Transient */; }
    // console.info("Printing FrontEndFramework.PubSub.subscribe args");
    // console.info(subscriptionIdentifier);
    // console.info(selfIdentifier);
    // console.info(selfSetter);
    // console.info(objectLifeCycle);
    pubSubRelayManager.handleSubscription(subscriptionIdentifier, selfIdentifier, selfSetter, objectLifeCycle);
};
exports.publish = function (subscriptionIdentifier, message) {
    // console.info("Printing FrontEndFramework.PubSub.publish args");
    // console.info(subscriptionIdentifier);
    // console.info(message);
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
        if (!storage_1.Storage.IS_SESSION_STORAGE_AVAILABLE) {
            console.log("Abandoning PubSubSessionStorageSubscriber initialization since session storage is not available");
            return;
        }
        exports.subscribe(subscriptionIdentifier, storageKey, this.genStoreInSessionStorageFunc(this), this.objectLifeCycle);
        var initialStoredValue = sessionStorage.getItem(storageKey);
        if (initialStoredValue != null &&
            publishExistingStoredValue) {
            base_1["default"].getInstance().hooks.post.push(function () {
                exports.publish(subscriptionIdentifier, initialStoredValue);
            });
        }
    }
    PubSubSessionStorageSubscriber.prototype.storeInSessionStorageFunc = function (val) {
        sessionStorage.setItem(this.storageKey, val.toString());
    };
    PubSubSessionStorageSubscriber.prototype.genStoreInSessionStorageFunc = function (self) {
        return function (message) { self.storeInSessionStorageFunc.call(self, message); };
    };
    return PubSubSessionStorageSubscriber;
}());
exports.PubSubSessionStorageSubscriber = PubSubSessionStorageSubscriber;
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
            base_1["default"].getInstance().hooks.post.push(function () {
                exports.publish(subscriptionIdentifier, document.getElementById(htmlId).value);
            });
        }
        // Subscribe
        exports.subscribe(subscriptionIdentifier, "#" + htmlId, function (message) {
            if (typeof base_1["default"].getInstance().gHndl.$ === "undefined") {
                // Replaces: $(`#${htmlId}`).val(message);
                var elemsOfInterest = document.querySelectorAll("#" + htmlId);
                for (var x = 0; x < elemsOfInterest.length; x++) {
                    elemsOfInterest[x].value = message;
                }
            }
            else {
                base_1["default"].getInstance().gHndl.$("#" + htmlId).val(message);
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
            exports.publish(_this.subscriptionIdentifier, document.getElementById(_this.htmlId).value);
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
        html_input_change_events_1["default"].split(" ").forEach(function (evString) {
            document.getElementById(htmlId).addEventListener(evString, _this._publishOnChangeFunc);
        });
        if (this.objectLifeCycle === 0 /* Transient */ &&
            base_1["default"].getInstance().SINGLE_PAGE_APPLICATION_SUPPORT &&
            (base_1["default"].getInstance().hooks.pageCleanup != null)) {
            base_1["default"].getInstance().hooks.pageCleanup.push(this.genHandleNavigationFunc(this));
        }
    }
    HtmlInputElementPublisherAndSubscriber.prototype.handleNavigation = function () {
        if (this.objectLifeCycle === 0 /* Transient */) {
            this.teardown();
        }
    };
    HtmlInputElementPublisherAndSubscriber.prototype.teardown = function (overrideObjectLifeCycle) {
        var _this = this;
        if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
        if (this.objectLifeCycle === 2 /* InfinitePersistence */ &&
            !overrideObjectLifeCycle) {
            console.error("Failed to teardown FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscrber instance due to objectLifeCycle not being overridden");
            return;
        }
        console.log("Cleaning up event handlers set up in HtmlInputElementPublisherAndSubscrber (id: " + this.htmlId + ")");
        // Replaces: $('#' + this.htmlId).off(HtmlInputChangeEvents);
        html_input_change_events_1["default"].split(" ").forEach(function (evString) {
            if (document.getElementById(_this.htmlId) != null) {
                document.getElementById(_this.htmlId).removeEventListener(evString, _this._publishOnChangeFunc);
            }
        });
    };
    HtmlInputElementPublisherAndSubscriber.prototype.genHandleNavigationFunc = function (self) {
        return function () { self.handleNavigation.call(self); };
    };
    return HtmlInputElementPublisherAndSubscriber;
}());
exports.HtmlInputElementPublisherAndSubscriber = HtmlInputElementPublisherAndSubscriber;
