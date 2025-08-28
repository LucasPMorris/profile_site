import { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

export default async function handler( req: NextApiRequest, res: NextApiResponse ) {
  const form = new IncomingForm({ uploadDir: './public/images', keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Upload failed' });

    const file = Array.isArray(files?.file) ? files.file[0] : null;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const uploadDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }) }
    
    const originalName = file.originalFilename?.replace(/\s+/g, '_') || 'uploaded_image';
    const ext = path.extname(originalName);
    const safeName = path.basename(originalName, ext).replace(/[^\w\-]/g, '') + ext;

    fs.renameSync(file.filepath, safeName ? path.join(uploadDir, safeName) : file.filepath);
    const filename = path.basename(file.filepath);
    const url = `/images/${filename}`;

    res.status(200).json({ url });
  });

  console.log('File Upload End');
}
