fabric.devicePixelRatio = 1;

// Initialize Canvas
const canvas = new fabric.Canvas('editorCanvas', {
    selection: true,
    preserveObjectStacking: true,
    width: W,
    height: H,
    enableRetinaScaling: false 
});
canvas.setDimensions({ W, H });
canvas.setZoom(1);
canvas.getElement().style.width  = `${W}px`;
canvas.getElement().style.height = `${H}px`;

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
    return new Promise((resolve) => {
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

            // update Logo color
            const isDark = DARK_BACKGROUNDS.includes(src);
            const variant = isDark ? 'light' : 'dark';
            updateKVLogoVariant(variant);

            // Update Bar color
            refreshAllHeadlineBarColors();

            resolve(variant);
        }, { crossOrigin: 'anonymous' });
    });
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
                updateMultiLineHeadline(obj._parentGroup);
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
        const lineGroups = obj._lineGroups || [];
        const firstLine = lineGroups[0]?._headlineText;

        // headline Text
        const textInput = document.createElement('textarea');
        textInput.rows = Math.max(3, obj._lineGroups.length || 1);
        textInput.value = lineGroups.map(lg => lg._headlineText.text).join('\n');;
        textInput.style.width = '100%';
        textInput.addEventListener('input', () => {
            updateMultiLineText(obj, textInput.value);
        });
        addLabelInput("Headline:", textInput);

        // Bar Color
        if(lineGroups.length > 0){
            const barSelect = document.createElement('select');
            [
                ['Weiß', COLOR_WHITE],
                ["Hellgrün", COLOR_HELLGRUEN]
            ].forEach(([label, val]) => {
                const opt = document.createElement('option');
                opt.value = val;
                opt.textContent = label;
                barSelect.appendChild(opt);
            });
            barSelect.value = lineGroups[0]._barRect.fill || COLOR_HELLGRUEN;
            barSelect.addEventListener('change', () => {
                lineGroups.forEach(lg => lg._barRect.set({ fill: barSelect.value }));
                canvas.requestRenderAll();
            });
            addLabelInput('Balkenfarbe:', barSelect);
        }
    }

    // SVG Color
    if (obj._isPictogram) { 
        const svgColor = document.createElement('input'); 
        svgColor.type = 'color'; 

        svgColor.value = toHex(COLOR_BLACK); 
        svgColor.addEventListener('input', () => { 
            if (!obj) return; // sanity check
            obj.set({ fill: svgColor.value });    

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
        editable: true,
        width: W - 160
    });
    canvas.add(tb).setActiveObject(tb);
    canvas.requestRenderAll();
    showProps(tb);
});

function createHeadlineGroupMultiLine(textValue = ' ') {
    const fontSize = 90;
    const lineHeight = 1.3;
    const padX = 20;
    const padY = 10;
    const rawLines = textValue.split(/\r?\n/);
    const lines = rawLines.map(l => l.trim() === "" ? " " : l.trim());

    const lineGroups = [];

    // Determine bar color (background-dependent)
    const barColor = bgImageObj && bgImageObj._bgSrc === 'GJ_Gruen.png' ? COLOR_WHITE : COLOR_HELLGRUEN;
    
    let yOffset = 0;

    for (const line of lines) {
        const safeText = line === "" ? " " : line;

        const text = new fabric.Text(safeText, {
            left: padX,
            top: yOffset + padY,
            fontSize,
            lineHeight,
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fill: COLOR_BLACK,
            editable: true
        });
        text.initDimensions();

        const textHeight = text.fontSize * text.lineHeight;

        const bar = new fabric.Rect({
            left: 0,
            top: yOffset,
            width: text.width + padX * 2,
            height: textHeight + padY * 2,
            fill: barColor,
            selectable: false,
            evented: false
        });

        const lineGroup = new fabric.Group([bar, text], {
            left: 0,
            top: yOffset,
            subTargetCheck: true,
            objectCaching: false
        });

        lineGroup._isHeadlineLine = true;
        lineGroup._barRect = bar;
        lineGroup._headlineText = text;

        lineGroups.push(lineGroup);

        yOffset += textHeight + padY * 2 + 10; // spacing between lines
    }

    const fullGroup = new fabric.Group(lineGroups, {
        left: 50,
        top: 150,
        subTargetCheck: true,
        objectCaching: false
    });

    fullGroup._isHeadlineGroup = true;
    fullGroup._lineGroups = lineGroups;

    // auto refresh bars on text change
    lineGroups.forEach(lg => {
        const t = lg._headlineText;
        t.on("changed", () => updateMultiLineHeadline(fullGroup));
        t.on("modified", () => updateMultiLineHeadline(fullGroup));
    });

    return fullGroup;
}

