export class Jogo {
  constructor() {
    this.rodada = 1;
    this.mesaParcial = new Set();
    this.frequenciaMao = new Map();
    this.frequenciaMesa = new Map();
    this.pedrasDisponiveis = new Set();
    this.#carregar();
  }

  #carregar() {
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        this.pedrasDisponiveis.add(`${i}-${j}`);
      }
    }
  }

  calcularPedrasRestantes(jogo, estado) {
    const pedrasRestantes = new Set(estado.pedrasDisponiveis);
    for (const pedra of jogo.mao) {
      pedrasRestantes.delete(pedra);
    }
    for (const pedra of jogo.mesa) {
      pedrasRestantes.delete(pedra);
    }
    return pedrasRestantes;
  }

  obterExtremos(mesa) {
    return [Number(mesa[0][0]), Number(mesa[mesa.length - 1][2])];
  }

  procurarIdJogador(jogador) {
    return (jogador + 2) % 4 || 4;
  }

  obterProximoJogador(jogador) {
    return jogador + 1 > 4 ? 1 : jogador + 1;
  }

  calcularFrequencia(mao, mesa) {
    for (const pedra of mao) {
      for (const lado of pedra.split("-")) {
        if (this.frequenciaMao.has(lado)) {
          this.frequenciaMao.set(lado, this.frequenciaMao.get(lado) + 1);
        } else {
          this.frequenciaMao.set(lado, 1);
        }
      }
    }

    for (const pedra of mesa) {
      for (const lado of pedra.split("-")) {
        if (this.frequenciaMesa.has(lado)) {
          this.frequenciaMesa.set(lado, this.frequenciaMesa.get(lado) + 1);
        } else {
          this.frequenciaMesa.set(lado, 1);
        }
      }
    }
  }

  carregarDadosJogadores(jogo, jogadores) {
    let proximoJogador = jogo.jogador;
    for (const { jogador, pedra, lado } of jogo.jogadas) {
      const detalhesJogador = jogadores.get(jogador);
      detalhesJogador.ultimaJogada = { pedra, lado };

      if (pedra === "6-6") {
        detalhesJogador.iniciouPartida = true;
      }

      if (!detalhesJogador.jogadas.has(pedra)) {
        detalhesJogador.jogadas.set(pedra, lado);
      }

      if (proximoJogador !== jogador) {
        const estadoAnteriorMesa = jogo.mesa.filter((pedra) =>
          this.mesaParcial.has(pedra)
        );

        if (estadoAnteriorMesa.length > 0) {
          const [esquerda, direita] = this.obterExtremos(estadoAnteriorMesa);

          const jogadorPassou = jogadores.get(proximoJogador);
          jogadorPassou.passouPontas.add(esquerda);
          jogadorPassou.passouPontas.add(direita);
        }

        proximoJogador = this.obterProximoJogador(jogador);
      } else {
        proximoJogador = this.obterProximoJogador(proximoJogador);
      }

      if (!this.mesaParcial.has(pedra)) {
        this.mesaParcial.add(pedra);
      }
    }
  }
}
