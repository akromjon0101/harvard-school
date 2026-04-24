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

// Accurate caret offset using browser-native range serialization.
// This is the most reliable approach — the browser handles all edge cases
// including shadow DOM, void elements, and complex nested HTML.
export function getCaretOffset(container, targetNode, targetOffset) {
    try {
        const r = document.createRange()
        r.setStart(container, 0)
        r.setEnd(targetNode, targetOffset)
        return r.toString().length
    } catch {
        return 0
    }
}
