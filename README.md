# Ask Questions in Hebrew about CSV Files – Fully Offline

This system allows users to upload a local CSV file and ask free-form questions in **Hebrew** without requiring any external API.
It is based on **semantic search** using a Hebrew language model such as `heBERT` (or any compatible embedding model), and everything runs **locally**.

## Project Description

This project is designed for users who want to analyze and explore CSV data using natural Hebrew questions without sending the data over the internet.
It converts both the user's question and the CSV rows into embeddings (vectors) and finds the best match using **cosine similarity**.

## Suitable Use Cases

* Research or data analysis of Hebrew CSV files
* Privacy-sensitive environments with no internet access
* Easy integration of local NLP into existing apps
* Useful for data analysts, researchers, and students

## System Requirements

* Python 3.8+
* Node.js and a modern web browser (for the frontend)
* Local language model such as `heBERT` or `all-MiniLM-L6-v2`
* Main Python libraries:

  * sentence-transformers
  * fastapi
  * pandas
  * scikit-learn
  * uvicorn
  * fastapi.middleware.cors for CORS support
* Frontend: basic HTML/JavaScript (no frameworks needed)

## Installation

1. Install Python dependencies:


pip install -r requirements.txt


2. Run the local backend server:


uvicorn server:app --host 0.0.0.0 --port 8080


3. Open index.html file in your browser.

## Usage Example

1. Upload a CSV file with Hebrew/English content.

2. Once loaded, type a question like:

   * "Which student got the highest grade?"
   * "How many products were sold in March?"
   * "What is the name of the employee who got the highest bonus?"

3. The system will analyze the data and return the most relevant answer.

## Architecture Overview

* **Frontend**: Simple HTML/JavaScript interface to upload CSV and send questions
* **Backend**: FastAPI server that processes the data, generates embeddings, and compares the user question to the dataset
* **Embedding Model**: Uses a Hebrew-compatible model to vectorize questions and rows, comparing them via cosine similarity

<img width="736" alt="image" src="https://github.com/user-attachments/assets/c6c14334-8bb6-4ff3-bd7b-d2096324b642" />

