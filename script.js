const STORAGE_KEY = 'ziplink_cache'; // Load history on page start 
let currentQRCodeLink = '';
window.onload = renderHistory;

function handleShorten() {
    let longUrl = document.getElementById('url-input').value.trim();
    if (!longUrl)
        return;

    // Clean the URL: add https:// if no protocol
    if (!longUrl.startsWith('http://') && !longUrl.startsWith('https://')) {
        alert('Please enter a valid URL.');
        return;
    }
    else {
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
}

function renderHistory() {
    const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    const listElement = document.getElementById('history-list');
    if (cache.length === 0) {
        listElement.innerHTML = '<p style="color: #475569; font-size: 0.8rem;">No recent links yet.</p>';
        return;
    }
    listElement.innerHTML = cache.map(item => {
        const longDisplay = truncateUrlDisplay(item.long, 100);
        const shortDisplay = truncateUrlDisplay(item.short, 40);
        return `
        <div class="history-item">
            <div class="history-info">
                <span class="long" title="${item.long}">${longDisplay}</span>
                <span class="short" title="${item.short}">${shortDisplay}</span>
            </div>
            <button class="copy-small" onclick="copyToClipboard('${item.short}')">Copy</button>
            <button style="margin-left: 10px;" class="copy-small" onclick="generateQRCode('${item.short}')">QR</button>
        </div>`;
    }).join('');
}

function truncateUrlDisplay(url, maxLength = 100) {
    if (url.length <= maxLength) return url;
    const prefix = url.slice(0, Math.max(8, maxLength - 8));
    return `${prefix}....`;
}

function showResult(url) {
    document.getElementById('main-form').classList.add('hidden');
    document.getElementById('result-display').classList.remove('hidden');
    const display = truncateUrlDisplay(url, 40);
    const linkEl = document.getElementById('generated-link');
    linkEl.innerHTML = `<a href="${url}" target="_blank" rel="noreferrer noopener" title="${url}">${display}</a>`;
}

function generateQRCode(url) {
    currentQRCodeLink = url || '';
    const modal = document.getElementById('qr-modal');
    const display = document.getElementById('qr-code-display');
    display.innerHTML = '';

    if (!currentQRCodeLink) {
        display.innerText = 'Invalid URL';
        return;
    }

    new QRCode(display, {
        text: currentQRCodeLink,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    modal.classList.remove('hidden');
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    modal.classList.add('hidden');
}

function downloadQRCode() {
    const display = document.getElementById('qr-code-display');
    const img = display.querySelector('img');
    const canvas = display.querySelector('canvas');

    let dataUrl;
    if (img && img.src) {
        dataUrl = img.src;
    } else if (canvas) {
        dataUrl = canvas.toDataURL('image/png');
    }

    if (!dataUrl) {
        alert('QR code not ready yet.');
        return;
    }

    const anchor = document.createElement('a');
    anchor.href = dataUrl;
    anchor.download = `ziplink-qrcode-${Date.now()}.png`;
    anchor.click();
}

function backToInput() {
    document.getElementById('main-form').classList.remove('hidden');
    document.getElementById('result-display').classList.add('hidden');
    document.getElementById('url-input').value = '';
}

function copyToClipboard(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert('Link copied!');
} 
