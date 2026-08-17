import { useEffect, useState } from "react";
import ExternalLink from "../ExternalLink";
import BrailleSpinner from "../BrailleSpinner";
import { sanityClient } from "../../lib/sanityClient";

function FriendsCard() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const data = await sanityClient.fetch(`*[_type == "friend"]{ name, link }`);
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
      <div className="w-full h-full p-3 sm:p-5 font-mono select-none cursor-default overflow-y-auto">
        <div className="flex flex-col">
          <h2 className="font-bold text-6xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            Friends.
          </h2>
          <p className="text-base md:text-xl mt-3 ml-2">
            The biggest sources of my inspiration. Please visit them!
          </p>
          <div className="text-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-6 ml-2">
            {loading ? (
              <BrailleSpinner />
            ) : friends.length > 0 ? (
              friends.map((friend) => (
                <ExternalLink
                  key={friend.name}
                  text={friend.name}
                  link={friend.link}
                />
              ))
            ) : (
              <p className="text-base">No friends found :(</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default FriendsCard;
