import { useState, useEffect } from 'react';
import { Loader2, File } from 'lucide-react';
import { useSignedUrl, extractStoragePath } from '@/hooks/use-signed-url';

interface FilePreviewProps {
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
}

/**
 * Component to display file previews with secure signed URLs
 * This component handles async URL loading properly
 */
export default function FilePreview({ fileUrl, fileName, fileType }: FilePreviewProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getSignedUrl } = useSignedUrl();

  useEffect(() => {
    const loadSignedUrl = async () => {
      setIsLoading(true);
      const filePath = extractStoragePath(fileUrl, 'consultation-files') || fileUrl;
      const result = await getSignedUrl('consultation-files', filePath, 3600);
      if (result.url) {
        setSignedUrl(result.url);
      }
      setIsLoading(false);
    };

    if (fileUrl) {
      loadSignedUrl();
    }
  }, [fileUrl, getSignedUrl]);

  if (isLoading || !signedUrl) {
    return (
      <div className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted/50">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading file...</span>
      </div>
    );
  }

  const isImage = fileType?.startsWith('image/');

  if (isImage) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
        <img 
          src={signedUrl} 
          alt={fileName || 'Shared image'} 
          className="max-w-[200px] rounded-lg mt-2 hover:opacity-80 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a 
      href={signedUrl} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 p-2 mt-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <File className="w-4 h-4 text-primary" />
      <span className="text-sm truncate">{fileName}</span>
    </a>
  );
}
