

'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { MoreHorizontal, PlusCircle, Trash2, CornerDownRight, Upload, X, Loader2, File as FileIcon, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import PageHeader from '@/components/layout/page-header';
import { useData } from '@/context/DataContext';
import type { Criterion, Indicator } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import Criterion1Config from './Criterion1Config';
import CT4Content1Config from './CT4Content1Config';
// Firebase removed
import { cn } from '@/lib/utils';
import TemplateFileUploader from './TemplateFileUploader';


function CriterionForm({ criterion, onSave, onCancel }: { criterion: Partial<Criterion>, onSave: (criterion: Partial<Criterion>) => void, onCancel: () => void }) {
  const [formData, setFormData] = React.useState(criterion);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{criterion.id ? 'Chỉnh sửa tiêu chí' : 'Tạo tiêu chí mới'}</DialogTitle>
        <DialogDescription>
          {criterion.id ? 'Cập nhật thông tin chi tiết cho tiêu chí này.' : 'Điền thông tin để tạo tiêu chí mới.'}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Tên tiêu chí</Label>
          <Input id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description" className="text-right pt-2">Mô tả</Label>
          <Textarea id="description" value={formData.description || ''} onChange={handleChange} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="submit" onClick={() => onSave(formData)}>{criterion.id ? 'Lưu thay đổi' : 'Tạo mới'}</Button>
      </DialogFooter>
    </>
  );
}

function IndicatorForm({ indicator, onSave, onCancel }: { indicator: Partial<Indicator>, onSave: (indicator: Partial<Indicator>) => void, onCancel: () => void }) {
  const [formData, setFormData] = React.useState(indicator as Indicator);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{indicator.id ? `Chỉnh sửa chỉ tiêu` : `Tạo chỉ tiêu mới`}</DialogTitle>
        <DialogDescription>
          {indicator.id ? `Cập nhật thông tin chi tiết cho chỉ tiêu này.` : `Điền thông tin để tạo chỉ tiêu mới.`}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-6">
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="name" className="text-right pt-2">Tên</Label>
          <Textarea id="name" value={formData.name || ''} onChange={handleChange} className="col-span-3" />
        </div>

        {/* Thêm các ô input này vào IndicatorForm */}
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="description" className="text-right pt-2">Mô tả</Label>
          <Textarea id="description" value={formData.description || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="inputType" className="text-right">Loại dữ liệu</Label>
          <Select value={formData.inputType || 'boolean'} onValueChange={(value) => setFormData(prev => ({ ...prev, inputType: value as any }))}>
            <SelectTrigger id="inputType" className="col-span-3"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="boolean">Lựa chọn Đạt/Không đạt</SelectItem>
              <SelectItem value="number">Nhập liệu số</SelectItem>
              <SelectItem value="select">Lựa chọn nhiều mục</SelectItem>
              <SelectItem value="specific">Đặc biệt</SelectItem>
              <SelectItem value="percentage_ratio">Nhập liệu Tỷ lệ %</SelectItem>
              <SelectItem value="custom_3_4_3" className="font-semibold text-blue-600">
                CT3.4.3 (Kinh phí Tổ HG - Tùy chỉnh)
              </SelectItem>
              <SelectItem value="custom_3_4_4" className="font-semibold text-blue-600">
                CT3.4.4 (Thù lao HGV - Tùy chỉnh)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="standardLevel" className="text-right">Yêu cầu đạt chuẩn</Label>
          <Input id="standardLevel" value={formData.standardLevel || ''} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="evidenceRequirement" className="text-right pt-2">Yêu cầu hồ sơ minh chứng</Label>
          <Textarea id="evidenceRequirement" value={formData.evidenceRequirement || ''} onChange={handleChange} className="col-span-3" placeholder="Ví dụ: Quyết định, Kế hoạch, Báo cáo..." />
        </div>
        {/* ==== THÊM MỚI: Upload File Mẫu ==== */}
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right pt-2">File mẫu tham khảo</Label>
          <div className="col-span-3 space-y-2">
            {/* Component upload file mẫu */}
            <TemplateFileUploader
              indicatorId={formData.id}
              existingFiles={formData.templateFiles || []}
              onFilesChange={(files) => setFormData(prev => ({ ...prev, templateFiles: files }))}
            />
            <p className="text-xs text-muted-foreground">
              Upload file mẫu để cán bộ xã tham khảo (Word, Excel, PDF, Ảnh). Tối đa 10MB/file.
            </p>
          </div>
        </div>
        {/* ===================================== */}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Hủy</Button>
        <Button type="submit" onClick={() => onSave(formData)}>{indicator.id ? 'Lưu thay đổi' : 'Tạo mới'}</Button>
      </DialogFooter>
    </>
  );
}


