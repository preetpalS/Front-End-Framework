/// <reference path="./base.js.ts" />

// Depends on JQuery
// Depends on ./base.js.ts due to the fact that the future IUserInterfaceElement might rely on cleanupHooks
// for teardown logic.

namespace FrontEndFramework {
    export namespace MiniHtmlViewModel {
        export const VERSION = '0.3.1';

        export const enum BindingMode { OneTime, OneWayRead, OneWayWrite, TwoWay };

        export interface IUserInterfaceElement {
            // Setup of event handlers should really be taken of in construction of User Interface Element
            // setupEventHandlers?: (() => void);

            teardownEventHandlers: (() => void); // Needed for clean interaction with certain frameworks that do not clear DOM on navigation

            // Unsure about how this would be used, like for instance in ViewModel class
            //invokeChange: ((data?: any]) => void);
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
        export abstract class ViewModel implements IViewModel, IUserInterfaceElement {
            idToBindableProperty: { [index: string]: IViewModelProperty<ViewModel> };
            readonly events = 'change textInput input';
            constructor(...bindableProperties: IViewModelProperty<ViewModel>[]) {
                this.idToBindableProperty = {};
                bindableProperties.forEach(this.processBindableProperty, this);

                if (FrontEndFramework.SinglePageApplication &&
                    (hooks.pageCleanup != null)) {
                    (<(() => void)[]>hooks.pageCleanup).push(this.teardownEventHandlers);
                }
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
                        $('#' + bP.id).on(this.events, function() {
                            console.info('Detected change in: ' + bP.id);
                            retrieveAndSetValueForBindableProperty(bP);

                            if (bP.onChangeFunc != null) {
                                bP.onChangeFunc(<ViewModel>bP.viewModelRef);
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

            teardownEventHandlers() {
                Object.keys(this.idToBindableProperty).forEach((id: string) => {
                    console.log(`Cleaning up event handlers set up in ViewModel (id: ${id})`);
                    $('#' + id).off(this.events);
                }, this);
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
    }
}
