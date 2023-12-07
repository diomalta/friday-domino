class Jogador {
  constructor() {
    this.jogadas = new Map();
    this.passouPontas = new Set();
    this.iniciouPartida = false;
    this.ultimaJogada = null;
  }
}

class Jogo {
  constructor() {
    this.rodada = 1;
    this.quantidadeBuchas = 0;
    this.jogadores = new Map([
      [1, new Jogador()],
      [2, new Jogador()],
      [3, new Jogador()],
      [4, new Jogador()],
    ]);
    this.mesaParcial = new Set();
  }
}

const controleJogo = new Jogo();

function proximo(jogador) {
  return jogador + 1 > 4 ? 1 : jogador + 1;
}

function extremos(mesa) {
  return [Number(mesa[0][0]), Number(mesa[mesa.length - 1][2])];
}

function idJogador(jogador) {
  return (jogador + 2) % 4 || 4;
}

function evitarLadoParceiro(ultimaJogada, possibilidade, mesa) {
  if (!ultimaJogada) {
    return 0;
  }

  const ladoUltimaJogada =
    ultimaJogada.lado === "esquerdo"
      ? ultimaJogada.pedra.split("-")[0]
      : ultimaJogada.pedra.split("-")[1];

  return possibilidade.pedra.split("-").includes(ladoUltimaJogada) &&
    mesa.includes(Number(ladoUltimaJogada))
    ? 10
    : 0;
}

function salvarParceiro(passouPontas, possibilidade, lado) {
  return passouPontas.has(lado) &&
    possibilidade.pedra.split("-").includes(lado.toString())
    ? 10
    : 0;
}

function marcarOponente(passouPontas, ultimaJogada, possibilidade, extremos) {
  let pontuacaoParcial = 0;

  for (const lado of extremos) {
    pontuacaoParcial -=
      passouPontas.has(lado) &&
      possibilidade.pedra.split("-").includes(lado.toString())
        ? 10
        : 0;
  }

  if (ultimaJogada) {
    const ladoUltimaJogada =
      ultimaJogada.lado === "esquerdo"
        ? ultimaJogada.pedra.split("-")[0]
        : ultimaJogada.pedra.split("-")[1];

    console.debug(ladoUltimaJogada, possibilidade);
    if (possibilidade.pedra.split("-").includes(ladoUltimaJogada)) {
      pontuacaoParcial += 10;
    }
  }

  return pontuacaoParcial;
}

// parametros jogo
// {
//   "jogador": 3,
//   "mao": ["3-6", "5-5", "1-2", "0-0", "0-4"],
//   "mesa": ["1-6", "6-6", "6-4", "4-4"],
//   "jogadas": [
//     {
//       "jogador": 3,
//       "pedra": "6-6"
//     },
//     {
//       "jogador": 4,
//       "pedra": "6-4",
//       "lado": "direita"
//     },
//     {
//       "jogador": 1,
//       "pedra": "4-4",
//       "lado": "direita"
//     },
//     {
//       "jogador": 2,
//       "pedra": "1-6",
//       "lado": "esquerda"
//     }
//   ]
// }
export async function controlador(jogo, possibilidades) {
  controleJogo.quantidadeBuchas = jogo.mao
    .map((pedra) => pedra.split("-"))
    .filter((pedra) => pedra[0] === pedra[1]).length;

  let proximoJogador = jogo.jogador;
  for (const { jogador, pedra, lado } of jogo.jogadas) {
    const detalhesJogador = controleJogo.jogadores.get(jogador);
    detalhesJogador.ultimaJogada = { pedra, lado };

    if (pedra === "6-6") {
      detalhesJogador.iniciouPartida = true;
    }

    if (!detalhesJogador.jogadas.has(pedra)) {
      detalhesJogador.jogadas.set(pedra, lado);
    }

    if (proximoJogador !== jogador) {
      const estadoAnteriorMesa = jogo.mesa.filter((pedra) =>
        controleJogo.mesaParcial.has(pedra)
      );

      if (estadoAnteriorMesa.length > 0) {
        const [esquerda, direita] = extremos(estadoAnteriorMesa);

        const detalhesJogadorPassou =
          controleJogo.jogadores.get(proximoJogador);
        detalhesJogadorPassou.passouPontas.add(esquerda);
        detalhesJogadorPassou.passouPontas.add(direita);
      }

      proximoJogador = proximo(jogador);
    } else {
      proximoJogador = proximo(proximoJogador);
    }

    if (!controleJogo.mesaParcial.has(pedra)) {
      controleJogo.mesaParcial.add(pedra);
    }
  }

  let melhorJogada = null;
  let melhorPontuacao = -Infinity;
  for (const possibilidade of possibilidades) {
    let pontuacao = 0;
    const [mesaEsquerda, mesaDireita] = extremos(jogo.mesa);

    // Seção parceiro
    const idParceiro = idJogador(jogo.jogador);
    if (controleJogo.jogadores.has(idParceiro)) {
      const parceiro = controleJogo.jogadores.get(idParceiro);

      pontuacao -= evitarLadoParceiro(parceiro.ultimaJogada, possibilidade, [
        mesaEsquerda,
        mesaDireita,
      ]);

      pontuacao +=
        salvarParceiro(parceiro.passouPontas, possibilidade, mesaEsquerda) +
        parceiro.iniciouPartida
          ? 20
          : 0;

      pontuacao +=
        salvarParceiro(parceiro.passouPontas, possibilidade, mesaDireita) +
        parceiro.iniciouPartida
          ? 20
          : 0;

      pontuacao += controleJogo.quantidadeBuchas > 3 ? 30 : 0;
    }

    // Seção pedra com valor alto e bucha
    const pedra = possibilidade.pedra.split("-").map(Number);
    pontuacao += pedra[0] + pedra[1];
    pontuacao += pedra[0] === pedra[1] ? 30 : 0;

    // Seção oponentes
    const idOponente = proximo(jogo.jogador);
    if (controleJogo.jogadores.has(idOponente)) {
      const oponente = controleJogo.jogadores.get(idOponente);

      pontuacao += marcarOponente(
        oponente.passouPontas,
        oponente.ultimaJogada,
        possibilidade,
        [mesaEsquerda, mesaDireita]
      );
    }

    // console.log(pontuacao, pedra);
    if (pontuacao > melhorPontuacao) {
      melhorJogada = possibilidade;
      melhorPontuacao = pontuacao;
    }
  }

  controleJogo.rodada++;

  return melhorJogada;
}
