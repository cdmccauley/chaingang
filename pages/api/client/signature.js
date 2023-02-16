import clientPromise from "../../../lib/mongodb";

import { isAddress } from "ethers";

const ethers5 = require("ethers5");
const { verifyMessage } = require("@ambire/signature-validator");
const provider = new ethers5.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_KEY}`
);

import { authOptions } from "../../api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);

  const INTERNAL_SERVER_ERROR = 500;
  const UNAUTHORIZED = 401;
  const CREATED = 201;
  const NOT_FOUND = 404;
  const BAD_REQUEST = 400;

  let code = UNAUTHORIZED;

  try {
    if (
      session &&
      req.method === "POST" &&
      req.body.address &&
      isAddress(req.body.address) &&
      req.body.signature
    ) {
      const mongo = await clientPromise;
      const frontend = await mongo.db("frontend");

      const participants = await frontend.collection("participants");
      const participant = await participants.findOne({
        id: session.id,
      });

      if (participant) {
        const serversideprops = await frontend.collection("serversideprops");
        const config = await serversideprops.findOne({ name: "config" });
        const message = `${config.message}${participant.name}\n${participant.email}\n\n${participant.nonce}`;

        const verified = await verifyMessage({
          signer: req.body.address,
          message: message,
          signature: req.body.signature,
          provider,
        });

        if (verified) {
          await participants.updateOne(
            {
              id: session.id,
              name: session.session.user.name,
              email: session.session.user.email,
            },
            {
              $set: {
                address: req.body.address,
                twitch: session,
                updated: new Date().valueOf(),
              },
            },
            { upsert: true }
          );

          code = CREATED;
        } else {
          code = NOT_FOUND;
        }
      } else {
        code = UNAUTHORIZED;
      }
    } else {
      code = BAD_REQUEST;
    }
  } catch (e) {
    console.error("API/CLIENT/SIGNATURE ERROR", e);
    code = INTERNAL_SERVER_ERROR;
  } finally {
    res.status(code).send();
  }
}
