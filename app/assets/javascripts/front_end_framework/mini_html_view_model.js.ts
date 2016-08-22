
namespace FrontEndFramework {
    export namespace MiniHtmlViewModel {
        export const VERSION = '0.3.1';
        export const TurbolinksAvailable = ((typeof Turbolinks !== 'undefined') && (Turbolinks != null)) ? true : false;

        export namespace Storage {
            export const enum DataPersistenceDuration { Transient, Session, AcrossSessions }
            export interface ICacheExpirationDuration {
                indefinite?: boolean;
                expiryDate?: Date;
            }

            export interface IExpiringCacheDuration extends ICacheExpirationDuration {
                indefinite?: boolean; // MUST BE `false`
                expiryDate: Date;
            }

            export interface IIndefiniteCacheDuration extends ICacheExpirationDuration {
                indefinite: boolean; // MUST BE `true`
                expiryDate?: Date; //  IGNORED
            }

            export class ExpiringCacheDuration implements IExpiringCacheDuration {
                public indefinite = false;
                constructor(public expiryDate: Date) { }
            }

            export class IndefiniteCacheDuration implements IIndefiniteCacheDuration {
                public indefinite = true;
                constructor() { }
            }

            // This is needed for browsers that say that they have SessionStorage but in reality throw an Error as soon
            // as you try to do something.
            let is_session_storage_available = true;
            try {
                sessionStorage.setItem('testa890a809', 'val');
                sessionStorage.removeItem('testa890a809');
            } catch (_error) {
                is_session_storage_available = false;
            } finally {
                // Nothing to do...
            }
            export const IsSessionStorageAvailable = is_session_storage_available;

            export class ClientProfile {
                public DataPersistanceDurationCapabilities: Array<DataPersistenceDuration>;
                constructor() {
                    this.DataPersistanceDurationCapabilities = [DataPersistenceDuration.Transient];
                    if (MiniHtmlViewModel.TurbolinksAvailable ||  MiniHtmlViewModel.Storage.IsSessionStorageAvailable)
                        this.DataPersistanceDurationCapabilities.push(DataPersistenceDuration.Session);
                }
            }

            export class Database {
                public clientProfile = new ClientProfile();
                constructor(
                    private errorOnFail = false
                ) { }

                public set(key: any,
                           val: any,
                           dataPersistenceDuration = DataPersistenceDuration.Session,
                           cacheExpirationDuration?: ICacheExpirationDuration) {
                    try {
                        switch(dataPersistenceDuration) {
                        case DataPersistenceDuration.Transient:
                            break;
                        case DataPersistenceDuration.Session:
                            sessionStorage.setItem(key, val);
                            break;
                        case DataPersistenceDuration.AcrossSessions:
                            break;
                        default:
                            break;
                        }
                    } catch (e) {
                        if (this.errorOnFail) throw e;
                    }
                }

                public get(key: any, dataPersistenceDuration?: DataPersistenceDuration) : string {
                    try {
                        if (dataPersistenceDuration != null) {
                            switch(dataPersistenceDuration) {
                            case DataPersistenceDuration.Transient:
                                break;
                            case DataPersistenceDuration.Session:
                                return sessionStorage.getItem(key);
                            case DataPersistenceDuration.AcrossSessions:
                                break;
                            default:
                                break;
                            }
                        } else {
                        }
                    } catch (e) {
                        if (this.errorOnFail) throw e;
                    }
                }

                public forceCacheExpiry(key: any) { }
            }
        }

        export const enum BindingMode { OneTime, OneWayRead, OneWayWrite, TwoWay };
        export let readyFunc : (() => void) = null;
        export let cleanupHooks : (() => void)[] = [];
        let cleanupFunc = function() {
            // Only do something if Turbolinks is present (in other case, page would be reset anyways)
            if (MiniHtmlViewModel.TurbolinksAvailable) {
                for (let i = 0; i < cleanupHooks.length; i++) {
                    try { cleanupHooks[i](); } catch (e) { console.error(e); }
                }
            }
        }
        let clearStateOnNavigationFunc = function() {
            gHndl.stateToClearOnNavigation = {};
        };

        export interface IChangeData {
            key: string;
            value: any;
        }

