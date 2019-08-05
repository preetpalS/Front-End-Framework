import { SupportedIntegration } from "./enumerations/supported_integration";
import IGlobalHandle from "./interfaces/i_global_handle";
import ISupportedIntegrationMetadata from "./interfaces/i_supported_integration_metadata";
export default class Base implements ISupportedIntegrationMetadata {
    readonly gHndl: IGlobalHandle;
    static getInstance(globalHandle?: IGlobalHandle): Base;
    private static instance;
    readonly WINDOWS_UWP_ENVIRONMENT: boolean;
    readonly TURBOLINKS_AVAILABLE: boolean;
    readonly SINGLE_PAGE_APPLICATION_SUPPORT: boolean;
    readonly SUPPORTED_INTEGRATION: SupportedIntegration;
    pagePreCacheEvent?: string;
    readyFunc: (() => void) | null;
    readonly cleanupHooks: Array<() => void>;
    readonly preReadyHooks: Array<() => void>;
    readonly postReadyHooks: Array<() => void>;
    stateToClearOnNavigation: any;
    readonly hooks: {
        pre: Array<() => void>;
        post: Array<() => void>;
        pageCleanup?: Array<() => void>;
    };
    private constructor();
    attachOnGlobalHandle(name?: string): void;
}
