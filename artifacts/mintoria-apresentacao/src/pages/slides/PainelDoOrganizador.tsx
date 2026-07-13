const base = import.meta.env.BASE_URL;

export default function PainelDoOrganizador() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-blue-100/60" />
      <div className="relative z-10 h-full grid grid-cols-[54fr_46fr]">
        <div className="flex flex-col justify-center pl-[6vw] pr-[3vw]">
          <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
            05 · Painel do organizador
          </span>
          <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]" style={{ textWrap: "balance" }}>
            Do cadastro ao QR code em poucos cliques
          </h2>
          <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
          <div className="mt-[5vh] flex flex-col gap-[2.8vh]">
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.2vw] w-[3vw] shrink-0">1</span>
              <p className="font-body text-text/85 text-[1.7vw] leading-snug">
                Auto-cadastro como organizador na plataforma
              </p>
            </div>
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.2vw] w-[3vw] shrink-0">2</span>
              <p className="font-body text-text/85 text-[1.7vw] leading-snug">
                Cria projetos, locais e drops — coleções por mês e por local
              </p>
            </div>
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.2vw] w-[3vw] shrink-0">3</span>
              <p className="font-body text-text/85 text-[1.7vw] leading-snug">
                Gera QR codes prontos para imprimir e espalhar no evento
              </p>
            </div>
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.2vw] w-[3vw] shrink-0">4</span>
              <p className="font-body text-text/85 text-[1.7vw] leading-snug">
                Acompanha mints e estatísticas em tempo real no dashboard
              </p>
            </div>
          </div>
        </div>
        <div className="relative m-[6vh] mr-[5vw] rounded-[2.5vh] overflow-hidden shadow-2xl">
          <img
            src={`${base}brand/hero-concert.jpg`}
            crossOrigin="anonymous"
            alt="Show com público e luzes de palco"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
