import React from 'react';
import { cn } from '@/lib/utils';

export const AuthButton = ({ 
  children, 
  variant = 'primary', 
  className,
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' }) => {
  return (
    <button 
      className={cn(
        "w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95",
        variant === 'primary' && "bg-[#EEFF00] text-black hover:shadow-[0_0_20px_rgba(238,255,0,0.4)]",
        variant === 'secondary' && "bg-white/10 text-white hover:bg-white/20",
        variant === 'outline' && "bg-transparent border border-white/20 text-white hover:border-[#EEFF00] hover:text-[#EEFF00]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const AuthInput = ({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => {
  return (
    <div className="space-y-2 group">
      <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black ml-1 group-focus-within:text-[#EEFF00] transition-colors">
        {label}
      </label>
      <input 
        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 outline-none focus:border-[#EEFF00] focus:bg-white/[0.08] transition-all"
        {...props}
      />
    </div>
  );
};

export const SocialButton = ({ icon, label, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon: string, label: string }) => {
  return (
    <button 
      className={cn(
        "flex items-center justify-center space-x-4 w-full py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all",
        className
      )}
      {...props}
    >
      <img src={icon} alt="" className="w-5 h-5 object-contain" />
      <span className="font-bold text-xs uppercase tracking-widest text-white/60">{label}</span>
    </button>
  );
};
