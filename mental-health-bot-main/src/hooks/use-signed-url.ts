import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type BucketName = 'medical-records' | 'consultation-files' | 'ml-datasets';

interface SignedUrlResult {
  url: string | null;
  error: string | null;
}

/**
 * Hook to generate signed URLs for secure file access
 * Replaces getPublicUrl() to enforce RLS and add expiration
 */
export function useSignedUrl() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Generate a signed URL for a file in a private bucket
   * @param bucket - The storage bucket name
   * @param filePath - The path to the file within the bucket
   * @param expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
   * @returns Promise with the signed URL or error
   */
  const getSignedUrl = useCallback(async (
    bucket: BucketName,
    filePath: string,
    expiresIn: number = 3600
  ): Promise<SignedUrlResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return { url: null, error: error.message };
      }

      return { url: data.signedUrl, error: null };
    } catch (err) {
      console.error('Unexpected error creating signed URL:', err);
      return { url: null, error: 'Failed to generate secure file access URL' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Open a file in a new tab using a signed URL
   */
  const openFile = useCallback(async (
    bucket: BucketName,
    filePath: string
  ): Promise<boolean> => {
    const result = await getSignedUrl(bucket, filePath, 300); // 5 min for viewing
    if (result.url) {
      window.open(result.url, '_blank');
      return true;
    }
    return false;
  }, [getSignedUrl]);

  /**
   * Download a file using a signed URL
   */
  const downloadFile = useCallback(async (
    bucket: BucketName,
    filePath: string,
    fileName: string
  ): Promise<boolean> => {
    const result = await getSignedUrl(bucket, filePath, 60); // 1 min for download
    if (result.url) {
      const link = document.createElement('a');
      link.href = result.url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }
    return false;
  }, [getSignedUrl]);

  return {
    getSignedUrl,
    openFile,
    downloadFile,
    isLoading
  };
}

/**
 * Extract the storage path from a file URL
 * Works with both public URLs and signed URLs
 */
export function extractStoragePath(fileUrl: string, bucket: BucketName): string | null {
  try {
    // Try to extract path from URL patterns
    // Pattern 1: /storage/v1/object/public/bucket-name/path
    const publicMatch = fileUrl.match(new RegExp(`/storage/v1/object/public/${bucket}/(.+?)(?:\\?|$)`));
    if (publicMatch) {
      return decodeURIComponent(publicMatch[1]);
    }

    // Pattern 2: /storage/v1/object/sign/bucket-name/path
    const signedMatch = fileUrl.match(new RegExp(`/storage/v1/object/sign/${bucket}/(.+?)(?:\\?|$)`));
    if (signedMatch) {
      return decodeURIComponent(signedMatch[1]);
    }

    // Pattern 3: Simple path format (for stored paths that aren't full URLs)
    if (!fileUrl.startsWith('http')) {
      return fileUrl;
    }

    return null;
  } catch (error) {
    console.error('Error extracting storage path:', error);
    return null;
  }
}
