import PyInstaller.__main__
import os
import sys

# Change to the backend directory
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
os.chdir(backend_dir)

args = [
    'main.py',
    '--name=backend',
    '--onefile',
    '--noconsole',           # No black console window on Windows
    f'--distpath={os.path.abspath("dist")}',
    f'--workpath={os.path.abspath("build")}',
    f'--specpath={os.path.abspath(".")}',
    '--noconfirm',

    # Core server stack
    '--hidden-import=uvicorn',
    '--hidden-import=uvicorn.logging',
    '--hidden-import=uvicorn.loops',
    '--hidden-import=uvicorn.loops.auto',
    '--hidden-import=uvicorn.loops.asyncio',
    '--hidden-import=uvicorn.protocols',
    '--hidden-import=uvicorn.protocols.http',
    '--hidden-import=uvicorn.protocols.http.auto',
    '--hidden-import=uvicorn.protocols.http.h11_impl',
    '--hidden-import=uvicorn.protocols.websockets',
    '--hidden-import=uvicorn.protocols.websockets.auto',
    '--hidden-import=uvicorn.lifespan',
    '--hidden-import=uvicorn.lifespan.on',

    # Database
    '--hidden-import=sqlalchemy.ext.asyncio',
    '--hidden-import=sqlalchemy.dialects.sqlite',
    '--hidden-import=aiosqlite',

    # Image / video processing
    '--hidden-import=cv2',
    '--hidden-import=numpy',
    '--hidden-import=PIL',
    '--hidden-import=PIL.Image',
    '--hidden-import=pillow_heif',

    # Misc
    '--hidden-import=exifread',
    '--hidden-import=anyio',
    '--hidden-import=anyio.lowlevel',
    '--hidden-import=starlette',
    '--hidden-import=fastapi',
]

# Only bundle models if they exist (face detection is optional)
models_dir = os.path.abspath("models")
if os.path.exists(models_dir) and os.listdir(models_dir):
    sep = os.pathsep
    args.append(f'--add-data={models_dir}{sep}models/')
    print(f"Bundling models from: {models_dir}")
else:
    print("No models/ directory found — face detection will be disabled in the build.")

print("Running PyInstaller...")
PyInstaller.__main__.run(args)
print("Done.")
