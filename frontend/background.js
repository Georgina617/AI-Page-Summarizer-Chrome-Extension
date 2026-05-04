console.log('🟢 Background running 🚀');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📩 Received in background:', message);

  // ✅ ONLY handle summarize (clean architecture)
  if (message.type === 'SUMMARIZE') {
    handleSummarize(message.payload)
      .then((result) => {
        console.log('📤 Sending response:', result);
        sendResponse(result);
      })
      .catch((err) => {
        console.error('❌ Error:', err);
        sendResponse({ error: err.message });
      });

    return true; // required for async
  }
});

async function handleSummarize(data) {
  const { title, content, mode } = data;

  try {
    const res = await fetch('http://localhost:3000/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, mode }),
    });

    if (!res.ok) {
      throw new Error('Backend request failed');
    }

    const result = await res.json();

    if (!result || !result.summary) {
      throw new Error('Invalid response from backend');
    }

    return {
      title,
      summary: result.summary,
    };
  } catch (error) {
    console.error('❌ Backend fetch failed:', error);

    return {
      error: 'Failed to fetch AI summary',
    };
  }
}
