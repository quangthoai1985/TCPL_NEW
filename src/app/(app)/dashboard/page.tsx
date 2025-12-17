
'use client';
import {
    Users,
    Eye,
    Clock,
    CheckCircle,
    XCircle,
    FilePenLine,
    ArrowRight,
    Edit,
    FileClock,
    ThumbsUp,
    ThumbsDown,
    UserCheck,
    AlertTriangle,
    Loader2,
    Undo2,
    Award,
    FileX,
    Send,
    Megaphone,
    Newspaper,
    Trophy,
    Download,
    CalendarClock,
    FileCheck2,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Pie, PieChart, Cell, ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import React, { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/page-header';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Assessment, Unit, Criterion, IndicatorResult } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

const countTotalIndicators = (criteria: Criterion[]): number => {
    return criteria.reduce((total, criterion) => {
        return total + criterion.indicators.reduce((indicatorTotal, indicator) => {
            if (indicator.subIndicators && indicator.subIndicators.length > 0) {
                return indicatorTotal + indicator.subIndicators.length;
            }
            return indicatorTotal + 1;
        }, 0);
    }, 0);
};

const calculateProgress = (assessmentData: Record<string, IndicatorResult> | undefined, totalIndicators: number): number => {
    if (!assessmentData || totalIndicators === 0) {
        return 0;
    }

    // Đếm số chỉ tiêu đã có giá trị hoặc được đánh dấu là không thực hiện
    const assessedCount = Object.values(assessmentData).filter(result =>
        result.isTasked === false || (result.value !== null && result.value !== undefined && result.value !== '')
    ).length;

    return Math.round((assessedCount / totalIndicators) * 100);
};

import { type ChartConfig } from '@/components/ui/chart';

const AdminDashboard = () => {
    const { units, assessments, assessmentPeriods } = useData();
    const [selectedPeriod, setSelectedPeriod] = React.useState<string | undefined>(assessmentPeriods.find(p => p.isActive)?.id);

    const {
        totalCommunes,
        totalRegisteredCommunes,
        achievedCount,
        notAchievedCount,
        notRegisteredCount,
        pendingReviewCount,
        returnedCount,
        statusDistribution
    } = React.useMemo(() => {
        const allCommuneUnits = units.filter(u => u.type === 'commune');
        const totalCommunes = allCommuneUnits.length;

        const periodAssessments = selectedPeriod
            ? assessments.filter(a => a.assessmentPeriodId === selectedPeriod)
            : [];

        const registeredCommuneIds = new Set(periodAssessments.map(a => a.communeId));
        const totalRegisteredCommunes = registeredCommuneIds.size;

        const achievedCount = periodAssessments.filter(a => a.assessmentStatus === 'achieved_standard').length;
        const notAchievedCount = periodAssessments.filter(a => a.assessmentStatus === 'rejected').length;
        const pendingReviewCount = periodAssessments.filter(a => a.assessmentStatus === 'pending_review').length;
        const returnedCount = periodAssessments.filter(a => a.assessmentStatus === 'returned_for_revision').length;

        const notRegisteredCount = allCommuneUnits.length - totalRegisteredCommunes;

        const statusDistribution = [
            { status: 'achieved', name: 'Đạt chuẩn', value: achievedCount, fill: '#10b981' },
            { status: 'pending', name: 'Chờ duyệt', value: pendingReviewCount, fill: '#f59e0b' },
            { status: 'returned', name: 'Yêu cầu sửa', value: returnedCount, fill: '#d97706' },
            { status: 'rejected', name: 'Không đạt', value: notAchievedCount, fill: '#ef4444' },
            { status: 'unregistered', name: 'Chưa đăng ký', value: notRegisteredCount, fill: '#64748b' },
        ].filter(item => item.value > 0);

        return {
            totalCommunes,
            totalRegisteredCommunes,
            achievedCount,
            notAchievedCount,
            notRegisteredCount,
            pendingReviewCount,
            returnedCount,
            statusDistribution
        };

    }, [selectedPeriod, assessments, units]);

    const chartConfig = {
        value: {
            label: "Số lượng",
        },
        achieved: {
            label: "Đạt chuẩn",
            color: "#10b981",
        },
        pending: {
            label: "Chờ duyệt",
            color: "#f59e0b",
        },
        returned: {
            label: "Yêu cầu sửa",
            color: "#d97706",
        },
        rejected: {
            label: "Không đạt",
            color: "#ef4444",
        },
        unregistered: {
            label: "Chưa đăng ký",
            color: "#64748b",
        },
    } satisfies ChartConfig;

    const kpiCards = [
        {
            title: "Tổng số xã",
            value: totalCommunes,
            icon: Users,
            description: "Đơn vị hành chính cấp xã",
            gradient: "from-blue-500 to-blue-600",
            link: "/admin/units"
        },
        {
            title: "Đạt chuẩn TCPL",
            value: achievedCount,
            total: totalRegisteredCommunes,
            icon: Award,
            description: "Đã được công nhận",
            gradient: "from-emerald-500 to-emerald-600",
            link: "/admin/reviews?tab=achieved_standard"
        },
        {
            title: "Chờ thẩm định",
            value: pendingReviewCount,
            total: totalRegisteredCommunes,
            icon: Clock,
            description: "Hồ sơ đang chờ duyệt",
            gradient: "from-amber-500 to-amber-600",
            link: "/admin/reviews?tab=pending_review"
        },
        {
            title: "Chưa đăng ký",
            value: notRegisteredCount,
            icon: FileX,
            description: "Chưa tham gia đánh giá",
            gradient: "from-slate-500 to-slate-600",
            link: "/admin/registrations?tab=unregistered"
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <PageHeader
                title="Tổng quan hệ thống"
                description="Theo dõi tiến độ và kết quả đánh giá chuẩn tiếp cận pháp luật."
            >
                <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                        <SelectTrigger className="w-[280px] border-none shadow-none focus:ring-0">
                            <SelectValue placeholder="Chọn đợt đánh giá" />
                        </SelectTrigger>
                        <SelectContent>
                            {assessmentPeriods.map(period => (
                                <SelectItem key={period.id} value={period.id}>{period.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </PageHeader>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Link href={card.link} key={index} className="group">
                            <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        {card.title}
                                    </CardTitle>
                                    <div className={`p-2 rounded-full bg-gradient-to-br ${card.gradient} text-white shadow-md`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-foreground">{card.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {card.description}
                                    </p>
                                    {card.total !== undefined && card.total > 0 && (
                                        <Progress value={(card.value / card.total) * 100} className="h-1 mt-3" />
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-7">
                <Card className="md:col-span-4 border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Biểu đồ trạng thái đánh giá</CardTitle>
                        <CardDescription>Phân bố kết quả đánh giá trong kỳ hiện tại</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                            <PieChart>
                                <Pie
                                    data={statusDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    nameKey="status"
                                >
                                    {statusDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <ChartTooltip
                                    content={<ChartTooltipContent hideLabel />}
                                    cursor={false}
                                />
                                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                            </PieChart>
                        </ChartContainer>
                        <div className="flex flex-wrap justify-center gap-4 mt-4">
                            {statusDistribution.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                                    <span className="text-sm text-muted-foreground">{item.name}: <span className="font-semibold text-foreground">{item.value}</span></span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-3 flex flex-col gap-6">
                    <Card className="flex-1 border-none shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-background">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                                <Megaphone className="h-5 w-5" />Công bố Đánh giá
                            </CardTitle>
                            <CardDescription>
                                Quản lý quyết định công nhận xã đạt chuẩn.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Tải lên quyết định và công bố kết quả chính thức cho các đơn vị.
                            </p>
                            <Link href="/admin/announcements">
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                    Truy cập <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 border-none shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Newspaper className="h-5 w-5 text-primary" />Quản lý Tin tức
                            </CardTitle>
                            <CardDescription>
                                Đăng tải thông báo và tin tức mới.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Tính năng đang được phát triển.
                            </p>
                            <Button variant="secondary" className="w-full" disabled>
                                Sắp ra mắt
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
};

const CommuneDashboard = () => {
    const { storage, assessments, currentUser, assessmentPeriods, updateAssessments, deleteAssessment, criteria } = useData();
    const { toast } = useToast();
    const [registrationFile, setRegistrationFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const activePeriod = assessmentPeriods.find(p => p.isActive);
    const myAssessment = activePeriod && currentUser
        ? assessments.find(a => a.assessmentPeriodId === activePeriod.id && a.communeId === currentUser.communeId)
        : undefined;

    const totalIndicators = useMemo(() => countTotalIndicators(criteria), [criteria]);

    // Find the latest assessment that has been officially announced
    const latestAnnouncedAssessment = useMemo(() => {
        return assessments
            .filter(a => a.communeId === currentUser?.communeId && a.announcementDecisionUrl)
            .sort((a, b) => (assessmentPeriods.find(p => p.id === b.assessmentPeriodId)?.endDate || '').localeCompare(assessmentPeriods.find(p => p.id === a.assessmentPeriodId)?.endDate || ''))
        [0];
    }, [assessments, currentUser, assessmentPeriods]);


    const uploadFileAndGetURL = async (periodId: string, communeId: string, file: File): Promise<string> => {
        if (!storage) throw new Error("Firebase Storage is not initialized.");
        const filePath = `hoso/${communeId}/registration/${periodId}/${file.name}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    };

    const handleRegister = async () => {
        if (!activePeriod || !currentUser || !registrationFile) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn tệp đơn đăng ký.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const fileUrl = await uploadFileAndGetURL(activePeriod.id, currentUser.communeId, registrationFile);

            const assessmentId = `assess_${activePeriod.id}_${currentUser.communeId}`;
            const newAssessment: Assessment = {
                id: assessmentId,
                assessmentPeriodId: activePeriod.id,
                communeId: currentUser.communeId,
                registrationStatus: 'pending',
                assessmentStatus: 'not_started',
                registrationSubmissionDate: new Date().toLocaleDateString('vi-VN'),
                submittedBy: currentUser.id,
                registrationFormUrl: fileUrl,
            };

            await updateAssessments([...assessments, newAssessment]);
            toast({ title: 'Thành công', description: 'Đã gửi đơn đăng ký. Vui lòng chờ Admin duyệt.' });
        } catch (error) {
            console.error("File upload error: ", error);
            toast({ variant: 'destructive', title: 'Lỗi tải tệp', description: 'Đã xảy ra lỗi khi tải tệp lên. Vui lòng kiểm tra lại quy tắc bảo mật của Storage và thử lại.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResubmit = async () => {
        if (!myAssessment || !registrationFile || !activePeriod) {
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Vui lòng chọn tệp đơn đăng ký mới.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const fileUrl = await uploadFileAndGetURL(activePeriod.id, myAssessment.communeId, registrationFile);

            const updatedAssessment: Assessment = {
                ...myAssessment,
                registrationStatus: 'pending',
                registrationFormUrl: fileUrl,
                registrationRejectionReason: '',
                registrationSubmissionDate: new Date().toLocaleDateString('vi-VN'),
            };

            await updateAssessments(assessments.map(a => a.id === myAssessment.id ? updatedAssessment : a));
            toast({ title: 'Thành công', description: 'Đã gửi lại đơn đăng ký. Vui lòng chờ Admin duyệt.' });
        } catch (error) {
            console.error("File re-upload error: ", error);
            toast({ variant: 'destructive', title: 'Lỗi tải tệp', description: 'Đã xảy ra lỗi khi tải tệp lên. Vui lòng thử lại.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleWithdraw = async () => {
        if (!myAssessment) return;
        setIsWithdrawing(true);
        try {
            await deleteAssessment(myAssessment.id);
            toast({ title: "Thành công", description: "Đã thu hồi đơn đăng ký. Bạn có thể nộp lại đơn mới." });
        } catch (error) {
            console.error("Withdrawal error:", error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể thu hồi đơn đăng ký.' });
        } finally {
            setIsWithdrawing(false);
        }
    };


    const getPeriodName = (periodId: string) => {
        return assessmentPeriods.find(p => p.id === periodId)?.name || 'Không xác định';
    }

    const isRegistrationDeadlinePassed = () => {
        if (!activePeriod?.registrationDeadline) return false;
        // Basic DD/MM/YYYY to Date conversion
        const parts = activePeriod.registrationDeadline.split('/');
        if (parts.length !== 3) return false;
        const deadline = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        deadline.setHours(23, 59, 59, 999); // Set to end of day
        return new Date() > deadline;
    };

    // --- Conditional Rendering Logic ---
    if (latestAnnouncedAssessment) {
        return (
            <div className="flex flex-1 items-center justify-center animate-in fade-in duration-500">
                <Card className="w-full max-w-2xl text-center shadow-2xl border-2 border-amber-300 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-amber-950/30 dark:to-background">
                    <CardHeader className="items-center">
                        <Trophy className="h-20 w-20 text-amber-500 animate-pulse" />
                        <CardTitle className="text-3xl font-headline text-amber-800 dark:text-amber-400 mt-4">
                            CHÚC MỪNG!
                        </CardTitle>
                        <CardDescription className="text-lg text-amber-700 dark:text-amber-500">
                            {currentUser?.displayName.split(' ').slice(-1).join(' ')} đã được công nhận<br />
                            <strong className="font-semibold">"Xã đạt chuẩn Tiếp cận Pháp luật"</strong>
                            <br /> trong kỳ đánh giá "{getPeriodName(latestAnnouncedAssessment.assessmentPeriodId)}"
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">Ngày công nhận: {latestAnnouncedAssessment.announcementDate}</p>
                        <Button size="lg" asChild className="bg-amber-600 hover:bg-amber-700 shadow-lg">
                            <a href={latestAnnouncedAssessment.announcementDecisionUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-5 w-5" /> Xem Quyết định công nhận
                            </a>
                        </Button>
                    </CardContent>
                    <CardFooter className="flex-col gap-4 pt-6 border-t border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-muted-foreground">Bạn có thể xem lại lịch sử đánh giá chi tiết bên dưới.</p>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    const deadlinePassed = isRegistrationDeadlinePassed();
    const canStartAssessment = myAssessment?.registrationStatus === 'approved';
    const isRegistrationRejected = myAssessment?.registrationStatus === 'rejected';
    const isPendingRegistration = myAssessment?.registrationStatus === 'pending';
    const isAssessmentReturned = myAssessment?.assessmentStatus === 'returned_for_revision';

    // KPI Data Calculation
    const currentProgress = myAssessment ? calculateProgress(myAssessment.assessmentData, totalIndicators) : 0;

    const kpiCards = [
        {
            title: "Kỳ đánh giá hiện tại",
            value: activePeriod ? activePeriod.name : "Chưa có",
            icon: CalendarClock,
            description: activePeriod ? `Hạn đăng ký: ${activePeriod.registrationDeadline}` : "Vui lòng chờ thông báo",
            gradient: "from-blue-500 to-blue-600",
        },
        {
            title: "Trạng thái đăng ký",
            value: myAssessment ? (myAssessment.registrationStatus === 'approved' ? "Đã duyệt" : (myAssessment.registrationStatus === 'pending' ? "Chờ duyệt" : "Chưa đạt")) : "Chưa đăng ký",
            icon: UserCheck,
            description: myAssessment ? `Ngày nộp: ${myAssessment.registrationSubmissionDate}` : "Cần nộp đơn đăng ký",
            gradient: "from-emerald-500 to-emerald-600",
        },
        {
            title: "Tiến độ tự đánh giá",
            value: `${currentProgress}%`,
            icon: FileCheck2,
            description: "Dựa trên số chỉ tiêu đã nhập",
            gradient: "from-amber-500 to-amber-600",
            progress: currentProgress
        },
        {
            title: "Kết quả thẩm định",
            value: myAssessment?.assessmentStatus === 'achieved_standard' ? "Đạt chuẩn" : (myAssessment?.assessmentStatus === 'rejected' ? "Không đạt" : "Đang chờ"),
            icon: Award,
            description: "Kết quả từ Hội đồng",
            gradient: "from-purple-500 to-purple-600",
        },
    ];

    const renderRegistrationStatus = () => {
        if (!myAssessment) {
            return (
                <div className={`space-y-4`}>
                    <div className="flex items-center justify-between">
                        <h3 className='font-semibold text-lg flex items-center gap-2'><FilePenLine className="h-5 w-5 text-primary" /> Đăng ký tham gia</h3>
                        {deadlinePassed && <Badge variant="destructive">Đã hết hạn</Badge>}
                    </div>

                    {deadlinePassed ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Đã hết hạn đăng ký!</AlertTitle>
                            <AlertDescription>
                                Đã qua thời hạn đăng ký cho kỳ đánh giá này ({activePeriod?.registrationDeadline}). Vui lòng liên hệ Admin để biết thêm chi tiết.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <p className='text-sm text-muted-foreground'>Tải lên đơn đăng ký (PDF/Word/Image) để Admin phê duyệt.</p>
                            <div className="grid w-full items-center gap-2">
                                <Input id="registration-file" type="file" onChange={(e) => setRegistrationFile(e.target.files ? e.target.files[0] : null)} disabled={isSubmitting} className="cursor-pointer" />
                                <p className="text-xs text-muted-foreground">Tối đa 5MB.</p>
                            </div>
                            <Button onClick={handleRegister} disabled={!registrationFile || isSubmitting} className="w-full mt-2">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {isSubmitting ? 'Đang gửi...' : 'Gửi đăng ký'}
                            </Button>
                        </>
                    )}
                </div>
            );
        }

        const statusMap = {
            pending: { text: 'Chờ duyệt', icon: Clock, className: 'bg-amber-500' },
            approved: { text: 'Đã duyệt', icon: CheckCircle, className: 'bg-green-500' },
            rejected: { text: 'Từ chối', icon: XCircle, className: 'bg-red-500' },
        };

        const currentStatus = myAssessment.registrationStatus;
        const statusInfo = statusMap[currentStatus as keyof typeof statusMap];

        if (statusInfo) {
            return (
                <div className='space-y-4'>
                    <div className="flex items-center justify-between">
                        <h3 className='font-semibold text-lg flex items-center gap-2'><FilePenLine className="h-5 w-5 text-primary" /> Trạng thái đăng ký</h3>
                        <Badge className={`${statusInfo.className} text-white`}>
                            <statusInfo.icon className="mr-1 h-3 w-3" /> {statusInfo.text}
                        </Badge>
                    </div>

                    {isPendingRegistration && (
                        <div className="flex justify-end">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                        <Undo2 className="mr-2 h-4 w-4" /> Thu hồi đơn
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Xác nhận thu hồi?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Hành động này sẽ thu hồi đơn đăng ký đã gửi. Bạn sẽ có thể tải lên một đơn mới và gửi lại.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleWithdraw} disabled={isWithdrawing} className="bg-destructive hover:bg-destructive/90">
                                            {isWithdrawing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            Xác nhận
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}

                    {(isRegistrationRejected) && (
                        <>
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Lý do từ chối:</AlertTitle>
                                <AlertDescription>
                                    {myAssessment.registrationRejectionReason || "Không có lý do cụ thể."}
                                </AlertDescription>
                            </Alert>
                            {!deadlinePassed && (
                                <div className="pt-4 border-t border-dashed">
                                    <h4 className="font-medium text-sm mb-2">Gửi lại đơn đăng ký:</h4>
                                    <Input id="registration-file-resubmit" type="file" onChange={(e) => setRegistrationFile(e.target.files ? e.target.files[0] : null)} disabled={isSubmitting} className="mb-2" />
                                    <Button onClick={handleResubmit} disabled={!registrationFile || isSubmitting} className='w-full'>
                                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {isSubmitting ? 'Đang gửi lại...' : 'Gửi lại'}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        }

        return null;
    };


    const AssessmentButton = () => {
        const assessmentNotStarted = myAssessment?.assessmentStatus === 'not_started' || myAssessment?.assessmentStatus === 'draft' || myAssessment?.assessmentStatus === 'returned_for_revision';
        const buttonText = canStartAssessment && assessmentNotStarted ? 'Thực hiện Tự đánh giá' : 'Xem lại hồ sơ';

        return (
            <Button className='w-full mt-4' disabled={!canStartAssessment} asChild={canStartAssessment}>
                {canStartAssessment ? (
                    <Link href="/commune/assessments">
                        {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                ) : (
                    <button disabled>{buttonText} <ArrowRight className="ml-2 h-4 w-4" /></button>
                )}
            </Button>
        );
    };


    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
                <p className="text-sm text-gray-600 mt-1">Theo dõi tiến độ và kết quả đánh giá chuẩn tiếp cận pháp luật.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <Card key={index} className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10`} />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    {card.title}
                                </CardTitle>
                                <div className={`p-2 rounded-full bg-gradient-to-br ${card.gradient} text-white shadow-md`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-foreground truncate">{card.value}</div>
                                <p className="text-xs text-muted-foreground mt-1 truncate">
                                    {card.description}
                                </p>
                                {card.progress !== undefined && (
                                    <Progress value={card.progress} className="h-1 mt-3" />
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <FilePenLine className="h-5 w-5" />
                            </div>
                            Bước 1: Đăng ký tham gia
                        </CardTitle>
                        <CardDescription>Nộp đơn đăng ký để bắt đầu quy trình.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activePeriod ? renderRegistrationStatus() : <p className="text-muted-foreground">Chưa có kỳ đánh giá nào.</p>}
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm ${!canStartAssessment && 'opacity-70'}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <div className="p-2 rounded-md bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <FileCheck2 className="h-5 w-5" />
                            </div>
                            Bước 2: Tự đánh giá
                        </CardTitle>
                        <CardDescription>Chấm điểm và tải lên minh chứng.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <p className='text-sm text-muted-foreground'>Sau khi đăng ký được duyệt, bạn có thể bắt đầu tự đánh giá theo bộ tiêu chí.</p>

                            {isAssessmentReturned && (
                                <Alert variant="destructive" className="border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertTitle>Yêu cầu chỉnh sửa:</AlertTitle>
                                    <AlertDescription>
                                        Hồ sơ đã bị trả lại. Vui lòng kiểm tra và bổ sung.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <AssessmentButton />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Lịch sử các đợt đánh giá</CardTitle>
                    <CardDescription>
                        Theo dõi trạng thái các hồ sơ đánh giá bạn đã gửi.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Kỳ đánh giá</TableHead>
                                <TableHead>Ngày nộp ĐK</TableHead>
                                <TableHead>Tiến độ</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(assessments.filter(a => a.communeId === currentUser?.communeId) || []).length > 0 ? (assessments.filter(a => a.communeId === currentUser?.communeId) || []).map(assessment => {
                                if (!assessment) return null;

                                const statusMap: { [key: string]: { text: string; icon: React.ComponentType<any>; badge: "default" | "secondary" | "destructive", className?: string } } = {
                                    'achieved_standard': { text: 'Đạt chuẩn', icon: Award, badge: 'default', className: 'bg-emerald-600' },
                                    'pending_review': { text: 'Chờ duyệt', icon: Clock, badge: 'secondary', className: 'bg-amber-500' },
                                    'returned_for_revision': { text: 'Yêu cầu Bổ sung', icon: Undo2, badge: 'destructive', className: 'bg-amber-600' },
                                    'rejected': { text: 'Không đạt', icon: XCircle, badge: 'destructive' },
                                    'draft': { text: 'Đang tự đánh giá', icon: Edit, badge: 'secondary' },
                                    'not_started': { text: 'ĐK đã duyệt', icon: UserCheck, badge: 'default', className: 'bg-blue-500' },
                                };

                                const getLink = () => {
                                    if (assessment.assessmentStatus === 'draft' || assessment.assessmentStatus === 'not_started' || assessment.assessmentStatus === 'returned_for_revision') {
                                        return '/commune/assessments';
                                    }
                                    return `/admin/reviews/${assessment.id}`;
                                }

                                const getButtonText = () => {
                                    if (assessment.assessmentStatus === 'returned_for_revision') return 'Giải trình & Gửi lại';
                                    if (assessment.assessmentStatus === 'draft' || assessment.assessmentStatus === 'not_started') return 'Tiếp tục chấm điểm';
                                    return 'Xem chi tiết kết quả';
                                }

                                const progress = calculateProgress(assessment.assessmentData, totalIndicators);
                                const showProgress = assessment.assessmentStatus === 'draft' || assessment.assessmentStatus === 'not_started';
                                const statusInfo = statusMap[assessment.assessmentStatus] || { text: 'Không rõ', icon: Eye, badge: 'secondary' };

                                return (
                                    <TableRow key={assessment.id}>
                                        <TableCell className="font-medium">{getPeriodName(assessment.assessmentPeriodId)}</TableCell>
                                        <TableCell>{assessment.registrationSubmissionDate || 'Chưa nộp'}</TableCell>
                                        <TableCell>
                                            {showProgress ? (
                                                <div className="flex items-center gap-2">
                                                    <Progress value={progress} className="w-[80px] h-2" />
                                                    <span className="text-xs text-muted-foreground">{progress}%</span>
                                                </div>
                                            ) : (
                                                <Badge variant={statusInfo.badge} className={`${statusInfo.className} text-white`}>
                                                    <statusInfo.icon className="mr-2 h-3 w-3" />
                                                    {statusInfo.text}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10 hover:text-primary">
                                                <Link href={getLink()}>
                                                    <Eye className="mr-2 h-4 w-4" />{getButtonText()}
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Chưa có hồ sơ đánh giá nào.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};


export default function DashboardPage() {
    const { role } = useData();

    return (
        <div className="flex flex-1 flex-col gap-4">
            {role === 'admin' ? <AdminDashboard /> : <CommuneDashboard />}
        </div>
    );
}
