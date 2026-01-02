'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

interface PDFViewerProps {
    url: string;
    className?: string;
}

export default function PDFViewer({ url, className = '' }: PDFViewerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

    // Create the default layout plugin with Vietnamese labels
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [
            defaultTabs[0], // Thumbnails
            defaultTabs[1], // Bookmarks
        ],
        toolbarPlugin: {
            searchPlugin: {
                keyword: '',
            },
        },
    });

    useEffect(() => {
        let isMounted = true;

        const loadPDF = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Fetch PDF as base64 JSON to bypass IDM
                const base64Url = url.includes('?')
                    ? `${url}&format=base64`
                    : `${url}?format=base64`;

                const response = await fetch(base64Url);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const jsonData = await response.json();

                if (jsonData.error) {
                    throw new Error(jsonData.error);
                }

                // Convert base64 to Uint8Array
                const binaryString = atob(jsonData.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                if (isMounted) {
                    setPdfData(bytes);
                }
            } catch (err: any) {
                console.error('PDF load error:', err);
                if (isMounted) {
                    setError(err.message || 'Không thể tải PDF');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadPDF();

        return () => {
            isMounted = false;
        };
    }, [url]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Đang tải PDF...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex items-center justify-center h-full ${className}`}>
                <div className="text-center text-destructive">
                    <p className="font-medium">Lỗi khi tải PDF</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!pdfData) {
        return null;
    }

    return (
        <div className={`h-full ${className}`} style={{ height: '100%' }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={pdfData}
                    plugins={[defaultLayoutPluginInstance]}
                    defaultScale={SpecialZoomLevel.PageFit}
                    theme={{
                        theme: 'auto',
                    }}
                />
            </Worker>
        </div>
    );
}
