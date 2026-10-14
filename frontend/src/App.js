import { Component, useEffect } from "react";
import "@/App.css";
import { initLenis } from "@/lib/scroll";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Sobre from "@/components/Sobre";
import Produtos from "@/components/Produtos";
import Projetos from "@/components/Projetos";
import Depoimentos from "@/components/Depoimentos";
import Contato from "@/components/Contato";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (
                <div className="grid min-h-screen place-items-center bg-graphite px-6 text-center text-silver">
                    <p>Algo deu errado ao carregar a página. Recarregue em instantes.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

function App() {
    useEffect(() => {
        initLenis();
    }, []);

    return (
        <ErrorBoundary>
            <div className="bg-graphite font-body text-graphite antialiased">
                <Header />
                <main>
                    <Hero />
                    <Marquee />
                    <Sobre />
                    <Produtos />
                    <Projetos />
                    <Depoimentos />
                    <Contato />
                </main>
                <Footer />
                <FloatingWhatsApp />
                <div className="grain" aria-hidden="true" />
            </div>
        </ErrorBoundary>
    );
}

export default App;
