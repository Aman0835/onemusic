import { useRef, useState, useEffect } from "react";

export function useScrollGrab() {
  const ref = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false, startX, scrollLeft;

    const end = () => {
      isDown = false;
      el.classList.remove("cursor-grabbing");
      setTimeout(() => setIsDragging(false), 50);
    };

    const onDown = (e) => {
      isDown = true;
      setIsDragging(false);
      el.classList.add("cursor-grabbing");
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const onMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const walk = (e.pageX - el.offsetLeft - startX) * 0.5;
      if (Math.abs(walk) > 5) setIsDragging(true);
      el.scrollLeft = scrollLeft - walk;
    };

    el.addEventListener("mousedown", onDown);
    el.addEventListener("mouseleave", end);
    el.addEventListener("mouseup", end);
    el.addEventListener("mousemove", onMove);

    return () => {
      el.removeEventListener("mousedown", onDown);
      el.removeEventListener("mouseleave", end);
      el.removeEventListener("mouseup", end);
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  return { ref, isDragging };
}
