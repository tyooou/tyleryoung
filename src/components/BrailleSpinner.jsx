import { useState, useEffect } from "react";

function BrailleSpinner() {
  const frames = [
    "\u280B", // ⠋
    "\u2819", // ⠙
    "\u2839", // ⠹
    "\u2838", // ⠸
    "\u283C", // ⠼
    "\u2834", // ⠴
    "\u2826", // ⠦
    "\u2827", // ⠧
    "\u2807", // ⠇
    "\u280F", // ⠏
  ];
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(interval);
  }, []);
  return <p>{frames[frame]}</p>;
}

export default BrailleSpinner;
