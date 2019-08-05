
// A part of the SPA suppport
export const enum ObjectLifeCycle {
    Transient = 0, // Only for single page, object should automatically be destroyed when navigating from page
    VariablePersistence = 1, // Lifetime is managed manually (should not be automatically destroyed when navigating pages)
    InfinitePersistence = 2 // Not to be destroyed (intended to be persistent across page navigation)
};
