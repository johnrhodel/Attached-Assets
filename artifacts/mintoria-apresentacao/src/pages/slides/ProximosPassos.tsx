export default function ProximosPassos() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-br from-bg via-bg to-blue-100/60" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[6vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          11 · Próximos passos
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]">
          Da fase piloto à operação em escala
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="mt-[7vh] flex flex-col gap-[4vh] max-w-[62vw]">
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-primary text-[3vw] w-[5vw] shrink-0">01</span>
            <div>
              <p className="font-body font-semibold text-text text-[1.9vw]">Migração para a mainnet da Solana</p>
              <p className="font-body text-muted text-[1.4vw] mt-[0.6vh]">NFTs com valor real, prontos para colecionadores</p>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-primary text-[3vw] w-[5vw] shrink-0">02</span>
            <div>
              <p className="font-body font-semibold text-text text-[1.9vw]">Autenticação em duas etapas</p>
              <p className="font-body text-muted text-[1.4vw] mt-[0.6vh]">Mais proteção para contas de organizadores e admins</p>
            </div>
          </div>
          <div className="flex items-center gap-[2vw]">
            <span className="font-display font-bold text-primary text-[3vw] w-[5vw] shrink-0">03</span>
            <div>
              <p className="font-body font-semibold text-text text-[1.9vw]">Expansão para novos mercados</p>
              <p className="font-body text-muted text-[1.4vw] mt-[0.6vh]">Parcerias com atrações turísticas e produtoras de eventos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
