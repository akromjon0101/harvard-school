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

  const handleFontSize = (e) => {
    const size = e.target.value;
    if (!size) return;
    exec('fontSize', size);
    e.target.value = '';
  };

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

        {/* Font size dropdown */}
        <select
          className="rte-size-sel"
          onMouseDown={saveSelection}
          onChange={handleFontSize}
          defaultValue=""
          title="Font size"
        >
          <option value="" disabled>Size</option>
          <option value="1">XS</option>
          <option value="2">Small</option>
          <option value="3">Normal</option>
          <option value="4">Medium</option>
          <option value="5">Large</option>
          <option value="6">XL</option>
          <option value="7">XXL</option>
        </select>

        <div className="rte-divider" />

        {/* Quick font-size increase/decrease */}
        <button
          type="button"
          className="rte-btn"
          title="Increase font size"
          onClick={() => {
            restoreSelection();
            // execCommand('fontSize') wraps in <font size="N">, so read from that element
            const fontEl = window.getSelection()?.getRangeAt(0)
              ?.startContainer?.parentElement?.closest('font');
            const curSize = fontEl ? (parseInt(fontEl.getAttribute('size')) || 3) : 3;
            exec('fontSize', String(Math.min(7, curSize + 1)));
          }}
        >A+</button>
        <button
          type="button"
          className="rte-btn"
          title="Decrease font size"
          onClick={() => {
            restoreSelection();
            const fontEl = window.getSelection()?.getRangeAt(0)
              ?.startContainer?.parentElement?.closest('font');
            const curSize = fontEl ? (parseInt(fontEl.getAttribute('size')) || 3) : 3;
            exec('fontSize', String(Math.max(1, curSize - 1)));
          }}
        >A-</button>

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
