fabric.devicePixelRatio = 1;

//ensure font is loaded
const font = new FontFace("Wix Made For Display", 'url("static/fonts/WixMadeforDisplay-VariableFont_wght.ttf"', { weight: 800 });
document.fonts.add(font);
font.load();

// Initialize Canvas
const canvas = new fabric.Canvas('editorCanvas', {
    selection: true,
    preserveObjectStacking: true,
    width: W,
    height: H,
    enableRetinaScaling: false 
});
canvas.upperCanvasEl.style.width = `${W}px`;
canvas.upperCanvasEl.style.height = `${H}px`;
canvas.lowerCanvasEl.style.width = `${W}px`;
canvas.lowerCanvasEl.style.height = `${H}px`;
canvas.setDimensions({ width: W, height: H });

fabric.Object.prototype.cornerColor = "#e1ff9b";
fabric.Object.prototype.cornerStrokeColor = "#000000";
fabric.Object.prototype.borderColor = "#00aaff";
fabric.Object.prototype.transparentCorners = false;

const stageContainer = document.getElementById('stage-container');
const base_corner_size = 20;
const max_corner_size = 60;
const min_corner_size = 14;
let scaleFactor = 1;
let canvasMargin = 0.77; // use 77% of available space

const isMobile = window.matchMedia("(max-width: 768px)").matches;

stageContainer.style.width = `${W}px`;
stageContainer.style.height = `${H}px`;

function updateCanvasSclae(){
    const rect = stageContainer.getBoundingClientRect();

    const scale = Math.min(
        (rect.width * canvasMargin) / W,
        (rect.height * canvasMargin) / H,
        1
    );

    scaleFactor = scale;
    //canvas.setZoom(scaleFactor);
    //canvas.calcOffset();
    canvas.upperCanvasEl.style.transform = `scale(${scaleFactor})`;
    canvas.lowerCanvasEl.style.transform = `scale(${scaleFactor})`;

    if(!isMobile){
        fabric.Object.prototype.cornerSize = Math.max(
            min_corner_size, Math.min(max_corner_size, base_corner_size / scaleFactor));
        canvas.upperCanvasEl.style.transformOrigin = "top";
        canvas.lowerCanvasEl.style.transformOrigin = "top";
    }else{
        fabric.Object.prototype.cornerSize = Math.max(
            min_corner_size + 20, Math.min(max_corner_size, base_corner_size / scaleFactor));
        canvas.upperCanvasEl.style.transformOrigin = "top left";
        canvas.lowerCanvasEl.style.transformOrigin = "top left";
    }
    fabric.Object.prototype.borderScaleFactor = 1 / scaleFactor;
    fabric.Object.prototype.padding = 6 / scaleFactor;

    canvas.calcOffset();
    canvas.requestRenderAll();
}
updateCanvasSclae();
window.addEventListener('resize', updateCanvasSclae);

//#region CD BASICS
const FONT_FAMILY = 'Wix Made For Display';
const COLOR_BLACK = '#000000';
const COLOR_WHITE = '#ffffff';
const COLOR_HELLGRUEN = '#c7ff7a';
const COLOR_LILA = '#9f88ff';
const COLOR_PINK = '#f28ade';
const COLOR_ORANGE = '#ff8568';
const COLOR_DUNKELGRUEN = '#33c270';

const DEFAULT_TEXT_LEFT = Math.round(W / 15.43);
const DEFAULT_TEXT_TOP = Math.round(H / 6.86);

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

            const scale = Math.max(
                cw / img.width,
                ch / img.height
            );

            canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas), {
                scaleX: scale,
                scaleY: scale,
                originX: 'left',
                originY: 'top'
            });

            if (bgImageObj) {
                canvas.remove(bgImageObj);
            }
            img._bgSrc = src;
            
            bgImageObj = img;

            const isDark = DARK_BACKGROUNDS.includes(src);
            const variant = isDark ? 'light' : 'dark';
            updateKVLogoVariant(variant);
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
const propBox = isMobile ? document.getElementById('mobProperties') : document.getElementById('properties');
let proboxHtml = propBox.innerHTML;
const sidebar = isMobile ? document.getElementById('mobileSidebar') : document.getElementById('sidebar');

function clearProps() {
    propBox.innerHTML = proboxHtml;
}

function addLabelInput(labelText, inputEl) {
    const lbl = document.createElement('label');
    lbl.textContent = labelText;
    lbl.style.display = 'block';
    lbl.style.marginTop = '8px';
    propBox.appendChild(lbl);
    propBox.appendChild(inputEl);
}
// Align Buttons
const createAlignBtn = (innerHtml, onClick) => {
    const btn = document.createElement('button');
    btn.className = 'alignBtn';
    btn.innerHTML = innerHtml;
    btn.addEventListener('click', onClick);
    return btn;
};
function alignCenter(pObj, posX, posY){
    pObj.set({ left: (canvas.width - pObj.width * pObj.scaleX) / 2 });
    posX.value = Math.round(pObj.left);
    posY.value = Math.round(pObj.top);
    canvas.requestRenderAll();
}
function alignLeft(pObj, posX, posY){
    pObj.set({ left: DEFAULT_TEXT_LEFT });
    posX.value = Math.round(pObj.left);
    posY.value = Math.round(pObj.top);
    canvas.requestRenderAll();
}
function alignRight(pObj, posX, posY){
    pObj.set({ left: canvas.getWidth() - pObj.getScaledWidth() - DEFAULT_TEXT_LEFT });
    posX.value = Math.round(pObj.left); // refresh pos indicator
    posY.value = Math.round(pObj.top);
    canvas.requestRenderAll();
}

