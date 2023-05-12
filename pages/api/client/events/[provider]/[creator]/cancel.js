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

      if (body?._id) {
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

          const u = await events.updateOne(
            {
              _id: new ObjectId(body._id),
            },
            {
              $set: {
                cancelled: true,
              },
            }
          );

          resolve = () => res.status(200).send();
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
