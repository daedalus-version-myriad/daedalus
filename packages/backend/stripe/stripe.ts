import { secrets } from "../../config/index.js";
import Stripe from "stripe";

export default new Stripe(secrets.STRIPE.SECRET_KEY);
