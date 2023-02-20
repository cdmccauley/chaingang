import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
  let resolves = {
    BAD_REQUEST: () => res.status(400).json({ error: "BAD_REQUEST" }),
    UNAUTHORIZED: () => res.status(401).json({ error: "UNAUTHORIZED" }),
    NOT_FOUND: () => res.status(404).json({ address: "NOT_FOUND" }),
    INTERNAL_SERVER_ERROR: () =>
      res.status(500).json({ error: "INTERNAL_SERVER_ERROR" }),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (
      req.method === "GET" &&
      req?.headers?.authorization?.startsWith("Bearer ") &&
      req?.query?.provider &&
      ["discord", "twitch", "spotify"].find(
        (provider) => provider === req?.query?.provider
      ) &&
      req?.query?.id
    ) {
      const mongo = await clientPromise;
      const api = await mongo.db("api");
      const keys = await api.collection("keys");

      const bearer = req.headers.authorization.substring(
        7,
        req.headers.authorization.length
      );

      const key = await keys.findOne({ key: bearer, active: true });

      if ((key && key?.used < key?.limit) || key?.holder === "dev") {
        await keys.updateOne(
          {
            key: key.key,
          },
          {
            $set: {
              used: key.used + 1,
            },
          },
          { upsert: true }
        );

        const frontend = await mongo.db("frontend");
        const provider = await frontend.collection(req.query.provider);

        const participant = await provider
          .find(
            { "participant.sid": req.query.id },
            {
              sort: { updated: -1 },
              projection: { _id: 0, address: 1 },
            }
          )
          .limit(1)
          .toArray();

        if (participant.length > 0 && participant[0]?.address) {
          resolve = () =>
            res.status(200).json({ address: participant[0].address });
        } else {
          resolve = resolves.NOT_FOUND;
        }
      } else {
        resolve = resolves.UNAUTHORIZED;
      }
    }
  } catch (e) {
    resolve = resolves.INTERNAL_SERVER_ERROR;
    console.error("ERROR", e);
  } finally {
    resolve();
  }
}
