import clientPromise from "../../../../../../lib/mongodb";
import * as dayjs from "dayjs";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (req.method === "POST" && req.headers["x-api-key"] && req?.body) {
      const body = JSON.parse(req.body);

      if (
        body?.dates?.start &&
        body?.dates?.end &&
        body?.dates?.days &&
        body?.times?.start &&
        body?.times?.end &&
        typeof body?.public == "boolean" &&
        typeof body?.giveaway == "boolean"
      ) {
        const mongo = await clientPromise;
        const frontend = await mongo.db("frontend");
        const access = frontend.collection("access");

        const requestor = await access.findOne({
          key: req.headers["x-api-key"],
        });

        // console.log('pre-create', requestor, req.query)

        if (
          requestor &&
          requestor?.features.includes("events") &&
          ["twitch"].includes(req.query.provider) &&
          requestor?.configs?.home === req.query.creator
        ) {
          const provider = await mongo.db(req.query.provider);

          //   console.log(dates, body.times, days, body.public, body.giveaway);

          const events = await provider.collection("events");

          const duplicate = await events.findOne({
            channel: requestor.configs.twitch,
            "dates.start": body.dates.start,
            "dates.end": body.dates.end,
            days: body.days,
            public: body.public,
            giveaway: body.giveaway,
          });

          if (!duplicate) {
            let diff = undefined;

            if (body.giveaway) {
              const startdate = new Date(body.dates.start);
              const starttime = startdate.setUTCHours(
                body.times.start.hour,
                body.times.start.minute,
                0,
                0
              );
              const endtime = startdate.setUTCHours(
                body.times.end.hour,
                body.times.end.minute,
                0,
                0
              );
              diff = endtime - starttime;
            }

            console.log(diff);

            await events.insertOne({
              channel: requestor.configs[`${req.query.provider}`],
              type: "dashboard",
              dates: {
                start: body.dates.start,
                end: body.dates.end,
                days: body.dates.days.map((d) =>
                  ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].indexOf(d)
                ),
              },
              times: {
                start: {
                  hour: body.times.start.hour,
                  minute: body.times.start.minute,
                },
                end: {
                  hour: body.times.end.hour,
                  minute: body.times.end.minute,
                },
              },
              cancelled: false,
              creator: "dashboard",
              created: new Date().valueOf(),
              modifier: 1.0,
              cooldown: body.giveaway ? diff : 60000,
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
