/**
 * Persistent Image Storage Manager
 * Uses IndexedDB to store image data with compression and efficient retrieval
 */

export interface StoredImageData {
  id: string;
  name: string;
  type: string;
  size: number;
  originalSize: number;
  data: string; // base64 encoded image data
  timestamp: number;
  chatId?: string; // Optional chat association for cleanup
}

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 for JPEG
  format?: 'jpeg' | 'png' | 'webp';
}

class ImageStorageManager {
  private dbName = 'ChatImageStorage';
  private dbVersion = 1;
  private storeName = 'images';
  private db: IDBDatabase | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('chatId', 'chatId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Compress image file to reduce storage size
   */
  private async compressImage(
    file: File, 
    options: ImageCompressionOptions = {}
  ): Promise<{ data: string; compressedSize: number }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const handleImageLoad = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);

        const mimeType = format === 'png' ? 'image/png' :
                        format === 'webp' ? 'image/webp' : 'image/jpeg';

        const compressedData = canvas.toDataURL(mimeType, quality);
        const compressedSize = Math.round((compressedData.length * 3) / 4); // Approximate size

        // Clean up object URL
        URL.revokeObjectURL(objectUrl);

        resolve({ data: compressedData, compressedSize });
      };

      const handleImageError = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Failed to load image for compression'));
      };

      img.onload = handleImageLoad;
      img.onerror = handleImageError;

      // Create object URL for the image
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    });
  }

  /**
   * Store an image file with compression
   */
  async storeImage(
    file: File,
    chatId?: string,
    compressionOptions?: ImageCompressionOptions
  ): Promise<string> {
    if (!this.db) {
      await this.init();
    }

    // Validate file type
    if (!file.type || !file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('Image file is too large (max 50MB)');
    }

    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Compress image if it's larger than 100KB
      let imageData: string;
      let compressedSize: number;

      if (file.size > 100 * 1024) { // 100KB threshold
        try {
          const compressed = await this.compressImage(file, compressionOptions);
          imageData = compressed.data;
          compressedSize = compressed.compressedSize;
        } catch (compressionError) {
          // Fallback to original if compression fails
          imageData = await this.fileToBase64(file);
          compressedSize = file.size;
        }
      } else {
        // For small images, store as-is
        imageData = await this.fileToBase64(file);
        compressedSize = file.size;
      }

      const storedImage: StoredImageData = {
        id,
        name: file.name,
        type: file.type,
        size: compressedSize,
        originalSize: file.size,
        data: imageData,
        timestamp: Date.now(),
        chatId
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.add(storedImage);

        request.onsuccess = () => {
          resolve(id);
        };

        request.onerror = () => {
          reject(new Error(`Failed to store image: ${request.error?.message || 'Unknown error'}`));
        };

        transaction.onerror = () => {
          reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
        };
      });
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve an image by ID
   */
  async getImage(id: string): Promise<StoredImageData | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve image'));
      };
    });
  }

  /**
   * Get image data URL for display
   */
  async getImageDataUrl(id: string): Promise<string | null> {
    const image = await this.getImage(id);
    return image ? image.data : null;
  }

  /**
   * Delete an image by ID
   */
  async deleteImage(id: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete image'));
      };
    });
  }

  /**
   * Delete all images associated with a chat
   */
  async deleteImagesByChat(chatId: string): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('chatId');
      const request = index.openCursor(IDBKeyRange.only(chatId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to delete chat images'));
      };
    });
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalImages: number;
    totalSize: number;
    oldestImage: number;
  }> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const images: StoredImageData[] = request.result;
        const totalImages = images.length;
        const totalSize = images.reduce((sum, img) => sum + img.size, 0);
        const oldestImage = images.length > 0 ? 
          Math.min(...images.map(img => img.timestamp)) : Date.now();

        resolve({ totalImages, totalSize, oldestImage });
      };

      request.onerror = () => {
        reject(new Error('Failed to get storage stats'));
      };
    });
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Clean up old images (older than specified days)
   */
  async cleanupOldImages(daysOld: number = 30): Promise<number> {
    if (!this.db) {
      await this.init();
    }

    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to cleanup old images'));
      };
    });
  }
}

// Export singleton instance
export const imageStorage = new ImageStorageManager();

// Initialize on module load
imageStorage.init().catch(() => {
  // Silent initialization - will retry on first use
});
