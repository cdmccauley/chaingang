import clientPromise from "../../../lib/mongodb";

import { isAddress } from "ethers";

const ethers5 = require("ethers5");
const { verifyMessage } = require("@ambire/signature-validator");
const provider = new ethers5.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`
);

export default async function handler(req, res) {
  const INTERNAL_SERVER_ERROR = 500;
  const CREATED = 201;
  const BAD_REQUEST = 400;

  let code = INTERNAL_SERVER_ERROR;

  try {
    if (
      req.method === "POST" &&
      req.body.id &&
      req.body.id.match(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      ) &&
      req.body.address &&
      isAddress(req.body.address) &&
      req.body.signature
    ) {
      const client = await clientPromise;
      const database = await client.db("frontend");
      const clients = await database.collection("clients");
      const clientWallets = await database.collection("clientWallets");

      const now = new Date().valueOf();
      const expired = now - 8.64e7;

      await clients.deleteMany({ created: { $lt: expired } });
      await clientWallets.deleteMany({ created: { $lt: expired } });

      const existingClient = await clients.findOne({
        _id: req.body.id,
      });

      if (existingClient && now > existingClient.created + 1000) {
        const serversideprops = await database.collection("serversideprops");

        const config = await serversideprops.findOne({ name: "config" });
        const message = `${config.message}${req.body.id}`;

        const verified = await verifyMessage({
          signer: req.body.address,
          message: message,
          signature: req.body.signature,
          provider,
        });

        if (verified) {
          await clientWallets.updateOne(
            { _id: req.body.id },
            {
              $set: {
                address: req.body.address,
                created: new Date().valueOf(),
              },
            },
            { upsert: true }
          );

          code = CREATED;
        }
      } else {
        code = BAD_REQUEST;
      }
    } else {
      code = BAD_REQUEST;
    }
  } catch (e) {
    console.error("API/CLIENT/SIGNATURE ERROR", e);
  } finally {
    res.status(code).send();
  }
}
