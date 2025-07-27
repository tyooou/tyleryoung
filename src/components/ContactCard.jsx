import ExternalLink from "./ExternalLink";

function ContactCard() {
  return (
    <>
      <div className="w-full h-full p-5 font-mono">
        <div className="flex flex-col">
          <h2 className="font-bold text-9xl">Contact.</h2>
          <p className="text-xl mt-3 ml-2 mb-2">
            Feel free to shoot me an e-mail to organise a meeting <br />— I’d
            love to hear what you’re working on.
          </p>
          <ExternalLink
            text="young.h.tyler@gmail.com"
            link={"mailto:young.h.tyler@gmail.com"}
          />
        </div>
      </div>
    </>
  );
}

export default ContactCard;
