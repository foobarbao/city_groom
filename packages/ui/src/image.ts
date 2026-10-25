/**
 * @file Photo preparation before sending: downscaled to keep messages light
 * (the demo stores them on the device, whose storage is limited).
 */

/** Longest side of a sent photo, in pixels. */
const MAX_SIDE = 640;

/**
 * Reads an image file and returns a downscaled JPEG data URL.
 *
 * @throws {Error} If the file is not a readable image.
 */
export async function downscalePhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.75);
}
