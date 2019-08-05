/// <reference path="./base.ts"/>
/// <reference path="./mini_html_view_model.ts"/>
/// <reference path="./storage.ts"/>
/// <reference path="./pub_sub.ts"/>
/// <reference path="./runtime.ts"/>
/// <reference path="./body_script_activator.ts"/>
/// <reference path="./screen_resolutions.ts"/>
// The load order currently matters (except for reference paths that come after "./core.ts").
var FrontEndFramework;
(function (FrontEndFramework) {
    FrontEndFramework.VERSION = "0.9.0";
})(FrontEndFramework || (FrontEndFramework = {}));
