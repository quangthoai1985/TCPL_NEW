'use client';
import React from 'react';
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Info, CheckCircle, File as FileIcon } from "lucide-react";
import type { Indicator } from "@/lib/data";
import Criterion1EvidenceUploader from "./Criterion1EvidenceUploader";
import EvidenceUploaderComponent from "./EvidenceUploaderComponent";
import StatusBadge from "./StatusBadge";
import type { IndicatorValue, FileWithStatus, AssessmentValues } from "./types";

const TC1IndicatorRenderer = ({
    indicator,
    indicatorIndex,
    data,
    docsToRender,
    assignedCount,
    onValueChange,
    onNoteChange,
    onEvidenceChange,
    onPreview,
    periodId,
    communeId,
    assessmentData,
}: {
    indicator: Indicator;
    indicatorIndex: number;
    data: IndicatorValue;
    docsToRender: any[];
    assignedCount: number;
    onValueChange: (id: string, value: any) => void;
    onNoteChange: (id: string, note: string) => void;
    onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void;
    onPreview: (file: { name: string; url: string; }) => void;
    periodId: string;
    communeId: string;
    assessmentData: AssessmentValues;
}) => {

    // Check if dependent data exists before rendering.
    // This prevents the "Cannot read properties of undefined" error.
    if (indicatorIndex === 1 || indicatorIndex === 2) {
        if (!assessmentData || !assessmentData['CT1.1']) {
            return (
                <div className={cn("p-4 rounded-lg shadow-sm border", 'bg-amber-50 border-amber-200')}>
                    <div className="flex items-center gap-2">
                        <StatusBadge status="pending" />
                        <h4 className="font-semibold text-base flex-1">{indicator.name}</h4>
                    </div>
                    <p className="text-sm text-amber-800 mt-2">Đang tải dữ liệu phụ thuộc từ chỉ tiêu 1.1...</p>
                </div>
            );
        }
    }


    const valueAsNumber = Number(data.value);

    // Logic mới cho assignedCount của CT1.2 và CT1.3
    const actualAssignedCount = (indicatorIndex === 1 || indicatorIndex === 2)
        ? Number(assessmentData['CT1.1']?.value) || 0
        : assignedCount;

    const progress = (actualAssignedCount > 0) && !isNaN(valueAsNumber)
        ? Math.round((valueAsNumber / actualAssignedCount) * 100)
        : 0;

    const progressColor = progress >= 100 ? "bg-green-500" : "bg-yellow-500";

    const blockClasses = cn(
        "p-4 rounded-lg shadow-sm border-2",
        data.status === 'achieved' && 'bg-green-50 border-green-200',
        data.status === 'not-achieved' && 'bg-red-50 border-red-200',
        data.status === 'pending' && 'bg-amber-50 border-amber-200',
    );

    return (
        <div className={blockClasses}>
            {/* Header */}
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
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">

                {/* Inputs Section */}
                <div className="lg:col-span-7 space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor={`${indicator.id}-input`} className="text-base font-medium">
                            {indicatorIndex === 0 && "1. Tổng số VBQPPL đã ban hành:"}
                            {indicatorIndex === 1 && "2. Tổng số dự thảo được truyền thông:"}
                            {indicatorIndex === 2 && "3. Tổng số VBQPPL được tự kiểm tra:"}
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
                            {indicatorIndex === 0 && `(Chỉ tiêu được giao: ${assignedCount} văn bản)`}
                            {indicatorIndex === 1 && `(So với ${actualAssignedCount} văn bản đã ban hành)`}
                            {indicatorIndex === 2 && `(So với ${actualAssignedCount} văn bản đã ban hành)`}
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

            <div className="grid gap-2 mt-8">
                <Label className="font-medium flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-primary" /> Hồ sơ minh chứng
                </Label>
                <div className="p-4 bg-slate-50/50 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">{indicator.evidenceRequirement || 'Không yêu cầu cụ thể.'}</p>

                    {indicatorIndex === 0 ? (
                        <>
                            <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-900 mb-6">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800 font-semibold">Lưu ý quan trọng</AlertTitle>
                                <AlertDescription className="text-amber-800">Các tệp PDF được tải lên sẽ được hệ thống tự động kiểm tra chữ ký số.</AlertDescription>
                            </Alert>

                            {Array.isArray(docsToRender) && docsToRender.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {docsToRender.map((doc, docIndex) => {
                                        const evidence = data.filesPerDocument?.[docIndex] || [];
                                        const isRequired = data.status !== 'pending' && data.isTasked !== false && evidence.length === 0 && Number(data.value || 0) > docIndex;

                                        return (
                                            <div key={docIndex} className="p-4 border rounded-xl grid gap-3 bg-background shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between gap-2">
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Văn bản {docIndex + 1}
                                                    </Badge>
                                                    {doc.name && <span className="text-xs font-medium text-muted-foreground truncate max-w-[120px]" title={doc.name}>{doc.name}</span>}
                                                </div>

                                                <Criterion1EvidenceUploader
                                                    indicatorId={indicator.id}
                                                    docIndex={docIndex}
                                                    evidence={evidence}
                                                    onUploadComplete={(indicatorId, docIndex, newFile) => onEvidenceChange(indicatorId, [newFile], docIndex)}
                                                    onRemove={(docIndex, fileToRemove) => onEvidenceChange(indicator.id, [], docIndex, fileToRemove)}
                                                    onAddLink={(indicatorId, docIndex, newLink) => onEvidenceChange(indicator.id, [newLink], docIndex)}
                                                    onPreview={onPreview}
                                                    periodId={periodId}
                                                    communeId={communeId}
                                                    accept=".pdf"
                                                />
                                                {isRequired && (
                                                    <p className="text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded">
                                                        * Bắt buộc có minh chứng
                                                    </p>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (indicator.assignmentType === 'quantity' && (indicator.assignedDocumentsCount || 0) === 0 && Number(data.value || 0) === 0) ?
                                <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">Vui lòng nhập số lượng VBQPPL đã ban hành ở trên để kê khai chi tiết.</div>
                                : <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">Admin chưa cấu hình văn bản cụ thể.</div>}
                        </>
                    ) : (
                        <EvidenceUploaderComponent
                            indicatorId={indicator.id}
                            evidence={data.files || []}
                            onEvidenceChange={onEvidenceChange}
                            onPreview={onPreview}
                            isRequired={data.status !== 'pending' && data.isTasked !== false && (data.files || []).length === 0}
                        />
                    )}
                </div>
            </div>

            <div className="grid gap-2 mt-6">
                <Label htmlFor={`note-${indicator.id}`} className="font-medium">Ghi chú / Giải trình thêm</Label>
                <Textarea
                    id={`note-${indicator.id}`}
                    placeholder="Nhập nội dung giải trình..."
                    value={data.note || ''}
                    onChange={(e) => onNoteChange(indicator.id, e.target.value)}
                    className="min-h-[80px]"
                />
            </div>
        </div>
    );
};
export default TC1IndicatorRenderer;
