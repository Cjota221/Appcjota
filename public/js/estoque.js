// js/estoque.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#estoque-page')) {
        loadEstoqueSummary();
    }
});

function loadEstoqueSummary() {
    const insumos = Storage.load('insumos');
    const producoes = Storage.load('producoes');
    const estoqueList = document.getElementById('estoqueList');
    estoqueList.innerHTML = '';

    const consumoTotalInsumos = {};

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
        const saldoSimulado = 1000 - (consumoTotalInsumos[insumo.id] || 0);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Insumo">${insumo.nome}</td>
            <td data-label="Unidade">${insumo.unidadeMedida}</td>
            <td data-label="Consumido (Produção)">${(consumoTotalInsumos[insumo.id] || 0).toFixed(2)}</td>
            <td data-label="Saldo Estimado">${saldoSimulado.toFixed(2)}</td>
        `;
        estoqueList.appendChild(row);
    });
}
