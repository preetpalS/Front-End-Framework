"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This file contains types and internal state used by the framework that individual components
// in the library need knowledge of such as FrontEndFramework.ObjectLifeCycle.
var supported_integration_1 = require("./enumerations/supported_integration");
// Should be loaded after Turbolinks to register cleanupFunc on 'turbolinks:before-render' event.
var Base = /** @class */ (function () {
    function Base(gHndl) {
        this.gHndl = gHndl;
        this.stateToClearOnNavigation = {};
        // TODO: Add support for other SPA frameworks here.
        this.WINDOWS_UWP_ENVIRONMENT = (typeof gHndl.Windows !== "undefined") && (gHndl.Windows != null);
        this.TURBOLINKS_AVAILABLE = (typeof gHndl.Turbolinks !== "undefined") && (gHndl.Turbolinks != null);
        this.SINGLE_PAGE_APPLICATION_SUPPORT = this.TURBOLINKS_AVAILABLE;
        var runtimeSupportedIntegration = supported_integration_1.SupportedIntegration.NoFramework;
        // TODO: Support Turbolinks in Windows UWP Environment
        if (this.WINDOWS_UWP_ENVIRONMENT) {
            runtimeSupportedIntegration = supported_integration_1.SupportedIntegration.WindowsUWP;
        }
        else if (this.TURBOLINKS_AVAILABLE) {
            runtimeSupportedIntegration = supported_integration_1.SupportedIntegration.Turbolinks;
        }
        this.SUPPORTED_INTEGRATION = runtimeSupportedIntegration;
        // TODO: Add support for other SPA frameworks here.
        this.pagePreCacheEvent = this.TURBOLINKS_AVAILABLE ? "turbolinks:before-cache" : undefined;
        // To be set by user (fired when DOM is ready)
        this.readyFunc = null;
        // For users to supply hooks (lambda functions) that they want to fire on each navigation (note
        // that these arrays are not emptied as executed).
        this.cleanupHooks = [];
        this.preReadyHooks = [];
        this.postReadyHooks = [];
        this.hooks = { pre: [], post: [], pageCleanup: [] };
    }
    Base.getInstance = function (globalHandle) {
        if (!Base.instance) {
            if (globalHandle != null) {
                Base.instance = new Base(globalHandle);
            }
            else {
                throw new Error("Front End Framework base not yet initialized");
            }
        }
        return Base.instance;
    };
    Base.prototype.attachOnGlobalHandle = function (name) {
        if (name === void 0) { name = "FrontEndFramework"; }
        this.gHndl[name] = this;
    };
    return Base;
}());
exports.default = Base;
//# sourceMappingURL=base.js.map