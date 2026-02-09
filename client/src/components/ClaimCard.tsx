import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClaimCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  noPadding?: boolean;
}

export function ClaimCard({ children, className, title, description, noPadding }: ClaimCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "w-full max-w-sm sm:max-w-md mx-auto bg-card rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-border/50",
        className
      )}
    >
      {(title || description) && (
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 text-center">
          {title && <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {noPadding ? children : (
        <div className="px-5 sm:px-8 pb-6 sm:pb-8">
          {children}
        </div>
      )}
    </motion.div>
  );
}
