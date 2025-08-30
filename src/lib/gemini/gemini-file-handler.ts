/**
 * Gemini File Handler
 * Handles all file upload and processing operations for Gemini API
 * 
 * Extracted from gemini-service.ts for better modularity
 */

import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELS } from '../gemini-config';

export interface FileUploadResult {
  uri: string;
  mimeType: string;
  name?: string;
  state?: string;
}

export interface FileProcessingOptions {
  displayName?: string;
  mimeType?: string;
}

export class GeminiFileHandler {
  // Constants for file processing
  private static readonly FILE_PROCESSING_CHECK_INTERVAL = 2000; // 2 seconds
  private static readonly REMOTE_FILE_PROCESSING_CHECK_INTERVAL = 5000; // 5 seconds

  constructor(private client: GoogleGenAI) {}

  /**
   * Upload file to Gemini and get URI
   */
  async uploadFile(file: File): Promise<FileUploadResult> {
    try {
      // Convert File to base64 for upload
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const uploadedFile = await this.client.files.upload({
        file: base64,
        config: {
          mimeType: file.type,
          displayName: file.name
        },
      });

      return {
        uri: uploadedFile.uri || '',
        mimeType: uploadedFile.mimeType || file.type,
        name: uploadedFile.name,
        state: uploadedFile.state
      };
    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file ${file.name}: ${error}`);
    }
  }

  /**
   * Upload PDF from URL to Gemini
   */
  async uploadRemotePDF(url: string, displayName: string): Promise<FileUploadResult> {
    try {
      const pdfBuffer = await fetch(url)
        .then((response) => response.arrayBuffer());

      const fileBlob = new Blob([pdfBuffer], { type: 'application/pdf' });

      const file = await this.client.files.upload({
        file: fileBlob,
        config: {
          displayName: displayName,
        },
      });

      // Wait for the file to be processed
      if (!file.name) {
        throw new Error('File upload failed - no file name returned');
      }

      const processedFile = await this.waitForFileProcessing(file.name, true);
      
      return {
        uri: processedFile.uri || '',
        mimeType: processedFile.mimeType || 'application/pdf',
        name: processedFile.name,
        state: processedFile.state
      };
    } catch (error) {
      console.error(`Failed to upload PDF ${displayName}:`, error);
      throw error;
    }
  }

  /**
   * Wait for file processing to complete
   */
  private async waitForFileProcessing(fileName: string, isRemote: boolean = false): Promise<any> {
    const interval = isRemote 
      ? GeminiFileHandler.REMOTE_FILE_PROCESSING_CHECK_INTERVAL
      : GeminiFileHandler.FILE_PROCESSING_CHECK_INTERVAL;

    let getFile = await this.client.files.get({ name: fileName });
    
    while (getFile.state === 'PROCESSING') {
      await new Promise((resolve) => {
        setTimeout(resolve, interval);
      });
      getFile = await this.client.files.get({ name: fileName });
    }

    if (getFile.state === 'FAILED') {
      throw new Error(`File processing failed for ${fileName}`);
    }

    return getFile;
  }

  /**
   * Process multiple local PDF files
   */
  async processMultipleLocalPDFs(
    prompt: string,
    files: File[],
    modelId: string = GEMINI_MODELS.FLASH_2_5
  ): Promise<string> {
    try {
      const content: any[] = [prompt];

      // Upload and process each PDF file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const uploadedFile = await this.client.files.upload({
          file: file,
          config: {
            displayName: file.name,
          },
        });

        if (!uploadedFile.name) {
          throw new Error(`File upload failed for ${file.name}`);
        }

        // Wait for processing
        const processedFile = await this.waitForFileProcessing(uploadedFile.name);

        if (processedFile.uri && processedFile.mimeType) {
          const fileContent = this.createPartFromUri(processedFile.uri, processedFile.mimeType);
          content.push(fileContent);
        }
      }

      const response = await this.client.models.generateContent({
        model: modelId,
        contents: content,
      });

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Failed to process multiple local PDFs:', error);
      throw error;
    }
  }

  /**
   * Process multiple PDFs from URLs in a single request
   */
  async processMultiplePDFs(
    prompt: string,
    pdfUrls: Array<{ url: string; displayName: string }>,
    modelId: string = GEMINI_MODELS.FLASH_2_5
  ): Promise<string> {
    try {
      const content: any[] = [prompt];

      // Upload and process each PDF
      for (const { url, displayName } of pdfUrls) {
        const file = await this.uploadRemotePDF(url, displayName);

        if (file.uri && file.mimeType) {
          const fileContent = this.createPartFromUri(file.uri, file.mimeType);
          content.push(fileContent);
        }
      }

      const response = await this.client.models.generateContent({
        model: modelId,
        contents: content,
      });

      return response.text || 'No response generated';
    } catch (error) {
      console.error('Failed to process multiple PDFs:', error);
      throw error;
    }
  }

  /**
   * Create part from URI (helper function)
   */
  createPartFromUri(uri: string, mimeType: string): any {
    return {
      fileData: {
        fileUri: uri,
        mimeType: mimeType
      }
    };
  }

  /**
   * Create file parts for message content
   */
  createFileParts(files: Array<{
    data?: string; // base64 for inline
    uri?: string; // URI for uploaded files
    mimeType: string;
    name?: string;
  }>): any[] {
    return files.map(file => {
      if (file.uri) {
        // Use uploaded file URI
        return {
          fileData: {
            mimeType: file.mimeType,
            fileUri: file.uri
          }
        };
      } else if (file.data) {
        // Use inline data
        return {
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        };
      } else {
        throw new Error('File must have either URI or data');
      }
    });
  }
}