        export interface IUserInterfaceElement {
            setupEventHandlers: (() => void);
            teardownEventHandlers: (() => void);
            invokeChange: ((data?: IChangeData) => void);
        }

        export interface IViewModel {
            handlePropertyChangedEvent: ((s: string) => void);
            onChange?: ((htmlId: string) => void);
        }

        export interface IViewModelProperty<T extends ViewModel> {
            bindingMode: BindingMode;
            id: string; // Represents HTML id
            value: any; // Represents displayed initial value
            setDataFunc?: ((a: any) => void);
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void); // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
        }

        export interface IViewModelPropertyOneTimeBinding<T extends ViewModel> extends IViewModelProperty<T> {
            bindingMode: BindingMode; // Must be set to BindingMode.OneTime
            id: string; // Represents HTML id
            value: any; // Represents displayed initial value
            setDataFunc?: ((a: any) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
        }

        export interface IViewModelPropertyOneWayReadBinding<T extends ViewModel> extends IViewModelProperty<T> {
            bindingMode: BindingMode; // Must be set to BindingMode.OneWayRead
            id: string; // Represents HTML id
            value: any; // Represents displayed initial value
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void); // Either implement onChange on IViewModel OR provide onChangeFunc
            viewModelRef?: T;
        }

        export interface IViewModelPropertyOneWayWriteBinding<T extends ViewModel> extends IViewModelProperty<T> {
            bindingMode: BindingMode; // Must be set to BindingMode.OneWayWrite
            id: string; // Represents HTML id
            value: any; // Represents displayed initial value
            setDataFunc?: ((a: any) => void);
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
        }

        export interface IViewModelPropertyTwoWayBinding<T extends ViewModel> extends IViewModelProperty<T> {
            bindingMode: BindingMode; // Must be set to BindingMode.TwoWay
            id: string; // Represents HTML id
            value: any; // Represents displayed initial value
            setDataFunc?: ((a: any) => void);
            getDataFunc?: (() => any);
            onChangeFunc?: ((vm: T) => void); // Either implement onChange on IViewModel OR provide onChangeFunc
            converterFunc?: ((a: any) => any);
            viewModelRef?: T;
        }

        var retrieveAndSetValueForBindableProperty = function<T extends ViewModel>(bP: IViewModelProperty<T>): IViewModelProperty<T> {
            if (bP.getDataFunc != null) {
                bP.value = bP.getDataFunc();
            } else {
                bP.value = (<HTMLInputElement>document.getElementById(bP.id)).value;
            }
            return bP;
        };

        var setValueForBindableProperty = function<T extends ViewModel>(bP: IViewModelProperty<T>) {
            var cnvrtr = bP.converterFunc || function(x) { return x; };
            if (bP.setDataFunc == null) {
                $('#' + bP.id).val(cnvrtr(bP.value));
            } else {
                bP.setDataFunc(cnvrtr(bP.value));
            }
        };

        // Should inherit from this class instead of instantiating it directly.
        export abstract class ViewModel implements IViewModel {
            idToBindableProperty: { [index: string]: IViewModelProperty<ViewModel> };
            constructor(...bindableProperties: IViewModelProperty<ViewModel>[]) {
                this.idToBindableProperty = {};
                bindableProperties.forEach(this.processBindableProperty, this);
            }

            protected processBindableProperty(bP: IViewModelProperty<ViewModel>) {
                try {
                    // Store and attach bindable properties that do not have a OneTime bindingMode.
                    // Note that OneTime bindingMode properties are not stored.
                    if (bP.bindingMode !== BindingMode.OneTime) {
                        bP.viewModelRef = this;
                        this.idToBindableProperty[bP.id] = bP;
                    }

                    setValueForBindableProperty(bP);

                    // Attach onChange event handler for TwoWay and OneWayRead properties.
                    if (bP.bindingMode === BindingMode.TwoWay ||
                        bP.bindingMode === BindingMode.OneWayRead) {
                        $('#' + bP.id).on('change textInput input', function() {
                            console.info('Detected change in: ' + bP.id);
                            retrieveAndSetValueForBindableProperty(bP);

                            if (bP.onChangeFunc != null) {
                                bP.onChangeFunc(bP.viewModelRef);
                            } else {
                                if (typeof (<any>bP.viewModelRef).onChange === 'function') {
                                    (<any>bP.viewModelRef).onChange(bP.id);
                                } else {
                                    console.error('Failed to provide onChangeFunc (alternatively implement onChange [(htmlId: string) => void] method) for implentation of IViewModelProperty for id: ' + bP.id);
                                }
                            }
                        });
                    }
                } catch(e) {
                    console.error(e);
                }
            }

