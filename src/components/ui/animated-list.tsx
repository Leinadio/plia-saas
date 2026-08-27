"use client";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
  type MotionProps,
} from "motion/react";

import { cn } from "@/lib/utils";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion();
  const animations: MotionProps = {
    initial: reducedMotion ? { opacity: 1 } : { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: reducedMotion ? { opacity: 0 } : { scale: 0, opacity: 0 },
    transition: reducedMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  delay?: number;
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, ...props }: AnimatedListProps) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const isInView = useInView(listRef, { once: true, amount: 0.35 });
    const reducedMotion = useReducedMotion();
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    useEffect(() => {
      let timeout: ReturnType<typeof setTimeout> | null = null;

      if (!reducedMotion && isInView && index < childrenArray.length - 1) {
        timeout = setTimeout(() => {
          setIndex((previousIndex) =>
            (previousIndex + 1) % childrenArray.length,
          );
        }, delay);
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
      };
    }, [index, delay, childrenArray.length, isInView, reducedMotion]);

    const visibleIndex = reducedMotion ? childrenArray.length - 1 : index;
    const itemsToShow = useMemo(
      () => childrenArray.slice(0, visibleIndex + 1).reverse(),
      [visibleIndex, childrenArray],
    );

    return (
      <div
        ref={listRef}
        className={cn("flex flex-col items-center gap-4", className)}
        {...props}
      >
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={(item as React.ReactElement).key}>
              {item}
            </AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  },
);

AnimatedList.displayName = "AnimatedList";
