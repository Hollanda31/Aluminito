const ITEMS = [
    "Portas e Janelas",
    "Pele de Vidro",
    "Guarda-Corpo",
    "Portas Pivotantes",
    "Envidraçamento de Sacadas",
    "Coberturas",
];

function Row({ hidden }) {
    return (
        <div aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
            {ITEMS.map((item, i) => (
                <div key={item} className="flex items-center">
                    <span
                        className={`whitespace-nowrap px-8 font-display text-3xl font-bold uppercase tracking-tight sm:text-5xl ${
                            i % 2 ? "text-outline" : "text-silverlight"
                        }`}
                    >
                        {item}
                    </span>
                    <span className="h-2.5 w-2.5 shrink-0 rotate-45 bg-azul" />
                </div>
            ))}
        </div>
    );
}

export default function Marquee() {
    return (
        <div
            data-testid="marquee"
            className="marquee overflow-hidden border-y border-white/10 bg-graphite py-10 sm:py-12"
        >
            <div className="marquee-track flex w-max">
                <Row hidden={false} />
                <Row hidden={true} />
            </div>
        </div>
    );
}
