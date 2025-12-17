
'use client';

import Link from 'next/link';
import {
    Bell,
    LogOut,
    Menu,
    Settings,
    CheckCircle2,
    XCircle,
    Clock,
    FileUp,
    Shield,
    User,
    HelpCircle,
    Paintbrush,
    ChevronDown,
    Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import AppSidebar from './app-sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { useData } from '@/context/DataContext';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '../ui/separator';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


export default function AppHeader() {
    const { role, currentUser, units, logout, notifications, markNotificationAsRead } = useData();
    const router = useRouter();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const unreadNotifications = notifications.filter(n => !n.read).length;

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const handleNotificationClick = (notificationId: string, link: string) => {
        markNotificationAsRead(notificationId);
        router.push(link);
    }

    const getAvatarContent = () => {
        if (role === 'admin') {
            return <Shield className="h-5 w-5" />;
        }
        if (role === 'commune_staff') {
            return <User className="h-5 w-5" />;
        }
        if (!currentUser?.displayName) return 'User';
        return currentUser.displayName.split(' ').map(n => n[0]).slice(-2).join('').toUpperCase();
    }

    const getAvatarAlt = () => {
        return currentUser?.displayName || (role === 'admin' ? 'Admin' : 'Cán bộ');
    }

    const notificationIcons: { [key: string]: React.ReactNode } = {
        'đã được duyệt': <CheckCircle2 className="h-4 w-4 text-green-500" />,
        'bị từ chối': <XCircle className="h-4 w-4 text-red-500" />,
        'vừa gửi': <FileUp className="h-4 w-4 text-primary" />,
        'gửi lại': <FileUp className="h-4 w-4 text-amber-500" />,
    }

    const getNotificationIcon = (title: string) => {
        const lowerCaseTitle = title.toLowerCase();
        if (lowerCaseTitle.includes('đã được duyệt')) return notificationIcons['đã được duyệt'];
        if (lowerCaseTitle.includes('bị từ chối')) return notificationIcons['bị từ chối'];
        if (lowerCaseTitle.includes('vừa gửi')) return notificationIcons['vừa gửi'];
        if (lowerCaseTitle.includes('gửi lại')) return notificationIcons['gửi lại'];
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }

    return (
        <header className="sticky top-0 z-50 flex h-[72px] items-center gap-4 border-b border-white/10 bg-gradient-to-r from-[#003B5C] via-[#005A7C] to-[#007A9C] px-4 sm:px-6 transition-all duration-300 text-white shadow-md">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold hover:opacity-90 transition-opacity">
                <Image src="/logo.png" alt="Logo" width={40} height={40} data-ai-hint="application logo" className="drop-shadow-md" />
                <div>
                    <h1 className="font-heading text-lg font-bold uppercase tracking-wide text-white whitespace-nowrap">
                        ĐÁNH GIÁ CHUẨN TIẾP CẬN PHÁP LUẬT
                    </h1>
                    <h2 className="font-heading text-base font-medium uppercase text-white/90 whitespace-nowrap">
                        TỈNH AN GIANG
                    </h2>
                </div>
            </Link>

            <div className="ml-auto flex items-center gap-2">



                <div className="relative hidden md:block w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/70" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm..."
                        className="w-full bg-white/10 border-white/20 pl-9 text-white placeholder:text-white/60 hover:bg-white/20 focus-visible:ring-white/30 focus-visible:border-white/50 h-9 rounded-full transition-all"
                    />
                </div>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative text-white hover:text-yellow-400 hover:bg-white/10 rounded-full">
                            <Bell className="h-5 w-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-[#005A7C]">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-80 p-0">
                        <div className="p-4">
                            <h4 className="font-medium leading-none">Thông báo</h4>
                            <p className="text-sm text-muted-foreground">Bạn có {unreadNotifications} thông báo mới.</p>
                        </div>
                        <Separator />
                        {notifications.filter(n => !n.read).length > 0 ? (
                            <div className="p-2 max-h-80 overflow-y-auto">
                                {notifications.filter(n => !n.read).map(notification => (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "mb-1 flex items-start gap-4 rounded-lg p-3 text-sm transition-colors hover:bg-muted/50 cursor-pointer",
                                            !notification.read && "bg-blue-50/50"
                                        )}
                                        onClick={() => handleNotificationClick(notification.id, notification.link)}
                                    >
                                        <div className="mt-1">
                                            {getNotificationIcon(notification.title)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="leading-snug text-foreground">{notification.title}</p>
                                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-sm text-center text-muted-foreground">Không có thông báo mới.</div>
                        )}

                    </PopoverContent>
                </Popover>

                <div className="h-8 w-px bg-white/20 mx-1" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 p-2 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer group select-none">
                            <Avatar className="h-10 w-10 border-2 border-white/20">
                                <AvatarFallback className={cn('bg-white/10 text-white', role === 'commune_staff' && 'bg-white/10')}>
                                    {getAvatarContent()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:flex flex-col text-left">
                                <span className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors">
                                    {currentUser?.displayName || 'Người dùng'}
                                </span>
                                <span className="text-xs text-white/70 font-medium">
                                    {role === 'admin' ? 'Quản trị viên' : (units.find(u => u.id === currentUser?.communeId)?.name || 'Cán bộ')}
                                </span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild><Link href="/profile" className='flex items-center gap-2'><Settings className='h-4 w-4' />Hồ sơ</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className='flex items-center gap-2'><LogOut className='h-4 w-4' />Đăng xuất</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile navigation */}
                <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0 md:hidden text-white hover:text-yellow-400 hover:bg-white/10">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Mở menu điều hướng</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="flex flex-col p-0 w-[250px]">
                        <AppSidebar isCollapsed={false} toggleSidebar={() => setIsMobileNavOpen(false)} />
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
}
