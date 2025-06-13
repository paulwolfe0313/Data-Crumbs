import { useState } from 'react';
import './index.css';

type CookieData = {
  name: string;
  valuePreview: string;
  domain: string;
  path: string;
  isSecure: boolean;
  isHttpOnly: boolean;
  classification?: string;
  confidence?: number;
};

function App() {
  const [cookies, setCookies] = useState<CookieData[]>([]);
  const [scanning, setScanning] = useState(false);

  const handleScanCookies = () => {
    setScanning(true);

    chrome.runtime.sendMessage(
      { type: 'GET_COOKIES' },
      async (response: { cookies: CookieData[] }) => {
        const scannedCookies = response?.cookies || [];
        const classified = await classifyCookies(scannedCookies);
        setCookies(classified);
        setScanning(false);
      }
    );
  };

  const classifyCookies = async (cookies: CookieData[]): Promise<CookieData[]> => {
    const results: CookieData[] = [];

    for (const cookie of cookies) {
      try {
        const res = await fetch("https://data-crumbs.onrender.com/classify-cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: cookie.name,
            domain: cookie.domain,
            isSecure: cookie.isSecure,
            isHttpOnly: cookie.isHttpOnly
          })
        });

        const result = await res.json();

        results.push({
          ...cookie,
          classification: result.label,
          confidence: result.confidence
        });
      } catch (err) {
        console.error("Classification error:", err);
        results.push({ ...cookie, classification: "Unknown", confidence: 0 });
      }
    }

    return results;
  };

  return (
    <div className="w-80 p-4 bg-white rounded-lg shadow-lg font-sans text-sm">
      <h1 className="text-2xl font-bold text-blue-600 mb-2">🍪 Data Crumbs</h1>
      <p className="text-gray-600 mb-4">
        Scan the site to see what cookies are being used.
      </p>

      <button
        onClick={handleScanCookies}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-xl w-full shadow"
      >
        {scanning ? 'Scanning...' : 'Scan Cookies'}
      </button>

      <p className="text-xs text-gray-500 mt-2">
        By clicking "Scan Cookies", you allow Data Crumbs to access cookie data from this site.
      </p>

      {cookies.length > 0 && (
        <div className="mt-4">
          <h2 className="text-md font-semibold text-gray-800 mb-1">Found Cookies:</h2>
          <ul className="max-h-48 overflow-y-auto space-y-2">
            {cookies.map((cookie, idx) => (
              <li
                key={idx}
                className="bg-gray-100 px-3 py-2 rounded text-gray-700 text-xs break-all"
              >
                <div className="font-semibold">{cookie.name}</div>
                <div className="text-gray-500 text-[10px]">
                  Domain: {cookie.domain} • Path: {cookie.path}
                  <br />
                  Secure: {cookie.isSecure ? 'Yes' : 'No'} • HttpOnly:{' '}
                  {cookie.isHttpOnly ? 'Yes' : 'No'}
                </div>
                <div className="mt-1 text-gray-500">
                  Value: {cookie.valuePreview}
                </div>

                {cookie.classification && (
                  <div className="mt-1 text-blue-600 font-medium">
                    {cookie.classification} ({(cookie.confidence! * 100).toFixed(1)}%)
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
