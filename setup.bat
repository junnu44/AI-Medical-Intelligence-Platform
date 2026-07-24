@echo off
d:
cd "d:\New folder\projects\GSD\Advanced-AI-Medical-Intelligence-Platform"
mkdir backend
mkdir frontend
mkdir dataset
mkdir models
mkdir notebooks
mkdir reports
mkdir docs
mkdir training
mkdir tests
git init
python -m venv venv
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
