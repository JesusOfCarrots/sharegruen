// --- Export ---
document.getElementById('export').addEventListener('click', async () => {
    const dataURL = stage.toDataURL({ pixelRatio: 2 });
    const res = await fetch('/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataURL })
    });
    const json = await res.json();
    if (json.url) {
        window.open(json.url, '_blank');
    }
});