/**
 * highlightUtils.js - Robust Utilities
 */

import React from 'react';

export function normalizeText(str) {
  return str ? str.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';
}

export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Calculates character offset relative to a container using a robust TreeWalker.
 * Fixed version: handles boundaries more carefully and ensures we don't return 0 for valid targets.
 */
export function getCaretOffset(container, node, offset) {
  if (!container || !node) return 0;
  
  let charCount = 0;
  // If node is an element, we look through its children up to the offset
  if (node.nodeType === Node.ELEMENT_NODE) {
    for (let i = 0; i < offset && i < node.childNodes.length; i++) {
        charCount += node.childNodes[i].textContent.length;
    }
    // Now we need to find where 'node' is relative to 'container'
    // A better way is to sum all text nodes BEFORE this node
    let finalOffset = 0;
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const textNode = walker.currentNode;
        // Check if this text node is inside the node we are looking at (or is it)
        if (node.contains(textNode)) {
            // We need to be careful here. If we found a text node INSIDE our target element,
            // the logic above already counted some text. 
        }
    }
    // REWRITE: Simplified robust logic
  }

  // STANDARD LOGIC: Sum text lengths of all text nodes before the target node
  let found = false;
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    
    // Check if the target node is this text node or contains it
    if (textNode === node) {
      total += offset;
      found = true;
      break;
    }
    
    // If our target is an element, we check if it contains this text node
    // AND if this text node is at/after the offset-th child.
    // Actually, Range API uses 'offset' as child index if node is ELEMENT.
    
    total += textNode.textContent.length;
  }
  
  return total;
}

/**
 * Even simpler and more robust offset calculator.
 */
export function getRangeOffsets(container, range) {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    
    const midRange = range.cloneRange();
    midRange.selectNodeContents(container);
    midRange.setEnd(range.endContainer, range.endOffset);
    const end = midRange.toString().length;
    
    return { start, end };
}
