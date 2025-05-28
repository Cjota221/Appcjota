// js/calculadora.js

const Calculadora = (function() {
    function calculateModelCost(modelId) {
        const modelo = Storage.getById('modelos', modelId);
        if (!modelo) {
            console.error('Modelo não encontrado para cálculo:', modelId);
            return null;
        }
        return calculateModelCostFromObject(modelo);
    }

    function calculateModelCostFromObject(modeloObj) {
        const insumos = Storage.load('insumos');
        const custosFixos = Storage.load('custosFixos');
        const custosVariaveis = Storage.load('custosVariaveis');
        const producoes = Storage.load('producoes');

        let custoInsumos = 0;
        modeloObj.insumosComposicao.forEach(comp => {
            const insumo = insumos.find(i => i.id === comp.insumoId);
            if (insumo) {
                custoInsumos += parseFloat(insumo.custoUnidade) * parseFloat(comp.quantidade);
            }
        });

        const totalProducaoMensal = producoes.reduce((acc, prod) => acc + prod.modelosProduzidos.reduce((sum, item) => sum + parseFloat(item.quantidade), 0), 0);
        let custoFixoRateadoPorUnidade = 0;
        if (totalProducaoMensal > 0) {
            const totalCustosFixos = custosFixos.reduce((acc, custo) => acc + parseFloat(custo.valorMensal), 0);
            custoFixoRateadoPorUnidade = totalCustosFixos / totalProducaoMensal;
        }

        const totalCustosVariaveisPorUnidade = custosVariaveis.reduce((acc, custo) => acc + parseFloat(custo.valor), 0);

        const custoTotalUnitario = custoInsumos + custoFixoRateadoPorUnidade + totalCustosVariaveisPorUnidade;

        return {
            custoInsumos: custoInsumos,
            custoFixoRateado: custoFixoRateadoPorUnidade,
            custoVariavel: totalCustosVariaveisPorUnidade,
            custoTotalUnitario: custoTotalUnitario
        };
    }

    function suggestSellingPrice(custoTotalUnitario, margemLucroPercentual) {
        if (margemLucroPercentual < 0) {
            return { precoVendaSugerido: 0, lucroEstimado: 0 };
        }
        const margemDecimal = margemLucroPercentual / 100;
        if (1 - margemDecimal <= 0) return { precoVendaSugerido: Infinity, lucroEstimado: Infinity };
        const precoVendaSugerido = custoTotalUnitario / (1 - margemDecimal);
        const lucroEstimado = precoVendaSugerido - custoTotalUnitario;

        return {
            precoVendaSugerido: precoVendaSugerido,
            lucroEstimado: lucroEstimado
        };
    }

    function calculateProductionSummary(producaoId) {
        const producao = Storage.getById('producoes', producaoId);
        if (!producao) {
            return null;
        }

        let custoTotalProducao = 0;
        let lucroTotalProducao = 0;
        let insumosConsumidos = {};

        producao.modelosProduzidos.forEach(prodItem => {
            const modelo = Storage.getById('modelos', prodItem.modeloId);
            if (modelo) {
                const modeloCalculo = calculateModelCostFromObject(modelo);
                if (modeloCalculo) {
                    const precoVendaSugerido = suggestSellingPrice(modeloCalculo.custoTotalUnitario, prodItem.margemLucro);
                    custoTotalProducao += modeloCalculo.custoTotalUnitario * prodItem.quantidade;
                    lucroTotalProducao += precoVendaSugerido.lucroEstimado * prodItem.quantidade;

                    modelo.insumosComposicao.forEach(comp => {
                        const insumoId = comp.insumoId;
                        const quantidadeConsumida = parseFloat(comp.quantidade) * prodItem.quantidade;
                        insumosConsumidos[insumoId] = (insumosConsumidos[insumoId] || 0) + quantidadeConsumida;
                    });
                }
            }
        });

        return {
            custoTotalProducao: custoTotalProducao,
            lucroTotalProducao: lucroTotalProducao,
            insumosConsumidos: insumosConsumidos
        };
    }

    return {
        calculateModelCost,
        calculateModelCostFromObject,
        suggestSellingPrice,
        calculateProductionSummary
    };
})();
