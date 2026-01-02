
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useData } from '@/context/DataContext';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/layout/page-header';
import type { LoginConfig } from '@/lib/data';
// FIXME: Firebase storage removed - needs MinIO refactoring
// import { getDownloadURL, ref, uploadBytes, listAll, deleteObject, StorageReference } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
// Unused UI components removed




function ImagePicker({ triggerButton, onSelect, storagePath }: { triggerButton: React.ReactNode, onSelect: (url: string) => void, storagePath: string }) {
    const { toast } = useToast();

    // Firebase storage is removed, so we disable the picker for now.
    const handleClick = () => {
        toast({ title: 'Thông báo', description: 'Tính năng tải ảnh đang tạm khóa. Hệ thống đang sử dụng ảnh mặc định từ thư mục Config.' });
    };

    return (
        <div onClick={handleClick}>
            {triggerButton}
        </div>
    )
}


export default function LoginConfigPage() {
    const { loginConfig, updateLoginConfig, storage } = useData();
    const { toast } = useToast();

    const [config, setConfig] = useState<Partial<LoginConfig>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const DEFAULT_CONFIG = {
        primaryLogoUrl: '/config/logo/BoTuPhap1.png',
        secondaryLogoUrl: '/config/logo_secondary/Logo_tỉnh_An_Giang.svg',
        backgroundImageUrl: '/config/background/aPix-image-15.jpg',
    };

    useEffect(() => {
        if (loginConfig) {
            const cleanConfig = { ...loginConfig };

            if (cleanConfig.primaryLogoUrl?.includes('firebasestorage')) cleanConfig.primaryLogoUrl = DEFAULT_CONFIG.primaryLogoUrl;
            if (cleanConfig.secondaryLogoUrl?.includes('firebasestorage')) cleanConfig.secondaryLogoUrl = DEFAULT_CONFIG.secondaryLogoUrl;
            if (cleanConfig.backgroundImageUrl?.includes('firebasestorage')) cleanConfig.backgroundImageUrl = DEFAULT_CONFIG.backgroundImageUrl;

            setConfig({
                ...cleanConfig,
                primaryLogoUrl: cleanConfig.primaryLogoUrl || DEFAULT_CONFIG.primaryLogoUrl,
                secondaryLogoUrl: cleanConfig.secondaryLogoUrl || DEFAULT_CONFIG.secondaryLogoUrl,
                backgroundImageUrl: cleanConfig.backgroundImageUrl || DEFAULT_CONFIG.backgroundImageUrl,
            });
        }
    }, [loginConfig]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setConfig(prev => ({ ...prev, [id]: value ? Number(value) : undefined }));
    }

    const handleImageSelect = (field: 'primaryLogoUrl' | 'secondaryLogoUrl' | 'backgroundImageUrl') => (url: string) => {
        setConfig(prev => ({ ...prev, [field]: url }));
    }

    const handleSave = async () => {
        setIsSubmitting(true);


        try {
            await updateLoginConfig(config as LoginConfig);
            toast({ title: 'Thành công!', description: 'Đã lưu cấu hình trang đăng nhập.' });
        } catch (error: any) {
            console.error("Error saving login config:", error);
            toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể lưu cấu hình.' });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <PageHeader title="Cấu hình trang đăng nhập" description="Tùy chỉnh giao diện của trang đăng nhập cho toàn hệ thống." />

            <div className="grid gap-6 md:grid-cols-2">

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Logo</CardTitle>
                        <CardDescription>Tải lên logo chính (Bộ Tư pháp) và logo phụ (Tỉnh An Giang), điều chỉnh kích thước hiển thị.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Primary Logo */}
                            <div className="grid gap-4">
                                <Label className='font-semibold'>Logo chính</Label>
                                <div className='mt-2 p-4 border rounded-md min-h-[124px] flex justify-center items-center bg-muted'>
                                    {config.primaryLogoUrl ? (
                                        <Image src={config.primaryLogoUrl} alt="logo" width={config.primaryLogoWidth || 100} height={config.primaryLogoHeight || 100} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Chưa có logo chính</p>
                                    )}
                                </div>
                                <ImagePicker
                                    triggerButton={<Button variant="outline" className="mt-2">Thay đổi Logo chính</Button>}
                                    onSelect={handleImageSelect('primaryLogoUrl')}
                                    storagePath="config/logo"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="primaryLogoWidth">Chiều rộng (px)</Label>
                                        <Input id="primaryLogoWidth" type="number" value={config.primaryLogoWidth || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="primaryLogoHeight">Chiều cao (px)</Label>
                                        <Input id="primaryLogoHeight" type="number" value={config.primaryLogoHeight || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                            {/* Secondary Logo */}
                            <div className="grid gap-4">
                                <Label className='font-semibold'>Logo phụ</Label>
                                <div className='mt-2 p-4 border rounded-md min-h-[124px] flex justify-center items-center bg-muted'>
                                    {config.secondaryLogoUrl ? (
                                        <Image src={config.secondaryLogoUrl} alt="logo" width={config.secondaryLogoWidth || 100} height={config.secondaryLogoHeight || 100} />
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Chưa có logo phụ</p>
                                    )}
                                </div>
                                <ImagePicker
                                    triggerButton={<Button variant="outline" className="mt-2">Thay đổi Logo phụ</Button>}
                                    onSelect={handleImageSelect('secondaryLogoUrl')}
                                    storagePath="config/logo_secondary"
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="secondaryLogoWidth">Chiều rộng (px)</Label>
                                        <Input id="secondaryLogoWidth" type="number" value={config.secondaryLogoWidth || ''} onChange={handleInputChange} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="secondaryLogoHeight">Chiều cao (px)</Label>
                                        <Input id="secondaryLogoHeight" type="number" value={config.secondaryLogoHeight || ''} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Ảnh nền</CardTitle>
                        <CardDescription>Tải lên hoặc chọn ảnh nền sẽ hiển thị toàn trang.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label>Ảnh nền hiện tại</Label>
                            <div className='mt-2 p-4 border rounded-md flex justify-center items-center bg-muted min-h-[208px]'>
                                {config.backgroundImageUrl ? (
                                    <div className='relative w-full h-48'>
                                        <Image src={config.backgroundImageUrl} alt="background" fill objectFit='contain' />
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Chưa có ảnh nền</p>
                                )}
                            </div>
                            <ImagePicker
                                triggerButton={<Button variant="outline" className="mt-2">Thay đổi Ảnh nền</Button>}
                                onSelect={handleImageSelect('backgroundImageUrl')}
                                storagePath="config/background"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="md:col-span-2 flex justify-end">
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lưu thay đổi
                    </Button>
                </div>
            </div>
        </>
    );
}


