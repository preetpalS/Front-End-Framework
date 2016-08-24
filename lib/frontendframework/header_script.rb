module FrontEndFramework
  HEADER_SCRIPT_JS_ONLY = <<JS.strip
"use strict"; var gHndl = this; var stateToClearOnNavigation = {}; var hooks = { pre: [], post: [] };
JS
  HEADER_SCRIPT = <<HTML.strip
<script> <%= HEADER_SCRIPT_JS_ONLY %> </script>
HTML
end
