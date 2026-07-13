const base = import.meta.env.BASE_URL;

export default function ASolucao() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-bl from-bg via-bg to-blue-100/60" />
      <div className="relative z-10 h-full grid grid-cols-[46fr_54fr]">
        <div className="relative m-[6vh] ml-[5vw] rounded-[2.5vh] overflow-hidden shadow-2xl">
          <img
            src={`${base}brand/feature-qrcode.jpg`}
            crossOrigin="anonymous"
            alt="Pessoa escaneando um QR code com o celular"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="flex flex-col justify-center pr-[6vw] pl-[3vw]">
          <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
            02 · A solução
          </span>
          <h2 className="font-display font-bold text-text text-[4.2vw] leading-tight mt-[2vh]" style={{ textWrap: "balance" }}>
            NFTs comemorativos sem fricção
          </h2>
          <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
          <div className="mt-[5vh] flex flex-col gap-[3vh]">
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.4vw] w-[3vw] shrink-0">1</span>
              <p className="font-body text-text/85 text-[1.8vw] leading-snug">
                O visitante escaneia o QR code no local
              </p>
            </div>
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.4vw] w-[3vw] shrink-0">2</span>
              <p className="font-body text-text/85 text-[1.8vw] leading-snug">
                Digita o e-mail e confirma um código
              </p>
            </div>
            <div className="flex items-center gap-[1.4vw]">
              <span className="font-display font-bold text-primary text-[2.4vw] w-[3vw] shrink-0">3</span>
              <p className="font-body text-text/85 text-[1.8vw] leading-snug">
                Recebe o NFT direto na sua galeria
              </p>
            </div>
          </div>
          <p className="font-body font-semibold text-primary text-[1.9vw] mt-[5vh]">
            Sem carteira. Sem cripto. Sem app para instalar.
          </p>
        </div>
      </div>
    </div>
  );
}
