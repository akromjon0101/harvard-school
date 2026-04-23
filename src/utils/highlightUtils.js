// Shared highlight utilities for exam page

// Normalize line endings so DOM text nodes and raw string match
export function normalizeText(str) {
    return str ? str.replace(/\r\n/g, '\n').replace(/\r/g, '\n') : ''
}

// Strip HTML tags to get plain text (for rich-text fields)
export function stripHtml(html) {
    if (!html) return ''
    if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '')
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
}

// Renders passage text with highlights as React elements (no dangerouslySetInnerHTML)
import React from 'react'
export function renderHighlightedText(rawText, highlights) {
    const text = normalizeText(rawText)
    if (!text) return null
    if (!highlights?.length) return text
    const sorted = highlights.map((h, i) => ({ ...h, origIdx: i })).sort((a, b) => a.start - b.start)
    const parts = []
    let cursor = 0
    for (const h of sorted) {
        if (h.start >= cursor && h.end > h.start) {
            if (h.start > cursor) parts.push(text.slice(cursor, h.start))
            parts.push(
                React.createElement('mark', {
                    key: `hl-${h.start}`,
                    className: `ip-text-highlight ip-hl-${h.color || 'yellow'}`,
                    'data-hl': h.origIdx,
                    title: 'Click to remove',
                }, text.slice(h.start, h.end))
            )
            cursor = h.end
        }
    }
    if (cursor < text.length) parts.push(text.slice(cursor))
    return parts
}

// Accurate caret offset using recursive DOM walk
export function getCaretOffset(container, targetNode, targetOffset) {
    if (targetNode === container) {
        let t = 0
        for (let i = 0; i < targetOffset; i++) {
            t += container.childNodes[i]?.textContent?.length || 0
        }
        return t
    }
    let total = 0
    let found = false
    function walk(node) {
        if (found) return
        if (node === targetNode) {
            if (node.nodeType === Node.TEXT_NODE) {
                total += targetOffset
            } else {
                for (let i = 0; i < targetOffset && i < node.childNodes.length; i++) {
                    total += node.childNodes[i].textContent.length
                }
            }
            found = true
            return
        }
        if (node.nodeType === Node.TEXT_NODE) {
            total += node.nodeValue.length
        } else {
            for (const child of node.childNodes) {
                if (found) return
                walk(child)
            }
        }
    }
    for (const child of container.childNodes) {
        if (found) break
        walk(child)
    }
    return total
}
