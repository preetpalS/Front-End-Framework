/// <reference path="./base.ts"/>

// WARNING: Must be included after base.ts

// Use strict mode
// tslint:disable-next-line:no-unused-expression
"use strict";

namespace FrontEndFramework {
    export namespace BodyScriptActivation {
        export const VERSION = '0.1.0';

        export const BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR = ".front_end_framework-body_script_activator";
        export const BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY = "activationIndex";

        // OPTIMIZE: Investigate using an alternative data structure.
        const BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE = {};

        export const AddEntryToLookupTable = (key: string, value: ((activationHtmlElement: HTMLElement) => void)) => {
            BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE[key] = value;
        }

        preReadyHooks.push(() => {
            try {
                // console.log('before func eval');
                (() => {
                    const activatedActivationIndices = [] as string[]; // Needed to prevent double usage of activation indices.
                    // console.log('at start of func eval');
                    const activationSections = Array.prototype.slice.call(
                        document.querySelectorAll(BODY_SCRIPT_ACTIVATION_SECTION_SELECTOR)
                    );
                    // console.log('after querySelectorAll invocation');

                    for (let i = 0; i < activationSections.length; i++) {
                        const activationSection = activationSections[i] as HTMLElement;
                        // console.log(activationSection);
                        if (activationSection != null) {
                            const activationIndex = activationSection.dataset[BODY_SCRIPT_ACTIVATION_SECTION_DATASET_ACTIVATION_INDEX_KEY] as string;

                            if (activatedActivationIndices.indexOf(activationIndex) === -1) {
                                activatedActivationIndices.push(activationIndex);

                                try {
                                    // console.log(activationIndex);
                                    (BODY_SCRIPT_ACTIVATION_LOOKUP_TABLE as any)[activationIndex](activationSection);
                                } catch (error) {
                                    console.log(error);
                                    console.error(`Failed to successfully execute lookup value func for activation index: ${activationIndex}`);
                                }

                                // console.log(`after body script invocation (activationIndex: ${activationIndex})`);
                            } else {
                                console.error(`Refusing to re-activate activationIndex: ${activationIndex}`);
                            }
                        }
                    }
                    // console.log('at end of func eval');
                })();
                // console.log('after func eval');
            } catch (error) {
                console.error(error);
                console.error("Failed to execute body script evaluation logic");
            }
        })
    }
}
