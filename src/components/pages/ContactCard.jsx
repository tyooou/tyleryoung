import ExternalLink from "../ExternalLink";

function ContactCard() {
  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
        <div className="flex flex-col">
          <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            Contact.
          </h2>
          <p className="text-base md:text-xl mt-3 ml-2 mb-2 break-words">
            Feel free to shoot me an e-mail to organise a meeting{" "}
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>— I'd love to hear what you're
            working on.
          </p>
          <div className="text-lg mt-2">
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
