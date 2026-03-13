const STORAGE_KEY = 'ziplink_cache'; // Load history on page start 
window.onload = renderHistory;

function handleShorten() {
    let longUrl = document.getElementById('url-input').value.trim();
    if (!longUrl)
        return;

    // Clean the URL: add https:// if no protocol
    if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
        alert('Please enter a valid URL.');
    }

    const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    // 1. Check Cache 
    const existing = cache.find(item => item.long === longUrl);
    if (existing) {
        showResult(existing.short);
    } else {
        // 2. Fetch API to shorten URL
        fetch('https://ziplink.viethq.tech/api/url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ longUrl })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                const shortUrl = data.shortUrl; // Assuming the API returns { shortUrl: "..." }
                // 3. Save to Cache 
                cache.unshift({ long: longUrl, short: shortUrl });
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
                showResult(shortUrl);
                renderHistory();
            })
            .catch(error => {
                alert('Error shortening URL: ' + error.message);
            });
    }
}

function renderHistory() {
    const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    const listElement = document.getElementById('history-list');
    if (cache.length === 0) {
        listElement.innerHTML = '<p style="color: #475569; font-size: 0.8rem;">No recent links yet.</p>';
        return;
    }
    listElement.innerHTML = cache.map(item =>
        `<div class="history-item">
        <div class="history-info">
            <span class="long">${item.long}</span>
            <span class="short">${item.short}</span>
        </div>
        <button class="copy-small" onclick="copyToClipboard('${item.short}')">Copy</button>
    </div>`).join('');
}

function showResult(url) {
    document.getElementById('main-form').classList.add('hidden');
    document.getElementById('result-display').classList.remove('hidden');
    document.getElementById('generated-link').innerText = url;
}

function backToInput() {
    document.getElementById('main-form').classList.remove('hidden');
    document.getElementById('result-display').classList.add('hidden');
    document.getElementById('url-input').value = '';
}
function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Link copied!");
} 
