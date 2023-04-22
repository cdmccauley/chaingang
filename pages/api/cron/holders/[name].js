import clientPromise from "../../../../lib/mongodb";

export default async function handler(req, res) {
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
    if (req.method === "GET") {
      resolve = resolves.ACCEPTED;

      const date = new Date();
      const now = date.valueOf();
      const minute = date.getUTCMinutes();

      const a = minute >= 14 && minute <= 16;
      const b = minute >= 44 && minute <= 46;

      if (a || b) {
        const mongo = await clientPromise;
        const cronDB = await mongo.db("cron");
        const jobs = await cronDB.collection("jobs");

        const start = a
          ? date.setUTCMinutes(14, 0, 0)
          : date.setUTCMinutes(44, 0, 0);

        const running = await jobs.findOne({
          name: req.query.name,
          lastRun: { $gt: start },
        });

        if (!running) {
          const job = await jobs.findOneAndUpdate(
            {
              name: req.query.name,
            },
            {
              $set: {
                lastRun: now,
              },
            }
          );

          if (job) {
            const root =
              process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
                ? "http://localhost:3000"
                : `https://www.${process.env.NEXT_PUBLIC_PROD_HOST}`;

            job.value.nftDatas.map((n) =>
              fetch(`${root}/api/loopring/holders?nftData=${n}&offset=0`, {
                headers: {
                  Accept: "application/json",
                  "X-API-KEY": process.env.LOOPRING_API_KEY,
                },
              })
            );
          }

          resolve = resolves.NO_CONTENT;
        }
      }
    }
  } catch (e) {
    console.error("API/CRON/HOLDERS ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
