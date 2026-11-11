/**
 * Client-side image compression utility for User Avatars.
 * Center-crops and scales uploaded photos down to 256x256 WebP/JPEG Data URLs (~10-25KB),
 * allowing instant, zero-cost storage directly inside Cloud Firestore user documents.
 */

export async function compressImageToAvatar(
  file: File,
  targetSize = 256,
  quality = 0.82
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Vui lòng chọn tệp hình ảnh hợp lệ (JPG, PNG, WebP).");
  }

  // Max 10MB raw file size guard
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Ảnh gốc quá lớn (vượt quá 10MB). Vui lòng chọn ảnh nhỏ hơn.");
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Trình duyệt không hỗ trợ xử lý ảnh Canvas."));
          return;
        }

        // Center-crop to square aspect ratio
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;

        // Fill white background for transparent PNGs converted to JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetSize, targetSize);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

        // Try WebP first for smallest size, fallback to JPEG
        let dataUrl = canvas.toDataURL("image/webp", quality);
        if (!dataUrl.startsWith("data:image/webp")) {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        // Safety check: ensure result fits comfortably in Firestore document (< 200KB)
        if (dataUrl.length > 250_000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.65);
        }

        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không thể đọc tệp ảnh này. Vui lòng thử ảnh khác."));
    };

    img.src = objectUrl;
  });
}
