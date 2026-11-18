import { useEffect, useState } from "react";
import Reveal from "@/components/Reveal";
import { Star } from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function Depoimentos() {
    const [reviews, setReviews] = useState([]);
    const [name, setName] = useState("");
    const [place, setPlace] = useState("");
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");
    const [publishConsent, setPublishConsent] = useState(false);
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
                if (active) setReviews(Array.isArray(data) ? data : []);
            } catch {
                if (active) setError("Não foi possível carregar as avaliações agora.");
            } finally {
                if (active) setLoading(false);
            }
        };
        loadReviews();
        return () => { active = false; };
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
                    place: place.trim(),
                    rating,
                    text: text.trim(),
                    publish_consent: publishConsent,
                }),
            });
            if (!response.ok) throw new Error("Não foi possível enviar sua avaliação.");
            setName("");
            setPlace("");
            setRating(5);
            setText("");
            setPublishConsent(false);
            setNotice("Avaliação recebida. Ela só será publicada depois da confirmação pela equipe.");
        } catch {
            setError("Não foi possível enviar sua avaliação. Tente novamente.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="depoimentos" data-testid="depoimentos-section" className="bg-graphite2 py-24 sm:py-32">
            <div className="mx-auto max-w-7xl px-5 sm:px-8">
                <Reveal className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-azul">Avaliações</p>
                    <h2 className="mt-4 font-display text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
                        Conte como foi sua experiência.
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-silverlight sm:text-lg">
                        Avaliações são revisadas e confirmadas pela equipe antes de aparecerem no site.
                    </p>
                </Reveal>

                <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                    <Reveal>
                        <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-8 text-white sm:p-10">
                            <p className="text-sm font-medium text-silverlight">Média das avaliações publicadas</p>
                            <div className="mt-4 flex items-end gap-3">
                                <span className="font-display text-5xl font-bold">{reviews.length ? average.toFixed(1) : "—"}</span>
                                <span className="pb-1 text-sm text-silverlight">
                                    {reviews.length === 1 ? "1 avaliação confirmada" : `${reviews.length} avaliações confirmadas`}
                                </span>
                            </div>
                            <div className="mt-4 flex gap-1" role="img" aria-label={`Média ${reviews.length ? average.toFixed(1) : "sem avaliações"} de 5 estrelas`}>
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <Star key={value} size={18} className={value <= Math.round(average) ? "fill-azul text-azul" : "text-silver/50"} aria-hidden="true" />
                                ))}
                            </div>
                            <p className="mt-6 text-sm leading-relaxed text-silverlight" aria-live="polite">
                                {loading ? "Carregando avaliações…" : reviews.length ? "Somente avaliações confirmadas pela equipe são exibidas." : "Ainda não há avaliações confirmadas publicadas."}
                            </p>
                        </div>
                    </Reveal>

                    <Reveal delay={0.1}>
                        <form data-testid="review-form" onSubmit={submitReview} className="rounded-3xl border border-white/10 bg-[#171717] p-6 sm:p-8">
                            <h3 className="font-display text-xl font-bold text-white">Envie uma avaliação</h3>
                            <p className="mt-2 text-sm leading-relaxed text-silverlight">A equipe compara a avaliação com os registros de atendimento antes de publicar.</p>

                            <fieldset className="mt-5">
                                <legend className="text-sm font-medium text-silverlight">Sua nota</legend>
                                <div className="mt-2 flex gap-1" role="group" aria-label="Escolha uma nota de 1 a 5 estrelas">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <button key={value} type="button" data-testid={`review-rating-${value}`} onClick={() => setRating(value)} aria-label={`Dar ${value} ${value === 1 ? "estrela" : "estrelas"}`} aria-pressed={rating === value} className="rounded p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-azul">
                                            <Star size={25} className={value <= rating ? "fill-azul text-azul" : "text-silver/60"} aria-hidden="true" />
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="text-sm font-medium text-silverlight">
                                    Seu nome
                                    <input required minLength={2} maxLength={80} autoComplete="name" data-testid="review-input-name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#202020] px-4 py-3 text-sm font-normal text-white placeholder:text-silver/75 focus:border-azul focus:ring-2 focus:ring-azul/30" placeholder="Nome" />
                                </label>
                                <label className="text-sm font-medium text-silverlight">
                                    Cidade (opcional)
                                    <input maxLength={80} autoComplete="address-level2" data-testid="review-input-place" value={place} onChange={(event) => setPlace(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#202020] px-4 py-3 text-sm font-normal text-white placeholder:text-silver/75 focus:border-azul focus:ring-2 focus:ring-azul/30" placeholder="Ex.: Serra - ES" />
                                </label>
                            </div>

                            <label className="mt-4 block text-sm font-medium text-silverlight">
                                Comentário
                                <textarea required minLength={10} maxLength={1000} rows={4} data-testid="review-input-text" value={text} onChange={(event) => setText(event.target.value)} className="mt-2 w-full resize-y rounded-xl border border-white/15 bg-[#202020] px-4 py-3 text-sm font-normal text-white placeholder:text-silver/75 focus:border-azul focus:ring-2 focus:ring-azul/30" placeholder="Conte como foi sua experiência com a empresa" />
                            </label>

                            <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-silverlight">
                                <input required type="checkbox" checked={publishConsent} onChange={(event) => setPublishConsent(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-red-600" />
                                <span>Autorizo a publicação do meu nome, nota, cidade (se informada) e comentário caso a equipe confirme que esta avaliação corresponde à experiência de um cliente. Posso pedir a remoção pelo WhatsApp.</span>
                            </label>

                            {error && <p data-testid="review-form-error" role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
                            {notice && <p data-testid="review-form-notice" role="status" className="mt-3 text-sm text-emerald-300">{notice}</p>}

                            <button type="submit" data-testid="review-submit" disabled={submitting} className="mt-5 inline-flex items-center justify-center rounded-full bg-azul px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-azul-dark disabled:cursor-not-allowed disabled:opacity-60">
                                {submitting ? "Enviando…" : "Enviar avaliação"}
                            </button>
                        </form>
                    </Reveal>
                </div>

                <div className="mt-14">
                    <h3 className="font-display text-2xl font-bold text-white">Avaliações confirmadas</h3>
                    {error && !reviews.length && <p role="status" className="mt-4 text-sm text-silverlight">As avaliações não puderam ser carregadas agora.</p>}
                    {!loading && !reviews.length ? (
                        <p className="mt-4 text-sm text-silverlight">Não há avaliações confirmadas publicadas neste momento.</p>
                    ) : (
                        <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {reviews.map((review, index) => (
                                <Reveal key={review.id} delay={Math.min(index * 0.05, 0.2)} className="h-full">
                                    <figure data-testid={`public-review-${review.id}`} className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#171717] p-7 transition-shadow duration-300 hover:shadow-xl hover:shadow-black/40">
                                        <div className="flex gap-1" role="img" aria-label={`Avaliação ${review.rating} de 5 estrelas`}>
                                            {[1, 2, 3, 4, 5].map((value) => <Star key={value} size={16} className={value <= review.rating ? "fill-azul text-azul" : "text-silver/50"} aria-hidden="true" />)}
                                        </div>
                                        <blockquote className="mt-5 flex-1 whitespace-pre-wrap text-[15px] leading-relaxed text-silverlight">“{review.text}”</blockquote>
                                        <figcaption className="mt-7 border-t border-white/10 pt-5">
                                            <p className="font-display font-semibold text-white">{review.name}</p>
                                            {review.place && <p className="mt-0.5 text-xs text-silver/90">{review.place}</p>}
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
