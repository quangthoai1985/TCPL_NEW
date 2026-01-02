'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import type { Indicator } from '@/lib/data';
import type { AssessmentValues } from './types';
import { ChevronDown, ChevronRight } from 'lucide-react';

const RenderGroupHeader = ({
  headerIndicator,
  childIndicators,
  assessmentData,
  renderChildComponent
}: {
  headerIndicator: Indicator;
  childIndicators: Indicator[];
  assessmentData: AssessmentValues;
  renderChildComponent: (indicator: Indicator) => React.ReactNode;
}) => {
  // Tính status
  const achievedCount = childIndicators.filter(c => assessmentData[c.id]?.status === 'achieved').length;
  const totalCount = childIndicators.length;

  let headerStatus: 'achieved' | 'not-achieved' | 'pending' = 'pending';
  if (headerIndicator.passRule?.type === 'all') {
    const allAchieved = childIndicators.every(c => assessmentData[c.id]?.status === 'achieved');
    const hasNotAchieved = childIndicators.some(c => assessmentData[c.id]?.status === 'not-achieved');
    headerStatus = allAchieved ? 'achieved' : hasNotAchieved ? 'not-achieved' : 'pending';
  } else if (headerIndicator.passRule?.type === 'n-of-m') {
    const required = headerIndicator.passRule.required || 0;
    const hasNotAchieved = childIndicators.some(c => assessmentData[c.id]?.status === 'not-achieved');
    const allCompleted = childIndicators.every(c => assessmentData[c.id]?.status !== 'pending');

    if (achievedCount >= required) {
      headerStatus = 'achieved';
    } else if (allCompleted && achievedCount < required) {
      headerStatus = 'not-achieved';
    } else {
      headerStatus = 'pending';
    }
  }

  // Modern styling: "Flat" Card style with colored backgrounds
  const statusColors = {
    achieved: 'border-green-300 bg-green-50',
    'not-achieved': 'border-red-300 bg-red-50',
    pending: 'border-amber-300 bg-amber-50'
  };

  const currentStatusColor = statusColors[headerStatus];

  return (
    <div className={cn("rounded-md border overflow-hidden mb-4 transition-all w-full max-w-full", currentStatusColor)}>
      <Accordion type="single" collapsible defaultValue={headerIndicator.id}>
        <AccordionItem value={headerIndicator.id} className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-black/5 transition-colors w-full justify-start text-left">
            <div className="flex items-start gap-3 w-full max-w-full overflow-hidden">
              {/* Badge + Counter - Left aligned like child indicators */}
              <div className="flex items-center gap-2 shrink-0">

                <StatusBadge status={headerStatus} />
                <span className="text-xs font-medium text-slate-500 bg-white/50 px-2 py-0.5 rounded-full border border-slate-100 whitespace-nowrap">
                  {achievedCount}/{totalCount} đạt
                </span>
              </div>

              {/* Title - Aligned with child indicators */}
              <div className="flex-1 min-w-0 max-w-full overflow-hidden text-left">
                <h4 className="font-bold text-sm text-slate-800 uppercase tracking-tight break-words line-clamp-2 text-left">
                  {headerIndicator.name}
                </h4>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-0 pb-0">
            {/* Flattened content area - Validated to remove deep nesting visual */}
            <div className="bg-white border-t border-slate-100 p-2 sm:p-3 space-y-3 w-full max-w-full overflow-hidden">
              {childIndicators.map((child, index) => {
                // Determine if this child is the last one to avoid bottom margin if needed (though space-y handles it)
                return (
                  <div key={child.id} className="animate-in fade-in slide-in-from-top-1 duration-300 fill-mode-backwards w-full max-w-full" style={{ animationDelay: `${index * 50}ms` }}>
                    {renderChildComponent(child)}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default RenderGroupHeader;
