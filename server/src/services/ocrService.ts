import { createWorker } from 'tesseract.js';

export const ocrService = {
  /**
   * Extract text from image buffer using Tesseract OCR
   */
  async extractTextFromImage(imageBuffer: Buffer, language = 'eng'): Promise<{ text: string; confidence: number }> {
    try {
      const worker = await createWorker(language);
      const ret = await worker.recognize(imageBuffer);
      await worker.terminate();

      return {
        text: ret.data.text,
        confidence: Math.round(ret.data.confidence),
      };
    } catch (error: any) {
      console.error('OCR processing error:', error);
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  },
};
