document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'custos-fixos.html') return;

    const formCustoFixo = document.getElementById('formAdicionarCustoFixo');
    const tabelaCustosFixosBody = document.querySelector('#tabelaCustosFixos tbody');
    const custoFixoIdInput = document.getElementById('custoFixoId');
    const descricaoCustoFixoInput = document.getElementById('descricaoCustoFixo');
    const valorCustoFixoInput = document.getElementById('valorCustoFixo');
    const btnCancelarEdicao = document.getElementById('btnCancelarEdicaoCustoFixo');
    const totalCustosFixosElement = document.getElementById('totalCustosFixos');

    let custosFixos = Storage.getItems('custosFixos') || [];

    const renderCustosFixos = () => {
        tabelaCustosFixosBody.innerHTML = '';
        let totalGeral = 0;
        if (custosFixos.length === 0) {
            tabelaCustosFixosBody.innerHTML = `<tr><td colspan="4" class="no-data-message">Nenhum custo fixo cadastrado.</td></tr>`;
        } else {
            custosFixos.sort((a, b) => a.descricao.localeCompare(b.descricao)).forEach(custo => {
                const valor = App.parseFloatStrict(custo.valor);
                totalGeral += valor;
                const row = tabelaCustosFixosBody.insertRow();
                row.innerHTML = `
                    <td>${custo.id.substring(0,8)}...</td>
                    <td>${custo.descricao}</td>
                    <td>${App.formatCurrency(valor)}</td>
                    <td class="actions">
                        <button class="btn btn-sm btn-secondary btn-editar" data-id="${custo.id}" title="Editar"><i class="fas fa-edit"></i> Editar</button>
                        <button class="btn btn-sm btn-danger btn-excluir" data-id="${custo.id}" title="Excluir"><i class="fas fa-trash"></i> Excluir</button>
                    </td>
                `;
            });
        }
        totalCustosFixosElement.textContent = App.formatCurrency(totalGeral);
        addEventListenersAcoes();
        App.updateDashboardSummaryCards(); // Atualiza card no dashboard
    };

    const addEventListenersAcoes = () => {
        document.querySelectorAll('#tabelaCustosFixos .btn-editar').forEach(button => {
            button.addEventListener('click', (e) => handleEditar(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('#tabelaCustosFixos .btn-excluir').forEach(button => {
            button.addEventListener('click', (e) => handleExcluir(e.currentTarget.dataset.id));
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const id = custoFixoIdInput.value;
        const descricao = descricaoCustoFixoInput.value.trim();
        const valor = App.parseFloatStrict(valorCustoFixoInput.value);

        if (!descricao || isNaN(valor) || valor <= 0) {
            App.showNotification('Descrição e valor válido são obrigatórios.', 'error');
            return;
        }

        if (id) { // Editando
            const index = custosFixos.findIndex(cf => cf.id === id);
            if (index > -1) {
                custosFixos[index] = { ...custosFixos[index], descricao, valor };
                App.showNotification('Custo fixo atualizado!', 'success');
            }
        } else { // Adicionando
            const novoCusto = { id: Storage.generateUUID(), descricao, valor };
            custosFixos.push(novoCusto);
            App.showNotification('Custo fixo adicionado!', 'success');
        }
        
        Storage.saveItems('custosFixos', custosFixos);
        resetForm();
        renderCustosFixos();
    };

    const handleEditar = (id) => {
        const custo = custosFixos.find(cf => cf.id === id);
        if (custo) {
            custoFixoIdInput.value = custo.id;
            descricaoCustoFixoInput.value = custo.descricao;
            valorCustoFixoInput.value = App.formatCurrency(custo.valor, false).replace('.',',');
            formCustoFixo.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            btnCancelarEdicao.style.display = 'inline-block';
            descricaoCustoFixoInput.focus();
            window.scrollTo(0,0);
        }
    };

    const handleExcluir = (id) => {
        const custo = custosFixos.find(cf => cf.id === id);
        if (confirm(`Tem certeza que deseja excluir o custo fixo "${custo?.descricao || id}"?`)) {
            custosFixos = custosFixos.filter(cf => cf.id !== id);
            Storage.saveItems('custosFixos', custosFixos);
            renderCustosFixos();
            App.showNotification('Custo fixo excluído!', 'success');
            if (custoFixoIdInput.value === id) resetForm();
        }
    };

    const resetForm = () => {
        formCustoFixo.reset();
        custoFixoIdInput.value = '';
        formCustoFixo.querySelector('button[type="submit"]').textContent = 'Adicionar Custo Fixo';
        btnCancelarEdicao.style.display = 'none';
    };

    formCustoFixo.addEventListener('submit', handleSubmit);
    btnCancelarEdicao.addEventListener('click', resetForm);

    renderCustosFixos();
});
