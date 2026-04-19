# Getting started with StudyWeave

The StudyWeave productivity platform is made up of a FastAPI backend and a React.js frontend.
To run the source code on your machine, follow the steps below to set up both the applications and run it on your preferred browser.

## Backend:
### Download all dependencies:
* Navigate to the backend folder of the project: `cd backend`;
* If this is your first time setting up the application:
    - If it is your first time setting up the application, create a Python virtual environment `python -m venv env-name` and access it by running `source env-name/bin/activate`;
    - Run the following command: `pip install -r requirements.txt`;
* If you already created your Python virtual environment and installed the dependencies:
    - Simply access the environment by running: `source env-name/bin/activate`;
* Log into your Hugging Face account through the CLI:
    - Go to your Hugging Face account
    - Select `Create API Key`;
    - Copy the key and save it for later;
    - Type this command in the terminal: `hugging-face login`;
    - Paste your API key when prompted to do so;
* Download Ollama at the following link: [Ollama Download](https://ollama.com/download)
    - Open the Ollama GUI
    - Download the gemma3:4b model and the gemma3:1b model

### Start the backend application:
* Run `uvicorn main:app --reload`.

## Frontend:
### Install all dependencies:
* Navigate to the frontend folder of the project: `cd frontend`;
* Install the dependencies by running `npm install`;

### Start the frontend application:
* Start the React.js application by running `npm start`.



