import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { Star } from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Depoimentos() {
    const [reviews, setReviews] = useState([]);
    const [name, setName] = useState("");
    const [role, setRole] = useState("");
    const [place, setPlace] = useState("");
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let active = true;

        const loadReviews = async () => {
            try {
                if (!BACKEND) throw new Error("Backend URL não configurada");

                const response = await fetch(`${BACKEND}/api/reviews`);
                if (!response.ok) throw new Error("Falha ao carregar avaliações");

                const data = await response.json();
                if (active) setReviews(data);
            } catch {
                if (active) {
                    setError("Não foi possível carregar as avaliações agora.");
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        loadReviews();
        return () => {
            active = false;
        };
    }, []);

    const average = reviews.length
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

    const submitReview = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!BACKEND) {
            setError("Não foi possível enviar sua avaliação. Tente novamente mais tarde.");
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${BACKEND}/api/reviews`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    role: role.trim(),
                    place: place.trim(),
                    rating,
                    text: text.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error("Não foi possível enviar sua avaliação.");
            }

            const savedReview = await response.json();
            setReviews((current) => [savedReview, ...current]);
            setName("");
            setRole("");
            setPlace("");
            setRating(5);
            setText("");
            setNotice("Obrigado por avaliar a Aluminito!");
        } catch {
            setError("Não foi possível enviar sua avaliação. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section
            id="depoimentos"
            data-testid="depoimentos-section"
            className="bg-mist py-24 sm:py-32"
        >
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">
                        Avaliações
                    </p>
                    <h2 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-graphite sm:text-4xl lg:text-[2.75rem]">
                        Conte como foi sua experiência.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                        Sua opinião ajuda outras pessoas a conhecerem o trabalho da Aluminito.
                    </p>
                </Reveal>

                <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <Reveal>
                        <div className="rounded-3xl bg-graphite p-8 text-white sm:p-10">
                            <p className="text-sm font-medium text-silver/70">
                                Nota média dos clientes
                            </p>
                            <div className="mt-4 flex items-end gap-3">
                                <span className="font-display text-5xl font-bold">
                                    {reviews.length ? average.toFixed(1) : "—"}
                                </span>
                                <span className="pb-1 text-sm text-silver/60">
                                    {reviews.length === 1
                                        ? "1 avaliação"
                                        : `${reviews.length} avaliações`}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-1" aria-label="Nota média">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <Star
                                        key={value}
                                        size={18}
                                        className={
                                            value <= Math.round(average)
                                                ? "fill-azul text-azul"
                                                : "text-slate-500"
                                        }
                                    />
                                ))}
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-silver/70">
                                {loading
                                    ? "Carregando avaliações…"
                                    : reviews.length
                                      ? "Avaliações enviadas por clientes da Aluminito."
                                      : "Ainda não há avaliações. Seja a primeira pessoa a avaliar!"}
                            </p>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <form
                            data-testid="review-form"
                            onSubmit={submitReview}
                            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
                        >
                            <h3 className="font-display text-xl font-bold text-graphite">
                                Faça sua avaliação
                            </h3>

                            <div className="mt-5">
                                <span className="block text-sm font-medium text-slate-700">
                                    Sua nota
                                </span>
                                <div className="mt-2 flex gap-1">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button
                                            key={value}
                                            type="button"
                                            data-testid={`review-rating-${value}`}
                                            onClick={() => setRating(value)}
                                            aria-label={`Dar ${value} ${value === 1 ? "estrela" : "estrelas"}`}
                                            aria-pressed={rating === value}
                                            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-azul"
                                        >
                                            <Star
                                                size={25}
                                                className={
                                                    value <= rating
                                                        ? "fill-azul text-azul"
                                                        : "text-slate-300"
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium text-slate-700">
                                    Seu nome
                                    <input
                                        required
                                        minLength={2}
                                        maxLength={80}
                                        data-testid="review-input-name"
                                        value={name}
                                        onChange={(event) => setName(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-graphite focus:border-azul focus:ring-2 focus:ring-azul/20"
                                        placeholder="Nome"
                                    />
                                </label>
                                <label className="text-sm font-medium text-slate-700">
                                    Cidade (opcional)
                                    <input
                                        maxLength={80}
                                        data-testid="review-input-place"
                                        value={place}
                                        onChange={(event) => setPlace(event.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-graphite focus:border-azul focus:ring-2 focus:ring-azul/20"
                                        placeholder="Ex.: Serra - ES"
                                    />
                                </label>
                            </div>

                            <label className="mt-4 block text-sm font-medium text-slate-700">
                                Comentário
                                <textarea
                                    required
                                    minLength={10}
                                    maxLength={1000}
                                    rows={4}
                                    data-testid="review-input-text"
                                    value={text}
                                    onChange={(event) => setText(event.target.value)}
                                    className="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal text-graphite focus:border-azul focus:ring-2 focus:ring-azul/20"
                                    placeholder="Conte como foi sua experiência com a empresa"
                                />
                            </label>

                            <p className="mt-3 text-xs leading-relaxed text-slate-500">
                                Ao enviar, sua avaliação e seu nome ficarão visíveis publicamente no site.
                            </p>

                            {error && (
                                <p data-testid="review-form-error" role="alert" className="mt-3 text-sm text-red-600">
                                    {error}
                                </p>
                            )}
                            {notice && (
                                <p data-testid="review-form-notice" role="status" className="mt-3 text-sm text-green-700">
                                    {notice}
                                </p>
                            )}

                            <button
                                type="submit"
                                data-testid="review-submit"
                                disabled={submitting}
                                className="mt-5 inline-flex items-center justify-center rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? "Enviando…" : "Enviar avaliação"}
                            </button>
                        </form>
                    </Reveal>
                </div>

                <div className="mt-14">
                    <h3 className="font-display text-2xl font-bold text-graphite">
                        Avaliações dos clientes
                    </h3>

                    {error && !reviews.length && (
                        <p role="status" className="mt-4 text-sm text-slate-600">
                            As avaliações não puderam ser carregadas agora.
                        </p>
                    )}

                    {!loading && !reviews.length ? (
                        <p className="mt-4 text-sm text-slate-600">
                            As avaliações enviadas aparecerão aqui.
                        </p>
                    ) : (
                        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {reviews.map((review, index) => (
                                <Reveal
                                    key={review.id}
                                    delay={Math.min(index * 0.05, 0.2)}
                                    className="h-full"
                                >
                                    <figure data-testid={`public-review-${review.id}`} className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 transition-shadow duration-300 hover:shadow-xl hover:shadow-slate-200/70">
                                        <div
                                            className="flex gap-1"
                                            aria-label={`Avaliação ${review.rating} de 5`}
                                        >
                                            {[1, 2, 3, 4, 5].map((value) => (
                                                <Star
                                                    key={value}
                                                    size={16}
                                                    className={
                                                        value <= review.rating
                                                            ? "fill-azul text-azul"
                                                            : "text-slate-300"
                                                    }
                                                />
                                            ))}
                                        </div>
                                        <blockquote className="mt-5 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                                            “{review.text}”
                                        </blockquote>
                                        <figcaption className="mt-7 border-t border-slate-100 pt-5">
                                            <p className="font-display font-semibold text-graphite">
                                                {review.name}
                                            </p>
                                            {(review.role || review.place) && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    {[review.role, review.place]
                                                        .filter(Boolean)
                                                        .join(" · ")}
                                                </p>
                                            )}
                                        </figcaption>
                                    </figure>
                                </Reveal>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
