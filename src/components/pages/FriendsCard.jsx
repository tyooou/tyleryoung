import { useEffect, useState } from "react";
import ExternalLink from "../ExternalLink";

function FriendsCard() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const response = await fetch(
          import.meta.env.BASE_URL + "/friends.json"
        );
        if (!response.ok) throw new Error("Failed to load friends");
        const data = await response.json();
        setFriends(data);
      } catch (err) {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, []);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 200);
    return () => clearInterval(interval);
  }, [loading]);

  function BrailleSpinner() {
    const frames = [
      '\u280B', // ⠋
      '\u2819', // ⠙
      '\u2839', // ⠹
      '\u2838', // ⠸
      '\u283C', // ⠼
      '\u2834', // ⠴
      '\u2826', // ⠦
      '\u2827', // ⠧
      '\u2807', // ⠇
      '\u280F', // ⠏
    ];
    const [frame, setFrame] = useState(0);
    useEffect(() => {
      const interval = setInterval(() => {
        setFrame(f => (f + 1) % frames.length);
      }, 80);
      return () => clearInterval(interval);
    }, []);
    return (
      <p>{frames[frame]}</p>
    );
  }

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-8xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            Friends.
          </h2>
          <p className="text-xl sm:text-lg md:text-xl mt-3 ml-2">
            The biggest sources of my inspiration. Please visit them!
          </p>
          <div className="text-xl sm:text-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-6 ml-2">
            {loading ? (
              <BrailleSpinner />
            ) : (
              friends.length > 0 ? (
                friends.map((friend) => (
                  <ExternalLink
                    key={friend.name}
                    text={friend.name}
                    link={friend.link}
                  />
                ))
              ) : (
                <p className="text-base">No friends found :(</p>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FriendsCard;
