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
    // async jwt(props) {
    //   if (props?.token?.sub) {
    //     const mongo = await clientPromise;
    //     const frontend = await mongo.db("frontend");
    //     const participants = await frontend.collection("participants");

    //     await participants.updateOne(
    //       {
    //         sid: props.token.sub,
    //       },
    //       {
    //         $set: {
    //           jwt: props,
    //           by: "jwt",
    //           updated: new Date().valueOf(),
    //         },
    //       },
    //       { upsert: true }
    //     );
    //   }

    //   return props.token;
    // },
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

        // gating

        let assets = [];
        let links = [];

        const date = new Date();

        if (participant) {
          if (
            !participant?.updates?.assets_update?.epoch ||
            participant?.updates?.assets_update?.epoch <=
              date.valueOf() - 1800000
          ) {
            const root =
              process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
                ? "http://localhost:3000"
                : `https://www.${process.env.NEXT_PUBLIC_PROD_HOST}`;

            const url = `${root}/api/client/assets/update/${participant.sid}`;

            await fetch(url, {
              method: "GET",
              headers: {
                "X-API-KEY": process.env.LOOPRING_API_KEY,
              },
            });
          } else {
            if (participant?.unlocks && participant?.unlocks?.length > 0) {
              assets = participant?.unlocks
                ?.map((u) => {
                  if (u.type == "file") return u;
                })
                .filter((u) => u);
            }
            if (participant?.files && participant?.files?.length > 0) {
              links = participant.files;
            }
          }
        }

        // end gating

        let feature = undefined;

        if (participant?.access) {
          const access = await frontend.collection("access");
          const key = crypto.randomUUID();

          const user = await access.findOneAndUpdate(
            { sid: props.token.sub },
            { $set: { key: key } }
          );

          feature = {
            key: key,
            features: user.value.features,
            configs: user.value.configs,
          };
        }

        return {
          session: props.session,
          token: props.token,
          id: id,
          features: feature,
          links: links,
          assets: assets,
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
