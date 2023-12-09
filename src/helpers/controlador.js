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
    this.frequenciaMao = new Map();
    this.frequenciaMesa = new Map();
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
        ? 30
        : 0;
  }

  if (ultimaJogada) {
    const ladoUltimaJogada =
      ultimaJogada.lado === "esquerdo"
        ? ultimaJogada.pedra.split("-")[0]
        : ultimaJogada.pedra.split("-")[1];

    if (possibilidade.pedra.split("-").includes(ladoUltimaJogada)) {
      pontuacaoParcial += 50;
    }
  }

  return pontuacaoParcial;
}

function calcularFrequencia(mao, mesa) {
  for (const pedra of mao) {
    for (const lado of pedra.split("-")) {
      if (controleJogo.frequenciaMao.has(lado)) {
        controleJogo.frequenciaMao.set(
          lado,
          controleJogo.frequenciaMao.get(lado) + 1
        );
      } else {
        controleJogo.frequenciaMao.set(lado, 1);
      }
    }
  }

  for (const pedra of mesa) {
    for (const lado of pedra.split("-")) {
      if (controleJogo.frequenciaMesa.has(lado)) {
        controleJogo.frequenciaMesa.set(
          lado,
          controleJogo.frequenciaMesa.get(lado) + 1
        );
      } else {
        controleJogo.frequenciaMesa.set(lado, 1);
      }
    }
  }
}

function estrategiaPorFrequencia(possibilidade, extremos) {
  const [mesaEsquerda, mesaDireita] = extremos.map(Number);
  const pedra = possibilidade.pedra.split("-").map(Number);

  let pontuacao = 0;

  // Verifica se a possibilidade se encaixa em algum dos extremos
  if (pedra.includes(mesaEsquerda) || pedra.includes(mesaDireita)) {
    const frequenciaEsquerda =
      controleJogo.frequenciaMao.get(mesaEsquerda.toString()) || 0;
    const frequenciaDireita =
      controleJogo.frequenciaMao.get(mesaDireita.toString()) || 0;
    const frequenciaMesaEsquerda =
      controleJogo.frequenciaMesa.get(mesaEsquerda.toString()) || 0;
    const frequenciaMesaDireita =
      controleJogo.frequenciaMesa.get(mesaDireita.toString()) || 0;

    // Jogar pedras raras primeiro e bloquear adversários
    if (
      frequenciaMesaEsquerda < frequenciaMesaDireita &&
      pedra.includes(mesaEsquerda)
    ) {
      pontuacao += 20;
    } else if (
      frequenciaMesaDireita < frequenciaMesaEsquerda &&
      pedra.includes(mesaDireita)
    ) {
      pontuacao += 20;
    }

    // Guardar pedras comuns para o final
    if (
      frequenciaEsquerda > frequenciaDireita &&
      pedra.includes(mesaEsquerda)
    ) {
      pontuacao -= 10;
    } else if (
      frequenciaDireita > frequenciaEsquerda &&
      pedra.includes(mesaDireita)
    ) {
      pontuacao -= 10;
    }

    // Prioriza jogar uma bucha se ambas as pontas forem iguais
    if (
      mesaEsquerda === mesaDireita &&
      pedra[0] === pedra[1] &&
      pedra[0] === mesaEsquerda
    ) {
      pontuacao += 20;
    }
  }

  return pontuacao;
}

export async function controlador(jogo, possibilidades) {
  // Recalcular a frequência a cada rodada
  calcularFrequencia(jogo.mao, jogo.mesa);

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
    }

    // Seção pedra com valor alto e bucha
    const pedra = possibilidade.pedra.split("-").map(Number);
    pontuacao += pedra[0] + pedra[1];
    pontuacao += pedra[0] === pedra[1] ? 100 : 0;

    // Estratégia de bloqueio - tentar jogar pedras que podem bloquear adversários

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

    const idOponente2 = proximo(idOponente);
    if (controleJogo.jogadores.has(idOponente2)) {
      const oponente2 = controleJogo.jogadores.get(idOponente2);

      pontuacao += marcarOponente(
        oponente2.passouPontas,
        oponente2.ultimaJogada,
        possibilidade,
        [mesaEsquerda, mesaDireita]
      );
    }

    // Adiciona pontuação baseada na frequência dos números
    pontuacao += estrategiaPorFrequencia(possibilidade, [
      mesaEsquerda,
      mesaDireita,
    ]);

    console.log(pontuacao, pedra);
    if (pontuacao > melhorPontuacao) {
      melhorJogada = possibilidade;
      melhorPontuacao = pontuacao;
    }
  }

  controleJogo.rodada++;

  return melhorJogada;
}
