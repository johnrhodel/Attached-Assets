import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ClaimCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function ClaimCard({ children, className, title, description }: ClaimCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "w-full max-w-md mx-auto bg-card rounded-3xl overflow-hidden shadow-2xl border border-border/50",
        className
      )}
    >
      {(title || description) && (
        <div className="px-8 pt-8 pb-4 text-center">
          {title && <h2 className="text-3xl font-serif font-bold text-foreground mb-2">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="p-8">
        {children}
      </div>
    </motion.div>
  );
}
