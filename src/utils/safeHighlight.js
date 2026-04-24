// safeHighlight.js — Professional DOM-based text highlighting utilities

/**
 * Unwrap all <mark.ip-text-highlight> elements inside a container
 * and normalize adjacent text nodes so offsets stay consistent.
 */
export function clearHighlightsFromContainer(container) {
    if (!container) return;
    // Collect first to avoid live-NodeList mutation while iterating
    const marks = [...container.querySelectorAll('mark.ip-text-highlight')];
    marks.forEach(mark => {
        const parent = mark.parentNode;
        if (!parent) return;
        // Move all children out before the mark
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
    });
    // One single normalize pass at the root is enough and fastest
    container.normalize();
}

/**
 * Walk TEXT_NODEs inside `container` and find the node + local offset
 * that corresponds to `targetOffset` characters from the start.
 */
function findNodeAndOffset(container, targetOffset) {
    let accumulated = 0;
    let lastNode = null;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    let node = walker.nextNode();
    while (node) {
        const len = node.nodeValue.length;
        // Use strict > so that the END of a node maps to the START of the next
        if (accumulated + len > targetOffset) {
            return { node, offset: targetOffset - accumulated };
        }
        accumulated += len;
        lastNode = node;
        node = walker.nextNode();
    }
    // Clamp to last text node end (node is always null here, track lastNode instead)
    if (lastNode) return { node: lastNode, offset: lastNode.nodeValue.length };
    return null;
}

/**
 * Wrap every TEXT_NODE within `range` in a <mark> element.
 * Works safely across element boundaries.
 */
export function wrapRangeTextNodes(range, colorClass = 'ip-hl-yellow', dataHlId = '', onClickHighlight = null) {
    // Gather affected text nodes
    const textNodes = [];

    if (
        range.startContainer === range.endContainer &&
        range.startContainer.nodeType === Node.TEXT_NODE
    ) {
        textNodes.push(range.startContainer);
    } else {
        const walker = document.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        let n = walker.nextNode();
        while (n) {
            if (range.intersectsNode(n)) textNodes.push(n);
            n = walker.nextNode();
        }
    }

    textNodes.forEach(textNode => {
        let startOff = 0;
        let endOff = textNode.nodeValue.length;

        if (textNode === range.startContainer) startOff = range.startOffset;
        if (textNode === range.endContainer)   endOff   = range.endOffset;
        if (startOff >= endOff) return; // nothing to highlight on this node

        const full   = textNode.nodeValue;
        const before = full.substring(0, startOff);
        const middle = full.substring(startOff, endOff);
        const after  = full.substring(endOff);

        // Shorten current node to the "before" part
        textNode.nodeValue = before;

        // Create the highlight mark
        const mark = document.createElement('mark');
        mark.className        = `ip-text-highlight ${colorClass}`;
        mark.dataset.hl       = String(dataHlId);
        mark.textContent      = middle;
        mark.style.cursor     = 'pointer';
        mark.title            = 'Click to remove';
        if (onClickHighlight) mark.onclick = onClickHighlight;

        const parent = textNode.parentNode;
        parent.insertBefore(mark, textNode.nextSibling);

        if (after.length > 0) {
            parent.insertBefore(document.createTextNode(after), mark.nextSibling);
        }
    });

    return true;
}

/**
 * Apply an array of { start, end, color } highlight descriptors to `container`.
 * Must be called AFTER clearHighlightsFromContainer so offsets match raw text.
 * The data-hl attribute on each <mark> stores the ORIGINAL array index so that
 * click-to-remove can identify the correct entry in the highlights array.
 */
export function applyHighlightsToContainer(container, highlights) {
    if (!container || !highlights?.length) return;

    // Preserve original indices before sorting, so data-hl reflects the array index.
    const sorted = highlights
        .map((hl, origIdx) => ({ ...hl, origIdx }))
        .sort((a, b) => a.start - b.start);

    sorted.forEach(hl => {
        const colorClass = hl.color ? `ip-hl-${hl.color}` : 'ip-hl-yellow';
        const startObj = findNodeAndOffset(container, hl.start);
        const endObj   = findNodeAndOffset(container, hl.end);
        if (!startObj || !endObj) return;

        const range = document.createRange();
        try {
            range.setStart(startObj.node, startObj.offset);
            range.setEnd(endObj.node, endObj.offset);
            if (!range.collapsed) {
                wrapRangeTextNodes(range, colorClass, hl.origIdx);
            }
        } catch {
            // Skip any range that the browser rejects (e.g. stale nodes)
        }
    });
}
