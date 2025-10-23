// Initialize Canvas
const canvas = new fabric.Canvas('editorCanvas', {
    selection: true,
    preserveObjectStacking: true
});

//#region CD BASICS
const FONT_FAMILY = 'Wix Made For Display';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#ffffff';
const COLOR_HELLGRUEN = '#c7ff7a';
const COLOR_LILA = '#9f88ff';
const COLOR_PINK = '#f28ade';
const COLOR_ORANGE = '#ff8568';
const COLOR_DUNKELGRUEN = '#33c270';

// Map of dark and bright bgs for Logo 
const DARK_BACKGROUNDS = [
    'GJ_dunkelGruen.png',
    'GJ_Lila.png',
    'GJ_Orange.png',
    'GJ_Pink.png'
];


//#region BACKGROUND
let bgImageObj = null;

function loadBackground(src) {
    const imgURL = '/static/backgrounds/' + src;

    fabric.Image.fromURL(imgURL, (img) => {
        const cw = canvas.getWidth();
        const ch = canvas.getHeight();
        const scale = Math.max(cw / img.width, ch / img.height);

        img.set({
            left: (cw - img.width * scale) / 2,
            top: (ch - img.height * scale) / 2,
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false,
            scaleX: scale,
            scaleY: scale
        });

        if (bgImageObj) {
            canvas.remove(bgImageObj);
        }
        img._bgSrc = src;
        
        bgImageObj = img;
        canvas.add(bgImageObj);
        canvas.sendToBack(bgImageObj);
        canvas.requestRenderAll();

        const isDark = DARK_BACKGROUNDS.includes(src);
        const variant = isDark ? 'light' : 'dark';
        updateKVLogoVariant(variant);

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

    // POS 
    if(obj._isPictogram || obj._isHeadlineGroup || obj instanceof fabric.Textbox || obj instanceof fabric.Image) {
        // X
        const xInput = document.createElement('input');
        xInput.type = 'number';
        xInput.value = Math.round(obj.left || 0);
        xInput.style.width = '80px';
        xInput.addEventListener('input', () => {
            obj.set({ left: parseFloat(xInput.value) });
            obj.setCoords();
            canvas.requestRenderAll();
        });

        // Y
        const yInput = document.createElement('input');
        yInput.type = 'number';
        yInput.value = Math.round(obj.top || 0);
        yInput.style.width = '80px';
        yInput.addEventListener('input', () => {
            obj.set({ top: parseFloat(yInput.value) });
            obj.setCoords();
            canvas.requestRenderAll();
        });

        // Add labels
        addLabelInput('Abstand von links (X)', xInput);
        addLabelInput('Abstand von links (Y)', yInput);

        // refresh 
        obj.on('moving', () => {
            xInput.value = Math.round(obj.left);
            yInput.value = Math.round(obj.top);
        });
    }


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
        textInput.value = tb.text || '';
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

    // SVG Color
    if (obj._isPictogram) { 
        const svgColor = document.createElement('input'); 
        svgColor.type = 'color'; 

        svgColor.value = toHex(COLOR_BLACK); 
        svgColor.addEventListener('input', () => { 
            for (var i = 0; i < obj._objects.length; i++) {
                obj._objects[i].set({
                    fill: svgColor.value
                });
        }
        canvas.requestRenderAll();
        }); 
        addLabelInput('Farbe:', svgColor);
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
        left: 68, top: 540,
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
    const fontSize = 90;
    const lineHeight = 1.3;
    const padX = 20;


    const text = new fabric.Textbox('', {
        left: 68 - (padX *2 + 2), top: 0,
        fontSize,
        lineHeight: lineHeight,
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        fill: COLOR_BLACK,
        editable: true
    });

    text.initDimensions();

    const bar = new fabric.Rect({
        left: -padX,
        top: text.top + text.height - text.fontSize * lineHeight,
        width: text.width + padX * 2,
        height: fontSize * lineHeight,
        fill: COLOR_HELLGRUEN,
        selectable: false,
        evented: false
    });

    

    const group = new fabric.Group([bar, text], {
        left: 50, top: 150,
    });

    group._isHeadlineGroup = true;
    group._headlineText = text;
    group._barRect = bar;
    text._isHeadlineChild = true;
    text._parentGroup = group;

    text.on('changed', () => updateHeadlineBar(group));
    text.on('modified', () => updateHeadlineBar(group));
    group.on('scaled',   () => updateHeadlineBar(group))

    // ensure correct Bar size after fonts loaded
    document.fonts.ready.then(() => {
        updateHeadlineBar(group);
        canvas.requestRenderAll();
    });

    return group;
}

function updateHeadlineBar(group) {
    const text = group._headlineText;
    const bar = group._barRect;
    const padX = 20;

    text.initDimensions();
    const textWidth = text.width;
    const textHeight = text.fontSize * text.lineHeight;

    bar.set({
        left: text.left - padX,
        top: text.top + (text.height - textHeight) / 2 - 2,
        //top: text.top + text.height - textHeight,
        width: textWidth + padX * 2,
        height: textHeight,
        visible: true
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


//#region  KV LOGO
function addKVLogo(kvName) {
    const url = `/kvlogo/${encodeURIComponent(kvName)}`;

    const existing = canvas.getObjects().find(o => o._isKVLogo);
    if(existing) canvas.remove(existing);

    fabric.loadSVGFromURL(url, (objects, options) => {
    // Gruppe aus SVG-Objekten bilden
    const logo = fabric.util.groupSVGElements(objects, options);

    logo._isKVLogo = true;
    logo._kvName = kvName; // for when reloading it because auf bg
    // Erst einmal korrekt zusammenfassen
    logo.set({
      originX: 'left',
      originY: 'bottom'
    });

    const desiredWidth = W * 0.3;
    const scale = desiredWidth / logo.width;

    logo.scale(scale);

    // Position: unten links mit 40px Abstand
    logo.set({
      left: 40,
      top: H - 40, // Position von unten
      selectable: false,
      evented: false
    });

    // In Canvas einfügen
    canvas.add(logo);
    canvas.bringToFront(logo);
    canvas.requestRenderAll();

    // correct logo color
    if (bgImageObj && bgImageObj._bgSrc) {
        const isDark = DARK_BACKGROUNDS.includes(bgImageObj._bgSrc);
        const variant = isDark ? 'light' : 'dark';
        updateKVLogoVariant(variant);
    }
  });
}

function updateKVLogoVariant(variant) {
    const existingLogo = canvas.getObjects().find(o => o._isKVLogo);
    if (!existingLogo || !existingLogo._kvName) return;

    const kvName = existingLogo._kvName;

    // Altes Logo entfernen
    canvas.remove(existingLogo);

    // Neues Logo laden
    const url = `/kvlogo/${encodeURIComponent(kvName)}`;
    fabric.loadSVGFromURL(url, (objects, options) => {
        const logo = fabric.util.groupSVGElements(objects, options);
        logo._isKVLogo = true;
        logo._kvName = kvName;

        // Variante auswerten
        const fillColor = variant === "dark" ? COLOR_BLACK : COLOR_HELLGRUEN; // Weiß oder GJ-Grün

        // Alle Unterobjekte einfärben
        logo.getObjects().forEach(o => {
            if (o.fill) o.set({ fill: fillColor });
            if (o.stroke) o.set({ stroke: fillColor });
        });

        // Größe und Position
        const desiredWidth = W * 0.3;
        const scale = desiredWidth / logo.width;
        logo.scale(scale);

        logo.set({
            originX: "left",
            originY: "bottom",
            left: 40,
            top: H - 40,
            selectable: false,
            evented: false
        });

        // In Canvas einfügen
        canvas.add(logo);
        canvas.bringToFront(logo);
        canvas.requestRenderAll();
    });
}

//#endregion


//#region Pictogramme 
async function piktogramme() {
    const overlay = document.getElementById("picto-overlay");
    const grid = document.getElementById("pictoGrid");
    const search = document.getElementById("pictoSearch");
  
    overlay.style.display = 'flex';
    grid.innerHTML = '<p>Lade...</p>';
  
    // get all pictos
    const res = await fetch('/piktogramme');
    const files = await res.json();
  
    renderPictos(files);
  
    // Filter search
    search.addEventListener('input', () => {
      const term = search.value.toLowerCase();
      const filtered = files.filter(f => f.toLowerCase().includes(term));
      renderPictos(filtered);
    });
  
    function renderPictos(list) {
      grid.innerHTML = '';
      list.forEach(filename => {
        const div = document.createElement('div');
        div.className = 'picto-item';
        div.innerHTML = `
          <img src="/static/piktogramme/${filename}" alt="${filename}">
          <span>${filename.replace('.svg', '')}</span>
        `;
        div.addEventListener('click', () => {
          addPictogramToCanvas(`/static/piktogramme/${filename}`);
          overlay.style.display = 'none';
        });
        grid.appendChild(div);
      });
    }
  }
  
  function closePicto() {
    document.getElementById("picto-overlay").style.display = 'none';
  }
  
// add svg to canvas
function addPictogramToCanvas(url) {
    fabric.loadSVGFromURL(url, (objects, options) => {
        const svg = fabric.util.groupSVGElements(objects, options);
        const scale = 2;
  
        svg.set({
            //left: W / 2 - (svg.width * scale) / 2,
            left: 620,
            //top: H / 2 - (svg.height * scale) / 2,
            top: 742,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true
        });

        svg._isPictogram = true;

        canvas.add(svg);
        canvas.setActiveObject(svg);
        canvas.requestRenderAll();
    });
}

//#endregion


//#region Upload image
const uploadInput = document.getElementById('imgUploadInput');
const uploadBtn = document.getElementById('addImg');

uploadBtn.addEventListener('click', () => { uploadInput.click(); });

// upload to server
uploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const json = await res.json();
        if(json.url) {
            addUploadedImageToCanvas(json.url);
        } else{
            alert('Upload fehlgeschlagen.');
        }
    } catch (err) {
        console.error(err);
        alert('Fehler beim Hochladen');
    }

    // reset Input
    uploadInput.value = '';
});

function addUploadedImageToCanvas(url){
    fabric.Image.fromURL(url, (img) => {
        const maxWidth = W * 0.6;
        const scale = Math.min(maxWidth / img.width, 1);

        img.set({
            left: W / 2 - (img.width * scale) / 2,
            top: H / 2 - (img.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            selectable: true,
            evented: true
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
    }, { crossOrigin: 'anonymous' });
}

//#endregion

// Delete selected object
document.onkeydown = function(e) {
    switch (e.keyCode) {
      case 46: // delete
        canvas.remove(canvas.getActiveObject());
    }
}



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