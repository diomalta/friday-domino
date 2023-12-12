import Config from "../config.js";

export class Jogador {
  constructor() {
    this.jogadas = new Map();
    this.passouPontas = new Set();
    this.iniciouPartida = false;
    this.ultimaJogada = null;
  }

  marcarOponente({ passouPontas, ultimaJogada, possibilidade, extremos }) {
    let pontuacaoParcial = 0;

    for (const lado of extremos) {
      pontuacaoParcial -=
        passouPontas.has(lado) &&
        possibilidade.pedra.split("-").includes(lado.toString())
          ? Config.PRIORIDADE.MEDIA
          : 0;
    }

    if (ultimaJogada) {
      const ladoUltimaJogada =
        ultimaJogada.lado === "esquerda"
          ? ultimaJogada.pedra.split("-")[0]
          : ultimaJogada.pedra.split("-")[1];

      if (possibilidade.pedra.split("-").includes(ladoUltimaJogada)) {
        pontuacaoParcial += Config.PRIORIDADE.MEDIA;
      }
    }

    return pontuacaoParcial;
  }

  evitarLadoParceiro({ ultimaJogada, possibilidade, mesa }) {
    if (!ultimaJogada) return 0;

    const ladoUltimaJogada =
      ultimaJogada.lado === "esquerda"
        ? ultimaJogada.pedra.split("-")[0]
        : ultimaJogada.pedra.split("-")[1];

    const eParceiroJogouDesteLado =
      possibilidade.pedra.split("-").includes(ladoUltimaJogada) &&
      mesa.includes(Number(ladoUltimaJogada));

    return eParceiroJogouDesteLado ? Config.PRIORIDADE.BAIXA : 0;
  }

  salvarParceiro({ passouPontas, possibilidade, lado }) {
    const eParceiroPassouNesseLado =
      passouPontas.has(lado) &&
      possibilidade.pedra.split("-").includes(lado.toString());

    return eParceiroPassouNesseLado ? Config.PRIORIDADE.BAIXA : 0;
  }

  simularDistribuicaoPedras({ jogo, possibilidade, estado, jogadores }) {
    for (const pedra of jogo.mao) {
      if (estado.pedrasDisponiveis.has(pedra)) {
        estado.pedrasDisponiveis.delete(pedra);
      }
    }

    for (const jogada of jogo.jogadas) {
      if (estado.pedrasDisponiveis.has(jogada.pedra)) {
        estado.pedrasDisponiveis.delete(jogada.pedra);
      }
    }

    const distribuicoesPossiveis = new Map();
    const jogadoresPadrao = [1, 2, 3, 4].filter((n) => n !== jogo.jogador);
    let pontuacaoJogada = 0;
    const pedraPossibilidade = possibilidade.pedra.split("-").map(Number);

    for (const jogadorPadrao of jogadoresPadrao) {
      const jogador = jogadores.get(jogadorPadrao);
      distribuicoesPossiveis.set(
        jogadorPadrao,
        new Set(estado.pedrasDisponiveis)
      );

      if (jogador) {
        for (const ponta of jogador.passouPontas) {
          const distribuicao = distribuicoesPossiveis.get(jogadorPadrao);
          for (const pedra of distribuicao) {
            const pedraSplit = pedra.split("-").map(Number);
            if (pedraSplit.includes(ponta) || pedraSplit.includes(ponta)) {
              distribuicao.delete(pedra);
            }

            if (
              !pedraSplit.includes(pedraPossibilidade[0]) &&
              !pedraSplit.includes(pedraPossibilidade[1])
            ) {
              pontuacaoJogada += Config.PRIORIDADE.ALTA;
            }
          }
        }
      }
    }

    return pontuacaoJogada;
  }

  estrategiaPorFrequencia({ possibilidade, extremos, estado }) {
    const [mesaEsquerda, mesaDireita] = extremos.map(Number);
    const pedra = possibilidade.pedra.split("-").map(Number);

    let pontuacao = 0;

    if (pedra.includes(mesaEsquerda) || pedra.includes(mesaDireita)) {
      const frequenciaMesaEsquerda =
        estado.frequenciaMesa.get(mesaEsquerda.toString()) || 0;
      const frequenciaMesaDireita =
        estado.frequenciaMesa.get(mesaDireita.toString()) || 0;

      if (
        frequenciaMesaEsquerda < frequenciaMesaDireita &&
        pedra.includes(mesaEsquerda)
      ) {
        pontuacao += Config.PRIORIDADE.MEDIA;
      } else if (
        frequenciaMesaDireita < frequenciaMesaEsquerda &&
        pedra.includes(mesaDireita)
      ) {
        pontuacao += Config.PRIORIDADE.MEDIA;
      }

      const frequenciaEsquerda =
        estado.frequenciaMao.get(mesaEsquerda.toString()) || 0;
      const frequenciaDireita =
        estado.frequenciaMao.get(mesaDireita.toString()) || 0;

      if (
        frequenciaEsquerda > frequenciaDireita &&
        pedra.includes(mesaEsquerda)
      ) {
        pontuacao -= Config.PRIORIDADE.MEDIA;
      } else if (
        frequenciaDireita > frequenciaEsquerda &&
        pedra.includes(mesaDireita)
      ) {
        pontuacao -= Config.PRIORIDADE.MEDIA;
      }

      if (
        mesaEsquerda === mesaDireita &&
        pedra[0] === pedra[1] &&
        pedra[0] === mesaEsquerda
      ) {
        pontuacao += Config.PRIORIDADE.MEDIA;
      }

      const freqTotal = pedra.map(
        (num) =>
          (estado.frequenciaMao.get(num.toString()) || 0) +
          (estado.frequenciaMesa.get(num.toString()) || 0)
      );

      if (freqTotal.some((freq) => (freq) => 5)) {
        pontuacao += Config.PRIORIDADE.ALTA;
      }
    }

    return pontuacao;
  }
}
