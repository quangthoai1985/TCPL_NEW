
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/context/DataContext';
import { UploadCloud, Loader2, X, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { FileWithStatus } from './types';
// Firebase ref removed. Using DataContext uploadFile.


const Criterion1EvidenceUploader = ({
    indicatorId,
    docIndex,
    evidence,
    onUploadComplete,
    onRemove,
    onPreview,
    periodId,
    communeId,
    accept,
    onAddLink,
    issueDate,
    issuanceDeadlineDays,
}: {
    indicatorId: string;
    docIndex: number;
    evidence: FileWithStatus[];
    onUploadComplete: (indicatorId: string, docIndex: number, newFile: { name: string, url: string }) => void;
    onRemove: (docIndex: number, fileToRemove: FileWithStatus) => void;
    onPreview: (file: { name: string; url: string; previewUrl?: string }) => void;
    periodId: string;
    communeId: string;
    accept?: string;
    onAddLink: (indicatorId: string, docIndex: number, link: { name: string, url: string }) => void;
    issueDate?: string;
    issuanceDeadlineDays?: number;
}) => {
    const { uploadFile } = useData();
    const { toast, dismiss } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [linkInput, setLinkInput] = useState('');

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const loadingToastId = toast({
            title: 'Đang tải lên...',
            description: `Đang xử lý tệp "${file.name}" và kiểm tra chữ ký số...`,
        }).id;

        try {
            // Call uploadFile from DataContext (Server Action)
            // It automatically handles signature verification if issueDate/deadline are provided
            const result = await uploadFile(
                file,
                communeId,
                periodId,
                indicatorId,
                issueDate || '',
                issuanceDeadlineDays ? String(issuanceDeadlineDays) : ''
            );

            console.log("Upload Result:", result);

            // Construct full file object with status
            const newFileStr: any = {
                name: file.name,
                url: result.url,
                signatureStatus: result.signatureStatus,
                signatureError: result.signatureError,
                previewUrl: result.previewUrl // Save preview URL if available
            };

            onUploadComplete(indicatorId, docIndex, newFileStr);

            dismiss(loadingToastId);

            toast({
                title: 'Tải lên hoàn tất!',
                description: (
                    <>
                        <p>{
                            result.signatureStatus === 'valid'
                                ? `Tệp "${file.name}" hợp lệ.`
                                : result.signatureStatus === 'invalid'
                                    ? `Cảnh báo: Tệp không hợp lệ (${result.signatureError})`
                                    : `Tệp đã tải lên thành công.`
                        }</p>
                        {result.previewError && (
                            <p className="mt-1 text-red-500 font-semibold text-xs">
                                Lỗi xem trước: {result.previewError}
                            </p>
                        )}
                        {result.previewUrl && (
                            <p className="mt-1 text-green-600 font-semibold text-xs">
                                Đã tạo bản xem trước PDF!
                            </p>
                        )}
                    </>
                ),
                variant: result.signatureStatus === 'invalid' || result.signatureStatus === 'error' ? 'destructive' : 'default',
                duration: 5000,
            });

        } catch (error: any) {
            console.error("Upload error for criterion 1:", error);
            dismiss(loadingToastId);
            toast({
                title: 'Lỗi tải lên',
                description: error.message || `Đã xảy ra lỗi khi tải tệp "${file.name}".`,
                variant: 'destructive',
                duration: 5000,
            });
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const handleAddLink = () => {
        if (!linkInput.trim() || !linkInput.startsWith('http')) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng nhập một đường dẫn hợp lệ.' });
            return;
        }
        onAddLink(indicatorId, docIndex, { name: linkInput.trim(), url: linkInput.trim() });
        setLinkInput('');
    };

    const getStatusIcon = (file: FileWithStatus) => {
        if (!('signatureStatus' in file)) return null;
        switch (file.signatureStatus) {
            case 'validating': return <TooltipTrigger asChild><Loader2 className="h-4 w-4 text-amber-500 animate-spin" /></TooltipTrigger>;
            case 'valid': return <TooltipTrigger asChild><CheckCircle className="h-4 w-4 text-green-500" /></TooltipTrigger>;
            case 'invalid':
            case 'error': return <TooltipTrigger asChild><XCircle className="h-4 w-4 text-red-500" /></TooltipTrigger>;
            default: return null;
        }
    };

    const getStatusTooltip = (file: FileWithStatus) => {
        if (!('signatureStatus' in file)) return null;
        switch (file.signatureStatus) {
            case 'validating': return "Đang kiểm tra chữ ký số...";
            case 'valid': return "Chữ ký số hợp lệ.";
            case 'invalid': return `Chữ ký không hợp lệ: ${file.signatureError || 'Lỗi không xác định.'}`;
            case 'error': return `Lỗi xử lý tệp: ${file.signatureError || 'Không thể đọc chữ ký.'}`;
            default: return null;
        }
    };

    const renderStatusBadge = (file: FileWithStatus) => {
        if (!('signatureStatus' in file) || file.signatureStatus === 'validating') {
            return null;
        }

        switch (file.signatureStatus) {
            case 'valid':
                return <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white mt-1.5 w-fit">Hợp lệ</Badge>;
            case 'invalid':
                return <Badge variant="destructive" className="mt-1.5 w-fit">{file.signatureError || 'Không hợp lệ'}</Badge>;
            case 'error':
                return <Badge variant="destructive" className="mt-1.5 w-fit">{file.signatureError || 'Lỗi xử lý'}</Badge>;
            default:
                return null;
        }
    };


    return (
        <div className="space-y-2">
            <div className="w-full relative border border-dashed rounded-lg p-2 text-center hover:border-primary transition-colors">
                <UploadCloud className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-1 text-xs text-muted-foreground">Tải lên tệp PDF</p>
                <Input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} accept={accept} disabled={isUploading} />
                {isUploading && <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            </div>
            <div className="grid gap-1">
                <Label htmlFor={`link-${indicatorId}-${docIndex}`} className="text-xs">Hoặc thêm liên kết</Label>
                <div className="flex gap-2">
                    <Input
                        id={`link-${indicatorId}-${docIndex}`}
                        value={linkInput}
                        onChange={(e) => setLinkInput(e.target.value)}
                        placeholder="Dán đường dẫn vào đây"
                        className="h-9 text-xs"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={handleAddLink}>Thêm</Button>
                </div>
            </div>
            {evidence.map((file, index) => (
                <div key={index} className="flex flex-col gap-1 p-1.5 bg-muted rounded-md text-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 w-0 flex-1 min-w-0">
                            <TooltipProvider>
                                <Tooltip>
                                    {getStatusIcon(file)}
                                    <TooltipContent>
                                        <p>{getStatusTooltip(file)}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <span className="truncate text-xs flex-1">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {'url' in file && file.url && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onPreview({ name: file.name, url: file.url || '', previewUrl: (file as any).previewUrl })}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemove(docIndex, file)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    {renderStatusBadge(file)}
                </div>
            ))}
        </div>
    );
};

export default Criterion1EvidenceUploader;
