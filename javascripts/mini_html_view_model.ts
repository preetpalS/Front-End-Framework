
import Base from "./base";
import HTML_INPUT_CHANGE_EVENTS from "./constants/html_input_change_events";
import { ObjectLifeCycle } from "./enumerations/object_life_cycle";
import IObjectLifeCycleDeterminable from "./interfaces/i_object_life_cycle_determinable";

export namespace MiniHtmlViewModel {
    export const enum BindingMode { OneTime, OneWayRead, OneWayWrite, TwoWay }

    export const enum BindingOperationType { Read, Write }

    export interface IViewModelPropertyBase<T extends ViewModel> {
        readonly bindingMode: BindingMode;
        readonly id: string | string[]; // Represents HTML id
        value?: any; // Represents displayed initial value
        viewModelRef?: T;
        boundEventFunc?: EventListener;
        boundEventFuncs?: EventListener[];
        changeEvents?: string; // TODO: Investigate also allowing an array of strings
    }

    export interface IViewModelPropertyWritable<T extends ViewModel> extends IViewModelPropertyBase<T> {
        setDataFunc?: ((a: any) => void);
        converterFunc?: ((a: any) => any);
    }

    export interface IViewModelPropertyReadable<T extends ViewModel> extends IViewModelPropertyBase<T> {
        getDataFunc?: (() => any);
        onChangeFunc?: ((vm: T) => void); // Either implement onChange on IViewModel OR provide onChangeFunc
    }

    // Value is read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
    export interface IViewModelProperty<T extends ViewModel> extends IViewModelPropertyReadable<T>, IViewModelPropertyWritable<T> {
    }

    // BindingMode.OneTime can be thought of as set value once and forget (no event handlers set or IViewModelProperty stored)
    // Value is NOT read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
    export interface IViewModelPropertyOneTimeBinding<T extends ViewModel> extends IViewModelPropertyWritable<T> {
        readonly bindingMode: BindingMode.OneTime;
    }

    // Value is read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
    export interface IViewModelPropertyOneWayReadBinding<T extends ViewModel> extends IViewModelPropertyReadable<T> {
        readonly bindingMode: BindingMode.OneWayRead;
    }

    // BindingMode.OneWayWrite is a way to set values (no event handlers set but IViewModelProperty<T> are stored).
    // Value is read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
    export interface IViewModelPropertyOneWayWriteBinding<T extends ViewModel> extends IViewModelProperty<T> {
        readonly bindingMode: BindingMode.OneWayWrite;
    }

    // Value is read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
    export interface IViewModelPropertyTwoWayBinding<T extends ViewModel> extends IViewModelProperty<T> {
        readonly bindingMode: BindingMode.TwoWay;
    }

    // Should inherit from this class instead of instantiating it directly.
    export abstract class ViewModel implements IObjectLifeCycleDeterminable {
        private static readonly CHANGE_EVENTS = HTML_INPUT_CHANGE_EVENTS;

        private static retrieveAndSetValueForBindableProperty<T extends ViewModel>(bP: IViewModelPropertyReadable<T>, propertyId: string): IViewModelPropertyReadable<T> {
            if (bP.getDataFunc != null) {
                bP.value = bP.getDataFunc();
            } else {
                bP.value = (document.getElementById(propertyId) as HTMLInputElement).value;
            }
            return bP;
        }

