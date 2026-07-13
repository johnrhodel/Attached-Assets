export default function Planos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-blue-100/50" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[5vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          08 · Planos e modelo de negócio
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          Freemium que cresce com o organizador
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-4 gap-[1.4vw] mt-[5.5vh]">
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <p className="font-body font-semibold text-muted text-[1.3vw] uppercase tracking-wider">Free</p>
            <p className="font-display font-bold text-text text-[2.6vw] mt-[1.5vh]">R$ 0</p>
            <p className="font-body text-muted text-[1.1vw] mt-[0.5vh]">para começar</p>
            <div className="h-[0.3vh] w-full bg-bg rounded-full my-[2.2vh]" />
            <p className="font-body text-text/80 text-[1.2vw] leading-snug">50 mints por drop</p>
            <p className="font-body text-text/80 text-[1.2vw] leading-snug mt-[1.2vh]">1 local ativo</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <p className="font-body font-semibold text-muted text-[1.3vw] uppercase tracking-wider">Starter</p>
            <p className="font-display font-bold text-text text-[2.6vw] mt-[1.5vh]">R$ 599</p>
            <p className="font-body text-muted text-[1.1vw] mt-[0.5vh]">por evento</p>
            <div className="h-[0.3vh] w-full bg-bg rounded-full my-[2.2vh]" />
            <p className="font-body text-text/80 text-[1.2vw] leading-snug">500 mints por drop</p>
            <p className="font-body text-text/80 text-[1.2vw] leading-snug mt-[1.2vh]">1 local ativo</p>
          </div>
          <div className="bg-primary rounded-[2vh] shadow-xl p-[1.6vw] flex flex-col">
            <p className="font-body font-semibold text-white/80 text-[1.3vw] uppercase tracking-wider">Professional</p>
            <p className="font-display font-bold text-white text-[2.6vw] mt-[1.5vh]">R$ 1.497</p>
            <p className="font-body text-white/70 text-[1.1vw] mt-[0.5vh]">por mês</p>
            <div className="h-[0.3vh] w-full bg-white/20 rounded-full my-[2.2vh]" />
            <p className="font-body text-white text-[1.2vw] leading-snug">Mints ilimitados</p>
            <p className="font-body text-white text-[1.2vw] leading-snug mt-[1.2vh]">5 locais e destaque na home</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg p-[1.6vw] flex flex-col">
            <p className="font-body font-semibold text-muted text-[1.3vw] uppercase tracking-wider">Enterprise</p>
            <p className="font-display font-bold text-text text-[2.6vw] mt-[1.5vh]">R$ 4.997</p>
            <p className="font-body text-muted text-[1.1vw] mt-[0.5vh]">por mês</p>
            <div className="h-[0.3vh] w-full bg-bg rounded-full my-[2.2vh]" />
            <p className="font-body text-text/80 text-[1.2vw] leading-snug">Mints ilimitados</p>
            <p className="font-body text-text/80 text-[1.2vw] leading-snug mt-[1.2vh]">Locais ilimitados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