function showProps(obj) {
    if(isMobile) openPropertiesDrawer();

    propBox.innerHTML = '';

    //DEL
    if(obj._isPictogram || obj._isHeadlineGroup || obj._isMonthRow || obj instanceof fabric.Textbox || obj instanceof fabric.Image){
        const delBtn = document.createElement('button');
        delBtn.classList.add('delBtn');
        delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" 
                d="M 10.8 3.6 v 1.2 H 4.8 v 2.4 h 1.2 v 15.6 a 2.4 2.4 90 0 0 2.4 2.4 h 12 a 2.4 2.4 90 0 0 2.4 -2.4 V 7.2 h 1.2 V 4.8 h -6 V 3.6 H 10.8 z m 2.4 4.8 v 12 h 2.4 V 8.4 h -2.4 z m -4.8 0 v 12 h 2.4 V 8.4 H 8.4 z m 9.6 0 v 12 h 2.4 V 8.4 h -2.4 z" />
        </svg>
        `;

        delBtn.addEventListener('click', () => {
            canvas.remove(canvas.getActiveObject());
            canvas.requestRenderAll();
        });
        addLabelInput('Element löschen', delBtn);

        //Centre | Align Left | Align Right
        const alignDiv = document.createElement('div');
        alignDiv.classList.add('alignDiv');
        const alignCenterBtn = createAlignBtn(
            `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V21M22 12H15.5M15.5 12L19.5 16M15.5 12L19.5 8M2 12H8.5M8.5 12L4.5 16M8.5 12L4.5 8" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`, () => alignCenter(obj, xInput, yInput));
        const alignLeftBtn = createAlignBtn(
            `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 10C14.9319 10 15.3978 10 15.7654 9.84776C16.2554 9.64477 16.6448 9.25542 16.8478 8.76537C17 8.39782 17 7.93188 17 7C17 6.06812 17 5.60218 16.8478 5.23463C16.6448 4.74458 16.2554 4.35523 15.7654 4.15224C15.3978 4 14.9319 4 14 4L6 4C5.06812 4 4.60218 4 4.23463 4.15224C3.74458 4.35523 3.35523 4.74458 3.15224 5.23463C3 5.60218 3 6.06812 3 7C3 7.93188 3 8.39782 3.15224 8.76537C3.35523 9.25542 3.74458 9.64477 4.23463 9.84776C4.60218 10 5.06812 10 6 10L14 10Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M18 20C18.9319 20 19.3978 20 19.7654 19.8478C20.2554 19.6448 20.6448 19.2554 20.8478 18.7654C21 18.3978 21 17.9319 21 17C21 16.0681 21 15.6022 20.8478 15.2346C20.6448 14.7446 20.2554 14.3552 19.7654 14.1522C19.3978 14 18.9319 14 18 14H6C5.06812 14 4.60218 14 4.23463 14.1522C3.74458 14.3552 3.35523 14.7446 3.15224 15.2346C3 15.6022 3 16.0681 3 17C3 17.9319 3 18.3978 3.15224 18.7654C3.35523 19.2554 3.74458 19.6448 4.23463 19.8478C4.60218 20 5.06812 20 6 20L18 20Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> 
            </svg>`, () => alignLeft(obj, xInput, yInput));
        const alignRightBtn = createAlignBtn(
            `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 10C18.9319 10 19.3978 10 19.7654 9.84776C20.2554 9.64477 20.6448 9.25542 20.8478 8.76537C21 8.39782 21 7.93188 21 7C21 6.06812 21 5.60218 20.8478 5.23463C20.6448 4.74458 20.2554 4.35523 19.7654 4.15224C19.3978 4 18.9319 4 18 4L10 4C9.06812 4 8.60218 4 8.23463 4.15224C7.74458 4.35523 7.35523 4.74458 7.15224 5.23463C7 5.60218 7 6.06812 7 7C7 7.93188 7 8.39782 7.15224 8.76537C7.35523 9.25542 7.74458 9.64477 8.23463 9.84776C8.60218 10 9.06812 10 10 10L18 10Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M18 20C18.9319 20 19.3978 20 19.7654 19.8478C20.2554 19.6448 20.6448 19.2554 20.8478 18.7654C21 18.3978 21 17.9319 21 17C21 16.0681 21 15.6022 20.8478 15.2346C20.6448 14.7446 20.2554 14.3552 19.7654 14.1522C19.3978 14 18.9319 14 18 14H6C5.06812 14 4.60218 14 4.23463 14.1522C3.74458 14.3552 3.35523 14.7446 3.15224 15.2346C3 15.6022 3 16.0681 3 17C3 17.9319 3 18.3978 3.15224 18.7654C3.35523 19.2554 3.74458 19.6448 4.23463 19.8478C4.60218 20 5.06812 20 6 20L18 20Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>`, () => alignRight(obj, xInput, yInput));

        alignDiv.append( 
            alignLeftBtn,
            alignCenterBtn,
            alignRightBtn);

        addLabelInput('Element ausrichten', alignDiv);

        //POS
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
        fabric.Object.prototype.setControlsVisibility({  // show options for horizontal/vertical rezising
        mt: true, mb: true, ml: true, mr: true});

        const textInput = document.createElement('textarea');
        textInput.type = 'text';
        textInput.style.cssText = `
            min-height: 7rem;
            width: 200px;
            resize: none;
        `;
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
        fabric.Object.prototype.setControlsVisibility({  // dont show options for horizontal/vertical rezising
        mt: false, mb: false, ml: false, mr: false});

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

    // MONTHLY OVERVIEW ROW
    if(obj._isMonthRow){
        fabric.Object.prototype.setControlsVisibility({  // dont show options for horizontal/vertical rezising
        mt: false, mb: false, ml: false, mr: false});

        const dateGroup = obj._dateGroup;
        const dateTextElement = dateGroup.item(1);
        const dateBarElement = dateGroup.item(0);

        const contentGroup = obj._contentGroup;
        const contentTextElement = contentGroup.item(1);
        const contentBarElement = contentGroup.item(0);

        const dateTextInput = document.createElement('input');
        dateTextInput.type = 'text';
        dateTextInput.value = dateTextElement.text || '';
        dateTextInput.addEventListener('input', () => {
            dateTextElement.text = dateTextInput.value.trim();
            dateTextElement.initDimensions();

            dateBarElement.set({
                width: dateTextElement.width + 40,
                height: (dateTextElement.fontSize * dateTextElement.lineHeight) + 20
            });
            dateGroup.addWithUpdate();

            contentGroup.set({
                left: dateGroup.left + dateGroup.getScaledWidth() - 3
            });

            obj.addWithUpdate();
            canvas.requestRenderAll();
        });
        addLabelInput("Datum:", dateTextInput);

        const contentTextInput = document.createElement('input');
        contentTextInput.type = 'text';
        contentTextInput.value = contentTextElement.text || '';
        contentTextInput.addEventListener('input', () => {
            contentTextElement.text = contentTextInput.value.trim();
            contentTextElement.initDimensions();
            contentBarElement.set({
                width: contentTextElement.width + 40,
                height: (contentTextElement.fontSize * contentTextElement.lineHeight) + 20
            });
            contentGroup.addWithUpdate()
            obj.addWithUpdate()

            canvas.requestRenderAll();
        });
        addLabelInput("Inhalt:", contentTextInput);

        const fontSizeInput = document.createElement('input');
        fontSizeInput.type = 'number';
        fontSizeInput.value = contentTextElement.fontSize || 48;
        fontSizeInput.addEventListener('input', () => {
            contentTextElement.fontSize = fontSizeInput.value;
            dateTextElement.fontSize = fontSizeInput.value;

            contentTextElement.initDimensions();
            dateTextElement.initDimensions();
            contentBarElement.set({
                width: contentTextElement.width + 40,
                height: (contentTextElement.fontSize * contentTextElement.lineHeight) + 20
            });
            dateBarElement.set({
                width: dateTextElement.width + 40,
                height: (dateTextElement.fontSize * dateTextElement.lineHeight) + 20
            });
            dateGroup.addWithUpdate();
            contentGroup.set({
                left: dateGroup.left + dateGroup.getScaledWidth() - 3
            });
            obj.addWithUpdate();
            canvas.requestRenderAll();
        });
        addLabelInput("Schriftgröße:", fontSizeInput);
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

//#region ADD TEXT
document.getElementById('addText').addEventListener('click', () => {
    const tb = new fabric.Textbox('Dein Text', {
        left: DEFAULT_TEXT_LEFT + 8, top: Math.round(H / 2.25),
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
    const fontSize = 100;
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
        const text = new fabric.Text(line, {
            left: padX,
            top: yOffset + padY,
            fontSize: fontSize,
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
        left: DEFAULT_TEXT_LEFT,
        top: DEFAULT_TEXT_TOP,
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
    const initialFontSize = group._lineGroups[0] ? group._lineGroups[0]._headlineText.fontSize : 90;

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
        const text = new fabric.Text(line, {
            left: padX,
            top: yOffset,
            fontSize: initialFontSize,
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
    const fontSize = 100;
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
        left: DEFAULT_TEXT_LEFT,
        top: DEFAULT_TEXT_TOP,
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

    const maxSizeMB = 20;
    if(file.size > maxSizeMB * 1024 * 1024) {
        alert(`Die Datei ist zu groß! Maximal erlaubt sind ${maxSizeMB} MB.`);
        uploadInput.value = '';
        return;
    }

    addUploadedImageToCanvas(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
        await fetch('/upload', {
            method: 'POST',
            body: formData
        });
    } catch (err) {
        console.error(err);
        alert('Fehler beim Hochladen');
    }

    // reset Input
    uploadInput.value = '';
});

function addUploadedImageToCanvas(file){
    const reader = new FileReader();

    reader.onload = function (e){
        fabric.Image.fromURL(e.target.result, (img) => {
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
        });
    };

    reader.readAsDataURL(file);
}

//#endregion

// Delete selected object
document.onkeydown = function(e) {
    switch (e.keyCode) {
      case 46: // delete
        canvas.remove(canvas.getActiveObject());
    }
}

//#region Upload PDF/DOCX
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener("drop", dropHanlder);
window.addEventListener("drop", (e) => {
    if ([...e.dataTransfer.items].some((item) => item.kind === 'file')) {
        e.preventDefault();
    }
});
dropZone.addEventListener("dragover", (e) => {
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === 'file',
    );
    if (fileItems.length > 0){
        e.preventDefault();
        if(fileItems.some((item) => item.type.startsWith('pdf'))) {
            e.dataTransfer.dropEffect = 'copy';
        } else{
            e.dataTransfer.dropEffect = 'none';
        }
    }
});
window.addEventListener("dragover", (e) => {
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === 'file',
    );
    if (fileItems.length > 0){
        e.preventDefault();
        if(!dropZone.contains(e.target)){
            e.dataTransfer.dropEffect = 'none';
        }
    }
});

function dropHanlder(ev){
    ev.preventDefault();
    const files = [...ev.dataTransfer.items]
        .map((item) => item.getAsFile())
        .filter((file) => file);
}

const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files.length) return;

    if (files.length > 1){
        createMultipleFromData(files);
        return;
    }

    const file = files[0];
    const formData = new FormData();
    formData.append("pdf", file);

    //create sharepic from pdf file
    fetch('/create-from-pdf', {
        method: 'POST',
        body: formData
    })
    .then(async response => {
        if (!response.ok){
            const err = await response.json();

            if (response.status === 413) { alert(err.error); } // file too large
            else { alert('Fehler beim Hochladen der Datei.'); }

            throw new Error("Upload failed");
        }
        return response.json();
    })
    .then(data => {
        createFromData(false, data);
    })
    .catch(err => {
        console.log(err);
    });
});
let currentResults = [];
async function createMultipleFromData(files){
    const results = [];
    //generate sharepics 
    for (const file of files){
        const formData = new FormData();
        formData.append("pdf", file);

        try{
            const response = await fetch('/create-from-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok){
                const err = await response.json();

                if (response.status === 413) alert(err.error); // file too large
                else alert('Fehler beim Hochladen der Datei.');
                continue; // skip this file and continue with the next
            }

            const data = await response.json();
            if(data.kv || data.headline || data.text){
                results.push({
                    fileName: file.name,
                    data: data
                });
            }
        }catch(err){
            console.log(err);
        }
    }

    currentResults = results;
    showPreviewModal(results);
}
async function renderSharepic(data){
    canvas.clear();

    await createFromData(false, data);

    await new Promise(resolve => {
        fabric.util.requestAnimFrame(() => {
            fabric.util.requestAnimFrame(resolve);
        });
    });

    return canvas.toDataURL("image/png");
}

async function showPreviewModal(results){
    await new Promise(r => setTimeout(r, 300));
    const modal = document.getElementById("preview-modal");
    const container = document.getElementById("preview-container");

    container.innerHTML = "";

    for (let i = 0; i < results.length; i++){
        const item = results[i];
        const imgSrc = await renderSharepic(item.data);
        item.previewImage = imgSrc;

        const wrapper = document.createElement('div');
        wrapper.className = 'preview-item';

        wrapper.innerHTML = `
            <label>
                <input type='checkbox' checked data-index="${i}">
                <img src="${imgSrc}" width="200">
                <div>${item.fileName}</div>
            </label>
        `;
        container.appendChild(wrapper);
    }

    modal.style.display = 'block';
}
async function downloadAsZip(){
    const zip = new JSZip();

    const checkboxes = document.querySelectorAll(
        '#preview-container input[type="checkbox"]:checked');

    checkboxes.forEach(cb => {
        const index = cb.dataset.index;
        const item = currentResults[index];

        const base64 = item.previewImage.split(',')[1];

        zip.file(
            item.fileName.replace('.pdf', '.png'),
            base64,
            { base64: true }
        );
    });

    const blob = await zip.generateAsync({ type: "blob" });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'sharepics.zip';
    link.click();
}

function downloadSelected(){
    const checkbockes = document.querySelectorAll(
        '#preview-container input[type="checkbox"]:checked');

    checkbockes.forEach(cb => {
        const index = cb.dataset.index;
        const item = currentResults[index];
        const link = document.createElement('a');
        link.href = item.previewImage;
        link.download = item.fileName.replace('.pdf', '.png');
        link.click();
    });
}
//#endregion

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
        createFromData(shouldExport);
    }
});
document.getElementById('autopilot-prev').addEventListener('click', () => {
    if (autopilotStepIndex > 0) showAutopilotStep(autopilotStepIndex - 1);
});

//generate Sharepic
async function createFromData(autoExport = false, dataSet=autopilotData) {
    //console.log(dataSet, dataSet.kv, dataSet.headline, dataSet.text);
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
    if(dataSet.kv) {
        addKVLogo(dataSet.kv);
        updateKVLogoVariant(variant);
    }

    // add headline || for every line add a new headline element offseted by 250
    if (dataSet.headline){
        const lines = dataSet.headline.split(/\r?\n/).filter(l => l.trim() !== '');
        let yOffset = DEFAULT_TEXT_TOP; //150
        let offsetAmount = Math.round(H / 10.63); //110

        for (const line of lines){
            // each line = its own headline group
            const group = createSingleHeadline(line);
            group.set({ top: yOffset });
            yOffset += offsetAmount;

            canvas.add(group);
        }
    }

    // ad. Text
    if (dataSet.text) {
        const tb = new fabric.Textbox(dataSet.text, {
            left: DEFAULT_TEXT_LEFT + 8, top: Math.round(H / 2.25),
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

//#endregion
const scaleSlider = document.getElementById('canvas-size-input');
const scaleSliderText = document.getElementById('canvas-scale-text')
scaleSliderText.textContent = Math.round(canvasMargin * 100) + '%';
scaleSlider.value = canvasMargin;

scaleSlider.addEventListener('input', () => {
    canvasMargin = parseFloat(scaleSlider.value);
    updateCanvasSclae();
    scaleSliderText.textContent = Math.round(canvasMargin * 100) + '%';
});

//#region Monthly Overview
function overviewForm(){
    const container = isMobile ? document.getElementById('mobileOverviewFormContainer') : document.getElementById('overviewFormContainer');
    if (!container) return;
    
    let tableHtml = `
        <table><thead>
            <tr>
                <th>Datum</th>
                <th>Textinhalt</th>
                <th></th>
            </tr></thead>
            <tbody class="overviewTable">
            <tr class="row1">
                <td><input type=text class="dateInput monthOverviewInput"></td>
                <td><input type=text class="contentInput monthOverviewInput"></td>
                <td class="removeBtnRow"><button class="removeRow">-</button></td>
            </tr>
            </tbody>
            </table>

            <button class="submitFormBtn" onclick="createMonthlyOverview()">Generieren</button>
        `;
    
    container.innerHTML = tableHtml;
    attachOverviewEventListeners();
}
function toggleOverviewForm(event){
    event.preventDefault();
    const toggle = event.currentTarget;
   const container = toggle.nextElementSibling;
    
    if (!container) return;
    
    const isExpanded = toggle.classList.contains('expanded');
    
    if (isExpanded) {
        // Collapse
        toggle.classList.remove('expanded');
        container.style.display = 'none';

        collapseOverviewForm();
    } else {
        // Expand and load form
        toggle.classList.add('expanded');
        container.style.display = 'block';
        overviewForm();

        // On desktop we increase the sidebar width; on mobile the drawer should stay full width.
        if (!isMobile && sidebar) {
            sidebar.style.width = '600px';
            // adjust editor- and upper-canvas left
            canvas.upperCanvasEl.style.transformOrigin = "top left";
            canvas.lowerCanvasEl.style.transformOrigin = "top left";
        }
    }
}

function collapseOverviewForm(){
    const container = isMobile ? document.getElementById('mobileOverviewFormContainer') : document.getElementById('overviewFormContainer');
    const toggle = isMobile ? document.querySelector('overview-mobile-toggle') : document.querySelector('.overview-toggle');

    if(container) container.style.display = 'none';
    if(toggle) toggle.classList.remove('expanded');

    if(!sidebar) return;

    if (!isMobile) {
        sidebar.style.width = propBox.style.width;
        canvas.upperCanvasEl.style.transformOrigin = "top";
        canvas.lowerCanvasEl.style.transformOrigin = "top";
    }
}

function attachOverviewEventListeners(){
    const tbody = document.querySelector('.overviewTable');
    if (!tbody) return;
    
    // Attach event listeners to all dateInput fields
    tbody.addEventListener('input', (e) => {
        if (e.target.classList.contains('dateInput')){
            addOverviewRow();
        }
    });
    
    // Attach event listeners to all removeRow buttons
    const removeButtons = tbody.querySelectorAll('.removeRow');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            btn.closest('tr').remove();
        });
    });
}

function addOverviewRow(){
    const tbody = document.querySelector('.overviewTable');
    if (!tbody) return;
    
    // Get the last row
    const rows = tbody.querySelectorAll('tr');
    const lastRow = rows[rows.length - 1];
    const dateInput = lastRow.querySelector('.dateInput');

    if(!dateInput.value.trim()) return;
    
    // Create a new row with the same structure
    const newRow = document.createElement('tr');
    newRow.className = `row${rows.length + 1}`;
    newRow.innerHTML = `
        <td><input type=text class="dateInput monthOverviewInput"></td>
        <td><input type=text class="contentInput monthOverviewInput"></td>
        <td class="removeBtnRow"><button class="removeRow">-</button></td>
    `;
    
    // Append to tbody
    tbody.appendChild(newRow);
    
    // Attach event listeners to the new row's removeRow button
    const removeBtn = newRow.querySelector('.removeRow');
    removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        newRow.remove();
    });
}

