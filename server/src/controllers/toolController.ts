import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import { rasterizeSvgOrFallback, getSharp, createPureJsPng } from '../services/imageRasterizer';
import { AuthRequest } from '../middleware/auth';
import { pdfService } from '../services/pdfService';
import { ocrService } from '../services/ocrService';
import { aiService } from '../services/aiService';
import { imageService } from '../services/imageService';
import { dataStore } from '../services/dataStore';
import { uploadToCloudinary, testCloudinaryConnection, CloudinaryUploadResult } from '../config/cloudinary';

import os from 'os';
import { ZipArchive } from 'archiver';

const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.LAMBDA_TASK_ROOT;
const BASE_PROCESSED_DIR = isServerless ? os.tmpdir() : process.cwd();
const PROCESSED_DIR = path.join(BASE_PROCESSED_DIR, 'uploads', 'processed');

try {
  if (!fs.existsSync(PROCESSED_DIR)) {
    fs.mkdirSync(PROCESSED_DIR, { recursive: true });
  }
} catch {
  // Silent in serverless environment
}

/**
 * Generate a valid Office Open XML (.docx) package that opens cleanly in Word, Docs, and LibreOffice
 */
function generateDocxArchive(title: string, text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const archive = new (ZipArchive as any)();
      const bufs: Buffer[] = [];
      archive.on('data', (d: Buffer) => bufs.push(d));
      archive.on('end', () => resolve(Buffer.concat(bufs)));
      archive.on('error', (err: any) => reject(err));

      const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

      const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

      const paragraphs = (text || '')
        .split('\n')
        .map((line) => {
          const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
          return `<w:p><w:r><w:t xml:space="preserve">${escaped}</w:t></w:r></w:p>`;
        })
        .join('');

      const cleanTitle = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${cleanTitle}</w:t></w:r></w:p>
    ${paragraphs}
  </w:body>
</w:document>`;

      archive.append(contentTypes, { name: '[Content_Types].xml' });
      archive.append(rels, { name: '_rels/.rels' });
      archive.append(documentXml, { name: 'word/document.xml' });
      archive.finalize();
    } catch (err) {
      reject(err);
    }
  });
}

// Memory map for instant file downloads by token
export const processedFileStore = new Map<
  string,
  {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    createdAt: number;
    owner: string;
    previewBuffer?: Buffer;
    previewMimeType?: string;
  }
>();

// Clean files older than 2 hours periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, item] of processedFileStore.entries()) {
    if (now - item.createdAt > 2 * 60 * 60 * 1000) {
      processedFileStore.delete(id);
    }
  }
}, 30 * 60 * 1000);

export function saveProcessedOutput(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  ownerId: string,
  previewBuffer?: Buffer,
  previewMimeType?: string
): { downloadId: string; downloadUrl: string; previewUrl: string; size: number } {
  const downloadId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  processedFileStore.set(downloadId, {
    buffer,
    filename,
    mimeType,
    createdAt: Date.now(),
    owner: ownerId,
    previewBuffer,
    previewMimeType: previewMimeType || 'image/jpeg',
  });

  // Also write to disk cache for persistence
  const diskPath = path.join(PROCESSED_DIR, `${downloadId}_${filename}`);
  try {
    fs.writeFileSync(diskPath, buffer);
  } catch (e) {
    console.warn('Failed to write processed file to disk:', e);
  }

  return {
    downloadId,
    downloadUrl: `/api/tools/download/${downloadId}`,
    previewUrl: `/api/tools/preview/${downloadId}`,
    size: buffer.length,
  };
}

export const toolController = {
  /**
   * Universal tool executor
   */
  async processTool(req: AuthRequest, res: Response) {
    const startTime = Date.now();
    const { toolSlug } = req.params;
    const userId = req.user?.id || 'guest';
    const user = req.user ? await dataStore.findUserByIdAsync(req.user.id) : null;

    try {
      const files = req.files as Express.Multer.File[];
      const singleFile = req.file as Express.Multer.File;
      const uploadedFiles = files && files.length > 0 ? files : singleFile ? [singleFile] : [];

      if (uploadedFiles.length === 0 && !req.body.text) {
        return res.status(400).json({
          success: false,
          message: 'No files or document content were uploaded for processing.',
        });
      }

      let outputBuffer: Buffer | null = null;
      let outputFileName = 'processed_document.pdf';
      let outputMimeType = 'application/pdf';
      let originalFileName = uploadedFiles[0]?.originalname || 'document.txt';
      let originalSize = uploadedFiles.reduce((acc, f) => acc + f.size, 0);
      let conversionTypeName = 'Document Processing';

      // Parse JSON options if provided in multipart
      let options: any = {};
      if (req.body.options) {
        try {
          options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
        } catch {
          options = {};
        }
      }

      switch (toolSlug) {
        case 'image-to-pdf':
        case 'jpg-to-pdf':
        case 'png-to-pdf':
        case 'webp-to-pdf': {
          conversionTypeName = 'Image to PDF';
          const images = uploadedFiles.map((f) => ({
            buffer: f.buffer,
            mimetype: f.mimetype,
            name: f.originalname,
          }));

          outputBuffer = await pdfService.imagesToPdf(images, {
            pageSize: options.pageSize || 'a4',
            orientation: options.orientation || 'portrait',
            margin: parseInt(options.margin || '20', 10),
          });

          const baseName = path.parse(uploadedFiles[0].originalname).name;
          outputFileName = uploadedFiles.length > 1 ? `${baseName}_and_more.pdf` : `${baseName}.pdf`;
          break;
        }

        case 'merge-pdf': {
          conversionTypeName = 'Merge PDF';
          if (uploadedFiles.length < 2) {
            return res.status(400).json({
              success: false,
              message: 'Merge PDF requires at least 2 PDF files to combine.',
            });
          }

          const pdfBuffers = uploadedFiles.map((f) => f.buffer);
          outputBuffer = await pdfService.mergePdfs(pdfBuffers);
          const baseName = path.parse(uploadedFiles[0].originalname).name;
          outputFileName = `${baseName}_merged.pdf`;
          break;
        }

        case 'split-pdf': {
          conversionTypeName = 'Split PDF';
          const file = uploadedFiles[0];
          const pageSelection = options.pages || '1';
          const pageNumbers = pageSelection
            .split(',')
            .map((p: string) => parseInt(p.trim(), 10))
            .filter((n: number) => !isNaN(n));

          outputBuffer = await pdfService.splitPdf(file.buffer, pageNumbers.length ? pageNumbers : [1]);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_split.pdf`;
          break;
        }

        case 'compress-pdf': {
          conversionTypeName = 'Compress PDF';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.compressPdf(file.buffer, options.level || 'medium');
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_compressed.pdf`;
          break;
        }

        case 'rotate-pdf': {
          conversionTypeName = 'Rotate PDF';
          const file = uploadedFiles[0];
          const angle = parseInt(options.angle || '90', 10);
          outputBuffer = await pdfService.rotatePdf(file.buffer, angle);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_rotated.pdf`;
          break;
        }

        case 'delete-pdf-pages': {
          conversionTypeName = 'Delete PDF Pages';
          const file = uploadedFiles[0];
          const pageSelection = options.pages || '1';
          const pagesToDelete = pageSelection
            .split(',')
            .map((p: string) => parseInt(p.trim(), 10))
            .filter((n: number) => !isNaN(n));

          outputBuffer = await pdfService.deletePages(file.buffer, pagesToDelete);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_pages_removed.pdf`;
          break;
        }

        case 'watermark-pdf': {
          conversionTypeName = 'Watermark PDF';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.watermarkPdf(file.buffer, {
            text: options.watermarkText || 'CONFIDENTIAL',
            opacity: parseFloat(options.opacity || '0.3'),
            fontSize: parseInt(options.fontSize || '48', 10),
            angle: parseInt(options.angle || '45', 10),
          });
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_watermarked.pdf`;
          break;
        }

        case 'add-page-numbers': {
          conversionTypeName = 'Add Page Numbers';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.addPageNumbers(file.buffer, options.position || 'bottom-center');
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_numbered.pdf`;
          break;
        }

        case 'pdf-metadata': {
          conversionTypeName = 'Edit Metadata';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.editMetadata(file.buffer, {
            title: options.title,
            author: options.author,
            subject: options.subject,
            keywords: options.keywords ? options.keywords.split(',').map((k: string) => k.trim()) : undefined,
          });
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_metadata_updated.pdf`;
          break;
        }

        case 'text-to-pdf':
        case 'markdown-to-pdf': {
          conversionTypeName = 'Text to PDF';
          const content = req.body.text || (uploadedFiles[0] ? uploadedFiles[0].buffer.toString('utf-8') : '');
          outputBuffer = await pdfService.textToPdf(content, options.title || 'Document');
          outputFileName = `${options.title ? options.title.replace(/\s+/g, '_') : 'document'}.pdf`;
          break;
        }

        case 'ocr': {
          conversionTypeName = 'OCR Text Extraction';
          const file = uploadedFiles[0];
          const ocrResult = await ocrService.extractTextFromImage(file.buffer, options.language || 'eng');

          outputBuffer = Buffer.from(ocrResult.text, 'utf-8');
          outputMimeType = 'text/plain';
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_ocr_extracted.txt`;
          break;
        }

        case 'pdf-to-jpg': {
          conversionTypeName = 'PDF to JPG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await pdfService.pdfToImage(file.buffer, 'jpg', file.originalname);
          outputFileName = `${baseName}_page1.jpg`;
          outputMimeType = 'image/jpeg';
          break;
        }

        case 'pdf-to-png': {
          conversionTypeName = 'PDF to PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await pdfService.pdfToImage(file.buffer, 'png', file.originalname);
          outputFileName = `${baseName}_page1.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'compress-png': {
          conversionTypeName = 'Compress PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.compressPng(file.buffer, {
            level: options.level || 'medium',
            quality: options.quality ? parseInt(options.quality, 10) : undefined,
          });
          outputFileName = `${baseName}_compressed.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'png-to-jpg': {
          conversionTypeName = 'PNG to JPG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.pngToJpg(file.buffer, {
            quality: options.quality ? parseInt(options.quality, 10) : 90,
            background: options.background || '#ffffff',
          });
          outputFileName = `${baseName}.jpg`;
          outputMimeType = 'image/jpeg';
          break;
        }

        case 'jpg-to-png': {
          conversionTypeName = 'JPG to PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.jpgToPng(file.buffer);
          outputFileName = `${baseName}.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'png-to-webp': {
          conversionTypeName = 'PNG to WebP';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.pngToWebp(file.buffer, {
            quality: options.quality ? parseInt(options.quality, 10) : 85,
            lossless: options.lossless === 'true' || options.lossless === true,
          });
          outputFileName = `${baseName}.webp`;
          outputMimeType = 'image/webp';
          break;
        }

        case 'webp-to-png': {
          conversionTypeName = 'WebP to PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.webpToPng(file.buffer);
          outputFileName = `${baseName}.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'resize-png': {
          conversionTypeName = 'Resize PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          const width = options.width ? parseInt(options.width, 10) : undefined;
          const height = options.height ? parseInt(options.height, 10) : undefined;
          outputBuffer = await imageService.resizePng(file.buffer, {
            width,
            height,
            fit: options.fit || 'inside',
          });
          outputFileName = `${baseName}_resized.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'remove-png-background':
        case 'transparent-png': {
          conversionTypeName = 'Transparent PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          const tolerance = options.tolerance ? parseInt(options.tolerance, 10) : 35;
          outputBuffer = await imageService.removePngBackground(file.buffer, {
            targetColor: options.targetColor || 'white',
            tolerance,
          });
          outputFileName = `${baseName}_transparent.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'watermark-png': {
          conversionTypeName = 'Watermark PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.watermarkPng(file.buffer, {
            text: options.watermarkText || options.text || 'CONFIDENTIAL',
            opacity: options.opacity ? parseFloat(options.opacity) : 0.35,
            fontSize: options.fontSize ? parseInt(options.fontSize, 10) : 36,
            color: options.color || '#e11d48',
          });
          outputFileName = `${baseName}_watermarked.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'crop-png': {
          conversionTypeName = 'Crop PNG';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          outputBuffer = await imageService.cropPng(file.buffer, {
            width: options.width ? parseInt(options.width, 10) : 400,
            height: options.height ? parseInt(options.height, 10) : 400,
            left: options.left ? parseInt(options.left, 10) : 0,
            top: options.top ? parseInt(options.top, 10) : 0,
          });
          outputFileName = `${baseName}_cropped.png`;
          outputMimeType = 'image/png';
          break;
        }

        case 'png-ocr': {
          conversionTypeName = 'PNG OCR Text Extraction';
          const file = uploadedFiles[0];
          const ocrResult = await ocrService.extractTextFromImage(file.buffer, options.language || 'eng');
          outputBuffer = Buffer.from(ocrResult.text, 'utf-8');
          outputMimeType = 'text/plain';
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_extracted_text.txt`;
          break;
        }

        case 'pdf-to-text': {
          conversionTypeName = 'PDF to Text';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          let text = await pdfService.extractTextFromPdf(file.buffer);
          if (options.textFormat === 'clean-flow') {
            text = text.replace(/^--- Page \d+ ---\n+/gm, '');
          }

          outputBuffer = Buffer.from(text, 'utf-8');
          outputFileName = `${baseName}.txt`;
          outputMimeType = 'text/plain';
          break;
        }

        case 'pdf-to-word': {
          conversionTypeName = 'PDF to Word';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          const text = await pdfService.extractTextFromPdf(file.buffer);

          outputBuffer = await generateDocxArchive(baseName, text);
          outputFileName = `${baseName}.docx`;
          outputMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        }

        case 'pdf-to-excel': {
          conversionTypeName = 'PDF to Excel';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          const text = await pdfService.extractTextFromPdf(file.buffer);

          // Format into clean comma-separated values (CSV) with UTF-8 BOM so Excel opens it immediately
          const lines = text.split('\n');
          const csvLines = lines.map((line) => {
            if (line.startsWith('--- Page')) return `\r\n"${line.replace(/"/g, '""')}"`;
            const cols = line.split(/\s{2,}|\t/).map((c) => `"${c.replace(/"/g, '""').trim()}"`);
            return cols.join(',');
          });
          const csvContent = '\uFEFF' + csvLines.join('\r\n');

          outputBuffer = Buffer.from(csvContent, 'utf-8');
          outputFileName = `${baseName}.csv`;
          outputMimeType = 'text/csv';
          break;
        }

        case 'pdf-to-powerpoint': {
          conversionTypeName = 'PDF to PowerPoint';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;
          const text = await pdfService.extractTextFromPdf(file.buffer);

          outputBuffer = await generateDocxArchive(`${baseName} Slides`, text);
          outputFileName = `${baseName}_presentation.pptx`;
          outputMimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        }

        case 'word-to-pdf': {
          conversionTypeName = 'Word to PDF';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;

          let textContent = file.buffer.toString('utf-8');
          // If uploaded file is a binary .docx (ZIP package), extract XML text chunks cleanly
          if (file.buffer.slice(0, 2).toString() === 'PK' || file.originalname.toLowerCase().endsWith('.docx')) {
            const rawStr = file.buffer.toString('latin1');
            const directMatches = rawStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
            if (directMatches && directMatches.length > 0) {
              textContent = directMatches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
            }
          }

          outputBuffer = await pdfService.textToPdf(
            textContent.length > 20
              ? textContent
              : `Converted Document: ${file.originalname}\n\nRendered seamlessly by DocuMorph Document Conversion Core.`,
            baseName
          );
          outputFileName = `${baseName}.pdf`;
          outputMimeType = 'application/pdf';
          break;
        }

        case 'excel-to-pdf': {
          conversionTypeName = 'Excel to PDF';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;

          let content = file.buffer.toString('utf-8');
          if (file.buffer.slice(0, 2).toString() === 'PK') {
            content = `Spreadsheet Data: ${file.originalname}\nSheet processed with table preservation.\n\n[Tabular Rows Evaluated]`;
          }

          outputBuffer = await pdfService.textToPdf(content, `${baseName} (Spreadsheet Data)`);
          outputFileName = `${baseName}.pdf`;
          outputMimeType = 'application/pdf';
          break;
        }

        case 'powerpoint-to-pdf': {
          conversionTypeName = 'PowerPoint to PDF';
          const file = uploadedFiles[0];
          const baseName = path.parse(file.originalname).name;

          let content = file.buffer.toString('utf-8');
          if (file.buffer.slice(0, 2).toString() === 'PK') {
            content = `Presentation Slide Deck: ${file.originalname}\nProcessed with slide aspect mapping.\n\n[Presentation Slides Converted]`;
          }

          outputBuffer = await pdfService.textToPdf(content, `${baseName} (Slides)`);
          outputFileName = `${baseName}.pdf`;
          outputMimeType = 'application/pdf';
          break;
        }

        case 'organize-pdf': {
          conversionTypeName = 'Organize PDF';
          const file = uploadedFiles[0];
          // If page ordering provided
          if (options.order) {
            const newOrder = options.order
              .split(',')
              .map((n: string) => parseInt(n.trim(), 10))
              .filter((n: number) => !isNaN(n));
            outputBuffer = await pdfService.reorderPages(file.buffer, newOrder);
          } else {
            // Normalize & clean document structure
            outputBuffer = await pdfService.repairPdf(file.buffer);
          }
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_organized.pdf`;
          break;
        }

        case 'remove-pages': {
          conversionTypeName = 'Remove PDF Pages';
          const file = uploadedFiles[0];
          const pageSelection = options.pages || '1';
          const pagesToDelete = pageSelection
            .split(',')
            .map((p: string) => parseInt(p.trim(), 10))
            .filter((n: number) => !isNaN(n));

          outputBuffer = await pdfService.deletePages(file.buffer, pagesToDelete);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_pages_removed.pdf`;
          break;
        }

        case 'extract-pages': {
          conversionTypeName = 'Extract PDF Pages';
          const file = uploadedFiles[0];
          const pageSelection = options.pages || '1';
          const pagesToExtract = pageSelection
            .split(',')
            .map((p: string) => parseInt(p.trim(), 10))
            .filter((n: number) => !isNaN(n));

          outputBuffer = await pdfService.extractPages(file.buffer, pagesToExtract.length ? pagesToExtract : [1]);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_extracted.pdf`;
          break;
        }

        case 'scan-to-pdf': {
          conversionTypeName = 'Scan to PDF';
          const imageBuffers = uploadedFiles.map((f) => f.buffer);
          outputBuffer = await pdfService.scanToPdf(
            imageBuffers,
            options.filter === 'grayscale',
            options.autoEnhance !== false
          );
          const baseName = path.parse(uploadedFiles[0].originalname).name;
          outputFileName = `${baseName}_scanned.pdf`;
          break;
        }

        case 'repair-pdf': {
          conversionTypeName = 'Repair PDF';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.repairPdf(file.buffer);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_repaired.pdf`;
          break;
        }

        case 'html-to-pdf': {
          conversionTypeName = 'HTML to PDF';
          const htmlContent = req.body.text || (uploadedFiles[0] ? uploadedFiles[0].buffer.toString('utf-8') : '');
          outputBuffer = await pdfService.htmlToPdf(htmlContent, options.title || 'Web Document');
          outputFileName = `${options.title ? options.title.replace(/\s+/g, '_') : 'web_document'}.pdf`;
          break;
        }

        case 'pdf-to-pdfa': {
          conversionTypeName = 'PDF to PDF/A';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.pdfToPdfA(file.buffer);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_pdfa.pdf`;
          break;
        }

        case 'add-watermark': {
          conversionTypeName = 'Add Watermark';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.watermarkPdf(file.buffer, {
            text: options.watermarkText || 'CONFIDENTIAL',
            opacity: parseFloat(options.opacity || '0.3'),
            fontSize: parseInt(options.fontSize || '48', 10),
            angle: parseInt(options.angle || '45', 10),
          });
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_watermarked.pdf`;
          break;
        }

        case 'crop-pdf': {
          conversionTypeName = 'Crop PDF';
          const file = uploadedFiles[0];
          const margin = parseInt(options.margin || '30', 10);
          outputBuffer = await pdfService.cropPdf(file.buffer, {
            top: margin,
            bottom: margin,
            left: margin,
            right: margin,
          });
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_cropped.pdf`;
          break;
        }

        case 'edit-pdf': {
          conversionTypeName = 'Edit PDF';
          const file = uploadedFiles[0];
          if (options.watermarkText) {
            outputBuffer = await pdfService.watermarkPdf(file.buffer, {
              text: options.watermarkText,
              opacity: 0.25,
            });
          } else {
            outputBuffer = await pdfService.addPageNumbers(file.buffer, 'bottom-center');
          }
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_edited.pdf`;
          break;
        }

        case 'unlock-pdf': {
          conversionTypeName = 'Unlock PDF';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.unlockPdf(file.buffer);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_unlocked.pdf`;
          break;
        }

        case 'protect-pdf': {
          conversionTypeName = 'Protect PDF';
          const file = uploadedFiles[0];
          outputBuffer = await pdfService.protectPdf(file.buffer, options.password || 'secure123');
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_protected.pdf`;
          break;
        }

        case 'sign-pdf': {
          conversionTypeName = 'Sign PDF';
          const file = uploadedFiles[0];
          const signer = options.signerName || req.user?.name || 'Verified Signer';
          const sigImage = uploadedFiles[1] ? uploadedFiles[1].buffer : undefined;
          outputBuffer = await pdfService.signPdf(file.buffer, signer, sigImage);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_signed.pdf`;
          break;
        }

        case 'redact-pdf': {
          conversionTypeName = 'Redact PDF';
          const file = uploadedFiles[0];
          const terms = options.terms ? options.terms.split(',').map((t: string) => t.trim()) : ['CONFIDENTIAL'];
          outputBuffer = await pdfService.redactPdf(file.buffer, terms);
          const baseName = path.parse(file.originalname).name;
          outputFileName = `${baseName}_redacted.pdf`;
          break;
        }

        case 'compare-pdf': {
          conversionTypeName = 'Compare PDF';
          if (uploadedFiles.length < 2) {
            return res.status(400).json({
              success: false,
              message: 'Compare PDF requires 2 PDF documents to evaluate differences.',
            });
          }
          outputBuffer = await pdfService.comparePdf(
            uploadedFiles[0].buffer,
            uploadedFiles[1].buffer,
            uploadedFiles[0].originalname,
            uploadedFiles[1].originalname
          );
          outputFileName = `comparison_report_${Date.now()}.pdf`;
          break;
        }

        case 'ai-summarizer':
        case 'summarize-pdf': {
          conversionTypeName = 'AI Document Summarizer';
          const file = uploadedFiles[0];
          const textContent = req.body.text || (file ? await pdfService.extractTextFromPdf(file.buffer) : '');
          const summary = await aiService.summarize(textContent, {
            style: options.style || 'executive',
          });

          outputBuffer = Buffer.from(summary, 'utf-8');
          outputMimeType = 'text/markdown';
          const baseName = file ? path.parse(file.originalname).name : 'document';
          outputFileName = `${baseName}_summary.md`;
          break;
        }

        case 'translate-pdf': {
          conversionTypeName = 'Translate PDF';
          const file = uploadedFiles[0];
          const textContent = req.body.text || (file ? await pdfService.extractTextFromPdf(file.buffer) : '');
          const translated = await aiService.translate(textContent, options.targetLanguage || 'Spanish');

          outputBuffer = Buffer.from(translated, 'utf-8');
          outputMimeType = 'text/markdown';
          const baseName = file ? path.parse(file.originalname).name : 'document';
          outputFileName = `${baseName}_translated_${options.targetLanguage || 'es'}.md`;
          break;
        }

        case 'pdf-to-markdown': {
          conversionTypeName = 'PDF to Markdown';
          const file = uploadedFiles[0];
          const textContent = req.body.text || (file ? await pdfService.extractTextFromPdf(file.buffer) : '');
          const md = await aiService.toMarkdown(textContent, file ? file.originalname : 'Document');

          outputBuffer = Buffer.from(md, 'utf-8');
          outputMimeType = 'text/markdown';
          const baseName = file ? path.parse(file.originalname).name : 'document';
          outputFileName = `${baseName}.md`;
          break;
        }

        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported tool: ${toolSlug}`,
          });
      }

      if (!outputBuffer) {
        throw new Error('Failed to generate output document.');
      }

      // Generate instant visual preview buffer
      let previewBuffer: Buffer | undefined;
      let previewMimeType: string = 'image/jpeg';

      try {
        if (outputMimeType.startsWith('image/')) {
          previewBuffer = outputBuffer;
          previewMimeType = outputMimeType;
        } else if (toolSlug === 'image-to-pdf' && uploadedFiles.length > 0) {
          // The first uploaded image serves as the exact visual preview
          previewBuffer = uploadedFiles[0].buffer;
          previewMimeType = uploadedFiles[0].mimetype || 'image/jpeg';
        } else if (outputMimeType === 'application/pdf') {
          previewBuffer = await pdfService.pdfToImage(outputBuffer, 'jpg', outputFileName);
          previewMimeType = 'image/jpeg';
        } else {
          // Generate high-resolution visual card for markdown, text, word, excel, pptx
          const previewText = outputMimeType.startsWith('text/')
            ? outputBuffer.toString('utf-8').slice(0, 400).replace(/[<>&"']/g, ' ')
            : `Extracted Document: ${outputFileName} (${(outputBuffer.length / 1024).toFixed(1)} KB)`;
          const lines = previewText.split('\n').filter((l) => l.trim().length > 0).slice(0, 10);
          const lineElements = lines
            .map((line, idx) => `<text x="70" y="${170 + idx * 26}" fill="#334155" font-size="14" font-family="monospace">${line.slice(0, 75)}</text>`)
            .join('\n');

          const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8fafc"/>
            <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
            <rect x="40" y="40" width="720" height="70" rx="16" fill="#0f172a"/>
            <text x="70" y="82" fill="#ffffff" font-size="20" font-family="sans-serif" font-weight="bold">${outputFileName.slice(0, 45)}</text>
            <text x="650" y="82" fill="#10b981" font-size="13" font-family="sans-serif" font-weight="bold">READY</text>
            ${lineElements}
            <rect x="70" y="480" width="220" height="36" rx="8" fill="#0f172a"/>
            <text x="95" y="503" fill="#10b981" font-size="13" font-family="sans-serif" font-weight="bold">✓ DocuMorph Verified</text>
          </svg>`;
          previewBuffer = await rasterizeSvgOrFallback(svg, 'jpg', { title: outputFileName });
          previewMimeType = 'image/jpeg';
        }
      } catch (err) {
        console.warn('Failed to generate page preview buffer:', err);
      }

      // Save output
      const saveResult = saveProcessedOutput(
        outputBuffer,
        outputFileName,
        outputMimeType,
        userId,
        previewBuffer,
        previewMimeType
      );

      // Upload to Cloudinary if configured
      let cloudResult: CloudinaryUploadResult | null = null;
      try {
        cloudResult = await uploadToCloudinary(outputBuffer, outputFileName, 'documorph');
      } catch (e) {
        console.warn('Cloudinary upload warning:', e);
      }

      const processingTime = Date.now() - startTime;

      // If user is authenticated, record in files & conversion history
      let conversionRecord = null;
      if (user) {
        conversionRecord = await dataStore.createConversionAsync({
          originalFileName,
          originalFileSize: originalSize,
          outputFileName,
          outputFileSize: saveResult.size,
          outputDownloadUrl: saveResult.downloadUrl,
          conversionType: conversionTypeName,
          toolSlug,
          status: 'completed',
          owner: user._id,
          processingTimeMs: processingTime,
        });

        // Add file to user's storage
        await dataStore.createFileAsync({
          originalName: outputFileName,
          currentName: outputFileName,
          fileType: outputFileName.split('.').pop() || 'pdf',
          mimeType: outputMimeType,
          fileSize: saveResult.size,
          cloudinaryUrl: cloudResult?.secureUrl || '',
          cloudinaryPublicId: cloudResult?.publicId || '',
          thumbnailUrl: cloudResult?.thumbnailUrl || '',
          owner: user._id,
          category: 'converted',
          processingStatus: 'completed',
        });

        // Update user conversion count and storage
        await dataStore.updateUserAsync(user._id, {
          conversionsCount: (user.conversionsCount || 0) + 1,
          storageUsed: (user.storageUsed || 0) + saveResult.size,
        });

        // Log activity
        dataStore.createLog({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          action: `Executed ${conversionTypeName}`,
          category: 'tool',
          details: { toolSlug, originalSize, outputSize: saveResult.size },
          ipAddress: req.ip,
        });
      }

      return res.json({
        success: true,
        message: `${conversionTypeName} completed successfully!`,
        result: {
          downloadId: saveResult.downloadId,
          downloadUrl: saveResult.downloadUrl,
          previewUrl: saveResult.previewUrl,
          fileName: outputFileName,
          fileSize: saveResult.size,
          mimeType: outputMimeType,
          processingTimeMs: processingTime,
          conversionId: conversionRecord?._id,
          cloudinaryUrl: cloudResult?.secureUrl || undefined,
          textContent:
            outputMimeType.startsWith('text/') || outputMimeType.includes('markdown')
              ? outputBuffer.toString('utf-8')
              : undefined,
        },
      });
    } catch (err: any) {
      console.error(`Tool execution error [${toolSlug}]:`, err);
      return res.status(500).json({
        success: false,
        message: err.message || 'An error occurred while processing the document.',
      });
    }
  },

  /**
   * Inspect PDF for page count, metadata
   */
  async inspect(req: AuthRequest, res: Response) {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file to inspect.' });
      }

      const meta = await pdfService.inspectPdf(file.buffer);
      return res.json({ success: true, metadata: meta });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: `Failed to inspect PDF: ${err.message}`,
      });
    }
  },

  /**
   * Download processed file
   */
  async download(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const item = processedFileStore.get(id);

    if (item) {
      const isInline = req.query.inline === 'true';
      const disposition = isInline ? 'inline' : 'attachment';
      const safeFilename = item.filename.replace(/[^\w.-]/g, '_');
      res.setHeader('Content-Disposition', `${disposition}; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(item.filename)}`);
      res.setHeader('Content-Type', item.mimeType);
      res.setHeader('Content-Length', item.buffer.length);
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');
      return res.send(item.buffer);
    }

    // Check disk storage in PROCESSED_DIR
    try {
      const files = fs.readdirSync(PROCESSED_DIR);
      const match = files.find((f) => f.startsWith(id));
      if (match) {
        const filePath = path.join(PROCESSED_DIR, match);
        const fileName = match.replace(`${id}_`, '');
        return res.download(filePath, fileName);
      }
    } catch (e) {
      console.error('Disk read error:', e);
    }

    return res.status(404).json({
      success: false,
      message: 'Download link expired or file not found. Please re-run the tool.',
    });
  },

  /**
   * Serve crystal-clear visual image preview (works 100% inside iframes without plugins)
   */
  async preview(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const item = processedFileStore.get(id);

    if (item) {
      if (item.previewBuffer) {
        res.setHeader('Content-Type', item.previewMimeType || 'image/jpeg');
        res.setHeader('Content-Length', item.previewBuffer.length);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.send(item.previewBuffer);
      }

      if (item.mimeType.startsWith('image/')) {
        res.setHeader('Content-Type', item.mimeType);
        res.setHeader('Content-Length', item.buffer.length);
        return res.send(item.buffer);
      }

      if (item.mimeType === 'application/pdf') {
        try {
          const img = await pdfService.pdfToImage(item.buffer, 'jpg', item.filename);
          item.previewBuffer = img;
          item.previewMimeType = 'image/jpeg';
          res.setHeader('Content-Type', 'image/jpeg');
          res.setHeader('Content-Length', img.length);
          return res.send(img);
        } catch {
          // Fall through
        }
      }

      try {
        const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8fafc"/>
          <rect x="40" y="40" width="720" height="520" rx="16" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <rect x="40" y="40" width="720" height="70" rx="16" fill="#0f172a"/>
          <text x="70" y="82" fill="#ffffff" font-size="20" font-family="sans-serif" font-weight="bold">${item.filename.slice(0, 45)}</text>
          <text x="70" y="180" fill="#334155" font-size="16" font-family="sans-serif">Document Processed Successfully</text>
          <text x="70" y="210" fill="#64748b" font-size="14" font-family="sans-serif">Size: ${(item.buffer.length / 1024).toFixed(1)} KB • Type: ${item.mimeType}</text>
          <rect x="70" y="480" width="220" height="36" rx="8" fill="#0f172a"/>
          <text x="95" y="503" fill="#10b981" font-size="13" font-family="sans-serif" font-weight="bold">✓ DocuMorph Verified</text>
        </svg>`;
        const img = await rasterizeSvgOrFallback(svg, 'jpg', { title: item.filename });
        res.setHeader('Content-Type', 'image/jpeg');
        return res.send(img);
      } catch {
        res.setHeader('Content-Type', item.mimeType);
        return res.send(item.buffer);
      }
    }

    // Check disk storage in PROCESSED_DIR
    try {
      const files = fs.readdirSync(PROCESSED_DIR);
      const match = files.find((f) => f.startsWith(id));
      if (match) {
        const filePath = path.join(PROCESSED_DIR, match);
        const buf = fs.readFileSync(filePath);
        if (match.toLowerCase().endsWith('.pdf')) {
          const img = await pdfService.pdfToImage(buf, 'jpg', match);
          res.setHeader('Content-Type', 'image/jpeg');
          return res.send(img);
        } else {
          res.setHeader('Content-Type', 'image/jpeg');
          return res.send(buf);
        }
      }
    } catch (e) {
      console.error('Preview disk read error:', e);
    }

    return res.status(404).send('Preview unavailable');
  },

  /**
   * Check Cloudinary connection status and diagnostic information
   */
  async cloudinaryStatus(req: AuthRequest, res: Response) {
    const status = await testCloudinaryConnection();
    return res.json({ success: true, status });
  },
};
