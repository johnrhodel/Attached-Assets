export default function Seguranca() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg">
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/60 via-bg to-bg" />
      <div className="relative z-10 h-full grid grid-cols-[44fr_56fr]">
        <div className="flex flex-col justify-center pl-[6vw] pr-[2vw]">
          <span className="font-body text-primary font-semibold text-[1.3vw] tracking-[0.25em] uppercase">
            09 · Segurança
          </span>
          <h2 className="font-display font-bold text-text text-[4.2vw] leading-tight mt-[2vh]" style={{ textWrap: "balance" }}>
            Proteção em todas as camadas
          </h2>
          <div className="h-[0.5vh] w-[6vw] bg-primary rounded-full mt-[3vh]" />
          <p className="font-body text-muted text-[1.6vw] leading-snug mt-[4vh]">
            Da senha do organizador à chave da carteira, cada camada tem uma defesa própria
          </p>
        </div>
        <div className="flex flex-col justify-center pr-[6vw] pl-[2vw] gap-[2.2vh]">
          <div className="bg-white rounded-[2vh] shadow-lg px-[1.8vw] py-[2.2vh] flex items-center gap-[1.4vw]">
            <span className="font-display font-bold text-primary text-[1.8vw]">✓</span>
            <p className="font-body text-text/85 text-[1.5vw]">Senhas com hash scrypt — nunca em texto puro</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg px-[1.8vw] py-[2.2vh] flex items-center gap-[1.4vw]">
            <span className="font-display font-bold text-primary text-[1.8vw]">✓</span>
            <p className="font-body text-text/85 text-[1.5vw]">Carteiras custodiais cifradas com AES-256</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg px-[1.8vw] py-[2.2vh] flex items-center gap-[1.4vw]">
            <span className="font-display font-bold text-primary text-[1.8vw]">✓</span>
            <p className="font-body text-text/85 text-[1.5vw]">Sessões seguras armazenadas em PostgreSQL</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg px-[1.8vw] py-[2.2vh] flex items-center gap-[1.4vw]">
            <span className="font-display font-bold text-primary text-[1.8vw]">✓</span>
            <p className="font-body text-text/85 text-[1.5vw]">Helmet e Content Security Policy no servidor</p>
          </div>
          <div className="bg-white rounded-[2vh] shadow-lg px-[1.8vw] py-[2.2vh] flex items-center gap-[1.4vw]">
            <span className="font-display font-bold text-primary text-[1.8vw]">✓</span>
            <p className="font-body text-text/85 text-[1.5vw]">Rate limiting contra abuso nos endpoints críticos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
