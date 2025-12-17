
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Book,
  FileCheck2,
  GanttChartSquare,
  FileText,
  LayoutDashboard,
  Building,
  CalendarClock,
  Users,
  HelpCircle,
  UserCheck,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Paintbrush,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { useData } from '@/context/DataContext';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

const adminNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { href: '/admin/users', icon: Users, label: 'Quản lý Người dùng' },
  { href: '/admin/units', icon: Building, label: 'Quản lý Đơn vị' },
  { href: '/admin/registrations', icon: UserCheck, label: 'Quản lý Đăng ký' },
  { href: '/admin/criteria', icon: FileCheck2, label: 'Quản lý Tiêu chí' },
  { href: '/admin/assessment-periods', icon: CalendarClock, label: 'Quản lý Đợt đánh giá' },
  { href: '/admin/reviews', icon: GanttChartSquare, label: 'Duyệt Đánh giá' },
  { href: '/admin/announcements', icon: Megaphone, label: 'Công bố Đánh giá' },
  { href: '/admin/reports', icon: FileText, label: 'Báo cáo & Thống kê' },
  { href: '/admin/login-config', icon: Paintbrush, label: 'Cấu hình hệ thống' },
  { href: '/documents', icon: Book, label: 'Văn bản Hướng dẫn' },
  { href: '/user-guide', icon: HelpCircle, label: 'Hướng dẫn sử dụng' },
];

const communeNavItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Đăng ký & Tổng quan' },
  { href: '/commune/assessments', icon: FileCheck2, label: 'Tự Chấm điểm' },
  { href: '/documents', icon: Book, label: 'Văn bản Hướng dẫn' },
  { href: '/user-guide', icon: HelpCircle, label: 'Hướng dẫn sử dụng' },
];

interface AppSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

export default function AppSidebar({ isCollapsed, toggleSidebar }: AppSidebarProps) {
  const pathname = usePathname();
  const { role, assessments, currentUser } = useData();

  const myAssessment = assessments.find(a => a.communeId === currentUser?.communeId);
  const canStartAssessment = myAssessment?.registrationStatus === 'approved';

  const navItems = role === 'admin' ? adminNavItems : communeNavItems;
  const pendingCount = role === 'admin' ? assessments.filter(a => a.assessmentStatus === 'pending_review').length : 0;

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 bg-[#003B5C] border-white/10 border rounded-xl shadow-xl flex flex-col transition-all duration-300 ease-in-out z-40 group text-white",
        isCollapsed ? 'w-[60px]' : 'w-[250px]'
      )}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <TooltipProvider>
          <nav className="grid items-start px-2 text-sm font-medium gap-1">
            {navItems.map((item) => {
              const isAssessmentLink = item.href === '/commune/assessments';
              const isDisabled = role === 'commune_staff' && isAssessmentLink && !canStartAssessment;

              const linkContent = (
                <Link
                  key={item.href}
                  href={isDisabled ? '#' : item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-3 text-white/70 transition-all duration-200 relative overflow-hidden',
                    isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:text-white hover:bg-white/10',
                    pathname === item.href && !isDisabled ? 'bg-brand-500 text-white font-bold shadow-md' :
                      (pathname.startsWith(item.href) && item.href !== '/dashboard' && !isDisabled) ? 'bg-brand-500 text-white font-bold shadow-md' : '',
                    isCollapsed && 'justify-center px-2'
                  )}
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0 transition-transform duration-300", pathname === item.href ? "scale-110" : "text-white/80")} />
                  <span className={cn('truncate transition-all duration-300 font-medium text-sm', isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100')}>
                    {item.label}
                  </span>
                  {item.href === '/admin/reviews' && pendingCount > 0 && role === 'admin' && !isCollapsed && (
                    <Badge className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] px-0 bg-red-600 text-white border-none">
                      {pendingCount}
                    </Badge>
                  )}
                </Link>
              );

              return isCollapsed ? (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-4 bg-[#003B5C] text-white border-white/10">
                    <span className="font-bold text-sm">{item.label}</span>
                    {item.href === '/admin/reviews' && pendingCount > 0 && role === 'admin' && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-white border-none">
                        {pendingCount}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              ) : (
                linkContent
              );
            })}
          </nav>
        </TooltipProvider>
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border border-white/20 shadow-md bg-[#003B5C] hover:bg-[#004B7C] text-white z-50 hidden group-hover:flex transition-all duration-200"
        onClick={toggleSidebar}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </Button>
    </aside>
  );
}
