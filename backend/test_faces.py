import os
import cv2
import numpy as np
from PIL import Image
from pillow_heif import register_heif_opener

register_heif_opener()

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
YUNET_PATH = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
SFACE_PATH = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

detector = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320))
recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")

def test_face(img_path):
    try:
        img = Image.open(img_path).convert('RGB')
        img_np = np.array(img)
        img_bgr = img_np[:, :, ::-1].copy()
        
        h, w, _ = img_bgr.shape
        detector.setInputSize((w, h))
        
        _, faces = detector.detect(img_bgr)
        
        if faces is None:
            print("No faces found.")
            return
            
        print(f"Found {len(faces)} faces.")
        for i, face in enumerate(faces):
            box = face[0:4]
            aligned_face = recognizer.alignCrop(img_bgr, face)
            feature = recognizer.feature(aligned_face)
            print(f"Face {i} box: {box}, feature shape: {feature.shape}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test on any image in the family folder if it exists
    test_face("/Users/achbj/Pictures/family/35mm x45mm.jpg")
