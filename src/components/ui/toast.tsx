"use client"

import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-2xl border p-4 pr-10 shadow-2xl transition-all duration-300 ease-out data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full backdrop-blur-md",
  {
    variants: {
      variant: {
        default: "border-slate-200/50 bg-white/95 text-slate-900 shadow-slate-200/50",
        destructive: "border-red-200/50 bg-gradient-to-r from-red-50/95 to-red-100/95 text-red-900 shadow-red-200/50",
        success: "border-green-200/50 bg-gradient-to-r from-green-50/95 to-green-100/95 text-green-900 shadow-green-200/50",
        warning: "border-amber-200/50 bg-gradient-to-r from-amber-50/95 to-amber-100/95 text-amber-900 shadow-amber-200/50",
        info: "border-blue-200/50 bg-gradient-to-r from-blue-50/95 to-blue-100/95 text-blue-900 shadow-blue-200/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Progress bar component for toast countdown
const ToastProgress = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { duration?: number; variant?: string }
>(({ className, duration = 3000, variant = "default", ...props }, ref) => {
  const progressColors: Record<string, string> = {
    default: "bg-gradient-to-r from-slate-400 to-slate-500",
    destructive: "bg-gradient-to-r from-red-400 to-red-500",
    success: "bg-gradient-to-r from-green-400 to-green-500",
    warning: "bg-gradient-to-r from-amber-400 to-amber-500",
    info: "bg-gradient-to-r from-blue-400 to-blue-500",
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-2xl bg-black/5",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full origin-left animate-toast-progress",
          progressColors[variant] || progressColors.default
        )}
        style={{
          animationDuration: `${duration}ms`,
        }}
      />
    </div>
  )
})
ToastProgress.displayName = "ToastProgress"

// Icon component for toast variants
const ToastIcon = ({ variant }: { variant?: string }) => {
  const iconClasses = "w-5 h-5 flex-shrink-0"

  switch (variant) {
    case "destructive":
      return <XCircle className={cn(iconClasses, "text-red-500")} />
    case "success":
      return <CheckCircle2 className={cn(iconClasses, "text-green-500")} />
    case "warning":
      return <AlertTriangle className={cn(iconClasses, "text-amber-500")} />
    case "info":
      return <Info className={cn(iconClasses, "text-blue-500")} />
    default:
      return <Info className={cn(iconClasses, "text-slate-500")} />
  }
}

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
  VariantProps<typeof toastVariants> & { showProgress?: boolean; progressDuration?: number }
>(({ className, variant, showProgress = true, progressDuration = 3000, children, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      duration={progressDuration}
      {...props}
    >
      {children}
      {showProgress && <ToastProgress duration={progressDuration} variant={variant || "default"} />}
    </ToastPrimitives.Root>
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-xl border bg-white/50 px-3 text-sm font-medium ring-offset-background transition-all hover:bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-3 top-3 rounded-full p-1.5 text-slate-400 opacity-70 transition-all hover:opacity-100 hover:bg-black/5 hover:text-slate-600 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-slate-400/50 group-[.destructive]:text-red-400 group-[.destructive]:hover:text-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold leading-tight", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-80 leading-relaxed", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ToastProgress,
  ToastIcon,
}
