from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModel
import torch
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# טען את המודל העברי (בטוח ל-Numpy ו-Torch)
MODEL_NAME = "dicta-il/dictabert"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(MODEL_NAME)

csv_data = []
csv_embeddings = []
headers = []

def embed_text(text):
    """המרת טקסט לווקטור embedding"""
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=128)
    with torch.no_grad():
        outputs = model(**inputs)
    embedding = outputs.last_hidden_state.mean(dim=1).squeeze()
    return embedding.numpy()

@app.route('/upload_csv', methods=['POST'])
def upload_csv():
    global csv_data, csv_embeddings, headers
    file = request.files.get('file')
    if not file:
        return jsonify({'error': 'לא הועלה קובץ'}), 400
    df = pd.read_csv(file)
    if df.empty:
        return jsonify({'error': 'קובץ ריק'}), 400
    headers = list(df.columns)
    text_col = headers[0]
    csv_data = df.to_dict(orient='records')
    csv_embeddings = [embed_text(str(row[text_col])) for row in csv_data]
    return jsonify({'message': f'{len(csv_data)} שורות נטענו', 'headers': headers})

@app.route('/chat', methods=['POST'])
def chat():
    if not csv_embeddings:
        return jsonify({'error': 'לא נטען קובץ CSV'}), 400
    query = request.json.get('query', '')
    if not query:
        return jsonify({'error': 'לא נשלחה שאלה'}), 400

    query_emb = embed_text(query)
    sims = [np.dot(query_emb, emb) / (np.linalg.norm(query_emb) * np.linalg.norm(emb))
            for emb in csv_embeddings]
    best_idx = int(np.argmax(sims))
    best_row = csv_data[best_idx]
    return jsonify({'textResponse': f"השורה הרלוונטית ביותר: {best_row}"})

if __name__ == '__main__':
    app.run(port=8080)
