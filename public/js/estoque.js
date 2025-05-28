const Estoque = { // Tornando global para ser acessível por producao.js
    insumos: [],
    estoqueAtual: {},
    tabelaEstoqueBody: null,
    formAdicionarEstoque: null,
    selectInsumoEstoque: null,
    quantidadeEstoqueInput: null,

    init: () => {
        if (App.currentPage !== 'estoque.html') return;

        Estoque.tabelaEstoqueBody = document.querySelector('#tabelaEstoque tbody');
        Estoque.formAdicionarEstoque = document.getElementById('formAdicionarEstoque');
        Estoque.selectInsumoEstoque = document.getElementById('selectInsumoEstoque');
        Estoque.quantidadeEstoqueInput = document.getElementById('quantidadeEntradaEstoque');

        Estoque.insumos = Storage.getItems('insumos') || [];
        Estoque.estoqueAtual = Storage.getItems('estoque') || {};

        App.populateSelect(Estoque.selectInsumoEstoque, Estoque.insumos, 'id', 'nome', 'Selecione um Insumo');

        Estoque.formAdicionarEstoque.addEventListener('submit', Estoque.handleAdicionarAoEstoque);
        
        Estoque.renderEstoque();
    },

    renderEstoque: () => {
        if (!Estoque.tabelaEstoqueBody && App.currentPage === 'estoque.html') { // Garante que o elemento exista
            Estoque.tabelaEstoqueBody = document.querySelector('#tabelaEstoque tbody');
            if(!Estoque.tabelaEstoqueBody) return; // Ainda não está pronto
        } else if (!Estoque.tabelaEstoqueBody) {
            return; // Não está na página de estoque, não faz nada
        }


        Estoque.tabelaEstoqueBody.innerHTML = '';
        // Atualiza estoqueAtual caso tenha sido modificado externamente (ex: por producao.js)
        Estoque.estoqueAtual = Storage.getItems('estoque') || {}; 

        if (Estoque.insumos.length === 0) {
            Estoque.tabelaEstoqueBody.innerHTML = `<tr><td colspan="4" class="no-data-message">Nenhum insumo cadastrado para exibir o estoque.</td></tr>`;
            return;
        }
        
        let hasItemsInStock = false;
        Estoque.insumos.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(insumo => {
            const quantidadeEmEstoque = App.parseFloatStrict(Estoque.estoqueAtual[insumo.id]) || 0;
            if (quantidadeEmEstoque > 0) hasItemsInStock = true;

            const row = Estoque.tabelaEstoqueBody.insertRow();
            row.innerHTML = `
                <td>${insumo.nome}</td>
                <td>${insumo.unidade}</td>
                <td>${quantidadeEmEstoque.toFixed(2).replace('.',',')}</td>
                <td>${App.formatCurrency(insumo.custo * quantidadeEmEstoque)}</td>
            `;
        });

        if (!hasItemsInStock && Estoque.insumos.length > 0) {
             Estoque.tabelaEstoqueBody.innerHTML = `<tr><td colspan="4" class="no-data-message">Nenhum item em estoque. Realize entradas ou produções.</td></tr>`;
        }
    },

    handleAdicionarAoEstoque: (e) => {
        e.preventDefault();
        const insumoId = Estoque.selectInsumoEstoque.value;
        const quantidade = App.parseFloatStrict(Estoque.quantidadeEstoqueInput.value);

        if (!insumoId || isNaN(quantidade) || quantidade <= 0) {
            App.showNotification('Selecione um insumo e informe uma quantidade válida.', 'error');
            return;
        }

        if (Calculadora.adicionarInsumosEstoque(insumoId, quantidade)) {
            App.showNotification('Entrada de estoque registrada com sucesso!', 'success');
            Estoque.formAdicionarEstoque.reset();
            Estoque.renderEstoque(); // Re-renderiza a tabela
        } else {
            // Notificação de erro já é mostrada por adicionarInsumosEstoque
        }
    }
};

document.addEventListener('DOMContentLoaded', Estoque.init);
