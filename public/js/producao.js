document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'producao.html') return;

    const formProducao = document.getElementById('formLancarProducao');
    const selectModeloProducao = document.getElementById('selectModeloProducao');
    const quantidadeProduzidaInput = document.getElementById('quantidadeProduzida');
    const dataProducaoInput = document.getElementById('dataProducao');
    const observacoesProducaoInput = document.getElementById('observacoesProducao');
    const tabelaProducoesBody = document.querySelector('#tabelaProducoes tbody');
    const producaoIdInput = document.getElementById('producaoId'); // Para edição (opcional)
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicaoProducao');


    let producoes = Storage.getItems('producoes') || [];
    const modelos = Storage.getItems('modelos') || [];
    const insumos = Storage.getItems('insumos') || [];
    const custosFixos = Storage.getItems('custosFixos') || [];
    const custosVariaveis = Storage.getItems('custosVariaveis') || [];
    const configuracoes = Storage.getItems('configuracoes') || {};

    // Popula select de modelos
    App.populateSelect(selectModeloProducao, modelos, 'id', 'nome', 'Selecione um Modelo');
    // Seta data padrão para hoje
    if (dataProducaoInput) dataProducaoInput.valueAsDate = new Date();


    const renderProducoes = () => {
        tabelaProducoesBody.innerHTML = '';
        if (producoes.length === 0) {
            tabelaProducoesBody.innerHTML = `<tr><td colspan="7" class="no-data-message">Nenhuma produção lançada.</td></tr>`;
            return;
        }
        // Ordena por data, mais recentes primeiro
        producoes.sort((a, b) => new Date(b.data) - new Date(a.data)).forEach(prod => {
            const modeloDetalhe = modelos.find(m => m.id === prod.modeloId);
            const nomeModelo = modeloDetalhe ? modeloDetalhe.nome : 'Modelo não encontrado';
            
            const row = tabelaProducoesBody.insertRow();
            row.innerHTML = `
                <td>${new Date(prod.data).toLocaleDateString('pt-BR')}</td>
                <td>${nomeModelo}</td>
                <td>${prod.quantidade}</td>
                <td>${App.formatCurrency(prod.custoTotalProducao)}</td>
                <td>${App.formatCurrency(prod.custoUnitarioProducao)}</td>
                <td>${App.formatCurrency(prod.precoSugeridoUnidade)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-danger btn-excluir-producao" data-id="${prod.id}" title="Excluir Lançamento"><i class="fas fa-trash"></i> Excluir</button>
                    </td>
            `;
        });
        addEventListenersAcoesProducao();
        App.updateDashboardSummaryCards();
    };
    
    const addEventListenersAcoesProducao = () => {
        document.querySelectorAll('.btn-excluir-producao').forEach(button => {
            button.addEventListener('click', (e) => handleExcluirProducao(e.currentTarget.dataset.id));
        });
    };


    formProducao.addEventListener('submit', (e) => {
        e.preventDefault();
        const modeloId = selectModeloProducao.value;
        const quantidade = parseInt(quantidadeProduzidaInput.value);
        const data = dataProducaoInput.value;
        const observacoes = observacoesProducaoInput.value.trim();

        if (!modeloId || isNaN(quantidade) || quantidade <= 0 || !data) {
            App.showNotification('Modelo, quantidade válida e data são obrigatórios.', 'error');
            return;
        }

        const modeloSelecionado = modelos.find(m => m.id === modeloId);
        if (!modeloSelecionado) {
            App.showNotification('Modelo selecionado não encontrado.', 'error');
            return;
        }

        // 1. Calcular custo de insumos para o modelo
        const custoInsumosUnitario = Calculadora.calcularCustoInsumosModelo(modeloSelecionado, insumos);

        // 2. Calcular custo fixo rateado por unidade
        const volumeEstimado = App.parseFloatStrict(configuracoes.volumeProducaoMensalEstimado) || 1; // Evita divisão por zero
        const custoFixoRateadoUnitario = Calculadora.calcularCustoFixoRateadoPorUnidade(custosFixos, volumeEstimado);
        
        // 3. Calcular total de custos variáveis por unidade
        const custoVariavelTotalUnitario = Calculadora.calcularTotalCustosVariaveisPorUnidade(custosVariaveis);

        // 4. Custo de produção unitário
        const custoProducaoUnitario = custoInsumosUnitario + custoFixoRateadoUnitario + custoVariavelTotalUnitario;
        const custoTotalDaProducao = custoProducaoUnitario * quantidade;

        // 5. Calcular preço sugerido (usando margem padrão das configurações)
        const margemLucroPadrao = App.parseFloatStrict(configuracoes.margemLucroPadrao) || 0;
        const { precoSugerido, lucroPorUnidade } = Calculadora.calcularPrecoVendaELucro(custoProducaoUnitario, margemLucroPadrao);
        
        // 6. Consumir insumos do estoque
        const consumoOk = Calculadora.consumirInsumosEstoque(modeloId, quantidade, modelos, insumos);
        if (!consumoOk) {
            // A notificação de erro já é mostrada por consumirInsumosEstoque
            return; 
        }

        const novaProducao = {
            id: Storage.generateUUID(),
            modeloId,
            quantidade,
            data,
            observacoes,
            custoInsumosUnitario,
            custoFixoRateadoUnitario,
            custoVariavelTotalUnitario,
            custoUnitarioProducao: custoProducaoUnitario,
            custoTotalProducao: custoTotalDaProducao,
            margemLucroAplicada: margemLucroPadrao,
            precoSugeridoUnidade: precoSugerido,
            lucroEstimadoUnidade: lucroPorUnidade,
            lucroEstimadoTotal: lucroPorUnidade * quantidade,
            insumosConsumidos: modeloSelecionado.insumos.map(item => ({
                insumoId: item.insumoId,
                quantidadeUtilizada: App.parseFloatStrict(item.quantidade) * quantidade,
                custoTotalInsumo: (insumos.find(i => i.id === item.insumoId)?.custo || 0) * App.parseFloatStrict(item.quantidade) * quantidade
            }))
        };

        producoes.push(novaProducao);
        Storage.saveItems('producoes', producoes);
        
        App.showNotification('Lançamento de produção realizado com sucesso!', 'success');
        formProducao.reset();
        if (dataProducaoInput) dataProducaoInput.valueAsDate = new Date(); // Reseta data para hoje
        renderProducoes();
        // Atualizar estoque.js se estiver na página de estoque ou se houver cards de estoque no dashboard
        if (typeof Estoque !== 'undefined' && typeof Estoque.renderEstoque === 'function') {
             Estoque.renderEstoque();
        }
    });
    
    const handleExcluirProducao = (id) => {
        const producaoParaExcluir = producoes.find(p => p.id === id);
        if (!producaoParaExcluir) return;

        // ATENÇÃO: Excluir uma produção deveria, idealmente, reverter o consumo de estoque.
        // Esta é uma operação complexa que requer rastrear exatamente o que foi consumido.
        // Por simplicidade, a exclusão aqui apenas remove o registro de produção.
        // Para uma reversão real, seria preciso:
        // 1. Pegar `producaoParaExcluir.insumosConsumidos`
        // 2. Para cada insumo, adicionar a `quantidadeUtilizada` de volta ao estoque.
        // Exemplo de como seria a devolução (simplificado):
        /*
        if (confirm(`Excluir esta produção também tentará devolver os insumos ao estoque. Continuar?`)) {
            let estoque = Storage.getItems('estoque') || {};
            let devolucoesOk = true;
            producaoParaExcluir.insumosConsumidos.forEach(itemConsumido => {
                if (estoque[itemConsumido.insumoId] === undefined) estoque[itemConsumido.insumoId] = 0;
                estoque[itemConsumido.insumoId] += itemConsumido.quantidadeUtilizada;
            });
            Storage.saveItems('estoque', estoque);
            // ... continua para remover a produção
        } else {
            return;
        }
        */
        // Dada a complexidade e o risco de inconsistência sem um sistema transacional,
        // a exclusão simples é mais segura para este escopo.
        // O usuário deve ser avisado para ajustar o estoque manualmente se necessário.

        if (confirm(`Tem certeza que deseja excluir este lançamento de produção? Esta ação NÃO reverterá automaticamente o consumo de insumos do estoque. Ajuste o estoque manualmente se necessário.`)) {
            producoes = producoes.filter(p => p.id !== id);
            Storage.saveItems('producoes', producoes);
            renderProducoes();
            App.showNotification('Lançamento de produção excluído. Lembre-se de ajustar o estoque se necessário.', 'success');
            if (typeof Estoque !== 'undefined' && typeof Estoque.renderEstoque === 'function') {
                Estoque.renderEstoque(); // Atualizar visualização do estoque
            }
        }
    };


    // Inicialização
    if (modelos.length === 0) {
        App.showNotification('Cadastre modelos antes de lançar produções.', 'warning');
        formProducao.querySelector('button[type="submit"]').disabled = true;
    }
    if (insumos.length === 0) {
        App.showNotification('Cadastre insumos antes de lançar produções.', 'warning');
        // Não necessariamente desabilita, pois o modelo já contém os insumos.
    }
     if (!configuracoes.volumeProducaoMensalEstimado || configuracoes.volumeProducaoMensalEstimado <= 0) {
        App.showNotification('Defina um "Volume de Produção Mensal Estimado" nas Configurações para o cálculo correto de custos fixos.', 'warning');
    }


    renderProducoes();
});
