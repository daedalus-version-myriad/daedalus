import Argentium from "../../argentium/index.js";
import { getColor } from "../../bot-utils/index.js";

export default (app: Argentium) =>
    app.allowInDms("random").commands((x) =>
        x
            .slash((x) =>
                x
                    .key("random choose")
                    .description("randomly choose an item from a list of options")
                    .stringOption("option-1", "one of the options", { required: true })
                    .stringOption("option-2", "one of the options", { required: true })
                    .stringOption("option-3", "one of the options")
                    .stringOption("option-4", "one of the options")
                    .stringOption("option-5", "one of the options")
                    .stringOption("option-6", "one of the options")
                    .stringOption("option-7", "one of the options")
                    .stringOption("option-8", "one of the options")
                    .stringOption("option-9", "one of the options")
                    .stringOption("option-10", "one of the options")
                    .fn(async ({ _, ..._options }) => {
                        const options = Object.values(_options)
                            .filter((x) => x)
                            .map((x) => x!);

                        return {
                            embeds: [
                                {
                                    title: "Random Choice",
                                    description: options[Math.floor(Math.random() * options.length)],
                                    color: _.guild ? await getColor(_.guild) : 0x009688,
                                },
                            ],
                        };
                    }),
            )
            .slash((x) =>
                x
                    .key("random flip")
                    .description("flip a coin")
                    .numberOption("heads-chance", "the chance to get heads as a percentage", { float: true, minimum: 0, maximum: 100 })
                    .fn(async ({ _, "heads-chance": chance }) => {
                        chance ??= 50;

                        return {
                            embeds: [
                                {
                                    title: Math.random() * 100 < chance ? "Heads" : "Tails",
                                    description: chance === 50 ? undefined : `You flipped a coin with a ${Math.round(chance * 100) / 100}% chance to be heads.`,
                                    color: _.guild ? await getColor(_.guild) : 0x009688,
                                },
                            ],
                        };
                    }),
            )
            .slash((x) =>
                x
                    .key("random roll")
                    .description("roll dice")
                    .stringOption("configuration", "randomly roll dice; specify dice configurations D&D-style (default: 1d6)", { maxLength: 1000 })
                    .fn(async ({ _, configuration: cfg }) => {
                        cfg ??= "1d6";

                        if (!cfg.match(/^[+-]/)) cfg = `+${cfg}`;
                        if (!cfg.match(/^(\s*[+-]\s*(\d*d\d*|\d+))+$/)) throw "Invalid dice configuration; expected something like `1d6 + 2d4 - 3d3 + 2`.";

                        let value = 0;
                        const dice = cfg.match(/[+-]\s*(\d*d\d*|\d+)/g)!;

                        let total = 0;
                        const to_roll: { multiplier: 1 | -1; quantity: number; size: number }[] = [];

                        for (let die of dice) {
                            die = die.replace(/\s+/g, "");
                            const multiplier = die[0] === "+" ? 1 : -1;
                            die = die.substring(1);

                            if (die.match(/^\d+$/)) value += multiplier * parseInt(die);
                            else {
                                const [l, r] = die.split("d");
                                const quantity = parseInt(l || "1");
                                const size = parseInt(r || "6");

                                total += quantity;

                                if (total > 1000) throw "You may only roll up to 1000 dice.";
                                if (size > 1000) throw "You may only roll dice with up to 1000 faces.";

                                to_roll.push({ multiplier, quantity, size });
                            }
                        }

                        for (const { multiplier, quantity, size } of to_roll)
                            for (let x = 0; x < quantity; x++) value += multiplier * Math.floor(Math.random() * size + 1);

                        return {
                            embeds: [
                                {
                                    title: "Roll",
                                    description: `You rolled ${value}!\n\n\`${cfg
                                        .replaceAll(/\s+/g, "")
                                        .replace(/^\+/, "")
                                        .replaceAll("+", " + ")
                                        .replaceAll("-", " - ")}\``,
                                    color: _.guild ? await getColor(_.guild) : 0x009688,
                                },
                            ],
                        };
                    }),
            ),
    );
