
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function LoginPageContent() {
  const { setLoginInfo, loading, currentUser, loginConfig } = useData();
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (!loading && currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, loading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await setLoginInfo(email, password);
    if (success) {
      // The useEffect above will handle the redirect
    } else {
      toast({
        variant: 'destructive',
        title: "Đăng nhập thất bại",
        description: "Email hoặc mật khẩu không chính xác.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const {
    backgroundImageUrl,
    primaryLogoUrl = "/logo.png",
    primaryLogoWidth = 100,
    primaryLogoHeight = 100,
    secondaryLogoUrl = "https://firebasestorage.googleapis.com/v0/b/chuan-tiep-can-pl.firebasestorage.app/o/config%2Flogo_secondary%2FLogo_t%E1%BB%89nh_An_Giang.svg?alt=media&token=77aa4898-eb83-46fc-95ce-fa1f34c81eec",
    secondaryLogoWidth = 160,
    secondaryLogoHeight = 160,
  } = loginConfig || {};


  return (

    <div className="relative h-screen w-full overflow-hidden font-[family-name:var(--font-outfit)]">
      {/* Background Image - Tràn màn hình */}
      {backgroundImageUrl && (
        <Image
          src={backgroundImageUrl}
          alt="Background"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
          data-ai-hint="login background"
        />
      )}

      {/* Main Content Wrapper - Flex Column Layout to prevent overlap */}
      <div className="absolute inset-0 z-10 flex flex-col w-full h-full pointer-events-none">

        {/* Header Section - Top Part */}
        {/* Added standalone gradient overlay for better text contrast if needed, or keep it on the header container */}
        <div className="w-full bg-gradient-to-b from-black/80 to-transparent pt-8 pb-8 flex flex-col items-center text-center space-y-4 px-4 shrink-0 transition-all duration-300 ease-in-out">

          {/* Logo Tỉnh An Giang */}
          <div className="relative filter drop-shadow-lg" style={{ width: 80, height: 80 }}>
            <Image
              src={secondaryLogoUrl}
              alt="Logo Tỉnh An Giang"
              layout="fill"
              objectFit="contain"
              className="object-contain"
              priority
            />
          </div>

          {/* Dòng chữ HỆ THỐNG */}
          <p className="text-white/90 font-medium text-sm md:text-base uppercase tracking-[0.3em] drop-shadow-md">
            HỆ THỐNG
          </p>

          {/* Tiêu đề */}
          <div className="flex flex-col items-center space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center line-clamp-2">
              ĐÁNH GIÁ CHUẨN TIẾP CẬN PHÁP LUẬT
            </h1>
            <h2 className="text-xl md:text-3xl font-bold uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center">
              TỈNH AN GIANG
            </h2>
            {/* Badge */}
            <span className="inline-block px-4 py-1 mt-2 text-xs md:text-sm font-medium text-white bg-white/20 backdrop-blur-md border border-white/30 rounded-full shadow-lg">
              (Thử nghiệm V2)
            </span>
          </div>
        </div>

        {/* Login Card Container - Takes remaining space */}
        <div className="flex-1 flex items-center justify-center p-4 w-full min-h-0 pointer-events-auto">
          <Card className="w-full max-w-[420px] bg-white/90 backdrop-blur-xl shadow-2xl border-white/40 rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-500 my-auto">
            <CardHeader className="text-center space-y-4 pb-6 pt-8">
              <div className="flex justify-center items-center">
                <div className="relative w-20 h-20 md:w-24 md:h-24">
                  <Image
                    src={primaryLogoUrl}
                    alt="Logo Bộ Tư pháp"
                    layout="fill"
                    objectFit="contain"
                    className="object-contain drop-shadow-md"
                    data-ai-hint="application logo"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-extrabold uppercase text-[#d32f2f] tracking-wide font-[family-name:var(--font-be-vietnam-pro)]">
                  ĐĂNG NHẬP HỆ THỐNG
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  Nhập thông tin tài khoản của bạn để tiếp tục
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pb-8 px-8">
              <form onSubmit={handleLogin} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@angiang.gov.vn"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="bg-white/50 border-gray-200 focus:bg-white transition-all duration-200 h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-medium">Mật khẩu</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="bg-white/50 border-gray-200 focus:bg-white transition-all duration-200 h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-semibold shadow-lg mt-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-300" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Đăng nhập
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
