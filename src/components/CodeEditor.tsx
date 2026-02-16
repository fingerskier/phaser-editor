import { highlightJS } from "../utils";

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: CodeEditorProps) {
  const lines = code.split("\n");

  return (
    <div className="code-panel">
      <div className="code-scroll">
        <div className="ln">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <div className="code-wrap">
          <div
            className="code-hl"
            dangerouslySetInnerHTML={{ __html: highlightJS(code) + "\n" }}
          />
          <textarea
            className="code-ta"
            value={code}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
