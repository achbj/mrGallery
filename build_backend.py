import PyInstaller.__main__
import os
import sys

# Change to the backend directory
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend'))

# Check if models exist
if not os.path.exists("models"):
    print("Warning: models directory not found in backend/")
    sys.exit(1)

PyInstaller.__main__.run([
    'main.py',
    '--name=backend',
    '--onefile',
    f'--add-data=models/*{os.pathsep}models/',  # Package models folder
    '--hidden-import=uvicorn',
    '--hidden-import=sqlalchemy.ext.asyncio',
    '--hidden-import=cv2',
    '--hidden-import=numpy',
    '--hidden-import=Pillow',
    '--hidden-import=exifread',
    '--noconfirm',
])
