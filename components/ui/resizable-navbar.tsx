"use client";

import { IconMenu2, IconX } from "@tabler/icons-react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import Link from "next/link";
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type VisibleChild = ReactElement<{ visible?: boolean }>;

interface NavbarProps {
  children: ReactNode;
  className?: string;
}

interface NavBodyProps {
  children: ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavItemsProps {
  items: { name: string; link: string }[];
  className?: string;
  onItemClick?: () => void;
}

interface MobileNavProps {
  children: ReactNode;
  className?: string;
  visible?: boolean;
}

interface MobileNavHeaderProps {
  children: ReactNode;
  className?: string;
}

interface MobileNavMenuProps {
  children: ReactNode;
  className?: string;
  isOpen: boolean;
}

export function Navbar({ children, className }: NavbarProps) {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 24);
  });

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-50 w-full overflow-x-clip px-3 pt-3 sm:px-4 sm:pt-4",
        className
      )}
    >
      {Children.map(children, (child) =>
        isValidElement(child)
          ? cloneElement(child as VisibleChild, { visible })
          : child
      )}
    </div>
  );
}

export function NavBody({ children, className, visible }: NavBodyProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(14px)" : "blur(10px)",
        boxShadow: visible
          ? "0 8px 30px -12px rgb(0 0 0 / 0.22)"
          : "0 8px 30px -12px rgb(0 0 0 / 0.12)",
      }}
      className={cn(
        "relative z-[60] mx-auto hidden h-14 w-full max-w-[1200px] flex-row items-center justify-between rounded-full border border-border/60 bg-card/80 px-3 py-2 backdrop-blur-xl lg:flex sm:px-4",
        visible && "border-border/80 bg-card/92",
        className
      )}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
    >
      {children}
    </motion.div>
  );
}

export function NavItems({ items, className, onItemClick }: NavItemsProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      className={cn(
        "absolute inset-0 hidden flex-1 flex-row items-center justify-center gap-1 text-sm font-medium lg:flex",
        className
      )}
      onMouseLeave={() => setHovered(null)}
    >
      {items.map((item, idx) => (
        <Link
          className="relative px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
          href={item.link}
          key={item.link}
          onClick={onItemClick}
          onMouseEnter={() => setHovered(idx)}
        >
          {hovered === idx ? (
            <motion.span
              className="absolute inset-0 rounded-full bg-muted/80 dark:bg-muted/50"
              layoutId="nav-hover-pill"
            />
          ) : null}
          <span className="relative z-10 text-xs font-medium">{item.name}</span>
        </Link>
      ))}
    </motion.div>
  );
}

export function MobileNav({ children, className, visible }: MobileNavProps) {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(14px)" : "blur(10px)",
        boxShadow: visible
          ? "0 8px 30px -12px rgb(0 0 0 / 0.18)"
          : "0 8px 30px -12px rgb(0 0 0 / 0.12)",
      }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-[calc(100vw-1.5rem)] flex-col rounded-full border border-border/60 bg-card/85 px-3 py-2 backdrop-blur-xl lg:hidden",
        visible && "border-border/80 bg-card/92",
        className
      )}
      transition={{ type: "spring", stiffness: 260, damping: 32 }}
    >
      {children}
    </motion.div>
  );
}

export function MobileNavHeader({
  children,
  className,
}: MobileNavHeaderProps) {
  return (
    <div
      className={cn("flex w-full flex-row items-center justify-between", className)}
    >
      {children}
    </div>
  );
}

export function MobileNavMenu({
  children,
  className,
  isOpen,
}: MobileNavMenuProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 flex w-full flex-col items-start gap-3 rounded-2xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur-xl",
            className
          )}
          exit={{ opacity: 0, y: -8 }}
          initial={{ opacity: 0, y: -8 }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function MobileNavToggle({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="inline-flex size-9 items-center justify-center rounded-full text-foreground"
      onClick={onClick}
      type="button"
    >
      {isOpen ? <IconX className="size-5" /> : <IconMenu2 className="size-5" />}
    </button>
  );
}

export function NavbarButton({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string;
  as?: "a" | "button";
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "dark" | "gradient";
} & React.ComponentPropsWithoutRef<"a"> &
  React.ComponentPropsWithoutRef<"button">) {
  const variantStyles = {
    primary:
      "bg-[#4285f4] text-white shadow-sm hover:opacity-95 dark:bg-[#8ab4f8] dark:text-[#131314]",
    secondary:
      "border border-border/60 bg-transparent text-foreground shadow-none hover:bg-muted/50",
    dark: "bg-foreground text-background shadow-sm",
    gradient:
      "bg-gradient-to-b from-[#4285f4] to-[#1a56db] text-white shadow-sm dark:from-[#8ab4f8] dark:to-[#4285f4] dark:text-[#131314]",
  };

  const classes = cn(
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5",
    variantStyles[variant],
    className
  );

  if (Tag === "button") {
    return (
      <button className={classes} type="button" {...props}>
        {children}
      </button>
    );
  }

  return (
    <Link className={classes} href={href ?? "#"} {...props}>
      {children}
    </Link>
  );
}
