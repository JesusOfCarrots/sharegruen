// Initialize Canvas
const canvas = new fabric.Canvas('editorCanvas', {
    selection: true,
    preserveObjectStacking: true
});

// CD BASICS
const FONT_FAMILY = 'Wix Made For Display';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#ffffff';
const COLOR_HELLGRUEN = '#c7ff7a';

//#region BACKGROUND
let bgImageObj = null;

function loadBackground(src) {
    fabric.Image.fromURL('/static/backgrounds/' + src, (img) => {
        img.set({
            left: 0, top: 0,
            selectable: false,
            evented: false
        });
        img.scaleToWidth(canvas.getWidth());
        img.scaleToHeight(canvas.getHeight());

        if (bgImageObj) {
            canvas.remove(bgImageObj);
        }
        bgImageObj = img;
        canvas.add(bgImageObj);

        canvas.sendToBack(bgImageObj);
        canvas.requestRenderAll();
    }, { crossOrigin: 'anonymous' });
}

// Click Thumbnails | Add selected class
document.querySelectorAll('.bg-thumb').forEach(img => {
    img.addEventListener('click', () => {
        loadBackground(img.dataset.src);
        document.querySelectorAll('.bg-thumb').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
    });
});

// Choose 1st Thumb
const firstThumb = document.querySelector('.bg-thumb');
if (firstThumb) {
    firstThumb.classList.add('selected');
    loadBackground(firstThumb.dataset.src);
}
//#endregion

//#region SIDEBAR
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

    if (obj.type === 'textbox') {
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = obj.text || '';
        textInput.addEventListener('input', () => {
            obj.text = textInput.value;
            canvas.requestRenderAll();
        });
        addLabelInput("Text:", textInput);

        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '8';
        sizeInput.value = obj.fontSize || 60;
        sizeInput.addEventListener('input', () => {
            obj.fontSize = Number(sizeInput.value || 60);
            canvas.requestRenderAll();
            if (obj._isHeadlineChild && obj._parentGroup) {
                updateHeadlineBar(obj._parentGroup);
            }
        });
        addLabelInput('Schriftgröße:', sizeInput);

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = toHex(obj.fill || COLOR_BLACK);
        colorInput.addEventListener('input', () => {
            obj.set({ fill: colorInput.value });
            canvas.requestRenderAll();
        });
        addLabelInput('Farbe:', colorInput);
    }

    if (obj.type === 'group' && obj._isHeadlineGroup) {
        const tb = obj._headlineText;
        const textInput = document.createElement('textarea');
        textInput.rows = 3;
        textInput.value = tb.text || 'Headline';
        textInput.addEventListener('input', () => {
            tb.text = textInput.value;
            canvas.requestRenderAll();
            updateHeadlineBar(obj);
        });
        addLabelInput("Headline:", textInput);

        const sizeInput = document.createElement('input');
        sizeInput.type = 'number';
        sizeInput.min = '12';
        sizeInput.value = tb.fontSize || 80;
        sizeInput.addEventListener("input", () => {
            tb.fontSize = Number(sizeInput.value || 80);
            tb.set('lineHeight', 1.3);
            canvas.requestRenderAll();
            updateHeadlineBar(obj);
        });
        addLabelInput('Schriftgröße:', sizeInput);

        const barSelect = document.createElement('select');
        [['Weiß', COLOR_WHITE], ["Hellgrün", COLOR_HELLGRUEN]].forEach(([label, val]) => {
            const opt = document.createElement('option');
            opt.value = val; opt.textContent = label;
            barSelect.appendChild(opt);
        });
        barSelect.value = obj._barRect.fill || COLOR_HELLGRUEN;
        barSelect.addEventListener('change', () => {
            obj._barRect.set('fill', barSelect.value);
            canvas.requestRenderAll();
        });
        addLabelInput('Balkenfarbe:', barSelect);
    }
}
//#endregion

function toHex(color) {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.fillStyle = color;
    return ctx.fillStyle;
}

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

//#region ADD TEXT
document.getElementById('addText').addEventListener('click', () => {
    const tb = new fabric.Textbox('Dein Text', {
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

 function createHeadlineGroup() {
    const fontSize = 80;
    const lineHeight = 1.3;
    const padX = 20;

    const text = new fabric.Textbox('Headline', {
        left: 0, top: 0,
        fontSize,
        lineHeight,
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        fill: COLOR_BLACK,
        editable: true
    });

    const bar = new fabric.Rect({
        left: -padX,
        top: (text.top + text.height - (fontSize * lineHeight)),
        width: text.width + padX * 2,
        height: fontSize * lineHeight,
        fill: COLOR_HELLGRUEN,
        selectable: false,
        evented: false
    });

    const group = new fabric.Group([bar, text], {
        left: 50, top: 150
    });

    group._isHeadlineGroup = true;
    group._headlineText = text;
    group._barRect = bar;
    text._isHeadlineChild = true;
    text._parentGroup = group;

    return group;
}

function updateHeadlineBar(group) {
    const text = group._headlineText;
    const bar = group._barRect;
    const padX = 20;

    text.set({ width: undefined });
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
    if (bgImageObj) canvas.sendToBack(bgImageObj);
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const dataURL = canvas.toDataURL({ format: 'png', enableRetinaScaling: true });
    const res = await fetch('/export', {
        method: 'POST',
        headers: { 'Content-Type': "application/json" },
        body: JSON.stringify({ dataURL })
    });
    const json = await res.json();
    if (json.url) {
        window.location.href = json.url;
    } else {
        alert('Export fehlgeschlagen.');
    }
});
//#endregion
