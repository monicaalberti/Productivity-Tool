# SETTING UP STUDYWEAVE BACKEND 
The backend of the StudyWeave platform is a FastAPI application. To run it locally, follow the steps below.

## Download all dependencies:
1. Navigate to the backend folder of the project: `cd backend`;
2. If this is your first time setting up the application:
    - If it is your first time setting up the application, create a Python virtual environment `python -m venv env-name` and access it by running `source env-name/bin/activate`;
    - Run the following command: `pip install -r requirements.txt`;
3. If you already created your Python virtual environment and installed the dependencies:
    - Simply access the environment by running: `source env-name/bin/activate`;
4. Log into your Hugging Face account through the CLI:
    - Go to your Hugging Face account
    - Select `Create API Key`
    - Copy the key and save it for later
    - Type this command in the terminal: `hugging-face login`
    - Paste your API key when prompted to do so
5. Download Ollama at the following link: [Ollama Download](https://ollama.com/download)
    - Open the Ollama GUI
    - Download the gemma3:4b model and the gemma3:1b model

## Start the backend application:
6. Run `uvicorn main:app --reload`.

