document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'relatorios.html') return;

    const relatorioCustoModeloDiv = document.getElementById('relatorioCustoPorModelo');
    const relatorioCustoProducaoDiv = document.getElementById('relatorioCustoProducao');
    const relatorioConsumoInsumosDiv = document.getElementById('relatorioConsumoInsumos');

    const modelos = Storage.getItems('modelos') || [];
    const insumos = Storage.getItems('insumos') || [];
    const producoes = Storage.getItems('producoes') || [];
    const custosFixos = Storage.getItems('custosFixos') || [];
    const custosVariaveis = Storage.getItems('custosVariaveis') || [];
    const configuracoes = Storage.getItems('configuracoes') || {};
    const volumeEstimado = App.parseFloatStrict(configuracoes.volumeProducaoMensalEstimado) || 1;

    // 1. Relatório de Custo por Modelo
    function gerarRelatorioCustoPorModelo() {
        let html = '<h4>Custo de Insumos por Modelo</h4>';
        if (modelos.length === 0) {
            html += '<p class="no-data-message">Nenhum modelo cadastrado.</p>';
            relatorioCustoModeloDiv.innerHTML = html;
            return;
        }
        html += '<ul class="list-group">';
        modelos.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(modelo => {
            const custoInsumos = Calculadora.calcularCustoInsumosModelo(modelo, insumos);
            html += `<li class="list-group-item d-flex justify-content-between align-items-center">
                        ${modelo.nome}
                        <span class="badge bg-primary rounded-pill">${App.formatCurrency(custoInsumos)}</span>
                     </li>`;
        });
        html += '</ul>';
        relatorioCustoModeloDiv.innerHTML = html;
    }

    // 2. Relatório de Custo da Produção (Resumo por Produção)
    function gerarRelatorioCustoProducao() {
        let html = '<h4>Resumo de Custos por Lançamento de Produção</h4>';
        if (producoes.length === 0) {
            html += '<p class="no-data-message">Nenhuma produção lançada.</p>';
            relatorioCustoProducaoDiv.innerHTML = html;
            return;
        }
        html += `<div class="table-wrapper"><table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Modelo</th>
                            <th>Qtd.</th>
                            <th>Custo Total Produção</th>
                            <th>Custo Unit.</th>
                        </tr>
                    </thead>
                    <tbody>`;
        producoes.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(prod => {
            const nomeModelo = modelos.find(m => m.id === prod.modeloId)?.nome || 'N/A';
            html += `<tr>
                        <td>${new Date(prod.data).toLocaleDateString('pt-BR')}</td>
                        <td>${nomeModelo}</td>
                        <td>${prod.quantidade}</td>
                        <td>${App.formatCurrency(prod.custoTotalProducao)}</td>
                        <td>${App.formatCurrency(prod.custoUnitarioProducao)}</td>
                     </tr>`;
        });
        html += '</tbody></table></div>';
        relatorioCustoProducaoDiv.innerHTML = html;
    }

    // 3. Relatório de Consumo de Insumos (Agregado de todas as produções)
    function gerarRelatorioConsumoInsumos() {
        let html = '<h4>Consumo Agregado de Insumos (Todas Produções)</h4>';
        if (producoes.length === 0) {
            html += '<p class="no-data-message">Nenhuma produção lançada para calcular o consumo.</p>';
            relatorioConsumoInsumosDiv.innerHTML = html;
            return;
        }

        const consumoAgregado = {}; // { insumoId: { nome, unidade, quantidadeTotal, custoTotal } }

        producoes.forEach(prod => {
            if(prod.insumosConsumidos && Array.isArray(prod.insumosConsumidos)){
                prod.insumosConsumidos.forEach(itemConsumido => {
                    const insumoDetalhe = insumos.find(i => i.id === itemConsumido.insumoId);
                    if (insumoDetalhe) {
                        if (!consumoAgregado[itemConsumido.insumoId]) {
                            consumoAgregado[itemConsumido.insumoId] = {
                                nome: insumoDetalhe.nome,
                                unidade: insumoDetalhe.unidade,
                                quantidadeTotal: 0,
                                custoTotal: 0
                            };
                        }
                        consumoAgregado[itemConsumido.insumoId].quantidadeTotal += App.parseFloatStrict(itemConsumido.quantidadeUtilizada);
                        // O custoTotalInsumo já vem calculado na produção, mas podemos recalcular se necessário
                        // consumoAgregado[itemConsumido.insumoId].custoTotal += App.parseFloatStrict(itemConsumido.custoTotalInsumo);
                        // Ou se não tiver custoTotalInsumo, seria:
                         consumoAgregado[itemConsumido.insumoId].custoTotal += (App.parseFloatStrict(insumoDetalhe.custo) * App.parseFloatStrict(itemConsumido.quantidadeUtilizada));
                    }
                });
            }
        });
        
        if (Object.keys(consumoAgregado).length === 0) {
             html += '<p class="no-data-message">Nenhum insumo consumido nas produções registradas.</p>';
        } else {
            html += `<div class="table-wrapper"><table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Insumo</th>
                                <th>Unidade</th>
                                <th>Qtd. Total Consumida</th>
                                <th>Custo Total Consumido</th>
                            </tr>
                        </thead>
                        <tbody>`;
            Object.values(consumoAgregado).sort((a,b) => a.nome.localeCompare(b.nome)).forEach(item => {
                html += `<tr>
                            <td>${item.nome}</td>
                            <td>${item.unidade}</td>
                            <td>${item.quantidadeTotal.toFixed(2).replace('.',',')}</td>
                            <td>${App.formatCurrency(item.custoTotal)}</td>
                         </tr>`;
            });
            html += '</tbody></table></div>';
        }
        relatorioConsumoInsumosDiv.innerHTML = html;
    }

    // Gerar todos os relatórios ao carregar a página
    gerarRelatorioCustoPorModelo();
    gerarRelatorioCustoProducao();
    gerarRelatorioConsumoInsumos();
});
