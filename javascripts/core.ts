
import HTML_INPUT_CHANGE_EVENTS from "./constants/html_input_change_events";
import {ObjectLifeCycle} from "./enumerations/object_life_cycle";
import {SupportedIntegration} from "./enumerations/supported_integration";
import IObjectLifeCycleDeterminable from "./interfaces/i_object_life_cycle_determinable";

namespace FrontEndFramework {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    export let visitLink = (link: string, {forceReload, newTab}: {forceReload?: boolean, newTab?: boolean} = {forceReload: false, newTab: false}) => {
        if ((newTab != null) && newTab as boolean) {
            window.open(link, "_blank");
        } else {
            if (FrontEndFramework.SinglePageApplication && !((forceReload != null) && forceReload as boolean)) {
                // TODO: Add support for other SPA frameworks here.
                if ((FrontEndFramework.RuntimeSupportedIntegration ===
                     SupportedIntegration.Turbolinks) &&
                    (typeof(gHndl.Turbolinks.visit) === "function")) {
                    gHndl.Turbolinks.visit(link);
                }
            } else {
                window.location.href = link;
            }
        }
    };

    const cleanupFunc = () => {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (FrontEndFramework.SinglePageApplication) {
            for (let i = 0; i < cleanupHooks.length; i++) {
                try { cleanupHooks[i](); } catch (e) { console.error(e); }
            }
        }
    };
    const preReadyFunc = () => {
        for (let i = 0; i < preReadyHooks.length; i++) {
            try { preReadyHooks[i](); } catch (e) { console.error(e); }
        }
    };
    const postReadyFunc = () => {
        for (let i = 0; i < postReadyHooks.length; i++) {
            try { postReadyHooks[i](); } catch (e) { console.error(e); }
        }
    };
    const clearStateOnNavigationFunc = () => {
        FrontEndFramework.stateToClearOnNavigation = {};
    };

    export namespace PubSub {
        interface IPubSubRelaySubscriberInfo extends IObjectLifeCycleDeterminable {
            subscriberIdentifier: string;
            subscriberSetter: ((message: any) => void)|null|undefined;
            objectLifeCycle: ObjectLifeCycle;
        }

        class PubSubRelay implements IObjectLifeCycleDeterminable {
            public static DEFAULT_OBJECT_LIFE_CYCLE = ObjectLifeCycle.Transient;
            public objectLifeCycle: ObjectLifeCycle;
            public readonly subscriptionIdentifier: string;
            private pubSubRelaySubscribers: IPubSubRelaySubscriberInfo[] = [];
            private lastSentMessage: any; // To be re-broadcast after navigating pages
            private firstMessageSentP: boolean = false;

            constructor(subscriptionIdentifier: string) {
                this.subscriptionIdentifier = subscriptionIdentifier;
                this.objectLifeCycle = PubSubRelay.DEFAULT_OBJECT_LIFE_CYCLE;
            }

            public addSubscriber(subscriberInfo: IPubSubRelaySubscriberInfo): void {
                if (subscriberInfo.objectLifeCycle != null) {
                    if ((this.objectLifeCycle as number) < (subscriberInfo.objectLifeCycle as number)) {
                        this.objectLifeCycle = subscriberInfo.objectLifeCycle;
                    }
                }

                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    if (this.pubSubRelaySubscribers[i].subscriberIdentifier ===
                        subscriberInfo.subscriberIdentifier) {
                        console.warn(`Cannot subscribe more than once to (${this.subscriptionIdentifier}) with (${subscriberInfo.subscriberIdentifier}).`);
                        return;
                    }
                }

                this.pubSubRelaySubscribers.push(subscriberInfo);
            }

