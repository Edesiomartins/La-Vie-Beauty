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
  Zap
} from 'lucide-react';

// Importações do Firebase
import { db } from './firebaseConfig';
import { collection, getDocs, addDoc, query, onSnapshot, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

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

const InputField = ({ label, value, onChange, icon: Icon, placeholder, type = "text" }) => (
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
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-gray-200 focus:border-pink-400 focus:ring-4 focus:ring-pink-100 outline-none transition-all duration-200 text-gray-800 placeholder:text-gray-400"
      />
    </div>
  </div>
);

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
// LOGO PROFISSIONAL - 3 OPÇÕES
// ============================================

// OPÇÃO 1: Logo com Sparkles + Star (Elegante e Luxuoso)
const LogoOption1 = () => (
  <div className="relative w-24 h-24 bg-white rounded-[28px] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 hover:rotate-6">
    {/* Brilho de fundo animado */}
    <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-orange-300 rounded-[28px] opacity-20 blur-xl animate-pulse"></div>

    {/* Container dos ícones */}
    <div className="relative flex items-center justify-center">
      {/* Sparkles principal */}
      <Sparkles size={42} className="text-pink-600" strokeWidth={2.5} />

      {/* Star pequena no canto superior direito */}
      <Star
        size={18}
        className="absolute -top-2 -right-2 text-yellow-500 fill-yellow-400 animate-pulse"
        strokeWidth={2}
      />

      {/* Sparkles pequena no canto inferior esquerdo */}
      <Sparkles
        size={14}
        className="absolute -bottom-1 -left-1 text-rose-400 animate-bounce"
        strokeWidth={2}
      />
    </div>
  </div>
);

// OPÇÃO 2: Logo com Scissors + Heart (Profissional e Acolhedor)
const LogoOption2 = () => (
  <div className="relative w-24 h-24 bg-gradient-to-br from-white to-pink-50 rounded-[28px] flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 border-4 border-white">
    {/* Halo luminoso */}
    <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-rose-300 to-purple-300 rounded-[24px] opacity-30 blur-2xl"></div>

    {/* Container principal */}
    <div className="relative">
      {/* Círculo de fundo decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full scale-150 opacity-50"></div>

      {/* Scissors principal */}
      <div className="relative flex items-center justify-center">
        <Scissors size={38} className="text-pink-600" strokeWidth={2.5} />

        {/* Heart pequeno no centro */}
        <Heart
          size={12}
          className="absolute text-rose-500 fill-rose-400 animate-pulse"
          strokeWidth={2}
        />
      </div>

      {/* Sparkles decorativos */}
      <Sparkles
        size={10}
        className="absolute -top-2 -right-2 text-yellow-400 animate-bounce"
        strokeWidth={2}
      />
      <Sparkles
        size={8}
        className="absolute -bottom-1 -left-1 text-pink-400 animate-pulse"
        strokeWidth={2}
      />
    </div>
  </div>
);

// OPÇÃO 3: Logo Minimalista Premium (Moderno e Sofisticado)
const LogoOption3 = () => (
  <div className="relative w-24 h-24 group">
    {/* Camada de fundo com gradiente animado */}
    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 rounded-[28px] shadow-2xl transform group-hover:scale-110 transition-all duration-500 group-hover:rotate-3"></div>

    {/* Camada interna branca */}
    <div className="absolute inset-[3px] bg-white rounded-[25px] flex items-center justify-center">
      {/* Gradiente sutil de fundo */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-transparent rounded-[25px]"></div>

      {/* Ícone principal */}
      <div className="relative">
        {/* Store estilizado */}
        <div className="relative flex items-center justify-center">
          <Store size={40} className="text-pink-600" strokeWidth={2.5} />
        </div>

        {/* Badge premium */}
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
          <Star size={10} className="text-white fill-white" strokeWidth={3} />
        </div>

        {/* Zap de energia */}
        <Zap
          size={12}
          className="absolute -bottom-1 -left-1 text-pink-500 fill-pink-400 animate-pulse"
          strokeWidth={2}
        />
      </div>
    </div>

    {/* Brilho externo */}
    <div className="absolute -inset-1 bg-gradient-to-br from-pink-400 to-rose-400 rounded-[30px] opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500"></div>
  </div>
);

// ============================================
// TELAS (COMPONENTS FORA DO APP)
// ============================================

const LandingScreen = ({ salonInput, setSalonInput, handleEnterSalon, loading }) => (
  <div className="flex flex-col h-full bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400 p-6 justify-center items-center text-white relative overflow-hidden">
    {/* Elementos decorativos de fundo */}
    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
    <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-600/30 rounded-full blur-3xl"></div>
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>

    <div className="relative z-10 flex flex-col items-center w-full">
      {/* OPÇÃO 1: Elegante e Luxuoso */}
      <LogoOption1 />

      <div className="text-center mb-2 mt-6">
        <h1 className="text-3xl font-black mb-2 tracking-tight drop-shadow-lg">
          La Vie Beauty
        </h1>
        <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-lg">
          <p className="text-white text-xs font-semibold tracking-wide">Gestão Inteligente</p>
        </div>
      </div>

      <p className="text-white/80 text-center mb-8 text-xs max-w-[260px] drop-shadow-md">
        Transforme seu salão com tecnologia profissional
      </p>

      {/* Formulário */}
      <form onSubmit={handleEnterSalon} className="w-full space-y-3">
        <div className="bg-white/15 backdrop-blur-xl p-5 rounded-3xl border-2 border-white/30 shadow-2xl">
          <label className="text-xs font-bold uppercase tracking-wider mb-2 block text-white/90">
            Nome do Seu Negócio
          </label>
          <div className="relative">
            <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Ex: Studio Bella Hair"
              value={salonInput}
              onChange={(e) => setSalonInput(e.target.value)}
              maxLength={100}
              className="w-full pl-11 pr-14 py-3.5 rounded-xl bg-white text-gray-800 outline-none focus:ring-4 focus:ring-white/30 font-medium text-sm placeholder:text-gray-400 transition-all"
            />
            <button
              type="submit"
              disabled={!salonInput.trim() || loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-700 hover:to-rose-700 transition-all duration-200 flex items-center gap-1 shadow-lg"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span className="text-xs font-bold hidden sm:inline">Entrar</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          <p className="text-white/60 text-[9px] mt-1.5 text-center">
            {salonInput.length}/100 caracteres
          </p>
        </div>
      </form>

      {/* Features */}
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

const AuthScreen = ({ salonData, handleLogin, loading, setCurrentSalonId, setView }) => (
  <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white p-8 justify-between">
    <div className="mt-16 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
        <Store size={36} className="text-white" />
      </div>
      <h1 className="text-3xl font-black text-gray-900 mb-2">{salonData?.name}</h1>
      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
        <MapPin size={14} />
        <p>{salonData?.address || "Configure seu endereço"}</p>
      </div>
      {salonData?.phone && (
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mt-1">
          <Phone size={14} />
          <p>{salonData.phone}</p>
        </div>
      )}
    </div>

    <div className="space-y-4 mb-8">
      <p className="text-center text-gray-600 text-sm mb-6 font-medium">
        Como você deseja acessar?
      </p>
      <Button onClick={() => handleLogin('client')} loading={loading}>
        <User size={20} />
        Sou Cliente
      </Button>
      <Button variant="outline" onClick={() => handleLogin('admin')} disabled={loading}>
        <Settings size={20} />
        Sou Proprietário
      </Button>
    </div>
  </div>
);

const SettingsScreen = ({
  setView,
  editProfile,
  setEditProfile,
  handleSaveProfile,
  loading
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100">
    {/* Header */}
    <div className="bg-white p-6 shadow-md sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200">
      <button
        onClick={() => setView('admin')}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={22} className="text-gray-600" />
      </button>
      <div>
        <h2 className="font-bold text-gray-800 text-lg">Configurações</h2>
        <p className="text-xs text-gray-500">Personalize seu estabelecimento</p>
      </div>
    </div>

    <div className="p-6 space-y-6 overflow-y-auto pb-8">
      {/* Status do Plano */}
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

      {/* Dados do Estabelecimento */}
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
          label="Telefone / WhatsApp"
          icon={Phone}
          value={editProfile.phone}
          placeholder="(11) 99999-9999"
          onChange={e => setEditProfile({...editProfile, phone: e.target.value})}
        />
      </div>

      {/* Integrações */}
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
  setCurrentSalonId
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
    {/* Header Melhorado */}
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
        <button
          onClick={() => {setCurrentSalonId(null); setView('landing')}}
          className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full text-white hover:bg-white/30 transition-all"
        >
          <LogOut size={18} />
        </button>
      </div>

      {/* Categorias */}
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

    {/* Lista de Serviços */}
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
          .filter(s => (s.category || s.categoria) === activeCategory || activeCategory === 'Todos')
          .map(service => (
            <div
              key={service.id}
              onClick={() => {
                setSelectedService(service);
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
                  <span className="font-black text-pink-600 text-lg">R$ {service.price || service.preco}</span>
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
  handleCreateAppointment,
  loading,
  setView
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
    {/* Header */}
    <div className="bg-white p-6 shadow-md sticky top-0 z-10 flex items-center gap-4 border-b border-gray-200">
      <button
        onClick={() => setView('client-home')}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X size={22} className="text-gray-600" />
      </button>
      <div>
        <h2 className="font-bold text-gray-800 text-lg">Confirmar Agendamento</h2>
        <p className="text-xs text-gray-500">Escolha data e horário</p>
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
            <p className="text-pink-100 text-sm mb-3">
              {selectedService.duration_minutes || selectedService.duracao} minutos
            </p>
            <div className="bg-white/20 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">
              <p className="font-black text-2xl">R$ {selectedService.price || selectedService.preco}</p>
            </div>
          </div>
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
          {TIME_SLOTS.map(time => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={`py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${
                selectedTime === time
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg scale-105'
                  : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-pink-300 hover:shadow-md'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo */}
      {selectedTime && (
        <div className="bg-green-50 p-5 rounded-2xl border-2 border-green-200 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-green-600" />
            <p className="font-bold text-green-800 text-sm">Resumo do Agendamento</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-green-700">📅 <strong>{new Date(selectedDate + 'T00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</strong></p>
            <p className="text-green-700">🕐 <strong>{selectedTime}</strong></p>
            <p className="text-green-700">✂️ <strong>{selectedService.name || selectedService.nome}</strong></p>
          </div>
        </div>
      )}
    </div>

    {/* Botão Fixo */}
    <div className="p-6 bg-white border-t border-gray-200 shadow-2xl">
      <Button
        onClick={handleCreateAppointment}
        disabled={!selectedTime}
        loading={loading}
      >
        <CheckCircle size={20} />
        Confirmar Agendamento
      </Button>
    </div>
  </div>
);

const AdminScreen = ({
  salonData,
  appointments,
  services,
  setView,
  setCurrentSalonId
}) => (
  <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white">
    {/* Header Admin */}
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6 pt-12 pb-8 rounded-b-[40px] shadow-2xl">
      <div className="flex justify-between items-center text-white mb-6">
        <div>
          <h2 className="text-2xl font-black mb-1">{salonData?.name}</h2>
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <Settings size={12} />
            Painel Administrativo
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('settings')}
            className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl hover:bg-white/20 transition-all"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => {setCurrentSalonId(null); setView('landing')}}
            className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl hover:bg-white/20 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex gap-3">
        <StatCard
          icon={Calendar}
          label="Agendamentos"
          value={appointments.length}
          color="pink"
        />
        <StatCard
          icon={Sparkles}
          label="Serviços"
          value={services.length}
          color="purple"
        />
      </div>
    </div>

    {/* Lista de Agendamentos */}
    <div className="p-6 flex-1 overflow-y-auto -mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Calendar size={20} className="text-pink-500" />
          Agenda do Dia
        </h3>
        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold">
          {appointments.length} agendamentos
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-gray-400" size={36}/>
          </div>
          <p className="text-gray-500 font-medium">Nenhum agendamento hoje</p>
          <p className="text-gray-400 text-xs mt-1">Os novos agendamentos aparecerão aqui</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(app => (
            <div
              key={app.id}
              className="bg-white p-5 rounded-3xl shadow-md border-l-4 border-green-500 hover:shadow-xl transition-all duration-200 group"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 flex-1">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-2">
                      <span className="text-2xl font-black text-green-600">{app.time}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {new Date(app.date + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-800 text-base mb-1">{app.serviceName}</h4>
                    <p className="text-gray-500 text-sm flex items-center gap-1 mb-2">
                      <User size={12} />
                      {app.clientName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">
                        ✓ Confirmado
                      </span>
                      <span className="text-pink-600 font-bold text-sm">
                        R$ {app.servicePrice}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

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
      <button
        onClick={() => {setCurrentSalonId(null); setView('landing')}}
        className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
      >
        Sair do aplicativo
      </button>
    </div>
  </div>
);

// ============================================
// COMPONENTE PRINCIPAL (APP)
// ============================================

export default function App() {
  // --- ESTADOS GLOBAIS ---
  const [currentSalonId, setCurrentSalonId] = useState(null);
  const [salonData, setSalonData] = useState(null);

  const [view, setView] = useState('landing');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- DADOS ---
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState(['Todos']);
  const [appointments, setAppointments] = useState([]);

  // --- ESTADOS DE UI ---
  const [salonInput, setSalonInput] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(null);

  // --- ESTADOS DE PERFIL (Formulário do Dono) ---
  const [editProfile, setEditProfile] = useState({
    name: '',
    address: '',
    phone: '',
    googleCalendarId: ''
  });

  // --- 1. ENTRAR/CRIAR SALÃO ---
  const handleEnterSalon = async (e) => {
    e.preventDefault();
    if (!salonInput.trim()) return;

    setLoading(true);
    const salonId = salonInput.toLowerCase().replace(/[^a-z0-9]/g, '-');

    try {
      const docRef = doc(db, "salons", salonId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrentSalonId(salonId);
        setSalonData(data);
        setEditProfile({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          googleCalendarId: data.googleCalendarId || ''
        });
        setView('auth');
      } else {
        const newSalon = {
          name: salonInput,
          address: '',
          phone: '',
          googleCalendarId: '',
          plan: 'free_trial',
          active: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, "salons", salonId), newSalon);
        setCurrentSalonId(salonId);
        setSalonData(newSalon);
        setEditProfile({ name: salonInput, address: '', phone: '', googleCalendarId: '' });
        setView('auth');
      }
    } catch (error) {
      console.error("Erro ao entrar:", error);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. SALVAR PERFIL DO SALÃO ---
  const handleSaveProfile = async () => {
    if (!currentSalonId) return;
    setLoading(true);
    try {
      const docRef = doc(db, "salons", currentSalonId);
      await updateDoc(docRef, {
        name: editProfile.name,
        address: editProfile.address,
        phone: editProfile.phone,
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

  // --- 3. DATA FETCHING ---
  useEffect(() => {
    if (!currentSalonId) return;

    const fetchServices = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "salons", currentSalonId, "services"));
        const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (servicesData.length > 0) {
          setServices(servicesData);
          const uniqueCats = ['Todos', ...new Set(servicesData.map(s => s.category || s.categoria))];
          setCategories(uniqueCats.sort());
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      }
    };
    fetchServices();

    if (view === 'admin' || view === 'settings') {
      const q = query(collection(db, "salons", currentSalonId, "appointments"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apptData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAppointments(apptData);
      });
      return () => unsubscribe();
    }
  }, [currentSalonId, view]);

  // --- LÓGICA GERAL ---
  const handleLogin = async (role) => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: 'user-' + Date.now(),
        name: role === 'admin' ? 'Proprietário' : 'Cliente',
        role: role,
        avatar: role === 'admin' ? 'P' : 'C'
      });
      setView(role === 'admin' ? 'admin' : 'client-home');
      setLoading(false);
    }, 600);
  };

  const handleCreateAppointment = async () => {
    if (!selectedService || !selectedTime) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "salons", currentSalonId, "appointments"), {
        serviceName: selectedService.name || selectedService.nome,
        servicePrice: selectedService.price || selectedService.preco,
        date: selectedDate,
        time: selectedTime,
        clientName: user.name,
        status: 'confirmado'
      });
      setLoading(false);
      setView('success');
    } catch (error) {
      alert("❌ Erro ao agendar. Tente novamente.");
      setLoading(false);
    }
  };

  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4 font-sans selection:bg-pink-200">
      <div className="w-full max-w-[380px] h-[780px] bg-white rounded-[44px] shadow-2xl overflow-hidden relative border-[10px] border-gray-900 flex flex-col">
        {/* Notch do iPhone */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-[28px] z-50 shadow-xl"></div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-hidden relative bg-white">
          {view === 'landing' && (
            <LandingScreen
              salonInput={salonInput}
              setSalonInput={setSalonInput}
              handleEnterSalon={handleEnterSalon}
              loading={loading}
            />
          )}

          {view === 'auth' && (
            <AuthScreen
              salonData={salonData}
              handleLogin={handleLogin}
              loading={loading}
              setCurrentSalonId={setCurrentSalonId}
              setView={setView}
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
            />
          )}

          {view === 'booking' && (
            <BookingScreen
              selectedService={selectedService}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              handleCreateAppointment={handleCreateAppointment}
              loading={loading}
              setView={setView}
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
            />
          )}
        </div>
      </div>
    </div>
  );
}