        private static setValueForBindableProperty<T extends ViewModel>(bP: IViewModelPropertyWritable<T>, propertyId: string) {
            const cnvrtr = bP.converterFunc || ((x) => x);
            const valueToSet = cnvrtr(bP.value);
            if (bP.setDataFunc == null) {
                if (typeof Base.getInstance().gHndl.$ === "undefined") {
                    // Replaces: $('#' + propertyId).val(bP.value);
                    (document.getElementById(propertyId) as HTMLInputElement).value = valueToSet;
                } else {
                    (Base.getInstance().gHndl.$ as any)("#" + propertyId).val(valueToSet);
                }
            } else {
                bP.setDataFunc(valueToSet);
            }
        }
        protected idToBindableProperty: { [index: string]: IViewModelPropertyBase<ViewModel> };
        protected constructor(
            public readonly objectLifeCycle: ObjectLifeCycle,
            ...bindableProperties: Array<IViewModelPropertyBase<ViewModel>>
        ) {
            this.idToBindableProperty = {};
            bindableProperties.forEach(this.processBindableProperty, this);

            if (this.objectLifeCycle === ObjectLifeCycle.Transient &&
                Base.getInstance().SINGLE_PAGE_APPLICATION_SUPPORT &&
                (Base.getInstance().hooks.pageCleanup != null)) {
                (Base.getInstance().hooks.pageCleanup as Array<() => void>).push(this.genTeardownFunc(this));
            }
        }

        public teardown(overrideObjectLifeCycle: boolean = false) {
            if (this.objectLifeCycle === ObjectLifeCycle.InfinitePersistence &&
                !overrideObjectLifeCycle) {
                console.error("Failed to teardown FrontEndFramework.MiniHtmlViewModel.ViewModel instance due to objectLifeCycle not being overridden");
                return;
            }

            Object.keys(this.idToBindableProperty).forEach((id: string) => {
                console.log(`Cleaning up event handlers set up in ViewModel (id: ${id})`);
                const bP = this.idToBindableProperty[id];
                switch (bP.id.constructor) {
                    case String:
                        if (bP.boundEventFunc != null) {
                            ViewModel.CHANGE_EVENTS.split(" ").forEach((evString) => {
                                if (document.getElementById(id) != null) {
                                    (document.getElementById(id) as HTMLElement).removeEventListener(evString, (bP as any).boundEventFunc);
                                }
                            });
                        }
                        break;
                    case Array:
                        if ((bP.boundEventFuncs != null) &&
                            (bP.boundEventFuncs.constructor === Array) &&
                            (bP.boundEventFuncs.length === (bP.id as string[]).length)) {
                            const idx = (bP.id as string[]).indexOf(id);
                            if (idx !== -1) {
                                ViewModel.CHANGE_EVENTS.split(" ").forEach((evString) => {
                                    if (document.getElementById(id) != null) {
                                        (document.getElementById(id) as HTMLElement).removeEventListener(evString, (bP as any).boundEventFuncs[idx]);
                                    }
                                });
                            } else {
                                console.error("Internal invariant violated (guid: Dtsa43252xxq)");
                            }
                        } else {
                            console.error("Internal invariant violated (guid: pta423taDTD)");
                        }
                        break;
                    default:
                        console.error(`Unacceptable id detected in IViewModelPropertyBase: ${bP}`);
                        break;
                }

            }, this);
        }

        protected processBindableProperty(bP: IViewModelPropertyBase<ViewModel>) {
            switch (bP.id.constructor) {
                case String:
                    this.processBindablePropertySingle(bP);
                    break;
                case Array:
                    for (let i = 0; i < bP.id.length; i++) {
                        this.processBindablePropertySingle({
                            bindingMode: (bP as any).bindingMode,
                            changeEvents: (bP as any).changeEvents,
                            converterFunc: (bP as any).converterFunc,
                            getDataFunc: (bP as any).getDataFunc,
                            id: (bP as any).id[i],
                            onChangeFunc: (bP as any).onChangeFunc,
                            setDataFunc: (bP as any).setDataFunc,
                            value: (bP as any).value,
                            viewModelRef: (bP as any).viewModelRef,
                        } as IViewModelPropertyBase<ViewModel>);
                    }
                    break;
                default:
                    console.error(`Unacceptable id detected in IViewModelPropertyBase: ${bP}`);
                    break;
            }
        }