            public relayMessage(sendingSubscriberIdentifier: string, message: any) {
                // console.info(`Relaying message from PubSubRelay#relayMessage for subscription: ${this.subscriptionIdentifier}}`)
                this.lastSentMessage = message;
                this.firstMessageSentP = true;
                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    const relevantSubscriber = this.pubSubRelaySubscribers[i];
                    // console.info(`Printing ${i}-th relevantSubscriber`);
                    // console.info(relevantSubscriber);
                    if (relevantSubscriber.subscriberIdentifier !==
                        sendingSubscriberIdentifier) {
                        try {
                            if (relevantSubscriber.subscriberSetter != null &&
                                typeof(relevantSubscriber.subscriberSetter) === "function") {
                                relevantSubscriber.subscriberSetter(message);
                            } else {
                                // Assumes that a trigger change event should not be fired on setting value.
                                // Use subscriberSetter arg when subscribing.
                                // console.info(`Setting value (${message}) for ${relevantSubscriber.subscriberIdentifier} id.`);

                                // Replaces: $(relevantSubscriber.subscriberIdentifier).val(message);
                                if (typeof gHndl.$ === "undefined") {
                                    const elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                                    for (let x = 0; x < elemsOfInterest.length; x++) {
                                        if (message.constructor === Array) {
                                            console.warn(`Something probably is not going to work as planned in setting values (${message}) for element with id: ${relevantSubscriber.subscriberIdentifier}`);
                                        }
                                        (elemsOfInterest[x] as HTMLInputElement).value = message;
                                    }
                                } else {
                                    (gHndl.$ as any)(relevantSubscriber.subscriberIdentifier).val(message);
                                }
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            }

            public rebroadcastLastSentMessage() {
                if (!this.firstMessageSentP) { return; }
                // console.info(`Relaying message from PubSubRelay#rebroadcastLastSentMessage for subscription: ${this.subscriptionIdentifier}}`)
                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    const relevantSubscriber = this.pubSubRelaySubscribers[i];
                    try {
                        if (relevantSubscriber.subscriberSetter != null &&
                            typeof(relevantSubscriber.subscriberSetter) === "function") {
                            relevantSubscriber.subscriberSetter(this.lastSentMessage);
                        } else {
                            // Assumes that a trigger change event should not be fired on setting value.
                            // Use subscriberSetter arg when subscribing.
                            // console.info(`Setting value (${this.lastSentMessage}) for ${relevantSubscriber.subscriberIdentifier} id.`);

                            // Replaces: $(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage)
                            if (typeof gHndl.$ === "undefined") {
                                const elemsOfInterest = document.querySelectorAll(relevantSubscriber.subscriberIdentifier);
                                for (let x = 0; x < elemsOfInterest.length; x++) {
                                    if (this.lastSentMessage.constructor === Array) {
                                        console.warn(`Something probably is not going to work as planned in setting values (${this.lastSentMessage}) for element with id: ${relevantSubscriber.subscriberIdentifier}`);
                                    }
                                    (elemsOfInterest[x] as HTMLInputElement).value = this.lastSentMessage;
                                }
                            } else {
                                (gHndl.$ as any)(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage);
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            }

            public handleNavigation() {
                if (this.objectLifeCycle === ObjectLifeCycle.Transient) {
                    return;
                } // Short-circuit if item will be PubSubRelay itself will be destroyed anyways

                const toRemove: number[] = []; // indices (this.pubSubRelaySubscribers) of subscribers to remove

                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    if (this.pubSubRelaySubscribers[i].objectLifeCycle != null) {
                        toRemove.push(i);
                    }
                }

                while (toRemove.length !== 0) {
                    this.pubSubRelaySubscribers.splice(toRemove.pop() as number, 1);
                }
            }
        }

        class PubSubRelayStorage implements Storage.IKeyValueStorage, IObjectLifeCycleDeterminable {
            // TODO: Allow the PubSubRelayStorage to have a transient object life cycle
            public readonly objectLifeCycle = ObjectLifeCycle.InfinitePersistence;
            private mapFromSubscriptionIdentifierToPubSubRelays: any;
            constructor() {
                this.mapFromSubscriptionIdentifierToPubSubRelays = {};
            }

            public get(subscriptionIdentifier: string): PubSubRelay|null|undefined {
                return this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
            }

            public set(subscriptionIdentifier: string, pubSubRelay: PubSubRelay): void {
                this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier] = pubSubRelay;
            }

            public handleNavigation() {
                const keysToDelete: string[] = [];
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach((subscriptionIdentifier: string) => {
                    const pubSubRelayInstance = this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
                    pubSubRelayInstance.handleNavigation();

                    if (pubSubRelayInstance.objectLifeCycle === ObjectLifeCycle.Transient) {
                        // Remove pubSubRelayInstance
                        keysToDelete.push(subscriptionIdentifier);
                    }
                });

                for (let i = 0; i < keysToDelete.length; i++) {
                    delete this.mapFromSubscriptionIdentifierToPubSubRelays[keysToDelete[i]];
                }
            }

            public rebroadcastAllMessageLastRelayedByStoredPubSubRelays(): void {
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach((subscriptionIdentifier: string) => {
                    this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier].rebroadcastLastSentMessage();
                });
            }
        }

        class PubSubRelayManager {
            // TODO: Allow the PubSubRelayManager to have a transient object life cycle
            public readonly objectLifeCycle = ObjectLifeCycle.InfinitePersistence;
            private pubSubRelayStorage: PubSubRelayStorage = new PubSubRelayStorage();
            constructor() {
                if (FrontEndFramework.SinglePageApplication) {
                    (cleanupHooks as Array<() => void>).push(this.genHandleNavigationFunc(this));
                    (postReadyHooks as Array<() => void>).push(this.genRebroadcastLastMessagesFunc(this));
                }
            }

            public handleNavigation() {
                this.pubSubRelayStorage.handleNavigation();
            }

            public rebroadcastLastSentMessages() {
                this.pubSubRelayStorage.rebroadcastAllMessageLastRelayedByStoredPubSubRelays();
            }

            public handleSubscription(
                subscriptionIdentifier: string,
                selfIdentifier: string, // should be a CSS selector (JQuery selector)
                selfSetter: ((message: any) => void)|null|undefined = undefined,
                objectLifeCycle = ObjectLifeCycle.Transient
            ) {
                const pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);

                // TODO: See if given `objectLifeCycle` is greater than designated objectLifeCycle,
                // if it is, change how it is managed (not relevant until object life cycle other
                // than FrontEndFramework.ObjectLifeCycle.InfinitePersistence is supported).

                (pubSubRelay as PubSubRelay).addSubscriber({
                    objectLifeCycle,
                    subscriberIdentifier: selfIdentifier,
                    subscriberSetter: selfSetter,
                });
            }

            public handlePublishedMessage(
                subscriptionIdentifier: string,
                message: any
            ) {
                const pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
                pubSubRelay.relayMessage(subscriptionIdentifier, message);
            }

            private genHandleNavigationFunc(self: PubSubRelayManager) {
                return self.handleNavigation.bind(self);
            }

            private genRebroadcastLastMessagesFunc(self: PubSubRelayManager) {
                return self.rebroadcastLastSentMessages.bind(self);
            }

            private handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier: string): PubSubRelay {
                let pubSubRelay: PubSubRelay|null|undefined = this.pubSubRelayStorage.get(subscriptionIdentifier);
                // Create pub sub relay if it does not exist
                if (pubSubRelay == null) {
                    pubSubRelay = new PubSubRelay(subscriptionIdentifier);
                    this.pubSubRelayStorage.set(
                        subscriptionIdentifier,
                        pubSubRelay as PubSubRelay
                    );
                }
                return pubSubRelay as PubSubRelay;
            }
        }

