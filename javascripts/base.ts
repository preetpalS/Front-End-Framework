
// This file contains types and internal state used by the framework that individual components
// in the library need knowledge of such as FrontEndFramework.ObjectLifeCycle.
import {SupportedIntegration} from "./enumerations/supported_integration";
import IGlobalHandle from "./interfaces/i_global_handle";
import ISupportedIntegrationMetadata from "./interfaces/i_supported_integration_metadata";

// Should be loaded after Turbolinks to register cleanupFunc on 'turbolinks:before-render' event.
export default class Base implements ISupportedIntegrationMetadata {
    public static getInstance(globalHandle: IGlobalHandle = null) {
        if (!Base.instance) {
            if (globalHandle != null) {
                Base.instance = new Base(globalHandle as IGlobalHandle);
            } else {
                throw new Error("Front End Framework base not yet initialized");
            }
        }
        return Base.instance;
    }
    private static instance: Base;
    public readonly WINDOWS_UWP_ENVIRONMENT: boolean;
    public readonly TURBOLINKS_AVAILABLE: boolean;
    public readonly SINGLE_PAGE_APPLICATION_SUPPORT: boolean;
    public readonly SUPPORTED_INTEGRATION: SupportedIntegration;
    public pagePreCacheEvent?: string;
    public readyFunc: (() => void)|null;
    public readonly cleanupHooks: Array<() => void>;
    public readonly preReadyHooks: Array<() => void>;
    public readonly postReadyHooks: Array<() => void>;
    public stateToClearOnNavigation: any = {};
    public readonly hooks: {
        // Invoked after document is ready (but before MiniHtmlViewModel.readyFunc)
        pre: Array<() => void>,

        // Invoked after document is ready (but after MiniHtmlViewModel.readyFunc)
        post: Array<() => void>,

        // Experimental: Only makes sense if used with Turbolinks
        pageCleanup?: Array<() => void>
    };

    private constructor(
        public readonly gHndl: IGlobalHandle
        ) {
            // TODO: Add support for other SPA frameworks here.
            this.WINDOWS_UWP_ENVIRONMENT = (typeof gHndl.Windows !== "undefined") && (gHndl.Windows != null);
            this.TURBOLINKS_AVAILABLE = (typeof gHndl.Turbolinks !== "undefined") && (gHndl.Turbolinks != null);
            this.SINGLE_PAGE_APPLICATION_SUPPORT = this.TURBOLINKS_AVAILABLE;

            let runtimeSupportedIntegration: SupportedIntegration = SupportedIntegration.NoFramework;

            // TODO: Support Turbolinks in Windows UWP Environment
            if (this.WINDOWS_UWP_ENVIRONMENT) {
                runtimeSupportedIntegration = SupportedIntegration.WindowsUWP;
            } else if (this.TURBOLINKS_AVAILABLE) {
                runtimeSupportedIntegration = SupportedIntegration.Turbolinks;
            }
            this.SUPPORTED_INTEGRATION = runtimeSupportedIntegration;

            // TODO: Add support for other SPA frameworks here.
            this.pagePreCacheEvent = this.TURBOLINKS_AVAILABLE ? "turbolinks:before-cache" : null;

            // To be set by user (fired when DOM is ready)
            this.readyFunc = null;

            // For users to supply hooks (lambda functions) that they want to fire on each navigation (note
            // that these arrays are not emptied as executed).
            this.cleanupHooks = [];
            this.preReadyHooks = [];
            this.postReadyHooks = [];

            this.hooks = { pre: [], post: [], pageCleanup: [] };
    }

    public attachOnGlobalHandle(name: string = "FrontEndFramework") {
        this.gHndl[name] = this;
    }
}
