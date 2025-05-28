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
    if (document.body.id === 'dashboard-page') {
        loadDashboardSummary();
        renderProducaoChart();
    }
});

function loadDashboardSummary() {
    const modelos = Storage.load('modelos');
    const producoes = Storage.load('producoes');
    // const insumos = Storage.load('insumos'); // Não usado diretamente aqui, mas pode ser útil para outros resumos

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
            prod.modelosProduzidos.forEach(item => totalParesProduzidos += parseFloat(item.quantidade));
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

    const producaoPorModelo = {};
    producoes.forEach(prod => {
        prod.modelosProduzidos.forEach(item => {
            const modelo = Storage.getById('modelos', item.modeloId);
            if (modelo) {
                producaoPorModelo[modelo.nome] = (producaoPorModelo[modelo.nome] || 0) + parseFloat(item.quantidade);
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
                backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
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
