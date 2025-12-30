#!/bin/bash
# FaceForge Model Downloader
# Downloads required AI models for face swap and lip sync

set -e

MODELS_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "Downloading models to: $MODELS_DIR"

# InsightFace inswapper model
echo "Downloading InsightFace inswapper_128.onnx..."
if [ ! -f "$MODELS_DIR/inswapper_128.onnx" ]; then
    curl -L -o "$MODELS_DIR/inswapper_128.onnx" \
        "https://huggingface.co/deepinsight/inswapper/resolve/main/inswapper_128.onnx"
    echo "✓ inswapper_128.onnx downloaded"
else
    echo "✓ inswapper_128.onnx already exists"
fi

# Wav2Lip model (GAN version for better quality)
echo "Downloading Wav2Lip wav2lip_gan.pth..."
if [ ! -f "$MODELS_DIR/wav2lip_gan.pth" ]; then
    curl -L -o "$MODELS_DIR/wav2lip_gan.pth" \
        "https://huggingface.co/numz/wav2lip_studio/resolve/main/Wav2lip/wav2lip_gan.pth"
    echo "✓ wav2lip_gan.pth downloaded"
else
    echo "✓ wav2lip_gan.pth already exists"
fi

# Face detection model for Wav2Lip (s3fd)
echo "Downloading face detection s3fd.pth..."
if [ ! -f "$MODELS_DIR/s3fd.pth" ]; then
    curl -L -o "$MODELS_DIR/s3fd.pth" \
        "https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth"
    echo "✓ s3fd.pth downloaded"
else
    echo "✓ s3fd.pth already exists"
fi

# InsightFace buffalo_l model (for face analysis)
echo "Downloading InsightFace buffalo_l model..."
BUFFALO_DIR="$MODELS_DIR/buffalo_l"
if [ ! -d "$BUFFALO_DIR" ]; then
    mkdir -p "$BUFFALO_DIR"
    curl -L -o "$BUFFALO_DIR/det_10g.onnx" \
        "https://huggingface.co/deepinsight/insightface/resolve/main/models/buffalo_l/det_10g.onnx"
    curl -L -o "$BUFFALO_DIR/w600k_r50.onnx" \
        "https://huggingface.co/deepinsight/insightface/resolve/main/models/buffalo_l/w600k_r50.onnx"
    curl -L -o "$BUFFALO_DIR/2d106det.onnx" \
        "https://huggingface.co/deepinsight/insightface/resolve/main/models/buffalo_l/2d106det.onnx"
    echo "✓ buffalo_l models downloaded"
else
    echo "✓ buffalo_l models already exist"
fi

echo ""
echo "=== All models downloaded successfully ==="
echo "Total size:"
du -sh "$MODELS_DIR"
