const base = import.meta.env.BASE_URL;

export default function OProblema() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-blue-100/60" />
      <div className="relative z-10 h-full grid grid-cols-[54fr_46fr]">
        <div className="flex flex-col justify-center pl-[6vw] pr-[3vw]">
          <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
            01 · O problema
          </span>
          <h2 className="font-display font-bold text-text text-[4.2vw] leading-tight mt-[2vh]" style={{ textWrap: "balance" }}>
            Experiências inesquecíveis, lembranças que se perdem
          </h2>
          <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
          <div className="mt-[5vh] flex flex-col gap-[3.5vh]">
            <div className="flex items-start gap-[1.4vw]">
              <div className="w-[0.9vh] h-[0.9vh] rounded-full bg-primary mt-[1.4vh] shrink-0" />
              <p className="font-body text-text/85 text-[1.75vw] leading-snug">
                Turismo, shows e eventos não deixam nenhuma lembrança digital autêntica e verificável
              </p>
            </div>
            <div className="flex items-start gap-[1.4vw]">
              <div className="w-[0.9vh] h-[0.9vh] rounded-full bg-primary mt-[1.4vh] shrink-0" />
              <p className="font-body text-text/85 text-[1.75vw] leading-snug">
                NFTs tradicionais exigem carteira cripto, seed phrase e conhecimento técnico
              </p>
            </div>
            <div className="flex items-start gap-[1.4vw]">
              <div className="w-[0.9vh] h-[0.9vh] rounded-full bg-primary mt-[1.4vh] shrink-0" />
              <p className="font-body text-text/85 text-[1.75vw] leading-snug">
                Organizadores perdem o vínculo digital com o público depois que o evento termina
              </p>
            </div>
          </div>
        </div>
        <div className="relative m-[6vh] mr-[5vw] rounded-[2.5vh] overflow-hidden shadow-2xl">
          <img
            src={`${base}brand/feature-travel.jpg`}
            crossOrigin="anonymous"
            alt="Viajante em um destino turístico"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
