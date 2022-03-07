// Does not really depend on anything
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontEndFramework = void 0;
var FrontEndFramework;
(function (FrontEndFramework) {
    var ScreenResolutions;
    (function (ScreenResolutions) {
        ScreenResolutions.GET_SCREEN_DIMENSIONS = function () { return ({
            availableHeight: window.screen.availHeight,
            availableWidth: window.screen.availWidth,
            deviceHeight: window.screen.height,
            deviceWidth: window.screen.width,
        }); };
    })(ScreenResolutions = FrontEndFramework.ScreenResolutions || (FrontEndFramework.ScreenResolutions = {}));
})(FrontEndFramework = exports.FrontEndFramework || (exports.FrontEndFramework = {}));
//# sourceMappingURL=screen_resolutions.js.map