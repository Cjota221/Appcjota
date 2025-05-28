const Calculadora = {
    // Calcula o custo total de insumos para um modelo específico
    calcularCustoInsumosModelo: (modelo, todosInsumos) => {
        if (!modelo || !modelo.insumos || !Array.isArray(todosInsumos)) return 0;
        
        return modelo.insumos.reduce((total, itemInsumo) => {
            const insumoDetalhe = todosInsumos.find(i => i.id === itemInsumo.insumoId);
            if (insumoDetalhe) {
                const custoInsumo = App.parseFloatStrict(insumoDetalhe.custo);
                const quantidade = App.parseFloatStrict(itemInsumo.quantidade);
                return total + (custoInsumo * quantidade);
            }
            return total;
        }, 0);
    },

    // Calcula o custo fixo rateado por unidade produzida
    calcularCustoFixoRateadoPorUnidade: (todosCustosFixos, volumeProducaoEstimado) => {
        if (!Array.isArray(todosCustosFixos) || volumeProducaoEstimado <= 0) return 0;

        const totalCustosFixosMensais = todosCustosFixos.reduce((total, custo) => {
            return total + App.parseFloatStrict(custo.valor);
        }, 0);
        
        return totalCustosFixosMensais / volumeProducaoEstimado;
    },

    // Calcula o total de custos variáveis por unidade
    calcularTotalCustosVariaveisPorUnidade: (todosCustosVariaveis) => {
        if (!Array.isArray(todosCustosVariaveis)) return 0;

        return todosCustosVariaveis.reduce((total, custo) => {
            return total + App.parseFloatStrict(custo.valorPorUnidade);
        }, 0);
    },

    // Calcula o custo de produção unitário de um modelo
    calcularCustoProducaoUnitarioModelo: (modelo, todosInsumos, todosCustosFixos, todosCustosVariaveis, volumeProducaoEstimado) => {
        const custoInsumos = Calculadora.calcularCustoInsumosModelo(modelo, todosInsumos);
        const custoFixoRateado = Calculadora.calcularCustoFixoRateadoPorUnidade(todosCustosFixos, volumeProducaoEstimado);
        const custoVariavelTotal = Calculadora.calcularTotalCustosVariaveisPorUnidade(todosCustosVariaveis);
        
        return custoInsumos + custoFixoRateado + custoVariavelTotal;
    },

    // Calcula o preço de venda sugerido e o lucro
    calcularPrecoVendaELucro: (custoProducaoUnitario, margemLucroDesejada) => {
        if (custoProducaoUnitario < 0 || margemLucroDesejada < 0 || margemLucroDesejada >= 1) {
             // Margem de lucro deve ser < 1 (ex: 0.5 para 50%)
            console.error("Valores inválidos para cálculo de preço/lucro.");
            return { precoSugerido: 0, lucroPorUnidade: 0 };
        }
        // Markup: Preço = Custo / (1 - Margem)
        const precoSugerido = custoProducaoUnitario / (1 - margemLucroDesejada);
        const lucroPorUnidade = precoSugerido - custoProducaoUnitario;

        return {
            precoSugerido: precoSugerido,
            lucroPorUnidade: lucroPorUnidade
        };
    },

    // Consome insumos do estoque
    consumirInsumosEstoque: (modeloId, quantidadeProduzida, todosModelos, todosInsumos) => {
        const modelo = todosModelos.find(m => m.id === modeloId);
        if (!modelo) return false;

        let estoque = Storage.getItems('estoque') || {};
        let insumosConsumidosNoEstoque = []; // Para rastrear o que foi efetivamente consumido

        for (const itemInsumo of modelo.insumos) {
            const insumoId = itemInsumo.insumoId;
            const quantidadeNecessariaUnitaria = App.parseFloatStrict(itemInsumo.quantidade);
            const quantidadeTotalNecessaria = quantidadeNecessariaUnitaria * quantidadeProduzida;

            if (estoque[insumoId] === undefined) estoque[insumoId] = 0; // Inicializa se não existir

            if (estoque[insumoId] < quantidadeTotalNecessaria) {
                const insumoDetalhe = todosInsumos.find(i => i.id === insumoId);
                const nomeInsumo = insumoDetalhe ? insumoDetalhe.nome : `ID ${insumoId}`;
                App.showNotification(`Estoque insuficiente para o insumo: ${nomeInsumo}. Necessário: ${quantidadeTotalNecessaria.toFixed(2)}, Disponível: ${estoque[insumoId].toFixed(2)}`, 'error');
                // Idealmente, reverteria qualquer consumo parcial aqui ou não faria nenhum.
                // Por simplicidade, vamos parar e não consumir nada se um item faltar.
                return false; // Falha no consumo
            }
            insumosConsumidosNoEstoque.push({ insumoId, quantidade: quantidadeTotalNecessaria });
        }

        // Se todos os insumos estão disponíveis, efetua o débito
        insumosConsumidosNoEstoque.forEach(consumo => {
            estoque[consumo.insumoId] -= consumo.quantidade;
        });

        Storage.saveItems('estoque', estoque);
        return true; // Sucesso no consumo
    },

    // Adiciona insumos ao estoque
    adicionarInsumosEstoque: (insumoId, quantidade) => {
        let estoque = Storage.getItems('estoque') || {};
        const qtd = App.parseFloatStrict(quantidade);
        if (isNaN(qtd) || qtd < 0) {
            App.showNotification("Quantidade inválida para adicionar ao estoque.", "error");
            return false;
        }
        if (estoque[insumoId] === undefined) {
            estoque[insumoId] = 0;
        }
        estoque[insumoId] += qtd;
        Storage.saveItems('estoque', estoque);
        return true;
    }
};
