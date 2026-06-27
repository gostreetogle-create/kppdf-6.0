import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

const typographyVariants = cva('', {
  variants: {
    variant: {
      h1: 'scroll-m-20 text-3xl font-bold tracking-tight lg:text-4xl',
      h2: 'scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0',
      h3: 'scroll-m-20 text-xl font-semibold tracking-tight',
      h4: 'scroll-m-20 text-lg font-semibold tracking-tight',
      p: 'leading-7 [&:not(:first-child)]:mt-4',
      lead: 'text-lg text-muted-foreground',
      large: 'text-lg font-semibold',
      small: 'text-sm font-medium leading-none',
      muted: 'text-sm text-muted-foreground',
      code: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
      blockquote: 'mt-6 border-l-2 border-border pl-6 italic text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'p',
  },
});

type AllowedTags = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'small' | 'code' | 'blockquote' | 'div';

const tagMap: Record<string, AllowedTags> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  p: 'p',
  lead: 'p',
  large: 'div',
  small: 'small',
  muted: 'p',
  code: 'code',
  blockquote: 'blockquote',
};

type TypographyPropsBase = VariantProps<typeof typographyVariants> & {
  asChild?: boolean;
  as?: AllowedTags;
  className?: string;
  children?: React.ReactNode;
};

export const Typography = forwardRef<HTMLElement, TypographyPropsBase>(
  ({ variant = 'p', asChild, as, className, children, ...props }, ref) => {
    const tag = as || tagMap[variant || 'p'] || 'p';
    const Comp = asChild ? Slot : tag;

    return (
      <Comp ref={ref as never} className={cn(typographyVariants({ variant }), className)} {...props}>
        {children}
      </Comp>
    );
  },
);
Typography.displayName = 'Typography';

export type TypographyProps = TypographyPropsBase;

const variantProps = (props: Omit<TypographyPropsBase, 'variant'>) => props;

export const H1 = forwardRef<HTMLHeadingElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="h1" {...variantProps(p)} />);
H1.displayName = 'H1';
export const H2 = forwardRef<HTMLHeadingElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="h2" {...variantProps(p)} />);
H2.displayName = 'H2';
export const H3 = forwardRef<HTMLHeadingElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="h3" {...variantProps(p)} />);
H3.displayName = 'H3';
export const H4 = forwardRef<HTMLHeadingElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="h4" {...variantProps(p)} />);
H4.displayName = 'H4';
export const P = forwardRef<HTMLParagraphElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="p" {...variantProps(p)} />);
P.displayName = 'P';
export const Lead = forwardRef<HTMLParagraphElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="lead" {...variantProps(p)} />);
Lead.displayName = 'Lead';
export const Large = forwardRef<HTMLDivElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="large" {...variantProps(p)} />);
Large.displayName = 'Large';
export const Small = forwardRef<HTMLElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="small" {...variantProps(p)} />);
Small.displayName = 'Small';
export const Muted = forwardRef<HTMLParagraphElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="muted" {...variantProps(p)} />);
Muted.displayName = 'Muted';
export const Code = forwardRef<HTMLElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="code" {...variantProps(p)} />);
Code.displayName = 'Code';
export const Blockquote = forwardRef<HTMLQuoteElement, Omit<TypographyPropsBase, 'variant'>>((p, r) => <Typography ref={r} variant="blockquote" {...variantProps(p)} />);
Blockquote.displayName = 'Blockquote';
