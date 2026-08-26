"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Ação principal: amarelo-pista com tinta escura por cima. Nunca branco sobre amarelo.
        primaria:
          "bg-pista text-noite hover:bg-[#ffc82e] active:bg-[#dda600] font-semibold",
        taxiway: "bg-taxiway text-white hover:bg-taxiway-claro",
        contorno:
          "border border-linha-forte bg-papel text-noite hover:bg-nevoa",
        fantasma: "text-tinta-2 hover:bg-nevoa hover:text-noite",
        perigo: "bg-lacre text-white hover:bg-[#8f2530]",
        escura: "bg-noite-2 text-nevoa hover:bg-[#1d3050]",
      },
      tamanho: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px]",
        icone: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "contorno", tamanho: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, tamanho, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, tamanho }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
