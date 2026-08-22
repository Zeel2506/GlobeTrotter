"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Share2, Copy, Check, Globe, Lock, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

/**
 * S11 sharing control. Un-share retains the slug (DECISIONS.md D-07), so
 * re-sharing later revives previously copied links rather than breaking them.
 */
export function ShareDialog({
  tripId,
  tripName,
  isPublic,
  publicSlug,
}: {
  tripId: string;
  tripName: string;
  isPublic: boolean;
  publicSlug: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [slug, setSlug] = useState(publicSlug);
  const [live, setLive] = useState(isPublic);

  const url = slug && typeof window !== "undefined" ? `${window.location.origin}/p/${slug}` : "";

  async function share() {
    setLoading(true);
    try {
      const res = await api.post<{ publicSlug: string }>(`/api/trips/${tripId}/share`);
      setSlug(res.publicSlug);
      setLive(true);
      toast.success("Trip is now public — anyone with the link can view it.");
      router.refresh();
    } catch {
      toast.error("Could not share this trip.");
    } finally {
      setLoading(false);
    }
  }

  async function unshare() {
    setLoading(true);
    try {
      await api.post(`/api/trips/${tripId}/unshare`);
      setLive(false);
      toast.success("Trip is private again. The old link no longer works.");
      router.refresh();
    } catch {
      toast.error("Could not un-share this trip.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the link and copy it manually.");
    }
  }

  const shareText = `Check out my trip: ${tripName}`;

  return (
    <>
      <Button variant={live ? "soft" : "secondary"} onClick={() => setOpen(true)}>
        <Share2 />
        {live ? "Shared" : "Share"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Share this trip</DialogTitle>
            <DialogDescription>
              {live
                ? "Anyone with this link can view the itinerary — no account needed."
                : "Publish a read-only link that anyone can open, and any traveller can copy."}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="flex flex-col gap-4">
            {live && url ? (
              <>
                <div className="flex gap-2">
                  <Input readOnly value={url} className="flex-1 text-[13px]" />
                  <Button variant="secondary" onClick={copy} aria-label="Copy link">
                    {copied ? <Check className="text-success" /> : <Copy />}
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="secondary" size="sm">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp
                    </a>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      X / Twitter
                    </a>
                  </Button>
                  <Button asChild variant="secondary" size="sm">
                    <a
                      href={`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(url)}`}
                    >
                      <Mail />
                      Email
                    </a>
                  </Button>
                </div>
              </>
            ) : (
              <p className="rounded-[var(--radius)] bg-surface-muted px-3.5 py-3 text-[13px] text-foreground-muted">
                This trip is private. Only you can see it.
              </p>
            )}
          </DialogBody>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Close
            </Button>
            {live ? (
              <Button variant="danger" onClick={unshare} loading={loading}>
                <Lock />
                Make private
              </Button>
            ) : (
              <Button onClick={share} loading={loading}>
                <Globe />
                Make public
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
