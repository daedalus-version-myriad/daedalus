import { secrets } from "@daedalus/config";
import { connect } from "@planetscale/database";

export const connection = connect({
    host: secrets.DATABASE.HOST,
    username: secrets.DATABASE.USERNAME,
    password: secrets.DATABASE.PASSWORD,
});
