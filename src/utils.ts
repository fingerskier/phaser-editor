/** Generate a unique ID using timestamp + random suffix. */
export function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Syntax-highlight a JavaScript code string, returning an HTML string. */
export function highlightJS(code: string): string {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /(\/\/.*)/g,
      '<span style="color:#546e7a;font-style:italic">$1</span>',
    )
    .replace(
      /('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)/g,
      '<span style="color:#c3e88d">$1</span>',
    )
    .replace(
      /\b(class|extends|constructor|super|new|import|export|default|from|const|let|var|function|return|if|else|for|while|typeof|null|undefined|true|false|this)\b/g,
      '<span style="color:#c792ea">$1</span>',
    )
    .replace(
      /\b(\d+\.?\d*)\b/g,
      '<span style="color:#f78c6c">$1</span>',
    );
}
