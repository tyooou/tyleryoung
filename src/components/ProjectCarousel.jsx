import { useState } from "react";

function ProjectCarousel({ folderName, media }) {
  return (
    <>
      <div className="max-h-screen overflow-y-auto px-6 py-6">
        <div className="flex flex-col space-y-6">
          {media.map((filename, index) => {
            const extension = filename.split(".").pop();
            const isVideo = ["mp4", "mov", "webm"].includes(extension);

            return isVideo ? (
              <video key={index} autoPlay className="w-full h-auto">
                <source
                  src={`projects/${folderName}/${filename}`}
                  type={`video/${extension}`}
                />
              </video>
            ) : (
              <img
                key={index}
                src={`projects/${folderName}/${filename}`}
                alt={`${filename}`}
                className="w-full h-auto"
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ProjectCarousel;
