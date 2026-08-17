import React, { useState } from "react";

function ProjectImage({ src, alt }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="w-full relative bg-[var(--bg-tertiary)]"
      style={{ paddingTop: "56.25%" }} // 16:9 aspect ratio placeholder
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          loaded ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
    </div>
  );
}

export default ProjectImage;
