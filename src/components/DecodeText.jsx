import { useState, useEffect } from "react";

function DecodeText({ text, speed = 300, jumpHeight = 40 }) {
  const [triggeredIndices, setTriggeredIndices] = useState(() => new Set());

  useEffect(() => {
    setTriggeredIndices(new Set());

    const nonSpaceIndices = [];
    for (let i = 0; i < text.length; i++) {
      if (text[i] !== " ") nonSpaceIndices.push(i);
    }

    let step = 0;
    const interval = setInterval(() => {
      if (step >= nonSpaceIndices.length) {
        clearInterval(interval);
        return;
      }
      const idx = nonSpaceIndices[step];
      setTriggeredIndices((prev) => new Set(prev).add(idx));
      step++;
    }, speed);

    return () => clearInterval(interval);
  }, [speed, text]);

  return (
    <div
      className="font-bold font-mono text-8xl sm:text-8xl md:text-9xl lg:text-9xl xl:text-9xl tracking-wider"
      style={{ "--jump-height": `${jumpHeight}px` }}
    >
      <div className="flex flex-col lg:flex-row">
        {text.split(" ").map((word, wordIndex) => (
          <div key={wordIndex} className="inline-flex">
            {word.split("").map((char, charIndex) => {
              if (char === " ") return <span key={charIndex}>&nbsp;</span>;
              const actualIndex =
                text.split(" ").slice(0, wordIndex).join(" ").length +
                (wordIndex > 0 ? 1 : 0) +
                charIndex;
              // A stable key + a class that only ever turns on (never back
              // off) lets the CSS animation play once, uninterrupted, even
              // as the reveal interval moves on to the next letter.
              const isTriggered = triggeredIndices.has(actualIndex);
              return (
                <span
                  key={charIndex}
                  className={`inline-block ${isTriggered ? "char-glide" : ""}`}
                >
                  {char}
                </span>
              );
            })}
            {wordIndex < text.split(" ").length - 1 && (
              <span className="hidden lg:inline">&nbsp;</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DecodeText;
