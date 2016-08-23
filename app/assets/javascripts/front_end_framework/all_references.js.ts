
/// <reference path="./base.js.ts"/>
/// <reference path="./mini_html_view_model.js.ts"/>
/// <reference path="./screen_resolutions.js.ts"/>

// WARNING: Everything below might have been caused by different JQuery files being referenced from different paths

// screen_resolutions.js.ts is currently at the end of the linear dependency chain.

// Linear dependency chain is required...

// If you reference 2 files within a file that both reference a common dependency, you get TypeScript redefinition errors.
// Therefore you cannot reference two files with a common dependency separately.
// You must reference 1 to all of the dependencies (traversing to different files in linear dependency chain).

// Also every file must be able to compile independently (therefore requiring that its dependencies be met).
