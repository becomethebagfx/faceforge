import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky Navigation - Minimalist style inspired by navbar.design */}
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
              <Button variant="ghost" size="sm">
                Live
              </Button>
            </Link>
            <div className="ml-2 h-4 w-px bg-border" />
            <Link href="/upload">
              <Button size="sm" className="ml-2">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              AI-Powered Face Transformation
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Transform faces in
              <span className="bg-gradient-to-r from-primary via-orange-400 to-amber-300 bg-clip-text text-transparent">
                {" "}real-time
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Professional face swapping technology that preserves quality.
              Upload videos or go live with instant transformation.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
              <Link href="/upload">
                <Button size="lg" className="h-12 px-8 text-base">
                  Start Uploading
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/live">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base">
                  Try Live Mode
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto px-6 py-24">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight">Two powerful modes</h2>
              <p className="mt-3 text-muted-foreground">
                Choose how you want to transform your content
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UploadIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Upload Mode</CardTitle>
                  <CardDescription className="text-base">
                    Drop in your pre-recorded videos and images for high-quality
                    face swapping with batch processing support.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Upload video or image files
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Voice cloning with ElevenLabs
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Lip sync options (Quick/Quality)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Download HD results
                    </li>
                  </ul>
                  <Link href="/upload" className="block">
                    <Button className="w-full">
                      Start Uploading
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <CardHeader className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <VideoIcon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-2xl">Live Mode</CardTitle>
                  <CardDescription className="text-base">
                    Real-time face transformation using your webcam.
                    Record and download your transformed video instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative">
                  <ul className="mb-6 space-y-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Real-time webcam processing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Low latency face swapping
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Record your session
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4 text-primary" />
                      Perfect for content creation
                    </li>
                  </ul>
                  <Link href="/live" className="block">
                    <Button variant="secondary" className="w-full">
                      Go Live
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="border-t border-border">
          <div className="container mx-auto px-6 py-16">
            <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-primary">[01]</span>
                InsightFace
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-primary">[02]</span>
                Wav2Lip
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-primary">[03]</span>
                ElevenLabs
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-primary">[04]</span>
                WebRTC
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs text-primary">[05]</span>
                GPU Accelerated
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <FaceIcon className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>FaceForge</span>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered face transformation technology
          </p>
        </div>
      </footer>
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

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}
