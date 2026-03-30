"use client";

import { Sphere } from "@/components/sphere";
import { NowPlaying } from "@/components/now-playing";
import { useNowPlaying } from "@/hooks/use-now-playing";

export default function Home() {
  const nowPlaying = useNowPlaying();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-12 px-4">
      <Sphere
        artworkUrl={nowPlaying.artworkUrl}
        isPlaying={nowPlaying.state === "playing"}
      />
      <NowPlaying data={nowPlaying} />

      {!nowPlaying.connected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-2 text-sm text-muted">
          Connecting...
        </div>
      )}
    </main>
  );
}
