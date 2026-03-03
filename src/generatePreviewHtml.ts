import type { Project } from "./types";

/**
 * Generates a complete HTML document that runs the user's Phaser game
 * inside a sandboxed iframe.
 */
export function generatePreviewHtml(project: Project): string {
  const { config, scenes, modules } = project;

  // Strip "export default" from module code so classes become global
  const moduleScripts = modules
    .map((m) => {
      const code = m.code.replace(/export\s+default\s+/g, "");
      return `// ── Module: ${m.name} ──\n${code}`;
    })
    .join("\n\n");

  // Scene code injected verbatim
  const sceneScripts = scenes
    .map((s) => `// ── Scene: ${s.name} ──\n${s.code}`)
    .join("\n\n");

  // Collect scene class names for the Phaser config
  const sceneNames = scenes.map((s) => s.name).join(", ");

  // Physics config
  let physicsBlock = "";
  if (config.physics && config.physics !== "none") {
    physicsBlock = `
    physics: {
      default: '${config.physics}',
      ${config.physics}: { gravity: { y: 300 }, debug: false }
    },`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { background: ${config.backgroundColor || "#000000"}; overflow: hidden; }
</style>
</head>
<body>
<script>
// ── Console interception ──────────────────────────────────────────
(function() {
  var origConsole = {};
  ['log', 'warn', 'error', 'info'].forEach(function(level) {
    origConsole[level] = console[level];
    console[level] = function() {
      var args = Array.prototype.slice.call(arguments).map(function(a) {
        try { return typeof a === 'object' ? JSON.stringify(a) : String(a); }
        catch(e) { return String(a); }
      });
      parent.postMessage({
        type: 'phaser-preview-console',
        level: level,
        args: args,
        timestamp: Date.now()
      }, '*');
      origConsole[level].apply(console, arguments);
    };
  });

  window.onerror = function(msg, src, line, col, err) {
    console.error('[Error] ' + msg + ' (line ' + line + ')');
  };

  window.addEventListener('unhandledrejection', function(e) {
    console.error('[Promise] ' + (e.reason ? e.reason.message || e.reason : 'Unhandled rejection'));
  });
})();
</script>

<script src="https://cdn.jsdelivr.net/npm/phaser@3/dist/phaser.min.js"><\/script>

<script>
${moduleScripts}

${sceneScripts}
</script>

<script>
try {
  var game = new Phaser.Game({
    type: Phaser.AUTO,
    width: ${config.width},
    height: ${config.height},
    backgroundColor: '${config.backgroundColor || "#000000"}',
    pixelArt: ${config.pixelArt ? "true" : "false"},${physicsBlock}
    scene: [${sceneNames}],
    parent: document.body
  });
} catch(e) {
  console.error('[Startup] ' + e.message);
}
</script>
</body>
</html>`;
}
