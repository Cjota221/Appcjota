document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'insumos.html') return;

    const formInsumo = document.getElementById('formAdicionarInsumo');
    const tabelaInsumosBody = document.querySelector('#tabelaInsumos tbody');
    const insumoIdInput = document.getElementById('insumoId');
    const nomeInsumoInput = document.getElementById('nomeInsumo');
    const unidadeInsumoInput = document.getElementById('unidadeInsumo');
    const custoInsumoInput = document.getElementById('custoInsumo');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicaoInsumo');

    let insumos = Storage.getItems('insumos') || [];

    const renderInsumos = () => {
        tabelaInsumosBody.innerHTML = '';
        if (insumos.length === 0) {
            tabelaInsumosBody.innerHTML = `<tr><td colspan="5" class="no-data-message">Nenhum insumo cadastrado.</td></tr>`;
            return;
        }
        insumos.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(insumo => {
            const row = tabelaInsumosBody.insertRow();
            row.innerHTML = `
                <td>${insumo.id.substring(0,8)}...</td>
                <td>${insumo.nome}</td>
                <td>${insumo.unidade}</td>
                <td>${App.formatCurrency(insumo.custo)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary btn-editar" data-id="${insumo.id}" title="Editar"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-sm btn-danger btn-excluir" data-id="${insumo.id}" title="Excluir"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            `;
        });
        addEventListenersAcoes();
        App.updateDashboardSummaryCards();
    };

    const addEventListenersAcoes = () => {
        document.querySelectorAll('.btn-editar').forEach(button => {
            button.addEventListener('click', (e) => handleEditarInsumo(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-excluir').forEach(button => {
            button.addEventListener('click', (e) => handleExcluirInsumo(e.currentTarget.dataset.id));
        });
    };

    const handleAdicionarOuEditarInsumo = (e) => {
        e.preventDefault();
        const id = insumoIdInput.value;
        const nome = nomeInsumoInput.value.trim();
        const unidade = unidadeInsumoInput.value;
        const custo = App.parseFloatStrict(custoInsumoInput.value);

        if (!nome || !unidade || isNaN(custo) || custo < 0) {
            App.showNotification('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        if (id) { // Editando
            const index = insumos.findIndex(i => i.id === id);
            if (index > -1) {
                insumos[index] = { ...insumos[index], nome, unidade, custo };
                App.showNotification('Insumo atualizado com sucesso!', 'success');
            }
        } else { // Adicionando
            const novoInsumo = {
                id: Storage.generateUUID(),
                nome,
                unidade,
                custo
            };
            insumos.push(novoInsumo);
            App.showNotification('Insumo adicionado com sucesso!', 'success');
        }
        
        Storage.saveItems('insumos', insumos);
        resetFormInsumo();
        renderInsumos();
    };

    const handleEditarInsumo = (id) => {
        const insumoParaEditar = insumos.find(i => i.id === id);
        if (insumoParaEditar) {
            insumoIdInput.value = insumoParaEditar.id;
            nomeInsumoInput.value = insumoParaEditar.nome;
            unidadeInsumoInput.value = insumoParaEditar.unidade;
            custoInsumoInput.value = App.formatCurrency(insumoParaEditar.custo, false).replace('.',','); // Formato para input number
            formInsumo.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            btnCancelarEdicao.style.display = 'inline-block';
            nomeInsumoInput.focus();
            window.scrollTo(0,0); // Rola para o topo para ver o formulário
        }
    };

    const handleExcluirInsumo = (id) => {
        const modelos = Storage.getItems('modelos') || [];
        const isInUse = modelos.some(modelo => modelo.insumos.some(itemInsumo => itemInsumo.insumoId === id));

        if (isInUse) {
            App.showNotification('Este insumo está sendo usado em um ou mais modelos e não pode ser excluído.', 'error');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o insumo "${insumos.find(i=>i.id===id)?.nome || id}"?`)) {
            insumos = insumos.filter(i => i.id !== id);
            Storage.saveItems('insumos', insumos);
            renderInsumos();
            App.showNotification('Insumo excluído com sucesso!', 'success');
            if (insumoIdInput.value === id) resetFormInsumo(); // Se o excluído estava em edição
        }
    };

    const resetFormInsumo = () => {
        formInsumo.reset();
        insumoIdInput.value = '';
        formInsumo.querySelector('button[type="submit"]').textContent = 'Adicionar Insumo';
        btnCancelarEdicao.style.display = 'none';
    };

    formInsumo.addEventListener('submit', handleAdicionarOuEditarInsumo);
    btnCancelarEdicao.addEventListener('click', resetFormInsumo);

    renderInsumos(); // Renderização inicial
});
