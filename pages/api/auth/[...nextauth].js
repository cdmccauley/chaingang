import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

import clientPromise from "../../../lib/mongodb";

import crypto from "crypto";

export const authOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session(props) {
      const mongo = await clientPromise;
      const frontend = await mongo.db("frontend");
      const participants = await frontend.collection("participants");

      const participant = await participants.findOne({
        name: props.session.user.name,
        email: props.session.user.email,
      });

      const id = crypto.randomUUID();

      await participants.updateOne(
        {
          name: props.session.user.name,
          email: props.session.user.email,
        },
        {
          $set: {
            id: id,
            nonce: participant ? participant.id : undefined,
            updated: new Date().valueOf(),
          },
        },
        { upsert: true }
      );

      return {
        session: props.session,
        token: props.token,
        id: id,
      };
    },
  },
};

export default async function auth(req, res) {
  //
  return await NextAuth(req, res, authOptions);
}
