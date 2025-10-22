from flask import Flask, render_template, request, send_from_directory, jsonify
import os, re, base64
from datetime import datetime

app = Flask(__name__, static_folder='static', template_folder='templates')
UPLOAD_DIR = 'uploads'
os.makedirs(UPLOAD_DIR, exist_ok=True)

# FORMATS
FORMATS = {
    "insta_post":  {"w": 1080, "h": 1350, "label": "Instagram Post (1080×1350)"},
    "insta_story": {"w": 1080, "h": 1920, "label": "Instagram Story (1080×1920)"}
}



@app.route('/')
def index():
    return render_template('index.html', formats=FORMATS)


@app.route('/editor')
def editor():
    fmt = request.args.get('fmt', 'insta_post')
    f = FORMATS.get(fmt, FORMATS['insta_post'])
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

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_DIR, filename)

@app.route('/downloads/<path:filename>')
def download_file(filename):
    return send_from_directory(UPLOAD_DIR, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)