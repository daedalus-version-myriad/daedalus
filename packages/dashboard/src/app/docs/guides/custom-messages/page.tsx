import Container from "@/components/Container";
import { Button } from "@/components/ui/button";
import { FaChevronLeft } from "react-icons/fa6";

export default function DocsCustomMessages() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Custom Messages</h2>
            </div>
            <Container className="center-col">
                <div className="flex flex-col gap-4">
                    <a href="/docs/guides">
                        <Button variant="outline" className="center-row gap-2">
                            <FaChevronLeft></FaChevronLeft> Back
                        </Button>
                    </a>
                    <h1 className="text-2xl">Custom Messages</h1>
                    <p>
                        Custom messages allow you to configure your own text to send to users for things such as supporter announcements or welcome messages.
                        They are also used for stats channels. In addition to writing static text, you can also set up dynamic text that changes depending on
                        certain variables.
                    </p>
                    <p>This guide goes over the mechanics of dynamic custom messages and not how to write a good one; that is up to your personal style.</p>
                    <h1 className="text-2xl">Basic Format</h1>
                    <p>
                        The basic format for dynamic custom messages is to simply insert a command block into the message using <code>{"{...}"}</code>.
                    </p>
                    <p>
                        For example, to mention the user in a welcome message, simply do <code>{"{mention}"}</code>.
                    </p>
                    <p>
                        There are also commands that take and manipulate other values. For example, to show &quot;you are the Nth member&quot;, you can do{" "}
                        <code>{"{ordinal {members}}"}</code> to get the &quot;Nth&quot;. Here, <code>ordinal</code> is a function that takes a number and
                        returns the ordinal format (&quot;Nth&quot;) for it, and <code>members</code> is a function that returns the number of members in the
                        server at the time.
                    </p>
                    <p>
                        To insert a literal <code>{"{"}</code>, just write <code>{"\\{"}</code>.
                    </p>
                    <h1 className="text-2xl">Members</h1>
                    <p>If the context targets a server member (e.g. welcome messages), the following are available:</p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <code>{"{avatar}"}</code>: the user&apos;s server-specific avatar if present, their user avatar otherwise
                        </li>
                        <li>
                            <code>{"{nickname}"}</code>: the member&apos;s nickname if they have one and their display name othewise
                        </li>
                        <li>
                            <code>{"{booster?"}</code>: whether or not the member is boosting the server
                        </li>
                    </ul>
                    <h1 className="text-2xl">Members &amp; Users</h1>
                    <p>If the context targets a server member (e.g. welcome messages) or a user, the following are available:</p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <code>{"{mention}"}</code>: mention the user — note that this only pings if in the message content and not in an embed
                        </li>
                        <li>
                            <code>{"{display-name}"}</code>: the user&apos;s display name
                        </li>
                        <li>
                            <code>{"{username}"}</code>: the user&apos;s username
                        </li>
                        <li>
                            <code>{"{tag}"}</code>: the user&apos;s tag, which is their username in the new system and <code>username#NNNN</code> in the old
                            system
                        </li>
                        <li>
                            <code>{"{discriminator}"}</code>: the user&apos;s discriminator, which is <code>&quot;0&quot;</code> in the new system and the four
                            numbers at the end of their tag in the old system (as a string)
                        </li>
                        <li>
                            <code>{"{banner}"}</code>: the user&apos;s banner URL (unfortunately, there is no way to get a member&apos;s server-specific banner
                            for some reason)
                        </li>
                        <li>
                            <code>{"{bot?}"}</code>: whether the user is a bot
                        </li>
                        <li>
                            <code>{"{user-avatar}"}</code>: the user&apos;s global avatar (ignores their server profile)
                        </li>
                    </ul>
                    <h1 className="text-2xl">Roles</h1>
                    <p>If the context targets a role (e.g. supporter announcements), the following are available:</p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <code>{"{role-icon}"}</code>: the role&apos;s icon URL
                        </li>
                        <li>
                            <code>{"{role-members}"}</code>: the number of members with the role
                        </li>
                        <li>
                            <code>{"{role-name}"}</code>: the role&apos;s name
                        </li>
                        <li>
                            <code>{"{hoist?}"}</code>: whether or not the role is hoisted (displays members with the role separately on the member list)
                        </li>
                    </ul>
                    <h1 className="text-2xl">Guilds</h1>
                    <p>If the context targets a server (always), the following are available:</p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <code>{"{server}"}</code>: the server&apos;s name
                        </li>
                        <li>
                            <code>{"{members}"}</code>: the number of members in the server
                        </li>
                        <li>
                            <code>{"{boosts}"}</code>: the number of boosts (not the number of boosting members)
                        </li>
                        <li>
                            <code>{"{tier}"}</code>: the server&apos;s boost tier (0, 1, 2, or 3)
                        </li>
                        <li>
                            <code>{"{server-icon}"}</code>: the server&apos;s icon URL
                        </li>
                        <li>
                            <code>{"{server-banner}"}</code>: the server&apos;s banner URL
                        </li>
                        <li>
                            <code>{"{server-splash}"}</code>: the server&apos;s discovery splash image URL
                        </li>
                        <li>
                            <code>{"{bots}"}</code>: the number of bots in the server
                        </li>
                        <li>
                            <code>{"{humans}"}</code>: the number of non-bot members in the server
                        </li>
                        <li>
                            <code>{"{boosters}"}</code>: the number of boosting members (not the number of boosts)
                        </li>
                    </ul>
                    <h1 className="text-2xl">Functions</h1>
                    <p>
                        The following functions are globally available to manipulate the values. Most values are strings (text), but some are numbers and yes/no
                        values are represented as <code>0</code> for false and <code>1</code> for true.
                    </p>
                    <p>
                        Note that these may be confusing to people who have no experience with programming. For the most part, you do not need to use these. The
                        most important ones are <code>?</code> (as it allows you to switch between different messages for different occasions),{" "}
                        <code>random</code>, and <code>ordinal</code>.
                    </p>
                    <p>
                        Arguments surrounded by <code>[]</code> are optional. <code>...</code> indicates that an arbitrary number of arguments are allowed.
                    </p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <code>{"{? a b [c]}"}</code>: if a is true-like (non-empty string or non-zero number), returns b, and otherwise returns c (or
                            &quot;&quot; if c is missing)
                        </li>
                        <li>
                            <code>{"{!= ...}"}</code>: returns 1 if all provided values are unique and 0 otherwise (at least 2 values)
                        </li>
                        <li>
                            <code>{"{random ...}"}</code>: randomly choose one of the given values (least 1 value)
                        </li>
                        <li>
                            <code>{"{list ...}"}</code>: create a list from the provided values
                        </li>
                        <li>
                            <code>{"{! x}"}</code>: returns 1 if x is false-like (empty string or 0) and 0 otherwise
                        </li>
                        <li>
                            <code>{"{length x}"}</code>: returns the length of a list
                        </li>
                        <li>
                            <code>{"{ordinal #}"}</code>: s the &quot;Nth&quot; form of a number (1st, 2nd, 3rd, etc.) (works for negative numbers)
                        </li>
                        <li>
                            <code>{"{join x y}"}</code>: returns the values in list x as strings joined on string y
                        </li>
                        <li>
                            <code>{"{+ ...}"}</code>: returns the sum of a list of values, converting into numbers (at least 1 value)
                        </li>
                        <li>
                            <code>{"{- ...}"}</code>: chain subtraction; <code>{"{- x y z}"}</code> is x - y - z, converting into numbers (at least 1 value)
                        </li>
                        <li>
                            <code>{"{* ...}"}</code>: returns the product of a list of values, converting into numbers (at least 1 value)
                        </li>
                        <li>
                            <code>{"{/ ...}"}</code>: chain division; <code>{"{/ x y z}"} is x / y / z</code> (at least 1 value)
                        </li>
                        <li>
                            <code>{"{ ...}"}</code>: chain floor division; <code>{"{5 2}"}</code> returns 2 and not 2.5 (at least 1 value)
                        </li>
                        <li>
                            <code>{"{# x}"}</code>: returns the length of a list
                        </li>
                        <li>
                            <code>{"{# ...}"}</code>: index access; <code>{"{# w x y z}"}</code> is equivalent to a[b][c][d]
                        </li>
                        <li>
                            <code>{"{% ...}"}</code>: chain modulo (remainder after division); e.g. <code>{"</>{% 7 3} is 1"}</code> (at least 1 value)
                        </li>
                        <li>
                            <code>{"{^ ...}"}</code>: chain exponentiation; e.g. <code>{"{^ x y z}"}</code> is (x ^ y) ^ z (at least 1 value)
                        </li>
                        <li>
                            <code>{"{&& ...}"}</code>: logical AND (return the first false-like value or the last value if all are true-like) (at least 1 value)
                        </li>
                        <li>
                            <code>{"{|| ...}"}</code>: logical OR (return the first true-like value or the last value if all are false-like) (at least 1 value)
                        </li>
                        <li>
                            <code>{"{++ ...}"}</code>: concatenate lists together (at least 1 value)
                        </li>
                        <li>
                            <code>{"{= ...}"}</code>: returns 1 if all provided values are equal and 0 otherwise (at least 1 value)
                        </li>
                        <li>
                            <code>{"{> ...}"}</code>: returns 1 if all provided values are in strictly descending order and 0 otherwise (at least 1 value)
                        </li>
                        <li>
                            <code>{"{>= ...}"}</code>: returns 1 if all provided values are in non-increasing order and 0 otherwise (at least 1 value)
                        </li>
                        <li>
                            <code>{"{< ...}"}</code>: returns 1 if all provided values are in strictly increasing order and 0 otherwise (at least 1 value)
                        </li>
                        <li>
                            <code>{"{<= ...}"}</code>: returns 1 if all provided values are non-decreasing order and 0 otherwise (at least 1 value)
                        </li>
                    </ul>
                    <h1 className="text-2xl">Values</h1>
                    <p>
                        You can also insert values into functions. To include a number, just enter the number. To include a string, surround it with quotes.
                        Both <code>&quot;...&quot;</code> and <code>&apos;...&apos;</code>work the same way. If you wish to include the same type of quotes
                        within the string, escape them like so: <code>&quot;hello \&quot; world&quot;</code>.
                    </p>
                </div>
            </Container>
        </div>
    );
}