function updateMultiLineHeadline(group){
    const padX = 20;
    const padY = 10;
    const lineSpacing = -3;

    let yOffset = 0;

    for (const lg of group._lineGroups) {
        const text = lg._headlineText;
        const bar = lg._barRect;

        text.initDimensions();
        const textHeight = text.fontSize * text.lineHeight;

        bar.set({
            width: text.width + padX * 2,
            height: textHeight + padY * 2,
            top: yOffset,
            left: 0
        });

        text.set({
            top: yOffset + padY,
            left: padX
        });

        lg._calcBounds();
        lg._updateObjectsCoords();

        yOffset += textHeight + padY * 2 + lineSpacing;
    }

    group._calcBounds();
    group._updateObjectsCoords();
    canvas.requestRenderAll();
}

function updateMultiLineText(group, newText) {
    // remember old pos
    const oldLeft = group.left;
    const oldTop = group.top;

    const rawLines = newText.split(/\r?\n/);
    const lines = rawLines.map(l => l.trim() === "" ? " " : l.trim());
    const padX = 20;
    const lineSpacing = -3;

    // Remove old lines from canvas group
    group._lineGroups.forEach(lg => lg.destroy && lg.destroy());
    group._lineGroups = [];

    let yOffset = 0;
    const barColor = bgImageObj && bgImageObj._bgSrc === 'GJ_Gruen.png'
        ? COLOR_WHITE
        : COLOR_HELLGRUEN;

    const newLineGroups = [];

    for (const line of lines) {
        const safeText = line === "" ? " " : line;

        const text = new fabric.Text(safeText, {
            left: padX,
            top: yOffset,
            fontSize: 90,
            lineHeight: 1.3,
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fill: COLOR_BLACK,
            editable: true
        });
        text.initDimensions();

        const textHeight = text.fontSize * text.lineHeight;

        const bar = new fabric.Rect({
            left: 0,
            top: yOffset + (text.height - textHeight) / 2 - 2,
            width: text.width + padX * 2,
            height: textHeight,
            fill: barColor,
            selectable: false,
            evented: false
        });

        const lineGroup = new fabric.Group([bar, text], {
            left: 0,
            top: yOffset,
            subTargetCheck: true,
            objectCaching: false
        });

        lineGroup._isHeadlineLine = true;
        lineGroup._barRect = bar;
        lineGroup._headlineText = text;

        newLineGroups.push(lineGroup);
        yOffset += textHeight + lineSpacing;
    }

    // Replace objects in the main group
    group._lineGroups = newLineGroups;
    // remove old children frist
    group._objects.length = 0;
    newLineGroups.forEach(lg => group.addWithUpdate(lg));

    // Recalculate and reposition
    group._calcBounds();
    group._updateObjectsCoords();
    group.set({ left: oldLeft, top: oldTop });
    group.setCoords();
    canvas.requestRenderAll();
}

