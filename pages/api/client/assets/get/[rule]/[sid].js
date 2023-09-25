import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]";

import clientPromise from "../../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const createPresignedUrlWithClient = ({ region, bucket, key }, expires) => {
  const client = new S3Client({ region });
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: expires });
};

export default async function handler(req, res) {
  const resolves = {
    OK: () => res.status(200).send(),
    ACCEPTED: () => res.status(202).send(),
    NO_CONTENT: () => res.status(204).send(),
    BAD_REQUEST: () => res.status(400).send(),
    UNAUTHORIZED: () => res.status(401).send(),
    NOT_FOUND: () => res.status(404).send(),
    CONFLICT: () => res.status(409).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.UNAUTHORIZED;

  try {
    const session = await getServerSession(req, res, authOptions);

    if (
      session ||
      (req?.headers["x-api-key"] &&
        req?.headers["x-api-key"] === process.env.LOOPRING_API_KEY)
    ) {
      resolve = resolves.BAD_REQUEST;

      const rule =
        req?.query?.rule && req.query.rule != "" ? req.query.rule : undefined;
      const sid =
        req?.query?.sid && req.query.sid != "" ? req.query.sid : undefined;

      if (req?.method === "GET" && rule && rule != "" && sid && sid != "") {
        resolve = resolves.NOT_FOUND;

        const mongo = await clientPromise;
        const frontend = await mongo.db("frontend");
        const participants = await frontend.collection("participants");

        const participant = await participants.findOne({
          sid: sid,
          "unlocks.ruleName": rule,
        });

        const date = new Date();

        if (participant) {
          resolve = resolves.ACCEPTED;

          if (
            !participant?.updates?.asset_get?.[`${rule}`]?.epoch ||
            participant?.updates?.asset_get?.[`${rule}`]?.epoch <=
              date.valueOf() - 1800000
          ) {
            let roles = [];
            let links = [];

            const unlocks = participant.unlocks
              .map((u) => {
                if (u.ruleName == rule) return u;
              })
              .filter((u) => u);

            if (unlocks && unlocks?.length > 0) {
              roles = unlocks
                .map((u) => {
                  if (u.type == "role") return u;
                })
                .filter((u) => u);

              const files = unlocks
                .map((u) => {
                  if (u.type == "file") return u;
                })
                .filter((u) => u);

              if (files && files?.length > 0) {
                const REGION = "us-west-1";
                const BUCKET = "walletlinked-unlocks";

                for (let i = 0; i < files.length; i++) {
                  const clientUrl = await createPresignedUrlWithClient(
                    {
                      region: REGION,
                      bucket: BUCKET,
                      key: files[i].key,
                    },
                    files[i].expires
                  );
                  links = [
                    ...links,
                    {
                      displayName: files[i].displayName,
                      ruleName: files[i].ruleName,
                      link: clientUrl,
                    },
                  ];
                }
              }
            }

            const files = participant?.files
              ? [...participant?.files, links]
                  .flat(1)
                  .filter(
                    (f, i, a) =>
                      a.findIndex((l) => l.ruleName === f.ruleName) === i
                  )
              : links.filter(
                  (f, i, a) =>
                    a.findIndex((l) => l.ruleName === f.ruleName) === i
                );

            await participants.updateOne(
              { _id: new ObjectId(participant._id) },
              {
                $set: {
                  roles: roles,
                  files: files,
                  [`updates.asset_get.${rule}`]: {
                    utc: date.toUTCString(),
                    epoch: date.valueOf(),
                  },
                },
              }
            );
          }
        }
      }
    }
  } catch (e) {
    console.error("API/CLIENT/ASSETS/GET/[SID]/[RULE] ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
