import fs from 'fs';
import path from 'path';

export function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    const logoBuffer = fs.readFileSync(logoPath);
    return `data:image/jpeg;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.error('Gagal membaca logo:', error);
    return null;
  }
}