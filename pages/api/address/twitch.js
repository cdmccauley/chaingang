import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  const INTERNAL_SERVER_ERROR = 500;
  const UNAUTHORIZED = 401;
  const OK = 200;
  const NOT_FOUND = 404;
  const BAD_REQUEST = 400;

  let code = BAD_REQUEST;
  let json = { error: "BAD_REQUEST" };

  try {
    if (
      req.method === "GET" &&
      req?.headers?.authorization?.startsWith("Bearer ") &&
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

      if (key) {
        const frontend = await mongo.db("frontend");
        const twitch = await frontend.collection("twitch");

        const participant = await twitch
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
          code = OK;
          json = { address: participant[0].address };
        } else {
          code = NOT_FOUND;
          json = { address: "NOT_FOUND" };
        }
      } else {
        code = UNAUTHORIZED;
        json = { error: "UNAUTHORIZED" };
      }
    }
  } catch (e) {
    code = INTERNAL_SERVER_ERROR;
    json = { error: "INTERNAL_SERVER_ERROR" };
    console.error("ERROR", e);
  } finally {
    res.status(code).send(json);
  }
}
