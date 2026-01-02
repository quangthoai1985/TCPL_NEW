
'use client';

import { Badge } from '@/components/ui/badge';
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Info, ListChecks, File as FileIcon, Download, Eye, Settings2 } from "lucide-react";
import type { Criterion, Indicator } from "@/lib/data";
import CT4EvidenceUploader from "./CT4EvidenceUploader";
import StatusBadge from "./StatusBadge";
import type { AssessmentValues, FileWithStatus } from "./types";
import Criterion1EvidenceUploader from './Criterion1EvidenceUploader';
import { useData } from '@/context/DataContext';
// FIXME: Firebase removed - needs Prisma refactoring
// import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';


// Debounce function to delay execution



const RenderTC1LikeIndicator = ({
    indicator,
    data,
    assessmentData,
    onValueChange,
    onNoteChange,
    onEvidenceChange,
    onIsTaskedChange,
    onPreview,
    periodId,
    communeId,
    handleCommuneDocsChange
}: {
    indicator: Indicator;
    data: AssessmentValues[string];
    assessmentData: AssessmentValues;
    onValueChange: (id: string, value: any) => void;
    onNoteChange: (id: string, note: string) => void;
    onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void,
    onIsTaskedChange: (id: string, isTasked: boolean) => void;
    onPreview: (file: { name: string; url: string; previewUrl?: string }) => void;
    periodId: string;
    communeId: string;
    handleCommuneDocsChange: (indicatorId: string, docs: any[]) => void;
}) => {
    const { criteria, db } = useData();

    // Xác định criterion dựa vào indicator ID
    const criterion = useMemo(() => {
        // Nếu là CT2.4.1 → Lấy config từ TC02
        if (indicator.id === 'CT2.4.1') {
            return criteria.find(c => c.id === 'TC02');
        }
        // Nếu là CT1.* → Lấy config từ TC01
        return criteria.find(c => c.id === 'TC01');
    }, [indicator.id, criteria]);


    if (!data) return null;

    const isNotTasked = data.isTasked === false;
    const assignmentType = criterion?.assignmentType || 'quantity';
    const isHighlighted = indicator.id === 'CT2.4.1';

    const [communeDefinedDocs, setCommuneDefinedDocs] = useState(
        () => data.communeDefinedDocuments || []
    );

    // Old Firestore AutoSave removed.
    // Sync is handled via useEffect -> handleCommuneDocsChange -> Parent Logic.



    useEffect(() => {
        if (assignmentType === 'quantity') {
            const adminCount = criterion?.assignedDocumentsCount || 0;
            if (adminCount > 0 && communeDefinedDocs.length !== adminCount) {
                const newDocs = Array.from({ length: adminCount }, (_, i) =>
                    communeDefinedDocs[i] || { name: '', issueDate: '', excerpt: '', issuanceDeadlineDays: 7 }
                );
                setCommuneDefinedDocs(newDocs);
            }
        }
    }, [criterion?.assignedDocumentsCount, assignmentType, communeDefinedDocs.length]);

    useEffect(() => {
        handleCommuneDocsChange(indicator.id, communeDefinedDocs);
    }, [communeDefinedDocs, indicator.id, handleCommuneDocsChange]);

    const docsToRender = assignmentType === 'specific'
        ? (criterion?.documents || [])
        : communeDefinedDocs;

    const handleNoTaskChange = (checked: boolean | 'indeterminate') => {
        const notTasked = checked === true;
        onIsTaskedChange(indicator.id, !notTasked);
    };

    const handleUploadComplete = useCallback((indicatorId: string, docIndex: number, newFile: any) => {
        onEvidenceChange(indicatorId, [newFile], docIndex);
    }, [onEvidenceChange]);

    const handleAddLink = useCallback((indicatorId: string, docIndex: number, newLink: { name: string; url: string; }) => {
        onEvidenceChange(indicatorId, [newLink], docIndex);
    }, [onEvidenceChange]);


    const handleRemoveFile = useCallback((docIndex: number, fileToRemove: FileWithStatus) => {
        onEvidenceChange(indicator.id, [], docIndex, fileToRemove);
    }, [onEvidenceChange, indicator.id]);

    const handleLocalDocCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const count = Math.max(0, Number(e.target.value));
        const newDocs = Array.from({ length: count }, (_, i) =>
            communeDefinedDocs[i] || { name: '', issueDate: '', excerpt: '', issuanceDeadlineDays: 7 }
        );
        setCommuneDefinedDocs(newDocs);
    };

    const handleLocalDocDetailChange = (index: number, field: string, value: string | number) => {
        // Cập nhật UI ngay lập tức
        const newDocs = [...communeDefinedDocs];
        if (newDocs[index]) {
            (newDocs[index] as any)[field] = value;
            setCommuneDefinedDocs(newDocs);
        } else {
            // Initialize with default values to satisfy type requirements
            newDocs[index] = {
                name: '',
                issueDate: '',
                excerpt: '',
                issuanceDeadlineDays: 7,
                [field]: value
            };
            setCommuneDefinedDocs(newDocs);
        }

        // Lên lịch lưu sau 1 giây
        // debouncedSave(index, field, value); // REMOVED

    };

    const assignedCount = useMemo(() => {
        return criterion?.assignedDocumentsCount || docsToRender.length || 0;
    }, [criterion?.assignedDocumentsCount, docsToRender.length]);


    const valueAsNumber = Number(data.value);
    const progress = assignedCount > 0 && !isNaN(valueAsNumber) ? Math.round((valueAsNumber / assignedCount) * 100) : 0;
    const progressColor = progress >= 100 ? "bg-green-500" : "bg-yellow-500";

    return (
        <div className="grid gap-6">
            <div className="flex items-center gap-2">
                <StatusBadge status={data.status} />
                <h4 className="font-semibold text-base flex-1">{indicator.name}</h4>
            </div>

            <div className="p-3 bg-blue-50/50 border-l-4 border-blue-300 rounded-r-md mt-3">
                <div className="flex items-start gap-2 text-blue-800">
                    <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
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

            <div className="grid gap-6 mt-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id={`${indicator.id}-notask`} checked={isNotTasked} onCheckedChange={handleNoTaskChange} />
                    <Label htmlFor={`${indicator.id}-notask`} className="font-semibold">Xã không được giao nhiệm vụ</Label>
                </div>

                {isNotTasked && (
                    <Alert variant="default" className="bg-green-50 border-green-300">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle>Đã xác nhận</AlertTitle>
                        <AlertDescription>
                            Chỉ tiêu này được đánh giá là <strong className="text-green-700">Đạt</strong>.
                        </AlertDescription>
                    </Alert>
                )}

                {!isNotTasked && (
                    <div className="grid gap-8">
                        <Card className={cn(
                            isHighlighted
                                ? "bg-gradient-to-br from-indigo-50 via-blue-50 to-white border-2 border-indigo-200 shadow-lg overflow-hidden relative"
                                : "bg-blue-50/50 border border-blue-200"
                        )}>
                            <CardHeader className={isHighlighted ? "pb-4 border-b border-indigo-100 bg-white/50 backdrop-blur-sm" : ""}>
                                <CardTitle className={cn(
                                    "flex items-center gap-2",
                                    isHighlighted ? "text-lg text-indigo-700" : "text-base text-primary"
                                )}>
                                    {isHighlighted ? <Settings2 className="w-5 h-5" /> : <ListChecks />}
                                    Thông tin nhiệm vụ được giao
                                </CardTitle>
                                <CardDescription className={isHighlighted ? "text-indigo-600/80" : ""}>
                                    {assignmentType === 'specific'
                                        ? "Đây là danh sách các văn bản cụ thể bạn cần ban hành trong kỳ đánh giá này."
                                        : "Vui lòng kê khai thông tin các văn bản đã được ban hành trong kỳ."
                                    }
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {assignmentType === 'quantity' && (!criterion?.assignedDocumentsCount || criterion?.assignedDocumentsCount === 0) && (
                                    <div className="grid gap-2 p-3 border rounded-md bg-transparent">
                                        <Label htmlFor="communeDocCount">Tổng số Kế hoạch PBGDPL đã ban hành</Label>
                                        <Input id="communeDocCount" type="number" value={communeDefinedDocs.length} onChange={handleLocalDocCountChange} placeholder="Nhập số lượng" className="w-48" />
                                    </div>
                                )}
                                {docsToRender.length > 0 ? (
                                    <div className="space-y-3">
                                        {docsToRender.map((doc: any, docIndex: number) => (
                                            <div key={docIndex} className="p-3 border-l-4 border-blue-300 rounded-r-md bg-transparent text-sm">
                                                <div className="font-semibold text-primary mb-2">Văn bản chỉ đạo {docIndex + 1}{doc.name ? `: ${doc.name}` : ''}</div>
                                                {assignmentType === 'specific' ? (
                                                    <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1">
                                                        <span className="text-muted-foreground">Trích yếu:</span> <span className="font-medium">{doc.excerpt}</span>
                                                        <span className="text-muted-foreground">Ngày ban hành:</span> <span className="font-medium">{doc.issueDate}</span>
                                                        <span className="text-muted-foreground">Thời hạn:</span> <span className="font-medium"><Badge variant="destructive">{doc.issuanceDeadlineDays} ngày</Badge></span>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div className="grid gap-1.5"><Label htmlFor={`doc-name-${docIndex}`}>Tên Kế hoạch PBGDPL</Label>
                                                            <Input id={`doc-name-${docIndex}`}
                                                                defaultValue={doc.name || ''}
                                                                onChange={(e) => handleLocalDocDetailChange(docIndex, 'name', e.target.value)}
                                                                className="border-blue-300 focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div className="grid gap-1.5"><Label htmlFor={`doc-excerpt-${docIndex}`}>Trích yếu</Label>
                                                            <Input id={`doc-excerpt-${docIndex}`}
                                                                defaultValue={doc.excerpt || ''}
                                                                onChange={(e) => handleLocalDocDetailChange(docIndex, 'excerpt', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1.5"><Label htmlFor={`doc-issuedate-${docIndex}`}>Ngày ban hành (DD/MM/YYYY)</Label>
                                                            <Input id={`doc-issuedate-${docIndex}`}
                                                                defaultValue={doc.issueDate || ''}
                                                                onChange={(e) => handleLocalDocDetailChange(docIndex, 'issueDate', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1.5"><Label htmlFor={`doc-deadline-${docIndex}`}>Thời hạn (ngày)</Label>
                                                            <Input type="number"
                                                                id={`doc-deadline-${docIndex}`}
                                                                defaultValue={doc.issuanceDeadlineDays || ''}
                                                                onChange={(e) => handleLocalDocDetailChange(docIndex, 'issuanceDeadlineDays', Number(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-muted-foreground">Không có văn bản nào được Admin định danh hoặc xã chưa kê khai.</p>}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
                            {/* Inputs Section */}
                            <div className="lg:col-span-7 space-y-5">
                                <div className="grid gap-2">
                                    <Label htmlFor={`${indicator.id}-input`} className="text-base font-medium">
                                        Tổng số Kế hoạch PBGDPL đã ban hành:
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id={`${indicator.id}-input`}
                                            type="number"
                                            placeholder="..."
                                            className="pl-4 h-12 text-lg font-medium"
                                            value={typeof data.value === 'object' ? '' : (data.value || '')}
                                            onChange={(e) => onValueChange(indicator.id, e.target.value)}
                                        />
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        (Chỉ tiêu được giao: {assignedCount} văn bản)
                                    </p>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                                <div className="text-center mb-4">
                                    <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Tiến độ đạt chuẩn</div>
                                    <div className={cn(
                                        "text-4xl font-extrabold tracking-tight",
                                        progress >= 100 ? "text-green-600" : "text-blue-600"
                                    )}>
                                        {progress}%
                                    </div>
                                </div>
                                <Progress
                                    value={progress}
                                    className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700"
                                    indicatorClassName={cn(
                                        "transition-all duration-500 ease-out rounded-full",
                                        progress >= 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    )}
                                />
                                <div className="mt-3 text-xs text-muted-foreground flex gap-2 items-center">
                                    {progress >= 100
                                        ? <span className="flex items-center text-green-600 font-medium"><CheckCircle className="w-3 h-3 mr-1" /> Đạt yêu cầu</span>
                                        : <span>Còn thiếu để đạt 100%</span>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-2 mt-4">
                            <Label className="font-medium">Hồ sơ minh chứng</Label>
                            <p className="text-sm text-muted-foreground">{indicator.evidenceRequirement || 'Không yêu cầu cụ thể.'}</p>

                            <Alert variant="destructive" className="border-amber-500 text-amber-900 bg-amber-50 [&>svg]:text-amber-600">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="font-semibold text-amber-800">Lưu ý quan trọng</AlertTitle>
                                <AlertDescription>Các tệp PDF được tải lên sẽ được hệ thống tự động kiểm tra chữ ký số.</AlertDescription>
                            </Alert>

                            {docsToRender.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                                    {docsToRender.map((doc: any, docIndex: number) => {
                                        const evidence = data.filesPerDocument?.[docIndex] || [];
                                        const isRequired = data.status !== 'pending' && isNotTasked === false && evidence.length === 0 && Number(data.value) > docIndex;

                                        return (
                                            <div key={docIndex} className="p-3 border rounded-lg grid gap-2 bg-transparent">
                                                <Label className="font-medium text-center text-sm truncate">Minh chứng cho: <span className="font-bold text-primary">{doc.name || `Văn bản ${docIndex + 1}`}</span></Label>
                                                <Criterion1EvidenceUploader
                                                    indicatorId={indicator.id}
                                                    docIndex={docIndex}
                                                    evidence={evidence}
                                                    onUploadComplete={handleUploadComplete}
                                                    onRemove={handleRemoveFile}
                                                    onAddLink={handleAddLink}
                                                    onPreview={onPreview}
                                                    periodId={periodId}
                                                    communeId={communeId}
                                                    accept=".pdf"
                                                    issueDate={doc.issueDate}
                                                    issuanceDeadlineDays={doc.issuanceDeadlineDays}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : <p className="text-sm text-muted-foreground">Vui lòng kê khai thông tin văn bản ở trên để tải lên minh chứng.</p>}
                        </div>

                        <div className="grid gap-2 mt-4">
                            <Label htmlFor={`note-${indicator.id}`}>Ghi chú/Giải trình</Label>
                            <textarea id={`note-${indicator.id}`} placeholder="Giải trình thêm..." value={data.note} onChange={(e) => onNoteChange(indicator.id, e.target.value)} className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RenderTC1LikeIndicator;