function createMonthlyOverview(pFontSize=48, pFontWeigth=800, padX=20, padY=10, dateBarColor=COLOR_HELLGRUEN, contentBarColor=COLOR_WHITE, rowSpacingFactor=36){
    const tbody = document.querySelector('.overviewTable');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    let rowSpacing = 0;
    rows.forEach(row => {
        let date = row.querySelector('.dateInput').value;
        let content = row.querySelector('.contentInput').value;

        if(!date || !content) return;

        console.log("date:", date , "conent:", content)

        const dateText = new fabric.Text(date.trim(), {
            left: padX,
            top: padY,
            fontSize: pFontSize,
            fontFamily: FONT_FAMILY,
            fontWeight: pFontWeigth,
            fill: COLOR_BLACK,
            editable: true
        });
        dateText.initDimensions();
        const dateBar = new fabric.Rect({
            left: 0,
            top: 0,
            width: dateText.width + padX * 2,
            height: (dateText.fontSize * dateText.lineHeight) + padY * 2,
            fill: dateBarColor,
            selectable: false,
            evented: false
        })
        const dateGroup = new fabric.Group([dateBar, dateText], {});

        const contentText = new fabric.Text(content.trim(), {
            left: padX,
            top: padY,
            fontSize: pFontSize,
            fontFamily: FONT_FAMILY,
            fontWeight: 800,
            fontWeight: pFontWeigth,
            editable: true
        });
        contentText.initDimensions();
        const contentBar = new fabric.Rect({
            left: 0,
            top: 0,
            width: contentText.width + padX * 2,
            height: (contentText.fontSize * contentText.lineHeight) + padY * 2,
            fill: contentBarColor,
            selectable: false,
            evented: false
        });
        const contentGroup = new fabric.Group([contentBar, contentText], {left: dateBar.width - 3});

        const group = new fabric.Group([dateGroup, contentGroup], {
            left: Math.round(W / 9),
            top: Math.round(H / 2.87) + rowSpacing,
            subTargetCheck: false,
            objectCaching: false
        });

        group._isMonthRow = true;
        group._dateGroup = dateGroup;
        group._contentGroup = contentGroup;

        canvas.add(group);

        rowSpacing += contentGroup.height + rowSpacingFactor;
    });
}
//#endregion

