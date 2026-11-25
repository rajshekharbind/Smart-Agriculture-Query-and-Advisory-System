import json
import logging
import re
import numpy as np
from PIL import Image

from backend.app.config import LOW_MEMORY_MODE, MODEL_DIR, ROOT_DIR
from backend.app.llm import GeminiChatWrapper, get_llm

logger = logging.getLogger(__name__)

_HF_MODEL_ID = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"
_hf_processor = None
_hf_model = None


def _get_hf_model():
    """Load and cache the pretrained PyTorch plant-disease image classifier."""
    global _hf_processor, _hf_model
    if _hf_processor is None or _hf_model is None:
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        logger.info("Loading pretrained plant disease model: %s", _HF_MODEL_ID)
        _hf_processor = AutoImageProcessor.from_pretrained(_HF_MODEL_ID)
        _hf_model = AutoModelForImageClassification.from_pretrained(_HF_MODEL_ID)
        _hf_model.eval()
    return _hf_processor, _hf_model


def _predict_with_gemini_vision(filename: str):
    """Low-memory cloud Vision fallback for Render 512MB tier."""
    llm = get_llm()
    if not isinstance(llm, GeminiChatWrapper):
        raise FileNotFoundError(
            "Low-memory mode requires GEMINI_API_KEY or custom model8.keras for image disease analysis."
        )

    with open(filename, "rb") as f:
        img_bytes = f.read()

    ext = filename.rsplit(".", 1)[-1].lower()
    mime = f"image/{'jpeg' if ext in {'jpg', 'jpeg'} else ext}"
    prompt = (
        "Inspect this crop/leaf image. Return ONLY valid JSON (no markdown fences) with keys: "
        '"prediction" (short condition name like "Healthy Leaf" or "Possible Leaf Blight") and '
        '"top_predictions" (array of 3 objects with "label" string and "probability" float between 0 and 1 summing <= 1).'
    )
    raw = llm.analyze_image(img_bytes, mime, prompt).strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    parsed = json.loads(match.group(0)) if match else {}
    top_preds = parsed.get("top_predictions") or [
        {"label": parsed.get("prediction", "Visual Leaf Inspection Needed"), "probability": 0.72}
    ]
    return [{
        "image": parsed.get("prediction") or top_preds[0]["label"],
        "probabilities": [float(x["probability"]) for x in top_preds],
        "top_predictions": [
            {"label": str(x["label"]), "probability": float(x["probability"])}
            for x in top_preds
        ],
        "model_source": f"gemini-vision:{llm.model}",
    }]


class PredictionPipeline:
    """Runs crop disease prediction using custom Keras model if available,
    Gemini Vision in low-memory cloud mode, or local PyTorch PlantVillage MobileNetV2.
    """

    def __init__(self, filename: str):
        self.filename = filename

        candidate_dirs = [MODEL_DIR, ROOT_DIR / "model"]
        model_dir = next(
            (d for d in candidate_dirs if (d / "model8.keras").exists()),
            MODEL_DIR,
        )
        self.model_path = model_dir / "model8.keras"
        self.class_indices_path = model_dir / "class_indices.json"
        self.use_keras = self.model_path.exists() and self.class_indices_path.exists()

        if self.use_keras:
            try:
                from tensorflow.keras.models import load_model
                from tensorflow.keras.preprocessing import image as keras_image
            except Exception:
                from keras.models import load_model
                from keras.utils import img_to_array, load_img

                class _ImageHelper:
                    load_img = staticmethod(load_img)
                    img_to_array = staticmethod(img_to_array)

                keras_image = _ImageHelper

            self._keras_image = keras_image
            self.model = load_model(str(self.model_path))

            with open(self.class_indices_path, "r", encoding="utf-8") as f:
                self.class_indices = json.load(f)

            self.class_labels = {v: k for k, v in self.class_indices.items()}

    def predict(self):
        if self.use_keras:
            img = self._keras_image.load_img(self.filename, target_size=(224, 224))
            img_array = self._keras_image.img_to_array(img)
            img_array = np.expand_dims(img_array, axis=0) / 255.0

            preds = self.model.predict(img_array)
            probs = preds[0].tolist()
            predicted_class_index = int(np.argmax(preds, axis=1)[0])
            predicted_class = self.class_labels.get(
                predicted_class_index, f"Class {predicted_class_index}"
            )
            top_predictions = sorted(
                [
                    {
                        "label": self.class_labels.get(i, f"Class {i}"),
                        "probability": float(p),
                    }
                    for i, p in enumerate(probs)
                ],
                key=lambda x: x["probability"],
                reverse=True,
            )[:5]

            return [{
                "image": predicted_class,
                "probabilities": probs,
                "top_predictions": top_predictions,
                "model_source": "custom:model8.keras",
            }]

        if LOW_MEMORY_MODE:
            return _predict_with_gemini_vision(self.filename)

        import torch

        processor, model = _get_hf_model()
        with Image.open(self.filename) as img:
            rgb_img = img.convert("RGB")
            inputs = processor(images=rgb_img, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)
            probs_tensor = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]

        probs = probs_tensor.tolist()
        id2label = model.config.id2label
        ranked = sorted(
            [
                {"label": id2label.get(i, f"Class {i}"), "probability": float(p)}
                for i, p in enumerate(probs)
            ],
            key=lambda x: x["probability"],
            reverse=True,
        )[:5]

        return [{
            "image": ranked[0]["label"],
            "probabilities": [item["probability"] for item in ranked],
            "top_predictions": ranked,
            "model_source": f"pretrained:{_HF_MODEL_ID}",
        }]