function refreshAllHeadlineBarColors() {
    const isWhite = bgImageObj && bgImageObj._bgSrc === 'GJ_Gruen.png';
    const newColor = isWhite ? COLOR_WHITE : COLOR_HELLGRUEN;

    canvas.getObjects().forEach(o => {
        if (o._isHeadlineGroup) {
            o._lineGroups.forEach(lg => {
                lg._barRect.set({ fill: newColor });
            });
        }
    });

    canvas.requestRenderAll();
}

document.getElementById('addHeadline').addEventListener('click', () => {
    const group = createHeadlineGroupMultiLine(" ");
    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.requestRenderAll();

    setTimeout(() => {
        showProps(group);
    }, 50);
});

// function for autopilot
function createSingleHeadline(lineText = ""){
    const fontSize = 90;
    const lineHeight = 1.3;
    const padX = 20;

    const text = new fabric.Text(lineText.trim(), {
        left: padX,
        top: 0,
        fontSize,
        lineHeight,
        fontFamily: FONT_FAMILY,
        fontWeight: 800,
        fill: COLOR_BLACK,
        editable: true
    });
    text.initDimensions();

    const textHeight = text.fontSize * text.lineHeight;

    const barColor = bgImageObj && bgImageObj._bgSrc === 'GJ_Gruen.png' ? COLOR_WHITE : COLOR_HELLGRUEN;

    const bar = new fabric.Rect({
        left: 0,
        top: (text.height - textHeight) / 2 - 2,
        width: text.width + padX * 2,
        height: textHeight,
        fill: barColor,
        selectable: false,
        evented: false
    });

    const group = new fabric.Group([bar, text], {
        left: 50,
        top: 150,
        subTargetCheck: true,
        objectCaching: false
    });

    group._isHeadlineGroup = true;
    group._barRect = bar;
    group._headlineText = text;
    group._lineGroups = [group];

    return group;
}
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

    const maxSizeMB = 5;
    if(file.size > maxSizeMB * 1024 * 1024) {
        alert(`Die Datei ist zu groß! Maximal erlaubt sind ${maxSizeMB} MB.`);
        uploadInput.value = '';
        return;
    }

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


//#region Autopilot
const autopilotData = {
        kv: '',
        headline: '',
        text: ''
        // pictogram
    };
    const autopilotSteps = [
        {
            type: 'intro',
            html: `
                <h2>Herzlich willkommen zum Autopiloten des Sharepic Generators. 🥳</h2>
                <p>Nenne die Informationen, die auf dem Sharepic sein sollen, den Namen deines KV, und es wird automatisch ein passendes Sharepic erstellt!</p>
                <p>Bitte beachte, dass das ein experimentelles Feature ist.</p>
                <button id="closeAutopilotBtn" onclick='closeAutopilot()'>Schließen</button>
            `
        },
        {
            question: 'Wie heißt dein Kreisverband?',
            key: 'kv',
            placeholder: 'z.B: Duisburg'
        },
        {
            question: 'Was ist der Anlass des Sharepics?',
            key: 'headline',
            placeholder: 'z.B: Bundeskongress Plenum'
        },
        {
            question: 'Was? Wann? Wie? Wo? Wer?',
            key: 'text',
            placeholder: 'Grüne Geschäftsstelle, \nPhilosophenweg 2, \n19:30 Uhr'
        },
        {
            type: 'outro',
            html: `
                <h2>Was fehlt noch?</h2>
                <p>Füge gerne noch ein Piktogramm oder Bild hinzu :) </p>
                <div class="autopilot-export-container">
                    <label>
                        <input type="checkbox" id="autopilot-export" checked />
                        Automatisch exportieren (PNG nach Abschluss herunterladen)
                    </label>
                </div>
            `
        }
    ];
let autopilotStepIndex = 0;

function startAutopilotDialouge() {
    const overlay = document.getElementById("autopilot-overlay");
    overlay.style.display = 'flex';
    showAutopilotStep(0);
}