            // Triggers change in UI to match value of property in idToBindableProperty.
            handlePropertyChangedEvent(propertyId: string) {
                try {
                    var bindableProperty = this.idToBindableProperty[propertyId];
                    switch (bindableProperty.bindingMode) {
                    case BindingMode.OneTime:
                        console.error("IMPOSSIBLE");
                        break;
                    case BindingMode.OneWayRead:
                        retrieveAndSetValueForBindableProperty(bindableProperty);
                        break;
                    case BindingMode.OneWayWrite:
                        setValueForBindableProperty(bindableProperty);
                        break;
                    case BindingMode.TwoWay:
                        setValueForBindableProperty(bindableProperty);
                        break;
                    default:
                        console.warn('Invalid bindingMode for Binding Property with id: ' + bindableProperty.id);
                        break;
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        }

        export class ViewModelProperty<T extends ViewModel> implements IViewModelProperty<T> {
            constructor(
                public bindingMode: BindingMode,
                public id: string, // Represents HTML id
                public value: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneTimeBinding<T extends ViewModel> implements IViewModelPropertyOneTimeBinding<T> {
            public bindingMode = BindingMode.OneTime;
            constructor(
                public id: string, // Represents HTML id
                public value: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneWayReadBinding<T extends ViewModel> implements IViewModelPropertyOneWayReadBinding<T> {
            public bindingMode = BindingMode.OneWayRead;
            constructor(
                public id: string, // Represents HTML id
                public value: any, // Represents displayed initial value
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneWayWriteBinding<T extends ViewModel> implements IViewModelPropertyOneWayWriteBinding<T> {
            public bindingMode = BindingMode.OneWayWrite;
            constructor(
                public id: string, // Represents HTML id
                public value: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyTwoWayBinding<T extends ViewModel> implements IViewModelPropertyTwoWayBinding<T> {
            public bindingMode = BindingMode.TwoWay;
            constructor(
                public id: string, // Represents HTML id
                public value: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        // Visits site using Turbolinks if possible.
        export let visitLink = function(link : string, forceReload = false) {
            if ((!forceReload) &&
                MiniHtmlViewModel.TurbolinksAvailable &&
                (typeof(Turbolinks.visit) === 'function')) {
                Turbolinks.visit(link);
            } else {
                window.location.href = link;
            }
        };

        $(document).ready(function() {
            // Fire functions in hooks.pre Array
            while (hooks.pre.length > 0) {
                try { hooks.pre.shift()(); }
                catch(e) { console.error(e); }
            };

            if ((MiniHtmlViewModel.readyFunc != null) &&
                (typeof(MiniHtmlViewModel.readyFunc) === 'function')) {
                try {
                    MiniHtmlViewModel.readyFunc();
                } catch (e) {
                    console.error(e);
                }
            }

            // Fire functions in hooks.post Array
            while (hooks.post.length > 0) {
                try { hooks.post.shift()(); }
                catch(e) { console.error(e); }
            };
        });

        if (MiniHtmlViewModel.TurbolinksAvailable) {
            document.addEventListener('turbolinks:before-render', cleanupFunc);
            if (hooks.pageCleanup != null)
                document.addEventListener('turbolinks:before-render', function() {
                    // Fire functions in hooks.pageCleanup Array
                    while (hooks.pageCleanup.length > 0) {
                        try { hooks.pageCleanup.shift()(); }
                        catch(e) { console.error(e); }
                    };
                });
            if ((clearStateOnNavigationFunc != null) && (typeof(clearStateOnNavigationFunc) === 'function'))
                document.addEventListener('turbolinks:visit', clearStateOnNavigationFunc);
        }
    }
}
