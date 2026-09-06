import ProjectImage from "./ProjectImage";
import ProjectVideo from "./ProjectVideo";
import CustomScrollbar from "../../CustomScrollbar";

function ProjectCarousel({ media }) {
  return (
    <CustomScrollbar
      wrapperClassName="sm:h-full"
      overflowClassName="overflow-visible sm:overflow-y-auto"
      className="px-3 sm:px-6"
    >
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
    </CustomScrollbar>
  );
}

export default ProjectCarousel;
