import { Component, useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "@/App.css";
import { initLenis } from "@/lib/scroll";
import Header from "@/components/Header";
import AvisoTopo from "@/components/AvisoTopo";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Sobre from "@/components/Sobre";
import Produtos from "@/components/Produtos";
import CatalogoCores from "@/components/CatalogoCores";
import Projetos from "@/components/Projetos";
import Depoimentos from "@/components/Depoimentos";
import Contato from "@/components/Contato";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import AdminLogin from "@/pages/AdminLogin";
import Admin from "@/pages/Admin";

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
        <div className="bg-graphite font-body text-graphite antialiased">
            <AvisoTopo />
            <Header />
            <main>
                <Hero />
                <Marquee />
                <Sobre />
                <Produtos />
                <CatalogoCores />
                <Projetos />
                <Depoimentos />
                <Contato />
            </main>
            <Footer />
            <FloatingWhatsApp />
            <div className="grain" aria-hidden="true" />
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
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/admin/login" element={<AdminLogin />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;
