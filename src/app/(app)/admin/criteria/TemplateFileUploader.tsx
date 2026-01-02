'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileUp, X, Download, Loader2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
// FIXME: Firebase storage removed - needs MinIO refactoring
// import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { format } from 'date-fns';

export default function TemplateFileUploader({
  indicatorId,
  existingFiles,
  onFilesChange
}: {
  indicatorId: string;
  existingFiles: { name: string; url: string; uploadedAt?: string }[];
  onFilesChange: (files: { name: string; url: string; uploadedAt?: string }[]) => void;
}) {
  const { storage } = useData();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!storage || files.length === 0 || !indicatorId) {
      toast({ variant: 'destructive', title: 'Lỗi', description: 'Chưa thể tải file. Vui lòng lưu chỉ tiêu trước.' });
      return
    };

    setUploading(true);
    const uploadedFiles = [...existingFiles];

    try {
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          toast({ variant: 'destructive', title: 'Lỗi dung lượng', description: `File "${file.name}" vượt quá 10MB.` });
          continue;
        }

        const storageRef = ref(storage, `criteria_templates/${indicatorId}/${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          uploadedAt: format(new Date(), 'dd/MM/yyyy HH:mm')
        });
      }

      onFilesChange(uploadedFiles);
      toast({ title: 'Upload thành công!', description: `Đã upload ${files.length} file mẫu.` });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ variant: 'destructive', title: 'Lỗi upload', description: 'Không thể upload file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (fileToRemove: { name: string; url: string }) => {
    if (!storage) return;

    const confirm = window.confirm(`Bạn có chắc chắn muốn xóa file "${fileToRemove.name}"?`);
    if (!confirm) return;

    try {
      const fileRef = ref(storage, fileToRemove.url);
      await deleteObject(fileRef);

      const updatedFiles = existingFiles.filter(f => f.url !== fileToRemove.url);
      onFilesChange(updatedFiles);
      toast({ title: 'Đã xóa file mẫu' });
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        const updatedFiles = existingFiles.filter(f => f.url !== fileToRemove.url);
        onFilesChange(updatedFiles);
        toast({ title: 'Đã xóa file (không tìm thấy trên storage)', variant: 'default' });
      } else {
        console.error('Delete error:', error);
        toast({ variant: 'destructive', title: 'Lỗi xóa file' });
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
        {uploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            <p className="mt-1 text-xs text-center text-muted-foreground">Đang tải lên...</p>
          </div>
        ) : (
          <>
            <FileUp className="mx-auto h-6 w-6 text-muted-foreground" />
            <p className="mt-1 text-xs text-center text-muted-foreground">
              Chọn file mẫu để upload
            </p>
            <Input
              type="file"
              multiple
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={uploading}
              accept=".doc,.docx,.xls,.xlsx,.pdf,.jpg,.jpeg,.png"
            />
          </>
        )}
      </div>

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          {existingFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded-md">
              <span className="text-sm truncate flex-1">{file.name}</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => handleRemove(file)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
