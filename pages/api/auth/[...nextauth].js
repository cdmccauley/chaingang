import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";
import DiscordProvider from "next-auth/providers/discord";
import SpotifyProvider from "next-auth/providers/spotify";

import clientPromise from "../../../lib/mongodb";

import crypto from "crypto";

export const authOptions = {
  // debug: true,
  // pages: { signIn: "/signin" },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    }),
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn(props) {
      if (props?.user?.id) {
        const mongo = await clientPromise;
        const frontend = await mongo.db("frontend");
        const participants = await frontend.collection("participants");

        await participants.updateOne(
          {
            sid: props?.user?.id,
          },
          {
            $set: {
              signin: props,
              by: "signin",
              updated: new Date().valueOf(),
            },
          },
          { upsert: true }
        );
      }

      return true;
    },
    async jwt(props) {
      if (props?.token?.sub) {
        const mongo = await clientPromise;
        const frontend = await mongo.db("frontend");
        const participants = await frontend.collection("participants");

        await participants.updateOne(
          {
            sid: props.token.sub,
          },
          {
            $set: {
              jwt: props,
              by: "jwt",
              updated: new Date().valueOf(),
            },
          },
          { upsert: true }
        );
      }

      return props.token;
    },
    async session(props) {
      const mongo = await clientPromise;
      const frontend = await mongo.db("frontend");
      const participants = await frontend.collection("participants");

      if (props?.token?.sub) {
        const participant = await participants.findOne({
          sid: props.token.sub,
        });

        const id = crypto.randomUUID();

        await participants.updateOne(
          {
            sid: props.token.sub,
          },
          {
            $set: {
              id: id,
              nonce: participant ? participant.id : undefined,
              session: props,
              by: "session",
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
      } else {
        return {
          session: props.session,
          token: props.token,
        };
      }
    },
  },
};

export default async function auth(req, res) {
  //
  return await NextAuth(req, res, authOptions);
}
