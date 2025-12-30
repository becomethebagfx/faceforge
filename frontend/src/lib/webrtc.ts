/**
 * WebRTC helpers for webcam capture and media handling
 */

export interface CameraConstraints {
  width?: number;
  height?: number;
  frameRate?: number;
  facingMode?: 'user' | 'environment';
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}

/**
 * Get list of available camera devices
 */
export async function getCameraDevices(): Promise<CameraDevice[]> {
  try {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ video: true });

    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'videoinput')
      .map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
      }));
  } catch (error) {
    console.error('Failed to get camera devices:', error);
    return [];
  }
}

/**
 * Start webcam capture
 */
export async function startCamera(
  constraints?: CameraConstraints & { deviceId?: string }
): Promise<MediaStream> {
  const videoConstraints: MediaTrackConstraints = {
    width: { ideal: constraints?.width || 1280 },
    height: { ideal: constraints?.height || 720 },
    frameRate: { ideal: constraints?.frameRate || 30 },
    facingMode: constraints?.facingMode || 'user',
  };

  if (constraints?.deviceId) {
    videoConstraints.deviceId = { exact: constraints.deviceId };
  }

  return navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  });
}

/**
 * Stop all tracks in a media stream
 */
export function stopCamera(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Capture a single frame from video element as JPEG blob
 */
export function captureFrame(
  video: HTMLVideoElement,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

/**
 * Create a frame capture loop
 */
export function createFrameLoop(
  video: HTMLVideoElement,
  onFrame: (blob: Blob) => void,
  fps = 15
): { start: () => void; stop: () => void } {
  let animationId: number | null = null;
  let lastCaptureTime = 0;
  const frameInterval = 1000 / fps;

  const capture = async (timestamp: number) => {
    if (timestamp - lastCaptureTime >= frameInterval) {
      try {
        const blob = await captureFrame(video);
        onFrame(blob);
        lastCaptureTime = timestamp;
      } catch (error) {
        console.error('Frame capture error:', error);
      }
    }

    animationId = requestAnimationFrame(capture);
  };

  return {
    start: () => {
      if (!animationId) {
        animationId = requestAnimationFrame(capture);
      }
    },
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
  };
}

/**
 * Convert blob to array buffer
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Convert array buffer to blob
 */
export function arrayBufferToBlob(
  buffer: ArrayBuffer,
  type = 'image/jpeg'
): Blob {
  return new Blob([buffer], { type });
}

/**
 * Create object URL from blob
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke object URL
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}
