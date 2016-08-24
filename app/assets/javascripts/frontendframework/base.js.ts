/// <reference path="../__jquery.js.ts" />

// Has a dependency on JQuery. Should be loaded after Turbolinks to register
// cleanupFunc on 'turbolinks:before-render' event.
namespace FrontEndFramework {
    export var VERSION = '1.0.0';

    export var adder = function(num: number) {
        return function(val: number) { return val + num; };
    };

    export interface GlobalHandle extends Window {
        stateToClearOnNavigation : any;
    }
}

// Add the script tag below in the header of your page:
// <script> "use strict"; var gHndl = this; var stateToClearOnNavigation = {}; var hooks = { pre: [], post: [] }; </script>
declare var hooks : {
    // Invoked after document is ready (but before MiniHtmlViewModel.readyFunc)
    pre: (() => void)[],

    // Invoked after document is ready (but after MiniHtmlViewModel.readyFunc)
    post: (() => void)[],

    // Experimental: Only makes sense if used with Turbolinks
    pageCleanup?: (() => void)[]
};

declare var gHndl : FrontEndFramework.GlobalHandle;
declare var Turbolinks : any;

namespace FrontEndFramework {
    export const TurbolinksAvailable = ((typeof Turbolinks !== 'undefined') && (Turbolinks != null)) ? true : false;

    export let readyFunc : (() => void) = null;
    export let cleanupHooks : (() => void)[] = [];
    let cleanupFunc = function() {
        // Only do something if Turbolinks is present (in other case, page would be reset anyways)
        if (FrontEndFramework.TurbolinksAvailable) {
            for (let i = 0; i < cleanupHooks.length; i++) {
                try { cleanupHooks[i](); } catch (e) { console.error(e); }
            }
        }
    }
    let clearStateOnNavigationFunc = function() {
        gHndl.stateToClearOnNavigation = {};
    };

    // Visits site using Turbolinks if possible.
    export let visitLink = function(link : string, forceReload = false) {
        if ((!forceReload) &&
            FrontEndFramework.TurbolinksAvailable &&
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

        if ((FrontEndFramework.readyFunc != null) &&
            (typeof(FrontEndFramework.readyFunc) === 'function')) {
            try {
                FrontEndFramework.readyFunc();
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

    if (FrontEndFramework.TurbolinksAvailable) {
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
