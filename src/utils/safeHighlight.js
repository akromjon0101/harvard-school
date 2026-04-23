// Advanced utilities for highlighting DOM nodes accurately without breaking HTML

export function wrapRangeTextNodes(range, colorClass = 'ip-hl-yellow', dataHlId = '', onClickHighlight = null) {
    // Collect all text nodes within the range
    const textNodes = [];
    let node = range.startContainer;
    const endNode = range.endContainer;

    if (node === endNode && node.nodeType === Node.TEXT_NODE) {
        textNodes.push(node);
    } else {
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let currentNode = walker.currentNode;
        while (currentNode && currentNode !== node) {
            currentNode = walker.nextNode();
        }
        
        while (currentNode) {
            textNodes.push(currentNode);
            if (currentNode === endNode) break;
            currentNode = walker.nextNode();
        }
    }

    // Process nodes to wrap them in <mark>
    textNodes.forEach(textNode => {
        let start = 0;
        let end = textNode.nodeValue.length;

        if (textNode === range.startContainer) {
            start = range.startOffset;
        }
        if (textNode === range.endContainer) {
            end = range.endOffset;
        }

        if (start === end) return; // Empty range on this node

        const text = textNode.nodeValue;
        const middle = text.substring(start, end);
        const after = text.substring(end);

        // Modify the current text node to contain only the text *before* the highlight
        textNode.nodeValue = text.substring(0, start);

        // Create the highlighted span
        const mark = document.createElement('mark');
        mark.className = `ip-text-highlight ${colorClass}`;
        if (dataHlId !== undefined) mark.setAttribute('data-hl', dataHlId);
        mark.textContent = middle;
        mark.style.cursor = 'pointer';
        mark.title = 'Click to remove highlight';
        
        if (onClickHighlight) mark.onclick = onClickHighlight;

        // Insert mark after the text node
        if (textNode.parentNode) {
            textNode.parentNode.insertBefore(mark, textNode.nextSibling);
            // Insert remaining text as a new node after the mark
            if (after.length > 0) {
                const afterNode = document.createTextNode(after);
                textNode.parentNode.insertBefore(afterNode, mark.nextSibling);
            }
        }
    });

    return true;
}

export function clearHighlightsFromContainer(container) {
    if (!container) return;
    const marks = container.querySelectorAll('mark.ip-text-highlight');
    marks.forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        // Normalize text nodes so sequential offset counts are perfect
        parent.normalize(); 
    });
}

// Applies an array of highlight ranges {start, end, color, id} to a root container.
export function applyHighlightsToContainer(container, highlights) {
    if (!container || !highlights || !highlights.length) return;

    // Helper to find node and offset in terms of TEXT_NODE length
    function findNodeAndOffset(targetOffset) {
        let total = 0;
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
        let node = walker.nextNode();
        while (node) {
            const len = node.nodeValue.length;
            if (total + len >= targetOffset) {
                return { node, offset: targetOffset - total };
            }
            total += len;
            node = walker.nextNode();
        }
        return null;
    }

    // Sort highlights to apply from end-to-back ?? 
    // Wait, applying from back to front prevents messing up previous offsets!
    const sorted = [...highlights].sort((a, b) => b.start - a.start);

    sorted.forEach((hl, idx) => {
        const originalId = hl.origIdx !== undefined ? hl.origIdx : idx;
        const colorClass = hl.color ? `ip-hl-${hl.color}` : 'ip-hl-yellow';

        const startObj = findNodeAndOffset(hl.start);
        const endObj = findNodeAndOffset(hl.end);

        if (startObj && endObj) {
            const range = document.createRange();
            range.setStart(startObj.node, startObj.offset);
            range.setEnd(endObj.node, endObj.offset);
            wrapRangeTextNodes(range, colorClass, originalId);
        }
    });
}