//#region Mobile
if(isMobile){
    fabric.Object.prototype.cornerSize = 20;
    fabric.Object.prototype.transparentCorners = false;
    fabric.Object.prototype.setControlsVisibility({
    mt: false, mb: false, ml: false, mr: false});
}
//Drawer
const drawer = document.getElementById('mobilePropertiesDrawer');
const drawerHandle = document.getElementById('drawerHandle');

function openPropertiesDrawer(){
    drawer.classList.add('expanded');
    drawer.setAttribute('aria-hidden', 'false');
}
function closePropertiesDrawer(){
    drawer.classList.remove('expanded');
    drawer.setAttribute('aria-hidden', 'true');
}
function togglePropertiesDrawer(){
    drawer.classList.toggle('expanded');
    drawer.setAttribute('aria-hidden', !drawer.classList.contains('expanded'));
}

let startY = 0;
let startHeight = 0;
let isDragging = false;

function onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return;
    isDragging = true;
    startY = e.touches[0].clientY;
    startHeight = drawer.getBoundingClientRect().height;
    drawerHandle.style.cursor = 'grabbing';  
}
function onTouchMove(e){
    if (!isDragging || !e.touches || e.touches.length === 0) return;
    const dy = startY - e.touches[0].clientY;
    let newHeight = startHeight + dy;
    const minH = 80;
    const maxH = window.innerHeight * 0.72;
    newHeight = Math.max(minH, Math.min(maxH, newHeight));
    drawer.style.height = newHeight + 'px';
}
function onTouchEnd(e){
    if (!isDragging) return;
    isDragging = false;
    drawerHandle.style.cursor = 'grab';

    const finalH = parseInt(drawer.style.height || drawer.getBoundingClientRect().height, 10);
    if (finalH > window.innerHeight * 0.35){
        openPropertiesDrawer();
        drawer.style.height = '';
    }else{
        closePropertiesDrawer();
        drawer.style.height = '';
    }
}
drawerHandle.addEventListener('touchstart', onTouchStart, { passive: true });
drawerHandle.addEventListener('touchmove', onTouchMove, { passive: false });
drawerHandle.addEventListener('touchend', onTouchEnd, { passive: true });

