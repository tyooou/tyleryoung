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

  return (
    <>
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default">
        <div className="flex flex-col">
          <h2 className="font-bold text-8xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
            Friends.
          </h2>
          <p className="text-xl sm:text-lg md:text-xl mt-3 ml-2 sm:ml-3">
            The biggest sources of my inspiration. Please visit them!
          </p>
          <div className="text-xl sm:text-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 mt-6 ml-2">
            {loading ? (
              <p>Loading...</p>
            ) : (
              friends.map((friend) => (
                <ExternalLink
                  key={friend.name}
                  text={friend.name}
                  link={friend.link}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FriendsCard;
