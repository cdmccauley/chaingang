import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const resolves = {
    NO_CONTENT: () => res.status(204).send(),
    BAD_REQUEST: () => res.status(400).send(),
    INTERNAL_SERVER_ERROR: () => res.status(500).send(),
  };

  let resolve = resolves.BAD_REQUEST;

  try {
    if (
      req.method === "GET" &&
      req.headers["x-api-key"] &&
      req.headers["x-api-key"] === process.env.LOOPRING_API_KEY &&
      req.query.nftData
    ) {
      const offset =
        req.query.offset &&
        parseInt(req.query.offset) !== Number.NaN &&
        parseInt(req.query.offset) > 0
          ? parseInt(req.query.offset)
          : 0;
      const params = `&offset=${offset}&limit=180`;
      const url = `https://api3.loopring.io/api/v3/nft/info/nftHolders?nftData=${req.query.nftData}${params}`;

      const holders = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-API-KEY": process.env.LOOPRING_API_KEY,
        },
      })
        .then((res) => res.json())
        .then((json) => json);

      if (holders?.nftHolders) {
        const mongo = await clientPromise;
        const loopring = await mongo.db("loopring");

        const collection = await loopring.collection(req.query.nftData);

        if (offset === 0) {
          const date = new Date();
          await collection.deleteMany({});
          await collection.insertOne({
            name: "metadata",
            total: holders.totalNum,
            started: date.toUTCString(),
          });
        }

        await collection.insertMany(holders.nftHolders);

        if (holders.totalNum > offset + holders.nftHolders.length) {
          const root =
            process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
              ? "http://localhost:3000"
              : `https://www.${process.env.NEXT_PUBLIC_PROD_HOST}`;

          const nextUrl = `${root}/api/loopring/holders?nftData=${
            req.query.nftData
          }&offset=${offset + holders?.nftHolders.length}`;

          fetch(nextUrl, {
            headers: {
              Accept: "application/json",
              "X-API-KEY": process.env.LOOPRING_API_KEY,
            },
          });
        }

        resolve = resolves.NO_CONTENT;
      }
    }
  } catch (e) {
    console.error("API/LOOPRING/HOLDERS ERROR", e);
    resolve = resolves.INTERNAL_SERVER_ERROR;
  } finally {
    resolve();
  }
}
