import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, ArrowRight, Clock, ChevronLeft, Instagram, ExternalLink } from 'lucide-react';
import { db } from './firebaseConfig'; // Use o mesmo config do App
import { collection, getDocs } from 'firebase/firestore';

// URL DO SEU APP (Para onde o botão vai mandar)
const APP_URL = "https://app.la-vie-beauty.com.br";

export default function Vitrine() {
    const [view, setView] = useState('list'); // 'list' ou 'details'
    const [salons, setSalons] = useState([]);
    const [selectedSalon, setSelectedSalon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Busca os salões reais do Firebase
    useEffect(() => {
        const fetchSalons = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "salons"));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    // Fallbacks visuais caso não tenha foto
                    image: `https://source.unsplash.com/random/800x600/?beauty,salon,${doc.id}`,
                    rating: (4 + Math.random()).toFixed(1) // Nota simulada para demo
                }));
                setSalons(data);
            } catch (error) {
                console.error("Erro ao buscar vitrine:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSalons();
    }, []);

    const filteredSalons = salons.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.address && s.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // --- TELA DE DETALHES (SUBPÁGINA) ---
    if (view === 'details' && selectedSalon) {
        return (
            <div className="min-h-screen bg-white font-sans">
                {/* Header Simples */}
                <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b z-50 px-4 py-3 flex justify-between items-center">
                    <button 
                        onClick={() => setView('list')}
                        className="flex items-center gap-1 text-gray-600 font-bold hover:text-pink-600 transition-colors"
                    >
                        <ChevronLeft size={20} /> Voltar
                    </button>
                    <span className="font-bold text-gray-800">Detalhes</span>
                    <div className="w-16"></div> {/* Espaço para centralizar */}
                </header>

                {/* Capa e Info Principal */}
                <div className="relative h-64 md:h-80">
                    <img src={selectedSalon.image} className="w-full h-full object-cover" alt="Capa" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                        <h1 className="text-3xl font-black mb-1">{selectedSalon.name}</h1>
                        <p className="flex items-center gap-1 text-sm opacity-90">
                            <MapPin size={14} /> {selectedSalon.address}
                        </p>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-4 py-8 -mt-6 relative z-10 bg-white rounded-t-3xl shadow-lg">
                    {/* Botão de Ação Principal */}
                    <a 
                        href={`${APP_URL}/?salonId=${selectedSalon.id}`} 
                        className="block w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white text-center py-4 rounded-xl font-bold text-lg shadow-xl shadow-pink-200 hover:scale-[1.02] transition-transform mb-8 items-center justify-center gap-2"
                    >
                        Agendar Horário <ExternalLink size={20} />
                    </a>

                    {/* Descrição / Info */}
                    <div className="grid gap-6">
                        <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                            <h2 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Clock className="text-pink-500" size={18} /> Sobre nós
                            </h2>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {selectedSalon.description || "Bem-vindo ao nosso espaço de beleza. Oferecemos os melhores serviços com profissionais qualificados para realçar sua beleza natural."}
                            </p>
                            {selectedSalon.phone && (
                                <p className="mt-4 text-sm font-medium text-gray-500">
                                    Contato: {selectedSalon.phone}
                                </p>
                            )}
                        </div>

                        {/* Lista Prévia de Serviços (Estático) */}
                        <div>
                            <h2 className="font-bold text-gray-800 mb-4 text-lg">Nossos Serviços</h2>
                            <div className="space-y-3">
                                {/* Simulando serviços ou lendo se você passar via props */}
                                <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-700">Corte & Escova</p>
                                        <p className="text-xs text-gray-400">Consulte valores no app</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300" />
                                </div>
                                <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-700">Manicure Completa</p>
                                        <p className="text-xs text-gray-400">Consulte valores no app</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300" />
                                </div>
                                <div className="flex justify-between items-center p-3 border-b border-gray-100">
                                    <div>
                                        <p className="font-bold text-gray-700">Hidratação Profunda</p>
                                        <p className="text-xs text-gray-400">Consulte valores no app</p>
                                    </div>
                                    <ArrowRight size={16} className="text-gray-300" />
                                </div>
                            </div>
                            
                            <p className="text-center text-xs text-gray-400 mt-4">
                                * Para ver preços atualizados e agenda, clique no botão de agendar.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- TELA LISTA (VITRINE) ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <div className="bg-white py-6 px-4 shadow-sm sticky top-0 z-40">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-pink-600 to-rose-500 bg-clip-text text-transparent">
                        La Vie Beauty
                    </h1>
                    <a href={`${APP_URL}`} className="text-sm font-bold text-gray-500 hover:text-pink-600">
                        Sou Profissional
                    </a>
                </div>
            </div>

            {/* Busca Hero */}
            <div className="bg-gray-900 px-4 py-12 md:py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 to-black/60"></div>
                <div className="relative z-10 max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Encontre o salão ideal</h2>
                    <div className="bg-white p-2 rounded-xl flex shadow-xl">
                        <div className="flex-1 flex items-center px-3 gap-2">
                            <Search className="text-gray-400" size={20} />
                            <input 
                                placeholder="Buscar por nome ou bairro..." 
                                className="w-full py-2 outline-none text-gray-700"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                <h3 className="font-bold text-gray-800 text-xl mb-6">Salões em Destaque</h3>
                
                {loading ? (
                    <div className="text-center py-20 text-gray-400">Carregando vitrine...</div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {filteredSalons.map(salon => (
                            <div 
                                key={salon.id}
                                onClick={() => {
                                    setSelectedSalon(salon);
                                    setView('details');
                                }}
                                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <div className="h-40 bg-gray-200 relative">
                                    <img src={salon.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={salon.name}/>
                                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold flex gap-1 shadow">
                                        <Star size={12} className="text-yellow-400" fill="currentColor" /> {salon.rating}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-bold text-gray-800 text-lg mb-1">{salon.name}</h4>
                                    <p className="text-sm text-gray-500 flex items-center gap-1 mb-4">
                                        <MapPin size={14} /> {salon.address || "Endereço não informado"}
                                    </p>
                                    <button className="w-full py-2 rounded-lg border border-pink-200 text-pink-600 font-bold text-sm group-hover:bg-pink-50 transition-colors">
                                        Ver Serviços
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white py-8 text-center text-gray-400 text-sm border-t">
                &copy; 2025 La Vie Beauty - Vitrine Oficial
            </footer>
        </div>
    );
}