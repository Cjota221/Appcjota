// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Toggle do menu lateral
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        // Fechar sidebar ao clicar fora em telas menores
        document.addEventListener('click', (event) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('active') &&
                !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Carregar dados do dashboard (exemplo para index.html)
    if (document.body.id === 'dashboard-page') { // Adicione um ID ao body do index.html
        loadDashboardSummary();
        renderProducaoChart();
    }
});

function loadDashboardSummary() {
    const modelos = Storage.load('modelos');
    const producoes = Storage.load('producoes');
    const insumos = Storage.load('insumos');

    document.getElementById('totalModelos').textContent = modelos.length;

    let totalCustoModelos = 0;
    modelos.forEach(modelo => {
        const calculo = Calculadora.calculateModelCost(modelo.id);
        if (calculo) {
            totalCustoModelos += calculo.custoTotalUnitario;
        }
    });
    const custoMedioUnidade = modelos.length > 0 ? totalCustoModelos / modelos.length : 0;
    document.getElementById('custoMedioUnidade').textContent = custoMedioUnidade.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    let totalParesProduzidos = 0;
    let totalLucroEstimado = 0;
    producoes.forEach(prod => {
        const summary = Calculadora.calculateProductionSummary(prod.id);
        if (summary) {
            totalParesProduzidos += prod.modelosProduzidos.reduce((acc, item) => acc + item.quantidade, 0);
            totalLucroEstimado += summary.lucroTotalProducao;
        }
    });
    document.getElementById('producaoMes').textContent = `${totalParesProduzidos} Pares`;
    document.getElementById('lucroEstimado').textContent = totalLucroEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function renderProducaoChart() {
    const producoes = Storage.load('producoes');
    const labels = [];
    const data = [];

    // Agrupar produção por modelo para o gráfico (simplificado para exemplo)
    const producaoPorModelo = {};
    producoes.forEach(prod => {
        prod.modelosProduzidos.forEach(item => {
            const modelo = Storage.getById('modelos', item.modeloId);
            if (modelo) {
                producaoPorModelo[modelo.nome] = (producaoPorModelo[modelo.nome] || 0) + item.quantidade;
            }
        });
    });

    for (const modeloNome in producaoPorModelo) {
        labels.push(modeloNome);
        data.push(producaoPorModelo[modeloNome]);
    }

    const ctx = document.getElementById('producaoChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pares Produzidos',
                data: data,
                backgroundColor: var('primary-color'), // Usar a variável CSS
                borderColor: var('secondary-color'),
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

    // Função auxiliar para obter valor de variável CSS
    function var(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
}
