import ProjectImage from "./ProjectImage";
import ProjectVideo from "./ProjectVideo";

function ProjectCarousel({ folderName, media }) {
  return (
    <>
      <div className="max-h-screen overflow-y-auto px-6">
        <div className="flex flex-col space-y-6">
          {media.map((filename, index) => {
            const extension = filename.split(".").pop();
            const isVideo = ["mp4", "mov", "webm"].includes(extension);

            return isVideo ? (
              <ProjectVideo
                key={`projects/${folderName}/${filename}`}
                src={`projects/${folderName}/${filename}`}
                type={`video/${extension}`}
              />
            ) : (
              <ProjectImage
                key={`projects/${folderName}/${filename}`}
                src={`projects/${folderName}/${filename}`}
                alt={`${filename}`}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ProjectCarousel;
