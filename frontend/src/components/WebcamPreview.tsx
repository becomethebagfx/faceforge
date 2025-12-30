"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  startCamera,
  stopCamera,
  createFrameLoop,
  getCameraDevices,
  type CameraDevice,
} from "@/lib/webrtc";
import {
  createStreamClient,
  type StreamClient,
  type StreamStats,
} from "@/lib/websocket";

interface WebcamPreviewProps {
  className?: string;
  targetFace?: Blob | null;
  onStatsUpdate?: (stats: StreamStats) => void;
}

export function WebcamPreview({
  className,
  targetFace,
  onStatsUpdate,
}: WebcamPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamClientRef = useRef<StreamClient | null>(null);
  const frameLoopRef = useRef<{ start: () => void; stop: () => void } | null>(
    null
  );

  const [isStreaming, setIsStreaming] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);

  // Initialize camera list
  useEffect(() => {
    getCameraDevices().then((devices) => {
      setCameras(devices);
      if (devices.length > 0 && !selectedCamera) {
        setSelectedCamera(devices[0].deviceId);
      }
    });
  }, [selectedCamera]);

  // Handle processed frames from WebSocket
  const handleProcessedFrame = useCallback((blob: Blob) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(blob);
  }, []);

  // Start camera
  const handleStartCamera = async () => {
    setError(null);

    try {
      const stream = await startCamera({
        deviceId: selectedCamera || undefined,
        width: 1280,
        height: 720,
        frameRate: 30,
      });

      setMediaStream(stream);
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      console.error("Camera error:", err);
    }
  };

  // Stop camera
  const handleStopCamera = () => {
    if (mediaStream) {
      stopCamera(mediaStream);
      setMediaStream(null);
    }

    if (frameLoopRef.current) {
      frameLoopRef.current.stop();
      frameLoopRef.current = null;
    }

    setIsStreaming(false);
    setIsProcessing(false);
  };

  // Start face swap processing
  const handleStartProcessing = async () => {
    if (!videoRef.current || !mediaStream) return;

    setError(null);

    try {
      // Create WebSocket client
      const client = createStreamClient();
      streamClientRef.current = client;

      // Set up event handlers
      client.on((event) => {
        switch (event.type) {
          case "connected":
            setIsConnected(true);
            break;
          case "disconnected":
            setIsConnected(false);
            break;
          case "frame":
            handleProcessedFrame(event.data);
            break;
          case "stats":
            setStats(event.stats);
            onStatsUpdate?.(event.stats);
            break;
          case "error":
            setError(event.error.message);
            break;
        }
      });

      // Connect
      await client.connect();

      // Set target face if available
      if (targetFace) {
        await client.setTargetFace(targetFace);
      }

      // Set up canvas for processed frames
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth || 1280;
        canvasRef.current.height = videoRef.current.videoHeight || 720;
      }

      // Start frame capture loop
      frameLoopRef.current = createFrameLoop(
        videoRef.current,
        (blob) => {
          client.sendFrame(blob);
        },
        15 // 15 FPS
      );

      frameLoopRef.current.start();
      setIsProcessing(true);

      // Request stats periodically
      const statsInterval = setInterval(() => {
        if (client.isConnected) {
          client.requestStats();
        }
      }, 1000);

      // Clean up interval on stop
      const originalStop = frameLoopRef.current.stop;
      frameLoopRef.current.stop = () => {
        clearInterval(statsInterval);
        originalStop();
      };
    } catch (err) {
      setError("Failed to connect to processing server.");
      console.error("Processing error:", err);
    }
  };

  // Stop processing
  const handleStopProcessing = () => {
    if (frameLoopRef.current) {
      frameLoopRef.current.stop();
      frameLoopRef.current = null;
    }

    if (streamClientRef.current) {
      streamClientRef.current.disconnect();
      streamClientRef.current = null;
    }

    setIsProcessing(false);
    setIsConnected(false);
    setStats(null);
  };

  // Update target face when it changes
  useEffect(() => {
    if (targetFace && streamClientRef.current?.isConnected) {
      streamClientRef.current.setTargetFace(targetFace);
    }
  }, [targetFace]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      handleStopCamera();
      handleStopProcessing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="mb-4">
          <select
            value={selectedCamera}
            onChange={(e) => setSelectedCamera(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            disabled={isStreaming}
          >
            {cameras.map((camera) => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video Display */}
      <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
        {/* Original webcam feed (hidden when processing) */}
        <video
          ref={videoRef}
          className={cn(
            "h-full w-full object-contain",
            isProcessing && "hidden"
          )}
          muted
          playsInline
        />

        {/* Processed frame canvas (shown when processing) */}
        <canvas
          ref={canvasRef}
          className={cn(
            "h-full w-full object-contain",
            !isProcessing && "hidden"
          )}
        />

        {/* Placeholder when not streaming */}
        {!isStreaming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <CameraIcon className="h-16 w-16" />
            <p className="text-sm">Camera not started</p>
          </div>
        )}

        {/* Status Overlay */}
        {isStreaming && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <div
              className={cn(
                "h-3 w-3 rounded-full",
                isProcessing && isConnected
                  ? "animate-pulse bg-green-500"
                  : isProcessing
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              )}
            />
            <span className="text-xs text-white drop-shadow-lg">
              {isProcessing && isConnected
                ? `Processing • ${stats?.fps.toFixed(1) || 0} FPS`
                : isProcessing
                ? "Connecting..."
                : "Camera Active"}
            </span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        {!isStreaming ? (
          <Button onClick={handleStartCamera} className="flex-1">
            <CameraIcon className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        ) : (
          <>
            <Button
              onClick={handleStopCamera}
              variant="outline"
              className="flex-1"
            >
              Stop Camera
            </Button>
            {!isProcessing ? (
              <Button
                onClick={handleStartProcessing}
                className="flex-1"
                disabled={!targetFace}
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                Start Swapping
              </Button>
            ) : (
              <Button
                onClick={handleStopProcessing}
                variant="destructive"
                className="flex-1"
              >
                <StopIcon className="mr-2 h-4 w-4" />
                Stop Swapping
              </Button>
            )}
          </>
        )}
      </div>

      {/* Stats Display */}
      {stats && (
        <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
          <div className="rounded-md bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{stats.fps.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">FPS</div>
          </div>
          <div className="rounded-md bg-muted p-3 text-center">
            <div className="text-2xl font-bold">{stats.frames_processed}</div>
            <div className="text-xs text-muted-foreground">Frames</div>
          </div>
          <div className="rounded-md bg-muted p-3 text-center">
            <div className="text-2xl font-bold">
              {stats.has_target_face ? "Yes" : "No"}
            </div>
            <div className="text-xs text-muted-foreground">Face Set</div>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
      />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z"
        clipRule="evenodd"
      />
    </svg>
  );
}
