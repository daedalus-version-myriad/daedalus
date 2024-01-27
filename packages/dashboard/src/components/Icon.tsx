export default function Icon({ icon, brand, className = "" }: { icon: string; brand?: boolean; className?: string }) {
    return <i className={`fa-${brand ? "brands" : "solid"} fa-${icon} ${className}`}></i>;
}
