import { trpc } from "@daedalus/api";

export async function POST(request: Request) {
    const data = await request.json();

    const checkout = data.type === "checkout.session.completed";

    if (checkout) await trpc.pairCustomer.mutate({ discord: data.data.object.metadata.id, stripe: data.data.object.customer });

    if (checkout || data.type.startsWith("customer.subscription")) {
        const id = await trpc.getCustomer.query(data.data.object.customer);
        if (!id) return new Response();

        await trpc.recalculateKeysForUser.mutate(id);
    }

    return new Response();
}