function showAutopilotStep(index) {
    const screen = document.getElementById('autopilot-content');
    const prevBtn = document.getElementById('autopilot-prev');
    const nextBtn = document.getElementById('autopilot-next');

    autopilotStepIndex = index;
    const step = autopilotSteps[index];

    // Intro-Slide
    if (step.type === 'intro' || step.type === 'outro') {
        screen.innerHTML = step.html;
    } else {
        // KV = input
        if(step.key === 'kv'){
            screen.innerHTML = `
                <h2>${step.question}</h2>
                <input type="text" id="autopilot-input" placeholder="${step.placeholder}" 
                    value="${autopilotData[step.key] || ''}">
            `;
        }
        // Headline oder Text = Textarea
        else{
            screen.innerHTML = `
                <h2>${step.question}</h2>
                <textarea id="autopilot-input" placeholder="${step.placeholder}" rows="4">${autopilotData[step.key] || ''}</textarea>
            `;
        }
    }

    prevBtn.style.display = index > 0 ? 'inline-block' : 'none';
    nextBtn.textContent = (index === autopilotSteps.length - 1) ? 'Fertig' : 'Weiter';
}

document.getElementById('autopilot-next').addEventListener('click', () => {
    const step = autopilotSteps[autopilotStepIndex];

    if(step.key){
        const input = document.getElementById('autopilot-input');
        autopilotData[step.key] = input.value.trim();
    }

    if(autopilotStepIndex < autopilotSteps.length - 1) {
        showAutopilotStep(autopilotStepIndex+1);
    }else{
        const exportCheckbox = document.getElementById('autopilot-export');
        const shouldExport = exportCheckbox ? exportCheckbox.checked : false;
        autopilotData.autoExport = shouldExport;
        runAutopilot(shouldExport);
    }
});
document.getElementById('autopilot-prev').addEventListener('click', () => {
    if (autopilotStepIndex > 0) showAutopilotStep(autopilotStepIndex - 1);
});

//generate Sharepic
async function runAutopilot(autoExport = false) {
    const overlay = document.getElementById('autopilot-overlay');
    overlay.style.display = 'none';

    // random bg
    const thumbs = document.querySelectorAll('.bg-thumb');
    const randomThumb = thumbs[Math.floor(Math.random() * thumbs.length)];
    let variant = 'dark';
    if (randomThumb){
        variant = await loadBackground(randomThumb.dataset.src);
        console.log("BG variant:", variant);

        document.querySelectorAll('.bg-thumb').forEach(i => i.classList.remove('selected'));
        randomThumb.classList.add('selected');
    }

    // add KV Logo
    if(autopilotData.kv) {
        addKVLogo(autopilotData.kv);
        updateKVLogoVariant(variant);
    }

    // add headline || for every line add a new headline element offseted by 250
    if (autopilotData.headline){
        const lines = autopilotData.headline.split(/\r?\n/).filter(l => l.trim() !== '');
        let yOffset = 150;
        let offsetAmount = 110;

        await document.fonts.ready;
        await document.fonts.load(`800 90px "${FONT_FAMILY}"`);

        for (const line of lines){
            // each line = its own headline group
            const group = createSingleHeadline(line);
            group.set({ top: yOffset });
            yOffset += offsetAmount;

            canvas.add(group);
        }
    }

    // ad. Text
    if (autopilotData.text) {
        const tb = new fabric.Textbox(autopilotData.text, {
            left: 68, top: 540,
            fontSize: 60,
            fontFamily: FONT_FAMILY,
            fill: COLOR_BLACK,
            editable: true,
            width: W - 160
        });
        canvas.add(tb);
    }

    canvas.requestRenderAll();

    if(autoExport){
        setTimeout(() => {
            document.getElementById('export').click();
        }, 1500);
    }
}


function closeAutopilot(){
    const overlay = document.getElementById("autopilot-overlay");
    overlay.style.display = 'none';
}
/*
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.getElementById('autopilot-overlay').style.display === 'flex') {
        document.getElementById('autopilot-next').click();
    }
}); 
*/

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