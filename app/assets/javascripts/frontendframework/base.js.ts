/// <reference path="../__jquery.d.ts" />

// This file contains types and internal state used by the framework that individual components
// in the library need knowledge of such as FrontEndFramework.ObjectLifeCycle.

declare var Turbolinks : any;

namespace FrontEndFramework {
    // Has a dependency on JQuery. Should be loaded after Turbolinks to register
    // cleanupFunc on 'turbolinks:before-render' event.
    export interface GlobalHandle extends Window {
    }

    // Add the script tag below in the header of your page:
    // <script> "use strict"; var gHndl = this; var stateToClearOnNavigation = {}; var hooks = { pre: [], post: [], pageCleanup: [] }; </script>
    export declare var hooks : {
        // Invoked after document is ready (but before MiniHtmlViewModel.readyFunc)
        pre: (() => void)[],

        // Invoked after document is ready (but after MiniHtmlViewModel.readyFunc)
        post: (() => void)[],

        // Experimental: Only makes sense if used with Turbolinks
        pageCleanup?: (() => void)[]
    };

    export let gHndl : GlobalHandle = window;
    export declare var stateToClearOnNavigation : any;

    // A part of the SPA suppport
    export const enum ObjectLifeCycle {
        Transient = 0, // Only for single page, object should automatically be destroyed when navigating from page
        VariablePersistence = 1, // Lifetime is managed manually (should not be automatically destroyed when navigating pages)
        InfinitePersistence = 2 // Not to be destroyed (intended to be persistent across infinite page navigations)
    };

    export const HtmlInputChangeEvents = 'change textInput input';

    export interface IObjectLifeCycleDeterminable {
        objectLifeCycle?: FrontEndFramework.ObjectLifeCycle;
    }

    // TODO: Add support for other SPA frameworks here.
    export const TurbolinksAvailable = ((typeof Turbolinks !== 'undefined') && (Turbolinks != null)) ? true : false;
    export const SinglePageApplication = TurbolinksAvailable;

    // TODO: Add support for other SPA frameworks here.
    export let PagePreCacheEvent: string|null = TurbolinksAvailable ? 'turbolinks:before-cache' : null;

    // To be set by user (fired when DOM is ready)
    export let readyFunc : (() => void)|null = null;

    // For users to supply hooks (lambda functions) that they want to fire on each navigation (note
    // that these arrays are not emptied as executed).
    export let cleanupHooks : (() => void)[] = [];
    export let preReadyHooks : (() => void)[] = [];
    export let postReadyHooks : (() => void)[] = [];
}
