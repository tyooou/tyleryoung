import DecodeText from "../DecodeText";
import ExternalLink from "../ExternalLink";
import { useTheme } from "../ThemeContext";

function BibliographyCard({ toggleSidebar }) {
  const { cycleTheme } = useTheme();

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
        <DecodeText text="Tyler Young" speed={80} />
        <div className="ml-2 sm:ml-3">
          <p className="text-lg sm:text-xl mt-6 sm:mt-8 font-bold text-[var(--text-secondary)]">
            Creative by design.{" "}
            <span className="italic">Technical by habit.</span>
          </p>
          <p className="text-base sm:text-lg mt-3 sm:mt-4 max-w-3xl">
            An undergraduate software engineer, creative technologist and bedroom dweller
            studying at the{" "}
            <ExternalLink
              text="University of Auckland."
              link="https://www.auckland.ac.nz/en.html"
              hover={false}
            />
          </p>
          
          <p className="font-bold text-base sm:text-xl mt-3 sm:mt-4 mb-2">
            Tinkering on:
          </p>
          <ul className="text-base sm:text-lg list-disc">
            <li className="ml-4 sm:ml-6">
              <span className="font-bold">habitual</span> - make habits a daily
              ritual.
            </li>
            <li className="ml-4 sm:ml-6">
              <span className="font-bold">basium</span> - smarter codebase intelligence.
            </li>
            <li className="ml-4 sm:ml-6">
              <span className="font-bold">aesth</span> - creatives for creatives.
            </li>
          </ul>
          <div className="flex flex-col items-start">
            <button
              className="text-base sm:text-lg px-2 sm:px-3 py-1 sm:py-2 mt-10 sm:mt-4 hover:bg-[var(--bg-secondary)] cursor-pointer"
              onClick={cycleTheme}
            >
              → <span className="font-bold">Switch theme!</span>
            </button>

            <button
              className="sm:hidden text-base px-2 py-1 mt-3 hover:bg-[var(--bg-secondary)] cursor-pointer"
              onClick={() => toggleSidebar(true)}
            >
              → <span className="font-bold">Start exploring!</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default BibliographyCard;
