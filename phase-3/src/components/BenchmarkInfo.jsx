import { Icon } from "./Icon.jsx";
import { Tooltip } from "./shared.jsx";

// What "Benchmarked" means: opened from the Benchmarked tag of a library
// question, and from "benchmark" in a custom question's note.
export function BenchmarkInfo({ onClose }) {
  return (
    <div className="overlay" style={{ background: "var(--bg-interface-overlay)", zIndex: 82 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog dialog-s bi-dialog" role="dialog" aria-modal="true" aria-labelledby="bi-title">
        <Tooltip label="Close" pos="is-left" wrapClass="dialog-close-tt">
          <button className="dialog-close" aria-label="Close" onClick={onClose}><Icon name="cross" /></button>
        </Tooltip>
        <div className="dialog-header is-sm">
          <div className="dialog-header-top">
            <span className="infotag is-standard"><Icon name="barchart-2" size={12} />Benchmarked</span>
          </div>
          <h3 className="dialog-title" id="bi-title">What a benchmarked question is</h3>
        </div>
        <div className="bi-body">
          <p>Effectory developed and tested each benchmarked question. Many organizations ask it in exactly the same way, so you can compare your results with theirs. That comparison is the benchmark, and it's why we always recommend a benchmarked question over writing your own.</p>
          <p>To keep the comparison fair, the wording, the answer scale and the translations stay the same. You can still:</p>
          <ul>
            <li>choose one of the approved alternative wordings</li>
            <li>add a description for your participants</li>
            <li>move it to another topic</li>
          </ul>
          <p>Want to change more? Write your own wording. It then becomes a custom question, without a benchmark.</p>
        </div>
        <div className="dialog-footer">
          <div className="spacer" />
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  );
}
