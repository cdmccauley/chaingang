import clientPromise from "../../../lib/mongodb";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export default async function handler(req, res) {
  const s3Client = new S3Client({ region: "us-east-1" });

  const resolves = {
    ACCEPTED: () => res.status(202).send(),
    NO_CONTENT: () => res.status(204).send(),
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (
      req.method === "GET" &&
      req?.headers?.authorization?.startsWith("Bearer ")
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

        const loopring = await mongo.db("loopring");
        const collection = await loopring.collection(req.query.name);

        const holders = await collection
          .find(
            { accountId: { $exists: true } },
            {
              projection: { _id: 0, accountId: 1, tokenId: 1, amount: 1 },
            }
          )
          .toArray();

        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_NAME.toLowerCase(),
            Key: `public/snapshots/${req.query.name}.txt`,
            Body: JSON.stringify({
              nftHolders: holders,
            }),
          })
        );

        resolve = resolves.ACCEPTED;
      }
    }
  } catch (e) {
    console.error("API/CRON/HOLDERS ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
