import { ObjectLifeCycle } from "./enumerations/object_life_cycle";
import IObjectLifeCycleDeterminable from "./interfaces/i_object_life_cycle_determinable";
export declare namespace MiniHtmlViewModel {
    const VERSION = "0.8.0";
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
        readonly objectLifeCycle: ObjectLifeCycle;
        private static readonly CHANGE_EVENTS;
        private static retrieveAndSetValueForBindableProperty;
        private static setValueForBindableProperty;
        protected idToBindableProperty: {
            [index: string]: IViewModelPropertyBase<ViewModel>;
        };
        protected constructor(objectLifeCycle: ObjectLifeCycle, ...bindableProperties: Array<IViewModelPropertyBase<ViewModel>>);
        teardown(overrideObjectLifeCycle?: boolean): void;
        protected processBindableProperty(bP: IViewModelPropertyBase<ViewModel>): void;
        protected handlePropertyChangedEvent(propertyId: string, bindingOperationType?: BindingOperationType): void;
        private processBindablePropertySingle;
        private genTeardownFunc;
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
