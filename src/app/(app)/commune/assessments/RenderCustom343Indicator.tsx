'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { File as FileIcon, Download, Info, Eye, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvidenceUploaderComponent from './EvidenceUploaderComponent';
import type { Indicator } from '@/lib/data';
import type { FileWithStatus, IndicatorValue } from './types';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Component render cho chỉ tiêu tùy chỉnh CT3.4.3
const RenderCustom343Indicator = ({
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
    
    const valueObj = (typeof data.value === 'object' && data.value !== null) 
        ? data.value 
        : { total: '', completed: '', amount: '' };

    const handleInputChange = (field: 'total' | 'completed' | 'amount', inputValue: string) => {
         const newValueObj = {
             ...valueObj,
             [field]: inputValue 
         };
         onValueChange(indicator.id, newValueObj);
    };

    const isEvidenceRequired = data.status !== 'pending' && (data.files || []).length === 0;

    const correctAmount = (Number(valueObj.completed) || 0) * 150000 * 12;
    const isAmountMismatched = valueObj.amount && Number(valueObj.amount) !== correctAmount;

    // THÊM MỚI: Logic cảnh báo tỷ lệ
    const nTotal = Number(valueObj.total || 0);
    const nCompleted = Number(valueObj.completed || 0);
    const isRatioMismatched = valueObj.total && valueObj.completed && nTotal !== nCompleted;

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
                    <Label className="font-medium">Kết quả tự đánh giá</Label>
                    <div className="p-4 border rounded-lg bg-background grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
                        {/* Input Fields */}
                        <div className="space-y-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor={`custom-total-${indicator.id}`} className="text-sm">Tổng số tổ hoà giải</Label>
                                <Input id={`custom-total-${indicator.id}`} type="number" placeholder="VD: 10" value={valueObj.total || ''}
                                        onChange={(e) => handleInputChange('total', e.target.value)} />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor={`custom-completed-${indicator.id}`} className="text-sm">Tổng số tổ hoà giải được hỗ trợ kinh phí</Label>
                                <Input id={`custom-completed-${indicator.id}`} type="number" placeholder="VD: 8" value={valueObj.completed || ''}
                                        onChange={(e) => handleInputChange('completed', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div className="grid gap-1.5">
                                <Label htmlFor={`custom-amount-${indicator.id}`} className="text-sm">Hỗ trợ kinh phí hoạt động (đồng)</Label>
                                <Input id={`custom-amount-${indicator.id}`} type="number" placeholder="Nhập tổng số tiền" value={valueObj.amount || ''}
                                        onChange={(e) => handleInputChange('amount', e.target.value)} />
                                        {valueObj.amount && (
                                    <p className="text-xs text-green-700 font-medium pl-1">
                                        = {Number(valueObj.amount).toLocaleString('vi-VN')} đồng
                                    </p>
                                )}
                            </div>
                             <div className="p-3 bg-blue-50 rounded-md text-sm">
                                <p className="text-blue-800">Số tiền kinh phí yêu cầu (tính theo công thức):</p>
                                <p className="font-bold text-blue-900 text-base">{correctAmount.toLocaleString('vi-VN')} đồng</p>
                             </div>
                        </div>
                    </div>
                    {/* ==== THÊM KHỐI CẢNH BÁO MỚI NÀY ==== */}
                    {isRatioMismatched && (
                        <Alert variant="destructive" className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Cảnh báo Tỷ lệ 100%</AlertTitle>
                            <AlertDescription>
                                Chỉ tiêu này yêu cầu 100%. "Tổng số tổ hoà giải" ({nTotal}) phải bằng "Tổng số tổ hoà giải được hỗ trợ" ({nCompleted}).
                            </AlertDescription>
                        </Alert>
                    )}
                    {/* ==================================== */}
                    {isAmountMismatched && (
                        <Alert variant="destructive" className="mt-2 bg-amber-50 border-amber-400 text-amber-800 [&>svg]:text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle className="font-semibold">Cảnh báo</AlertTitle>
                            <AlertDescription>
                                Số tiền hỗ trợ thực tế không khớp với số tiền được tính theo công thức. Vui lòng kiểm tra lại.
                            </AlertDescription>
                        </Alert>
                    )}
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

export default RenderCustom343Indicator;
