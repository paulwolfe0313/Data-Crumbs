chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_COOKIES') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url) return;

      chrome.cookies.getAll({ url: tab.url }, (cookies) => {
        const summarizedCookies = cookies.map(cookie => ({
          name: cookie.name,
          domain: cookie.domain,
          path: cookie.path,
          isSecure: cookie.secure,
          isHttpOnly: cookie.httpOnly,
          valuePreview: cookie.value ? cookie.value.slice(0, 6) + '...' : '(no value)',
        }));

        sendResponse({ cookies: summarizedCookies });
      });
    });

    return true; // Keeps sendResponse channel open for async cookies
  }
});
