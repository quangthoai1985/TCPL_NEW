'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { File as FileIcon, Download, Info, Eye, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvidenceUploaderComponent from './EvidenceUploaderComponent';
import type { Criterion, Indicator } from '@/lib/data';
import type { FileWithStatus, IndicatorValue, AssessmentValues } from './types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Component render chung cho các chỉ tiêu dạng Number (nhập số)
const RenderNumberIndicator = ({
    indicator,
    data,
    onValueChange,
    onNoteChange,
    onEvidenceChange,
    onPreview,
    criteria, // Thêm criteria vào props
    assessmentData, // Thêm assessmentData vào props
    onIsTaskedChange,
}: {
    indicator: Indicator;
    data: IndicatorValue;
    onValueChange: (id: string, value: any) => void;
    onNoteChange: (id: string, note: string) => void;
    onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void;
    onPreview: (file: { name: string; url: string; }) => void;
    criteria: Criterion[]; // Thêm kiểu dữ liệu cho criteria
    assessmentData: AssessmentValues; // Thêm kiểu dữ liệu cho assessmentData
    onIsTaskedChange: (id: string, isTasked: boolean) => void;
}) => {
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(indicator.id, e.target.value);
    };

    const isEvidenceRequired = data.status !== 'pending' && (data.files || []).length === 0;

    const isSpecialIndicator = indicator.id === 'CT3.2.1';
    const isTasked = data.isTasked !== false;

    const checkboxLabel = "Không phát sinh vụ việc";
        
    const handleIsTaskedCheckboxChange = (checked: boolean | 'indeterminate') => {
        onIsTaskedChange(indicator.id, !checked);
    };

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
                 {isSpecialIndicator && (
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id={`${indicator.id}-notask`} 
                            checked={!isTasked} 
                            onCheckedChange={handleIsTaskedCheckboxChange}
                        />
                        <Label htmlFor={`${indicator.id}-notask`} className="font-semibold">{checkboxLabel}</Label>
                    </div>
                 )}

                 {isTasked ? (
                    <>
                        <div className="grid gap-2">
                            {/* ==== LOGIC ĐẶC BIỆT CHO CT2.2 ==== */}
                            {indicator.id === 'CT2.2' ? (
                              <>
                                <Label htmlFor={`number-input-${indicator.id}`}>
                                  Số Nghị quyết của HĐND, Quyết định của UBND sau khi ban hành được công khai
                                </Label>
                                <Input
                                    id={`number-input-${indicator.id}`}
                                    type="number"
                                    placeholder="Nhập số văn bản đã công khai"
                                    value={data.value || ''}
                                    onChange={handleInputChange}
                                    className="w-48"
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  💡 Hệ thống sẽ tự động tính % dựa trên tổng số văn bản được giao từ Tiêu chí 1
                                </p>
                              </>
                            ) : (
                              // Logic mặc định cho các chỉ tiêu khác
                              <>
                                <Label htmlFor={`number-input-${indicator.id}`}>
                                  Kết quả tự đánh giá (Số lượng hoặc Tỷ lệ %)
                                </Label>
                                <Input
                                    id={`number-input-${indicator.id}`}
                                    type="number"
                                    placeholder="Nhập giá trị"
                                    value={data.value || ''}
                                    onChange={handleInputChange}
                                    className="w-48"
                                />
                              </>
                            )}
                            {/* ================================== */}
                             {/* ==== PROGRESS BAR CHO CT2.2 VỚI LOGIC ƯU TIÊN ==== */}
                            {indicator.id === 'CT2.2' && indicator.parentCriterionId === 'TC01' && (() => {
                              const tc01Criterion = criteria.find(c => c.id === 'TC01');
                              const ct1_1_data = assessmentData['CT1.1']; // Lấy từ props assessmentData
                              const communeDefinedDocuments = ct1_1_data?.communeDefinedDocuments;
                              
                              let totalAssigned = 0;
                              let sourceInfo = '';
                              
                              // ƯU TIÊN 1: Admin giao cụ thể
                              if (tc01Criterion?.assignmentType === 'specific' && 
                                  tc01Criterion?.documents && 
                                  tc01Criterion.documents.length > 0) {
                                totalAssigned = tc01Criterion.documents.length;
                                sourceInfo = `(Admin giao cụ thể ${totalAssigned} văn bản)`;
                              }
                              // ƯU TIÊN 2: Admin giao số lượng
                              else if (tc01Criterion?.assignmentType === 'quantity' && 
                                       tc01Criterion?.assignedDocumentsCount && 
                                       tc01Criterion.assignedDocumentsCount > 0) {
                                totalAssigned = tc01Criterion.assignedDocumentsCount;
                                sourceInfo = `(Admin giao ${totalAssigned} văn bản)`;
                              }
                              // ƯU TIÊN 3: Xã tự khai báo
                              else {
                                const ct1_1_value = ct1_1_data?.value;
                                if (ct1_1_value && Number(ct1_1_value) > 0) {
                                  totalAssigned = Number(ct1_1_value);
                                  sourceInfo = `(Xã tự khai báo)`;
                                } else if (communeDefinedDocuments && communeDefinedDocuments.length > 0) {
                                  totalAssigned = communeDefinedDocuments.length;
                                  sourceInfo = `(Xã tự khai báo)`;
                                }
                              }

                              const completed = Number(data.value) || 0;
                              const percentage = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
                              const progressColor = percentage >= 100 ? "bg-green-500" : percentage >= 70 ? "bg-yellow-500" : "bg-red-500";

                              return (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-medium">Tiến độ công khai văn bản</Label>
                                    <span className="text-sm font-bold">{percentage}%</span>
                                  </div>
                                  <Progress value={Math.min(percentage, 100)} indicatorClassName={progressColor} className="h-3" />
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Đã công khai <strong>{completed}</strong> / <strong>{totalAssigned}</strong> văn bản {sourceInfo}
                                  </p>
                                </div>
                              );
                            })()}
                            {/* ================================ */}
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
                    </>
                ) : (
                    <Alert variant="default" className="bg-green-50 border-green-300">
                        <CheckCircle className="h-4 w-4 text-green-600"/>
                        <AlertTitle>Đã xác nhận</AlertTitle>
                        <AlertDescription>
                           Đã chọn 'Không phát sinh'. Chỉ tiêu này sẽ được tự động đánh giá là "Đạt".
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </div>
    );
};

export default RenderNumberIndicator;
