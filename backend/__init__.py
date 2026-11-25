import os

# Force PyTorch backend in transformers/sentence-transformers before any submodule imports
os.environ.setdefault("USE_TF", "0")
os.environ.setdefault("USE_TORCH", "1")
