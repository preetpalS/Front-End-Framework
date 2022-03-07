
// Does not really depend on anything

"use strict";

export namespace FrontEndFramework {
export namespace ScreenResolutions {
    export interface ScreenDimensions {
        availableHeight : number;
        availableWidth : number;
        deviceHeight : number;
        deviceWidth : number;
    }

    export const GET_SCREEN_DIMENSIONS = (): ScreenDimensions => ({
        availableHeight: window.screen.availHeight,
        availableWidth: window.screen.availWidth,
        deviceHeight: window.screen.height,
        deviceWidth: window.screen.width,
    });
}
}
