import json
import logging
import numpy as np
from PIL import Image

from backend.app.config import MODEL_DIR, ROOT_DIR

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


class PredictionPipeline:
    """Runs crop disease prediction using custom Keras model if available,
    otherwise falls back to a pretrained PyTorch/Transformers plant-disease model.
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
