
"use strict";

namespace FrontEndFramework {
namespace ScreenDimensions {
    export interface ScreenDimensions {
        availableHeight : number;
        availableWidth : number;
        deviceHeight : number;
        deviceWidth : number;
    }

    export var GetScreenDimensions = function() : ScreenDimensions {
        return {
            availableHeight: window.screen.availHeight,
            availableWidth: window.screen.availWidth,
            deviceHeight: window.screen.height,
            deviceWidth: window.screen.width
        };
    }
}
}
