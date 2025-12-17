'use client';
import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import StatusBadge from './StatusBadge';
import type { Indicator } from '@/lib/data';
import type { AssessmentValues } from './types';

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
  
  const blockClasses = cn(
    'rounded-lg border-2 mb-6',
    headerStatus === 'achieved' && 'bg-green-50 border-green-300',
    headerStatus === 'not-achieved' && 'bg-red-50 border-red-300',
    headerStatus === 'pending' && 'bg-amber-50 border-amber-300'
  );
  
  return (
    <div className={blockClasses}>
      <Accordion type="single" collapsible defaultValue={headerIndicator.id}>
        <AccordionItem value={headerIndicator.id} className="border-none">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-start gap-3 flex-1">
              <StatusBadge status={headerStatus} />
              <span className="font-semibold text-base text-left flex-1">{headerIndicator.name}</span>
              <Badge variant="outline" className="shrink-0">
                {achievedCount}/{totalCount} đạt
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-2">
            <div className="mt-1 space-y-3 pl-3 border-l-2 border-dashed border-gray-300">
               {childIndicators.map(child => {
                 const childStatus = assessmentData[child.id]?.status || 'pending';
                 const childBlockClasses = cn(
                   'rounded-lg p-3',
                   childStatus === 'achieved' && 'bg-green-50',
                   childStatus === 'not-achieved' && 'bg-red-50',
                   childStatus === 'pending' && 'bg-amber-50'
                 );
                 
                 return (
                   <div key={child.id} className={childBlockClasses}>
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
