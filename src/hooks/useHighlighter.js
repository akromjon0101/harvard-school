import { useState, useCallback, useEffect } from 'react';

export function useHighlighter(enabled = true) {
  const [highlights, setHighlights] = useState([]);
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleHighlight = useCallback((e) => {
    if (!isEnabled) return;

    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);

    // Check if selection is within allowed container
    const container = range.commonAncestorContainer;
    const passageContent = document.querySelector('.passage-content, .ielts-passage-content');

    if (!passageContent || !passageContent.contains(container)) {
      return; // Don't highlight outside passage
    }

    try {
      const mark = document.createElement('mark');
      mark.className = 'ielts-highlight-yellow';
      mark.setAttribute('data-highlight-id', Date.now().toString());

      range.surroundContents(mark);

      setHighlights(prev => [...prev, mark.getAttribute('data-highlight-id')]);
      selection.removeAllRanges();
    } catch (error) {
      // Can't highlight across multiple elements
      console.warn('Cannot highlight across multiple elements');
    }
  }, [isEnabled]);

  const clearAllHighlights = useCallback(() => {
    document.querySelectorAll('.ielts-highlight-yellow').forEach(mark => {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    });
    setHighlights([]);
  }, []);

  const clearHighlight = useCallback((highlightId) => {
    const mark = document.querySelector(`[data-highlight-id="${highlightId}"]`);
    if (mark) {
      const parent = mark.parentNode;
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
      setHighlights(prev => prev.filter(id => id !== highlightId));
    }
  }, []);

  const toggleHighlighter = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      document.addEventListener('mouseup', handleHighlight);
      document.addEventListener('touchend', handleHighlight);
    } else {
      document.removeEventListener('mouseup', handleHighlight);
      document.removeEventListener('touchend', handleHighlight);
    }

    return () => {
      document.removeEventListener('mouseup', handleHighlight);
      document.removeEventListener('touchend', handleHighlight);
    };
  }, [isEnabled, handleHighlight]);

  return {
    highlights,
    isEnabled,
    toggleHighlighter,
    clearAllHighlights,
    clearHighlight
  };
}

// CSS to be added to global styles
export const highlighterStyles = `
.ielts-highlight-yellow {
  background-color: #fef08a;
  padding: 0 2px;
  border-radius: 2px;
  cursor: pointer;
}

.ielts-highlight-yellow:hover {
  background-color: #fde047;
}

.passage-content mark,
.ielts-passage-content mark {
  background-color: #fef08a;
}

.highlighter-disabled .passage-content {
  user-select: none;
}
`;
