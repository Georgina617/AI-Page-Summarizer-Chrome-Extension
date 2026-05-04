console.log('NEW CONTENT SCRIPT RUNNING 🚀');

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ') // normalize spaces
    .replace(/\n+/g, '\n') // normalize new lines
    .trim();
}

// ❌ Remove unwanted elements
function removeJunk() {
  const selectors = [
    'nav',
    'footer',
    'header',
    'aside',
    'script',
    'style',
    'noscript',
    'svg',
    'form',
    'button',
    'input',
    'ads',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
  ];

  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  });
}

// ✅ Find best content container
function getMainContent() {
  const candidates = [
    'article',
    'main',
    '[role="main"]',
    '.content',
    '.post',
    '.article',
    '.entry-content',
  ];

  for (let selector of candidates) {
    const el = document.querySelector(selector);
    if (el && el.innerText.length > 500) {
      return el.innerText;
    }
  }

  // fallback
  return document.body.innerText;
}

// ✅ Extract paragraphs only (cleaner than raw text)
function extractParagraphs(rootText) {
  const paragraphs = rootText
    .split('\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 60); // remove short junk

  return paragraphs.join('\n\n');
}

function extractContent() {
  removeJunk();

  let rawContent = getMainContent();

  let cleaned = cleanText(rawContent);

  let paragraphs = extractParagraphs(cleaned);

  // limit size for API
  return paragraphs.slice(0, 5000);
}

function highlightText(bullets) {
  console.log('🟡 Highlight triggered with bullets:', bullets);
  if (!bullets || !bullets.length) return;

  const bodyTextNodes = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      bodyTextNodes.push(node);
    } else {
      node.childNodes.forEach(walk);
    }
  }

  walk(document.body);

  bullets.forEach((bullet) => {
    const cleanBullet = bullet.replace(/^[-•]\s*/, '').trim();
    if (cleanBullet.length < 20) return;

    bodyTextNodes.forEach((node) => {
      if (!node.nodeValue.toLowerCase().includes(cleanBullet.toLowerCase()))
        return;

      const span = document.createElement('mark');
      span.style.backgroundColor = 'yellow';
      span.style.padding = '2px';

      const range = document.createRange();
      const startIndex = node.nodeValue
        .toLowerCase()
        .indexOf(cleanBullet.toLowerCase());

      if (startIndex === -1) return;

      range.setStart(node, startIndex);
      range.setEnd(node, startIndex + cleanBullet.length);

      try {
        range.surroundContents(span);
      } catch (e) {
        // ignore broken ranges
      }
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📩 MESSAGE RECEIVED:', message);

  if (!message) return;

  try {
    if (message.type === 'GET_PAGE_CONTENT') {
      const content = extractContent();

      sendResponse({
        title: document.title,
        content: content,
      });

      return true;
    }

    if (message.type === 'HIGHLIGHT') {
      highlightText(message.bullets);

      sendResponse({ success: true }); // ✅ FIX

      return true;
    }
  } catch (err) {
    console.error('❌ Content script error:', err);

    if (message.type === 'GET_PAGE_CONTENT') {
      sendResponse({
        title: document.title,
        content: '',
      });
    }
  }

  return true;
});
