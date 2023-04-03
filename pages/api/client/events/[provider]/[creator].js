import clientPromise from "../../../../../lib/mongodb";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).json({ status: "BAD_REQUEST" }),
    UNAUTHORIZED: () => res.status(401).json({ status: "UNAUTHORIZED" }),
    NOT_FOUND: () => res.status(404).json({ status: "NOT_FOUND" }),
    INTERNAL_SERVER_ERROR: () =>
      res.status(500).json({ status: "INTERNAL_SERVER_ERROR" }),
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

      const marqueeEvents = await events
        .find(
          {
            "dates.end": { $gt: now },
            public: true,
            marquees: req.query.creator,
          },
          {
            sort: { "dates.end": 1 },
            projection: {
              _id: 0,
              channel: 1,
              dates: 1,
              times: 1,
              cancelled: 1,
            },
          }
        )
        .limit(limit);

      const marquee = await marqueeEvents.toArray().then((arr) => arr);

      if (marquee && marquee.length > 0) {
        resolve = () => res.status(200).json({ status: "OK", events: marquee });
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
