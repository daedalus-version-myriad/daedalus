module.exports = {
    apps: [
        ...[
            "automod",
            "autoresponder",
            "autoroles",
            "backend",
            "commander",
            "custom-roles",
            "interactions",
            "logging",
            "modmail",
            "reaction-roles-reactions",
            "starboard",
            "stats-channels",
            "sticky-roles",
            "supporter-announcements",
            "task-runner",
            "welcome",
            "xp",
        ].map((name) => ({
            name,
            cwd: `./packages/${name}`,
            script: "bun start",
        })),
        {
            name: "dashboard",
            cwd: "./packages/dashboard",
            script: "npm start",
        },
    ],
};
