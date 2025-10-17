// Stage und Layer
const stage = new Konva.Stage({
    container: 'stage-container',
    width: W,
    height: H
});
const layer = new Konva.Layer();
stage.add(layer);

// --- Hintergrund-Image ---
let bgImage = new Konva.Image({
    x: 0,
    y: 0,
    width: W,
    height: H
});
layer.add(bgImage);

document.querySelectorAll('.bg-thumb').forEach(img => {
    img.addEventListener('click', () => {
        // Hintergrund wechseln
        loadBackground(img.dataset.src);

        // Markiere ausgewähltes Bild
        document.querySelectorAll('.bg-thumb').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// Optional: Standardauswahl markieren
document.querySelector('.bg-thumb').classList.add('selected');


// Funktion zum Laden eines Hintergrunds
function loadBackground(src) {
    const imageObj = new Image();
    imageObj.onload = function() {
        bgImage.image(imageObj);
        layer.batchDraw(); // Layer aktualisieren
    };
    imageObj.src = '/static/backgrounds/' + src; // Pfad ggf. anpassen
}

// Event Listener für das Hintergrund-Select
const bgSelect = document.getElementById('bgSelect');
bgSelect.addEventListener('change', () => {
    loadBackground(bgSelect.value);
});

// Standard-Hintergrund laden
loadBackground(bgSelect.value);

// --- Text hinzufügen ---
document.getElementById('addText').addEventListener('click', () => {
    const text = new Konva.Text({
        text: 'Dein Text',
        x: 50,
        y: 50,
        fontSize: 60,
        fontFamily: 'Arial',
        fill: '#000',
        draggable: true
    });
    layer.add(text);
    layer.draw();

    text.on('dblclick', () => {
        const textarea = document.createElement('textarea');
        textarea.value = text.text();
        textarea.style.position = 'absolute';
        textarea.style.left = stage.container().offsetLeft + text.x() + 'px';
        textarea.style.top = stage.container().offsetTop + text.y() + 'px';
        textarea.style.fontSize = text.fontSize() + 'px';
        document.body.appendChild(textarea);
        textarea.focus();

        textarea.addEventListener('blur', () => {
            text.text(textarea.value);
            document.body.removeChild(textarea);
            layer.draw();
        });
    });
});

// --- Headline mit Balken ---
document.getElementById('addHeadline').addEventListener('click', () => {
    const fontSize = 80;
    const barHeight = fontSize * 1.3;
    const group = new Konva.Group({ x: 50, y: 150, draggable: true });

    const bar = new Konva.Rect({
        width: 800,
        height: barHeight,
        fill: '#c7ff7a'
    });

    const headline = new Konva.Text({
        text: 'Headline',
        x: 20,
        y: (barHeight - fontSize) / 2,
        fontSize: fontSize,
        fontFamily: 'Arial',
        fill: '#000'
    });

    group.add(bar);
    group.add(headline);
    layer.add(group);
    layer.draw();
});

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
