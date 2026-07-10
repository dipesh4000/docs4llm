"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const pos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const trailPos = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const hovering = useRef(false);
  const clicking = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) {
      return;
    }

    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) {
        dotRef.current.style.left = `${e.clientX}px`;
        dotRef.current.style.top = `${e.clientY}px`;
      }
    };

    const lerp = () => {
      ringPos.current.x += (pos.current.x - ringPos.current.x) * 0.18;
      ringPos.current.y += (pos.current.y - ringPos.current.y) * 0.18;
      trailPos.current.x += (pos.current.x - trailPos.current.x) * 0.08;
      trailPos.current.y += (pos.current.y - trailPos.current.y) * 0.08;

      if (ringRef.current) {
        ringRef.current.style.left = `${ringPos.current.x}px`;
        ringRef.current.style.top = `${ringPos.current.y}px`;
      }
      if (trailRef.current) {
        trailRef.current.style.left = `${trailPos.current.x}px`;
        trailRef.current.style.top = `${trailPos.current.y}px`;
      }
      raf.current = requestAnimationFrame(lerp);
    };

    const setHover = (next: boolean) => {
      if (next === hovering.current) {
        return;
      }
      hovering.current = next;
      dotRef.current?.classList.toggle("is-hovering", next);
      ringRef.current?.classList.toggle("is-hovering", next);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) {
        return;
      }
      const interactive = target.closest(
        "a, button, input, textarea, select, [role='button'], label"
      );
      setHover(Boolean(interactive));
    };

    const onDown = () => {
      clicking.current = true;
      dotRef.current?.classList.add("is-clicking");
      ringRef.current?.classList.add("is-hovering");
    };

    const onUp = () => {
      clicking.current = false;
      dotRef.current?.classList.remove("is-clicking");
      if (!hovering.current) {
        ringRef.current?.classList.remove("is-hovering");
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    raf.current = requestAnimationFrame(lerp);

    return () => {
      document.documentElement.classList.remove("has-custom-cursor");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="custom-cursor-trail"
        ref={trailRef}
      />
      <div
        aria-hidden="true"
        className="custom-cursor-ring"
        ref={ringRef}
      />
      <div aria-hidden="true" className="custom-cursor-dot" ref={dotRef} />
    </>
  );
}
