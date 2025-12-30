/**
 * FaceForge API client
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface JobInfo {
  job_id: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  filename?: string;
  created_at: string;
  updated_at: string;
  file_size?: number;
  error?: string;
  progress?: number;
  output_url?: string;
}

export interface UploadResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface ProcessResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface ResultResponse {
  job_id: string;
  status: string;
  output_url?: string;
  error?: string;
  processing_time_seconds?: number;
}

/**
 * Upload a video file for processing
 */
export async function uploadVideo(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/v1/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}

/**
 * Get upload job status
 */
export async function getJobStatus(jobId: string): Promise<JobInfo> {
  const response = await fetch(`${API_BASE}/api/v1/upload/status/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get job status');
  }

  return response.json();
}

/**
 * Start processing a job
 */
export async function startProcessing(
  jobId: string,
  options?: {
    face_detection_threshold?: number;
    output_format?: string;
    lip_sync?: boolean;
    voice?: string;
    quality?: 'fast' | 'balanced' | 'high';
  }
): Promise<ProcessResponse> {
  const response = await fetch(`${API_BASE}/api/v1/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      job_id: jobId,
      ...options,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start processing');
  }

  return response.json();
}

/**
 * Get processing result
 */
export async function getProcessingResult(jobId: string): Promise<ResultResponse> {
  const response = await fetch(`${API_BASE}/api/v1/process/result/${jobId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get result');
  }

  return response.json();
}

/**
 * Poll job status until completion
 */
export async function pollJobStatus(
  jobId: string,
  onProgress?: (job: JobInfo) => void,
  intervalMs = 1000
): Promise<JobInfo> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const job = await getJobStatus(jobId);
        onProgress?.(job);

        if (job.status === 'completed' || job.status === 'failed') {
          resolve(job);
          return;
        }

        setTimeout(poll, intervalMs);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
