module.exports = {
    apps: [
        {
            name: "backend",
            script: "npm start",
        },
        {
            name: "dashboard",
            cwd: "./packages/dashboard",
            script: "npm start",
        },
    ],
};
