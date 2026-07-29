import imageCompression from 'browser-image-compression';

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const options = {
    maxSizeMB: 0.5,              // target maksimal 500KB setelah kompresi
    maxWidthOrHeight: 1600,      // resize kalau lebih besar dari ini
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Pertahankan nama file asli, hanya ukuran yang berubah
    return new File([compressedFile], file.name, { type: compressedFile.type });
  } catch (error) {
    console.error('Gagal kompres gambar:', error);
    return file; // fallback ke file asli kalau kompresi gagal
  }
}