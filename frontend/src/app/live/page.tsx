"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VideoUploader } from "@/components/VideoUploader";
import { WebcamPreview } from "@/components/WebcamPreview";
import type { StreamStats } from "@/lib/websocket";

export default function LivePage() {
  const [targetFace, setTargetFace] = useState<Blob | null>(null);
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFaceSelect = useCallback((file: File) => {
    setTargetFace(file);
  }, []);

  const handleStatsUpdate = useCallback((newStats: StreamStats) => {
    setStats(newStats);
  }, []);

  const handleStartRecording = useCallback(() => {
    // Get the canvas element from the WebcamPreview
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.error('No canvas found for recording');
      return;
    }

    const stream = canvas.captureStream(30);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      setRecordedChunks(chunks);
    };

    mediaRecorder.start(1000); // Collect data every second
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingDuration(0);

    // Start duration counter
    recordingIntervalRef.current = setInterval(() => {
      setRecordingDuration((d) => d + 1);
    }, 1000);
  }, []);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
  }, []);

  const handleDownloadRecording = useCallback(() => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `faceforge-recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [recordedChunks]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const canRecord = stats !== null; // Can record when processing is active

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FaceIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">FaceForge</span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link href="/upload">
              <Button variant="ghost" size="sm">
                Upload
              </Button>
            </Link>
            <Link href="/live">
              <Button variant="ghost" size="sm" className="text-primary">
                Live
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Live Mode
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Real-time Face Transformation
          </h1>
          <p className="mt-2 text-muted-foreground">
            Transform your webcam feed in real-time with face swapping
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FaceIcon className="h-4 w-4" />
                  </div>
                  Target Face
                  {targetFace && (
                    <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Loaded
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Upload the face you want to swap to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoUploader
                  accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                  label="Drop face image here"
                  onFileSelect={handleFaceSelect}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">FPS</span>
                    <span className="font-mono text-primary">
                      {stats?.fps.toFixed(1) || "0.0"}
                    </span>
                  </div>
                  <Progress value={(stats?.fps || 0) * 3.33} className="h-1.5" />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Frames Processed</span>
                  <span className="font-mono">{stats?.frames_processed || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Face Loaded</span>
                  <span
                    className={
                      stats?.has_target_face ? "text-green-500" : "text-muted-foreground"
                    }
                  >
                    {stats?.has_target_face ? "Yes" : "No"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resolution</span>
                  <span>1280x720</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Target FPS</span>
                  <span>15</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Quality</span>
                  <span>High</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Live Preview</CardTitle>
                    <CardDescription>
                      Your webcam feed with real-time face transformation
                    </CardDescription>
                  </div>
                  {stats && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-muted-foreground">Streaming</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <WebcamPreview
                  targetFace={targetFace}
                  onStatsUpdate={handleStatsUpdate}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Recording</CardTitle>
                <CardDescription>
                  Record your transformed video for later use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      isRecording ? 'bg-destructive/20 text-destructive' : 'bg-muted text-muted-foreground'
                    }`}>
                      <RecordIcon className={`h-5 w-5 ${isRecording ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isRecording ? `Recording... ${formatDuration(recordingDuration)}` : 'Not Recording'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {!canRecord
                          ? 'Start camera and processing to enable recording'
                          : isRecording
                          ? 'Click Stop to finish recording'
                          : 'Ready to record'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!isRecording ? (
                      <Button
                        variant="secondary"
                        onClick={handleStartRecording}
                        disabled={!canRecord}
                      >
                        <RecordIcon className="mr-2 h-4 w-4" />
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        onClick={handleStopRecording}
                      >
                        <StopIcon className="mr-2 h-4 w-4" />
                        Stop Recording
                      </Button>
                    )}
                  </div>
                </div>

                {recordedChunks.length > 0 && !isRecording && (
                  <div className="mt-4 flex items-center justify-between rounded-md bg-green-500/10 p-3">
                    <div className="flex items-center gap-2 text-sm text-green-500">
                      <CheckIcon className="h-4 w-4" />
                      Recording saved! Ready to download.
                    </div>
                    <Button size="sm" onClick={handleDownloadRecording}>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function FaceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RecordIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 15a3 3 0 100-6 3 3 0 000 6z"
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

function DownloadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}
