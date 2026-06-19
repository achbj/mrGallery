import os
import urllib.request

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
YUNET_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
SFACE_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

def ensure_models_exist():
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)
        
    if not os.path.exists(YUNET_PATH):
        print("Downloading YuNet model (1.7MB)...")
        urllib.request.urlretrieve(YUNET_URL, YUNET_PATH)
        
    if not os.path.exists(SFACE_PATH):
        print("Downloading SFace model (36MB)...")
        urllib.request.urlretrieve(SFACE_URL, SFACE_PATH)

if __name__ == "__main__":
    ensure_models_exist()
