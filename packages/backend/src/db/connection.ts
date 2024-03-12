import mysql from "mysql2";
import { secrets } from "../../../config/index.js";

export const connection = mysql.createConnection({
    host: secrets.DATABASE.HOST,
    user: secrets.DATABASE.USERNAME,
    database: secrets.DATABASE.NAME,
    password: secrets.DATABASE.PASSWORD,
});
