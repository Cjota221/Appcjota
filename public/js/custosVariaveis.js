document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'custos-variaveis.html') return;

    const formCustoVariavel = document.getElementById('formAdicionarCustoVariavel');
    const tabelaCustosVariaveisBody = document.querySelector('#tabelaCustosVariaveis tbody');
    const custoVariavelIdInput = document.getElementById('custoVariavelId');
    const descricaoCustoVariavelInput = document.getElementById('descricaoCustoVariavel');
    const valorCustoVariavelInput = document.getElementById('valorCustoVariavel');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicaoCustoVariavel');
    const totalCustosVariaveisElement = document.getElementById('totalCustosVariaveis');

    let custosVariaveis = Storage.getItems('custosVariaveis') || [];

    const renderCustosVariaveis = () => {
        tabelaCustosVariaveisBody.innerHTML = '';
        let totalGeralPorUnidade = 0;
        if (custosVariaveis.length === 0) {
            tabelaCustosVariaveisBody.innerHTML = `<tr><td colspan="4" class="no-data-message">Nenhum custo variável cadastrado.</td></tr>`;
        } else {
            custosVariaveis.sort((a,b) => a.descricao.localeCompare(b.descricao)).forEach(custo => {
                const valorPorUnidade = App.parseFloatStrict(custo.valorPorUnidade);
                totalGeralPorUnidade += valorPorUnidade;
                const row = tabelaCustosVariaveisBody.insertRow();
                row.innerHTML = `
                    <td>${custo.id.substring(0,8)}...</td>
                    <td>${custo.descricao}</td>
                    <td>${App.formatCurrency(valorPorUnidade)}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-secondary btn-editar" data-id="${custo.id}" title="Editar"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-sm btn-danger btn-excluir" data-id="${custo.id}" title="Excluir"><i class="fas fa-trash"></i> Excluir</button>
                    </td>
                `;
            });
        }
        totalCustosVariaveisElement.textContent = App.formatCurrency(totalGeralPorUnidade);
        addEventListenersAcoes();
    };

    const addEventListenersAcoes = () => {
        document.querySelectorAll('#tabelaCustosVariaveis .btn-editar').forEach(button => {
            button.addEventListener('click', (e) => handleEditar(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('#tabelaCustosVariaveis .btn-excluir').forEach(button => {
            button.addEventListener('click', (e) => handleExcluir(e.currentTarget.dataset.id));
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const id = custoVariavelIdInput.value;
        const descricao = descricaoCustoVariavelInput.value.trim();
        const valorPorUnidade = App.parseFloatStrict(valorCustoVariavelInput.value);

        if (!descricao || isNaN(valorPorUnidade) || valorPorUnidade < 0) { // Permite 0 para itens como "imposto sobre venda" que pode ser %
            App.showNotification('Descrição e valor válido são obrigatórios.', 'error');
            return;
        }

        if (id) { // Editando
            const index = custosVariaveis.findIndex(cv => cv.id === id);
            if (index > -1) {
                custosVariaveis[index] = { ...custosVariaveis[index], descricao, valorPorUnidade };
                App.showNotification('Custo variável atualizado!', 'success');
            }
        } else { // Adicionando
            const novoCusto = { id: Storage.generateUUID(), descricao, valorPorUnidade };
            custosVariaveis.push(novoCusto);
            App.showNotification('Custo variável adicionado!', 'success');
        }
        
        Storage.saveItems('custosVariaveis', custosVariaveis);
        resetForm();
        renderCustosVariaveis();
    };

    const handleEditar = (id) => {
        const custo = custosVariaveis.find(cv => cv.id === id);
        if (custo) {
            custoVariavelIdInput.value = custo.id;
            descricaoCustoVariavelInput.value = custo.descricao;
            valorCustoVariavelInput.value = App.formatCurrency(custo.valorPorUnidade, false).replace('.',',');
            formCustoVariavel.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            btnCancelarEdicao.style.display = 'inline-block';
            descricaoCustoVariavelInput.focus();
            window.scrollTo(0,0);
        }
    };

    const handleExcluir = (id) => {
         const custo = custosVariaveis.find(cv => cv.id === id);
        if (confirm(`Tem certeza que deseja excluir o custo variável "${custo?.descricao || id}"?`)) {
            custosVariaveis = custosVariaveis.filter(cv => cv.id !== id);
            Storage.saveItems('custosVariaveis', custosVariaveis);
            renderCustosVariaveis();
            App.showNotification('Custo variável excluído!', 'success');
            if (custoVariavelIdInput.value === id) resetForm();
        }
    };

    const resetForm = () => {
        formCustoVariavel.reset();
        custoVariavelIdInput.value = '';
        formCustoVariavel.querySelector('button[type="submit"]').textContent = 'Adicionar Custo Variável';
        btnCancelarEdicao.style.display = 'none';
    };

    formCustoVariavel.addEventListener('submit', handleSubmit);
    btnCancelarEdicao.addEventListener('click', resetForm);

    renderCustosVariaveis();
});
