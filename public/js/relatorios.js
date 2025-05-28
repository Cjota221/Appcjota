// js/relatorios.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#relatorios-page')) { // Adicione um ID ao body do relatorios.html
        renderCustoPorModeloChart();
        renderConsumoInsumosChart();
        document.getElementById('exportDataBtn').addEventListener('click', Storage.exportData);
        document.getElementById('importDataInput').addEventListener('change', handleImportData);
    }
});

function renderCustoPorModeloChart() {
    const modelos = Storage.load('modelos');
    const labels = [];
    const data = [];

    modelos.forEach(modelo => {
        const calculo = Calculadora.calculateModelCost(modelo.id);
        if (calculo) {
            labels.push(modelo.nome);
            data.push(calculo.custoTotalUnitario);
        }
    });

    const ctx = document.getElementById('custoPorModeloChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Custo Total Unitário (R$)',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'var(--text-light)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'var(--text-light)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-light)'
                    }
                }
            }
        }
    });
}

function renderConsumoInsumosChart() {
    const insumos = Storage.load('insumos');
    const producoes = Storage.load('producoes');

    const consumoTotalInsumos = {};

    producoes.forEach(producao => {
        const summary = Calculadora.calculateProductionSummary(producao.id);
        if (summary && summary.insumosConsumidos) {
            for (const insumoId in summary.insumosConsumidos) {
                consumoTotalInsumos[insumoId] = (consumoTotalInsumos[insumoId] || 0) + summary.insumosConsumidos[insumoId];
            }
        }
    });

    const labels = [];
    const data = [];

    for (const insumoId in consumoTotalInsumos) {
        const insumo = insumos.find(i => i.id === insumoId);
        if (insumo) {
            labels.push(`${insumo.nome} (${insumo.unidadeMedida})`);
            data.push(consumoTotalInsumos[insumoId]);
        }
    }

    const ctx = document.getElementById('consumoInsumosChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Consumo Total de Insumos',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--text-light)'
                    }
                }
            }
        }
    });
}

function handleImportData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const jsonString = e.target.result;
            Storage.importData(jsonString);
        };
        reader.readAsText(file);
    }
}
