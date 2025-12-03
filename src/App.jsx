// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    User,
    Scissors,
    CheckCircle,
    LogOut,
    X,
    Loader2,
    Sparkles,
    Store,
    CreditCard,
    ArrowRight,
    MapPin,
    Phone,
    Save,
    Settings,
    Link as LinkIcon,
    ChevronRight,
    TrendingUp,
    Users,
    Star,
    Heart,
    Zap,
    Search,
    List,
    Plus,
    Edit,
    Trash2,
    Mail,
    LogIn,
    Lock,
    DollarSign
} from 'lucide-react';

// Importações do Firebase
import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, query, where, onSnapshot, doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

// Importação do Chat
import FloatingChat from './Chat';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// Função para formatar telefone
const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se vazio, retorna apenas o parêntese inicial
    if (numbers.length === 0) {
        return '(   ) ';
    }
    
    // Aplica a máscara (XX) 99999-9999
    if (numbers.length <= 2) {
        // Preenche com espaços se tiver menos de 2 dígitos
        const ddd = numbers.padEnd(2, ' ');
        return `(${ddd}) `;
    } else if (numbers.length <= 7) {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
};

const INITIAL_OWNER_FORM = {
    name: '',
    address: '',
    phone: '(   ) ',
    email: '',
    securityCode: '',
    confirmSecurityCode: ''
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashSecurityCode = async (code) => {
    const clean = (code || '').trim();
    if (!clean) return '';

    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(clean);
        const subtle = globalThis.crypto?.subtle;

        if (!subtle) {
            return btoa(clean).split('').reverse().join('');
        }

        const hashBuffer = await subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Erro ao gerar hash do PIN:', error);
        return clean;
    }
};

// ============================================
// COMPONENTES UI (FORA DO APP)
// ============================================

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, loading = false }) => {
    const baseStyle = "w-full py-4 rounded-2xl font-bold transition-all duration-300 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60";
    const variants = {
        primary: "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-pink-200 hover:shadow-xl hover:from-pink-600 hover:to-rose-600 transform hover:-translate-y-0.5",
        outline: "bg-white border-2 border-pink-200 text-pink-600 hover:bg-pink-50 hover:border-pink-300 hover:shadow-md",
        dark: "bg-gradient-to-r from-gray-800 to-gray-900 text-white hover:from-gray-900 hover:to-black shadow-gray-400"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
        >
            {loading ? <Loader2 className="animate-spin" size={20} /> : children}
        </button>
    );
};

