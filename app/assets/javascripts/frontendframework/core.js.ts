/// <reference path="./base.js.ts"/>

namespace FrontEndFramework {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    export let visitLink = function(link : string, {forceReload, newTab}: {forceReload?: boolean, newTab?: boolean} = {forceReload: false, newTab: false}) {
        if ((newTab != null) && <boolean>newTab) {
            window.open(link, "_blank");
        } else {
            if (FrontEndFramework.SinglePageApplication && !((forceReload != null) && <boolean>forceReload)) {
                // TODO: Add support for other SPA frameworks here.
                if (FrontEndFramework.TurbolinksAvailable &&
                    (typeof(Turbolinks.visit) === 'function')) {
                    Turbolinks.visit(link);
                }
            } else {
                window.location.href = link;
            }
        }
    };

    let cleanupFunc = () => {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (FrontEndFramework.SinglePageApplication) {
            for (let i = 0; i < cleanupHooks.length; i++) {
                try { cleanupHooks[i](); } catch (e) { console.error(e); }
            }
        }
    }
    let preReadyFunc = () => {
        for (let i = 0; i < preReadyHooks.length; i++) {
            try { preReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    let postReadyFunc = () => {
        for (let i = 0; i < postReadyHooks.length; i++) {
            try { postReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    let clearStateOnNavigationFunc = function() {
        FrontEndFramework.stateToClearOnNavigation = {};
    };

    $(document).ready(function() {
        // Fire functions in hooks.pre Array
        while (hooks.pre.length > 0) {
            try { (<(() => void)>hooks.pre.shift())(); }
            catch(e) { console.error(e); }
        };

        try { preReadyFunc(); }
        catch(e) { console.error(e); }

        if ((FrontEndFramework.readyFunc != null) &&
            (typeof(FrontEndFramework.readyFunc) === 'function')) {
            try {
                FrontEndFramework.readyFunc();
            } catch (e) {
                console.error(e);
            }
        }

        try { postReadyFunc(); }
        catch(e) { console.error(e); }

        // Fire functions in hooks.post Array
        while (hooks.post.length > 0) {
            try { (<(() => void)>hooks.post.shift())(); }
            catch(e) { console.error(e); }
        };
    });

    if (FrontEndFramework.SinglePageApplication) {
        // TODO: Add support for other SPA frameworks here.
        if (FrontEndFramework.TurbolinksAvailable) {
            document.addEventListener('turbolinks:before-render', cleanupFunc);
            if (hooks.pageCleanup != null)
                document.addEventListener('turbolinks:before-render', function() {
                    // Fire functions in hooks.pageCleanup Array
                    while ((<(() => void)[]>hooks.pageCleanup).length > 0) {
                        try { (<(() => void)>(<(() => void)[]>hooks.pageCleanup).shift())(); }
                        catch(e) { console.error(e); }
                    };
                });
            if ((clearStateOnNavigationFunc != null) && (typeof(clearStateOnNavigationFunc) === 'function'))
                document.addEventListener('turbolinks:visit', clearStateOnNavigationFunc);
        }
    }
}
