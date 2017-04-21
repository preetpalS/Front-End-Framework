module FrontEndFramework
  HEADER_SCRIPT_JS_ONLY = <<JS.strip
"use strict"; if (typeof FrontEndFramework == 'undefined') var FrontEndFramework = {}; FrontEndFramework.gHndl = this; FrontEndFramework.stateToClearOnNavigation = {}; FrontEndFramework.        hooks = { pre: [], post: [], pageCleanup: [] };
JS
  HEADER_SCRIPT = <<HTML.strip
<script> #{HEADER_SCRIPT_JS_ONLY} </script>
HTML
end
