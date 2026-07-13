const base = import.meta.env.BASE_URL;

export default function CasosDeUso() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg to-blue-100/50" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[5vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          07 · Casos de uso
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          Onde a Mintoria já faz sentido hoje
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-4 gap-[1.6vw] mt-[5.5vh]">
          <div className="rounded-[2vh] overflow-hidden shadow-lg bg-white">
            <div className="relative h-[30vh]">
              <img
                src={`${base}brand/rio-cristo-redentor.png`}
                crossOrigin="anonymous"
                alt="Cristo Redentor no Rio de Janeiro"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="font-body font-semibold text-text text-[1.3vw] p-[1vw]">
              Pontos turísticos
            </p>
          </div>
          <div className="rounded-[2vh] overflow-hidden shadow-lg bg-white">
            <div className="relative h-[30vh]">
              <img
                src={`${base}brand/foz-cataratas.png`}
                crossOrigin="anonymous"
                alt="Cataratas do Iguaçu em Foz do Iguaçu"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="font-body font-semibold text-text text-[1.3vw] p-[1vw]">
              Parques e natureza
            </p>
          </div>
          <div className="rounded-[2vh] overflow-hidden shadow-lg bg-white">
            <div className="relative h-[30vh]">
              <img
                src={`${base}brand/curitiba-jardim-botanico.png`}
                crossOrigin="anonymous"
                alt="Jardim Botânico de Curitiba"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="font-body font-semibold text-text text-[1.3vw] p-[1vw]">
              Museus e cultura
            </p>
          </div>
          <div className="rounded-[2vh] overflow-hidden shadow-lg bg-white">
            <div className="relative h-[30vh]">
              <img
                src={`${base}brand/paris-eiffel-tower.png`}
                crossOrigin="anonymous"
                alt="Torre Eiffel em Paris"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="font-body font-semibold text-text text-[1.3vw] p-[1vw]">
              Destinos internacionais
            </p>
          </div>
        </div>
        <p className="font-body text-muted text-[1.5vw] mt-[4vh]">
          Também em shows e festivais, eventos corporativos e conferências
        </p>
      </div>
    </div>
  );
}
