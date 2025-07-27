import DecodeText from "./DecodeText";
import ExternalLink from "./ExternalLink";
import { useTheme } from "./ThemeContext";

function BibliographyCard({ toggleSidebar }) {
  const { cycleTheme } = useTheme();

  return (
    <>
      <div className="w-full h-full p-5 font-mono">
        <DecodeText text="Tyler Young" speed={80} />
        <div className="ml-3">
          <p className="text-lg mt-4 font-bold text-[var(--text-secondary)]">
            Creative by design.{" "}
            <span className="italic">Technical by habit.</span>
          </p>
          <p className="text-lg mt-4">
            A software engineer, creative technologist and bedroom dweller
            studying
            <br />
            at the{" "}
            <ExternalLink
              text="University of Auckland."
              link="https://www.auckland.ac.nz/en.html"
              hover={false}
            />
          </p>
          <p className="font-bold text-lg mt-4">Tinkering on:</p>
          <ul className="text-lg list-disc">
            <li className="ml-6">
              <span className="font-bold">habitual</span> - make habits a daily
              ritual.
            </li>
            <li className="ml-6">
              <span className="font-bold">pixai</span> - pixelise anything,
              beautifully.
            </li>
          </ul>

          <button
            className="text-lg px-3 py-2 mt-4 hover:bg-[var(--bg-secondary)]"
            onClick={() => toggleSidebar(true)}
          >
            → <span className="font-bold">Start exploring!</span>
          </button>
          <button
            className="text-lg ml-4 px-3 py-2 mt-4 hover:bg-[var(--bg-secondary)]"
            onClick={cycleTheme}
          >
            → <span className="font-bold">Switch theme!</span>
          </button>
        </div>
      </div>
    </>
  );
}

export default BibliographyCard;
