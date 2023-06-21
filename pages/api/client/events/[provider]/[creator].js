import clientPromise from "../../../../../lib/mongodb";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    const limit =
      req.query.limit &&
      Number.isInteger(Number.parseInt(req.query.limit)) &&
      Number.parseInt(req.query.limit) > 0
        ? Number.parseInt(req.query.limit)
        : 10;

    const provider =
      req?.query?.provider &&
      ["discord", "twitch", "spotify"].find(
        (provider) => provider === req.query.provider
      )
        ? req.query.provider
        : undefined;

    if (req.method === "GET" && provider && req.query.creator) {
      const mongo = await clientPromise;
      const providerDB = await mongo.db(provider);
      const events = await providerDB.collection("events");

      const date = new Date();
      const now = date.valueOf();

      let doc = {
        "dates.end": { $gt: now },
        public: true,
        marquees: req.query.creator,
      };

      let pro = {
        channel: 1,
        dates: 1,
        days: 1,
        hour: 1,
        minute: 1,
        duration: 1,
      };

      if (req.headers["x-api-key"]) {
        const frontend = await mongo.db("frontend");
        const access = frontend.collection("access");

        const requestor = await access.findOne({
          key: req.headers["x-api-key"],
        });

        if (requestor) {
          doc = {
            marquees: req.query.creator,
          };

          pro = {
            channel: 1,
            cancelled: 1,
            dates: 1,
            days: 1,
            hour: 1,
            minute: 1,
            duration: 1,
            giveaway: 1,
            public: 1,
          };
        }
      }

      const marqueeEvents = await events
        .find(doc, {
          sort: { "dates.end": 1 },
          projection: pro,
        })
        .limit(limit);

      const links = {
        twitch: "https://www.twitch.tv/",
        discord: "https://www.discord.com/",
      };

      const marquee = await marqueeEvents.toArray().then((arr) => {
        arr.forEach((a) => {
          a.provider = provider;
          a.link = `${links[`${provider}`]}${a.channel.replace("#", "")}`;
        });
        return arr;
      });

      if (marquee && marquee.length > 0) {
        resolve = () => res.status(200).json({ events: marquee });
      } else {
        resolve = resolves.NOT_FOUND;
      }
    } else {
      resolve = resolves.BAD_REQUEST;
    }
  } catch (e) {
    console.error("API/CLIENT/EVENTS/[PROVIDER]/[CREATOR] ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
