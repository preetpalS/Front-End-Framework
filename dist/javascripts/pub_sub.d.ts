import { ObjectLifeCycle } from "./enumerations/object_life_cycle";
import IObjectLifeCycleDeterminable from "./interfaces/i_object_life_cycle_determinable";
export declare let setup: () => void;
export declare let subscribe: (subscriptionIdentifier: string, selfIdentifier: string, selfSetter?: ((message: any) => void) | undefined, objectLifeCycle?: ObjectLifeCycle) => any;
export declare let publish: (subscriptionIdentifier: string, message: any) => void;
export declare class PubSubSessionStorageSubscriber implements IObjectLifeCycleDeterminable {
    readonly objectLifeCycle = ObjectLifeCycle.InfinitePersistence;
    storageKey: string;
    constructor(subscriptionIdentifier: string, storageKey: string, publishExistingStoredValue?: boolean);
    storeInSessionStorageFunc(val: any): void;
    private genStoreInSessionStorageFunc;
}
export declare class HtmlInputElementPublisherAndSubscriber implements IObjectLifeCycleDeterminable {
    readonly subscriptionIdentifier: string;
    readonly objectLifeCycle: ObjectLifeCycle;
    readonly htmlId: string;
    readonly onChangeFunc: (() => void) | null;
    readonly publishValuePredicate: boolean;
    private _publishOnChangeFunc?;
    constructor(subscriptionIdentifier: string, htmlId: string, onChangeFunc?: (() => void) | null, objectLifeCycle?: ObjectLifeCycle, publishValuePredicate?: boolean);
    handleNavigation(): void;
    teardown(overrideObjectLifeCycle?: boolean): void;
    private genHandleNavigationFunc;
}
