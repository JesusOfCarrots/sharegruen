// --- Stage und Layer ---
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

// --- Hintergrund laden ---
function loadBackground(src) {
    const imageObj = new Image();
    imageObj.onload = function() {
        bgImage.image(imageObj);
        layer.batchDraw(); // Layer aktualisieren
    };
    imageObj.src = '/static/backgrounds/' + src;
}

// --- Hintergrund-Thumbnails ---
const thumbs = document.querySelectorAll('.bg-thumb');
thumbs.forEach(img => {
    img.addEventListener('click', () => {
        loadBackground(img.dataset.src);

        thumbs.forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// Standard-Hintergrund laden
const firstThumb = thumbs[0];
firstThumb.classList.add('selected');
loadBackground(firstThumb.dataset.src);



// Select Node
let selectedNode = null;

function showProperties(node){
    const container = document.getElementById('properties');
    container.innerHTML = ''; //delete prevois content

    if (node instanceof Konva.Text){
        const inputText = document.createElement('input');
        inputText.type = 'text';
        inputText.value = node.text();
        inputText.addEventListener('input', () => {
            node.text(inputText.value);
            layer.batchDraw();
        });
        container.appendChild(document.createTextNode('Text:'));
        container.appendChild(inputText);

        //Font Size
        const inputFont = document.createElement('input');
        inputFont.type = 'number';
        inputFont.value = node.fontSize();
        inputFont.addEventListener('input', () => {
            node.fontSize(Number(inputFont.vaule));
            layer.batchDraw();
        });
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createTextNode('Font Size:'));
        container.appendChild(inputFont);

        //Color
        const inputColor = document.createElement('input');
        inputColor.type = 'color';
        inputColor.value = rgbToHex(node.fill());
        inputColor.addEventListener('input', () => {
            node.fill(inputColor.value);
            layer.batchDraw();
        });
        container.appendChild(document.createElement('br'));
        container.appendChild(document.createTextNode('Farbe:'));
        container.appendChild(inputColor);
    }
}

function rgbToHex(color) {
    const ctx = document.createElement("canvas").getContext("2d");
    ctx.fillStyle = color;
    return ctx.fillStyle;
}

//Node select 
stage.on('click', (e) => {
    if (e.target === stage) {
        selectedNode = null;
        document.getElementById('properties').innerHTML = '<p>Wähle ein Element aus, um es zu bearbeiten.</p>';
        return;
    }
    selectedNode = e.target;
    showProperties(selectedNode);
});

// --- Text hinzufügen ---
document.getElementById('addText').addEventListener('click', () => {
    const text = new Konva.Text({
        text: 'Dein Text',
        x: 50,
        y: 50,
        fontSize: 60,
        fontFamily: 'Wix Made For Display',
        fill: '#000',
        draggable: true
    });
    layer.add(text);
    layer.draw();
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
        fontFamily: 'Wix Made For Display',
        fill: '#000'
    });

    group.add(bar);
    group.add(headline);
    layer.add(group);
    layer.draw();
});


