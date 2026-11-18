import { Component, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@/App.css";
import { initLenis } from "@/lib/scroll";
import Header from "@/components/Header";
import AvisoTopo from "@/components/AvisoTopo";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Sobre from "@/components/Sobre";
import CatalogoCores from "@/components/CatalogoCores";
import Projetos from "@/components/Projetos";
import Depoimentos from "@/components/Depoimentos";
import Contato from "@/components/Contato";
import OrcamentoModal from "@/components/OrcamentoModal";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CookieConsent from "@/components/CookieConsent";
import ManutencaoPopup from "@/components/ManutencaoPopup";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";
import LegalPage from "@/pages/LegalPage";
import { SiteConfigProvider } from "@/lib/SiteConfig";

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

function Landing() {
    return (
        <div className="public-site bg-graphite font-body text-silver antialiased">
            <a href="#conteudo-principal" className="sr-only z-[120] rounded bg-white px-4 py-3 font-semibold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
                Ir para o conteúdo principal
            </a>
            <AvisoTopo />
            <Header />
            <main id="conteudo-principal" tabIndex={-1}>
                <Hero />
                <Marquee />
                <Sobre />
                <CatalogoCores />
                <Projetos />
                <Depoimentos />
                <Contato />
            </main>
            <Footer />
            <FloatingWhatsApp />
            <OrcamentoModal />
            <div className="grain" aria-hidden="true" />
            <ManutencaoPopup />
        </div>
    );
}

function App() {
    useEffect(() => {
        initLenis();
    }, []);

    return (
        <ErrorBoundary>
            <BrowserRouter>
                <SiteConfigProvider>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/:slug" element={<LegalPage />} />
                    </Routes>
                    <CookieConsent />
                </SiteConfigProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