        // Triggers change in UI to match value of property in idToBindableProperty.
        protected handlePropertyChangedEvent(propertyId: string,
                                             bindingOperationType = BindingOperationType.Write) {
            try {
                const bindableProperty = this.idToBindableProperty[propertyId];
                switch (bindingOperationType) {
                    case BindingOperationType.Write:
                        switch (bindableProperty.bindingMode) {
                            case BindingMode.OneTime:
                            case BindingMode.OneWayRead:
                                console.warn("NOOP");
                                break;
                            case BindingMode.OneWayWrite:
                                ViewModel.setValueForBindableProperty(bindableProperty as IViewModelPropertyOneWayWriteBinding<ViewModel>, propertyId);
                                break;
                            case BindingMode.TwoWay:
                                ViewModel.setValueForBindableProperty(bindableProperty as IViewModelPropertyTwoWayBinding<ViewModel>, propertyId);
                                break;
                            default:
                                console.warn(`Invalid bindingMode (${bindableProperty.bindingMode}) for Binding Property associated with id: ${propertyId}`);
                                break;
                        }
                        break;
                    case BindingOperationType.Read:
                        switch (bindableProperty.bindingMode) {
                            case BindingMode.OneTime:
                            case BindingMode.OneWayWrite:
                                console.warn("NOOP");
                                break;
                            case BindingMode.OneWayRead:
                                ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty as IViewModelPropertyOneWayReadBinding<ViewModel>, propertyId);
                                break;
                            case BindingMode.TwoWay:
                                ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty as IViewModelPropertyTwoWayBinding<ViewModel>, propertyId);
                                break;
                            default:
                                console.warn(`Invalid bindingMode (${bindableProperty.bindingMode}) for Binding Property associated with id: ${propertyId}`);
                                break;
                        }
                        break;
                    default:
                        console.error(`Invalid bindingOperationType: ${bindingOperationType}`);
                        break;
                }

            } catch (e) {
                console.log(e);
            }
        }

        private processBindablePropertySingle(bP: IViewModelPropertyBase<ViewModel>) {
            const bindablePropertyId: string = bP.id as string;
            try {
                // Store and attach bindable properties that do not have a OneTime bindingMode.
                // Note that OneTime bindingMode properties are not stored.
                if (bP.bindingMode !== BindingMode.OneTime) {
                    bP.viewModelRef = this;
                    this.idToBindableProperty[bindablePropertyId] = bP;
                }

                // BindingMode.OneTime is set always
                if ((bP.value !== undefined) || (bP.bindingMode === BindingMode.OneTime)) {
                    ViewModel.setValueForBindableProperty(bP as IViewModelPropertyWritable<ViewModel>, bindablePropertyId);
                } else {
                    ViewModel.retrieveAndSetValueForBindableProperty(bP as IViewModelPropertyReadable<ViewModel>, bindablePropertyId);
                }

                // Attach onChange event handler for TwoWay and OneWayRead properties.
                if (bP.bindingMode === BindingMode.TwoWay ||
                    bP.bindingMode === BindingMode.OneWayRead) {
                    const boundedFunc = (_ev: Event) => {
                        console.info(`Detected change in: ${bindablePropertyId}`);
                        this.handlePropertyChangedEvent(bindablePropertyId, BindingOperationType.Read);

                        if ((bP as IViewModelPropertyReadable<ViewModel>).onChangeFunc != null) {
                            ((bP as IViewModelPropertyReadable<ViewModel>).onChangeFunc as ((vm: ViewModel) => void))(bP.viewModelRef as ViewModel);
                        } else if (typeof (bP.viewModelRef as any).onChange === "function") {
                            (bP.viewModelRef as any).onChange(bindablePropertyId);
                        } else {
                            console.error("Failed to provide onChangeFunc (alternatively implement onChange [(htmlId: string) => void] method) for implentation of IViewModelProperty for id: " + bindablePropertyId);
                        }
                    };
                    ((bP.changeEvents == null) ? ViewModel.CHANGE_EVENTS : bP.changeEvents).split(" ").forEach((evString) => {
                        switch (bP.id.constructor) {
                            case String:
                                bP.boundEventFunc = boundedFunc;
                                (document.getElementById(bindablePropertyId) as HTMLElement).addEventListener(evString, (bP as any).boundEventFunc);
                                break;
                            case Array:
                                if (bP.boundEventFuncs == null) {
                                    bP.boundEventFuncs = [];
                                }
                                (bP as any).boundEventFuncs.push(boundedFunc);
                                (document.getElementById(bindablePropertyId) as HTMLElement).addEventListener(evString, (bP as any).boundEventFuncs[((bP as any).boundEventFuncs).length as number - 1]);
                                break;
                            default:
                                // For debugging
                                console.error(`Unacceptable id detected in IViewModelPropertyBase (bindable property displayed below): ${bP.id}`);
                                console.info(bP);
                                break;
                        }
                    });
                }
            } catch (e) {
                console.error(e);
            }
        }

        private genTeardownFunc(self: ViewModel) {
            return () => { self.teardown.call(self); };
        }
    }

    export class ViewModelProperty<T extends ViewModel> implements IViewModelProperty<T> {
        constructor(
            public readonly bindingMode: BindingMode,
            public readonly id: string | string[], // Represents HTML id
            public value?: any, // Represents displayed initial value
            public setDataFunc?: ((a: any) => void),
            public getDataFunc?: (() => any),
            public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            public converterFunc?: ((a: any) => any),
            public viewModelRef?: T,
            public changeEvents?: string
        ) { }
    }

    export class ViewModelPropertyOneTimeBinding<T extends ViewModel> implements IViewModelPropertyOneTimeBinding<T> {
        public readonly bindingMode: BindingMode.OneTime = BindingMode.OneTime as BindingMode.OneTime;
        constructor(
            public readonly id: string | string[], // Represents HTML id
            public value?: any, // Represents displayed initial value
            public setDataFunc?: ((a: any) => void),
            public converterFunc?: ((a: any) => any),
            public viewModelRef?: T,
            public changeEvents?: string
        ) { }
    }

    export class ViewModelPropertyOneWayReadBinding<T extends ViewModel> implements IViewModelPropertyOneWayReadBinding<T> {
        public readonly bindingMode: BindingMode.OneWayRead = BindingMode.OneWayRead as BindingMode.OneWayRead;
        constructor(
            public readonly id: string | string[], // Represents HTML id
            public value?: any, // Represents displayed initial value
            public getDataFunc?: (() => any),
            public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            public viewModelRef?: T,
            public changeEvents?: string
        ) { }
    }

    export class ViewModelPropertyOneWayWriteBinding<T extends ViewModel> implements IViewModelPropertyOneWayWriteBinding<T> {
        public readonly bindingMode: BindingMode.OneWayWrite = BindingMode.OneWayWrite as BindingMode.OneWayWrite;
        constructor(
            public readonly id: string | string[], // Represents HTML id
            public value?: any, // Represents displayed initial value
            public setDataFunc?: ((a: any) => void),
            public converterFunc?: ((a: any) => any),
            public viewModelRef?: T,
            public changeEvents?: string
        ) { }
    }

    export class ViewModelPropertyTwoWayBinding<T extends ViewModel> implements IViewModelPropertyTwoWayBinding<T> {
        public readonly bindingMode: BindingMode.TwoWay = BindingMode.TwoWay as BindingMode.TwoWay;
        constructor(
            public readonly id: string | string[], // Represents HTML id
            public value?: any, // Represents displayed initial value
            public setDataFunc?: ((a: any) => void),
            public getDataFunc?: (() => any),
            public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
            public converterFunc?: ((a: any) => any),
            public viewModelRef?: T,
            public changeEvents?: string
        ) { }
    }
}
