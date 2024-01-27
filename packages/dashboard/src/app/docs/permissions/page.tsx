import Container from "@/components/Container";
import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";

export default function DocsPermissions() {
    return (
        <div className="center-col gap-8 py-16">
            <div className="center-col gap-2 md:gap-4">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl">Daedalus Documentation</h1>
                <h2 className="text-md sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">Permissions</h2>
            </div>
            <Container className="center-col">
                <div className="flex flex-col gap-4">
                    <a href="/docs">
                        <Button variant="outline" className="center-row gap-2">
                            <Icon icon="chevron-left"></Icon> Back
                        </Button>
                    </a>
                    <h1 className="text-2xl">Default Permissions</h1>
                    <p>
                        Some permissions are requested by default, particularly ones that do not open the possibility for abuse or exploits and are usually
                        granted to all or most members anyway.
                    </p>
                    <p>
                        You can disable these anyway, but note that we do not guarantee that features will work as expected even if they don&apos;t seem to
                        obviously need the permission. We will still seek to remove unneeded permission access whenever possible, so if you notice a feature
                        isn&apos;t working even though it seems like it should, please let us know.
                    </p>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <b>View Channel</b> is required for automod, autoresponder, logging, etc. Slash commands bypass this permission if you do not grant
                            it, but most features will not work if the bot cannot access the applicable channels.
                        </li>
                        <li>
                            <b>Send Messages</b> and <b>Send Messages in Threads</b> are required for similar reasons as <i>View Channel</i>.
                        </li>
                        <li>
                            <b>Embed Links</b> is required as most of the bot&apos;s messages are posted as embeds. If you deny this permission, many messages
                            will be mostly empty or not send at all.
                        </li>
                        <li>
                            <b>Attach Files</b> is required for logs or uploading files when a message&apos;s length overflows normal message limits.
                        </li>
                        <li>
                            <b>Read Message History</b> is used by operations like the purge command. Reaction roles that use reactions also need this
                            permission (though not prompts that use buttons or dropdowns).
                        </li>
                        <li>
                            <b>Use External Emoji</b> is highly recommended as the bot may use emoji from its home/support server or other emoji host servers.
                        </li>
                        <li>
                            <b>Add Reactions</b> is needed for reaction roles and reaction-based autoresponder triggers. Most features will work without this
                            but it is recommended to grant it.
                        </li>
                    </ul>
                    <h1 className="text-2xl">Module-Specific Permissions</h1>
                    <ul className="list-disc ml-4 space-y-2">
                        <li>
                            <b>Kick Members</b> is required for automod and the kick command.
                        </li>
                        <li>
                            <b>Ban Users</b> is required for automod, nukeguard, and ban-related commands (ban, unban, massban).
                        </li>
                        <li>
                            <b>Manage Channels</b> is required for stats channels, modmail, tickets, and the slowmode command.
                        </li>
                        <li>
                            <b>Manage Messages</b> is required for automod, count channels, and the purge command.
                        </li>
                        <li>
                            <b>Manage Roles</b> is required for many features including reaction roles, sticky roles, autoroles, and anything relating to mutes.
                        </li>
                        <li>
                            <b>Manage Threads</b> is required for modmail (if using thread mode).
                        </li>
                        <li>
                            <b>Create Public Threads</b> is required for modmail (if using thread mode).
                        </li>
                        <li>
                            <b>Timeout Members</b> is required for timeouts (automod and the timeout command).
                        </li>
                    </ul>
                </div>
            </Container>
        </div>
    );
}
