export default function JornadaDoVisitante() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-blue-100/50" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[5vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          03 · Jornada do visitante
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          Do QR code à galeria em menos de um minuto
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-5 gap-[1.6vw] mt-[7vh]">
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <span className="font-display font-bold text-primary text-[3.4vw] leading-none">1</span>
            <p className="font-body font-semibold text-text text-[1.4vw] leading-snug mt-[2.2vh]">
              Escaneia o QR code
            </p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1.2vh]">
              No ponto turístico ou no evento
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <span className="font-display font-bold text-primary text-[3.4vw] leading-none">2</span>
            <p className="font-body font-semibold text-text text-[1.4vw] leading-snug mt-[2.2vh]">
              Abre a página de claim
            </p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1.2vh]">
              Direto no navegador do celular
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <span className="font-display font-bold text-primary text-[3.4vw] leading-none">3</span>
            <p className="font-body font-semibold text-text text-[1.4vw] leading-snug mt-[2.2vh]">
              Confirma o e-mail
            </p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1.2vh]">
              Com um código de verificação
            </p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <span className="font-display font-bold text-primary text-[3.4vw] leading-none">4</span>
            <p className="font-body font-semibold text-text text-[1.4vw] leading-snug mt-[2.2vh]">
              NFT mintado na Solana
            </p>
            <p className="font-body text-muted text-[1.15vw] leading-snug mt-[1.2vh]">
              Em segundos, sem custo para o visitante
            </p>
          </div>
          <div className="bg-primary rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <span className="font-display font-bold text-white text-[3.4vw] leading-none">5</span>
            <p className="font-body font-semibold text-white text-[1.4vw] leading-snug mt-[2.2vh]">
              Galeria "Meus NFTs"
            </p>
            <p className="font-body text-white/80 text-[1.15vw] leading-snug mt-[1.2vh]">
              Com compartilhamento no X e WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
