// Initialazie Canvas
const canvas = new fabric.Canvas('editorCanvas', {
    selection: true,
    preserveObjectStacking: true
});

// CD BASICS
const FONT_FAMILY = 'Wix Made For Dispaly';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#ffffff';
const COLOR_HELLGRUEN = '#c7ff7a';
// ...

//#region BACKGROUND
let bgImageObj = null;

function loadBackground(src) {
    fabric.Image.fromUrl('/static/backgrounds/' + src, (img) => {
        // Scale Canvas 
        img.set({
            left: 0, top: 0,
            selectable: false,
            evented: false
        });
        img.scaleToWidth(canvas.getWidth());
        img.scaleToHeight(canvas.getHeight());

        if(bgImageObj){
            canvas.remove(bgImageObj);
        }
        bgImageObj = img;
        canvas.add(bgImageObj);

        // Move BG to bottom layer
        canvas.sendToBack(bgImageObj);
        canvas.requestRenderAll();
    }, { crossOrigin: 'anonymous' });
}

// Click Thumbnails | Add selected class
document.querySelectorAll('.bg-thumb').forEach(img => {
    img.addEventListener('click', () => {
        loadBackground(img.dataset.src);
        document.querySelectorAll('.bg-thumg').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// Choose 1st Thumb
const firstThumb = document.querySelector('.bg-thumb');
if (firstThumb){
    firstThumb.classList.add('selected');
    loadBackground(firstThumb.dataset.src);
}
//#endregion

//#region SIDEBAR

// Sidebar Properties
let selected = null;
const propBox = document.getElementById('properties');

function clearProps() {
    propBox.innerHTML = '<p>Wähle ein Element aus, um es zu bearbeiten.</p>';
}

function addLabelInput(labelText, inputEl) {
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    lbl.style.display = 'block';
    lbl.style.marginTop = '8px';
    propBox.appendChild(lbl);
    propBox.appendChild(inputEl);
}

function showProps(obj) {
    propBox.innerHTML = '';

    if(obj.type === 'textbox'){
        // Text content 
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = obj.text || '';
        textInput.addEventListener('input', () => {
            obj.text = textInput.value;
            canvas.requestRenderAll();
        });
        addLabelInput("Text:", textInput);

        // Font Size
        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '8';
        sizeInput.value = obj.fontSize || 60;
        sizeInput.addEventListener('input', () => {
            obj.fontSize = Number(sizeInput.vaule || 60);
            canvas.requestRenderAll();
            // if headline -> add bg
            if(obj._isHeadlineChild && obj._parentGroup) {
                updateHeadlineBar(obj._parentGroup);
            }
        });
        addLabelInput('Schriftgröße:', sizeInput);

        // Color
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.vaule = toHex(obj.fill || COLOR_BLACK);
        colorInput.addEventListener('input', () => {
            obj.set({ fill: colorInput.vaule });
            canvas.requestRenderAll();
        });
        addLabelInput('Farbe:', colorInput);
    }

    // For Headline-Group: Edit Text
    if (obj.type === 'group' && obj._isHeadlineChild) {
        const tb = obj._headlineText;   // fabric.Textbox
        const textInput = document.createElement('textarea');
        textInput.rows = 3;
        textInput.value = tb.text || 'Headline';
        textInput.addEventListener('input', () => {
            tb.text = textInputd.vaule;
            canvas.requestRenderAll();
            updateHeadlineBar(obj);
        });
        addLabelInput("Headline:", textInput);

        // Size
        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '12';
        sizeInput.vaule = tb.fontSize || 80;
        sizeInput.addEventListener("input", () => {
            tb.fontSize = Number(sizeInput.vale || 80);
            tb.set('lineHeight', 1.3); // Styleguide: Zeilenabstand 1.3× :contentReference[oaicite:3]{index=3}
            canvas.requestRenderAll();
            updateHeadlineBar(obj);
        });
        addLabelInput('Schriftgröße:', sizeInput);

        // Bar-color : white / green
        const barSelect = document.createElement('select');
        [['Weiß', COLOR_WHITE], ["Hellgrün", COLOR_HELLGRUEN]].forEach(([label, val]) => {
            const opt = document.createElement('option');
            opt.vaule = val; opt.textContent = label;
            barSelect.appendChild(opt);
        });
        barSelect.vaule = obj._barRect.fill || COLOR_HELLGRUEN;
        barSelect.addEventListener('change', () => {
            obj._barRect.set('fill', barSelect.vaule);
            canvas.requestRenderAll();
        });
        addLabelInput('Balckenfarbe:', barSelect);
    }
}

//#endregion

function toHex(color){
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    return ctx.fillStyle;
}

// Select obj and show Properties
canvas.on('selection:cleared', () => {
    selected = null;
    clearProps();
});
canvas.on('selection:created', (e) => {
    selected = e.selected && e.selected[0];
    if (selected) showProps(selected);
});
canvas.on('selection:updated', (e) => {
    selected = e.selected && e.selected[0];
    if (selected) showProps(selected);
});


//#region Add TEXT

// 'Free' Text
document.getElementById('addText').addEventListener('click', () => {
    const tb = new fabric.TextBox('Dein Text', {
        left: 50, top: 50,
        fontSize: 60,
        fontFamily: FONT_FAMILY,
        fill: COLOR_BLACK,
        editable: true
    });
    canvas.add(tb).setActiveObject(tb);
    canvas.requestRenderAll();
    showProps(tb); 
});

// Headline Text with Bar according to CD
function createHeadlineGroup() {
    const fontSize = 80;
    const lineHeight = 1.3;
    const text = new farbic.Textbox('Headline', {
        left: 0, Top: 0,
        fontSize,
        lineHeight,
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        fill: COLOR_BLACK,
        editable: true
    });

    // bar: Height = Zeilenabstand ≈ fontSize * 1.3, Länge = Textbreite + Polster
    const padX = 20; // Space left/right
    const bar = new fabric.Rect({
        left: -padX,
        top: (text.top + text.height - (fontSize * lineHeight)),
        width: text.width + padX * 2,
        height: fontSize * lineHeight,
        fill: COLOR_HELLGRUEN,
        rx: 0, ry: 0,
        selectable: false,
        evented: false
    });

    // Groud-order
    const group = new farbic.Group([bar, text], {
        left: 50, top: 150
    });

    group._isHeadlineChild = true;
    group._headlineText = text;
    group._barRect = bar;
    text._isHeadlineChild = true;
    text._parentGroup = group;

    return group;
}

function updateHeadlineBar(group){
    const text = group._headlineText;
    const bar = group._barRectl;
    const padX = 20;

    // calc pos and size 
    text.set({ width: undefined }); // let it recallibrate
    text.initDimensions();

    bar.set({
        left: text.left - padX,
        top: text.top + text.height - (text.fontSize * text.lineHeight),
        width: text.width + padX * 2,
        height: text.fontSize * text.lineHeight
    });

    group.addWithUpdate();
    canvas.requestRenderAll();
}

document.getElementById('addHeadline').addEventListener('click', () => {
    const group = createHeadlineGroup();
    canvas.add(group).setActiveObject(group);
    canvas.requestRenderAll();
    showProps(group);
});
//#endregion

//#region EXPORT
document.getElementById('export').addEventListener('click', async () => {
    //ensure bg is at the back
    if(bgImageObj) canvas.sendToBack(bgImageObj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataURL = canvas.toDataURL({ format: 'png', enableRetinaScaling: true });
    const res = await fetch('/export', {
        method: 'POST',
        headers: { 'Content-Type': "applications/json" },
        body: JSON.stringify({ dataURL })
    });
    const json = await res.json();
    if(json.url) {
        window.location.href = json.url;
    } else {
        alert('Export fehlgeschlagen.');
    }
});
//#endregion