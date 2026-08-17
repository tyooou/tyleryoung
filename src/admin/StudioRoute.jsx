import { Studio } from "sanity";
import config from "../../sanity.config.js";

function StudioRoute() {
  return <Studio config={config} />;
}

export default StudioRoute;
