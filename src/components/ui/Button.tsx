"use client";

import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "gradient";
    size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
        const baseStyles =
            "inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden";

        const variants = {
            primary:
                "bg-brand-blue text-white hover:bg-brand-blue-light shadow-md shadow-brand-blue/20",
            secondary:
                "bg-brand-orange text-white hover:bg-brand-orange-light shadow-md shadow-brand-orange/20",
            outline:
                "border-2 border-brand-blue text-brand-blue hover:bg-brand-blue/5 :bg-brand-orange/10",
            ghost:
                "text-brand-blue hover:bg-brand-blue/10 :bg-brand-orange/10",
            gradient:
                "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all border border-orange-400/50",
        };

        const sizes = {
            sm: "h-9 px-4 text-sm",
            md: "h-11 px-6 text-base",
            lg: "h-14 px-8 text-lg",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                <span className="relative z-10 flex items-center gap-2">{children as React.ReactNode}</span>
            </motion.button>
        );
    }
);

Button.displayName = "Button";
