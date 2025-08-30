import fs from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const imagesDir = path.join(process.cwd(), 'public/images');

  try {
    const files = fs.readdirSync(imagesDir);
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    const urls = imageFiles.map((file) => `/images/${file}`);
    res.status(200).json({ images: urls });
  } catch (error) { res.status(500).json({ error: 'Failed to read image directory' }); }
}

