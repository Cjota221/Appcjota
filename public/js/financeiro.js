// js/financeiro.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#financeiro-page')) {
        loadFinanceiroSummary();
    }
});

function loadFinanceiroSummary() {
    const producoes = Storage.load('producoes');
    let totalLucroGeral = 0;
    let totalCustoGeral = 0;

    producoes.forEach(producao => {
        const summary = Calculadora.calculateProductionSummary(producao.id);
        if (summary) {
            totalLucroGeral += summary.lucroTotalProducao;
            totalCustoGeral += summary.custoTotalProducao;
        }
    });

    document.getElementById('totalLucroGeral').textContent = totalLucroGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalCustoGeral').textContent = totalCustoGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
