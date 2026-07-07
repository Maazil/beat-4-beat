/**
 * Category header images are stored inline on the room document as small
 * data URLs (no Firebase Storage). Images are cover-cropped to the header's
 * 2:1 shape and compressed, which keeps them around 5–15 KB each — far
 * below Firestore's 1 MB document limit even with many categories.
 */

export const CATEGORY_IMAGE_WIDTH = 400;
export const CATEGORY_IMAGE_HEIGHT = 200;

// Hard cap per image so a room with many categories can't approach the
// Firestore document limit (data URLs are base64: ~0.75 bytes of image per char).
const MAX_DATA_URL_CHARS = 120_000;

/**
 * Read an image file, cover-crop it to the category header shape, and
 * compress it to a WebP (or JPEG where WebP encoding is unsupported) data URL.
 * Throws if the file can't be decoded or won't compress small enough.
 */
export async function fileToCategoryImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = CATEGORY_IMAGE_WIDTH;
    canvas.height = CATEGORY_IMAGE_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Cover-crop: scale to fill the header, cropping the overflow evenly
    const scale = Math.max(
      CATEGORY_IMAGE_WIDTH / bitmap.width,
      CATEGORY_IMAGE_HEIGHT / bitmap.height,
    );
    const srcWidth = CATEGORY_IMAGE_WIDTH / scale;
    const srcHeight = CATEGORY_IMAGE_HEIGHT / scale;
    const srcX = (bitmap.width - srcWidth) / 2;
    const srcY = (bitmap.height - srcHeight) / 2;
    ctx.drawImage(
      bitmap,
      srcX,
      srcY,
      srcWidth,
      srcHeight,
      0,
      0,
      CATEGORY_IMAGE_WIDTH,
      CATEGORY_IMAGE_HEIGHT,
    );

    // Browsers that can't encode WebP silently fall back to PNG — detect
    // that and use JPEG instead so the result stays small.
    let dataUrl = canvas.toDataURL("image/webp", 0.8);
    if (!dataUrl.startsWith("data:image/webp")) {
      dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    }

    if (dataUrl.length > MAX_DATA_URL_CHARS) {
      throw new Error("Image is too complex to compress small enough");
    }

    return dataUrl;
  } finally {
    bitmap.close();
  }
}
