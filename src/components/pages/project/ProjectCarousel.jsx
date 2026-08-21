import ProjectImage from "./ProjectImage";
import ProjectVideo from "./ProjectVideo";

function ProjectCarousel({ media }) {
  return (
    <>
      <div className="sm:h-[calc(100%-7rem)] sm:overflow-y-auto px-3 sm:px-6">
        <div className="flex flex-col space-y-6">
          {(media || []).map((item) => {
            const isVideo = item.mimeType?.startsWith("video/");

            return isVideo ? (
              <ProjectVideo key={item.url} src={item.url} type={item.mimeType} />
            ) : (
              <ProjectImage key={item.url} src={item.url} alt={item.filename} />
            );
          })}
        </div>
      </div>
    </>
  );
}

export default ProjectCarousel;
