import { useState, useEffect } from 'react';

function App() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [mode, setMode] = useState('5');
  const [copied, setCopied] = useState(false);

  const isChrome = typeof chrome !== 'undefined' && chrome.storage;

  console.log('🔥 NEW UI CODE RUNNING', mode);

  useEffect(() => {
    // ✅ SAFE CHROME CHECK
    if (isChrome) {
      chrome.storage.local.get(['darkMode'], (res) => {
        if (res.darkMode) setDarkMode(true);
      });
    }

    // ✅ Keyboard accessibility
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') handleSummarize();
      if (e.key === 'Escape') handleReset();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);

    if (isChrome) {
      chrome.storage.local.set({ darkMode: newMode });
    }
  };

  const handleReset = () => {
    setResult(null);
    setLoading(false);
    setError(null);
    setCopied(false);
  };

  const sendHighlight = (tabId, summary) => {
    if (!summary || !tabId || !isChrome) return;

    console.log('🟢 SENDING HIGHLIGHT');

    chrome.tabs.sendMessage(tabId, {
      type: 'HIGHLIGHT',
      bullets: summary.split('\n'),
    });
  };

  // ✅ COPY (FIXED + FALLBACK)
  const handleCopy = async () => {
    if (!summaryText) return;

    try {
      await navigator.clipboard.writeText(summaryText);
      console.log('✅ Copied with clipboard API');
    } catch (err) {
      console.warn('⚠️ Clipboard API failed, using fallback');

      const textarea = document.createElement('textarea');
      textarea.value = summaryText;
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        console.log('✅ Copied with fallback');
      } catch (e) {
        console.error('❌ Copy failed');
      }

      document.body.removeChild(textarea);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSummarize = async () => {
    if (!isChrome) {
      setError('This only works inside the Chrome extension.');
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setCopied(false);

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        setError('No active tab found.');
        setLoading(false);
        return;
      }

      const url = tab.url;
      const cacheKey = `${url}_${mode}`;

      chrome.storage.local.get([cacheKey], (cachedData) => {
        if (cachedData[cacheKey]) {
          console.log('⚡ Using cached summary');

          const cached = cachedData[cacheKey];
          setResult(cached);

          sendHighlight(tab.id, cached.summary);

          setLoading(false);
          return;
        }

        chrome.tabs.sendMessage(
          tab.id,
          { type: 'GET_PAGE_CONTENT' },
          (response) => {
            if (chrome.runtime.lastError || !response) {
              console.error(
                '❌ Content script error:',
                chrome.runtime.lastError,
              );
              setError('Failed to extract page content.');
              setLoading(false);
              return;
            }

            console.log('🟠 CONTENT RESPONSE:', response);

            chrome.runtime.sendMessage(
              {
                type: 'SUMMARIZE',
                payload: {
                  ...response,
                  mode,
                },
              },
              (bgResponse) => {
                if (chrome.runtime.lastError || !bgResponse) {
                  console.error(
                    '❌ Background error:',
                    chrome.runtime.lastError,
                  );
                  setError('Failed to generate summary.');
                  setLoading(false);
                  return;
                }

                console.log('🔵 BG RESPONSE:', bgResponse);

                if (!bgResponse.summary) {
                  setError('No summary returned from AI.');
                  setLoading(false);
                  return;
                }

                setResult(bgResponse);

                sendHighlight(tab.id, bgResponse.summary);

                chrome.storage.local.set({
                  [cacheKey]: bgResponse,
                });

                setLoading(false);
              },
            );
          },
        );
      });
    } catch (err) {
      console.error(err);
      setError('Unexpected error occurred.');
      setLoading(false);
    }
  };

  const theme = {
    bg: darkMode ? '#1f2937' : '#f4f6f8',
    card: darkMode ? '#374151' : '#ffffff',
    text: darkMode ? '#f9fafb' : '#111827',
    subText: darkMode ? '#d1d5db' : '#374151',
  };

  const summaryText = result?.summary || '';

  const wordCount = summaryText ? summaryText.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div
      style={{
        padding: '16px',
        width: '320px',
        fontFamily: 'Arial',
        background: theme.bg,
        color: theme.text,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '16px' }}>🤖 AI Summarizer</h2>

        <button onClick={toggleDarkMode} aria-label="Toggle dark mode">
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div style={{ marginTop: '10px', marginBottom: '10px' }}>
        <label style={{ fontSize: '13px' }}>Summary Type:</label>

        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          style={{ marginLeft: '8px' }}
          aria-label="Select summary type"
        >
          <option value="5">5 Bullets</option>
          <option value="3">3 Bullets</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleSummarize}
          aria-label="Summarize page"
          style={{
            flex: 1,
            padding: '8px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
          }}
        >
          Summarize
        </button>

        <button
          onClick={handleReset}
          aria-label="Reset summary"
          style={{
            flex: 1,
            padding: '8px',
            background: '#9ca3af',
            border: 'none',
            borderRadius: '6px',
          }}
        >
          Reset
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '10px',
            padding: '8px',
            background: '#fee2e2',
            color: '#991b1b',
            borderRadius: '6px',
            fontSize: '12px',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '3px solid #ccc',
              borderTop: '3px solid #2563eb',
              borderRadius: '50%',
              margin: '0 auto',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontSize: '12px' }}>Summarizing...</p>
        </div>
      )}

      {result && !error && (
        <div style={{ marginTop: '10px' }}>
          <h4 style={{ fontSize: '13px' }}>{result.title}</h4>

          <div
            style={{
              background: theme.card,
              padding: '10px',
              borderRadius: '6px',
              maxHeight: '180px',
              overflowY: 'auto',
              whiteSpace: 'pre-line',
              fontSize: '12px',
            }}
          >
            {summaryText}
          </div>

          <p
            style={{ fontSize: '11px', marginTop: '5px', color: theme.subText }}
          >
            Word count: {wordCount}
          </p>

          <p style={{ fontSize: '11px', color: theme.subText }}>
            ⏱️ Reading time: {readingTime} min
          </p>

          <button
            onClick={handleCopy}
            disabled={!summaryText}
            aria-label="Copy summary"
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '8px',
              background: copied ? '#059669' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              opacity: !summaryText ? 0.6 : 1,
              cursor: !summaryText ? 'not-allowed' : 'pointer',
            }}
          >
            {copied ? '✅ Copied!' : '📋 Copy Summary'}
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          button:focus, select:focus {
            outline: 2px solid #2563eb;
            outline-offset: 2px;
          }
        `}
      </style>
    </div>
  );
}

export default App;
