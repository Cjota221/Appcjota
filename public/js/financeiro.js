document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'financeiro.html') return;

    const selectModeloPrecificacao = document.getElementById('selectModeloPrecificacao');
    const margemLucroInput = document.getElementById('margemLucroPrecificacao');
    const btnCalcularPreco = document.getElementById('btnCalcularPreco');
    const resultadosPrecificacaoDiv = document.getElementById('resultadosPrecificacao');

    const modelos = Storage.getItems('modelos') || [];
    const insumos = Storage.getItems('insumos') || [];
    const custosFixos = Storage.getItems('custosFixos') || [];
    const custosVariaveis = Storage.getItems('custosVariaveis') || [];
    const configuracoes = Storage.getItems('configuracoes') || {};

    App.populateSelect(selectModeloPrecificacao, modelos, 'id', 'nome', 'Selecione um Modelo');
    
    // Carrega margem padrão
    margemLucroInput.value = (App.parseFloatStrict(configuracoes.margemLucroPadrao) * 100 || 50).toFixed(1);

    btnCalcularPreco.addEventListener('click', () => {
        const modeloId = selectModeloPrecificacao.value;
        const margemLucroPercentual = App.parseFloatStrict(margemLucroInput.value);

        if (!modeloId) {
            App.showNotification('Selecione um modelo para calcular o preço.', 'info');
            return;
        }
        if (isNaN(margemLucroPercentual) || margemLucroPercentual < 0) {
            App.showNotification('Informe uma margem de lucro válida (%).', 'error');
            return;
        }

        const modeloSelecionado = modelos.find(m => m.id === modeloId);
        if (!modeloSelecionado) {
            App.showNotification('Modelo não encontrado.', 'error');
            return;
        }

        const margemLucroDecimal = margemLucroPercentual / 100;
        const volumeEstimado = App.parseFloatStrict(configuracoes.volumeProducaoMensalEstimado) || 1;

        if (volumeEstimado <= 0) {
             App.showNotification('Volume de Produção Mensal Estimado (nas Configurações) deve ser maior que zero.', 'error');
             return;
        }
        
        const custoProducaoUnitario = Calculadora.calcularCustoProducaoUnitarioModelo(
            modeloSelecionado, 
            insumos, 
            custosFixos, 
            custosVariaveis, 
            volumeEstimado
        );

        if (custoProducaoUnitario === 0 && modeloSelecionado.insumos.length > 0) {
             App.showNotification('Custo de produção unitário resultou em zero. Verifique os custos dos insumos e o volume de produção estimado.', 'warning');
        }


        const { precoSugerido, lucroPorUnidade } = Calculadora.calcularPrecoVendaELucro(custoProducaoUnitario, margemLucroDecimal);

        resultadosPrecificacaoDiv.innerHTML = `
            <div class="card">
                <div class="card-header primary"><h3 class="text-white">Resultado da Precificação para: ${modeloSelecionado.nome}</h3></div>
                <div class="card-body">
                    <p><strong>Custo de Insumos por Unidade:</strong> ${App.formatCurrency(Calculadora.calcularCustoInsumosModelo(modeloSelecionado, insumos))}</p>
                    <p><strong>Custo Fixo Rateado por Unidade:</strong> ${App.formatCurrency(Calculadora.calcularCustoFixoRateadoPorUnidade(custosFixos, volumeEstimado))} (Baseado em ${volumeEstimado} un/mês)</p>
                    <p><strong>Custo Variável por Unidade:</strong> ${App.formatCurrency(Calculadora.calcularTotalCustosVariaveisPorUnidade(custosVariaveis))}</p>
                    <hr>
                    <p class="h5"><strong>Custo Total de Produção por Unidade: ${App.formatCurrency(custoProducaoUnitario)}</strong></p>
                    <hr>
                    <p><strong>Margem de Lucro Aplicada:</strong> ${margemLucroPercentual.toFixed(1)}%</p>
                    <p class="h4 text-success"><strong>Preço de Venda Sugerido por Unidade: ${App.formatCurrency(precoSugerido)}</strong></p>
                    <p class="h5 text-primary"><strong>Lucro Estimado por Unidade: ${App.formatCurrency(lucroPorUnidade)}</strong></p>
                </div>
            </div>
        `;
        resultadosPrecificacaoDiv.classList.remove('d-none');
    });

    // Inicialização
    if (modelos.length === 0) {
        App.showNotification('Cadastre modelos para usar a precificação.', 'warning');
        btnCalcularPreco.disabled = true;
    }
});
