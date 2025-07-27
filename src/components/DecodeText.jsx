import { useState, useEffect } from "react";

function DecodeText({ text, speed = 300, jumpHeight = 40 }) {
  const [displayed, setDisplayed] = useState("");
  const [bouncingIndex, setBouncingIndex] = useState(-1);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (animationComplete) return;

    let currentIndex = 0;
    const nonSpaceChars = text.split("").filter((char) => char !== " ");
    let charIndex = 0;

    const interval = setInterval(() => {
      if (charIndex >= nonSpaceChars.length) {
        setAnimationComplete(true);
        return;
      }

      // Find the next non-space character index in the original text
      let foundIndex = -1;
      let count = 0;
      for (let i = 0; i < text.length; i++) {
        if (text[i] !== " ") {
          if (count === charIndex) {
            foundIndex = i;
            break;
          }
          count++;
        }
      }

      // Start bounce
      setBouncingIndex(foundIndex);

      // End bounce after 98% of the speed (hold very long)
      setTimeout(() => {
        setBouncingIndex(-1);
      }, speed * 0.98);

      charIndex++;
    }, speed);

    return () => clearInterval(interval);
  }, [speed, text.length, animationComplete, text]);

  useEffect(() => {
    setDisplayed(text);
    setBouncingIndex(-1);
    setAnimationComplete(false);
  }, [text]);

  return (
    <span className="font-bold font-mono text-9xl tracking-wider">
      {displayed.split("").map((char, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-200 ease-out"
          style={{
            transform:
              bouncingIndex === index
                ? `translateY(-${jumpHeight}px)`
                : "translateY(0)",
            textShadow:
              bouncingIndex === index
                ? `0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)`
                : "none",
            display: char === " " ? "inline" : "inline-block",
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export default DecodeText;
