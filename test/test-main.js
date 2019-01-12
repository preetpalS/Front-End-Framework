
"use strict";

FrontEndFramework.hooks.pre.push(function() {
    FrontEndFramework.BodyScriptActivation.AddEntryToLookupTable('#test-case-3-hidden-text-message', function(_activationHtmlElement) {
        document.getElementById('test-case-3-hidden-text-message').innerHTML = 'Body script activation system is working!';
    });
});