        // Internal library state
        // TODO: Manage internal library state without using globals
        const pubSubRelayManager: PubSubRelayManager = new PubSubRelayManager();

        // Treat the first two arguments to this function as being more a part of a stable
        // API vs the the third and fourth arguments which are subject to change.
        export let subscribe = (
            subscriptionIdentifier: string,
            selfIdentifier: string, // should be a CSS selector (JQuery selector) unless providing `selfSetter` argument
            selfSetter: ((message: any) => void)|null|undefined = undefined,
            objectLifeCycle = ObjectLifeCycle.Transient
        ): any|void => {
            // console.info("Printing FrontEndFramework.PubSub.subscribe args");
            // console.info(subscriptionIdentifier);
            // console.info(selfIdentifier);
            // console.info(selfSetter);
            // console.info(objectLifeCycle);
            pubSubRelayManager.handleSubscription(
                subscriptionIdentifier, selfIdentifier, selfSetter, objectLifeCycle
            );
        };

        export let publish = (subscriptionIdentifier: string, message: any) => {
            // console.info("Printing FrontEndFramework.PubSub.publish args");
            // console.info(subscriptionIdentifier);
            // console.info(message);
            pubSubRelayManager.handlePublishedMessage(subscriptionIdentifier, message);
        };

        // Usage: During initialization subscribe before post-hooks (preferably pre-hooks) and publish in post-hooks.

