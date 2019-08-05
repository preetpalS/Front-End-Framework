import { SupportedIntegration } from "../enumerations/supported_integration";
export default interface ISupportedIntegrationMetadata {
    SUPPORTED_INTEGRATION: SupportedIntegration;
    SINGLE_PAGE_APPLICATION_SUPPORT: boolean;
    pagePreCacheEvent?: string | null;
}
