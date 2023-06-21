import { duration } from "@mui/material";
import clientPromise from "../../../../../../lib/mongodb";

import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const resolves = {
    BAD_REQUEST: () => res.status(400).send(),
    NOT_FOUND: () => res.status(404).send(),
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
          ["twitch"].includes(req?.query?.provider) &&
          requestor?.configs?.home === req.query?.creator
        ) {
          const provider = await mongo.db(req?.query?.provider);
          const events = await provider.collection("events");

          const event = await events.findOne({
            _id: new ObjectId(body._id),
            // marquees: req?.query?.creator,
          });

          if (event) {
            if (event.giveaway) {
              // start checking today
              const date = new Date();
              const now = date.valueOf();
              const start = date.setUTCHours(event.hour, event.minute, 0, 0);
              const day = date.getUTCDay();
              const end = date.setTime(start + event.duration);

              console.log("utc now", new Date().toUTCString());
              console.log("utc day", day);
              console.log("utc start if today", new Date(start).toUTCString());

              const sorted = event.days.sort().reverse();

              let reporting;

              if (start >= event.dates.start && sorted.includes(day)) {
                if (now >= end) {
                  console.log("ended today");
                  reporting = end;
                }
              }

              if (!reporting) {
                const last = sorted.find((d) => d < day);
                let move = 0;

                if (last >= 0) {
                  move = day - last;
                  console.log("ended earlier this week", move);
                } else {
                  move = day + (7 - sorted[0]);
                  console.log("ended last week", move);
                }

                date.setTime(start);
                const moved = date.setUTCDate(date.getUTCDate() - move);
                reporting = date.setTime(moved + event.duration);
              }

              if (reporting > now) {
                const landed = date.getUTCDay();
                const another = sorted.find((d) => d < landed);
                let distance = 0;

                if (another >= 0) {
                  distance = landed - another;
                  console.log("ended earlier this week the sequel", distance);
                } else {
                  distance = day + (7 - sorted[0]);
                  console.log("ended last week the sequel", distance);
                }

                reporting = date.setUTCDate(date.getUTCDate() - distance);
              }

              date.setTime(event.dates.start);
              const starting = date.setUTCHours(event.hour, event.minute, 0, 0);
              const initial = date.getUTCDay();

              let threshold;

              if (now >= starting) {
                if (sorted.includes(initial)) {
                  console.log("happened on start");
                  threshold = date.setTime(starting + event.duration);
                } else {
                  const later = sorted.reverse().find((d) => d > initial);
                  let slide;
                  if (later >= 0) {
                    console.log("happened same week as start");
                    slide = later - initial;
                  } else {
                    console.log("happened week after start");
                    slide = sorted.reverse()[0] + 7 - initial;
                  }
                  threshold = date.setUTCDate(date.getUTCDate() + slide);
                }
              }

              console.log("threshold utc", new Date(threshold).toUTCString());
              console.log("threshold", new Date(threshold).toString());

              if (threshold && reporting >= threshold) { // reporting is after first start
                console.log("// reporting //");

                console.log("utc", new Date(reporting).toUTCString());
                console.log(new Date(reporting).toString());
              }

              ////

              // start checking yesterday
              // date.setTime(now);
              // date.setUTCDate(date.getUTCDate() - 1);
              // const yesterday = date.getUTCDay();

              // if (sorted.includes(yesterday)) {
              //   const yesterdayStart = date.setUTCHours(
              //     event.hour,
              //     event.minute,
              //     0,
              //     0
              //   );
              //   const yesterdayEnd = date.setTime(
              //     yesterdayStart + event.duration
              //   );

              //   if (yesterdayStart >= event.dates.start) {
              //     if (now >= yesterdayStart && now <= yesterdayEnd) {
              //       // started yesterday, happening now
              //       // need to keep going backward
              //     } else if (now >= yesterdayEnd) {
              //       // yesterdayEnd could be last event
              //     }
              //   }
              // }

              // done checking yesterday?

              // let lastDay;
              // let diff;

              // const afterEnd = now >= end;
              // const today = sorted.includes(day);

              // if (afterEnd && today) {
              //   diff = 0;
              // } else {
              //   if (today) {
              //     lastDay = sorted.find((d) => d < day);
              //     diff = day - lastDay;
              //   } else {
              //     lastDay = sorted[0];
              //     diff = 6 - (lastDay - day - 1);
              //   }
              // }

              // const reportDate = date.setUTCDate(date.getUTCDate() - diff);

              //

              date.setTime(event.dates.start);
              const begin = date.setUTCHours(event.hour, event.minute, 0, 0);
              const on = date.getUTCDay();
              let finish = date.setTime(begin + event.duration);
              let reportable = false;

              // if (now >= finish && sorted.includes(on)) {
              //   reportable = true;
              // } else {
              //   const next = sorted.reverse().find((d) => d > on);
              //   finish = date.setDate(date.getDate() + next - on);

              //   if (now >= finish) {
              //     reportable = true;
              //   }
              // }

              if (reportable) {
                const reports = await provider.collection("reports");
                const report = await reports.findOne({
                  event_id: event._id.toString(),
                  end: reportDate,
                });

                if (report) {
                  const fullReport = await reports
                    .find(
                      {
                        event_id: event._id.toString(),
                      },
                      {
                        projection: {
                          _id: false,
                        },
                      }
                    )
                    .toArray();

                  if (fullReport)
                    resolve = () => res.status(200).json(fullReport);
                } else {
                  const chatters = await provider.collection("chatters");
                  const participated = await chatters
                    .find(
                      {
                        [`points.${event._id}`]: {
                          $gt: 0,
                        },
                      },
                      {
                        projection: {
                          _id: false,
                          id: "$userstate.user-id",
                          name: "$userstate.display-name",
                          points: `$points.${event._id}`,
                          updated: `$updated.${event._id}`,
                        },
                      }
                    )
                    .toArray();

                  await reports.insertOne({
                    event_id: event._id.toString(),
                    end: reportDate,
                    ranks: participated
                      .map((value) => ({ value, sort: Math.random() }))
                      .sort((a, b) => a.sort - b.sort)
                      .map(({ value }, i) => {
                        return { rank: i, ...value };
                      }),
                    created: now,
                  });

                  const fullReport = await reports
                    .find(
                      {
                        event_id: event._id.toString(),
                      },
                      {
                        projection: {
                          _id: false,
                        },
                      }
                    )
                    .toArray();
                  if (fullReport) {
                    // TODO: set all chatter points for event to 0
                    resolve = () => res.status(200).json(fullReport);
                  }
                }
              }
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

              resolve = () => res.status(200).json(report);
            }
          } else {
            resolve = resolves.NOT_FOUND;
          }
        }
      }
    }
  } catch (e) {
    console.error("API/CLIENT/EVENTS/[PROVIDER]/[CREATOR]/REPORT ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
