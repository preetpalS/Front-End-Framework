
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

declare var gHndl : MiniHtmlViewModel.GlobalHandle;
declare var Turbolinks : any;
