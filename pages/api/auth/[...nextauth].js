import NextAuth from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export const authOptions = {
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
    }),
  ],
};

export default NextAuth(authOptions);
