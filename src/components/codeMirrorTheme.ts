import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

export const editorTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "var(--bg-base)",
      color: "var(--txt)",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11.5px",
      lineHeight: "1.6",
    },
    ".cm-content": {
      caretColor: "var(--txt)",
      padding: "14px 0",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--txt)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "var(--bg-act)",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--bg-hov)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--bg-base)",
      color: "var(--txt3)",
      border: "none",
      borderRight: "1px solid var(--bdr)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--bg-hov)",
      color: "var(--txt2)",
    },
    ".cm-lineNumbers .cm-gutterElement": {
      padding: "0 8px 0 4px",
      minWidth: "32px",
    },
    ".cm-foldGutter .cm-gutterElement": {
      padding: "0 4px",
      color: "var(--txt3)",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(74, 125, 255, 0.2)",
      outline: "1px solid rgba(74, 125, 255, 0.5)",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    ".cm-scroller::-webkit-scrollbar": {
      width: "5px",
      height: "5px",
    },
    ".cm-scroller::-webkit-scrollbar-thumb": {
      background: "var(--bdr)",
      borderRadius: "3px",
    },
    ".cm-scroller::-webkit-scrollbar-track": {
      background: "transparent",
    },
  },
  { dark: true },
);

const highlightColors = HighlightStyle.define([
  { tag: t.comment, color: "#546e7a", fontStyle: "italic" },
  { tag: t.lineComment, color: "#546e7a", fontStyle: "italic" },
  { tag: t.blockComment, color: "#546e7a", fontStyle: "italic" },
  { tag: t.string, color: "#c3e88d" },
  { tag: t.special(t.string), color: "#c3e88d" },
  { tag: t.keyword, color: "#c792ea" },
  { tag: t.controlKeyword, color: "#c792ea" },
  { tag: t.operatorKeyword, color: "#c792ea" },
  { tag: t.definitionKeyword, color: "#c792ea" },
  { tag: t.moduleKeyword, color: "#c792ea" },
  { tag: t.number, color: "#f78c6c" },
  { tag: t.bool, color: "#f78c6c" },
  { tag: t.null, color: "#f78c6c" },
  { tag: t.function(t.variableName), color: "#82aaff" },
  { tag: t.function(t.propertyName), color: "#82aaff" },
  { tag: t.typeName, color: "#ffcb6b" },
  { tag: t.className, color: "#ffcb6b" },
  { tag: t.propertyName, color: "#f07178" },
  { tag: t.operator, color: "#89ddff" },
  { tag: t.punctuation, color: "#89ddff" },
  { tag: t.bracket, color: "#89ddff" },
  { tag: t.variableName, color: "var(--txt)" },
  { tag: t.definition(t.variableName), color: "var(--txt)" },
  { tag: t.regexp, color: "#c3e88d" },
]);

export const syntaxColors = syntaxHighlighting(highlightColors);
