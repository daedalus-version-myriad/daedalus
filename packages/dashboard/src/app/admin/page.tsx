import Container from "@/components/Container";

export default function AdminHome() {
    return (
        <Container>
            <div className="mt-8">
                <h1 className="text-2xl">Admin Dashboard</h1>
                <ul className="list-disc ml-4">
                    <li>
                        <a href="/admin/news" className="link">
                            News / Latest Updates
                        </a>
                    </li>
                </ul>
            </div>
        </Container>
    );
}
