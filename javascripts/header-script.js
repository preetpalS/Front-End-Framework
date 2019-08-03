
"use strict";

if (typeof FrontEndFramework == 'undefined') {
    var FrontEndFramework = {};
}

FrontEndFramework.gHndl = this;
FrontEndFramework.stateToClearOnNavigation = {};
FrontEndFramework.hooks = { pre: [], post: [], pageCleanup: [] };
