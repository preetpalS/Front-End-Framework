"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiniHtmlViewModel = void 0;
var base_1 = require("./base");
var html_input_change_events_1 = require("./constants/html_input_change_events");
var object_life_cycle_1 = require("./enumerations/object_life_cycle");
var MiniHtmlViewModel;
(function (MiniHtmlViewModel) {
    var BindingMode;
    (function (BindingMode) {
        BindingMode[BindingMode["OneTime"] = 0] = "OneTime";
        BindingMode[BindingMode["OneWayRead"] = 1] = "OneWayRead";
        BindingMode[BindingMode["OneWayWrite"] = 2] = "OneWayWrite";
        BindingMode[BindingMode["TwoWay"] = 3] = "TwoWay";
    })(BindingMode = MiniHtmlViewModel.BindingMode || (MiniHtmlViewModel.BindingMode = {}));
    var BindingOperationType;
    (function (BindingOperationType) {
        BindingOperationType[BindingOperationType["Read"] = 0] = "Read";
        BindingOperationType[BindingOperationType["Write"] = 1] = "Write";
    })(BindingOperationType = MiniHtmlViewModel.BindingOperationType || (MiniHtmlViewModel.BindingOperationType = {}));
    // Should inherit from this class instead of instantiating it directly.
    var ViewModel = /** @class */ (function () {
        function ViewModel(objectLifeCycle) {
            var bindableProperties = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                bindableProperties[_i - 1] = arguments[_i];
            }
            this.objectLifeCycle = objectLifeCycle;
            this.idToBindableProperty = {};
            bindableProperties.forEach(this.processBindableProperty, this);
            if (this.objectLifeCycle === object_life_cycle_1.ObjectLifeCycle.Transient &&
                base_1.default.getInstance().SINGLE_PAGE_APPLICATION_SUPPORT &&
                (base_1.default.getInstance().hooks.pageCleanup != null)) {
                base_1.default.getInstance().hooks.pageCleanup.push(this.genTeardownFunc(this));
            }
        }
        ViewModel.retrieveAndSetValueForBindableProperty = function (bP, propertyId) {
            if (bP.getDataFunc != null) {
                bP.value = bP.getDataFunc();
            }
            else {
                bP.value = document.getElementById(propertyId).value;
            }
            return bP;
        };
        ViewModel.setValueForBindableProperty = function (bP, propertyId) {
            var cnvrtr = bP.converterFunc || (function (x) { return x; });
            var valueToSet = cnvrtr(bP.value);
            if (bP.setDataFunc == null) {
                if (typeof base_1.default.getInstance().gHndl.$ === "undefined") {
                    // Replaces: $('#' + propertyId).val(bP.value);
                    document.getElementById(propertyId).value = valueToSet;
                }
                else {
                    base_1.default.getInstance().gHndl.$("#" + propertyId).val(valueToSet);
                }
            }
            else {
                bP.setDataFunc(valueToSet);
            }
        };
        ViewModel.prototype.teardown = function (overrideObjectLifeCycle) {
            var _this = this;
            if (overrideObjectLifeCycle === void 0) { overrideObjectLifeCycle = false; }
            if (this.objectLifeCycle === object_life_cycle_1.ObjectLifeCycle.InfinitePersistence &&
                !overrideObjectLifeCycle) {
                console.error("Failed to teardown FrontEndFramework.MiniHtmlViewModel.ViewModel instance due to objectLifeCycle not being overridden");
                return;
            }
            Object.keys(this.idToBindableProperty).forEach(function (id) {
                console.log("Cleaning up event handlers set up in ViewModel (id: ".concat(id, ")"));
                var bP = _this.idToBindableProperty[id];
                switch (bP.id.constructor) {
                    case String:
                        if (bP.boundEventFunc != null) {
                            ViewModel.CHANGE_EVENTS.split(" ").forEach(function (evString) {
                                if (document.getElementById(id) != null) {
                                    document.getElementById(id).removeEventListener(evString, bP.boundEventFunc);
                                }
                            });
                        }
                        break;
                    case Array:
                        if ((bP.boundEventFuncs != null) &&
                            (bP.boundEventFuncs.constructor === Array) &&
                            (bP.boundEventFuncs.length === bP.id.length)) {
                            var idx_1 = bP.id.indexOf(id);
                            if (idx_1 !== -1) {
                                ViewModel.CHANGE_EVENTS.split(" ").forEach(function (evString) {
                                    if (document.getElementById(id) != null) {
                                        document.getElementById(id).removeEventListener(evString, bP.boundEventFuncs[idx_1]);
                                    }
                                });
                            }
                            else {
                                console.error("Internal invariant violated (guid: Dtsa43252xxq)");
                            }
                        }
                        else {
                            console.error("Internal invariant violated (guid: pta423taDTD)");
                        }
                        break;
                    default:
                        console.error("Unacceptable id detected in IViewModelPropertyBase: ".concat(bP));
                        break;
                }
            }, this);
        };
        ViewModel.prototype.processBindableProperty = function (bP) {
            switch (bP.id.constructor) {
                case String:
                    this.processBindablePropertySingle(bP);
                    break;
                case Array:
                    for (var i = 0; i < bP.id.length; i++) {
                        this.processBindablePropertySingle({
                            bindingMode: bP.bindingMode,
                            changeEvents: bP.changeEvents,
                            converterFunc: bP.converterFunc,
                            getDataFunc: bP.getDataFunc,
                            id: bP.id[i],
                            onChangeFunc: bP.onChangeFunc,
                            setDataFunc: bP.setDataFunc,
                            value: bP.value,
                            viewModelRef: bP.viewModelRef,
                        });
                    }
                    break;
                default:
                    console.error("Unacceptable id detected in IViewModelPropertyBase: ".concat(bP));
                    break;
            }
        };
        // Triggers change in UI to match value of property in idToBindableProperty.
        ViewModel.prototype.handlePropertyChangedEvent = function (propertyId, bindingOperationType) {
            if (bindingOperationType === void 0) { bindingOperationType = BindingOperationType.Write; }
            try {
                var bindableProperty = this.idToBindableProperty[propertyId];
                switch (bindingOperationType) {
                    case BindingOperationType.Write:
                        switch (bindableProperty.bindingMode) {
                            case BindingMode.OneTime:
                            case BindingMode.OneWayRead:
                                console.warn("NOOP");
                                break;
                            case BindingMode.OneWayWrite:
                                ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                                break;
                            case BindingMode.TwoWay:
                                ViewModel.setValueForBindableProperty(bindableProperty, propertyId);
                                break;
                            default:
                                console.warn("Invalid bindingMode (".concat(bindableProperty.bindingMode, ") for Binding Property associated with id: ").concat(propertyId));
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
                                ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty, propertyId);
                                break;
                            case BindingMode.TwoWay:
                                ViewModel.retrieveAndSetValueForBindableProperty(bindableProperty, propertyId);
                                break;
                            default:
                                console.warn("Invalid bindingMode (".concat(bindableProperty.bindingMode, ") for Binding Property associated with id: ").concat(propertyId));
                                break;
                        }
                        break;
                    default:
                        console.error("Invalid bindingOperationType: ".concat(bindingOperationType));
                        break;
                }
            }
            catch (e) {
                console.log(e);
            }
        };
        ViewModel.prototype.processBindablePropertySingle = function (bP) {
            var _this = this;
            var bindablePropertyId = bP.id;
            try {
                // Store and attach bindable properties that do not have a OneTime bindingMode.
                // Note that OneTime bindingMode properties are not stored.
                if (bP.bindingMode !== BindingMode.OneTime) {
                    bP.viewModelRef = this;
                    this.idToBindableProperty[bindablePropertyId] = bP;
                }
                // BindingMode.OneTime is set always
                if ((bP.value !== undefined) || (bP.bindingMode === BindingMode.OneTime)) {
                    ViewModel.setValueForBindableProperty(bP, bindablePropertyId);
                }
                else {
                    ViewModel.retrieveAndSetValueForBindableProperty(bP, bindablePropertyId);
                }
                // Attach onChange event handler for TwoWay and OneWayRead properties.
                if (bP.bindingMode === BindingMode.TwoWay ||
                    bP.bindingMode === BindingMode.OneWayRead) {
                    var boundedFunc_1 = function (_ev) {
                        console.info("Detected change in: ".concat(bindablePropertyId));
                        _this.handlePropertyChangedEvent(bindablePropertyId, BindingOperationType.Read);
                        if (bP.onChangeFunc != null) {
                            bP.onChangeFunc(bP.viewModelRef);
                        }
                        else if (typeof bP.viewModelRef.onChange === "function") {
                            bP.viewModelRef.onChange(bindablePropertyId);
                        }
                        else {
                            console.error("Failed to provide onChangeFunc (alternatively implement onChange [(htmlId: string) => void] method) for implentation of IViewModelProperty for id: " + bindablePropertyId);
                        }
                    };
                    ((bP.changeEvents == null) ? ViewModel.CHANGE_EVENTS : bP.changeEvents).split(" ").forEach(function (evString) {
                        switch (bP.id.constructor) {
                            case String:
                                bP.boundEventFunc = boundedFunc_1;
                                document.getElementById(bindablePropertyId).addEventListener(evString, bP.boundEventFunc);
                                break;
                            case Array:
                                if (bP.boundEventFuncs == null) {
                                    bP.boundEventFuncs = [];
                                }
                                bP.boundEventFuncs.push(boundedFunc_1);
                                document.getElementById(bindablePropertyId).addEventListener(evString, bP.boundEventFuncs[(bP.boundEventFuncs).length - 1]);
                                break;
                            default:
                                // For debugging
                                console.error("Unacceptable id detected in IViewModelPropertyBase (bindable property displayed below): ".concat(bP.id));
                                console.info(bP);
                                break;
                        }
                    });
                }
            }
            catch (e) {
                console.error(e);
            }
        };
        ViewModel.prototype.genTeardownFunc = function (self) {
            return function () { self.teardown.call(self); };
        };
        ViewModel.CHANGE_EVENTS = html_input_change_events_1.default;
        return ViewModel;
    }());
    MiniHtmlViewModel.ViewModel = ViewModel;
    var ViewModelProperty = /** @class */ (function () {
        function ViewModelProperty(bindingMode, id, // Represents HTML id
        value, // Represents displayed initial value
        setDataFunc, getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
        converterFunc, viewModelRef, changeEvents) {
            this.bindingMode = bindingMode;
            this.id = id;
            this.value = value;
            this.setDataFunc = setDataFunc;
            this.getDataFunc = getDataFunc;
            this.onChangeFunc = onChangeFunc;
            this.converterFunc = converterFunc;
            this.viewModelRef = viewModelRef;
            this.changeEvents = changeEvents;
        }
        return ViewModelProperty;
    }());
    MiniHtmlViewModel.ViewModelProperty = ViewModelProperty;
    var ViewModelPropertyOneTimeBinding = /** @class */ (function () {
        function ViewModelPropertyOneTimeBinding(id, // Represents HTML id
        value, // Represents displayed initial value
        setDataFunc, converterFunc, viewModelRef, changeEvents) {
            this.id = id;
            this.value = value;
            this.setDataFunc = setDataFunc;
            this.converterFunc = converterFunc;
            this.viewModelRef = viewModelRef;
            this.changeEvents = changeEvents;
            this.bindingMode = BindingMode.OneTime;
        }
        return ViewModelPropertyOneTimeBinding;
    }());
    MiniHtmlViewModel.ViewModelPropertyOneTimeBinding = ViewModelPropertyOneTimeBinding;
    var ViewModelPropertyOneWayReadBinding = /** @class */ (function () {
        function ViewModelPropertyOneWayReadBinding(id, // Represents HTML id
        value, // Represents displayed initial value
        getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
        viewModelRef, changeEvents) {
            this.id = id;
            this.value = value;
            this.getDataFunc = getDataFunc;
            this.onChangeFunc = onChangeFunc;
            this.viewModelRef = viewModelRef;
            this.changeEvents = changeEvents;
            this.bindingMode = BindingMode.OneWayRead;
        }
        return ViewModelPropertyOneWayReadBinding;
    }());
    MiniHtmlViewModel.ViewModelPropertyOneWayReadBinding = ViewModelPropertyOneWayReadBinding;
    var ViewModelPropertyOneWayWriteBinding = /** @class */ (function () {
        function ViewModelPropertyOneWayWriteBinding(id, // Represents HTML id
        value, // Represents displayed initial value
        setDataFunc, converterFunc, viewModelRef, changeEvents) {
            this.id = id;
            this.value = value;
            this.setDataFunc = setDataFunc;
            this.converterFunc = converterFunc;
            this.viewModelRef = viewModelRef;
            this.changeEvents = changeEvents;
            this.bindingMode = BindingMode.OneWayWrite;
        }
        return ViewModelPropertyOneWayWriteBinding;
    }());
    MiniHtmlViewModel.ViewModelPropertyOneWayWriteBinding = ViewModelPropertyOneWayWriteBinding;
    var ViewModelPropertyTwoWayBinding = /** @class */ (function () {
        function ViewModelPropertyTwoWayBinding(id, // Represents HTML id
        value, // Represents displayed initial value
        setDataFunc, getDataFunc, onChangeFunc, // Either implement onChange on IViewModel OR provide onChangeFunc
        converterFunc, viewModelRef, changeEvents) {
            this.id = id;
            this.value = value;
            this.setDataFunc = setDataFunc;
            this.getDataFunc = getDataFunc;
            this.onChangeFunc = onChangeFunc;
            this.converterFunc = converterFunc;
            this.viewModelRef = viewModelRef;
            this.changeEvents = changeEvents;
            this.bindingMode = BindingMode.TwoWay;
        }
        return ViewModelPropertyTwoWayBinding;
    }());
    MiniHtmlViewModel.ViewModelPropertyTwoWayBinding = ViewModelPropertyTwoWayBinding;
})(MiniHtmlViewModel = exports.MiniHtmlViewModel || (exports.MiniHtmlViewModel = {}));
//# sourceMappingURL=mini_html_view_model.js.map