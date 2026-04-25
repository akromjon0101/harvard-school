/**
 * highlightUtils.js
 * Professional-grade utilities for text highlighting in React applications.
 */

import React from 'react';

/**
 * Normalizes text to ensure consistent character counting across different OS/browsers.
 */
export function normalizeText(str) {
  return str ? str.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : '';
}

/**
 * Safely strips HTML from a string to get plain text.
 */
export function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Robustly calculates the character offset of a point in a DOM tree relative to a container.
 * This handles nested elements, line breaks, and mark.js insertions correctly.
 */
export function getCaretOffset(container, node, offset) {
  let charCount = 0;
  let target = node;

  // If node is an element, target the specific child or the element itself
  if (node.nodeType !== Node.TEXT_NODE) {
    if (node.childNodes && node.childNodes.length > 0 && offset < node.childNodes.length) {
      target = node.childNodes[offset];
      offset = 0;
    }
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (textNode === target) {
      charCount += offset;
      return charCount;
    }
    charCount += textNode.textContent.length;
  }
  
  // Fallback: search for the node using compareDocumentPosition if nextNode missed it
  return charCount;
}

/**
 * Given character offsets, find the actual DOM nodes and internal offsets.
 * Used for restoring selections or debugging.
 */
export function getNodeAtOffset(container, targetOffset) {
  let charCount = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
  
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const len = textNode.textContent.length;
    if (charCount + len >= targetOffset) {
      return { node: textNode, offset: targetOffset - charCount };
    }
    charCount += len;
  }
  return { node: null, offset: 0 };
}