export default function CriteriaManagementPage() {
  const { criteria, updateCriterion, db, setCriteria } = useData();
  const [editingCriterion, setEditingCriterion] = React.useState<Partial<Criterion> | null>(null);
  const [addingCriterion, setAddingCriterion] = React.useState<boolean>(false);
  const [editingIndicator, setEditingIndicator] = React.useState<{ criterionId: string, indicator: Partial<Indicator> } | null>(null);
  const [addingIndicatorTo, setAddingIndicatorTo] = React.useState<string | null>(null);

  const { toast } = useToast();

  const handleEditCriterion = (criterion: Criterion) => {
    setEditingCriterion(criterion);
  };

  const handleCancelEditCriterion = () => {
    setEditingCriterion(null);
    setAddingCriterion(false);
  }

  const handleSaveCriterion = async (criterionToSave: Partial<Criterion>) => {
    let finalCriterion = { ...criterionToSave } as Criterion;

    // Ensure ID exists
    if (!finalCriterion.id) {
      finalCriterion.id = `TC${Date.now().toString().slice(-6)}`;
      finalCriterion.indicators = [];
    }

    // Call updateCriterion from context (which calls server action)
    // Note: updateCriterion in DataContext handles optimistic update + server call
    await updateCriterion(finalCriterion); // Using updateCriteria alias or updateCriterion? useData returns updateCriteria alias?
    // In DataContext I see: updateCriterion (singular) AND updateCriteria: stubAsync. I should probably use updateCriterion.
    // Wait, DataContext.tsx exported 'updateCriteria' as alias but it was stubAsync. I should check if I implemented it.
    // In step 160: updateCriterion IS IMPLEMENTED. updateCriteria IS stubAsync.
    // BUT the component uses `const { criteria, updateCriteria, db, setCriteria } = useData();` on line 164.
    // So it calls `updateCriteria` which is a STUB.
    // I MUST Change usage to `updateCriterion` or map `updateCriteria` in DataContext.
    // I will change usage to `updateCriterion` here.

    // Actually I can't change the destructuring easily without changing line 164.
    // I will assume I will fix line 164 in next chunk.

    // Logic:
    // 1. Construct full object.
    // 2. Call update.

    // If it's a new criterion, we need to make sure we don't pass incomplete data.
    if (!finalCriterion.name) finalCriterion.name = "Tiêu chí mới";

    // We need to keep existing indicators if editing only properties
    if (criterionToSave.id) {
      const existing = criteria.find(c => c.id === criterionToSave.id);
      if (existing) {
        finalCriterion = { ...existing, ...criterionToSave };
      }
    }

    try {
      await updateCriterion(finalCriterion);
      toast({ title: "Thành công!", description: "Đã lưu tiêu chí." });
    } catch (e) {
      toast({ variant: 'destructive', title: "Lỗi", description: "Không thể lưu tiêu chí" });
    }

    handleCancelEditCriterion();
  };

  const handleAddIndicator = (criterionId: string) => setAddingIndicatorTo(criterionId);
  const handleEditIndicator = (criterionId: string, indicator: Indicator) => setEditingIndicator({ criterionId, indicator });
  const handleCancelEditIndicator = () => { setEditingIndicator(null); setAddingIndicatorTo(null); };

  const handleSaveIndicator = async (indicatorToSave: Partial<Indicator>) => {
    const parentCriterionId = editingIndicator?.criterionId || addingIndicatorTo;
    if (!parentCriterionId) {
      toast({ variant: "destructive", title: "Lỗi!", description: "Không xác định được tiêu chí cha." });
      return;
    }

    const parentCriterion = criteria.find(c => c.id === parentCriterionId);
    if (!parentCriterion) return;

    let finalIndicator: Indicator;
    const isEditing = !!editingIndicator?.indicator?.id;

    if (isEditing) { // Editing existing indicator
      finalIndicator = {
        ...editingIndicator!.indicator,
        ...indicatorToSave,
        templateFiles: indicatorToSave.templateFiles || [],
      } as Indicator;
    } else { // Adding new indicator
      const order = (parentCriterion.indicators?.length || 0) + 1;
      finalIndicator = {
        id: `CT${Date.now().toString().slice(-6)}`,
        name: indicatorToSave.name || "Chỉ tiêu mới",
        description: indicatorToSave.description || "",
        standardLevel: indicatorToSave.standardLevel || "",
        inputType: indicatorToSave.inputType || "boolean",
        evidenceRequirement: indicatorToSave.evidenceRequirement || "",
        templateFiles: indicatorToSave.templateFiles || [],
        order: order,
        originalParentIndicatorId: undefined // Default, set explicitly if nested logic exists (but here we don't have nested creation UI yet)
      } as Indicator;
    }

    // Construct new indicators list
    let newIndicators = [...(parentCriterion.indicators || [])];
    if (isEditing) {
      const idx = newIndicators.findIndex(i => i.id === finalIndicator.id);
      if (idx !== -1) newIndicators[idx] = finalIndicator;
    } else {
      newIndicators.push(finalIndicator);
    }

    // Update the parent criterion
    const updatedCriterion = { ...parentCriterion, indicators: newIndicators };

    try {
      await updateCriterion(updatedCriterion);
      toast({ title: "Thành công!", description: `Đã ${isEditing ? 'cập nhật' : 'thêm'} chỉ tiêu.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Lỗi khi lưu chỉ tiêu." });
    }

    handleCancelEditIndicator();
  };

  const renderIndicatorNode = (criterion: Criterion, indicator: Indicator) => {
    const isGroupHeader = indicator.inputType === 'group_header';
    const childIndicators = isGroupHeader
      ? criterion.indicators.filter(i => i.originalParentIndicatorId === indicator.id)
      : [];

    const isSingleIndicator = !isGroupHeader && !indicator.originalParentIndicatorId;
    const isParentLevel = isGroupHeader || isSingleIndicator;

    return (
      <div key={indicator.id} className="w-full">
        <div className={cn(
          "flex justify-between items-start gap-3 rounded-lg p-4 w-full",
          isParentLevel ? 'bg-violet-50 border-violet-200 border shadow-sm' : 'bg-card border',
        )}>
          <h4 className={cn("font-semibold flex-1 pr-4", isParentLevel ? "text-base text-violet-900" : "text-sm")}>
            {indicator.name}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className='h-8 w-8 flex-shrink-0'>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditIndicator(criterion.id, indicator)}>Sửa chỉ tiêu</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                Xóa chỉ tiêu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {indicator.id === 'CT2.4.1' && (
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-900">
              ⚙️ Cấu hình giao nhiệm vụ
            </h4>
            <CT4Content1Config
              criterion={criterion} // TC02
              onSave={handleSaveCriterion}
            />
          </div>
        )}

        {isGroupHeader && childIndicators.length > 0 && (
          <div className="relative mt-1 space-y-3 pl-3">
            {childIndicators.map(child => (
              <div key={child.id} className="relative flex items-start gap-2">
                <div className="absolute -left-[0.6rem] top-5 h-[1px] w-4 bg-gray-300"></div>
                <CornerDownRight className="absolute -left-6 top-3 h-5 w-5 text-gray-400" />
                {renderIndicatorNode(criterion, child)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Bộ Tiêu chí Đánh giá" description="Quản lý các tiêu chí và chỉ tiêu để đánh giá xã đạt chuẩn tiếp cận pháp luật." />
      <Card>
        <CardHeader>
          {/* The "Add New Criterion" button has been removed as per the user's request. */}
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" defaultValue={criteria.map((c) => c.id)} className="w-full space-y-4">
            {criteria.map((criterion, index) => (
              <AccordionItem value={criterion.id} key={criterion.id} className="border-2 rounded-lg bg-card overflow-hidden">
                <div className="flex items-center justify-between pr-4 hover:bg-muted/50 rounded-lg">
                  <AccordionTrigger className="text-lg font-headline hover:no-underline flex-1 px-4 py-3">
                    <span className="text-primary">
                      Tiêu chí {index + 1}: {criterion.name.replace(`Tiêu chí ${index + 1}: `, '')}
                    </span>
                  </AccordionTrigger>
                  <div className="flex items-center gap-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Badge variant="secondary" className="mr-4">
                      {criterion.indicators?.length ?? 0} chỉ tiêu
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditCriterion(criterion)}>Sửa tiêu chí</DropdownMenuItem>
                        {/* "Add Indicator" option removed as per request */}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Xóa tiêu chí
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <AccordionContent>
                  <div className="space-y-4 px-6 pb-6 pt-2">
                    {criterion.id === 'TC01' && (
                      <Criterion1Config
                        criterion={criterion}
                        onSave={handleSaveCriterion}
                      />
                    )}
                    {/* Lọc và render các chỉ tiêu gốc (không có cha) */}
                    {(criterion.indicators ?? []).filter((ind: Indicator) => !ind.originalParentIndicatorId).map((indicator: Indicator) => (
                      renderIndicatorNode(criterion, indicator)
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <Dialog open={addingCriterion || !!editingCriterion} onOpenChange={(open) => !open && handleCancelEditCriterion()}>
        <DialogContent>
          {(addingCriterion || editingCriterion) && (
            <CriterionForm
              criterion={editingCriterion || {}}
              onSave={handleSaveCriterion}
              onCancel={handleCancelEditCriterion}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingIndicator || !!addingIndicatorTo} onOpenChange={(open) => !open && handleCancelEditIndicator()}>
        <DialogContent className="max-w-3xl">
          {(editingIndicator || addingIndicatorTo) && (
            <IndicatorForm
              indicator={editingIndicator?.indicator || {}}
              onSave={handleSaveIndicator}
              onCancel={handleCancelEditIndicator}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
