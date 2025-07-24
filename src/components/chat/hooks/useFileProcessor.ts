/**
 * File Processing Utility
 * Handles file conversion and validation for chat messages
 * Extracted from useMessageHandler to improve maintainability
 */

import { Message } from '../index';

export interface FileProcessor {
  convertFilesToBase64: (messages: Message[]) => Promise<any[]>;
  convertFileObjectsToBase64: (files: File[]) => Promise<any[]>;
  hasFiles: (messages: Message[]) => boolean;
  validateFileSupport: (modelInfo: any, modelToUse: string) => void;
  processFilesForGemini: (messages: Message[], modelInfo: any, modelToUse: string) => Promise<any[]>;
}

export const createFileProcessor = (): FileProcessor => {
  
  const hasFiles = (messages: Message[]): boolean => {
    return messages.some(msg => msg.files && msg.files.length > 0);
  };

  const validateFileSupport = (modelInfo: any, modelToUse: string): void => {
    if (!modelInfo?.supportsFiles) {
      throw new Error(`Model ${modelToUse} does not support file uploads`);
    }
  };

  const convertFilesToBase64 = async (messages: Message[]): Promise<any[]> => {
    const fileData = [];

    for (const message of messages) {
      if (message.files && message.files.length > 0) {
        for (const file of message.files) {
          if (file.url && file.url.startsWith('blob:')) {
            try {
              console.log('Converting file to base64:', { name: file.name, url: file.url });
              const response = await fetch(file.url);

              if (!response.ok) {
                throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
              }

              const arrayBuffer = await response.arrayBuffer();

              // Use browser-compatible base64 conversion
              const uint8Array = new Uint8Array(arrayBuffer);
              let binaryString = '';
              for (let i = 0; i < uint8Array.length; i++) {
                binaryString += String.fromCharCode(uint8Array[i]);
              }
              const base64 = btoa(binaryString);

              fileData.push({
                data: base64,
                mimeType: file.type || 'application/octet-stream',
                name: file.name
              });

              console.log('Successfully converted file:', file.name);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('Error converting file to base64:', {
                fileName: file.name,
                fileUrl: file.url,
                error: errorMessage,
                errorType: typeof error
              });

              // Continue with other files instead of failing completely
              throw new Error(`Failed to process file "${file.name}": ${errorMessage}`);
            }
          } else if (file.url && file.url.startsWith('data:')) {
            // Handle data URLs (already base64 encoded)
            try {
              const base64Data = file.url.split(',')[1];
              fileData.push({
                data: base64Data,
                mimeType: file.type || 'application/octet-stream',
                name: file.name
              });
              console.log('Successfully processed data URL file:', file.name);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error('Error processing data URL file:', {
                fileName: file.name,
                error: errorMessage,
                errorType: typeof error
              });
              throw new Error(`Failed to process data URL file "${file.name}": ${errorMessage}`);
            }
          } else {
            console.warn('Skipping file without valid URL:', { name: file.name, url: file.url });
          }
        }
      }
    }

    console.log('Converted files to base64', { fileCount: fileData.length });
    return fileData;
  };

  // Alternative method to convert File objects directly to base64
  const convertFileObjectsToBase64 = async (files: File[]): Promise<any[]> => {
    const fileData = [];

    for (const file of files) {
      try {
        const arrayBuffer = await file.arrayBuffer();

        // Use browser-compatible base64 conversion
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64 = btoa(binaryString);

        fileData.push({
          data: base64,
          mimeType: file.type || 'application/octet-stream',
          name: file.name
        });

        console.log('Successfully converted File object:', file.name);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Error converting File object to base64:', {
          fileName: file.name,
          error: errorMessage,
          errorType: typeof error
        });
        throw new Error(`Failed to process file "${file.name}": ${errorMessage}`);
      }
    }

    return fileData;
  };

  const processFilesForGemini = async (messages: Message[], modelInfo: any, modelToUse: string): Promise<any[]> => {
    // Validate file support first
    validateFileSupport(modelInfo, modelToUse);

    try {
      // Try to convert files from messages (blob URLs)
      const fileData = await convertFilesToBase64(messages);
      console.log('processFilesForGemini: Converted files to base64', { fileCount: fileData.length });
      return fileData;
    } catch (error) {
      console.warn('Failed to convert files from messages, trying alternative method:', error);

      // Fallback: try to process data URLs directly
      const fileData = [];
      for (const message of messages) {
        if (message.files && message.files.length > 0) {
          for (const file of message.files) {
            try {
              // Handle data URLs (already base64 encoded)
              if (file.url && file.url.startsWith('data:')) {
                const base64Data = file.url.split(',')[1];
                if (base64Data) {
                  fileData.push({
                    data: base64Data,
                    mimeType: file.type || 'application/octet-stream',
                    name: file.name
                  });
                  console.log('Successfully processed data URL file in fallback:', file.name);
                }
              } else if (file.url && file.url.startsWith('blob:')) {
                // For blob URLs that can't be fetched due to CSP, we need to skip them
                console.warn(`Skipping blob URL file due to CSP restrictions: ${file.name}`);
                // Could potentially show user a message about re-uploading the file
              } else {
                console.warn(`Unsupported file URL format: ${file.url}`);
              }
            } catch (fileError) {
              console.error(`Error processing file ${file.name} in fallback:`, fileError);
            }
          }
        }
      }

      if (fileData.length > 0) {
        console.log('Fallback method processed some files:', { fileCount: fileData.length });
        return fileData;
      }

      // If no files could be processed, throw the original error
      throw error;
    }
  };

  return {
    convertFilesToBase64,
    convertFileObjectsToBase64,
    hasFiles,
    validateFileSupport,
    processFilesForGemini
  };
};
