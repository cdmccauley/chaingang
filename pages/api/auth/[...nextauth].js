import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

import clientPromise from "../../../lib/mongodb";

export const authOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    }),
  ],
};

export default async function auth(req, res) {
  if (
    req?.query?.nextauth[0] === "signin" ||
    req?.query?.nextauth[0] === "signout"
  ) {
    const id = new URL(req.body.callbackUrl).searchParams.get("id");
    console.log(id, req.body.csrfToken);
  }

  return await NextAuth(req, res, authOptions);
}
