"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { VideoUploader } from "@/components/VideoUploader";
import { VideoPlayer } from "@/components/VideoPlayer";
import { uploadVideo, startProcessing, pollJobStatus } from "@/lib/api";

type ProcessingStatus = "idle" | "uploading" | "processing" | "completed" | "error";

export default function UploadPage() {
  const [sourceFace, setSourceFace] = useState<File | null>(null);
  const [targetMedia, setTargetMedia] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleSourceFaceSelect = useCallback((file: File) => {
    setSourceFace(file);
    setError(null);
  }, []);

  const handleTargetMediaSelect = useCallback((file: File) => {
    setTargetMedia(file);
    setError(null);
  }, []);

  const handleStartProcessing = async () => {
    if (!sourceFace || !targetMedia) {
      setError("Please upload both a source face and target media");
      return;
    }

    setError(null);
    setStatus("uploading");
    setProgress(0);

    try {
      // Upload the target media first
      setProgress(10);
      const uploadResult = await uploadVideo(targetMedia);
      setJobId(uploadResult.job_id);
      setProgress(30);

      // Start processing
      setStatus("processing");
      await startProcessing(uploadResult.job_id, {
        lip_sync: true,
        voice: "original",
      });
      setProgress(50);

      // Poll for completion
      const finalJob = await pollJobStatus(
        uploadResult.job_id,
        (job) => {
          // Update progress based on job status
          if (job.status === "processing") {
            setProgress(Math.min(90, 50 + (job.progress || 0) * 0.4));
          }
        },
        2000
      );

      if (finalJob.status === "completed" && finalJob.output_url) {
        setResultUrl(finalJob.output_url);
        setStatus("completed");
        setProgress(100);
      } else if (finalJob.status === "failed") {
        throw new Error(finalJob.error || "Processing failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setSourceFace(null);
    setTargetMedia(null);
    setStatus("idle");
    setProgress(0);
    setError(null);
    setResultUrl(null);
    setJobId(null);
  };

  const canProcess = sourceFace && targetMedia && status === "idle";
  const isProcessing = status === "uploading" || status === "processing";

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
              <Button variant="ghost" size="sm" className="text-primary">
                Upload
              </Button>
            </Link>
            <Link href="/live">
              <Button variant="ghost" size="sm">
                Live
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            <UploadIcon className="h-3 w-3" />
            Upload Mode
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Upload & Transform
          </h1>
          <p className="mt-2 text-muted-foreground">
            Upload your videos and images for high-quality face swapping
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Inputs */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FaceIcon className="h-4 w-4" />
                  </div>
                  Source Face
                  {sourceFace && (
                    <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Loaded
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Upload an image of the face you want to use as the source
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoUploader
                  accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                  label="Drop source face image here"
                  onFileSelect={handleSourceFaceSelect}
                />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <VideoIcon className="h-4 w-4" />
                  </div>
                  Target Media
                  {targetMedia && (
                    <span className="ml-auto text-xs text-green-500 flex items-center gap-1">
                      <CheckIcon className="h-3 w-3" />
                      Loaded
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Upload the video or image where you want to swap faces
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="video">
                  <TabsList className="mb-4 grid w-full grid-cols-2">
                    <TabsTrigger value="video">Video</TabsTrigger>
                    <TabsTrigger value="image">Image</TabsTrigger>
                  </TabsList>
                  <TabsContent value="video">
                    <VideoUploader
                      accept={{
                        "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
                      }}
                      label="Drop target video here"
                      onFileSelect={handleTargetMediaSelect}
                    />
                  </TabsContent>
                  <TabsContent value="image">
                    <VideoUploader
                      accept={{ "image/*": [".jpg", ".jpeg", ".png", ".webp"] }}
                      label="Drop target image here"
                      onFileSelect={handleTargetMediaSelect}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Processing Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Quality</span>
                  <span className="font-medium">High</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Face Enhancement</span>
                  <span className="font-medium">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Lip Sync</span>
                  <span className="font-medium">Auto</span>
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStartProcessing}
                  disabled={!canProcess || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
                      {status === "uploading" ? "Uploading..." : "Processing..."}
                    </>
                  ) : status === "completed" ? (
                    "Process Again"
                  ) : (
                    <>
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Start Processing
                    </>
                  )}
                </Button>

                {status === "completed" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleReset}
                  >
                    Reset & Start Over
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {resultUrl
                    ? "Your processed result"
                    : "Preview will appear here after processing"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VideoPlayer src={resultUrl || undefined} />
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-base">Processing Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                <div className="text-sm">
                  {status === "idle" && (
                    <span className="text-muted-foreground">
                      {sourceFace && targetMedia
                        ? "Ready to process"
                        : "Upload files to begin"}
                    </span>
                  )}
                  {status === "uploading" && (
                    <span className="text-primary">Uploading files...</span>
                  )}
                  {status === "processing" && (
                    <span className="text-primary">Processing video...</span>
                  )}
                  {status === "completed" && (
                    <span className="text-green-500 flex items-center gap-1">
                      <CheckIcon className="h-4 w-4" />
                      Processing complete!
                    </span>
                  )}
                  {status === "error" && (
                    <span className="text-destructive">{error}</span>
                  )}
                </div>

                {resultUrl && (
                  <Button className="w-full" asChild>
                    <a href={resultUrl} download>
                      <DownloadIcon className="mr-2 h-4 w-4" />
                      Download Result
                    </a>
                  </Button>
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

function UploadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
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
        d="m15.75 10.5 4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
      />
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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
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
