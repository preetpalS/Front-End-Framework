//= require ./base
//= require ./screen_resolutions
//= require ./mini_html_view_model
//= require ./storage
//= require ./core

/// <reference path="./base.js.ts"/>
/// <reference path="./screen_resolutions.js.ts"/>
/// <reference path="./mini_html_view_model.js.ts"/>
/// <reference path="./storage.js.ts"/>
/// <reference path="./core.js.ts"/>

// Note that the above references do not work if you have the TypeScript compiler set to remove comments.
// Use something like the uglifier gem for removing comments/obfuscation.

// The load order currently matters.

namespace FrontEndFramework { export const VERSION = '0.6.13'; }
