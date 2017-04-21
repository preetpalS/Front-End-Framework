//= require ./base
//= require ./mini_html_view_model
//= require ./screen_resolutions
//= require ./storage

/// <reference path="./base.js.ts"/>
/// <reference path="./mini_html_view_model.js.ts"/>
/// <reference path="./screen_resolutions.js.ts"/>
/// <reference path="./storage.js.ts"/>

// Note that the above references do not work if you have the TypeScript compiler set to remove comments.
// Use something like the uglifier gem for removing comments/obfuscation.

// Also note that require order does not consider dependency chain. Therefore, dependencies between files
// must not be affected by a random load order.

// AUTO-GENERATED by a Rake task, do not edit by hand.

namespace FrontEndFramework { export const VERSION = '0.5.0'; }
