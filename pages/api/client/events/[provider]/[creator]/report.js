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
          (requestor?.configs?.home === req.query?.creator ||
            requestor?.configs?.home === "admin")
        ) {
          const provider = await mongo.db(req?.query?.provider);
          const events = await provider.collection("events");

          const event = await events.findOne({
            _id: new ObjectId(body._id),
            // marquees: req?.query?.creator,
          });

          if (event) {
            if (event.giveaway) {
              const date = new Date();
              const now = date.valueOf();
              const start = date.setUTCHours(event.hour, event.minute, 0, 0);
              const day = date.getUTCDay();
              const end = date.setTime(start + event.duration);

              const sorted = event.days.sort().reverse();

              let reporting;

              if (start >= event.dates.start && sorted.includes(day)) {
                if (now >= end) {
                  reporting = end;
                }
              }

              if (!reporting) {
                const last = sorted.find((d) => d < day);
                let move = 0;

                if (last >= 0) {
                  move = day - last;
                } else {
                  move = day + (7 - sorted[0]);
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
                } else {
                  distance = day + (7 - sorted[0]);
                }

                reporting = date.setUTCDate(date.getUTCDate() - distance);
              }

              date.setTime(event.dates.start);
              const starting = date.setUTCHours(event.hour, event.minute, 0, 0);
              const initial = date.getUTCDay();

              let threshold;

              if (now >= starting) {
                if (sorted.includes(initial)) {
                  threshold = date.setTime(starting + event.duration);
                } else {
                  const later = sorted.reverse().find((d) => d > initial);
                  let slide;
                  if (later >= 0) {
                    slide = later - initial;
                  } else {
                    slide = sorted.reverse()[0] + 7 - initial;
                  }
                  threshold = date.setUTCDate(date.getUTCDate() + slide);
                }
              }

              if (threshold && reporting >= threshold) {
                date.setTime(event.dates.end);
                const maxStart = date.setUTCHours(
                  event.hour,
                  event.minute,
                  0,
                  0
                );
                const maxStartDay = date.getUTCDay();
                const ending = date.setTime(maxStart + event.duration);

                let lastReporting;

                if (sorted.includes(maxStartDay) && ending <= event.dates.end) {
                  lastReporting = ending;
                } else {
                  const weekOfMax = sorted.find((d) => d < maxStartDay);
                  let change = 0;
                  if (weekOfMax >= 0) {
                    change = maxStartDay - weekOfMax;
                  } else {
                    change = maxStartDay + (7 - sorted.reverse()[0]);
                  }
                  lastReporting = date.setUTCDate(date.getUTCDate() - change);
                }

                let reportDate;

                if (reporting <= lastReporting) {
                  reportDate = reporting;
                } else {
                  reportDate = lastReporting;
                }

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
                    await chatters.updateMany(
                      {
                        [`points.${event._id.toString()}`]: { $gt: 0 },
                      },
                      {
                        $unset: {
                          [`points.${event._id.toString()}`]: "",
                          [`updated.${event._id.toString()}`]: "",
                        },
                      }
                    );
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
