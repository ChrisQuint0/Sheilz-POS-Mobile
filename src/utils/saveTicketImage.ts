import * as MediaLibrary from "expo-media-library";
import { Platform, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

/**
 * Captures a React Native view as a JPEG and saves it to the device's
 * photo gallery.
 *
 * Uses `writeOnly: true` so on iOS we only need the
 * `NSPhotoLibraryAddUsageDescription` permission — the user is never
 * asked to grant full photo-library access.
 *
 * JPEG (with `quality: 0.85`) is used instead of PNG to keep file
 * sizes small — receipts are mostly text on a flat background and
 * compress very well, so the visual difference is negligible.
 *
 * @param viewRef  Ref attached to the view to capture.
 * @param filename Filename (without extension) for the saved image.
 *                 Defaults to "ticket-{timestamp}".
 * @returns        The local file URI of the captured image, or `null` if
 *                 the user denied permission.
 */
export async function saveTicketImage(
  viewRef: React.RefObject<View | null>,
  filename?: string,
): Promise<string | null> {
  // 1. Request add-only media-library permission.
  const permission = await MediaLibrary.requestPermissionsAsync(true);
  if (!permission.granted) {
    throw new Error(
      "Permission to save to the photo library was not granted.",
    );
  }

  // 2. Capture the view as a JPEG in the OS temp/cache directory.
  //    `result: "tmpfile"` returns a `file://` URI that
  //    `MediaLibrary.saveToLibraryAsync` can consume on both platforms.
  const localUri = await captureRef(viewRef, {
    format: "jpg",
    quality: 0.85,
    result: "tmpfile",
  });

  if (Platform.OS === "android" && !localUri.startsWith("file://")) {
    // Android requires a `file:///` URI per the MediaLibrary docs.
    throw new Error("Failed to capture ticket image to a file URI.");
  }

  // 3. Save the captured file to the user's photo gallery.
  await MediaLibrary.saveToLibraryAsync(localUri);

  return localUri;
}

/** Builds a safe filename for a ticket, e.g. `ticket-A001-1709832000000`. */
export function buildTicketFilename(orderNumber: string | number): string {
  const safeOrderNumber = String(orderNumber).replace(/[^a-zA-Z0-9-_]/g, "_");
  return `ticket-${safeOrderNumber}-${Date.now()}`;
}
