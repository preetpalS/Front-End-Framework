export default class Runtime {
    static visitLink(link: string, { forceReload, newTab }?: {
        forceReload?: boolean;
        newTab?: boolean;
    }): void;
    static getInstance(): Runtime;
    private static instance;
    private constructor();
    readonly cleanupFunc: () => void;
    readonly preReadyFunc: () => void;
    readonly postReadyFunc: () => void;
    readonly clearStateOnNavigationFunc: () => void;
}
