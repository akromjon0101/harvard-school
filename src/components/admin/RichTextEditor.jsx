import React, { useRef, useEffect, useCallback } from 'react';

// Content-editable rich text editor with Bold, Italic, Underline and font-size controls.
// Stores content as HTML so formatting persists across saves.
export default function RichTextEditor({ value, onChange, placeholder, rows = 3, className = '' }) {
  const ref = useRef(null);
  const isFocusedRef = useRef(false);
  const lastValueRef = useRef(value);
  const savedRangeRef = useRef(null);

  // Sync external value → DOM (only when not focused, to avoid cursor jumping)
  useEffect(() => {
    if (ref.current && !isFocusedRef.current && value !== lastValueRef.current) {
      ref.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  // Set initial content on mount
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || '';
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (!savedRangeRef.current) return;
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const exec = (cmd, val) => {
    restoreSelection();
    document.execCommand(cmd, false, val ?? undefined);
    handleChange();
  };

  const handleChange = useCallback(() => {
    const html = ref.current?.innerHTML || '';
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);


  return (
    <div className={`rte-wrapper ${className}`}>
      <div className="rte-toolbar" onMouseDown={e => { e.preventDefault(); saveSelection(); }}>
        {/* Bold */}
        <button type="button" className="rte-btn rte-bold" onClick={() => exec('bold')} title="Bold (Ctrl+B)">
          <b>B</b>
        </button>
        {/* Italic */}
        <button type="button" className="rte-btn rte-italic" onClick={() => exec('italic')} title="Italic (Ctrl+I)">
          <i>I</i>
        </button>
        {/* Underline */}
        <button type="button" className="rte-btn" onClick={() => exec('underline')} title="Underline (Ctrl+U)">
          <u>U</u>
        </button>

        <div className="rte-divider" />

        {/* Clear all formatting */}
        <button
          type="button"
          className="rte-btn rte-clear"
          onClick={() => { exec('removeFormat'); exec('unlink'); }}
          title="Remove formatting"
        >
          ✕
        </button>
      </div>

      <div
        ref={ref}
        className="rte-content"
        contentEditable
        suppressContentEditableWarning
        onInput={handleChange}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={() => { isFocusedRef.current = true; }}
        onBlur={() => { isFocusedRef.current = false; handleChange(); }}
        data-placeholder={placeholder}
        style={{ minHeight: `${rows * 1.7}em` }}
      />
    </div>
  );
}