drawerHandle.addEventListener('click', (e) => {
    if (!isDragging) togglePropertiesDrawer();
});

if(typeof canvas !== 'undefined'){
    canvas.on('selection:created', (evt) => {
        const obj = evt.target || canvas.getActiveObject();
        if(obj){
            showProps(obj);
            collapseOverviewForm();
        }
    });

    canvas.on('selection:updated', (evt) => {
        const obj = evt.target || canvas.getActiveObject();
        if(obj){
            showProps(obj);
            collapseOverviewForm();
        }
    });

    canvas.on('selection:cleared', () => {
        if(isMobile){
            closePropertiesDrawer();
        }
        collapseOverviewForm();
    });
} else {
    console.warn('canvas ist nicht definiert – Fabric-Hooks wurden nicht registriert.')
}


function initMobileDrawer(){
    attachBgThumbClicks();

    if(isMobile){
        canvasMargin = 1;
        scaleSlider.value = canvasMargin;
        updateCanvasSclae();
        scaleSliderText.textContent = Math.round(canvasMargin * 100) + '%';
    }
}

const propertiesDrawer = document.getElementById('mobilePropertiesDrawer');
function openDrawerMain(){
    if (!isMobile) return; // only relevant on mobile

    const menuBtn = document.getElementById('mobileMenuBtn');

    sidebar.style.width = '320px';
    sidebar.setAttribute('aria-hidden', 'false');
    document.getElementById('drawerMain').style.display = 'block';
    document.getElementById('drawerSub').style.display = 'none';
    document.getElementById('drawerTitle').innerText = 'Kategorien';
    menuBtn.style.display = 'none';
    document.getElementById('mobileTopBar').style.display = 'none';
    propertiesDrawer.style.display = 'none';
}
function closeDrawer(){
    if (!isMobile) return; // only relevant on mobile

    const menuBtn = document.getElementById('mobileMenuBtn');

    sidebar.style.width = '0';
    sidebar.setAttribute('aria-hidden', 'true');
    menuBtn.style.display = 'grid';
    document.getElementById('mobileTopBar').style.display = 'flex';
    // Unset the inline display so the CSS default can take over
    propertiesDrawer.style.display = '';
}

