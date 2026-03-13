from flask import Flask, render_template, request, send_from_directory, jsonify, Response
import os, re, base64
from datetime import datetime
import pypdf
import re

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['MAX_CONTENT_LENGTH'] = 6 * 1024 * 1024  # 6 MB

UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

# FORMATS
FORMATS = {
    "instagram": {
        "label": "Instagram",
        "icon": "/static/img/sm_logos/instagram.svg",
        "formats": {
            "insta_post":  {"w": 1080, "h": 1350, "label": "Instagram Post (1080×1350)"},
            "insta_post_high": {"w": 1080, "h": 1440, "label": "Instagram Post (1080x1440)"},
            "insta_story": {"w": 1080, "h": 1920, "label": "Instagram Story (1080×1920)"}
        }
    },
    "facebook": {
        "label": "Facebook",
        "icon": "/static/img/sm_logos/facebook-logo.svg",
        "formats": {
            "facebook_post": {"w": 940, "h": 788, "label": "Facebook Beitrag (940x788)"},
            "facebook_hero": {"w": 851, "h": 315, "label": "Facebook Titelbild (851x315)"},
        }
    },
    "twitter": {
        "label": "X",
        "icon": "/static/img/sm_logos/x_icon.svg",
        "formats": {
             "tweet_image": {"w": 1200, "h": 675, "label": "Tweet Image (1200×675)"}
         }
    },
    "youtube": {
        "label": "Youtube",
        "icon": "/static/img/sm_logos/youtube-icon.svg",
        "formats": {
            "yt_thumbnail": {"w": 1280, "h": 720, "label": "Youtube Thumbnail (1280x720)"}
        }
    }
}


@app.route('/')
def index():
    return render_template('index.html', platforms=FORMATS)


@app.route('/editor')
def editor():
    fmt = request.args.get('fmt', 'insta_post')

    for platform, pdata in FORMATS.items():
        if fmt in pdata['formats']:
            f = pdata['formats'][fmt]
            break
    else:
        f = FORMATS['instagram']['formats']['insta_post']

    return render_template('editor.html', format_key=fmt, width=f['w'], height=f['h'], formats=FORMATS)


@app.route('/upload', methods=['POST'])
def upload():
    f = request.files.get('file')
    if not f:
        return jsonify({"error":"no file"}), 404
    filename = datetime.utcnow().strftime('%Y%m%d%H%M%S_') + re.sub(r'[^0-9A-Za-z._-]', '_', f.filename)
    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)
    return jsonify({"url": f"/uploads/{filename}"}), 200


@app.route('/export', methods=['POST'])
def export():
    dataurl = request.json.get('dataURL')
    if not dataurl or ',' not in dataurl:
        return jsonify({"error":"no data"}), 400
    header, encoded = dataurl.split(',', 1)
    mime = header.split(';')[0].split(':')[1]
    ext = 'png' if 'png' in mime else 'jpg'
    filename = datetime.utcnow().strftime('%Y%m%d%H%M%S_export.') + ext
    path = os.path.join(UPLOAD_DIR, filename)
    with open(path, 'wb') as fh:
        fh.write(base64.b64decode(encoded))
    return jsonify({"url": f"/downloads/{filename}"}), 200


@app.route('/export_file', methods =['POST'])
def export_file():
    f = request.files.get('image')
    if not f:
        return jsonify({"error": "no file"}), 400
    ext = 'png' if f.mimetype == 'image/png' else 'jpg'
    filename = datetime.utcnow().strftime('%Y%m%d%H%M%S_export.') + ext
    path = os.path.join(UPLOAD_DIR, filename)
    f.save(path)
    return jsonify({"url": f"/downloads/{filename}"}), 200


@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route('/downloads/<path:filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=True)

# Make custom KV Logo
@app.route("/kvlogo/<kv>")
def kv_logo(kv):
    kv_text = kv.strip().upper()

    with open("static/logo_template.svg", "r", encoding="utf-8") as f:
        svg = f.read()

    svg = re.sub(
        r'(<tspan[^>]*>)(.*?)(</tspan>)',
        rf'\1{kv_text}\3',
        svg,
        count=1 
    )

    return Response(svg, mimetype="image/svg+xml")

@app.route("/piktogramme")
def list_piktogramme():
    picto_dir = os.path.join(app.static_folder, "piktogramme")
    files = [f for f in os.listdir(picto_dir) if f.lower().endswith(".svg")]
    return jsonify(files)

@app.route('/create-from-pdf/', methods=['POST'])
def create_from_pdf():
    file = request.files.get("pdf")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    
    data = read_pdf(file)
    return jsonify(data)

def read_pdf(pdf_filestr):
    reader = pypdf.PdfReader(pdf_filestr)
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"

    pattern = r"- Sharepic erstellen:(.*?)(?=\n- |\Z)"
    match = re.findall(pattern, full_text, re.DOTALL)

    if not match:
        return {"kv": "", "headline": "", "text": ""}
    
    block = match[0]
    titel = re.search(r"Titel:\s*(.*)", block)
    txt = re.search(r"text:\s*(.*)", block)
    kv = re.search(r"kv:\s*(.*)", block)

    result ={
        "kv": kv.group(1).strip() if kv else "",
        "headline": titel.group(1).strip() if titel else "",
        "text": txt.group(1).strip() if txt else ""
    }
    return result

@app.errorhandler(413)
def file_too_large(e):
    return jsonify({"error": "Die Datei ist zu groß! Maximal 6 MB erlaubt."}), 413


if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
