import React, { useRef, useEffect, useState } from "react";
import Mark from "mark.js";

export default function HighlightedText({ text }) {
  const containerRef = useRef(null);
  const [_, setRerender] = useState(0); // force rerender after highlight

  // Ensure user-select is enabled
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.userSelect = "text";
    }
  }, []);

  // Re-apply highlights after text changes
  useEffect(() => {
    if (containerRef.current) {
      const instance = new Mark(containerRef.current);
      instance.unmark({
        done: () => {
          // No highlights on initial load
        },
      });
    }
  }, [text]);

  // Highlight selected text
  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    // Only highlight if selection is inside our container
    const container = containerRef.current;
    if (!container.contains(selection.anchorNode) || !container.contains(selection.focusNode)) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    const instance = new Mark(container);
    instance.unmark({
      done: () => {
        instance.mark(selectedText, {
          separateWordSearch: false,
          className: "highlighted",
          done: () => {
            setRerender((v) => v + 1); // force rerender to show highlight
          },
        });
      },
    });

    selection.removeAllRanges(); // clear selection
  };

  return (
    <div>
      <button onClick={handleHighlight} style={{ marginBottom: 8 }}>Highlight Selection</button>
      <div
        ref={containerRef}
        style={{
          userSelect: "text",
          cursor: "text",
          padding: 12,
          border: "1px solid #ccc",
          borderRadius: 4,
          minHeight: 80,
          background: "#fff",
        }}
        suppressContentEditableWarning
      >
        {text}
      </div>
      {/* Highlight style */}
      <style>{`
        .highlighted {
          background: yellow;
          padding: 0 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
