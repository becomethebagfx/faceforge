"use client";

import { useCallback, useState } from "react";
import { useDropzone, Accept } from "react-dropzone";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  accept?: Accept;
  label?: string;
  maxSize?: number;
  onFileSelect?: (file: File) => void;
}

export function VideoUploader({
  accept = {
    "video/*": [".mp4", ".mov", ".avi", ".webm", ".mkv"],
    "image/*": [".jpg", ".jpeg", ".png", ".webp"],
  },
  label = "Drop files here or click to upload",
  maxSize = 500 * 1024 * 1024, // 500MB default
  onFileSelect,
}: VideoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: unknown[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        setError("File type not supported or file too large");
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith("video/")) {
        // Create video thumbnail
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadeddata = () => {
          video.currentTime = 1;
        };
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            setPreview(canvas.toDataURL("image/jpeg"));
          }
          URL.revokeObjectURL(video.src);
        };
        video.src = URL.createObjectURL(file);
      }

      onFileSelect?.(file);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setFileName(null);
    setError(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50",
        error && "border-destructive"
      )}
    >
      <input {...getInputProps()} />

      {preview ? (
        <div className="relative w-full h-full min-h-[200px] p-4">
          <div className="relative w-full" style={{ height: "180px" }}>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="rounded object-contain"
              unoptimized
            />
          </div>
          <button
            onClick={clearFile}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
          >
            <XIcon className="h-4 w-4" />
          </button>
          {fileName && (
            <p className="mt-2 text-center text-sm text-muted-foreground truncate">
              {fileName}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 p-8 text-center">
          <UploadCloudIcon className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {isDragActive
              ? "Drop the file here"
              : "Supported formats: MP4, MOV, AVI, WebM, JPG, PNG"}
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

function UploadCloudIcon({ className }: { className?: string }) {
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
        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
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
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}
