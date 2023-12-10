import { Jogo } from "./jogo.js";
import { Jogador } from "./jogador.js";

const estado = new Jogo();
const jogadores = new Map([
  [1, new Jogador()],
  [2, new Jogador()],
  [3, new Jogador()],
  [4, new Jogador()],
]);

export async function controlador(jogo, possibilidades) {
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

    const idParceiro = estado.procurarIdJogador(jogo.jogador);
    if (jogadores.has(idParceiro)) {
      const parceiro = jogadores.get(idParceiro);

      pontuacao -= parceiro.evitarLadoParceiro({
        ultimaJogada: parceiro.ultimaJogada,
        possibilidade,
        mesa: [mesaEsquerda, mesaDireita],
      });

      pontuacao +=
        parceiro.salvarParceiro({
          passouPontas: parceiro.passouPontas,
          possibilidade,
          lado: mesaEsquerda,
        }) + parceiro.iniciouPartida
          ? 10
          : 0;

      pontuacao +=
        parceiro.salvarParceiro({
          passouPontas: parceiro.passouPontas,
          possibilidade,
          lado: mesaDireita,
        }) + parceiro.iniciouPartida
          ? 10
          : 0;
    }

    const pedra = possibilidade.pedra.split("-").map(Number);
    pontuacao += pedra[0] + pedra[1];
    pontuacao += pedra[0] === pedra[1] ? 100 : 0;

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

    const idOponente2 = estado.obterProximoJogador(idOponente);
    if (jogadores.has(idOponente2)) {
      const oponente2 = jogadores.get(idOponente2);

      pontuacao += jogadorPrincipal.marcarOponente({
        passouPontas: oponente2.passouPontas,
        ultimaJogada: oponente2.ultimaJogada,
        possibilidade,
        extremos: [mesaEsquerda, mesaDireita],
      });
    }

    pontuacao += jogadorPrincipal.estrategiaPorFrequencia({
      possibilidade,
      extremos: [mesaEsquerda, mesaDireita],
      estado,
    });

    // Bônus por diversidade na mão
    const minhaMao = [...jogo.mao].filter(
      (pedra) => possibilidade.pedra !== pedra
    );

    const numerosUnicos = new Set(minhaMao.join("-").split("-"));
    pontuacao += numerosUnicos.size * 2;

    console.log(pontuacao, pedra);
    if (pontuacao > melhorPontuacao) {
      melhorJogada = possibilidade;
      melhorPontuacao = pontuacao;
    }
  }

  estado.rodada++;

  return melhorJogada;
}
