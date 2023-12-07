import create from "node:http";

import { bodyParser } from "./helpers/body-parser.js";
import { controlador } from "./helpers/controlador.js";

const server = create.createServer(async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ message: "Method not allowed" }));
  }

  if (req.url === "/") {
    const body = await bodyParser(req);

    const possibilidades = [];
    for (const pedra of body.mao) {
      if (pedra.split("-").includes(body.mesa[body.mesa.length - 1][2])) {
        possibilidades.push({ pedra, lado: "direita" });
      } else if (pedra.split("-").includes(body.mesa[0][0])) {
        possibilidades.push({ pedra, lado: "esquerda" });
      }
    }

    if (possibilidades.length === 0) {
      console.log("passo.");
      return res.end(JSON.stringify({}));
    } else {
      const jogada = await controlador(body, possibilidades);
      console.log(jogada);
      return res.end(JSON.stringify(jogada));
    }
  }
});

server.listen(8000, () => {
  console.log(`Server is running on port 8000`);
});
