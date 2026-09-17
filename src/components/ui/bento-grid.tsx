import {
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";

// Adapted from Magic UI: https://magicui.design/docs/components/bento-grid
interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  background: ReactNode;
  Icon?: ElementType;
  description: string;
  href?: string;
  cta?: string;
}

function BentoGrid({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
  ...props
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl border bg-background",
        className,
      )}
      {...props}
    >
      <div data-bento-media>{background}</div>
      <div data-bento-content className="relative z-10 flex flex-col gap-2 p-6">
        {Icon && <Icon aria-hidden className="h-8 w-8" />}
        <h3 className="text-xl font-semibold">{name}</h3>
        <p className="text-muted-foreground">{description}</p>
        {href && cta && (
          <a
            href={href}
            className="mt-2 inline-flex min-h-11 items-center gap-2 font-medium"
          >
            {cta}
            <ArrowRightIcon aria-hidden />
          </a>
        )}
        {children}
      </div>
    </div>
  );
}

export { BentoCard, BentoGrid };
