
import Base from "./base";
import { SupportedIntegration } from "./enumerations/supported_integration";

export default class Runtime {
    // Visits site using Turbolinks (or another SPA framework when support is added) if possible.
    // Should always result in opening given link (if given argument for `link` is valid URL).
    public static visitLink(link: string, { forceReload, newTab }: { forceReload?: boolean, newTab?: boolean } = { forceReload: false, newTab: false }) {
        if ((newTab != null) && newTab as boolean) {
            window.open(link, "_blank");
        } else {
            if (Base.getInstance().SINGLE_PAGE_APPLICATION_SUPPORT && !((forceReload != null) && forceReload as boolean)) {
                // TODO: Add support for other SPA frameworks here.
                if ((Base.getInstance().SUPPORTED_INTEGRATION ===
                    SupportedIntegration.Turbolinks) &&
                    (typeof (Base.getInstance().gHndl.Turbolinks.visit) === "function")) {
                    Base.getInstance().gHndl.Turbolinks.visit(link);
                }
            } else {
                window.location.href = link;
            }
        }
    }
    public static getInstance() {
        if (!this.instance) {
            Runtime.instance = new Runtime();
        }
        return Runtime.instance;
    }
    private static instance: Runtime;

    private constructor() {
        if (Base.getInstance().SINGLE_PAGE_APPLICATION_SUPPORT) {
            // TODO: Add support for other SPA frameworks here.
            if (Base.getInstance().SUPPORTED_INTEGRATION === SupportedIntegration.Turbolinks &&
                Base.getInstance().TURBOLINKS_AVAILABLE) {
                document.addEventListener("turbolinks:before-render", this.cleanupFunc);
                if (Base.getInstance().hooks.pageCleanup != null) {
                    document.addEventListener("turbolinks:before-render", () => {
                        // Fire functions in hooks.pageCleanup Array
                        while ((Base.getInstance().hooks.pageCleanup as Array<() => void>).length > 0) {
                            try { ((Base.getInstance().hooks.pageCleanup as Array<() => void>).shift() as (() => void))(); } catch (e) { console.error(e); }
                        }
                    });
                }
                if ((this.clearStateOnNavigationFunc != null) && (typeof (this.clearStateOnNavigationFunc) === "function")) {
                    document.addEventListener("turbolinks:visit", this.clearStateOnNavigationFunc);
                }
            }
        }

        const READY_FUNC = () => {
            // Fire functions in hooks.pre Array
            while (Base.getInstance().hooks.pre.length > 0) {
                try { (Base.getInstance().hooks.pre.shift() as (() => void))(); } catch (e) { console.error(e); }
            }

            try { this.preReadyFunc(); } catch (e) { console.error(e); }

            if ((Base.getInstance().readyFunc != null) &&
                (typeof (Base.getInstance().readyFunc) === "function")) {
                try {
                    (Base.getInstance().readyFunc as (() => void))();
                } catch (e) {
                    console.error(e);
                }
            }

            try { this.postReadyFunc(); } catch (e) { console.error(e); }

            // Fire functions in hooks.post Array
            while (Base.getInstance().hooks.post.length > 0) {
                try { (Base.getInstance().hooks.post.shift() as (() => void))(); } catch (e) { console.error(e); }
            }
        };

        switch (Base.getInstance().SUPPORTED_INTEGRATION) {
            case SupportedIntegration.Turbolinks:
                document.addEventListener("turbolinks:load", READY_FUNC);
                break;
            case SupportedIntegration.NoFramework:
            case SupportedIntegration.WindowsUWP:
            default:
                document.addEventListener("DOMContentLoaded", READY_FUNC);
        }
    }

    public readonly cleanupFunc = () => {
        // Only execute in single page applications (in other case, page would be reset anyways)
        if (Base.getInstance().SINGLE_PAGE_APPLICATION_SUPPORT) {
            for (let i = 0; i < Base.getInstance().cleanupHooks.length; i++) {
                try { Base.getInstance().cleanupHooks[i](); } catch (e) { console.error(e); }
            }
        }
    }
    public readonly preReadyFunc = () => {
        for (let i = 0; i < Base.getInstance().preReadyHooks.length; i++) {
            try { Base.getInstance().preReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    public readonly postReadyFunc = () => {
        for (let i = 0; i < Base.getInstance().postReadyHooks.length; i++) {
            try { Base.getInstance().postReadyHooks[i](); } catch (e) { console.error(e); }
        }
    }
    public readonly clearStateOnNavigationFunc = () => {
        Base.getInstance().stateToClearOnNavigation = {};
    }
}