function openDrawerSub(category, event){
    if (!isMobile) return; // only relevant on mobile

    if(event) event.preventDefault();
    document.getElementById('drawerMain').style.display = 'none';
    document.getElementById('drawerSub').style.display = 'block';
    document.getElementById('drawerTitle').innerText = category.charAt(0).toUpperCase() + category.slice(1);
    populateSubmenu(category);
    if (!sidebar.style.width || sidebar.style.width === '0px'){
        sidebar.style.width = '320px';
    } 
}

function backToMain(){
    if (!isMobile) return; // only relevant on mobile

    document.getElementById('drawerSub').style.display = 'none';
    document.getElementById('drawerMain').style.display = 'block';
    document.getElementById('drawerTitle').innerText = 'Kategorien';
}

/* Fill Sub Menu */
function populateSubmenu(category){
    const drawerSub = document.getElementById('drawerSub');
    drawerSub.innerHTML = ''; //clear

    const back = document.createElement('div');
    back.className = 'back-btn';
    back.innerHTML = '◀ Zurück';
    back.onclick = backToMain;
    drawerSub.appendChild(back);

    if(category === 'backgrounds'){
        const bgThumbs = Array.from(document.querySelectorAll('.bg-options .bg-thumb'));
        if(bgThumbs.length === 0){
            const p = document.createElement('p');
            p.style.padding = '12px';
            p.innerText = 'Keine Hintergründe gefunden.';
            drawerSub.appendChild(p);
        }else{
            bgThumbs.forEach((imgEl, idx) => {
                const item = document.createElement('div');
                item.className = 'sub-item';
                const thumb = imgEl.cloneNode();
                thumb.classList.add('thumb');
                item.appendChild(thumb);
                const lbl = document.createElement('div');
                lbl.className = 'label';
                lbl.innerText = imgEl.dataset.src || `Hintergrund ${idx+1}`;
                item.appendChild(lbl);
                item.onclick = function(e){
                    e.preventDefault();
                    imgEl.click();
                    //dsdsdsdsdsdsd
                    closeDrawer();
                };
                drawerSub.appendChild(item);
            });
            const spacer = document.createElement('div');
            spacer.className = 'sub-item-spacer';
            drawerSub.appendChild(spacer);
        }
    } else if(category === 'texts'){
        const addTextBtn = document.createElement('div');
        addTextBtn.className = 'sub-item';
        addTextBtn.innerHTML = '<div class="label">Text hinzufügen</div>';
        addTextBtn.onclick = function(){ if(typeof addText === 'function') addText(); else document.getElementById('addText').click(); };
        drawerSub.appendChild(addTextBtn);

        const addHeadlineBtn = document.createElement('div');
        addHeadlineBtn.className = 'sub-item';
        addHeadlineBtn.innerHTML = '<div class="label">Headline mit CD-Hinterlegung</div>';
        addHeadlineBtn.onclick = function(){ if(typeof addHeadline === 'function') addHeadline(); else document.getElementById('addHeadline').click(); };
        drawerSub.appendChild(addHeadlineBtn);
    } else if (category === 'images'){
        const pictogramBtn = document.createElement('div');
        pictogramBtn.className = 'sub-item';
        pictogramBtn.innerHTML = '<div class="label">Piktogramme</div>';
        pictogramBtn.onclick = function() { if(typeof piktogramme === 'function') piktogramme(); else document.getElementById('addPicto').click(); };
        drawerSub.appendChild(pictogramBtn);

        const addImgBtn = document.createElement('div');
        addImgBtn.className = 'sub-item';
        addImgBtn.innerHTML = '<div class="label">Bild hochladen</div>';
        addImgBtn.onclick = function(){ const input = document.getElementById('imgUploadInput'); if(input) input.click(); else if(typeof addImg === 'function') addImg(); };
        drawerSub.appendChild(addImgBtn);
    } else if (category === 'kv') {
        const kvWrapper = document.createElement('div');
        kvWrapper.style.display = 'flex';
        kvWrapper.style.flexDirection = 'column';
        kvWrapper.style.gap = '8px';
        kvWrapper.style.padding = '6px';
        const input = document.createElement('input');
        input.id = 'kvInputMobile';
        input.placeholder = 'Duisburg';
        input.style.padding = '10px';
        input.style.borderRadius = '6px';
        input.style.border = '1px solid rgba(255,255,255,0.06)';
        input.style.background = 'transparent';
        input.style.color = '#fff';
        const btn = document.createElement('button');
        btn.className = 'sub-item';
        btn.style.width = '100%';
        btn.style.justifyContent = 'center';
        btn.innerText = 'Logo einfügen';
        btn.onclick = function(){
            const kv = (document.getElementById('kvInputMobile') && document.getElementById('kvInputMobile').value.trim()) || document.getElementById('kvInput').value.trim();
            if (kv){
                if (typeof addKVLogo === 'function') addKVLogo(kv);
                else if (typeof addKV === 'function') addKV(kv);
                else document.getElementById('setKV').click();
            }
        };
        kvWrapper.appendChild(input);
        kvWrapper.appendChild(btn);
        drawerSub.appendChild(kvWrapper);
    }
}