const SelectField = ({ label, value, onChange, options, icon: Icon }) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1 flex items-center gap-1">
            {Icon && <Icon size={14} className="text-pink-500" />}
            {label}
        </label>
        <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 transition-colors group-focus-within:text-pink-600 z-10 pointer-events-none">
                {Icon && <Icon size={18} />}
            </div>
            <select
                value={value}
                onChange={onChange}
                className="w-full pl-12 pr-10 py-4 rounded-xl bg-white border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-200 text-gray-800 font-medium appearance-none cursor-pointer hover:border-pink-300"
            >
                {options.map(option => (
                    <option key={option} value={option} className="py-2">
                        {option}
                    </option>
                ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={18} className="text-gray-400 rotate-90" />
            </div>
        </div>
    </div>
);

const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = "text", formatPhone: shouldFormatPhone = false }) => {
    const handleChange = (e) => {
        if (shouldFormatPhone) {
            const formatted = formatPhone(e.target.value);
            onChange({ ...e, target: { ...e.target, value: formatted } });
        } else {
            onChange(e);
        }
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1 flex items-center gap-1">
                <Icon size={14} className="text-pink-500" />
                {label}
            </label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-400 transition-colors group-focus-within:text-pink-600">
                    <Icon size={18} />
                </div>
                <input
                    type={type}
                    value={value}
                    onChange={handleChange}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-200 text-gray-800 placeholder:text-gray-400"
                />
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, color = "pink" }) => {
    const colorVariants = {
        pink: "bg-gradient-to-br from-pink-500 to-rose-500",
        purple: "bg-gradient-to-br from-purple-500 to-indigo-500",
        blue: "bg-gradient-to-br from-blue-500 to-cyan-500"
    };

    return (
        <div className={`${colorVariants[color]} p-5 rounded-2xl flex-1 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-white/80" />
                <p className="text-white/90 text-xs font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className="text-3xl font-black text-white">{value}</p>
        </div>
    );
};

// ============================================
// LOGO PROFISSIONAL
// ============================================

const LogoOption1 = () => (
    <div className="relative w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-6">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 rounded-[28px] opacity-20 blur-xl animate-pulse"></div>
        <div className="relative flex items-center justify-center">
            <Sparkles size={42} className="text-pink-600" strokeWidth={2.5} />
            <Star size={18} className="absolute -top-2 -right-2 text-yellow-500 fill-yellow-400 animate-pulse" strokeWidth={2} />
            <Sparkles size={14} className="absolute -bottom-1 -left-1 text-rose-400 animate-bounce" strokeWidth={2} />
        </div>
    </div>
);

// ============================================
// TELAS (COMPONENTS FORA DO APP)
// ============================================

const LandingScreen = ({ setView }) => (
    <div className="flex flex-col h-full bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400 p-6 justify-center items-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center w-full">
            <LogoOption1 />

            <div className="text-center mb-2 mt-6">
                <h1 className="text-3xl font-black mb-2 tracking-tight drop-shadow-lg">La Vie Beauty</h1>
                <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg">
                    <p className="text-white text-xs font-semibold tracking-wide">Gestão Inteligente</p>
                </div>
            </div>

            <p className="text-white/80 text-center mb-12 text-xs max-w-[260px] drop-shadow-md">
                Transforme seu salão com tecnologia profissional
            </p>

            <div className="w-full space-y-4">
                <Button onClick={() => setView('owner-login')} variant="dark">
                    <Store size={20} />
                    Sou Proprietário
                </Button>
                <Button onClick={() => setView('client-login')} variant="outline">
                    <User size={20} />
                    Sou Cliente
                </Button>
            </div>

            <div className="mt-6 flex gap-3 text-center text-[10px] text-white/70">
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <CheckCircle size={12} />
                    <span>14 dias grátis</span>
                </div>
                <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    <CheckCircle size={12} />
                    <span>Sem cartão</span>
                </div>
            </div>
        </div>
    </div>
);

// TELA DE LOGIN PARA PROPRIETÁRIOS
const OwnerLoginScreen = ({
    ownerForm,
    setOwnerForm,
    handleOwnerLogin,
    handleOwnerRegistration,
    loading,
    setView,
    showRegistration,
    setShowRegistration
}) => {
    if (showRegistration) {
        return (
            <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
                    <button onClick={() => {
                        setShowRegistration(false);
                        setOwnerForm(INITIAL_OWNER_FORM);
                    }} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                        <X size={18} />
                        Voltar
                    </button>
                    <h2 className="text-2xl font-black text-white mb-2">Cadastro do Salão</h2>
                    <p className="text-gray-400 text-sm">Preencha os dados do seu estabelecimento</p>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-5">
                    <InputField
                        label="Nome do Salão"
                        icon={Store}
                        value={ownerForm.name}
                        onChange={e => setOwnerForm({...ownerForm, name: e.target.value})}
                        placeholder="Ex: Studio Bella Hair"
                    />

                    <InputField
                        label="Endereço Completo"
                        icon={MapPin}
                        value={ownerForm.address}
                        onChange={e => setOwnerForm({...ownerForm, address: e.target.value})}
                        placeholder="Rua das Flores, 123 - Centro"
                    />

                    <InputField
                        label="Telefone / WhatsApp"
                        icon={Phone}
                        value={ownerForm.phone}
                        onChange={e => setOwnerForm({...ownerForm, phone: e.target.value})}
                        placeholder="( ) 99999-9999"
                        formatPhone={true}
                    />

                    <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                        <Sparkles className="text-blue-500 mt-0.5" size={18} />
                        <p className="text-xs text-blue-700 leading-relaxed">
                            Após o cadastro, você terá acesso ao painel administrativo completo com gestão de serviços e agendamentos.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
                    <Button 
                        onClick={handleOwnerRegistration} 
                        loading={loading}
                        disabled={!ownerForm.name.trim() || !ownerForm.address.trim() || !ownerForm.phone.trim()}
                    >
                        <CheckCircle size={20} />
                        Criar Meu Salão
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
                <button onClick={() => setView('landing')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                    <X size={18} />
                    Voltar
                </button>
                <h2 className="text-2xl font-black text-white mb-2">Acesso Proprietário</h2>
                <p className="text-gray-400 text-sm">Digite seu telefone para acessar o painel</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
                <InputField
                    label="Telefone / WhatsApp"
                    icon={Phone}
                    value={ownerForm.phone}
                    onChange={e => setOwnerForm({...ownerForm, phone: e.target.value})}
                    placeholder="(  ) 99999-9999"
                    formatPhone={true}
                />

                <InputField
                    label="Código de Segurança (PIN)"
                    icon={Lock}
                    type="password"
                    value={ownerForm.securityCode}
                    onChange={e => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOwnerForm({...ownerForm, securityCode: digits});
                    }}
                    placeholder="Digite seu PIN"
                />

                <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                    <Sparkles className="text-blue-500 mt-0.5" size={18} />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        Digite o telefone e o PIN cadastrados do seu salão. Se ainda não tem cadastro, crie um novo e defina seu PIN.
                    </p>
                </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-200 shadow-2xl space-y-3">
                <Button 
                    onClick={handleOwnerLogin} 
                    loading={loading}
                    disabled={
                        !ownerForm.phone.trim() ||
                        ownerForm.phone.length < 10 ||
                        ownerForm.securityCode.length < 4
                    }
                >
                    <LogIn size={20} />
                    Acessar Painel
                </Button>
                <button
                    onClick={() => {
                        setOwnerForm(INITIAL_OWNER_FORM);
                        setView('owner-registration');
                    }}
                    className="w-full text-center text-gray-600 text-sm hover:text-gray-800 transition-colors"
                >
                    Não tenho cadastro
                </button>
            </div>
        </div>
    );
};

const OwnerRegistrationScreen = ({
    ownerForm,
    setOwnerForm,
    handleOwnerRegistration, 
    loading,
    setView 
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
            <button onClick={() => setView('owner-login')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                <X size={18} />
                Voltar
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Cadastro do Salão</h2>
            <p className="text-gray-400 text-sm">Preencha os dados do seu estabelecimento</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <InputField
                label="Nome do Salão"
                icon={Store}
                value={ownerForm.name}
                onChange={e => setOwnerForm({...ownerForm, name: e.target.value})}
                placeholder="Ex: Studio Bella Hair"
            />

            <InputField
                label="Endereço Completo"
                icon={MapPin}
                value={ownerForm.address}
                onChange={e => setOwnerForm({...ownerForm, address: e.target.value})}
                placeholder="Rua das Flores, 123 - Centro"
            />

            <InputField
                label="E-mail do Responsável"
                icon={Mail}
                type="email"
                value={ownerForm.email}
                onChange={e => setOwnerForm({...ownerForm, email: e.target.value})}
                placeholder="voce@empresa.com"
            />

            <InputField
                label="Telefone / WhatsApp"
                icon={Phone}
                value={ownerForm.phone}
                onChange={e => setOwnerForm({...ownerForm, phone: e.target.value})}
                placeholder="(   ) 99999-9999"
                formatPhone={true}
            />

            <InputField
                label="Crie um Código de Segurança (PIN)"
                icon={Lock}
                type="password"
                value={ownerForm.securityCode}
                onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOwnerForm({...ownerForm, securityCode: digits});
                }}
                placeholder="Ex: 123456"
            />

            <InputField
                label="Confirme o Código"
                icon={Lock}
                type="password"
                value={ownerForm.confirmSecurityCode}
                onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOwnerForm({...ownerForm, confirmSecurityCode: digits});
                }}
                placeholder="Repita seu PIN"
            />

            <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                <Sparkles className="text-blue-500 mt-0.5" size={18} />
                <p className="text-xs text-blue-700 leading-relaxed">
                    Após o cadastro, você terá acesso ao painel administrativo completo com gestão de serviços e agendamentos.
                </p>
            </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
            <Button 
                onClick={handleOwnerRegistration} 
                loading={loading}
                disabled={
                    !ownerForm.name.trim() ||
                    !ownerForm.address.trim() ||
                    !ownerForm.phone.trim() ||
                    !ownerForm.email.trim() ||
                    !EMAIL_REGEX.test(ownerForm.email.trim()) ||
                    ownerForm.securityCode.length < 4 ||
                    ownerForm.securityCode !== ownerForm.confirmSecurityCode
                }
            >
                <CheckCircle size={20} />
                Criar Meu Salão
            </Button>
        </div>
    </div>
);

const ClientSalonSelectionScreen = ({ allSalons, loading, handleSelectSalon, setView }) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl sticky top-0 z-20">
            <button onClick={() => setView('landing')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                <X size={18} />
                Voltar
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Escolha um Salão</h2>
            <p className="text-pink-100 text-sm">Selecione onde deseja agendar</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
                    <p className="text-gray-500 text-sm">Carregando salões...</p>
                </div>
            ) : allSalons.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Store className="text-gray-400" size={36}/>
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum salão cadastrado</p>
                    <p className="text-gray-400 text-xs mt-1">Aguarde novos estabelecimentos</p>
                </div>
            ) : (
                allSalons.map(salon => (
                    <div
                        key={salon.id}
                        onClick={() => handleSelectSalon(salon)}
                        className="bg-white p-5 rounded-3xl shadow-md border-2 border-transparent hover:border-pink-200 transition-all duration-200 cursor-pointer group hover:shadow-xl transform hover:-translate-y-1"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0 group-hover:scale-110 transition-transform">
                                <Store size={26} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{salon.name}</h3>
                                {salon.address && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                                        <MapPin size={12} />
                                        {salon.address}
                                    </p>
                                )}
                                {salon.phone && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1">
                                        <Phone size={12} />
                                        {salon.phone}
                                    </p>
                                )}
                            </div>
                            <ChevronRight size={20} className="text-gray-300 group-hover:text-pink-500 transition-colors mt-2" />
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// NOVA TELA: Login/Cadastro do Cliente
const ClientLoginScreen = ({ 
    clientPhone, 
    setClientPhone,
    clientName,
    setClientName,
    needsRegistration,
    handleClientLogin,
    loading,
    setView 
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
            <button onClick={() => setView('client-home')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                <X size={18} />
                Voltar
            </button>
            <h2 className="text-2xl font-black text-white mb-2">
                {needsRegistration ? 'Complete seu Cadastro' : 'Identifique-se'}
            </h2>
            <p className="text-pink-100 text-sm">
                {needsRegistration ? 'Precisamos de mais algumas informações' : 'Digite seu telefone para continuar'}
            </p>
        </div>
        <div className="p-6 flex-1 flex flex-col justify-center">
            <div className="space-y-6">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-xl">
                        <User size={36} className="text-white" />
                    </div>
                    <p className="text-gray-600 text-sm">
                        {needsRegistration 
                            ? 'Complete seus dados para finalizar o agendamento' 
                            : 'Seus agendamentos ficam salvos no seu telefone'}
                    </p>
                </div>
                <form onSubmit={handleClientLogin} className="space-y-4">
                    <InputField
                        label="Telefone / WhatsApp"
                        icon={Phone}
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        placeholder="(   ) 99999-9999"
                        formatPhone={true}
                    />
                    {needsRegistration && (
                        <div className="animate-fade-in">
                            <InputField
                                label="Seu Nome Completo"
                                icon={User}
                                value={clientName}
                                onChange={e => setClientName(e.target.value)}
                                placeholder="Ex: João Silva"
                            />
                        </div>
                    )}
                    <Button 
                        onClick={handleClientLogin}
                        loading={loading}
                        disabled={!clientPhone.trim() || (needsRegistration && !clientName.trim())}
                    >
                        <ArrowRight size={20} />
                        {needsRegistration ? 'Cadastrar e Continuar' : 'Continuar'}
                    </Button>
                </form>
                <div className="bg-blue-50 p-4 rounded-xl flex gap-3">
                    <Sparkles className="text-blue-500 mt-0.5" size={18} />
                    <p className="text-xs text-blue-700 leading-relaxed">
                        💡 Seus dados são salvos para agilizar próximos agendamentos
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const ServiceManagementScreen = ({ 
    setView, 
    globalServices, 
    salonServices, 
    loading,
    handleToggleService,
    currentSalonId,
    handleUpdateServicePrice,
    handleUpdateServiceDuration
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selecting, setSelecting] = useState(false);
    const [editingPrice, setEditingPrice] = useState({});
    const [editingDuration, setEditingDuration] = useState({});
    
    const categories = ['Todos', ...new Set(globalServices.map(s => s?.category || s?.categoria).filter(Boolean))];
    
    const filteredServices = globalServices.filter(service => {
        // Verificar se o serviço tem as propriedades necessárias
        if (!service) return false;
        
        const serviceName = service.name || service.nome || '';
        const serviceDescription = service.description || service.descricao || '';
        const serviceCategory = service.category || service.categoria || '';
        
        const matchSearch = !searchTerm || 
            serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            serviceDescription.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCategory = selectedCategory === 'Todos' || serviceCategory === selectedCategory;
        return matchSearch && matchCategory;
    });

    const isServiceActive = (serviceId) => {
        return salonServices.some(s => s.id === serviceId);
    };

    // NOVO: Selecionar todos os serviços visíveis
    const handleSelectAll = async () => {
        if (selecting || loading) return;
        setSelecting(true);
        try {
            const servicesToAdd = filteredServices.filter(s => !isServiceActive(s.id));
            if (servicesToAdd.length === 0) {
                alert("ℹ️ Todos os serviços já estão ativados!");
                setSelecting(false);
                return;
            }
            
            // Processa em batch para evitar loop
            const promises = servicesToAdd.map(service => handleToggleService(service));
            await Promise.all(promises);
            
            alert(`✅ ${servicesToAdd.length} serviços ativados!`);
        } catch (error) {
            console.error("Erro ao ativar serviços:", error);
            alert("❌ Erro ao ativar serviços.");
        } finally {
            setSelecting(false);
        }
    };

    // NOVO: Desmarcar todos os serviços visíveis
    const handleDeselectAll = async () => {
        if (selecting || loading) return;
        setSelecting(true);
        try {
            const servicesToRemove = filteredServices.filter(s => isServiceActive(s.id));
            if (servicesToRemove.length === 0) {
                alert("ℹ️ Nenhum serviço está ativado!");
                setSelecting(false);
                return;
            }
            
            // Processa em batch para evitar loop
            const promises = servicesToRemove.map(service => handleToggleService(service));
            await Promise.all(promises);
            
            alert(`✅ ${servicesToRemove.length} serviços desativados!`);
        } catch (error) {
            console.error("Erro ao desativar serviços:", error);
            alert("❌ Erro ao desativar serviços.");
        } finally {
            setSelecting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl sticky top-0 z-20">
                <button onClick={() => setView('admin')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                    <X size={18} />
                    Voltar
                </button>
                <h2 className="text-2xl font-black text-white mb-2">Gerenciar Serviços</h2>
                <p className="text-purple-100 text-sm">Selecione os serviços que você oferece</p>
                
                {/* Busca */}
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar serviços..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-purple-200 focus:bg-white/30 focus:border-white/50 outline-none transition-all"
                    />
                </div>

                {/* Filtro de Categorias */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mt-3">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                selectedCategory === cat
                                    ? 'bg-white text-purple-600 shadow-lg'
                                    : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* NOVO: Botões de Seleção em Massa */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={handleSelectAll}
                        disabled={selecting || loading}
                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {selecting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        Ativar Todos
                    </button>
                    <button
                        onClick={handleDeselectAll}
                        disabled={selecting || loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {selecting ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        Desativar Todos
                    </button>
                </div>
            </div>

            {/* Lista de Serviços */}
            <div className="p-6 flex-1 overflow-y-auto space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                        <p className="text-gray-500 text-sm">Carregando serviços...</p>
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-400" size={36}/>
                        </div>
                        <p className="text-gray-500 font-medium">Nenhum serviço encontrado</p>
                    </div>
                ) : (
                    filteredServices.map(service => {
                        const isActive = isServiceActive(service.id);
                        return (
                            <div
                                key={service.id}
                                onClick={() => handleToggleService(service)}
                                className={`bg-white p-4 rounded-2xl shadow-md transition-all duration-200 cursor-pointer border-2 active:scale-95 ${
                                    isActive 
                                        ? 'border-green-500 bg-green-50' 
                                        : 'border-transparent hover:border-purple-200 hover:shadow-lg'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                        isActive 
                                            ? 'bg-green-500 border-green-500' 
                                            : 'border-gray-300 bg-white'
                                    }`}>
                                        {isActive && <CheckCircle size={16} className="text-white" />}
                                    </div>

                                    {/* Info do Serviço */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 text-sm mb-1">{service.name || service.nome || 'Serviço sem nome'}</h4>
                                        <p className="text-gray-500 text-xs mb-2 line-clamp-2">{service.description || service.descricao || ''}</p>
                                        <div className="flex items-center gap-3 text-xs">
                                            {(service.duration_minutes || service.duracao) && (
                                                <span className="flex items-center gap-1 text-gray-500">
                                                    <Clock size={12} />
                                                    {service.duration_minutes || service.duracao} min
                                                </span>
                                            )}
                                            {(service.duration_minutes || service.duracao) && (service.category || service.categoria) && (
                                                <span className="text-gray-300">•</span>
                                            )}
                                            {(service.category || service.categoria) && (
                                                <span className="text-purple-600 font-semibold">{service.category || service.categoria}</span>
                                            )}
                                        </div>
                                        
                                        {/* Campo de Preço Personalizado - só aparece quando ativo */}
                                        {isActive && (
                                            <>
                                                <div className="mt-3 pt-3 border-t border-green-200" onClick={(e) => e.stopPropagation()}>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                                                        <DollarSign size={12} className="text-green-600" />
                                                        Valor Personalizado
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-500 text-sm">R$</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={editingPrice[service.id] !== undefined ? editingPrice[service.id] : (salonServices.find(s => s.id === service.id)?.price || '')}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setEditingPrice({...editingPrice, [service.id]: value});
                                                            }}
                                                            onBlur={async () => {
                                                                const currentValue = editingPrice[service.id] !== undefined 
                                                                    ? editingPrice[service.id] 
                                                                    : (salonServices.find(s => s.id === service.id)?.price || '');
                                                                if (handleUpdateServicePrice && currentValue !== '') {
                                                                    await handleUpdateServicePrice(service.id, parseFloat(currentValue) || 0);
                                                                    setEditingPrice({...editingPrice, [service.id]: undefined});
                                                                }
                                                            }}
                                                            placeholder="0,00"
                                                            className="flex-1 px-3 py-2 rounded-lg border border-green-300 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">Digite o valor que deseja cobrar por este serviço</p>
                                                </div>
                                                
                                                {/* Campo de Duração Personalizada */}
                                                <div className="mt-3 pt-3 border-t border-green-200" onClick={(e) => e.stopPropagation()}>
                                                    <label className="text-xs font-semibold text-gray-600 mb-1 block flex items-center gap-1">
                                                        <Clock size={12} className="text-green-600" />
                                                        Duração Personalizada
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="15"
                                                            step="15"
                                                            value={editingDuration[service.id] !== undefined ? editingDuration[service.id] : (salonServices.find(s => s.id === service.id)?.duration_minutes || service.duration_minutes || service.duracao || '')}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setEditingDuration({...editingDuration, [service.id]: value});
                                                            }}
                                                            onBlur={async () => {
                                                                const currentValue = editingDuration[service.id] !== undefined 
                                                                    ? editingDuration[service.id] 
                                                                    : (salonServices.find(s => s.id === service.id)?.duration_minutes || service.duration_minutes || service.duracao || '');
                                                                if (handleUpdateServiceDuration && currentValue !== '') {
                                                                    await handleUpdateServiceDuration(service.id, parseInt(currentValue) || 60);
                                                                    setEditingDuration({...editingDuration, [service.id]: undefined});
                                                                }
                                                            }}
                                                            placeholder="60"
                                                            className="flex-1 px-3 py-2 rounded-lg border border-green-300 text-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 outline-none"
                                                        />
                                                        <span className="text-gray-500 text-sm">min</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 mt-1">Digite a duração em minutos para este serviço</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 bg-purple-50 border-t border-purple-100">
                <p className="text-center text-xs text-purple-700">
                    <strong>{salonServices.length}</strong> serviços ativos • <strong>{filteredServices.length}</strong> disponíveis
                </p>
            </div>
        </div>
    );
};

const SettingsScreen = ({
    setView,
    editProfile,
    setEditProfile,
    handleSaveProfile,
    loading
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="bg-white p-6 shadow-md sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200">
            <button onClick={() => setView('admin')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={22} className="text-gray-600" />
            </button>
            <div>
                <h2 className="font-bold text-gray-800 text-lg">Configurações</h2>
                <p className="text-xs text-gray-500">Personalize seu estabelecimento</p>
            </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto pb-8">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-5 rounded-3xl shadow-lg text-white">
                <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl">
                        <CreditCard size={24} />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-lg mb-1">Plano Trial Ativo</p>
                        <p className="text-blue-100 text-sm mb-3">Seu período gratuito expira em 14 dias</p>
                        <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-50 transition-colors">
                            Fazer Upgrade
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-md space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <Store className="text-pink-500" size={20} />
                    <h3 className="font-bold text-gray-800">Dados do Estabelecimento</h3>
                </div>

                <InputField
                    label="Nome do Salão"
                    icon={Store}
                    value={editProfile.name}
                    onChange={e => setEditProfile({...editProfile, name: e.target.value})}
                    placeholder="Ex: Studio Bella Hair"
                />

                <InputField
                    label="Endereço Completo"
                    icon={MapPin}
                    value={editProfile.address}
                    placeholder="Rua das Flores, 123 - Centro"
                    onChange={e => setEditProfile({...editProfile, address: e.target.value})}
                />

                <InputField
                    label="E-mail de Contato"
                    icon={Mail}
                    type="email"
                    value={editProfile.email}
                    placeholder="contato@salon.com"
                    onChange={e => setEditProfile({...editProfile, email: e.target.value})}
                />

                <InputField
                    label="Telefone / WhatsApp"
                    icon={Phone}
                    value={editProfile.phone}
                    placeholder="(   ) 99999-9999"
                    onChange={e => setEditProfile({...editProfile, phone: e.target.value})}
                    formatPhone={true}
                />
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-md space-y-5">
                <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="text-purple-500" size={20} />
                    <h3 className="font-bold text-gray-800">Integrações</h3>
                </div>

                <InputField
                    label="ID da Agenda Google"
                    icon={Calendar}
                    value={editProfile.googleCalendarId}
                    placeholder="seuemail@gmail.com"
                    onChange={e => setEditProfile({...editProfile, googleCalendarId: e.target.value})}
                />

                <div className="bg-purple-50 p-4 rounded-xl flex gap-3">
                    <Sparkles className="text-purple-500 mt-0.5" size={18} />
                    <p className="text-xs text-purple-700 leading-relaxed">
                        Conecte sua agenda do Google para sincronizar automaticamente os horários agendados.
                    </p>
                </div>
            </div>

            <Button onClick={handleSaveProfile} loading={loading}>
                <Save size={20} />
                Salvar Alterações
            </Button>
        </div>
    </div>
);

const ClientHomeScreen = ({
    salonData,
    categories,
    activeCategory,
    setActiveCategory,
    services,
    setSelectedService,
    setView,
    setCurrentSalonId,
    setSelectedCollaborator
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 px-6 pt-8 pb-6 rounded-b-[32px] shadow-xl sticky top-0 z-20">
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <h2 className="text-2xl font-black text-white mb-1">{salonData?.name}</h2>
                    {salonData?.address && (
                        <p className="text-pink-100 text-xs flex items-center gap-1.5">
                            <MapPin size={12} />
                            {salonData.address}
                        </p>
                    )}
                    {salonData?.phone && (
                        <p className="text-pink-100 text-xs flex items-center gap-1.5 mt-1">
                            <Phone size={12} />
                            {salonData.phone}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    {/* NOVO: Botão de Perfil */}
                    <button
                        onClick={() => setView('client-login')}
                        className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full text-white hover:bg-white/30 transition-all"
                    >
                        <User size={18} />
                    </button>
                    <button
                        onClick={() => {setCurrentSalonId(null); setView('landing')}}
                        className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full text-white hover:bg-white/30 transition-all"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                            activeCategory === cat
                                ? 'bg-white text-pink-600 shadow-lg scale-105'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 pb-8">
            {services.length === 0 ? (
                <div className="text-center py-24">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Store className="text-gray-400" size={36}/>
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum serviço disponível</p>
                    <p className="text-gray-400 text-xs mt-1">Aguarde enquanto configuramos</p>
                </div>
            ) : (
                services
                    .filter(s => !activeCategory || (s.category || s.categoria) === activeCategory)
                    .map(service => (
                        <div
                            key={service.id}
                            onClick={() => {
                                setSelectedService(service);
                                setSelectedCollaborator(null);
                                setView('booking');
                            }}
                            className="bg-white p-5 rounded-3xl shadow-md border-2 border-transparent hover:border-pink-200 transition-all duration-200 cursor-pointer group hover:shadow-xl transform hover:-translate-y-1"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4 flex-1">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0 group-hover:scale-110 transition-transform">
                                        <Sparkles size={22} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 text-base mb-2">{service.name || service.nome}</h4>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="flex items-center gap-1 text-gray-500">
                                                <Clock size={12} />
                                                {service.duration_minutes || service.duracao} min
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-pink-600 font-semibold">{service.category || service.categoria}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    {(service.price && service.price > 0) ? (
                                        <span className="font-black text-pink-600 text-lg">R$ {service.price}</span>
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">Consulte valores</span>
                                    )}
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-pink-500 transition-colors" />
                                </div>
                            </div>
                        </div>
                    ))
            )}
        </div>
    </div>
);

const BookingScreen = ({
    selectedService,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    selectedCollaborator,
    setSelectedCollaborator,
    availableCollaborators,
    handleCreateAppointment,
    loading,
    setView,
    bookedTimes,
    currentSalonId
}) => {
    // Etapas: 1 = Colaborador, 2 = Data/Hora
    const [step, setStep] = useState(1);
    const canProceedToDateTime = selectedCollaborator !== null;
    const canConfirm = selectedCollaborator && selectedDate && selectedTime;
    
    // Verificar se um horário está ocupado
    const isTimeBooked = (time) => {
        if (!selectedDate || !selectedCollaborator) return false;
        // Agora bookedTimes contém apenas os horários (ex: '14:00')
        return bookedTimes.has(time);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <div className="bg-white p-6 shadow-md sticky top-0 z-10 border-b border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setView('client-home')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={22} className="text-gray-600" />
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800 text-lg">Confirmar Agendamento</h2>
                        <p className="text-xs text-gray-500">
                            {step === 1 ? 'Escolha o profissional' : 'Escolha data e horário'}
                        </p>
                    </div>
                </div>
                {/* Progresso */}
                <div className="flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full transition-all ${step >= 1 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex-1 h-2 rounded-full transition-all ${step >= 2 ? 'bg-pink-500' : 'bg-gray-200'}`}></div>
                </div>
            </div>

            <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {/* Card do Serviço */}
                <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-3xl shadow-xl text-white">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Scissors size={26} />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-xl mb-1">{selectedService.name || selectedService.nome}</h3>
                            <p className="text-pink-100 text-sm mb-3">{selectedService.duration_minutes || selectedService.duracao} minutos</p>
                            {(selectedService.price && selectedService.price > 0) ? (
                                <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">
                                    <p className="font-black text-2xl">R$ {selectedService.price}</p>
                                </div>
                            ) : (
                                <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">
                                    <p className="text-sm text-pink-100 italic">Consulte valores</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ETAPA 1: Seleção de Colaborador */}
                {step === 1 && (
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1 flex items-center gap-2">
                            <Users size={14} className="text-pink-500" />
                            Escolha o Profissional
                        </label>
                        {availableCollaborators.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl">
                                <Users className="mx-auto text-gray-400 mb-3" size={40} />
                                <p className="text-gray-500 font-medium">Nenhum profissional disponível</p>
                                <p className="text-gray-400 text-xs mt-1">Este serviço ainda não foi atribuído a nenhum colaborador</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {availableCollaborators.map(collab => (
                                    <div
                                        key={collab.id}
                                        onClick={() => setSelectedCollaborator(collab)}
                                        className={`bg-white p-4 rounded-2xl shadow-md cursor-pointer transition-all border-2 active:scale-95 ${
                                            selectedCollaborator?.id === collab.id
                                                ? 'border-pink-500 bg-pink-50'
                                                : 'border-transparent hover:border-pink-200 hover:shadow-lg'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Avatar */}
                                            <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0 font-black text-lg">
                                                {(collab.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800 text-base">{collab.name}</h4>
                                                {collab.phone && (
                                                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-1">
                                                        <Phone size={10} />
                                                        {collab.phone}
                                                    </p>
                                                )}
                                            </div>
                                            {/* Checkbox */}
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                                selectedCollaborator?.id === collab.id
                                                    ? 'bg-pink-500 border-pink-500'
                                                    : 'border-gray-300'
                                            }`}>
                                                {selectedCollaborator?.id === collab.id && (
                                                    <CheckCircle size={16} className="text-white" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Botão Continuar */}
                        {canProceedToDateTime && (
                            <button
                                onClick={() => setStep(2)}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95 mt-6"
                            >
                                Continuar para Data/Hora
                                <ArrowRight size={20} />
                            </button>
                        )}
                    </div>
                )}

                {/* ETAPA 2: Seleção de Data e Horário */}
                {step === 2 && (
                    <>
                        {/* Mostrar colaborador selecionado */}
                        <div className="bg-pink-50 p-4 rounded-2xl border-2 border-pink-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center text-pink-600 font-black">
                                    {(selectedCollaborator?.name || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-pink-600 font-medium">Profissional selecionado:</p>
                                    <p className="font-bold text-gray-800">{selectedCollaborator?.name}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setStep(1);
                                        setSelectedCollaborator(null);
                                    }}
                                    className="text-pink-600 hover:text-pink-700 text-xs font-bold"
                                >
                                    Trocar
                                </button>
                            </div>
                        </div>

                        {/* Seletor de Data */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <Calendar size={14} className="text-pink-500" />
                                Escolha a Data
                            </label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all text-gray-800 font-medium"
                            />
                        </div>

                        {/* Seletor de Horário */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide ml-1 flex items-center gap-2">
                                <Clock size={14} className="text-pink-500" />
                                Escolha o Horário
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {TIME_SLOTS.map(time => {
                                    const booked = isTimeBooked(time);
                                    return (
                                        <button
                                            key={time}
                                            onClick={() => !booked && setSelectedTime(time)}
                                            disabled={booked}
                                            className={`py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                                                booked
                                                    ? 'bg-gray-100 border-2 border-gray-200 text-gray-400 cursor-not-allowed line-through'
                                                    : selectedTime === time
                                                    ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-pink-300 hover:shadow-md'
                                            }`}
                                        >
                                            {time}
                                            {booked && <span className="block text-[10px] mt-1">Ocupado</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Resumo Final */}
                        {canConfirm && (
                            <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200 animate-fade-in">
                                <div className="flex items-center gap-2 mb-3">
                                    <CheckCircle size={18} className="text-green-600" />
                                    <p className="font-bold text-green-800 text-sm">Resumo do Agendamento</p>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <p className="text-green-700">👤 <strong>{selectedCollaborator?.name}</strong></p>
                                    <p className="text-green-700">📅 <strong>{new Date(selectedDate + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong></p>
                                    <p className="text-green-700">🕐 <strong>{selectedTime}</strong></p>
                                    <p className="text-green-700">✂️ <strong>{selectedService.name || selectedService.nome}</strong></p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Botão Fixo */}
            {step === 2 && (
                <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
                    <Button
                        onClick={handleCreateAppointment}
                        disabled={!canConfirm}
                        loading={loading}
                    >
                        <CheckCircle size={20} />
                        Confirmar Agendamento
                    </Button>
                </div>
            )}
        </div>
    );
};

// TELA DE GERENCIAMENTO DE COLABORADORES
const CollaboratorManagementScreen = ({
    setView,
    collaborators,
    setShowCollaboratorForm,
    handleDeleteCollaborator,
    setEditingCollaborator,
    loading
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
            <button onClick={() => setView('admin')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                <X size={18} />
                Voltar
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Colaboradores</h2>
            <p className="text-pink-100 text-sm">Gerencie sua equipe de profissionais</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Botão Adicionar */}
            <button
                onClick={() => {
                    setEditingCollaborator(null);
                    setShowCollaboratorForm(true);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95"
            >
                <Plus size={20} />
                Adicionar Colaborador
            </button>

            {/* Lista de Colaboradores */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
                    <p className="text-gray-500 text-sm">Carregando colaboradores...</p>
                </div>
            ) : collaborators.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <Users className="text-gray-400" size={36}/>
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum colaborador cadastrado</p>
                    <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar Colaborador" para começar</p>
                </div>
            ) : (
                collaborators.map(collab => (
                    <div
                        key={collab.id}
                        className="bg-white p-5 rounded-3xl shadow-md border-2 border-transparent hover:border-pink-200 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0 font-black text-xl">
                                {(collab.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{collab.name}</h3>
                                {collab.phone && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                                        <Phone size={12} />
                                        {collab.phone}
                                    </p>
                                )}
                                {collab.email && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-2">
                                        <Mail size={12} />
                                        {collab.email}
                                    </p>
                                )}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        collab.active 
                                            ? 'bg-pink-100 text-pink-700' 
                                            : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {collab.active ? '✓ Ativo' : '○ Inativo'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {collab.services?.length || 0} serviços
                                    </span>
                                </div>
                            </div>
                            {/* Ações */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setEditingCollaborator(collab);
                                        setShowCollaboratorForm(true);
                                    }}
                                    className="p-2 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
                                >
                                    <Edit size={18} className="text-pink-600" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Deseja realmente excluir ${collab.name}?`)) {
                                            handleDeleteCollaborator(collab.id);
                                        }
                                    }}
                                    className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} className="text-red-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// TELA DE FORMULÁRIO DE COLABORADOR
const CollaboratorFormScreen = ({
    setShowCollaboratorForm,
    collaboratorForm,
    setCollaboratorForm,
    services,
    handleSaveCollaborator,
    loading,
    editingCollaborator
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const uniqueCategories = [...new Set(services.map(s => (s?.category || s?.categoria)).filter(Boolean))].sort();
    const [selectedCategory, setSelectedCategory] = useState(uniqueCategories[0] || '');
    
    // Atualizar categoria selecionada quando as categorias mudarem
    useEffect(() => {
        if (uniqueCategories.length > 0) {
            // Se a categoria atual não existe mais, seleciona a primeira disponível
            if (!uniqueCategories.includes(selectedCategory)) {
                setSelectedCategory(uniqueCategories[0]);
            }
        } else {
            setSelectedCategory('');
        }
    }, [services]);
    
    // Extrair categorias únicas dos serviços (sem "Todos")
    const categories = uniqueCategories;
    
    // Filtrar serviços por categoria e busca
    const filteredServices = services.filter(service => {
        const serviceName = (service.name || service.nome || '').toLowerCase();
        const serviceCategory = service.category || service.categoria || '';
        const matchSearch = !searchTerm || serviceName.includes(searchTerm.toLowerCase());
        const matchCategory = !selectedCategory || serviceCategory === selectedCategory;
        return matchSearch && matchCategory;
    });
    
    const toggleService = (serviceId) => {
        const currentServices = collaboratorForm.services || [];
        if (currentServices.includes(serviceId)) {
            setCollaboratorForm({
                ...collaboratorForm,
                services: currentServices.filter(id => id !== serviceId)
            });
        } else {
            setCollaboratorForm({
                ...collaboratorForm,
                services: [...currentServices, serviceId]
            });
        }
    };

    const getSelectedCountInCategory = () => {
        const currentServices = collaboratorForm.services || [];
        if (!selectedCategory) return currentServices.length;
        return services.filter(s => (s.category || s.categoria) === selectedCategory && currentServices.includes(s.id)).length;
    };

    const toggleAllInCategory = () => {
        const currentServices = collaboratorForm.services || [];
        const categoryServices = filteredServices.map(s => s.id);
        
        const allSelected = categoryServices.every(id => currentServices.includes(id));
        
        if (allSelected) {
            setCollaboratorForm({
                ...collaboratorForm,
                services: currentServices.filter(id => !categoryServices.includes(id))
            });
        } else {
            const newServices = [...new Set([...currentServices, ...categoryServices])];
            setCollaboratorForm({
                ...collaboratorForm,
                services: newServices
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-white p-6 shadow-md sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200">
                <button onClick={() => {
                    setShowCollaboratorForm(false);
                    setEditingCollaborator(null);
                    setCollaboratorForm({ name: '', phone: '(   ) ', email: '', googleCalendarId: '', services: [], active: true });
                }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={22} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">
                        {editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </h2>
                    <p className="text-xs text-gray-500">Preencha os dados do profissional</p>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Dados Pessoais */}
                <div className="bg-white p-6 rounded-3xl shadow-md space-y-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-pink-500" size={20} />
                        Dados Pessoais
                    </h3>
                    <InputField
                        label="Nome Completo"
                        icon={User}
                        value={collaboratorForm.name}
                        onChange={e => setCollaboratorForm({...collaboratorForm, name: e.target.value})}
                        placeholder="Ex: Maria Silva"
                    />
                    <InputField
                        label="Telefone / WhatsApp"
                        icon={Phone}
                        value={collaboratorForm.phone}
                        onChange={e => setCollaboratorForm({...collaboratorForm, phone: e.target.value})}
                        placeholder="(   ) 99999-9999"
                        formatPhone={true}
                    />
                    <InputField
                        label="Email (Opcional)"
                        icon={Mail}
                        type="email"
                        value={collaboratorForm.email}
                        onChange={e => setCollaboratorForm({...collaboratorForm, email: e.target.value})}
                        placeholder="maria@email.com"
                    />

                    {/* --- CAMPO NOVO: INTEGRAÇÃO GOOGLE AGENDA --- */}
                    <div className="bg-blue-50 p-4 rounded-xl space-y-2 border border-blue-100 mt-4">
                        <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                            <Calendar size={16} />
                            Integração Google Agenda
                        </div>
                        <p className="text-[10px] text-blue-600 leading-tight">
                            Cole o <strong>ID da Agenda</strong> (ex: <code>c_123...group.calendar.google.com</code>) criada para esta profissional.
                        </p>
                        <input
                            type="text"
                            value={collaboratorForm.googleCalendarId || ''}
                            onChange={e => setCollaboratorForm({...collaboratorForm, googleCalendarId: e.target.value})}
                            placeholder="Cole o ID da agenda aqui"
                            className="w-full p-3 rounded-lg border border-blue-200 text-sm focus:ring-2 focus:ring-blue-300 outline-none text-gray-700"
                        />
                    </div>
                    {/* ------------------------------------------- */}

                    {/* Status Ativo */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-pink-500" />
                            <span className="text-sm font-bold text-gray-700">Colaborador Ativo</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={collaboratorForm.active}
                                onChange={e => setCollaboratorForm({...collaboratorForm, active: e.target.checked})}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                        </label>
                    </div>
                </div>

                {/* Serviços */}
                <div className="bg-white p-6 rounded-3xl shadow-md space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Scissors className="text-purple-500" size={20} />
                            Serviços que Realiza
                        </h3>
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            {(collaboratorForm.services || []).length}
                        </span>
                    </div>
                    {services.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-8">
                            Nenhum serviço cadastrado. Configure os serviços primeiro.
                        </p>
                    ) : (
                        <>
                            {/* Busca */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar serviços..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-sm font-medium"
                                />
                            </div>
                            {/* Select de Categoria Estilizado */}
                            {categories.length > 0 && (
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                        <List size={18} className="text-purple-400" />
                                    </div>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full pl-12 pr-10 py-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 text-purple-800 font-bold appearance-none cursor-pointer hover:border-purple-300 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm"
                                        style={{
                                            backgroundImage: 'none',
                                            WebkitAppearance: 'none',
                                            MozAppearance: 'none'
                                        }}
                                    >
                                        {categories.map(cat => (
                                            <option 
                                                key={cat} 
                                                value={cat}
                                                className="bg-white text-gray-800 py-3"
                                            >
                                                {cat} ({services.filter(s => (s.category || s.categoria) === cat).length})
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronRight size={20} className="text-purple-400 rotate-90" />
                                    </div>
                                </div>
                            )}
                            {/* Contador de Seleção na Categoria */}
                            {selectedCategory && getSelectedCountInCategory() > 0 && (
                                <div className="bg-purple-50 p-3 rounded-xl flex items-center justify-between">
                                    <span className="text-sm text-purple-700">
                                        {getSelectedCountInCategory()} de {filteredServices.length} selecionados em <strong>{selectedCategory}</strong>
                                    </span>
                                </div>
                            )}
                            {/* Botão Marcar/Desmarcar Todos */}
                            {filteredServices.length > 0 && (
                                <button
                                    onClick={toggleAllInCategory}
                                    className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 border-2 border-purple-200 hover:border-purple-300"
                                >
                                    {filteredServices.every(s => (collaboratorForm.services || []).includes(s.id)) ? (
                                        <>
                                            <X size={16} />
                                            Desmarcar Todos ({filteredServices.length})
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            Marcar Todos ({filteredServices.length})
                                        </>
                                    )}
                                </button>
                            )}
                            {/* Lista de Serviços */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredServices.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Search className="mx-auto text-gray-400 mb-3" size={36} />
                                        <p className="text-gray-500 text-sm font-medium">Nenhum serviço encontrado</p>
                                        <p className="text-gray-400 text-xs mt-1">Tente outra busca ou categoria</p>
                                    </div>
                                ) : (
                                    filteredServices.map(service => {
                                        const isSelected = (collaboratorForm.services || []).includes(service.id);
                                        return (
                                            <div
                                                key={service.id}
                                                onClick={() => toggleService(service.id)}
                                                className={`p-4 rounded-xl cursor-pointer transition-all border-2 active:scale-[0.98] ${
                                                    isSelected 
                                                        ? 'bg-purple-50 border-purple-500 shadow-md' 
                                                        : 'bg-gray-50 border-transparent hover:border-purple-200 hover:bg-purple-50/50 hover:shadow-sm'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                                        isSelected 
                                                            ? 'bg-purple-500 border-purple-500' 
                                                            : 'border-gray-300 bg-white'
                                                    }`}>
                                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800 text-sm">{service.name || service.nome}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-purple-600 font-semibold">{service.category || service.categoria}</span>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                <Clock size={10} />
                                                                {service.duration_minutes || service.duracao} min
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {(service.price && service.price > 0) ? (
                                                        <span className="text-xs font-bold text-purple-600 whitespace-nowrap">R$ {service.price}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic whitespace-nowrap">Consulte valores</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                            {/* Resumo Total */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="text-purple-500" size={20} />
                                    <span className="text-sm font-bold text-purple-800">Total Selecionado:</span>
                                </div>
                                <span className="text-2xl font-black text-purple-600">
                                    {(collaboratorForm.services || []).length}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Botão Salvar */}
            <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
                <Button
                    onClick={handleSaveCollaborator}
                    loading={loading}
                    disabled={!collaboratorForm.name.trim() || !collaboratorForm.phone.trim()}
                >
                    <Save size={20} />
                    {editingCollaborator ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
                </Button>
            </div>
        </div>
    );
};

// TELA DE CADASTRO DE CLIENTES
const ClientManagementScreen = ({
    setView,
    clients,
    setShowClientForm,
    handleDeleteClient,
    setEditingClient,
    setClientForm,
    loading
}) => (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 pt-12 pb-8 rounded-b-[32px] shadow-xl">
            <button onClick={() => setView('admin')} className="text-white/80 hover:text-white mb-4 flex items-center gap-2 text-sm">
                <X size={18} />
                Voltar
            </button>
            <h2 className="text-2xl font-black text-white mb-2">Clientes</h2>
            <p className="text-pink-100 text-sm">Gerencie seu cadastro de clientes</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
            {/* Botão Adicionar */}
            <button
                onClick={() => {
                    setEditingClient(null);
                    setClientForm({ name: '', phone: '(   ) ', email: '' });
                    setShowClientForm(true);
                }}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all active:scale-95"
            >
                <Plus size={20} />
                Adicionar Cliente
            </button>

            {/* Lista de Clientes */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-pink-500 mb-4" size={40} />
                    <p className="text-gray-500 text-sm">Carregando clientes...</p>
                </div>
            ) : clients.length === 0 ? (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <User className="text-gray-400" size={36}/>
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum cliente cadastrado</p>
                    <p className="text-gray-400 text-xs mt-1">Clique em "Adicionar Cliente" para começar</p>
                </div>
            ) : (
                clients.map(client => (
                    <div
                        key={client.id}
                        className="bg-white p-5 rounded-3xl shadow-md border-2 border-transparent hover:border-pink-200 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0 font-black text-xl">
                                {(client.name || 'C').charAt(0).toUpperCase()}
                            </div>
                            {/* Info */}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">{client.name}</h3>
                                {client.phone && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-1">
                                        <Phone size={12} />
                                        {client.phone}
                                    </p>
                                )}
                                {client.email && (
                                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-2">
                                        <Mail size={12} />
                                        {client.email}
                                    </p>
                                )}
                            </div>
                            {/* Ações */}
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setEditingClient(client);
                                        setShowClientForm(true);
                                    }}
                                    className="p-2 bg-pink-50 hover:bg-pink-100 rounded-xl transition-colors"
                                >
                                    <Edit size={18} className="text-pink-600" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Deseja realmente excluir ${client.name}?`)) {
                                            handleDeleteClient(client.id);
                                        }
                                    }}
                                    className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                >
                                    <Trash2 size={18} className="text-red-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// TELA DE FORMULÁRIO DE CLIENTE
const ClientFormScreen = ({
    setShowClientForm,
    clientForm,
    setClientForm,
    handleSaveClient,
    loading,
    editingClient,
    setEditingClient
}) => {
    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-white p-6 shadow-md sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200">
                <button onClick={() => {
                    setShowClientForm(false);
                    setEditingClient(null);
                    setClientForm({ name: '', phone: '(   ) ', email: '' });
                }} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={22} className="text-gray-600" />
                </button>
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">
                        {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
                    <p className="text-xs text-gray-500">Preencha os dados do cliente</p>
                </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
                {/* Dados Pessoais */}
                <div className="bg-white p-6 rounded-3xl shadow-md space-y-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-pink-500" size={20} />
                        Dados Pessoais
                    </h3>
                    <InputField
                        label="Nome Completo"
                        icon={User}
                        value={clientForm.name}
                        onChange={e => setClientForm({...clientForm, name: e.target.value})}
                        placeholder="Ex: João Silva"
                    />
                    <InputField
                        label="Telefone / WhatsApp"
                        icon={Phone}
                        value={clientForm.phone}
                        onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                        placeholder="(   ) 99999-9999"
                        formatPhone={true}
                    />
                    <InputField
                        label="Email (Opcional)"
                        icon={Mail}
                        type="email"
                        value={clientForm.email}
                        onChange={e => setClientForm({...clientForm, email: e.target.value})}
                        placeholder="joao@email.com"
                    />
                </div>
            </div>

            {/* Botão Salvar */}
            <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
                <Button
                    onClick={handleSaveClient}
                    loading={loading}
                    disabled={!clientForm.name.trim() || !clientForm.phone.trim()}
                >
                    <Save size={20} />
                    {editingClient ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </Button>
            </div>
        </div>
    );
};

// Componente Auxiliar para Botões de Navegação
const NavButton = ({ icon: Icon, onClick, label }) => (
    <button 
        onClick={onClick}
        className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white p-3 rounded-2xl transition-all flex-1 flex flex-col items-center justify-center gap-1 group border border-white/5"
    >
        <Icon size={20} className="group-hover:scale-110 transition-transform" />
    </button>
);

const AdminScreen = ({
    salonData,
    appointments,
    services,
    setView,
    setCurrentSalonId,
    handleSync,
    handleCancelAppointment
}) => {
    // Estado local para loading do sync
    const [localLoading, setLocalLoading] = useState(false);

    // Função interna de sync para controlar o loading local do botão
    const onSyncClick = async () => {
        setLocalLoading(true);
        if (handleSync) {
            await handleSync();
        } else {
            setTimeout(() => alert("Função de Sync precisa ser passada via props!"), 500);
        }
        setLocalLoading(false);
    };

    return (
        <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 pt-10 pb-8 rounded-b-[40px] shadow-2xl">
                
                {/* LINHA 1: Título e Sair */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2">
                            <Settings size={20} className="text-pink-500" />
                            Painel Admin
                        </h1>
                        <p className="text-gray-400 text-xs mt-1 font-medium">{salonData?.name}</p>
                    </div>
                    
                    <button 
                        onClick={() => {setCurrentSalonId(null); setView('landing')}} 
                        className="bg-white/10 hover:bg-red-500/20 text-white p-2.5 rounded-xl transition-all border border-white/5 hover:border-red-500/50 group"
                        title="Sair"
                    >
                        <LogOut size={20} className="group-hover:text-red-400 transition-colors" />
                    </button>
                </div>
                {/* LINHA 2: Barra de Navegação (Ícones Uniformes) */}
                <div className="flex justify-between gap-2">
                    <NavButton icon={User} onClick={() => setView('client-management')} label="Clientes" />
                    <NavButton icon={Users} onClick={() => setView('collaborator-management')} label="Equipe" />
                    <NavButton icon={List} onClick={() => setView('service-management')} label="Serviços" />
                    <NavButton icon={Settings} onClick={() => setView('settings')} label="Config" />
                    
                    {/* Botão Sync Destacado */}
                    <button 
                        onClick={onSyncClick}
                        disabled={localLoading}
                        className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-3 rounded-2xl shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all w-12 h-12 flex items-center justify-center border border-white/10"
                        title="Sincronizar Google"
                    >
                        {localLoading ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} fill="currentColor" />}
                    </button>
                </div>
                {/* Resumo Rápido */}
                <div className="flex gap-3 mt-6">
                    <StatCard icon={Calendar} label="Agenda" value={appointments.length} color="pink" />
                    <StatCard icon={Sparkles} label="Serviços" value={services.length} color="purple" />
                </div>
            </div>
            {/* Lista de Agendamentos */}
            <div className="p-6 flex-1 overflow-y-auto -mt-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Calendar size={20} className="text-pink-500" />
                        Agenda Hoje
                    </h3>
                </div>
                {appointments.length === 0 ? (
                    <div className="text-center py-12 opacity-60">
                        <Calendar className="mx-auto text-gray-400 mb-2" size={40}/>
                        <p className="text-gray-500 text-sm">Sem agendamentos</p>
                    </div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {appointments.map(app => (
                            <div key={app.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex justify-between items-center group">
                                <div className="flex gap-4 items-center">
                                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex flex-col items-center justify-center text-green-700 border border-green-100">
                                        <span className="text-lg font-black">{app.time}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">{app.clientName}</h4>
                                        <p className="text-gray-500 text-xs">{app.serviceName}</p>
                                        <p className="text-purple-600 text-[10px] font-bold mt-0.5">{app.collaboratorName}</p>
                                    </div>
                                </div>
                                
                                {/* Botão de Deletar (Lixeira) */}
                                <button 
                                    onClick={() => handleCancelAppointment(app)}
                                    className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const SuccessScreen = ({ setView, setCurrentSalonId }) => (
    <div className="flex flex-col h-full bg-gradient-to-br from-green-50 to-emerald-50 items-center justify-center p-8 text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-2xl animate-bounce">
            <CheckCircle size={56} className="text-white" strokeWidth={3} />
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-3">Agendamento Confirmado!</h2>
        <p className="text-gray-600 mb-2">Seu horário foi reservado com sucesso</p>
        <p className="text-sm text-gray-500 mb-8">Você receberá uma confirmação em breve</p>

        <div className="w-full space-y-3">
            <Button onClick={() => setView('client-home')}>
                <ArrowRight size={20} />
                Voltar para Serviços
            </Button>
            <button onClick={() => {setCurrentSalonId(null); setView('landing')}} className="text-gray-500 text-sm hover:text-gray-700 transition-colors">
                Sair do aplicativo
            </button>
        </div>
    </div>
);

// ============================================
// COMPONENTE PRINCIPAL (APP)
// ============================================

export default function App() {
    const [currentSalonId, setCurrentSalonId] = useState(null);
    const [salonData, setSalonData] = useState(null);
    const [view, setView] = useState('landing');
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointments, setSelectedAppointments] = useState([]);

    const [activeCategory, setActiveCategory] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState(null);

    const [editProfile, setEditProfile] = useState({
        name: '',
        address: '',
        phone: '(   ) ',
        email: '',
        googleCalendarId: ''
    });

    const [ownerForm, setOwnerForm] = useState(INITIAL_OWNER_FORM);
    const [showRegistration, setShowRegistration] = useState(false);

    const [allSalons, setAllSalons] = useState([]);
    const [globalServices, setGlobalServices] = useState([]);
    const [salonServices, setSalonServices] = useState([]);

    // Estados para colaborador no agendamento
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [availableCollaborators, setAvailableCollaborators] = useState([]);

    // Estados para colaboradores
    const [collaborators, setCollaborators] = useState([]);
    const [showCollaboratorForm, setShowCollaboratorForm] = useState(false);
    const [editingCollaborator, setEditingCollaborator] = useState(null);
    const [collaboratorForm, setCollaboratorForm] = useState({
        name: '',
        phone: '(   ) ',
        email: '',
        googleCalendarId: '',
        services: [],
        active: true
    });

    // Estados para clientes
    const [clients, setClients] = useState([]);
    const [showClientForm, setShowClientForm] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [clientForm, setClientForm] = useState({
        name: '',
        phone: '(   ) ',
        email: ''
    });

    // NOVOS ESTADOS - Cliente (Login/Cadastro)
    const [clientPhone, setClientPhone] = useState('');
    const [clientName, setClientName] = useState('');
    const [clientData, setClientData] = useState(null);
    const [needsRegistration, setNeedsRegistration] = useState(false);

    useEffect(() => {
        if (view === 'client-salon-selection') {
            setLoading(true);
            const fetchAllSalons = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, "salons"));
                    const salonsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setAllSalons(salonsData);
                } catch (error) {
                    console.error("Erro ao buscar salões:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchAllSalons();
        }
    }, [view]);

    useEffect(() => {
        if (view === 'service-management') {
            setLoading(true);
            const fetchGlobalServices = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, "services"));
                    const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setGlobalServices(servicesData);
                } catch (error) {
                    console.error("Erro ao buscar serviços globais:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchGlobalServices();
        }
    }, [view]);

    // Função de login para proprietário
    const handleOwnerLogin = async () => {
        if (!ownerForm.phone.trim() || ownerForm.phone.length < 10) {
            alert("⚠️ Digite um telefone válido");
            return;
        }

        if (ownerForm.securityCode.length < 4) {
            alert("⚠️ Informe seu PIN de segurança (mínimo 4 dígitos)");
            return;
        }

        setLoading(true);
        try {
            // Busca todos os salões e filtra por telefone
            const querySnapshot = await getDocs(collection(db, "salons"));
            const allSalons = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Normaliza telefones para comparação (remove formatação)
            const searchPhone = ownerForm.phone.replace(/\D/g, '');
            const foundSalon = allSalons.find(salon => {
                if (!salon.phone) return false;
                const salonPhone = salon.phone.replace(/\D/g, '');
                return salonPhone === searchPhone || salon.phone === ownerForm.phone;
            });
            
            if (foundSalon) {
                const enteredHash = await hashSecurityCode(ownerForm.securityCode);
                const salonRef = doc(db, "salons", foundSalon.id);

                if (foundSalon.securityHash) {
                    if (enteredHash !== foundSalon.securityHash) {
                        alert("❌ PIN incorreto. Verifique e tente novamente.");
                        return;
                    }
                } else {
                    // Migração: salva um PIN para salões antigos sem segurança
                    await updateDoc(salonRef, { securityHash: enteredHash });
                }

                setCurrentSalonId(foundSalon.id);
                setSalonData(foundSalon);
                setEditProfile({
                    name: foundSalon.name,
                    address: foundSalon.address,
                    phone: foundSalon.phone || '(   ) ',
                    email: foundSalon.email || '',
                    googleCalendarId: foundSalon.googleCalendarId || ''
                });
                setUser({
                    id: 'owner-' + Date.now(),
                    name: 'Proprietário',
                    role: 'admin',
                    avatar: 'P'
                });
                setOwnerForm(INITIAL_OWNER_FORM);
                setView('admin');
                alert("✅ Login realizado com sucesso!");
            } else {
                setShowRegistration(true);
                alert("ℹ️ Salão não encontrado. Você pode criar um novo cadastro.");
            }
        } catch (error) {
            console.error("Erro ao fazer login:", error);
            alert("❌ Erro ao buscar salão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleOwnerRegistration = async () => {
        if (!ownerForm.name.trim() || !ownerForm.address.trim() || !ownerForm.phone.trim()) {
            alert("⚠️ Preencha todos os campos");
            return;
        }

        if (!ownerForm.email.trim() || !EMAIL_REGEX.test(ownerForm.email.trim())) {
            alert("⚠️ Informe um e-mail válido");
            return;
        }

        if (ownerForm.securityCode.length < 4) {
            alert("⚠️ Crie um PIN com pelo menos 4 dígitos");
            return;
        }

        if (ownerForm.securityCode !== ownerForm.confirmSecurityCode) {
            alert("⚠️ O PIN e a confirmação não coincidem");
            return;
        }

        setLoading(true);
        const salonId = ownerForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();

        try {
            const securityHash = await hashSecurityCode(ownerForm.securityCode);
            const newSalon = {
                name: ownerForm.name,
                address: ownerForm.address,
                phone: ownerForm.phone,
                email: ownerForm.email.trim(),
                googleCalendarId: '',
                plan: 'free_trial',
                active: true,
                createdAt: new Date().toISOString(),
                securityHash
            };

            await setDoc(doc(db, "salons", salonId), newSalon);
            
            setCurrentSalonId(salonId);
            setSalonData(newSalon);
            setEditProfile({
                name: newSalon.name,
                address: newSalon.address,
                phone: newSalon.phone || '(   ) ',
                email: newSalon.email || '',
                googleCalendarId: ''
            });
            setUser({
                id: 'owner-' + Date.now(),
                name: 'Proprietário',
                role: 'admin',
                avatar: 'P'
            });
            setOwnerForm(INITIAL_OWNER_FORM);
            setShowRegistration(false);
            setView('admin');
            alert("✅ Salão cadastrado com sucesso!");
        } catch (error) {
            console.error("Erro ao cadastrar salão:", error);
            alert("❌ Erro ao cadastrar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSalon = async (salon) => {
        setCurrentSalonId(salon.id);
        setSalonData(salon);
        
        // Se cliente já está logado, ir direto para home
        if (clientData || clientPhone) {
            // Se cliente já existe neste salão, buscar dados
            const phoneKey = (clientData?.phone || clientPhone || '').replace(/\D/g, '');
            if (phoneKey) {
                try {
                    const clientRef = doc(db, "salons", salon.id, "clients", phoneKey);
                    const clientDoc = await getDoc(clientRef);
                    if (clientDoc.exists()) {
                        const data = clientDoc.data();
                        setClientData(data);
                        await updateDoc(clientRef, {
                            lastVisit: new Date().toISOString()
                        });
                    }
                } catch (error) {
                    console.error("Erro ao buscar cliente:", error);
                }
            }
            setView('client-home');
        } else {
            // Se não está logado, ir para home (cliente já fez login antes)
            setView('client-home');
        }
    };

    const handleUpdateServicePrice = async (serviceId, price) => {
        if (!currentSalonId) return;
        
        try {
            const serviceRef = doc(db, "salons", currentSalonId, "services", serviceId);
            await updateDoc(serviceRef, { price: price });
            
            // Atualizar estado local
            setSalonServices(prev => prev.map(s => 
                s.id === serviceId ? { ...s, price: price } : s
            ));
        } catch (error) {
            console.error("Erro ao atualizar preço:", error);
            alert("❌ Erro ao atualizar preço. Tente novamente.");
        }
    };

    const handleUpdateServiceDuration = async (serviceId, duration) => {
        if (!currentSalonId) return;
        
        try {
            const serviceRef = doc(db, "salons", currentSalonId, "services", serviceId);
            await updateDoc(serviceRef, { duration_minutes: duration });
            
            // Atualizar estado local
            setSalonServices(prev => prev.map(s => 
                s.id === serviceId ? { ...s, duration_minutes: duration } : s
            ));
        } catch (error) {
            console.error("Erro ao atualizar duração:", error);
            alert("❌ Erro ao atualizar duração. Tente novamente.");
        }
    };

    const handleToggleService = async (service) => {
        if (!currentSalonId) return;
        
        try {
            const serviceRef = doc(db, "salons", currentSalonId, "services", service.id);
            const serviceDoc = await getDoc(serviceRef);
            
            if (serviceDoc.exists()) {
                await deleteDoc(serviceRef);
                setSalonServices(prev => prev.filter(s => s.id !== service.id));
            } else {
                // Normalizar dados: sempre salvar em inglês no Firestore
                // Ler de português ou inglês, mas salvar sempre em inglês
                const serviceData = {};
                
                // Normalizar name (português: nome, inglês: name)
                if (service.name !== undefined && service.name !== null) {
                    serviceData.name = service.name;
                } else if (service.nome !== undefined && service.nome !== null) {
                    serviceData.name = service.nome;
                } else {
                    serviceData.name = '';
                }
                
                // Preço personalizado - sempre começa como 0 (será definido pelo proprietário)
                serviceData.price = 0;
                
                // Normalizar category (português: categoria, inglês: category)
                if (service.category !== undefined && service.category !== null) {
                    serviceData.category = service.category;
                } else if (service.categoria !== undefined && service.categoria !== null) {
                    serviceData.category = service.categoria;
                } else {
                    serviceData.category = '';
                }
                
                // Normalizar duration_minutes (português: duracao, inglês: duration_minutes)
                if (service.duration_minutes !== undefined && service.duration_minutes !== null) {
                    serviceData.duration_minutes = service.duration_minutes;
                } else if (service.duracao !== undefined && service.duracao !== null) {
                    serviceData.duration_minutes = service.duracao;
                } else {
                    serviceData.duration_minutes = 0;
                }
                
                // Normalizar description (português: descricao, inglês: description)
                if (service.description !== undefined && service.description !== null) {
                    serviceData.description = service.description;
                } else if (service.descricao !== undefined && service.descricao !== null) {
                    serviceData.description = service.descricao;
                } else {
                    serviceData.description = '';
                }
                
                // Garantir que campos obrigatórios sempre existam (não remover)
                // Campos vazios são permitidos, mas undefined/null não
                if (serviceData.name === undefined || serviceData.name === null) {
                    serviceData.name = '';
                }
                if (serviceData.price === undefined || serviceData.price === null) {
                    serviceData.price = 0;
                }
                if (serviceData.category === undefined || serviceData.category === null) {
                    serviceData.category = '';
                }
                if (serviceData.duration_minutes === undefined || serviceData.duration_minutes === null) {
                    serviceData.duration_minutes = 0;
                }
                if (serviceData.description === undefined || serviceData.description === null) {
                    serviceData.description = '';
                }
                
                await setDoc(serviceRef, serviceData);
                
                // Normalizar o objeto service para o estado também
                const normalizedService = {
                    id: service.id,
                    name: serviceData.name,
                    price: 0, // Preço personalizado será definido depois
                    category: serviceData.category || '',
                    duration_minutes: serviceData.duration_minutes || 0,
                    description: serviceData.description || ''
                };
                
                setSalonServices(prev => [...prev, normalizedService]);
            }
        } catch (error) {
            console.error("Erro ao alternar serviço:", error);
            alert("❌ Erro ao atualizar serviço. Tente novamente.");
        }
    };

    const handleSaveProfile = async () => {
        if (!currentSalonId) return;

        if (editProfile.email && editProfile.email.trim() && !EMAIL_REGEX.test(editProfile.email.trim())) {
            alert("⚠️ Informe um e-mail válido");
            return;
        }

        setLoading(true);
        try {
            const docRef = doc(db, "salons", currentSalonId);
            await updateDoc(docRef, {
                name: editProfile.name,
                address: editProfile.address,
                phone: editProfile.phone,
                email: editProfile.email?.trim() || '',
                googleCalendarId: editProfile.googleCalendarId
            });
            setSalonData({ ...salonData, ...editProfile });
            alert("✅ Perfil atualizado com sucesso!");
        } catch (error) {
            console.error("Erro ao atualizar perfil:", error);
            alert("❌ Erro ao salvar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentSalonId) return;

        const fetchSalonServices = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "salons", currentSalonId, "services"));
                const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setServices(servicesData);
                setSalonServices(servicesData);
                
                // Buscar categorias dos serviços globais para ter todas as opções
                try {
                    const globalServicesSnapshot = await getDocs(collection(db, "services"));
                    const globalServicesData = globalServicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    
                    // Combinar categorias dos serviços do salão e dos serviços globais
                    const allCategories = [
                        ...servicesData.map(s => s.category || s.categoria),
                        ...globalServicesData.map(s => s.category || s.categoria)
                    ].filter(Boolean);
                    
                    const uniqueCats = [...new Set(allCategories)].sort();
                    setCategories(uniqueCats);
                    // Definir a primeira categoria como ativa se não houver categoria selecionada
                    if (uniqueCats.length > 0 && !activeCategory) {
                        setActiveCategory(uniqueCats[0]);
                    }
                } catch (error) {
                    // Se falhar ao buscar serviços globais, usar apenas os do salão
                    if (servicesData.length > 0) {
                        const uniqueCats = [...new Set(servicesData.map(s => s.category || s.categoria).filter(Boolean))].sort();
                        setCategories(uniqueCats);
                        // Definir a primeira categoria como ativa se não houver categoria selecionada
                        if (uniqueCats.length > 0 && !activeCategory) {
                            setActiveCategory(uniqueCats[0]);
                        }
                    }
                }
            } catch (error) {
                console.error("Erro ao buscar serviços:", error);
            }
        };
        fetchSalonServices();

        if (view === 'admin' || view === 'settings' || view === 'service-management') {
            const q = query(collection(db, "salons", currentSalonId, "appointments"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const apptData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAppointments(apptData);
            });
            return () => unsubscribe();
        }
    }, [currentSalonId, view]);

    // Atualizar categoria ativa quando as categorias mudarem
    useEffect(() => {
        if (categories.length > 0) {
            // Se a categoria atual não existe mais, seleciona a primeira disponível
            if (!categories.includes(activeCategory)) {
                setActiveCategory(categories[0]);
            }
        } else {
            setActiveCategory('');
        }
    }, [categories]);

    // Buscar colaboradores disponíveis quando serviço for selecionado
    useEffect(() => {
        if (!currentSalonId || !selectedService) {
            setAvailableCollaborators([]);
            return;
        }

        const fetchAvailableCollaborators = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "salons", currentSalonId, "collaborators"));
                const allCollabs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                // Filtrar apenas colaboradores ativos que fazem esse serviço
                const available = allCollabs.filter(collab => 
                    collab.active && 
                    collab.services && 
                    collab.services.includes(selectedService.id)
                );
                
                setAvailableCollaborators(available);
            } catch (error) {
                console.error("Erro ao buscar colaboradores:", error);
                setAvailableCollaborators([]);
            }
        };
        fetchAvailableCollaborators();
    }, [currentSalonId, selectedService]);

    // NOVA FUNÇÃO: Login/Cadastro do Cliente
    const handleClientLogin = async (e) => {
        e.preventDefault();
        if (!clientPhone.trim()) {
            alert("⚠️ Digite seu telefone");
            return;
        }

        // Se precisa de cadastro, validar nome também
        if (needsRegistration && !clientName.trim()) {
            alert("⚠️ Digite seu nome");
            return;
        }

        setLoading(true);
        const phoneKey = clientPhone.replace(/\D/g, ''); // Remove formatação

        try {
            // Se não tem salão selecionado, apenas salvar dados do cliente e ir para seleção de salões
            if (!currentSalonId) {
                // Salvar dados do cliente temporariamente
                if (needsRegistration && clientName.trim()) {
                    setClientData({
                        name: clientName,
                        phone: phoneKey,
                        email: ''
                    });
                    setUser({
                        id: phoneKey,
                        name: clientName,
                        phone: phoneKey,
                        role: 'client',
                        avatar: 'C'
                    });
                } else {
                    // Cliente existente - apenas salvar dados temporários
                    setClientData({
                        name: clientName || 'Cliente',
                        phone: phoneKey,
                        email: ''
                    });
                    setUser({
                        id: phoneKey,
                        name: clientName || 'Cliente',
                        phone: phoneKey,
                        role: 'client',
                        avatar: 'C'
                    });
                }
                
                setView('client-salon-selection');
                setNeedsRegistration(false);
                setLoading(false);
                return;
            }

            // Se já tem salão selecionado, fazer login/cadastro no salão
            const clientRef = doc(db, "salons", currentSalonId, "clients", phoneKey);
            const clientDoc = await getDoc(clientRef);

            if (clientDoc.exists()) {
                // Cliente já existe - Fazer login
                const data = clientDoc.data();
                setClientData(data);
                setUser({
                    id: phoneKey,
                    name: data.name,
                    phone: data.phone,
                    role: 'client',
                    avatar: 'C'
                });

                // Atualizar última visita
                await updateDoc(clientRef, {
                    lastVisit: new Date().toISOString()
                });

                setView('client-home');
                setNeedsRegistration(false);
            } else {
                // Cliente não existe
                if (needsRegistration) {
                    // Cadastrar novo cliente
                    const newClient = {
                        name: clientName,
                        phone: formatPhone(phoneKey),
                        email: '',
                        createdAt: new Date().toISOString(),
                        lastVisit: new Date().toISOString()
                    };

                    await setDoc(clientRef, {
                        ...newClient,
                        phone: phoneKey // Salvar sem formatação no Firestore
                    });
                    
                    setClientData({
                        ...newClient,
                        phone: phoneKey
                    });
                    setUser({
                        id: phoneKey,
                        name: newClient.name,
                        phone: phoneKey,
                        role: 'client',
                        avatar: 'C'
                    });
                    setView('client-home');
                    setNeedsRegistration(false);
                    alert("✅ Cadastro realizado com sucesso!");
                } else {
                    // Pedir para completar cadastro
                    setNeedsRegistration(true);
                }
            }
        } catch (error) {
            console.error("Erro ao processar cliente:", error);
            alert("❌ Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Estado para horários ocupados
    const [bookedTimes, setBookedTimes] = useState(new Set());

    // Buscar horários ocupados (Google + Firebase)
    useEffect(() => {
        if (!currentSalonId || !selectedDate || !selectedCollaborator) {
            setBookedTimes(new Set());
            return;
        }

        const fetchAllBusyTimes = async () => {
            const newBusySet = new Set();

            // 1. Bloqueia horários do próprio App (Firebase)
            try {
                const q = query(
                    collection(db, "salons", currentSalonId, "appointments"),
                    where("date", "==", selectedDate),
                    where("collaboratorId", "==", selectedCollaborator.id),
                    where("status", "==", "confirmado")
                );
                const snapshot = await getDocs(q);
                snapshot.forEach(doc => {
                    // Adiciona o horário exato do agendamento (ex: "14:00")
                    if (doc.data().time) newBusySet.add(doc.data().time);
                });
            } catch (e) { console.error("Erro Firebase:", e); }

            // 2. Bloqueia intervalos do Google Agenda
            if (selectedCollaborator.googleCalendarId) {
                try {
                    const response = await fetch('/api/get-slots', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            googleCalendarId: selectedCollaborator.googleCalendarId,
                            date: selectedDate
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        
                        // data.busy é uma lista de intervalos: [{start: '...', end: '...'}, ...]
                        if (data.busy && data.busy.length > 0) {
                            
                            // Para cada horário disponível no nosso App (09:00, 10:00...)
                            TIME_SLOTS.forEach(slotTime => {
                                // 1. Define Início e Fim do POSSÍVEL agendamento
                                const slotStart = new Date(`${selectedDate}T${slotTime}:00-03:00`);
                                
                                // Pega a duração do serviço escolhido (ou 60min se não tiver)
                                const duration = selectedService.duration_minutes || selectedService.duracao || 60;
                                const slotEnd = new Date(slotStart.getTime() + duration * 60000);
                                
                                // 2. Verifica COLISÃO com qualquer bloqueio do Google
                                const isBlocked = data.busy.some(interval => {
                                    const busyStart = new Date(interval.start);
                                    const busyEnd = new Date(interval.end);
                                    
                                    // FÓRMULA DE COLISÃO PERFEITA:
                                    // Verifica se os intervalos se "tocam" ou sobrepõem
                                    return slotStart < busyEnd && slotEnd > busyStart;
                                });

                                if (isBlocked) {
                                    newBusySet.add(slotTime);
                                }
                            });
                        }
                    }
                } catch (e) { console.error("Erro Google Slots:", e); }
            }

            setBookedTimes(newBusySet);
        };

        fetchAllBusyTimes();
    }, [currentSalonId, selectedDate, selectedCollaborator]);

    // ATUALIZAR: Criar agendamento com dados do cliente cadastrado e verificação de conflito
    const handleCreateAppointment = async () => {
        if (!selectedService || !selectedTime || !selectedCollaborator) {
            alert("⚠️ Selecione profissional, data e horário");
            return;
        }

        if (!clientData) {
            alert("⚠️ Erro: dados do cliente não encontrados");
            setView('client-login');
            return;
        }

        // Verificar se o horário já está ocupado
        if (bookedTimes.has(selectedTime)) {
            alert("⚠️ Este horário já está ocupado. Por favor, escolha outro horário.");
            return;
        }

        // Verificação adicional no Firestore antes de criar
        setLoading(true);
        try {
            const appointmentsRef = collection(db, "salons", currentSalonId, "appointments");
            const conflictQuery = query(
                appointmentsRef,
                where("date", "==", selectedDate),
                where("time", "==", selectedTime),
                where("collaboratorId", "==", selectedCollaborator.id),
                where("status", "==", "confirmado")
            );
            
            const conflictSnapshot = await getDocs(conflictQuery);
            if (!conflictSnapshot.empty) {
                alert("⚠️ Este horário foi ocupado enquanto você agendava. Por favor, escolha outro horário.");
                setLoading(false);
                // Atualizar lista de horários ocupados
                const booked = new Set(bookedTimes);
                booked.add(selectedTime);
                setBookedTimes(booked);
                return;
            }

            // Criar agendamento
            const appointmentData = {
                serviceName: selectedService.name || selectedService.nome,
                servicePrice: selectedService.price || selectedService.preco,
                date: selectedDate,
                time: selectedTime,
                clientName: clientData.name,        // ← Usa nome cadastrado
                clientPhone: clientData.phone,      // ← NOVO: Salva telefone
                collaboratorId: selectedCollaborator.id,
                collaboratorName: selectedCollaborator.name,
                status: 'confirmado',
                createdAt: new Date().toISOString()
            };
            
            // Salva no banco do App
            const appointmentRef = await addDoc(collection(db, "salons", currentSalonId, "appointments"), appointmentData);
            
            // NOVO: Salvar no Google Agenda (Integração)
            // Verifica se o colaborador tem um ID de agenda configurado
            if (selectedCollaborator.googleCalendarId) {
                try {
                    // Chama nossa API de backend
                    const googleResponse = await fetch('/api/create-appointment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            serviceName: appointmentData.serviceName,
                            date: appointmentData.date,
                            time: appointmentData.time,
                            duration: selectedService.duration_minutes || selectedService.duracao || 60,
                            clientName: appointmentData.clientName,
                            clientPhone: appointmentData.clientPhone,
                            googleCalendarId: selectedCollaborator.googleCalendarId // O ID que colamos no cadastro
                        })
                    });
                    
                    if (googleResponse.ok) {
                        const googleData = await googleResponse.json();
                        // Atualiza o agendamento com o ID do evento do Google
                        if (googleData.googleEventId) {
                            await updateDoc(appointmentRef, {
                                googleEventId: googleData.googleEventId,
                                googleCalendarId: selectedCollaborator.googleCalendarId
                            });
                        }
                        console.log("✅ Sincronizado com Google Agenda!");
                    }
                } catch (googleError) {
                    console.error("⚠️ Agendado no App, mas falhou no Google:", googleError);
                    // Não damos alert de erro aqui para não assustar o cliente, pois no App já salvou.
                }
            }
            
            setLoading(false);
            setView('success');
            
            // Resetar seleções
            setSelectedCollaborator(null);
            setSelectedTime(null);
        } catch (error) {
            console.error("Erro ao agendar:", error);
            alert("❌ Erro ao agendar. Tente novamente.");
            setLoading(false);
        }
    };

    // Função para deletar agendamentos selecionados
    const handleDeleteSelectedAppointments = async () => {
        if (selectedAppointments.length === 0) {
            alert("⚠️ Selecione pelo menos um agendamento para excluir");
            return;
        }

        if (!confirm(`⚠️ Tem certeza que deseja excluir ${selectedAppointments.length} agendamento(s)?`)) {
            return;
        }

        setLoading(true);
        try {
            const deletePromises = selectedAppointments.map(appointmentId => {
                const appointmentRef = doc(db, "salons", currentSalonId, "appointments", appointmentId);
                return deleteDoc(appointmentRef);
            });

            await Promise.all(deletePromises);
            setSelectedAppointments([]);
            alert(`✅ ${selectedAppointments.length} agendamento(s) excluído(s) com sucesso!`);
        } catch (error) {
            console.error("Erro ao excluir agendamentos:", error);
            alert("❌ Erro ao excluir agendamentos. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Função para cancelar um agendamento individual
    const handleCancelAppointment = async (appointment) => {
        if (!confirm(`⚠️ Tem certeza que deseja cancelar o agendamento de ${appointment.clientName}?`)) {
            return;
        }

        setLoading(true);
        try {
            const appointmentRef = doc(db, "salons", currentSalonId, "appointments", appointment.id);
            await deleteDoc(appointmentRef);
            alert(`✅ Agendamento cancelado com sucesso!`);
        } catch (error) {
            console.error("Erro ao cancelar agendamento:", error);
            alert("❌ Erro ao cancelar agendamento. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    // Função para limpar agendamentos fantasmas
    const handleSync = async () => {
        if (appointments.length === 0) return;
        setLoading(true);
        try {
            // 1. Filtra apenas os que têm vínculo com Google
            const linkedAppointments = appointments.filter(a => a.googleEventId && a.googleCalendarId);
            
            if (linkedAppointments.length === 0) {
                alert("Nenhum agendamento vinculado ao Google para verificar.");
                setLoading(false);
                return;
            }
            // 2. Pergunta para a API: "Quais desses sumiram do Google?"
            const response = await fetch('/api/sync-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointments: linkedAppointments })
            });
            const data = await response.json();
            // 3. Apaga do Firebase os que a API mandou
            if (data.idsToDelete && data.idsToDelete.length > 0) {
                const batch = writeBatch(db);
                data.idsToDelete.forEach(id => {
                    const docRef = doc(db, "salons", currentSalonId || salonData?.id, "appointments", id);
                    batch.delete(docRef);
                });
                await batch.commit();
                alert(`🧹 Limpeza completa! ${data.idsToDelete.length} agendamentos fantasmas removidos.`);
            } else {
                alert("✅ Tudo sincronizado! Nenhum agendamento fantasma.");
            }
        } catch (error) {
            console.error("Erro ao sincronizar:", error);
            alert("Erro na sincronização.");
        } finally {
            setLoading(false);
        }
    };

    // Executar exclusão automática quando carregar agendamentos (exclui agendamentos de 7 dias atrás)
    useEffect(() => {
        if (currentSalonId && (view === 'admin' || view === 'settings' || view === 'service-management')) {
            const autoDelete = async () => {
                try {
                    const today = new Date();
                    const sevenDaysAgo = new Date(today);
                    sevenDaysAgo.setDate(today.getDate() - 7);
                    const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

                    const appointmentsRef = collection(db, "salons", currentSalonId, "appointments");
                    const q = query(appointmentsRef);
                    const querySnapshot = await getDocs(q);
                    
                    const appointmentsToDelete = [];
                    querySnapshot.forEach((docSnapshot) => {
                        const data = docSnapshot.data();
                        const appointmentDate = data.date;
                        
                        // Compara apenas a data (sem hora)
                        if (appointmentDate && appointmentDate < cutoffDate) {
                            appointmentsToDelete.push(docSnapshot.id);
                        }
                    });

                    if (appointmentsToDelete.length > 0) {
                        const deletePromises = appointmentsToDelete.map(appointmentId => {
                            const appointmentRef = doc(db, "salons", currentSalonId, "appointments", appointmentId);
                            return deleteDoc(appointmentRef);
                        });

                        await Promise.all(deletePromises);
                        console.log(`✅ ${appointmentsToDelete.length} agendamento(s) antigo(s) excluído(s) automaticamente`);
                    }
                } catch (error) {
                    console.error("Erro ao excluir agendamentos antigos:", error);
                }
            };
            autoDelete();
        }
    }, [currentSalonId, view]);

    // Funções de Colaboradores
    useEffect(() => {
        if (!currentSalonId) return;
        
        if (view === 'collaborator-management' || view === 'admin' || showCollaboratorForm) {
            const fetchCollaborators = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, "salons", currentSalonId, "collaborators"));
                    const collabData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setCollaborators(collabData);
                } catch (error) {
                    console.error("Erro ao buscar colaboradores:", error);
                }
            };
            fetchCollaborators();
        }
    }, [currentSalonId, view, showCollaboratorForm]);

    const handleSaveCollaborator = async () => {
        if (!collaboratorForm.name.trim() || !collaboratorForm.phone.trim()) {
            alert("⚠️ Preencha nome e telefone");
            return;
        }

        setLoading(true);
        try {
            const collaboratorData = {
                name: collaboratorForm.name,
                phone: collaboratorForm.phone,
                email: collaboratorForm.email,
                googleCalendarId: collaboratorForm.googleCalendarId?.trim() || '',
                services: collaboratorForm.services,
                active: collaboratorForm.active
            };

            if (editingCollaborator) {
                // Editar existente
                const docRef = doc(db, "salons", currentSalonId, "collaborators", editingCollaborator.id);
                await updateDoc(docRef, collaboratorData);
                alert("✅ Colaborador atualizado!");
            } else {
                // Criar novo
                await addDoc(collection(db, "salons", currentSalonId, "collaborators"), {
                    ...collaboratorData,
                    createdAt: new Date().toISOString()
                });
                alert("✅ Colaborador cadastrado!");
            }
            
            setShowCollaboratorForm(false);
            // Resetar form incluindo o novo campo
            setCollaboratorForm({ name: '', phone: '(   ) ', email: '', googleCalendarId: '', services: [], active: true });
            setEditingCollaborator(null);
            if (view !== 'collaborator-management') {
                setView('collaborator-management');
            }
        } catch (error) {
            console.error("Erro ao salvar colaborador:", error);
            alert("❌ Erro ao salvar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollaborator = async (collabId) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, "salons", currentSalonId, "collaborators", collabId));
            setCollaborators(prev => prev.filter(c => c.id !== collabId));
            alert("✅ Colaborador removido!");
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("❌ Erro ao remover.");
        } finally {
            setLoading(false);
        }
    };

    // Preencher form ao editar colaborador
    useEffect(() => {
        if (editingCollaborator) {
            setCollaboratorForm({
                name: editingCollaborator.name || '',
                phone: editingCollaborator.phone || '(   ) ',
                email: editingCollaborator.email || '',
                googleCalendarId: editingCollaborator.googleCalendarId || '',
                services: editingCollaborator.services || [],
                active: editingCollaborator.active !== false
            });
        } else {
            // Resetar form quando não está editando
            setCollaboratorForm({ name: '', phone: '(   ) ', email: '', googleCalendarId: '', services: [], active: true });
        }
    }, [editingCollaborator]);

    // Funções de Clientes
    useEffect(() => {
        if (!currentSalonId) return;
        
        if (view === 'client-management' || view === 'admin' || showClientForm) {
            const fetchClients = async () => {
                try {
                    const querySnapshot = await getDocs(collection(db, "salons", currentSalonId, "clients"));
                    const clientsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setClients(clientsData);
                } catch (error) {
                    console.error("Erro ao buscar clientes:", error);
                }
            };
            fetchClients();
        }
    }, [currentSalonId, view, showClientForm]);

    const handleSaveClient = async () => {
        if (!clientForm.name.trim() || !clientForm.phone.trim()) {
            alert("⚠️ Preencha nome e telefone");
            return;
        }

        setLoading(true);
        try {
            if (editingClient) {
                // Editar existente
                const docRef = doc(db, "salons", currentSalonId, "clients", editingClient.id);
                await updateDoc(docRef, {
                    name: clientForm.name,
                    phone: clientForm.phone,
                    email: clientForm.email
                });
                alert("✅ Cliente atualizado!");
            } else {
                // Criar novo
                await addDoc(collection(db, "salons", currentSalonId, "clients"), {
                    name: clientForm.name,
                    phone: clientForm.phone,
                    email: clientForm.email,
                    createdAt: new Date().toISOString()
                });
                alert("✅ Cliente cadastrado!");
            }
            
            setShowClientForm(false);
            setClientForm({ name: '', phone: '(   ) ', email: '' });
            setEditingClient(null);
        } catch (error) {
            console.error("Erro ao salvar cliente:", error);
            alert("❌ Erro ao salvar. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClient = async (clientId) => {
        setLoading(true);
        try {
            await deleteDoc(doc(db, "salons", currentSalonId, "clients", clientId));
            setClients(prev => prev.filter(c => c.id !== clientId));
            alert("✅ Cliente removido!");
        } catch (error) {
            console.error("Erro ao deletar:", error);
            alert("❌ Erro ao remover.");
        } finally {
            setLoading(false);
        }
    };

    // Preencher form ao editar cliente
    useEffect(() => {
        if (editingClient) {
            setClientForm({
                name: editingClient.name || '',
                phone: editingClient.phone || '(   ) ',
                email: editingClient.email || ''
            });
        }
    }, [editingClient]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4 font-sans selection:bg-pink-200">
            <div className="w-full max-w-[380px] h-[780px] bg-white rounded-[44px] shadow-2xl overflow-hidden relative border-[10px] border-gray-900 flex flex-col">
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-[28px] z-50 shadow-xl"></div>

                <div className="flex-1 overflow-hidden relative bg-white">
                    {view === 'landing' && <LandingScreen setView={setView} />}
                    
                    {view === 'owner-login' && (
                        <OwnerLoginScreen
                            ownerForm={ownerForm}
                            setOwnerForm={setOwnerForm}
                            handleOwnerLogin={handleOwnerLogin}
                            handleOwnerRegistration={handleOwnerRegistration}
                            loading={loading}
                            setView={setView}
                            showRegistration={showRegistration}
                            setShowRegistration={setShowRegistration}
                        />
                    )}

                    {view === 'owner-registration' && (
                        <OwnerRegistrationScreen
                            ownerForm={ownerForm}
                            setOwnerForm={setOwnerForm}
                            handleOwnerRegistration={handleOwnerRegistration}
                            loading={loading}
                            setView={setView}
                        />
                    )}

                    {view === 'client-salon-selection' && (
                        <ClientSalonSelectionScreen
                            allSalons={allSalons}
                            loading={loading}
                            handleSelectSalon={handleSelectSalon}
                            setView={setView}
                        />
                    )}

                    {view === 'client-login' && (
                        <ClientLoginScreen
                            clientPhone={clientPhone}
                            setClientPhone={setClientPhone}
                            clientName={clientName}
                            setClientName={setClientName}
                            needsRegistration={needsRegistration}
                            handleClientLogin={handleClientLogin}
                            loading={loading}
                            setView={setView}
                        />
                    )}

                    {view === 'service-management' && (
                        <ServiceManagementScreen
                            setView={setView}
                            globalServices={globalServices}
                            salonServices={salonServices}
                            loading={loading}
                            handleToggleService={handleToggleService}
                            currentSalonId={currentSalonId}
                            handleUpdateServicePrice={handleUpdateServicePrice}
                            handleUpdateServiceDuration={handleUpdateServiceDuration}
                        />
                    )}

                    {view === 'settings' && (
                        <SettingsScreen
                            setView={setView}
                            editProfile={editProfile}
                            setEditProfile={setEditProfile}
                            handleSaveProfile={handleSaveProfile}
                            loading={loading}
                        />
                    )}

                    {view === 'client-home' && (
                        <ClientHomeScreen
                            salonData={salonData}
                            categories={categories}
                            activeCategory={activeCategory}
                            setActiveCategory={setActiveCategory}
                            services={services}
                            setSelectedService={setSelectedService}
                            setView={setView}
                            setCurrentSalonId={setCurrentSalonId}
                            setSelectedCollaborator={setSelectedCollaborator}
                        />
                    )}

                    {view === 'booking' && (
                        <BookingScreen
                            selectedService={selectedService}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            selectedTime={selectedTime}
                            setSelectedTime={setSelectedTime}
                            selectedCollaborator={selectedCollaborator}
                            setSelectedCollaborator={setSelectedCollaborator}
                            availableCollaborators={availableCollaborators}
                            handleCreateAppointment={handleCreateAppointment}
                            loading={loading}
                            setView={setView}
                            bookedTimes={bookedTimes}
                            currentSalonId={currentSalonId}
                        />
                    )}

                    {view === 'success' && (
                        <SuccessScreen
                            setView={setView}
                            setCurrentSalonId={setCurrentSalonId}
                        />
                    )}

                    {view === 'admin' && (
                        <AdminScreen
                            salonData={salonData}
                            appointments={appointments}
                            services={services}
                            setView={setView}
                            setCurrentSalonId={setCurrentSalonId}
                            handleSync={handleSync}
                            handleCancelAppointment={handleCancelAppointment}
                        />
                    )}

                    {view === 'collaborator-management' && !showCollaboratorForm && (
                        <CollaboratorManagementScreen
                            setView={setView}
                            collaborators={collaborators}
                            setShowCollaboratorForm={setShowCollaboratorForm}
                            handleDeleteCollaborator={handleDeleteCollaborator}
                            setEditingCollaborator={setEditingCollaborator}
                            loading={loading}
                        />
                    )}

                    {showCollaboratorForm && (
                        <CollaboratorFormScreen
                            setShowCollaboratorForm={setShowCollaboratorForm}
                            collaboratorForm={collaboratorForm}
                            setCollaboratorForm={setCollaboratorForm}
                            services={services}
                            handleSaveCollaborator={handleSaveCollaborator}
                            loading={loading}
                            editingCollaborator={editingCollaborator}
                        />
                    )}

                    {view === 'client-management' && !showClientForm && (
                        <ClientManagementScreen
                            setView={setView}
                            clients={clients}
                            setShowClientForm={setShowClientForm}
                            handleDeleteClient={handleDeleteClient}
                            setEditingClient={setEditingClient}
                            setClientForm={setClientForm}
                            loading={loading}
                        />
                    )}

                    {showClientForm && (
                        <ClientFormScreen
                            setShowClientForm={setShowClientForm}
                            clientForm={clientForm}
                            setClientForm={setClientForm}
                            handleSaveClient={handleSaveClient}
                            loading={loading}
                            editingClient={editingClient}
                            setEditingClient={setEditingClient}
                        />
                    )}
                </div>
            </div>

            {/* FloatingChat - sempre no final, fora do container com overflow-hidden */}
            {view === 'client-home' && currentSalonId && (clientData || clientPhone) && (
                <FloatingChat
                    key={currentSalonId}
                    clientId={(clientData?.phone || clientPhone || '').replace(/\D/g, '')}
                    salonId={currentSalonId}
                    setView={setView}
                />
            )}
        </div>
    );
}