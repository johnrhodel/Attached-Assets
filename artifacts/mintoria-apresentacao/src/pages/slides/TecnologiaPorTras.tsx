export default function TecnologiaPorTras() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-bg to-bg" />
      <div className="relative z-10 h-full flex flex-col justify-center px-[6vw]">
        <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
          04 · Tecnologia por trás do mint
        </span>
        <h2 className="font-display font-bold text-text text-[4vw] leading-tight mt-[2vh]" style={{ textWrap: "balance" }}>
          Blockchain de verdade, invisível para o usuário
        </h2>
        <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
        <div className="grid grid-cols-3 gap-[2vw] mt-[7vh]">
          <div className="bg-white rounded-[2.5vh] shadow-xl p-[2.2vw]">
            <div className="w-[3.4vw] h-[3.4vw] rounded-[1.2vh] bg-primary/10 flex items-center justify-center">
              <span className="font-display font-bold text-primary text-[1.9vw]">01</span>
            </div>
            <p className="font-body font-semibold text-text text-[1.7vw] mt-[3vh]">
              Carteira custodial automática
            </p>
            <p className="font-body text-muted text-[1.35vw] leading-snug mt-[1.5vh]">
              Criada na hora do claim e cifrada com AES-256 — o visitante nunca vê uma seed phrase
            </p>
          </div>
          <div className="bg-white rounded-[2.5vh] shadow-xl p-[2.2vw]">
            <div className="w-[3.4vw] h-[3.4vw] rounded-[1.2vh] bg-primary/10 flex items-center justify-center">
              <span className="font-display font-bold text-primary text-[1.9vw]">02</span>
            </div>
            <p className="font-body font-semibold text-text text-[1.7vw] mt-[3vh]">
              Mint na Solana via Metaplex Core
            </p>
            <p className="font-body text-muted text-[1.35vw] leading-snug mt-[1.5vh]">
              Transação confirmada em segundos, com custo de mint próximo de zero
            </p>
          </div>
          <div className="bg-white rounded-[2.5vh] shadow-xl p-[2.2vw]">
            <div className="w-[3.4vw] h-[3.4vw] rounded-[1.2vh] bg-primary/10 flex items-center justify-center">
              <span className="font-display font-bold text-primary text-[1.9vw]">03</span>
            </div>
            <p className="font-body font-semibold text-text text-[1.7vw] mt-[3vh]">
              Metadados verificáveis
            </p>
            <p className="font-body text-muted text-[1.35vw] leading-snug mt-[1.5vh]">
              O NFT aparece em exploradores e carteiras Solana, com nome, imagem e local do evento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
