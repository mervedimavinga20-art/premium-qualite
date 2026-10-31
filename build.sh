cd /home/claude/premium-qualite
{ cat src/a-head.html src/b-body.html; echo '<script>'; echo "(function(){'use strict';"; cat src/c-i18n.js src/d-core.js src/g-cloud.js src/h-premium.js src/j-pos.js src/l-clients.js src/e-render.js src/f-app.js src/i-premium-init.js src/k-pos-init.js; echo '})();'; echo '</script></body></html>'; } > index.html
S=/tmp/claude-0/-home-claude/a3ab875f-d510-5325-991e-bc13e433d22d/scratchpad
sed -n '/^<script>/,/<\/script>/p' index.html | sed '1d;$d' > $S/app2.js && node --check $S/app2.js && echo SYNTAX_OK
