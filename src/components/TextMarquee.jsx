import { useEffect, useRef } from "react";

function TextMarquee({ text }) {
  const marqueeRef = useRef(null);

  useEffect(() => {
    const marquee = marqueeRef.current;
    let start = 0;

    const scroll = () => {
      start -= 1;
      if (marquee) {
        marquee.style.transform = `translateX(${start}px)`;
        if (Math.abs(start) > marquee.scrollWidth / 2) {
          start = 0;
        }
      }
      requestAnimationFrame(scroll);
    };
    scroll();
  }, []);

  return (
    <div className="relative w-32 h-3 overflow-hidden text-gray-300 font-mono text-xs flex items-center">
      <div className="absolute left-0 top-0 w-10 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 w-10 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>
      <div
        className="whitespace-nowrap flex absolute animate-none"
        ref={marqueeRef}
      >
        <span className="px-2">{text}</span>
        <span className="px-2">{text}</span>
      </div>
    </div>
  );
}

export default TextMarquee;
