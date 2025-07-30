import ExternalLink from "./ExternalLink";

function FriendsCard() {
  return (
    <>
      <div className="w-full h-full p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-9xl">Friends.</h2>
          <p className="text-xl mt-3 ml-3">
            The biggest sources of my inspiration. Please visit them!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-6 ml-2">
            <ExternalLink
              text="Koutaro Yumiba"
              link={"https://koutaroyumiba.com"}
            />
            <ExternalLink
              text="Alex Liang"
              link={"https://alux444.github.io"}
            />
            <ExternalLink
              text="Atul Kodla"
              link={"https://www.atulkodla.com"}
            />
            <ExternalLink text="Newton Yuan" link={"https://newtonyuan.com"} />
            <ExternalLink text="Jaidyn Tam" link={"https://jtamdent.com.au"} />
            <ExternalLink
              text="Christoph Kim"
              link={"https://christoph.framer.website"}
            />
            <ExternalLink
              text="Nicholas Wilson"
              link={"https://niccholasw.cloud"}
            />
            <ExternalLink text="Dave Khadka" link={"https://davekhadka.com"} />
            <ExternalLink text="Tony Lim" link={"https://tonylxm.com"} />
          </div>
        </div>
      </div>
    </>
  );
}

export default FriendsCard;
