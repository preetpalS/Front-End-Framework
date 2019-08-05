"use strict";
exports.__esModule = true;
// WARNING: Must be included after base.ts
var base_1 = require("./base");
var BodyScriptActivator = /** @class */ (function () {
    function BodyScriptActivator(base) {
        var _this = this;
        this.base = base;
        // OPTIMIZE: Investigate using an alternative data structure.
        this.BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE = {};
        base.preReadyHooks.push(function () {
            try {
                // console.log('before func eval');
                (function () {
                    var activatedActivationIndices = []; // Needed to prevent double usage of activation indices.
                    // console.log('at start of func eval');
                    var activationSections = Array.prototype.slice.call(document.querySelectorAll(BodyScriptActivator.BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR));
                    // console.log('after querySelectorAll invocation');
                    for (var i = 0; i < activationSections.length; i++) {
                        var activationSection = activationSections[i];
                        // console.log(activationSection);
                        if (activationSection != null) {
                            var activationIndex = activationSection.dataset[BodyScriptActivator.BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY];
                            if (activatedActivationIndices.indexOf(activationIndex) === -1) {
                                activatedActivationIndices.push(activationIndex);
                                try {
                                    // console.log(activationIndex);
                                    _this.BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE[activationIndex](activationSection);
                                }
                                catch (error) {
                                    console.log(error);
                                    console.error("Failed to successfully execute lookup value func for activation index: " + activationIndex);
                                }
                                // console.log(`after body script invocation (activationIndex: ${activationIndex})`);
                            }
                            else {
                                console.error("Refusing to re-activate activationIndex: " + activationIndex);
                            }
                        }
                    }
                    // console.log('at end of func eval');
                })();
                // console.log('after func eval');
            }
            catch (error) {
                console.error(error);
                console.error("Failed to execute body script evaluation logic");
            }
        });
    }
    BodyScriptActivator.getIntance = function () {
        if (!BodyScriptActivator.instance) {
            this.instance = new BodyScriptActivator(base_1["default"].getInstance());
        }
        return this.instance;
    };
    BodyScriptActivator.prototype.AddEntryToLookupTable = function (key, value) {
        this.BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE[key] = value;
    };
    BodyScriptActivator.VERSION = "0.2.0";
    BodyScriptActivator.BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR = ".front_end_framework-body_script_activator";
    BodyScriptActivator.BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY = "activationIndex";
    return BodyScriptActivator;
}());
