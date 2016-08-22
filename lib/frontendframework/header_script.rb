module FrontEndFramework
  HEADER_SCRIPT = <<JS.strip
<script> "use strict"; var gHndl = this; var stateToClearOnNavigation = {}; var hooks = { pre: [], post: [] }; </script>
JS
end
