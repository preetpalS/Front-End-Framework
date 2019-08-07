export default class BodyScriptActivator {
    private base;
    static BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR: string;
    static BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY: string;
    static getInstance(): BodyScriptActivator;
    private static instance;
    private readonly BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE;
    private constructor();
    AddEntryToLookupTable(key: string, value: ((activationHtmlElement: HTMLElement) => void)): void;
}
