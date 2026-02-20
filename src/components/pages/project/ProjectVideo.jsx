import React, { useState } from "react";

function ProjectVideo({ src, type }) {
  const [loaded, setLoaded] = useState(false);
  const videoSrc = import.meta.env.BASE_URL + src;

  return (
    <div
      className="w-full relative bg-[var(--bg-tertiary)]"
      style={{ paddingTop: "56.25%" }} // 16:9 aspect ratio placeholder
    >
      <video
        src={videoSrc}
        type={type}
        autoPlay
        preload="auto"
        muted
        loop
        playsInline
        onLoadedData={() => setLoaded(true)}
        className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
          loaded ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      />
    </div>
  );
}

export default ProjectVideo;