function attachBgThumbClicks(){
    const thumbs = document.querySelectorAll('.bg-options .bg-thumb');
    thumbs.forEach(img => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            if (typeof applyBackgroundFromThumb === 'function') {
                applyBackgroundFromThumb(img.dataset.src || img.src);
            } else{
                try {
                    if(window.canvas && img.dataset && img.dataset.src){
                        const url = `/static/backgrounds/${img.dataset.src}`;
                        canvas.setBackgroundImage(url, canvas.renderAll.bind(canvas), { originX: 'left', originY: 'top', width: canvas.width, height: canvas.height });
                    }
                } catch(e){
                    console.log('No fabric canvas instance found or applyBackgroundFromThumb not defined.');
                }
            }
        });
    });
}

document.addEventListener('click', function(e){
    if (!isMobile) return; // only mobile should handle this

    const btn = document.getElementById('mobileMenuBtn');
    if (!sidebar || !btn) return;
    if (sidebar.style.width && sidebar.style.width !== '0px'){
        const isClickInside = sidebar.contains(e.target) || btn.contains(e.target);
        if(!isClickInside) closeDrawer();
    }
});

window.addEventListener('load', function() {
    initMobileDrawer();
});

//#endregion

//#region EXPORT as PNG
async function exportSharepic(){
    const active = canvas.getActiveObject();
    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const json = canvas.toJSON();

    // create off-screen canvas
    const offscreenEl = document.createElement('canvas');
    offscreenEl.width = W;
    offscreenEl.height = H;

    const offscreenCanvas = new fabric.StaticCanvas(offscreenEl, {
        width: W,
        height: H,
        enableRetinaScaling: false
    });

    // load JSON to offscreen canvas
    await new Promise(resolve => {
        offscreenCanvas.loadFromJSON(json, () =>{
            offscreenCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
            offscreenCanvas.renderAll();
            resolve();
        });
    });

    // create blob
    const blob = await new Promise(resolve => offscreenCanvas.getElement().toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob){
        alert('Fehler beim Erstellen des Bildes.');
        return;
    }

    // export via flask
    const form = new FormData();
    form.append('image', blob, 'sharepic.jpg');

    const res = await fetch('/export_file', { method: 'POST', body: form });
    const ct = res.headers.get('content-type') || '';
    if(!res.ok){
        const msg = ct.includes('application/json') ? (await res.json()).error : await res.text();
        alert('Export fehlgeschlagen: ' + msg);
        return;
    }
    const jsonRes = await res.json();
    window.location.href = jsonRes.url;

    if(active) {
        canvas.setActiveObject(active);
        canvas.requestRenderAll();
    }
}

