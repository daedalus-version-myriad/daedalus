import { getServerSession } from "next-auth";
import authOptions from "../../auth-options";
import SignIn from "../../components/SignIn";

export default async function Home() {
    const session = await getServerSession(authOptions);
    console.log(session);
    return <SignIn></SignIn>;
}
