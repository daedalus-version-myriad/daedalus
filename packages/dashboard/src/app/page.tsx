export default async function Home() {
    return (
        <>
            {new Array(100).fill(0).map((_, i) => (
                <p key={`${i}`}>hello</p>
            ))}
        </>
    );
}