let exportBtn = isMobile ? document.getElementById('mobExportBtn') : document.getElementById('export');
exportBtn.addEventListener('click', () => {
    exportSharepic().catch(err => {
        console.log(err);
        alert('Unbekannter Fehler beim Export.');
    });
});
//#endregion

//#region EX/IMPORT as JSON
const exportJsonBtn = isMobile ? document.getElementById("export-json-mob") : document.getElementById("export-json");
exportJsonBtn.addEventListener('click', () => {
    const json = JSON.stringify(canvas.toJSON([
        '_isHeadlineGroup',
        '_isHeadlineChild',
        '_lineGroups',
        '_headlineText',
        '_parentGroup',
        '_isMonthRow',
        '_dateGroup',
        '_contentGroup',
        '_isPictogram',
        '_bgSrc',
        '_barRect',
        '_isHeadlineLine',
        '_isKVLogo'
    ]));
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    let headlineEl = canvas.getObjects().find(o => o.type === 'group' && o._isHeadlineGroup);
    let fileName = headlineEl?._lineGroups[0]?._headlineText?.text; // make the file name the text of the first headline
    a.href = url;
    a.download = fileName ? fileName.replace(/\s/g, '') : "canvas" + ".json";
    a.click();
    URL.revokeObjectURL(url);
});

// Trigger file input for import
const importJsonBtn = isMobile ? document.getElementById("import-json-mob") : document.getElementById("import-json");
importJsonBtn.addEventListener('click', () => {
    document.getElementById("jsonFileInput").click();
});

// Read and load JSON into canvas
document.getElementById("jsonFileInput").addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        canvas.loadFromJSON(json, () => {
            restoreAfterLoad(canvas, json);
            canvas.renderAll();
        });

      } catch (err) {
        alert("Fehler beim Laden der JSON-Datei: " + err);
      }
    };
    reader.readAsText(file);
});
function restoreAfterLoad(canvas, jsonStr) {
    canvas.getObjects().forEach(obj => {
        if (obj.type === 'group' && obj._isHeadlineGroup) {

            let left = obj.left;
            let top = obj.top;

            obj._lineGroups = [];

            const hasLineGroups = obj._objects.some(o => o.type === 'group'); // multi-line Headline or single-line headline?

            if(hasLineGroups){ // multi line Headline
                obj._objects.forEach(lg => {
                    if (!lg._objects || lg._objects.length !== 2) return;

                    const bar = lg._objects.find(o => o.type === 'rect');
                    const text = lg._objects.find(o => o.type === 'text');
                    if (!bar || !text) return;

                    lg._isHeadlineLine = true;
                    lg._barRect = bar;
                    lg._headlineText = text;

                    let content = text.text;
                    text.text = "";

                    // restore events
                    text.on("changed", () => updateMultiLineHeadline(obj));
                    text.on("modified", () => updateMultiLineHeadline(obj));

                    text.text = content;
                    obj._lineGroups.push(lg);

                });
            }
            else{       // Single line headline
                const bar = obj._objects.find(o => o.type === 'rect');
                const text = obj._objects.find(o => o.type === 'text');
                if(!bar || !text) return;

                obj._isHeadlineGroup = true;
                obj._barRect = bar;
                obj._headlineText = text;
                obj._lineGroups = [obj];

                const content = text.text;
                text.text = "";

                text.text = content;

            }

            // force recalculation
            obj._calcBounds();
            obj._updateObjectsCoords();
            obj.set({
                top: top,
                left: left
            });
        }
        else if (obj._isMonthRow) {
            if (obj._objects.length === 2) {
                obj._dateGroup = obj._objects[0];
                obj._contentGroup = obj._objects[1];
            }
        }
        else if(obj._isKVLogo){
            const kvGroup = jsonStr.objects.find(o => o._isKVLogo);
            const textObj = kvGroup?.objects.find(o => o.type === "text");

            addKVLogo(textObj?.text);
            const isDark = DARK_BACKGROUNDS.includes(bgImageObj._bgSrc);
            updateKVLogoVariant(isDark ? 'light' : 'dark');
            obj.remove();
        }
    });

    loadBackground(jsonStr.backgroundImage._bgSrc);
    document.querySelectorAll('.bg-thumb').forEach(th => {
        if(th.dataset.src === jsonStr.backgroundImage._bgSrc){
            th.classList.add('selected');
        }
        else{
            th.classList.remove('selected');
        }
    });
}

//#region Custom Settings 
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

//#endregion