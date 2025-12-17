'use client';
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { File as FileIcon, Download, Info, Eye, CheckCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EvidenceUploaderComponent from './EvidenceUploaderComponent';
import type { Indicator } from '@/lib/data';
import type { FileWithStatus, IndicatorValue } from './types';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Component render chung cho các chỉ tiêu dạng Tỷ lệ % (2 ô input)
const RenderPercentageRatioIndicator = ({
  indicator,
  data,
  onValueChange,
  onNoteChange,
  onEvidenceChange,
  onPreview,
  onIsTaskedChange
}: {
  indicator: Indicator;
  data: IndicatorValue;
  onValueChange: (id: string, value: any) => void;
  onNoteChange: (id: string, note: string) => void;
  onEvidenceChange: (id: string, files: FileWithStatus[], docIndex?: number, fileToRemove?: FileWithStatus) => void;
  onPreview: (file: { name: string; url: string; }) => void;
  onIsTaskedChange: (id: string, isTasked: boolean) => void;
}) => {

  const valueObj = (typeof data.value === 'object' && data.value !== null) ? data.value : { total: '', completed: '', provided: '' };
  const total = Number(valueObj.total || 0);
  const completedOrProvided = Number(valueObj.completed || valueObj.provided || 0);
  const percentage = total > 0 ? Math.round((completedOrProvided / total) * 100) : 0;

  const totalLabel =
    indicator.id === 'CT2.3' ? "Số lượng yêu cầu cung cấp thông tin" :
      indicator.id === 'CT2.4.2' ? "Số nhiệm vụ đề ra trong kế hoạch" :
        indicator.id === 'CT2.4.3' ? "Số nhiệm vụ phát sinh ngoài kế hoạch" :
          indicator.id === 'CT2.6.2' ? "Số nhiệm vụ về phổ biến, giáo dục pháp luật trong kế hoạch" :
            indicator.id === 'CT2.6.3' ? "Số tuyên truyền viên pháp luật" :
              indicator.id === 'CT2.7.2' ? "Tổng số nhiệm vụ, hoạt động đề ra trong kế hoạch" :
                indicator.id === 'CT3.1.1' ? "Tổng số tổ hòa giải phải thành lập, kiện toàn trên địa bàn cấp xã" :
                  indicator.id === 'CT3.1.2' ? "Tổng số hòa giải viên phải thực hiện bầu, công nhận, cho thôi theo quy định của pháp luật" :
                    indicator.id === 'CT3.2.1' ? "Tổng số vụ việc hòa giải đã tiếp nhận trên địa bàn xã" :
                      indicator.id === 'CT3.2.2' ? "Tổng số vụ việc đã hòa giải" :
                        indicator.id === 'CT3.3' ? "Tổng số tổ hoà giải trên địa bàn cấp xã" :
                          indicator.id === 'CT3.4.2' ? 'Tổng số hoà giải viên trên địa bàn cấp xã' :
                            indicator.id === 'CT3.4.3' ? 'Tổng số tổ hoà giải trên địa bàn cấp xã' :
                              indicator.id === 'CT3.4.4' ? 'Tổng số vụ, việc hoà giải đã giải quyết' :
                                "Tổng số nhiệm vụ/vụ việc";

  const completedLabel =
    indicator.id === 'CT2.3' ? "Số lượng thông tin đã cung cấp theo yêu cầu" :
      indicator.id === 'CT2.4.2' ? "Số nhiệm vụ đã thực hiện" :
        indicator.id === 'CT2.4.3' ? "Đã thực hiện số nhiệm vụ phát sinh ngoài kế hoạch" :
          indicator.id === 'CT2.6.2' ? "Số nhiệm vụ về phổ biến, giáo dục pháp luật trong kế hoạch được phân bổ kinh phí" :
            indicator.id === 'CT2.6.3' ? "Số tuyên truyền viên pháp luật được tập huấn, bồi dưỡng kiến thức pháp luật" :
              indicator.id === 'CT2.7.2' ? "Tổng số nhiệm vụ, hoạt động đã triển khai và hoàn thành trên thực tế" :
                indicator.id === 'CT3.1.1' ? "Tổng số tổ hòa giải được thành lập, kiện toàn đáp ứng yêu cầu về số lượng, thành phần theo quy định của pháp luật" :
                  indicator.id === 'CT3.1.2' ? "Tổng số hòa giải viên được bầu, công nhận, cho thôi theo quy định của pháp luật" :
                    indicator.id === 'CT3.2.1' ? "Tổng số vụ việc đã hòa giải" :
                      indicator.id === 'CT3.2.2' ? "Tổng số vụ việc hòa giải thành" :
                        indicator.id === 'CT3.3' ? "Tổng số tổ hoà giải thực hiện ít nhất 02 hoạt động phối hợp, hỗ trợ hiệu quả" :
                          indicator.id === 'CT3.4.2' ? 'Tổng số hoà giải viên ở cơ sở được cung cấp tài liệu, tập huấn, bồi dưỡng kiến thức pháp luật, kỹ năng hoà giải ở cơ sở' :
                            indicator.id === 'CT3.4.3' ? 'Tổng số tổ hoà giải được hỗ trợ kinh phí hoạt động đúng mức chi theo quy định' :
                              indicator.id === 'CT3.4.4' ? 'Tổng số vụ, việc đã hoà giải được hỗ trợ thù lao cho hoà giải viên đúng mức chi theo quy định' :
                                "Số nhiệm vụ/vụ việc hoàn thành/thành công";

  const totalKey = 'total';
  const completedKey = indicator.id === 'CT2.3' ? 'provided' : 'completed';

  const handleInputChange = (field: 'total' | 'completed' | 'provided', inputValue: string) => {
    const newValueObj = {
      ...valueObj,
      [field]: inputValue
    };
    if (field === 'completed') delete newValueObj.provided;
    if (field === 'provided') delete newValueObj.completed;

    onValueChange(indicator.id, newValueObj);
  };

  const isEvidenceRequired = data.status !== 'pending' && (data.files || []).length === 0;

  const isSpecialIndicator = indicator.id === 'CT3.1.1' || indicator.id === 'CT3.1.2' || indicator.id === 'CT3.2.2';
  const isTasked = data.isTasked !== false;

  const checkboxLabel = indicator.id === 'CT3.1.1'
    ? "Không phát sinh yêu cầu thành lập, kiện toàn tổ hòa giải"
    : indicator.id === 'CT3.1.2'
      ? "Không phát sinh yêu cầu kiện toàn, công nhận, cho thôi hòa giải viên"
      : "Không phát sinh vụ việc"; // For CT3.2.2

  const handleIsTaskedCheckboxChange = (checked: boolean | 'indeterminate') => {
    onIsTaskedChange(indicator.id, !checked);
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-2">
        <StatusBadge status={data.status} />
        <h4 className="font-semibold text-base flex-1">{indicator.name}</h4>
      </div>

      <div className="p-3 bg-blue-50/50 border-l-4 border-blue-300 rounded-r-md">
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

      <div className="grid gap-6">
        {isSpecialIndicator && (
          <div className="flex items-center space-x-2 p-4 border rounded-md bg-green-50/50">
            <Checkbox
              id={`${indicator.id}-notask`}
              checked={!isTasked}
              onCheckedChange={handleIsTaskedCheckboxChange}
              className="text-green-600 border-green-500 data-[state=checked]:bg-green-600 data-[state=checked]:text-white"
            />
            <Label htmlFor={`${indicator.id}-notask`} className="font-semibold cursor-pointer select-none text-green-800">{checkboxLabel}</Label>
          </div>
        )}

        {isTasked ? (
          <div className="overflow-hidden border bg-background rounded-md">
            <div className="bg-muted/30 p-4 border-b">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-5 h-5 text-primary" />
                Kết quả tự đánh giá
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Inputs Section */}
              <div className="lg:col-span-7 space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor={`ratio-total-${indicator.id}`} className="text-sm text-muted-foreground">{totalLabel}</Label>
                  <div className="relative">
                    <Input
                      id={`ratio-total-${indicator.id}`}
                      type="number"
                      placeholder="Nhập số lượng..."
                      className="pl-4 h-11 text-lg font-medium"
                      value={valueObj[totalKey] || ''}
                      onChange={(e) => handleInputChange(totalKey as 'total', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`ratio-completed-${indicator.id}`} className="text-sm text-muted-foreground">{completedLabel}</Label>
                  <div className="relative">
                    <Input
                      id={`ratio-completed-${indicator.id}`}
                      type="number"
                      placeholder="Nhập số lượng..."
                      className="pl-4 h-11 text-lg font-medium"
                      value={valueObj[completedKey] || ''}
                      onChange={(e) => handleInputChange(completedKey as 'completed' | 'provided', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center p-6 bg-slate-50 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800">
                <div className="text-center mb-4">
                  <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Tỷ lệ hoàn thành</div>
                  <div className={cn(
                    "text-4xl font-extrabold tracking-tight",
                    percentage >= 100 ? "text-green-600" : "text-blue-600"
                  )}>
                    {percentage}%
                  </div>
                </div>
                <Progress
                  value={percentage}
                  className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700"
                  indicatorClassName={cn(
                    "transition-all duration-500 ease-out rounded-full",
                    percentage >= 100 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                  )}
                />
                <div className="mt-3 text-xs text-muted-foreground flex gap-2 items-center">
                  {percentage >= 100
                    ? <span className="flex items-center text-green-600 font-medium"><CheckCircle className="w-3 h-3 mr-1" /> Đạt chỉ tiêu</span>
                    : <span>Cần thêm {total ? Math.ceil(total - completedOrProvided) : 0} để đạt 100%</span>
                  }
                </div>
              </div>
            </div>

            <Separator />

            {/* Evidence Section */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="space-y-4">
                <div>
                  <Label className="font-medium flex items-center gap-2 mb-1">
                    <FileIcon className="h-4 w-4 text-blue-600" /> Hồ sơ minh chứng
                  </Label>
                  <p className="text-xs text-muted-foreground">{indicator.evidenceRequirement || 'Không yêu cầu cụ thể.'}</p>
                </div>
                <EvidenceUploaderComponent
                  indicatorId={indicator.id}
                  evidence={data.files || []}
                  onEvidenceChange={onEvidenceChange}
                  onPreview={onPreview}
                  isRequired={isEvidenceRequired}
                />
              </div>
            </div>

            <Separator />

            {/* Note Section */}
            <div className="p-6">
              <Label htmlFor={`note-${indicator.id}`} className="font-medium mb-2 block">Ghi chú / Giải trình thêm</Label>
              <Textarea
                id={`note-${indicator.id}`}
                placeholder="Nhập ghi chú hoặc giải trình chi tiết tại đây (nếu cần)..."
                value={data.note || ''}
                onChange={(e) => onNoteChange(indicator.id, e.target.value)}
                className="resize-y min-h-[80px]"
              />
            </div>
          </div>
        ) : (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-800 font-semibold ml-2">Đã xác nhận không phát sinh</AlertTitle>
            <AlertDescription className="text-green-700 ml-2">
              Chỉ tiêu này sẽ được tự động đánh giá là "Đạt".
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default RenderPercentageRatioIndicator;
