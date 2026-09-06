import CustomScrollbar from "../CustomScrollbar";

function OpenSourceCard() {
  return (
    <CustomScrollbar className="p-3 sm:p-5 font-mono select-none cursor-default">
      <div className="flex flex-col">
        <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          Open Source.
        </h2>
        <p className="text-base md:text-xl mt-3 ml-2 mb-2 break-words">
          A running list of open source projects and contributions is coming soon.
        </p>
      </div>
    </CustomScrollbar>
  );
}

export default OpenSourceCard;
