// js/estoque.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#estoque-page')) { // Adicione um ID ao body do estoque.html
        loadEstoqueSummary();
    }
});

function loadEstoqueSummary() {
    const insumos = Storage.load('insumos');
    const producoes = Storage.load('producoes');
    const estoqueList = document.getElementById('estoqueList');
    estoqueList.innerHTML = '';

    const consumoTotalInsumos = {}; // { insumoId: totalConsumido }

    producoes.forEach(producao => {
        const summary = Calculadora.calculateProductionSummary(producao.id);
        if (summary && summary.insumosConsumidos) {
            for (const insumoId in summary.insumosConsumidos) {
                consumoTotalInsumos[insumoId] = (consumoTotalInsumos[insumoId] || 0) + summary.insumosConsumidos[insumoId];
            }
        }
    });

    if (insumos.length === 0) {
        estoqueList.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum insumo cadastrado para controle de estoque.</td></tr>';
        return;
    }

    insumos.forEach(insumo => {
        // Para um controle de estoque real, precisaríamos de "entradas" de insumos.
        // Aqui, vamos simular um "estoque inicial" alto ou simplesmente mostrar o consumo.
        // Para uma funcionalidade MVP, vamos mostrar o saldo como um valor arbitrário menos o consumo.
        // O ideal seria ter uma tela de "Compras de Insumos" para registrar entradas.
        // Por enquanto, saldo fictício - consumo.
        const saldoSimulado = 1000 - (consumoTotalInsumos[insumo.id] || 0); // Exemplo arbitrário de saldo inicial

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insumo.nome}</td>
            <td>${insumo.unidadeMedida}</td>
            <td>${(consumoTotalInsumos[insumo.id] || 0).toFixed(2)}</td>
            <td>${saldoSimulado.toFixed(2)}</td>
        `;
        estoqueList.appendChild(row);
    });
}