        // Assumed to be constructed in pre-hook
        export class PubSubSessionStorageSubscriber implements IObjectLifeCycleDeterminable {
            // TODO: Support other object life cycles
            public readonly objectLifeCycle = ObjectLifeCycle.InfinitePersistence;
            public storageKey: string;
            constructor(
                subscriptionIdentifier: string,
                storageKey: string,
                publishExistingStoredValue: boolean = true
            ) {
                this.storageKey = storageKey;

                // TODO: Short-Circuit if session storage not available
                if (!Storage.IsSessionStorageAvailable) {
                    console.log("Abandoning PubSubSessionStorageSubscriber initialization since session storage is not available");
                    return;
                }

                subscribe(
                    subscriptionIdentifier,
                    storageKey,
                    this.genStoreInSessionStorageFunc(this),
                    this.objectLifeCycle
                );

                const initialStoredValue = sessionStorage.getItem(storageKey);

                if (initialStoredValue != null &&
                    publishExistingStoredValue) {
                    hooks.post.push(() => {
                        publish(subscriptionIdentifier, initialStoredValue);
                    });
                }
            }

            public storeInSessionStorageFunc(val: any) {
                sessionStorage.setItem(this.storageKey, val.toString());
            }

            private genStoreInSessionStorageFunc(self: PubSubSessionStorageSubscriber) {
                return (message: any) => {self.storeInSessionStorageFunc.call(self, message); };
            }
        }

        // Assumed to be constructed in pre-hook
        export class HtmlInputElementPublisherAndSubscriber implements IObjectLifeCycleDeterminable {
            public readonly subscriptionIdentifier: string;
            public readonly objectLifeCycle: ObjectLifeCycle;
            public readonly htmlId: string;
            public readonly onChangeFunc: (() => void)|null;
            public readonly publishValuePredicate: boolean;
            private _publishOnChangeFunc?: ((ev: Event) => void);
            constructor(
                subscriptionIdentifier: string,
                htmlId: string,
                onChangeFunc: (() => void)|null = null,
                objectLifeCycle = ObjectLifeCycle.Transient,
                publishValuePredicate: boolean = false
            ) {
                this.subscriptionIdentifier = subscriptionIdentifier;
                this.htmlId = htmlId;
                this.onChangeFunc = onChangeFunc;
                this.objectLifeCycle = objectLifeCycle;
                this.publishValuePredicate = publishValuePredicate;

                // Publish value when appropriate
                if (publishValuePredicate &&
                    ((document.getElementById(htmlId) as HTMLInputElement).value != null)) {
                    hooks.post.push(() => {
                        publish(
                            subscriptionIdentifier,
                            (document.getElementById(htmlId) as HTMLInputElement).value
                        );
                    });
                }

                // Subscribe
                subscribe(
                    subscriptionIdentifier,
                    `#${htmlId}`,
                    (message: any) => {
                        if (typeof gHndl.$ === "undefined") {
                            // Replaces: $(`#${htmlId}`).val(message);
                            const elemsOfInterest = document.querySelectorAll(`#${htmlId}`);
                            for (let x = 0; x < elemsOfInterest.length; x++) {
                                (elemsOfInterest[x] as HTMLInputElement).value = message;
                            }
                        } else {
                            (gHndl.$ as any)(`#${htmlId}`).val(message);
                        }

                        if (this.onChangeFunc != null) {
                            try {
                                (this.onChangeFunc as any)();
                            } catch (e) { console.error(e); }
                        }
                    },
                    this.objectLifeCycle
                );

                this._publishOnChangeFunc = ((_ev: Event) => {
                    publish(
                        this.subscriptionIdentifier,
                        (document.getElementById(this.htmlId) as HTMLInputElement).value
                    );

                    // console.info(`Detected change in (${htmlId}): ${(<HTMLInputElement>document.getElementById(htmlId)).value}`)

                    if (this.onChangeFunc != null) {
                        try {
                            this.onChangeFunc();
                        } catch (e) { console.error(e); }
                    } // else { console.info('Did not fire null onChangeFunc') }
                }).bind(this);

                // Publish on changes
                HTML_INPUT_CHANGE_EVENTS.split(" ").forEach((evString) => {
                    (document.getElementById(htmlId) as HTMLElement).addEventListener(evString, (this._publishOnChangeFunc as ((ev: Event) => void)));
                });

                if (this.objectLifeCycle === ObjectLifeCycle.Transient &&
                    FrontEndFramework.SinglePageApplication &&
                    (hooks.pageCleanup != null)) {
                    (hooks.pageCleanup as Array<() => void>).push(this.genHandleNavigationFunc(this));
                }
            }

