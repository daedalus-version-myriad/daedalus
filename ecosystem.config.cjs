module.exports = {
    apps: [
        {
            name: "backend",
            cwd: `./packages/backend`,
            script: "bun start",
        },
        {
            name: "dashboard",
            cwd: "./packages/dashboard",
            script: "npm start",
        },
    ],
};
