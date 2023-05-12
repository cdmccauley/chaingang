import clientPromise from "../../../../../../lib/mongodb";

import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (req.method === "POST" && req.headers["x-api-key"] && req?.body) {
      const body = JSON.parse(req.body);

      if (body?._id && ObjectId.isValid(body._id)) {
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
          const provider = await mongo.db(req.query.provider);
          const events = await provider.collection("events");

          const event = await events.findOne({
            _id: new ObjectId(body._id),
          });

          // create the event, get the end time timestamp
          // make a prop and use the end time timestamp for the name
          // set the value to an index of all participants

          if (event) {
            if (event?.giveaway) {
              const date = new Date();
              const day = date.getDay();

              // need to check the hour minute first to see if we 
              // need to look into today or a previous day in the week

              // find the next least day from the days array
              console.log(
                // day,
                // event.dates.days.sort().reverse(),
                event.dates.days
                  .sort()
                  .reverse()
                  .find((d) => d < day) ||
                  event.dates.days
                    .sort()
                    .reverse()
                    .find((d) => d == day) ||
                  event.dates.days.sort().reverse()[event.dates.days.length - 1]
              );
              // undefined when not found
              // [...Array(7).keys()]

              console.log(event); // check for completion before return
            } else {
              const chatters = await provider.collection("chatters");

              const report = await chatters
                .find(
                  {
                    [`points.${body._id}`]: {
                      $exists: true,
                    },
                  },
                  {
                    projection: {
                      _id: false,
                      id: "$userstate.user-id",
                      name: "$userstate.display-name",
                      points: `$points.${body._id}`,
                      updated: `$updated.${body._id}`,
                    },
                  }
                )
                .toArray();

              // console.log(chatter);

              resolve = () => res.status(200).json(report);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error("API/CLIENT/EVENTS/[PROVIDER]/[CREATOR]/CANCEL ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
