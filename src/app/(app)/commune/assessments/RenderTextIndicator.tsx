'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { File as FileIcon, Download, Info, Eye } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvidenceUploaderComponent from './EvidenceUploaderComponent';
import type { Indicator } from '@/lib/data';
import type { AssessmentValues, FileWithStatus, IndicatorValue } from './types';
import { Button } from '@/components/ui/button';

// Component render for indicators with inputType: 'text'
const RenderTextIndicator = ({
    indicator,
    data,
    onValueChange,
    onNoteChange,
    onEvidenceChange,
    onPreview
}: {
    indicator: Indicator;
    data: IndicatorValue;
    onValueChange: (id: string, value: any) => void;
    onNoteChange: (id: string, note: string) => void;
    onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void;
    onPreview: (file: { name: string; url: string; }) => void;
}) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(indicator.id, e.target.value);
    };

    const isEvidenceRequired = data.status !== 'pending' && (data.files || []).length === 0;

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex items-center gap-2">
                <StatusBadge status={data.status} />
                <h4 className="font-semibold text-base flex-1">{indicator.name}</h4>
            </div>
            {/* Info Box */}
            <div className="p-3 bg-blue-50/50 border-l-4 border-blue-300 rounded-r-md">
                <div className="flex items-start gap-2 text-blue-800">
                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                    <div>
                        <p className="text-sm whitespace-pre-line">{indicator.description}</p>
                        <p className="text-sm mt-2"><strong>Yêu cầu đạt chuẩn: </strong><span className="font-semibold">{indicator.standardLevel}</span></p>
                    </div>
                </div>
                 {indicator.templateFiles && indicator.templateFiles.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                    <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                      <FileIcon className="h-4 w-4" />
                      File mẫu tham khảo từ Admin
                    </Label>
                    <div className="space-y-2">
                      {indicator.templateFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm truncate flex-1">{file.name}</span>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => onPreview(file)}>
                                <Eye className="h-4 w-4 mr-1" />
                                Xem trước
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <a href={file.url} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-1" />
                                Tải về
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            {/* Input Area */}
            <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor={`text-input-${indicator.id}`}>Kết quả tự đánh giá</Label>
                    <Input
                        id={`text-input-${indicator.id}`}
                        type="text"
                        placeholder="Nhập kết quả, mô tả..."
                        value={data.value || ''}
                        onChange={handleInputChange}
                    />
                </div>
                {/* Evidence */}
                <div className="grid gap-2">
                    <Label className="font-medium">Hồ sơ minh chứng</Label>
                    <p className="text-sm text-muted-foreground">{indicator.evidenceRequirement || 'Không yêu cầu cụ thể.'}</p>
                    <div className="mt-2">
                        <EvidenceUploaderComponent
                            indicatorId={indicator.id}
                            evidence={data.files || []}
                            onEvidenceChange={onEvidenceChange}
                            onPreview={onPreview}
                            isRequired={isEvidenceRequired}
                        />
                    </div>
                </div>
                {/* Note */}
                <div className="grid gap-2">
                    <Label htmlFor={`note-${indicator.id}`}>Ghi chú/Giải trình</Label>
                    <Textarea
                        id={`note-${indicator.id}`}
                        placeholder="Giải trình thêm..."
                        value={data.note || ''}
                        onChange={(e) => onNoteChange(indicator.id, e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default RenderTextIndicator;
