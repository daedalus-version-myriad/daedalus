import NextAuth from "next-auth";
import authOptions from "../../../../../auth-options";

const auth = NextAuth(authOptions);

export { auth as GET, auth as POST };
