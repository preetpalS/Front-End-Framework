
// This file contains types and internal state used by the framework that individual components
// in the library need knowledge of such as FrontEndFramework.ObjectLifeCycle.

namespace FrontEndFramework {
    // Has a dependency on JQuery. Should be loaded after Turbolinks to register
    // cleanupFunc on 'turbolinks:before-render' event.
    export interface GlobalHandle extends Window {
        Windows?: any;
        Turbolinks?: any;
        $?: any;
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
        InfinitePersistence = 2 // Not to be destroyed (intended to be persistent across page navigation)
    };

    export const HtmlInputChangeEvents = 'change textInput input';

    export interface IObjectLifeCycleDeterminable {
        objectLifeCycle?: FrontEndFramework.ObjectLifeCycle;
    }

    export const enum SupportedIntegration {
        NoFramework = 0,
        Turbolinks = 1,
        WindowsUWP = 2
    };

    export interface SupportedIntegrationMetadata {
        supportedIntegration: SupportedIntegration;
        singlePageApplicationSupport: boolean;
        pagePreCacheEvent?: string|null; // Probably going to be removed
    };
    // TODO: Add support for other SPA frameworks here.
    export const WindowsUwpEnvironment = (typeof gHndl.Windows !== 'undefined') && (gHndl.Windows != null);
    export const TurbolinksAvailable = (typeof gHndl.Turbolinks !== 'undefined') && (gHndl.Turbolinks != null);
    export const SinglePageApplication = TurbolinksAvailable;

    export let RuntimeSupportedIntegration : SupportedIntegration = SupportedIntegration.NoFramework;

    // TODO: Support Turbolinks in Windows UWP Environment
    if (WindowsUwpEnvironment) {
        RuntimeSupportedIntegration = SupportedIntegration.WindowsUWP;
    } else if (TurbolinksAvailable) {
        RuntimeSupportedIntegration = SupportedIntegration.Turbolinks;
    }

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
