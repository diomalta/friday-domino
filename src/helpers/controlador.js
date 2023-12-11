import { Jogo } from "./jogo.js";
import { Jogador } from "./jogador.js";
import Config from "../config.js";

const estado = new Jogo();
const jogadores = new Map([
  [1, new Jogador()],
  [2, new Jogador()],
  [3, new Jogador()],
  [4, new Jogador()],
]);

export async function controlador(jogo, possibilidades) {
  estado.calcularPedrasRestantes(jogo, estado);
  estado.calcularFrequencia(jogo.mao, jogo.mesa);

  let melhorJogada = null;
  let melhorPontuacao = -Infinity;

  for (const possibilidade of possibilidades) {
    let pontuacao = 0;
    const [mesaEsquerda, mesaDireita] = estado.obterExtremos(jogo.mesa);

    const jogadorPrincipal = jogadores.get(jogo.jogador);
    pontuacao += jogadorPrincipal.simularDistribuicaoPedras({
      jogo,
      possibilidade,
      estado,
      jogadores,
    });

    const pedra = possibilidade.pedra.split("-").map(Number);
    pontuacao += pedra[0] + pedra[1];
    pontuacao += pedra[0] === pedra[1] ? Config.PRIORIDADE.ALTA : 0;

    const idOponente = estado.obterProximoJogador(jogo.jogador);
    if (jogadores.has(idOponente)) {
      const oponente = jogadores.get(idOponente);

      pontuacao += jogadorPrincipal.marcarOponente({
        passouPontas: oponente.passouPontas,
        ultimaJogada: oponente.ultimaJogada,
        possibilidade,
        extremos: [mesaEsquerda, mesaDireita],
      });
    }

    pontuacao += jogadorPrincipal.estrategiaPorFrequencia({
      possibilidade,
      extremos: [mesaEsquerda, mesaDireita],
      estado,
    });

    const minhaMao = [...jogo.mao].filter(
      (pedra) => possibilidade.pedra !== pedra
    );

    const numerosUnicos = new Set(minhaMao.join("-").split("-"));
    pontuacao += numerosUnicos.size;

    console.log(pontuacao, pedra);
    if (pontuacao > melhorPontuacao) {
      melhorJogada = possibilidade;
      melhorPontuacao = pontuacao;
    }
  }

  estado.rodada++;

  return melhorJogada;
}
