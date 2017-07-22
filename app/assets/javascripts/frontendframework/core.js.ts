/// <reference path="./base.js.ts"/>
/// <reference path="./storage.js.ts"/>

namespace FrontEndFramework {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    export let visitLink = function(link : string, {forceReload, newTab}: {forceReload?: boolean, newTab?: boolean} = {forceReload: false, newTab: false}) {
        if ((newTab != null) && <boolean>newTab) {
            window.open(link, "_blank");
        } else {
            if (FrontEndFramework.SinglePageApplication && !((forceReload != null) && <boolean>forceReload)) {
                // TODO: Add support for other SPA frameworks here.
                if (FrontEndFramework.TurbolinksAvailable &&
                    (typeof(Turbolinks.visit) === 'function')) {
                    Turbolinks.visit(link);
                }
            } else {
                window.location.href = link;
            }
        }
    };

    let cleanupFunc = () => {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (FrontEndFramework.SinglePageApplication) {
            for (let i = 0; i < cleanupHooks.length; i++) {
                try { cleanupHooks[i](); } catch (e) { console.error(e); }
            }
        }
    }
    let preReadyFunc = () => {
        for (let i = 0; i < preReadyHooks.length; i++) {
            try { preReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    let postReadyFunc = () => {
        for (let i = 0; i < postReadyHooks.length; i++) {
            try { postReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    let clearStateOnNavigationFunc = function() {
        FrontEndFramework.stateToClearOnNavigation = {};
    };

    export namespace PubSub {
        interface PubSubRelaySubscriberInfo extends IObjectLifeCycleDeterminable {
            subscriberIdentifier: string;
            subscriberSetter: ((message:any) => void)|null|undefined;
            objectLifeCycle: FrontEndFramework.ObjectLifeCycle;
        }

        class PubSubRelay implements IObjectLifeCycleDeterminable {
            public static DefaultObjectLifeCycle = FrontEndFramework.ObjectLifeCycle.Transient;
            public objectLifeCycle: FrontEndFramework.ObjectLifeCycle;
            public readonly subscriptionIdentifier: string;
            private pubSubRelaySubscribers: PubSubRelaySubscriberInfo[] = [];
            private lastSentMessage: any; // To be re-broadcast after navigating pages
            private firstMessageSentP: boolean = false;

            constructor(subscriptionIdentifier:string) {
                this.subscriptionIdentifier = subscriptionIdentifier;
                this.objectLifeCycle = PubSubRelay.DefaultObjectLifeCycle;
            }

            public addSubscriber(subscriberInfo:PubSubRelaySubscriberInfo) : void {
                if (subscriberInfo.objectLifeCycle != null) {
                    if ((<number>this.objectLifeCycle) < (<number>subscriberInfo.objectLifeCycle)) {
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

            public relayMessage(sendingSubscriberIdentifier:string, message:any) {
                //console.info(`Relaying message from PubSubRelay#relayMessage for subscription: ${this.subscriptionIdentifier}}`)
                this.lastSentMessage = message;
                this.firstMessageSentP = true;
                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    let relevantSubscriber = this.pubSubRelaySubscribers[i];
                    //console.info(`Printing ${i}-th relevantSubscriber`);
                    //console.info(relevantSubscriber);
                    if (relevantSubscriber.subscriberIdentifier !==
                        sendingSubscriberIdentifier) {
                        try {
                            if (relevantSubscriber.subscriberSetter != null &&
                                typeof(relevantSubscriber.subscriberSetter) === 'function') {
                                relevantSubscriber.subscriberSetter(message);
                            } else {
                                // Assumes that a trigger change event should not be fired on setting value.
                                // Use subscriberSetter arg when subscribing.
                                // console.info(`Setting value (${message}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                                $(relevantSubscriber.subscriberIdentifier).val(message)
                            }
                        } catch(e) {
                            console.error(e);
                        }
                    }
                }
            }

            public rebroadcastLastSentMessage() {
                if (!this.firstMessageSentP) return;
                //console.info(`Relaying message from PubSubRelay#rebroadcastLastSentMessage for subscription: ${this.subscriptionIdentifier}}`)
                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    let relevantSubscriber = this.pubSubRelaySubscribers[i];
                    try {
                        if (relevantSubscriber.subscriberSetter != null &&
                            typeof(relevantSubscriber.subscriberSetter) === 'function') {
                            relevantSubscriber.subscriberSetter(this.lastSentMessage);
                        } else {
                            // Assumes that a trigger change event should not be fired on setting value.
                            // Use subscriberSetter arg when subscribing.
                            // console.info(`Setting value (${this.lastSentMessage}) for ${relevantSubscriber.subscriberIdentifier} id.`);
                            $(relevantSubscriber.subscriberIdentifier).val(this.lastSentMessage)
                        }
                    } catch(e) {
                        console.error(e);
                    }
                }
            }

            public handleNavigation() {
                if (this.objectLifeCycle == FrontEndFramework.ObjectLifeCycle.Transient)
                    return; // Short-circuit if item will be PubSubRelay itself will be destroyed anyways

                let toRemove : number[] = []; // indices (this.pubSubRelaySubscribers) of subscribers to remove

                for (let i = 0; i < this.pubSubRelaySubscribers.length; i++) {
                    if (this.pubSubRelaySubscribers[i].objectLifeCycle != null) {
                        toRemove.push(i);
                    }
                }

                while (toRemove.length !== 0) {
                    this.pubSubRelaySubscribers.splice(<number>toRemove.pop(), 1);
                }
            }
        }

        class PubSubRelayStorage implements Storage.IKeyValueStorage, IObjectLifeCycleDeterminable {
            // TODO: Allow the PubSubRelayStorage to have a transient object life cycle
            public readonly objectLifeCycle = FrontEndFramework.ObjectLifeCycle.InfinitePersistence;
            private mapFromSubscriptionIdentifierToPubSubRelays: any;
            constructor() {
                this.mapFromSubscriptionIdentifierToPubSubRelays = {};
            }

            public get(subscriptionIdentifier:string) : PubSubRelay|null|undefined {
                return this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
            }

            public set(subscriptionIdentifier:string, pubSubRelay: PubSubRelay) : void {
                this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier] = pubSubRelay;
            }

            public handleNavigation() {
                let keysToDelete : string[] = [];
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach((subscriptionIdentifier:string) => {
                    let pubSubRelayInstance = this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier];
                    pubSubRelayInstance.handleNavigation();

                    if (pubSubRelayInstance.objectLifeCycle === FrontEndFramework.ObjectLifeCycle.Transient) {
                        // Remove pubSubRelayInstance
                        keysToDelete.push(subscriptionIdentifier);
                    }
                })

                for (let i = 0; i < keysToDelete.length; i++) {
                    delete this.mapFromSubscriptionIdentifierToPubSubRelays[keysToDelete[i]];
                }
            }

            public rebroadcastAllMessageLastRelayedByStoredPubSubRelays() : void {
                Object.keys(this.mapFromSubscriptionIdentifierToPubSubRelays).forEach((subscriptionIdentifier:string) => {
                    this.mapFromSubscriptionIdentifierToPubSubRelays[subscriptionIdentifier].rebroadcastLastSentMessage();
                });
            }
        }

        class PubSubRelayManager {
            // TODO: Allow the PubSubRelayManager to have a transient object life cycle
            public readonly objectLifeCycle = FrontEndFramework.ObjectLifeCycle.InfinitePersistence;
            private pubSubRelayStorage: PubSubRelayStorage = new PubSubRelayStorage();
            constructor() {
                if (FrontEndFramework.SinglePageApplication) {
                    (<(() => void)[]>cleanupHooks).push(this.genHandleNavigationFunc(this));
                    (<(() => void)[]>postReadyHooks).push(this.genRebroadcastLastMessagesFunc(this));
                }
            }

            handleNavigation() {
                this.pubSubRelayStorage.handleNavigation();
            }

            rebroadcastLastSentMessages() {
                this.pubSubRelayStorage.rebroadcastAllMessageLastRelayedByStoredPubSubRelays();
            }

            private genHandleNavigationFunc(self: PubSubRelayManager) {
                return self.handleNavigation.call(self);
            }

            private genRebroadcastLastMessagesFunc(self: PubSubRelayManager) {
                return self.rebroadcastLastSentMessages.call(self);
            }

            public handleSubscription(
                subscriptionIdentifier:string,
                selfIdentifier:string, // should be a CSS selector (JQuery selector)
                selfSetter:((message:any) => void)|null|undefined = undefined,
                objectLifeCycle = FrontEndFramework.ObjectLifeCycle.Transient
            ) {
                let pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);

                // TODO: See if given `objectLifeCycle` is greater than designated objectLifeCycle,
                // if it is, change how it is managed (not relevant until object life cycle other
                // than FrontEndFramework.ObjectLifeCycle.InfinitePersistence is supported).

                (<PubSubRelay>pubSubRelay).addSubscriber({
                    subscriberIdentifier: selfIdentifier,
                    subscriberSetter: selfSetter,
                    objectLifeCycle: objectLifeCycle
                });
            }

            public handlePublishedMessage(
                subscriptionIdentifier:string,
                message:any
            ) {
                let pubSubRelay = this.handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier);
                pubSubRelay.relayMessage(subscriptionIdentifier, message);
            }

            private handlePubSubRelayInitializationAndRetrieval(subscriptionIdentifier:string) : PubSubRelay {
                let pubSubRelay : PubSubRelay|null|undefined = null;
                // Create pub sub relay if it does not exist
                if ((pubSubRelay = this.pubSubRelayStorage.get(subscriptionIdentifier)) == null) {
                    pubSubRelay = new PubSubRelay(subscriptionIdentifier);
                    this.pubSubRelayStorage.set(
                        subscriptionIdentifier,
                        <PubSubRelay>pubSubRelay
                    );
                }
                return <PubSubRelay>pubSubRelay;
            }
        }

        // Internal library state
        // TODO: Manage internal library state without using globals
        let pubSubRelayManager : PubSubRelayManager = new PubSubRelayManager();;

        // Treat the first two arguments to this function as being more a part of a stable
        // API vs the the third and fourth arguments which are subject to change.
        export let subscribe = (
            subscriptionIdentifier:string,
            selfIdentifier:string, // should be a CSS selector (JQuery selector) unless providing `selfSetter` argument
            selfSetter:((message:any) => void)|null|undefined = undefined,
            objectLifeCycle = FrontEndFramework.ObjectLifeCycle.Transient
        ) : any|void => {
            //console.info("Printing FrontEndFramework.PubSub.subscribe args");
            //console.info(subscriptionIdentifier);
            //console.info(selfIdentifier);
            //console.info(selfSetter);
            //console.info(objectLifeCycle);
            pubSubRelayManager.handleSubscription(
                subscriptionIdentifier, selfIdentifier, selfSetter, objectLifeCycle
            );
        }

        export let publish = (subscriptionIdentifier:string, message:any) => {
            //console.info("Printing FrontEndFramework.PubSub.publish args");
            //console.info(subscriptionIdentifier);
            //console.info(message);
            pubSubRelayManager.handlePublishedMessage(subscriptionIdentifier, message);
        }

        // Usage: During initialization subscribe before post-hooks (preferably pre-hooks) and publish in post-hooks.

        // Assumed to be constructed in pre-hook
        export class PubSubSessionStorageSubscriber implements IObjectLifeCycleDeterminable {
            // TODO: Support other object life cycles
            public readonly objectLifeCycle = FrontEndFramework.ObjectLifeCycle.InfinitePersistence;
            public storageKey: string;
            constructor(
                subscriptionIdentifier:string,
                storageKey:string,
                publishExistingStoredValue:boolean = true
            ) {
                this.storageKey = storageKey;

                // TODO: Short-Circuit if session storage not available
                if (!Storage.IsSessionStorageAvailable) {
                    console.log('Abandoning PubSubSessionStorageSubscriber initialization since session storage is not available');
                    return;
                }

                subscribe(
                    subscriptionIdentifier,
                    storageKey,
                    this.genStoreInSessionStorageFunc(this),
                    this.objectLifeCycle
                )

                let initialStoredValue = sessionStorage.getItem(storageKey);

                if (initialStoredValue != null &&
                    publishExistingStoredValue)
                    hooks.post.push(() => {
                        publish(subscriptionIdentifier, initialStoredValue);
                    });
            }

            storeInSessionStorageFunc(val:any) {
                sessionStorage.setItem(this.storageKey, val.toString());
            }

            private genStoreInSessionStorageFunc(self: PubSubSessionStorageSubscriber) {
                return (message:any) => {self.storeInSessionStorageFunc.call(self, message);}
            }
        }

        // Assumed to be constructed in pre-hook
        export class HtmlInputElementPublisherAndSubscriber implements IObjectLifeCycleDeterminable {
            public readonly objectLifeCycle : FrontEndFramework.ObjectLifeCycle;
            public readonly htmlId : string;
            public readonly onChangeFunc : (() => void)|null;
            constructor(
                subscriptionIdentifier:string,
                htmlId:string,
                onChangeFunc:(() => void)|null = null,
                objectLifeCycle = FrontEndFramework.ObjectLifeCycle.Transient,
                publishValuePredicate:boolean = false
            ) {
                this.objectLifeCycle = objectLifeCycle;
                this.htmlId = htmlId;
                this.onChangeFunc = onChangeFunc;

                // Publish value when appropriate
                if (publishValuePredicate &&
                    ((<HTMLInputElement>document.getElementById(htmlId)).value != null)) {
                    hooks.post.push(() => {
                        publish(
                            subscriptionIdentifier,
                            (<HTMLInputElement>document.getElementById(htmlId)).value
                        );
                    });
                }

                // Subscribe
                subscribe(
                    subscriptionIdentifier,
                    `#${htmlId}`,
                    (message:any) => {
                        $(`#${htmlId}`).val(message);
                        if (this.onChangeFunc != null) {
                            try {
                                this.onChangeFunc();
                            } catch (e) { console.error(e) }
                        }
                    },
                    this.objectLifeCycle
                );

                // Publish on changes
                $(`#${htmlId}`).on(FrontEndFramework.HtmlInputChangeEvents, () => {
                    publish(
                        subscriptionIdentifier,
                        (<HTMLInputElement>document.getElementById(htmlId)).value
                    );

                    // console.info(`Detected change in (${htmlId}): ${(<HTMLInputElement>document.getElementById(htmlId)).value}`)

                    if (this.onChangeFunc != null) {
                        try {
                            this.onChangeFunc();
                        } catch (e) { console.error(e) }
                    } // else { console.info('Did not fire null onChangeFunc') }
                });

                if (this.objectLifeCycle === FrontEndFramework.ObjectLifeCycle.Transient &&
                    FrontEndFramework.SinglePageApplication &&
                    (hooks.pageCleanup != null)) {
                    (<(() => void)[]>hooks.pageCleanup).push(this.genHandleNavigationFunc(this));
                }
            }

            handleNavigation() {
                if (this.objectLifeCycle === FrontEndFramework.ObjectLifeCycle.Transient) {
                    this.teardown();
                }
            }

            private genHandleNavigationFunc(self: HtmlInputElementPublisherAndSubscriber) {
                return () => {self.handleNavigation.call(self);}
            }

            teardown(overrideObjectLifeCycle:boolean = false) {
                if (this.objectLifeCycle === FrontEndFramework.ObjectLifeCycle.InfinitePersistence &&
                    !overrideObjectLifeCycle) {
                    console.error('Failed to teardown FrontEndFramework.PubSub.HtmlInputElementPublisherAndSubscrber instance due to objectLifeCycle not being overridden');
                    return;
                }

                console.log(`Cleaning up event handlers set up in HtmlInputElementPublisherAndSubscrber (id: ${this.htmlId})`);
                $('#' + this.htmlId).off(FrontEndFramework.HtmlInputChangeEvents);
            }
        }
    }

    $(document).ready(function() {
        // Fire functions in hooks.pre Array
        while (hooks.pre.length > 0) {
            try { (<(() => void)>hooks.pre.shift())(); }
            catch(e) { console.error(e); }
        };

        try { preReadyFunc(); }
        catch(e) { console.error(e); }

        if ((FrontEndFramework.readyFunc != null) &&
            (typeof(FrontEndFramework.readyFunc) === 'function')) {
            try {
                FrontEndFramework.readyFunc();
            } catch (e) {
                console.error(e);
            }
        }

        try { postReadyFunc(); }
        catch(e) { console.error(e); }

        // Fire functions in hooks.post Array
        while (hooks.post.length > 0) {
            try { (<(() => void)>hooks.post.shift())(); }
            catch(e) { console.error(e); }
        };
    });

    if (FrontEndFramework.SinglePageApplication) {
        // TODO: Add support for other SPA frameworks here.
        if (FrontEndFramework.TurbolinksAvailable) {
            document.addEventListener('turbolinks:before-render', cleanupFunc);
            if (hooks.pageCleanup != null)
                document.addEventListener('turbolinks:before-render', function() {
                    // Fire functions in hooks.pageCleanup Array
                    while ((<(() => void)[]>hooks.pageCleanup).length > 0) {
                        try { (<(() => void)>(<(() => void)[]>hooks.pageCleanup).shift())(); }
                        catch(e) { console.error(e); }
                    };
                });
            if ((clearStateOnNavigationFunc != null) && (typeof(clearStateOnNavigationFunc) === 'function'))
                document.addEventListener('turbolinks:visit', clearStateOnNavigationFunc);
        }
    }
}
