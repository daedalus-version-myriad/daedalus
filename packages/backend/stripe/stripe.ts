import { secrets } from "@daedalus/config";
import Stripe from "stripe";

export default new Stripe(secrets.STRIPE.SECRET_KEY);
