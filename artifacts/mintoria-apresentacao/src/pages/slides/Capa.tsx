const base = import.meta.env.BASE_URL;

export default function Capa() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-[#0b1220]">
      <img
        src={`${base}brand/hero-tourist.jpg`}
        crossOrigin="anonymous"
        alt="Turista fotografando um ponto turístico"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-[10vw]">
        <img
          src={`${base}brand/mintoria-logo.png`}
          crossOrigin="anonymous"
          alt="Logo da Mintoria"
          className="w-[11vh] h-[11vh] rounded-[2.2vh] shadow-2xl mb-[4vh]"
        />
        <h1 className="font-display font-bold text-white text-[7.5vw] leading-none tracking-tight">
          Mintoria
        </h1>
        <p className="font-body text-white/85 text-[2.4vw] mt-[3.5vh] max-w-[52vw] leading-snug" style={{ textWrap: "balance" }}>
          Suas memórias eternizadas com tecnologia
        </p>
        <div className="flex items-center gap-[1vw] mt-[6vh]">
          <div className="h-[0.4vh] w-[4vw] bg-accent rounded-full" />
          <span className="font-body text-white/70 text-[1.4vw] tracking-[0.2em] uppercase">
            mintoria.xyz
          </span>
          <div className="h-[0.4vh] w-[4vw] bg-accent rounded-full" />
        </div>
      </div>
    </div>
  );
}
