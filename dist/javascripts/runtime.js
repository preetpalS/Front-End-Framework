"use strict";
exports.__esModule = true;
var base_1 = require("./base");
var Runtime;
(function (Runtime) {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    Runtime.visitLink = function (link, _a) {
        var _b = _a === void 0 ? { forceReload: false, newTab: false } : _a, forceReload = _b.forceReload, newTab = _b.newTab;
        if ((newTab != null) && newTab) {
            window.open(link, "_blank");
        }
        else {
            if (base_1["default"].getInstance().SINGLE_PAGE_APPLICATION_SUPPORT && !((forceReload != null) && forceReload)) {
                // TODO: Add support for other SPA frameworks here.
                if ((base_1["default"].getInstance().SUPPORTED_INTEGRATION ===
                    1 /* Turbolinks */) &&
                    (typeof (base_1["default"].getInstance().gHndl.Turbolinks.visit) === "function")) {
                    base_1["default"].getInstance().gHndl.Turbolinks.visit(link);
                }
            }
            else {
                window.location.href = link;
            }
        }
    };
    var cleanupFunc = function () {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (base_1["default"].getInstance().SINGLE_PAGE_APPLICATION_SUPPORT) {
            for (var i = 0; i < base_1["default"].getInstance().cleanupHooks.length; i++) {
                try {
                    base_1["default"].getInstance().cleanupHooks[i]();
                }
                catch (e) {
                    console.error(e);
                }
            }
        }
    };
    var preReadyFunc = function () {
        for (var i = 0; i < base_1["default"].getInstance().preReadyHooks.length; i++) {
            try {
                base_1["default"].getInstance().preReadyHooks[i]();
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    var postReadyFunc = function () {
        for (var i = 0; i < base_1["default"].getInstance().postReadyHooks.length; i++) {
            try {
                base_1["default"].getInstance().postReadyHooks[i]();
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    var clearStateOnNavigationFunc = function () {
        base_1["default"].getInstance().stateToClearOnNavigation = {};
    };
    var READY_FUNC = function () {
        // Fire functions in hooks.pre Array
        while (base_1["default"].getInstance().hooks.pre.length > 0) {
            try {
                base_1["default"].getInstance().hooks.pre.shift()();
            }
            catch (e) {
                console.error(e);
            }
        }
        try {
            preReadyFunc();
        }
        catch (e) {
            console.error(e);
        }
        if ((base_1["default"].getInstance().readyFunc != null) &&
            (typeof (base_1["default"].getInstance().readyFunc) === "function")) {
            try {
                base_1["default"].getInstance().readyFunc();
            }
            catch (e) {
                console.error(e);
            }
        }
        try {
            postReadyFunc();
        }
        catch (e) {
            console.error(e);
        }
        // Fire functions in hooks.post Array
        while (base_1["default"].getInstance().hooks.post.length > 0) {
            try {
                base_1["default"].getInstance().hooks.post.shift()();
            }
            catch (e) {
                console.error(e);
            }
        }
    };
    switch (base_1["default"].getInstance().SUPPORTED_INTEGRATION) {
        case 1 /* Turbolinks */:
            document.addEventListener("turbolinks:load", READY_FUNC);
            break;
        case 0 /* NoFramework */:
        case 2 /* WindowsUWP */:
        default:
            document.addEventListener("DOMContentLoaded", READY_FUNC);
    }
    if (base_1["default"].getInstance().SINGLE_PAGE_APPLICATION_SUPPORT) {
        // TODO: Add support for other SPA frameworks here.
        if (base_1["default"].getInstance().SUPPORTED_INTEGRATION === 1 /* Turbolinks */ &&
            base_1["default"].getInstance().TURBOLINKS_AVAILABLE) {
            document.addEventListener("turbolinks:before-render", cleanupFunc);
            if (base_1["default"].getInstance().hooks.pageCleanup != null) {
                document.addEventListener("turbolinks:before-render", function () {
                    // Fire functions in hooks.pageCleanup Array
                    while (base_1["default"].getInstance().hooks.pageCleanup.length > 0) {
                        try {
                            base_1["default"].getInstance().hooks.pageCleanup.shift()();
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                });
            }
            if ((clearStateOnNavigationFunc != null) && (typeof (clearStateOnNavigationFunc) === "function")) {
                document.addEventListener("turbolinks:visit", clearStateOnNavigationFunc);
            }
        }
    }
})(Runtime = exports.Runtime || (exports.Runtime = {}));
