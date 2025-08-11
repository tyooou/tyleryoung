import ExternalLink from "../ExternalLink";

function ContactCard() {
  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-8xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            Contact.
          </h2>
          <p className="text-2xl sm:text-lg md:text-xl mt-3 ml-2 mb-2">
            Feel free to shoot me an e-mail to organise a meeting{" "}
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>— I'd love to hear what you're
            working on.
          </p>
          <div className="text-2xl sm:text-lg md:text-xl ml-2 mt-2">
            <ExternalLink
              text="young.h.tyler@gmail.com"
              link={"mailto:young.h.tyler@gmail.com"}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactCard;
