export default function NumerosAtuais() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-blue-100/50" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[6vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          10 · Números atuais
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          Plataforma no ar em mintoria.xyz
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-3 gap-[3vw] mt-[8vh]">
          <div className="text-center">
            <p className="font-display font-bold text-primary text-[9vw] leading-none">6</p>
            <p className="font-body font-semibold text-text text-[1.8vw] mt-[2vh]">NFTs mintados</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-primary text-[9vw] leading-none">4</p>
            <p className="font-body font-semibold text-text text-[1.8vw] mt-[2vh]">Locais ativos</p>
          </div>
          <div className="text-center">
            <p className="font-display font-bold text-primary text-[9vw] leading-none">4</p>
            <p className="font-body font-semibold text-text text-[1.8vw] mt-[2vh]">Drops ativos</p>
          </div>
        </div>
        <p className="font-body text-muted text-[1.4vw] mt-[8vh] text-center">
          Fase piloto na Solana devnet — dados da plataforma em julho de 2026
        </p>
      </div>
    </div>
  );
}
