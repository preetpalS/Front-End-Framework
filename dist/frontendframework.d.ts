declare var Turbolinks: any;
declare namespace FrontEndFramework {
    interface GlobalHandle extends Window {
        Windows?: any;
        $?: any;
    }
    var hooks: {
        pre: (() => void)[];
        post: (() => void)[];
        pageCleanup?: (() => void)[];
    };
    let gHndl: GlobalHandle;
    var stateToClearOnNavigation: any;
    const enum ObjectLifeCycle {
        Transient = 0,
        VariablePersistence = 1,
        InfinitePersistence = 2
    }
    const HtmlInputChangeEvents = "change textInput input";
    interface IObjectLifeCycleDeterminable {
        objectLifeCycle?: FrontEndFramework.ObjectLifeCycle;
    }
    const enum SupportedIntegration {
        NoFramework = 0,
        Turbolinks = 1,
        WindowsUWP = 2
    }
    interface SupportedIntegrationMetadata {
        supportedIntegration: SupportedIntegration;
        singlePageApplicationSupport: boolean;
        pagePreCacheEvent?: string | null;
    }
    const WindowsUwpEnvironment: boolean;
    const TurbolinksAvailable: boolean;
    const SinglePageApplication: boolean;
    let RuntimeSupportedIntegration: SupportedIntegration;
    let PagePreCacheEvent: string | null;
    let readyFunc: (() => void) | null;
    let cleanupHooks: (() => void)[];
    let preReadyHooks: (() => void)[];
    let postReadyHooks: (() => void)[];
}
declare namespace FrontEndFramework {
    namespace ScreenDimensions {
        interface ScreenDimensions {
            availableHeight: number;
            availableWidth: number;
            deviceHeight: number;
            deviceWidth: number;
        }
        var GetScreenDimensions: () => ScreenDimensions;
    }
}
declare namespace FrontEndFramework {
    namespace MiniHtmlViewModel {
        const VERSION = "0.7.0";
        const enum BindingMode {
            OneTime = 0,
            OneWayRead = 1,
            OneWayWrite = 2,
            TwoWay = 3
        }
        const enum BindingOperationType {
            Read = 0,
            Write = 1
        }
        interface IViewModelPropertyBase<T extends ViewModel> {
            readonly bindingMode: BindingMode;
            readonly id: string | string[];
            value?: any;
            viewModelRef?: T;
            boundEventFunc?: EventListener;
            boundEventFuncs?: EventListener[];
            changeEvents?: string;
        }
        interface IViewModelPropertyWritable<T extends ViewModel> extends IViewModelPropertyBase<T> {
            setDataFunc?: ((a: any) => void);
            converterFunc?: ((a: any) => any);
        }
        interface IViewModelPropertyReadable<T extends ViewModel> extends IViewModelPropertyBase<T> {
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void);
        }
        interface IViewModelProperty<T extends ViewModel> extends IViewModelPropertyReadable<T>, IViewModelPropertyWritable<T> {
        }
        interface IViewModelPropertyOneTimeBinding<T extends ViewModel> extends IViewModelPropertyWritable<T> {
            readonly bindingMode: BindingMode.OneTime;
        }
        interface IViewModelPropertyOneWayReadBinding<T extends ViewModel> extends IViewModelPropertyReadable<T> {
            readonly bindingMode: BindingMode.OneWayRead;
        }
        interface IViewModelPropertyOneWayWriteBinding<T extends ViewModel> extends IViewModelProperty<T> {
            readonly bindingMode: BindingMode.OneWayWrite;
        }
        interface IViewModelPropertyTwoWayBinding<T extends ViewModel> extends IViewModelProperty<T> {
            readonly bindingMode: BindingMode.TwoWay;
        }
        abstract class ViewModel implements IObjectLifeCycleDeterminable {
            protected idToBindableProperty: {
                [index: string]: IViewModelPropertyBase<ViewModel>;
            };
            readonly objectLifeCycle: FrontEndFramework.ObjectLifeCycle;
            private static readonly ChangeEvents;
            protected constructor(objectLifeCycle: FrontEndFramework.ObjectLifeCycle, ...bindableProperties: IViewModelPropertyBase<ViewModel>[]);
            protected processBindableProperty(bP: IViewModelPropertyBase<ViewModel>): void;
            private processBindablePropertySingle;
            protected handlePropertyChangedEvent(propertyId: string, bindingOperationType?: BindingOperationType): void;
            private genTeardownFunc;
            teardown(overrideObjectLifeCycle?: boolean): void;
            private static retrieveAndSetValueForBindableProperty;
            private static setValueForBindableProperty;
        }
        class ViewModelProperty<T extends ViewModel> implements IViewModelProperty<T> {
            readonly bindingMode: BindingMode;
            readonly id: string | string[];
            value?: any;
            setDataFunc?: ((a: any) => void);
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
            changeEvents?: string;
            constructor(bindingMode: BindingMode, id: string | string[], // Represents HTML id
            value?: any, // Represents displayed initial value
            setDataFunc?: ((a: any) => void), getDataFunc?: (() => any), onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc?: ((a: any) => any), viewModelRef?: T, changeEvents?: string);
        }
        class ViewModelPropertyOneTimeBinding<T extends ViewModel> implements IViewModelPropertyOneTimeBinding<T> {
            readonly id: string | string[];
            value?: any;
            setDataFunc?: ((a: any) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
            changeEvents?: string;
            readonly bindingMode: BindingMode.OneTime;
            constructor(id: string | string[], // Represents HTML id
            value?: any, // Represents displayed initial value
            setDataFunc?: ((a: any) => void), converterFunc?: ((a: any) => any), viewModelRef?: T, changeEvents?: string);
        }
        class ViewModelPropertyOneWayReadBinding<T extends ViewModel> implements IViewModelPropertyOneWayReadBinding<T> {
            readonly id: string | string[];
            value?: any;
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void);
            viewModelRef?: T;
            changeEvents?: string;
            readonly bindingMode: BindingMode.OneWayRead;
            constructor(id: string | string[], // Represents HTML id
            value?: any, // Represents displayed initial value
            getDataFunc?: (() => any), onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            viewModelRef?: T, changeEvents?: string);
        }
        class ViewModelPropertyOneWayWriteBinding<T extends ViewModel> implements IViewModelPropertyOneWayWriteBinding<T> {
            readonly id: string | string[];
            value?: any;
            setDataFunc?: ((a: any) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
            changeEvents?: string;
            readonly bindingMode: BindingMode.OneWayWrite;
            constructor(id: string | string[], // Represents HTML id
            value?: any, // Represents displayed initial value
            setDataFunc?: ((a: any) => void), converterFunc?: ((a: any) => any), viewModelRef?: T, changeEvents?: string);
        }
        class ViewModelPropertyTwoWayBinding<T extends ViewModel> implements IViewModelPropertyTwoWayBinding<T> {
            readonly id: string | string[];
            value?: any;
            setDataFunc?: ((a: any) => void);
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
            changeEvents?: string;
            readonly bindingMode: BindingMode.TwoWay;
            constructor(id: string | string[], // Represents HTML id
            value?: any, // Represents displayed initial value
            setDataFunc?: ((a: any) => void), getDataFunc?: (() => any), onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc?: ((a: any) => any), viewModelRef?: T, changeEvents?: string);
        }
    }
}
declare namespace FrontEndFramework {
    namespace Storage {
        const VERSION = "0.1.0";
        const enum DataPersistenceDuration {
            Transient = 0,
            Session = 1,
            AcrossSessions = 2
        }
        interface ICacheExpirationDuration {
            indefinite?: boolean;
            expiryDate?: Date;
        }
        interface IExpiringCacheDuration extends ICacheExpirationDuration {
            indefinite?: boolean;
            expiryDate: Date;
        }
        interface IIndefiniteCacheDuration extends ICacheExpirationDuration {
            indefinite: boolean;
            expiryDate?: Date;
        }
        class ExpiringCacheDuration implements IExpiringCacheDuration {
            expiryDate: Date;
            indefinite: boolean;
            constructor(expiryDate: Date);
        }
        class IndefiniteCacheDuration implements IIndefiniteCacheDuration {
            indefinite: boolean;
            constructor();
        }
        const IsSessionStorageAvailable: boolean;
        interface IKeyValueStorageProfile {
            DataPersistanceDurationCapabilities: DataPersistenceDuration[];
        }
        class ClientStorageProfile implements IKeyValueStorageProfile {
            DataPersistanceDurationCapabilities: Array<DataPersistenceDuration>;
            constructor();
        }
        interface IKeyValueStorage {
            set: ((key: any, val: any) => void);
            get: ((key: any) => any);
        }
        class ClientStorage implements IKeyValueStorage {
            private errorOnFail;
            clientProfile: ClientStorageProfile;
            constructor(errorOnFail?: boolean);
            set(key: any, val: any, dataPersistenceDuration?: DataPersistenceDuration, cacheExpirationDuration?: ICacheExpirationDuration): void;
            get(key: any, dataPersistenceDuration?: DataPersistenceDuration): any | null | undefined;
            forceCacheExpiry(key: any): void;
        }
    }
}
declare namespace FrontEndFramework {
    let visitLink: (link: string, { forceReload, newTab }?: {
        forceReload?: boolean;
        newTab?: boolean;
    }) => void;
    namespace PubSub {
        let subscribe: (subscriptionIdentifier: string, selfIdentifier: string, selfSetter?: (message: any) => void, objectLifeCycle?: ObjectLifeCycle) => any;
        let publish: (subscriptionIdentifier: string, message: any) => void;
        class PubSubSessionStorageSubscriber implements IObjectLifeCycleDeterminable {
            readonly objectLifeCycle = ObjectLifeCycle.InfinitePersistence;
            storageKey: string;
            constructor(subscriptionIdentifier: string, storageKey: string, publishExistingStoredValue?: boolean);
            storeInSessionStorageFunc(val: any): void;
            private genStoreInSessionStorageFunc;
        }
        class HtmlInputElementPublisherAndSubscriber implements IObjectLifeCycleDeterminable {
            readonly subscriptionIdentifier: string;
            readonly objectLifeCycle: FrontEndFramework.ObjectLifeCycle;
            readonly htmlId: string;
            readonly onChangeFunc: (() => void) | null;
            readonly publishValuePredicate: boolean;
            private _publishOnChangeFunc?;
            constructor(subscriptionIdentifier: string, htmlId: string, onChangeFunc?: (() => void) | null, objectLifeCycle?: ObjectLifeCycle, publishValuePredicate?: boolean);
            handleNavigation(): void;
            private genHandleNavigationFunc;
            teardown(overrideObjectLifeCycle?: boolean): void;
        }
    }
}
declare namespace FrontEndFramework {
    namespace BodyScriptActivation {
        const VERSION = "0.1.0";
        const BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR = ".front_end_framework-body_script_activator";
        const BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY = "activationIndex";
        const AddEntryToLookupTable: (key: string, value: (activationHtmlElement: HTMLElement) => void) => void;
    }
}
declare namespace FrontEndFramework {
    const VERSION = "0.8.0";
}
