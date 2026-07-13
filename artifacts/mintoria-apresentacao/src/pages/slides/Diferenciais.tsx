export default function Diferenciais() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-blue-100/50" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[5vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          06 · Diferenciais
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          O que separa a Mintoria de um NFT comum
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-4 gap-[1.4vw] mt-[6vh]">
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Zero fricção</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              E-mail no lugar de carteira cripto
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Multi-tenant</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              SaaS com isolamento de dados por organizador
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Freemium</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              Do plano Free ao Enterprise, com limites por plano
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Custo mínimo</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              Solana: mint barato e confirmação rápida
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-[1.4vw] mt-[2.2vh] mx-[6vw]">
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Três idiomas</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              Interface completa em EN, PT e ES
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">PWA instalável</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              Funciona como app sem loja de aplicativos
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.5vw]">
            <p className="font-body font-semibold text-primary text-[1.45vw]">Anti-fraude</p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1vh]">
              Sessões com expiração e um mint por e-mail por drop
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
