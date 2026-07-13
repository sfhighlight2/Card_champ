import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";

export type ScannerStatus = "idle" | "starting" | "scanning" | "detected" | "error";

interface UseBarcodeScannerResult {
  videoRef: RefObject<HTMLVideoElement>;
  status: ScannerStatus;
  errorMessage: string;
  detectedText: string | null;
  capturedImage: string | null;
  start: () => void;
  stop: () => void;
}

const CAPTURE_MAX_WIDTH = 480;
const CAPTURE_JPEG_QUALITY = 0.7;

function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (!video.videoWidth || !video.videoHeight) return null;
  const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", CAPTURE_JPEG_QUALITY);
}

function describeError(err: unknown): string {
  const message = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || message.includes("permission") || message.includes("denied")) {
    return "Camera access was denied. You can still add this card manually.";
  }
  if (name === "NotFoundError" || message.includes("no camera") || message.includes("not found")) {
    return "No camera was found on this device.";
  }
  if (message.includes("secure") || message.includes("https")) {
    return "Camera access requires a secure (HTTPS) connection.";
  }
  return "Couldn't access the camera. You can still add this card manually.";
}

/**
 * Drives a live camera preview + continuous barcode decode (via @zxing/library)
 * into a caller-provided <video> element. Prefers the rear/environment camera.
 */
export function useBarcodeScanner(): UseBarcodeScannerResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [status, setStatus] = useState<ScannerStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [detectedText, setDetectedText] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const stop = useCallback(() => {
    readerRef.current?.reset();
    readerRef.current = null;
    setStatus("idle");
  }, []);

  const start = useCallback(() => {
    if (!videoRef.current) return;

    setErrorMessage("");
    setDetectedText(null);
    setCapturedImage(null);
    setStatus("starting");

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          const frame = videoRef.current ? captureVideoFrame(videoRef.current) : null;
          setCapturedImage(frame);
          setDetectedText(result.getText());
          setStatus("detected");
          reader.reset();
          return;
        }
        // NotFoundException fires on every frame with no barcode in view — expected, not an error.
        if (error && !(error instanceof NotFoundException)) {
          // A mid-stream decode hiccup isn't fatal; keep scanning.
        }
      })
      .then(() => {
        setStatus(current => (current === "starting" ? "scanning" : current));
      })
      .catch((err: unknown) => {
        setErrorMessage(describeError(err));
        setStatus("error");
      });
  }, []);

  useEffect(() => {
    return () => {
      readerRef.current?.reset();
      readerRef.current = null;
    };
  }, []);

  return { videoRef, status, errorMessage, detectedText, capturedImage, start, stop };
}
