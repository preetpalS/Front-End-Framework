/// <reference path="./base.js.ts" />

// Depends on JQuery
// Depends on ./base.js.ts due to the fact that the future IUserInterfaceElement might rely on cleanupHooks
// for teardown logic.

namespace FrontEndFramework {
    export namespace MiniHtmlViewModel {
        export const VERSION = '0.5.0';

        export const enum BindingMode { OneTime, OneWayRead, OneWayWrite, TwoWay };

        export interface IViewModelPropertyBase<T extends ViewModel> {
            readonly bindingMode: BindingMode;
            readonly id: string|string[]; // Represents HTML id
            value?: any; // Represents displayed initial value
            viewModelRef?: T;
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
            readonly bindingMode:BindingMode.OneWayWrite;
        }

        // Value is read from HTML element on ViewModel construction (unless value provided for IViewModelPropertyBase).
        export interface IViewModelPropertyTwoWayBinding<T extends ViewModel> extends IViewModelProperty<T> {
            readonly bindingMode: BindingMode.TwoWay;
        }

        // Should inherit from this class instead of instantiating it directly.
        export abstract class ViewModel {
            protected idToBindableProperty: { [index: string]: IViewModelPropertyBase<ViewModel> };
            private static readonly ChangeEvents = 'change textInput input';
            protected constructor(...bindableProperties: IViewModelPropertyBase<ViewModel>[]) {
                this.idToBindableProperty = {};
                bindableProperties.forEach(this.processBindableProperty, this);

                if (FrontEndFramework.SinglePageApplication &&
                    (hooks.pageCleanup != null)) {
                    (<(() => void)[]>hooks.pageCleanup).push(this.genTeardownFunc(this));
                }
            }

            protected processBindableProperty(bP: IViewModelPropertyBase<ViewModel>) {
                switch (bP.id.constructor) {
                case String:
                    this.processBindablePropertySingle(bP);
                    break;
                case Array:
                    for (let i = 0; i < bP.id.length; i++) {
                        this.processBindablePropertySingle({
                            id: (<any>bP).id[i],
                            bindingMode: (<any>bP).bindingMode,
                            value: (<any>bP).value,
                            setDataFunc: (<any>bP).setDataFunc,
                            getDataFunc: (<any>bP).getDataFunc,
                            onChangeFunc: (<any>bP).onChangeFunc,
                            converterFunc: (<any>bP).converterFunc,
                            viewModelRef: (<any>bP).viewModelRef
                        } as IViewModelPropertyBase<ViewModel>);
                    }
                    break;
                default:
                    console.error(`Unacceptable id detected in IViewModelPropertyBase: ${bP}`);
                    break;
                }
            }

            private processBindablePropertySingle(bP: IViewModelPropertyBase<ViewModel>) {
                let bindablePropertyId: string = <string>bP.id;
                try {
                    // Store and attach bindable properties that do not have a OneTime bindingMode.
                    // Note that OneTime bindingMode properties are not stored.
                    if (bP.bindingMode !== BindingMode.OneTime) {
                        bP.viewModelRef = this;
                        this.idToBindableProperty[bindablePropertyId] = bP;
                    }

                    // BindingMode.OneTime is set always
                    if ((bP.value !== undefined) || (bP.bindingMode === BindingMode.OneTime)) {
                        ViewModel.setValueForBindableProperty(<IViewModelPropertyWritable<ViewModel>>bP, bindablePropertyId);
                    } else {
                        ViewModel.retrieveAndSetValueForBindableProperty(<IViewModelPropertyReadable<ViewModel>>bP, bindablePropertyId);
                    }

                    // Attach onChange event handler for TwoWay and OneWayRead properties.
                    if (bP.bindingMode === BindingMode.TwoWay ||
                        bP.bindingMode === BindingMode.OneWayRead) {
                        $('#' + bindablePropertyId).on(ViewModel.ChangeEvents, () => {
                            console.info(`Detected change in: ${bindablePropertyId}`);
                            this.handlePropertyChangedEvent(bindablePropertyId);

                            if ((<IViewModelPropertyReadable<ViewModel>>bP).onChangeFunc != null) {
                                (<((vm: ViewModel) => void)>(<IViewModelPropertyReadable<ViewModel>>bP).onChangeFunc)(<ViewModel>bP.viewModelRef);
                            } else if (typeof (<any>bP.viewModelRef).onChange === 'function') {
                                (<any>bP.viewModelRef).onChange(bindablePropertyId);
                            } else {
                                console.error('Failed to provide onChangeFunc (alternatively implement onChange [(htmlId: string) => void] method) for implentation of IViewModelProperty for id: ' + bindablePropertyId);
                            }
                        });
                    }
                } catch(e) {
                    console.error(e);
                }
            }

