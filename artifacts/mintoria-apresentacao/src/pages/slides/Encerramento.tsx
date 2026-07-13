const base = import.meta.env.BASE_URL;

export default function Encerramento() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0b1220]">
      <img
        src={`${base}brand/hero-selfie.jpg`}
        crossOrigin="anonymous"
        alt="Pessoas tirando uma selfie em um evento"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-black/80" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[10vw]">
        <img
          src={`${base}brand/mintoria-logo.png`}
          crossOrigin="anonymous"
          alt="Logo da Mintoria"
          className="w-[10vh] h-[10vh] rounded-[2vh] shadow-2xl mb-[4vh]"
        />
        <h2 className="font-display font-bold text-white text-[5.5vw] leading-tight" style={{ textWrap: "balance" }}>
          Cada visita merece uma lembrança eterna
        </h2>
        <p className="font-body text-white/80 text-[1.9vw] mt-[4vh]">
          Conheça a plataforma e crie o seu primeiro drop
        </p>
        <div className="flex items-center gap-[1vw] mt-[6vh]">
          <div className="h-[0.4vh] w-[4vw] bg-accent rounded-full" />
          <span className="font-body font-semibold text-white text-[2vw] tracking-[0.15em] uppercase">
            mintoria.xyz
          </span>
          <div className="h-[0.4vh] w-[4vw] bg-accent rounded-full" />
        </div>
      </div>
    </div>
  );
}
