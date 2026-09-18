import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(content: string, className = 'seminar-markdown') {
  const node = document.createElement('div'); node.className = className;
  node.innerHTML = DOMPurify.sanitize(marked.parse(content, { async: false, breaks: true, gfm: true }), {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'del', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
    ALLOWED_ATTR: ['href', 'title', 'start'], ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false,
  });
  // Markdown belongs below the card's h3, never above the page hierarchy.
  node.querySelectorAll('h1,h2,h3,h4,h5,h6').forEach(heading => {
    const replacement = document.createElement('h4'); replacement.append(...heading.childNodes); heading.replaceWith(replacement);
  });
  node.querySelectorAll('a').forEach(link => {
    const raw = link.getAttribute('href') || '';
    try {
      const destination = new URL(raw, location.href);
      if (!['https:', 'http:', 'mailto:'].includes(destination.protocol)) { link.removeAttribute('href'); return; }
      link.rel = 'noopener noreferrer';
      if (destination.origin !== location.origin && destination.protocol !== 'mailto:') link.target = '_blank';
    } catch { link.removeAttribute('href'); }
  });
  return node;
}
