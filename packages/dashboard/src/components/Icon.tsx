export default function Icon({ icon, brand }: { icon: string; brand?: boolean }) {
    return <i className={`fa-${brand ? "brands" : "solid"} fa-${icon}`}></i>;
}
