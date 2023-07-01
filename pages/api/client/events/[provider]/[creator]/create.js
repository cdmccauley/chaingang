import clientPromise from "../../../../../../lib/mongodb";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    CONFLICT: () => res.status(409).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (req.method === "POST" && req.headers["x-api-key"] && req?.body) {
      const body = JSON.parse(req.body);

      if (
        (Number.isInteger(body?.dates?.start),
        Number.isInteger(body?.dates?.end),
        Number.isInteger(body?.days),
        Number.isInteger(body?.hour),
        Number.isInteger(body?.minute),
        Number.isInteger(body?.duration),
        typeof body?.public == "boolean" && typeof body?.giveaway == "boolean")
      ) {
        resolve = resolves.UNAUTHORIZED;

        const mongo = await clientPromise;
        const frontend = await mongo.db("frontend");
        const access = frontend.collection("access");
        const requestor = await access.findOne({
          key: req.headers["x-api-key"],
        });

        if (
          requestor &&
          requestor?.features.includes("events") &&
          ["twitch"].includes(req.query.provider) &&
          requestor?.configs?.home === req.query.creator
        ) {
          resolve = resolves.CONFLICT;

          const provider = await mongo.db(req.query.provider);
          const events = await provider.collection("events");
          const duplicate = await events.findOne({
            channel: requestor.configs.twitch,
            "dates.start": body.dates.start,
            "dates.end": body.dates.end,
            days: body.days,
            hour: body.hour,
            minute: body.minute,
            duration: body.duration,
            public: body.public,
            giveaway: body.giveaway,
          });

          if (!duplicate) {
            resolve = resolves.INTERNAL_SERVER_ERROR;

            await events.insertOne({
              channel: requestor.configs[`${req.query.provider}`],
              home: requestor.configs.home,
              dates: {
                start: body.dates.start,
                end: body.dates.end,
              },
              days: body.days,
              hour: body.hour,
              minute: body.minute,
              duration: body.duration - 1,
              cancelled: false,
              creator: "dashboard",
              created: new Date().valueOf(),
              modifier: 1.0,
              cooldown: body.giveaway ? body.duration - 1 : 60000,
              public: body.public,
              marquees: [requestor.configs.home],
              giveaway: body.giveaway,
            });

            resolve = () => res.status(200).send();
          }
        }
      }
    }
  } catch (e) {
    console.error("API/CLIENT/EVENTS/[PROVIDER]/[CREATOR]/CREATE ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
