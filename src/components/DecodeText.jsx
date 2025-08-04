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
    <div className="font-bold font-mono text-8xl sm:text-8xl md:text-9xl lg:text-9xl xl:text-9xl tracking-wider">
      <div className="flex flex-col lg:flex-row">
        {displayed.split(" ").map((word, wordIndex) => (
          <div key={wordIndex} className="inline-flex">
            {word.split("").map((char, charIndex) => {
              if (char === " ") return <span key={charIndex}>&nbsp;</span>;
              const actualIndex =
                displayed.split(" ").slice(0, wordIndex).join(" ").length +
                (wordIndex > 0 ? 1 : 0) +
                charIndex;
              return (
                <span
                  key={actualIndex}
                  className="inline-block transition-all duration-200 ease-out"
                  style={{
                    transform:
                      bouncingIndex === actualIndex
                        ? `translateY(-${jumpHeight}px)`
                        : "translateY(0)",
                    textShadow:
                      bouncingIndex === actualIndex
                        ? `0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.4)`
                        : "none",
                  }}
                >
                  {char}
                </span>
              );
            })}
            {wordIndex < displayed.split(" ").length - 1 && (
              <span className="hidden lg:inline">&nbsp;</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DecodeText;