            // Triggers change in UI to match value of property in idToBindableProperty.
            protected handlePropertyChangedEvent(propertyId: string) {
                try {
                    var bindableProperty = this.idToBindableProperty[propertyId];
                    switch (bindableProperty.bindingMode) {
                    // case BindingMode.OneTime:
                    //     console.error("IMPOSSIBLE");
                    //     break;
                    case BindingMode.OneWayRead:
                        ViewModel.retrieveAndSetValueForBindableProperty(<IViewModelPropertyOneWayReadBinding<ViewModel>>bindableProperty, propertyId);
                        break;
                    case BindingMode.OneWayWrite:
                        ViewModel.setValueForBindableProperty(<IViewModelPropertyOneWayWriteBinding<ViewModel>>bindableProperty, propertyId);
                        break;
                    case BindingMode.TwoWay:
                        ViewModel.setValueForBindableProperty(<IViewModelPropertyTwoWayBinding<ViewModel>>bindableProperty, propertyId);
                        break;
                    default:
                        console.warn(`Invalid bindingMode for Binding Property associated with id: ${propertyId}`);
                        break;
                    }
                } catch (e) {
                    console.log(e);
                }
            }

            private genTeardownFunc(self: ViewModel) {
                return function() {self.teardown.call(self);};
            }

            teardown() {
                Object.keys(this.idToBindableProperty).forEach((id: string) => {
                    console.log(`Cleaning up event handlers set up in ViewModel (id: ${id})`);
                    $('#' + id).off(ViewModel.ChangeEvents);
                }, this);
            }

            private static retrieveAndSetValueForBindableProperty<T extends ViewModel>(bP: IViewModelPropertyReadable<T>, propertyId: string): IViewModelPropertyReadable<T> {
                if (bP.getDataFunc != null) {
                    bP.value = bP.getDataFunc();
                } else {
                    bP.value = (<HTMLInputElement>document.getElementById(propertyId)).value;
                }
                return bP;
            }

            private static setValueForBindableProperty<T extends ViewModel>(bP: IViewModelPropertyWritable<T>, propertyId: string) {
                var cnvrtr = bP.converterFunc || function(x) { return x; };
                if (bP.setDataFunc == null) {
                    $('#' + propertyId).val(cnvrtr(bP.value));
                } else {
                    bP.setDataFunc(cnvrtr(bP.value));
                }
            }
        }

        export class ViewModelProperty<T extends ViewModel> implements IViewModelProperty<T> {
            constructor(
                public readonly bindingMode: BindingMode,
                public readonly id: string|string[], // Represents HTML id
                public value?: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneTimeBinding<T extends ViewModel> implements IViewModelPropertyOneTimeBinding<T> {
            public readonly bindingMode: BindingMode.OneTime = <BindingMode.OneTime>BindingMode.OneTime;
            constructor(
                public readonly id: string|string[], // Represents HTML id
                public value?: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneWayReadBinding<T extends ViewModel> implements IViewModelPropertyOneWayReadBinding<T> {
            public readonly bindingMode: BindingMode.OneWayRead = <BindingMode.OneWayRead>BindingMode.OneWayRead;
            constructor(
                public readonly id: string|string[], // Represents HTML id
                public value?: any, // Represents displayed initial value
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyOneWayWriteBinding<T extends ViewModel> implements IViewModelPropertyOneWayWriteBinding<T> {
            public readonly bindingMode: BindingMode.OneWayWrite = <BindingMode.OneWayWrite>BindingMode.OneWayWrite;
            constructor(
                public readonly id: string|string[], // Represents HTML id
                public value?: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }

        export class ViewModelPropertyTwoWayBinding<T extends ViewModel> implements IViewModelPropertyTwoWayBinding<T> {
            public readonly bindingMode: BindingMode.TwoWay = <BindingMode.TwoWay>BindingMode.TwoWay;
            constructor(
                public readonly id: string|string[], // Represents HTML id
                public value?: any, // Represents displayed initial value
                public setDataFunc?: ((a: any) => void),
                public getDataFunc?: (() => any),
                public onChangeFunc?: ((vm: T) => void), // Either implement onChange on IViewModel OR provide onChangeFunc
                public converterFunc?: ((a: any) => any),
                public viewModelRef?: T
            ) { }
        }
    }
}