            public handleNavigation() {
                if (this.objectLifeCycle === ObjectLifeCycle.Transient) {
                    this.teardown();
                }
            }

            public teardown(overrideObjectLifeCycle: boolean = false) {
                if (this.objectLifeCycle === ObjectLifeCycle.InfinitePersistence &&
                    !overrideObjectLifeCycle) {
                    console.error("Failed to teardown FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscrber instance due to objectLifeCycle not being overridden");
                    return;
                }

                console.log(`Cleaning up event handlers set up in HtmlInputElementPublisherAndSubscrber (id: ${this.htmlId})`);
                // Replaces: $('#' + this.htmlId).off(HtmlInputChangeEvents);
                HTML_INPUT_CHANGE_EVENTS.split(" ").forEach((evString) => {
                    if (document.getElementById(this.htmlId) != null) {
                        (document.getElementById(this.htmlId) as HTMLElement).removeEventListener(evString, (this._publishOnChangeFunc as ((ev: Event) => void)));
                    }
                });
            }

            private genHandleNavigationFunc(self: HtmlInputElementPublisherAndSubscriber) {
                return () => {self.handleNavigation.call(self); };
            }
        }
    }

    const READY_FUNC = () => {
        // Fire functions in hooks.pre Array
        while (hooks.pre.length > 0) {
            try { (hooks.pre.shift() as (() => void))(); } catch (e) { console.error(e); }
        }

        try { preReadyFunc(); } catch (e) { console.error(e); }

        if ((FrontEndFramework.readyFunc != null) &&
            (typeof(FrontEndFramework.readyFunc) === "function")) {
            try {
                FrontEndFramework.readyFunc();
            } catch (e) {
                console.error(e);
            }
        }

        try { postReadyFunc(); } catch (e) { console.error(e); }

        // Fire functions in hooks.post Array
        while (hooks.post.length > 0) {
            try { (hooks.post.shift() as (() => void))(); } catch (e) { console.error(e); }
        }
    };

    switch (FrontEndFramework.RuntimeSupportedIntegration) {
        case SupportedIntegration.Turbolinks:
            document.addEventListener("turbolinks:load", READY_FUNC);
            break;
        case SupportedIntegration.NoFramework:
        case SupportedIntegration.WindowsUWP:
        default:
            document.addEventListener("DOMContentLoaded", READY_FUNC);
    }

    if (FrontEndFramework.SinglePageApplication) {
        // TODO: Add support for other SPA frameworks here.
        if (FrontEndFramework.RuntimeSupportedIntegration === SupportedIntegration.Turbolinks &&
            FrontEndFramework.TurbolinksAvailable) {
            document.addEventListener("turbolinks:before-render", cleanupFunc);
            if (hooks.pageCleanup != null) {
                document.addEventListener("turbolinks:before-render", () => {
                    // Fire functions in hooks.pageCleanup Array
                    while ((hooks.pageCleanup as Array<() => void>).length > 0) {
                        try { ((hooks.pageCleanup as Array<() => void>).shift() as (() => void))(); } catch (e) { console.error(e); }
                    }
                });
            }
            if ((clearStateOnNavigationFunc != null) && (typeof(clearStateOnNavigationFunc) === "function")) {
                document.addEventListener("turbolinks:visit", clearStateOnNavigationFunc);
            }
        }
    }
}
