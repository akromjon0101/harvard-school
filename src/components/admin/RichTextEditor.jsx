import React, { useRef, useEffect, useCallback } from 'react';

// Content-editable rich text editor with Bold-only toolbar.
export default function RichTextEditor({ value, onChange, placeholder, rows = 3, className = '' }) {
  const ref = useRef(null);
  const isFocusedRef = useRef(false);
  const lastValueRef = useRef(value);
  const savedRangeRef = useRef(null);

  useEffect(() => {
    if (ref.current && !isFocusedRef.current && value !== lastValueRef.current) {
      ref.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

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

  const handleChange = useCallback(() => {
    const html = ref.current?.innerHTML || '';
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const toggleBold = () => {
    restoreSelection();
    document.execCommand('bold', false, undefined);
    handleChange();
  };

  return (
    <div className={`rte-wrapper ${className}`}>
      <div className="rte-toolbar" onMouseDown={e => { e.preventDefault(); saveSelection(); }}>
        <button type="button" className="rte-btn rte-bold" onClick={toggleBold} title="Bold (Ctrl+B)">
          <b>B</b>
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
