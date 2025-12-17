import React, { useState } from 'react';
import { 
    CheckCircle, 
    Calendar, 
    Sparkles, 
    TrendingUp, 
    Users, 
    Smartphone, 
    ArrowRight, 
    Star, 
    Menu, 
    X,
    ShieldCheck,
    Zap
} from 'lucide-react';

// Reutilizando seu componente de Logo para consistência
const Logo = () => (
    <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 rounded-xl opacity-20 blur-md"></div>
        <Sparkles size={20} className="text-pink-600 relative z-10" strokeWidth={2.5} />
    </div>
);

export default function LandingPage({ onLoginClick, onRegisterClick }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-800 overflow-x-hidden">
            
            {/* --- NAV BAR --- */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-pink-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <Logo />
                            <span className="text-xl font-black bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                                La Vie Beauty
                            </span>
                        </div>
                        
                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#funcionalidades" className="text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">Funcionalidades</a>
                            <a href="#beneficios" className="text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">Benefícios</a>
                            <a href="#planos" className="text-sm font-medium text-gray-600 hover:text-pink-600 transition-colors">Planos</a>
                            <button 
                                onClick={onLoginClick}
                                className="text-pink-600 font-bold text-sm hover:text-pink-700 px-4"
                            >
                                Entrar
                            </button>
                            <button 
                                onClick={onRegisterClick}
                                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-pink-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                Testar Grátis
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
                        <div className="px-4 pt-2 pb-6 space-y-2">
                            <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg">Funcionalidades</a>
                            <a href="#planos" onClick={() => setIsMenuOpen(false)} className="block px-3 py-3 text-base font-medium text-gray-700 hover:bg-pink-50 hover:text-pink-600 rounded-lg">Planos</a>
                            <div className="border-t border-gray-100 my-2 pt-2">
                                <button onClick={onLoginClick} className="w-full text-left px-3 py-3 text-pink-600 font-bold">Entrar no Sistema</button>
                                <button onClick={onRegisterClick} className="w-full mt-2 bg-pink-500 text-white px-3 py-3 rounded-xl font-bold">Criar Conta Grátis</button>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-pink-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-rose-300 rounded-full blur-3xl opacity-20"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-pink-50 border border-pink-100 px-4 py-1.5 rounded-full text-pink-600 text-xs font-bold uppercase tracking-wide mb-6 animate-fade-in-up">
                            <Sparkles size={14} /> O sistema #1 para Salões de Beleza
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
                            Beleza é arte. <br/>
                            <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Gestão é La Vie.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                            Agendamento online, controle financeiro e gestão de equipe em um único aplicativo. Simplifique seu dia a dia e foque no que você ama.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button 
                                onClick={onRegisterClick}
                                className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Começar Agora <ArrowRight size={20} />
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-2xl font-bold text-lg hover:border-pink-300 hover:text-pink-600 transition-all flex items-center justify-center gap-2">
                                <Zap size={20} /> Ver Demonstração
                            </button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400">Teste grátis de 14 dias • Sem cartão de crédito</p>
                    </div>

                    {/* App Mockup Abstract */}
                    <div className="mt-16 relative mx-auto max-w-4xl transform hover:scale-[1.01] transition-transform duration-700">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
                        <div className="bg-white rounded-t-[40px] shadow-2xl border-4 border-gray-900 border-b-0 overflow-hidden">
                            <div className="h-8 bg-gray-900 flex items-center gap-2 px-4">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-gray-50 h-[400px] md:h-[500px]">
                                {/* Simulação Visual do App */}
                                <div className="p-6 hidden md:block border-r border-gray-200 bg-white">
                                    <div className="space-y-4">
                                        <div className="h-8 w-32 bg-gray-100 rounded-lg"></div>
                                        <div className="h-20 bg-pink-50 rounded-2xl border border-pink-100"></div>
                                        <div className="h-12 bg-gray-50 rounded-xl"></div>
                                        <div className="h-12 bg-gray-50 rounded-xl"></div>
                                        <div className="h-12 bg-gray-50 rounded-xl"></div>
                                    </div>
                                </div>
                                <div className="col-span-2 p-6 md:p-10 flex flex-col items-center justify-center text-center bg-gradient-to-br from-pink-50 to-white">
                                    <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-500 mb-4 shadow-sm">
                                        <Calendar size={32} />
                                    </div>
                                    <h3 className="text-2xl font-black text-gray-800 mb-2">Agenda Inteligente</h3>
                                    <p className="text-gray-500 max-w-xs">Seus clientes agendam sozinhos e você recebe notificações instantâneas.</p>
                                    <div className="mt-8 flex gap-3">
                                        <div className="bg-white p-3 rounded-xl shadow-md text-xs font-bold text-gray-600 flex items-center gap-2 animate-bounce">
                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                            Novo Agendamento: Maria
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- FEATURES SECTION --- */}
            <section id="funcionalidades" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Tudo que seu salão precisa</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Substitua o caderno e as planilhas complicadas por uma ferramenta simples, bonita e eficiente.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Calendar className="text-white" size={24} />,
                                color: "bg-pink-500",
                                title: "Agendamento Online",
                                desc: "Link exclusivo para seus clientes agendarem 24h por dia sem te chamar no WhatsApp."
                            },
                            {
                                icon: <TrendingUp className="text-white" size={24} />,
                                color: "bg-purple-500",
                                title: "Gestão Financeira",
                                desc: "Saiba exatamente quanto entrou, saiu e qual foi o lucro do dia, semana ou mês."
                            },
                            {
                                icon: <Users className="text-white" size={24} />,
                                color: "bg-blue-500",
                                title: "Comissão Automática",
                                desc: "Cálculo automático de comissões para seus colaboradores. Sem erros e sem brigas."
                            },
                            {
                                icon: <Smartphone className="text-white" size={24} />,
                                color: "bg-green-500",
                                title: "100% Mobile",
                                desc: "Gerencie seu negócio da palma da mão. Funciona em Android e iPhone perfeitamente."
                            },
                            {
                                icon: <ShieldCheck className="text-white" size={24} />,
                                color: "bg-orange-500",
                                title: "Segurança Total",
                                desc: "Seus dados salvos na nuvem com backups diários. Nunca mais perca sua agenda."
                            },
                            {
                                icon: <Star className="text-white" size={24} />,
                                color: "bg-rose-500",
                                title: "Fidelização",
                                desc: "Histórico completo de atendimentos para você encantar seus clientes."
                            }
                        ].map((feature, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                                <div className={`w-12 h-12 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="planos" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Planos que cabem no bolso</h2>
                        <p className="text-gray-600">Escolha o melhor para o seu momento. Mude quando quiser.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Basic Plan */}
                        <div className="border-2 border-gray-100 rounded-3xl p-8 hover:border-pink-200 transition-all">
                            <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wide mb-2">Free Trial</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-gray-900">R$ 0</span>
                                <span className="text-gray-400">/14 dias</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-gray-600 text-sm">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Agenda Básica</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> Até 30 Clientes</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500"/> 1 Colaborador</li>
                            </ul>
                            <button onClick={onRegisterClick} className="w-full py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                                Começar Grátis
                            </button>
                        </div>

                        {/* Shine Plan - Highlighted */}
                        <div className="border-2 border-pink-500 bg-pink-50/30 rounded-3xl p-8 relative transform md:-translate-y-4 shadow-2xl">
                            <div className="absolute top-0 right-0 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase">Mais Popular</div>
                            <h3 className="text-lg font-bold text-pink-600 uppercase tracking-wide mb-2">Shine ✨</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-gray-900">R$ 49,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-gray-700 text-sm font-medium">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-pink-500"/> Tudo do Basic</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-pink-500"/> <b>Até 90 Clientes</b></li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-pink-500"/> <b>Até 5 Colaboradores</b></li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-pink-500"/> Gestão Financeira</li>
                            </ul>
                            <button onClick={onRegisterClick} className="w-full py-3 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 hover:shadow-lg transition-all">
                                Assinar Shine
                            </button>
                        </div>

                        {/* Glamour Plan */}
                        <div className="border-2 border-purple-100 rounded-3xl p-8 hover:border-purple-200 transition-all bg-gradient-to-br from-white to-purple-50">
                            <h3 className="text-lg font-bold text-purple-600 uppercase tracking-wide mb-2">Glamour 💎</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-gray-900">R$ 89,90</span>
                                <span className="text-gray-400">/mês</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-gray-600 text-sm">
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> <b>Ilimitado</b> (Clientes/Equipe)</li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> <b>Integração Google Agenda</b></li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> <b>Múltiplos Salões</b></li>
                                <li className="flex items-center gap-2"><CheckCircle size={16} className="text-purple-500"/> Suporte VIP 24h</li>
                            </ul>
                            <button onClick={onRegisterClick} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all shadow-md">
                                Ser Glamour
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CTA FINAL --- */}
            <section className="py-20 bg-gray-900 text-white text-center px-4">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black mb-6">Pronto para transformar seu salão?</h2>
                    <p className="text-gray-400 mb-10 text-lg">Junte-se a centenas de salões que já usam o La Vie Beauty.</p>
                    <button 
                        onClick={onRegisterClick}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform"
                    >
                        Criar Conta Gratuita
                    </button>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Logo />
                        <span className="font-bold text-gray-700">La Vie Beauty</span>
                    </div>
                    <div className="flex gap-8 text-sm text-gray-500">
                        <a href="#" className="hover:text-pink-600">Termos de Uso</a>
                        <a href="#" className="hover:text-pink-600">Privacidade</a>
                        <a href="#" className="hover:text-pink-600">Suporte</a>
                    </div>
                    <p className="text-sm text-gray-400">© 2024 La Vie Inc.</p>
                </div>
            </footer>
        </div>
    );
}