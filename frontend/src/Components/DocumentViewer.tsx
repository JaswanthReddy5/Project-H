import React, { useState, useEffect } from "react";

interface DocumentViewerProps {
  documentId: string; // Google Drive document ID
  height?: number;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  height = 85,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Convert Google Drive view/share URL to direct embed URL
  const getEmbedUrl = (fileId: string) => {
    return `https://drive.google.com/file/d/${fileId}/preview?embedded=true&rm=minimal`;
  };

  useEffect(() => {
    const iframe = document.getElementById('google-drive-iframe') as HTMLIFrameElement | null;
    if (iframe) {
      iframe.onload = () => {
        setIsLoading(false);
        // Add a small delay to ensure proper initialization
        setTimeout(() => {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: 'loadComplete' }, '*');
          }
        }, 1000);
      };
    }

    return () => {
      if (iframe) {
        iframe.onload = null;
      }
    };
  }, [documentId]);

  return (
    <div className="w-full h-full">
      {isLoading && (
        <div className="w-full h-[70vh] bg-gray-800 rounded-lg animate-pulse" />
      )}
      <div 
        style={{ 
          display: isLoading ? 'none' : 'block',
          height: '100%',
          position: 'relative',
          WebkitOverflowScrolling: 'touch' // Enable smooth scrolling on iOS
        }}
        className="overflow-hidden"
      >
        <iframe
          id="google-drive-iframe"
          src={getEmbedUrl(documentId)}
          width="100%"
          height="100%"
          allow="autoplay"
          className="rounded-lg md:rounded-3xl"
          style={{ 
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            maxWidth: '100%',
            maxHeight: '100%'
          }}
          title="Restaurant Menu"
        />
      </div>
    </div>
  );
};

export default DocumentViewer; 