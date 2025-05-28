document.addEventListener('DOMContentLoaded', () => {
    if (App.currentPage !== 'modelos.html') return;

    const formModelo = document.getElementById('formAdicionarModelo');
    const modeloIdInput = document.getElementById('modeloId');
    const nomeModeloInput = document.getElementById('nomeModelo');
    const insumosContainer = document.getElementById('insumosDoModeloContainer');
    const btnAdicionarInsumoAoModelo = document.getElementById('btnAdicionarInsumoAoModelo');
    const tabelaModelosBody = document.querySelector('#tabelaModelos tbody');
    const selectInsumoTemplate = document.getElementById('selectInsumoTemplate'); // Para clonar
    const btnCancelarEdicaoModelo = document.getElementById('btnCancelarEdicaoModelo');
    
    let modelos = Storage.getItems('modelos') || [];
    let todosInsumos = Storage.getItems('insumos') || [];

    // Função para renderizar a lista de modelos
    const renderModelos = () => {
        tabelaModelosBody.innerHTML = '';
        if (modelos.length === 0) {
            tabelaModelosBody.innerHTML = `<tr><td colspan="4" class="no-data-message">Nenhum modelo cadastrado.</td></tr>`;
            return;
        }
        modelos.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(modelo => {
            const custoTotalModelo = Calculadora.calcularCustoInsumosModelo(modelo, todosInsumos);
            const row = tabelaModelosBody.insertRow();
            row.innerHTML = `
                <td>${modelo.id.substring(0,8)}...</td>
                <td>${modelo.nome}</td>
                <td>${App.formatCurrency(custoTotalModelo)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary btn-editar-modelo" data-id="${modelo.id}" title="Editar"><i class="fas fa-edit"></i> Editar</button>
                    <button class="btn btn-sm btn-danger btn-excluir-modelo" data-id="${modelo.id}" title="Excluir"><i class="fas fa-trash"></i> Excluir</button>
                </td>
            `;
        });
        addEventListenersAcoesModelo();
        App.updateDashboardSummaryCards();
    };

    // Função para adicionar um novo campo de seleção de insumo e quantidade ao formulário
    const adicionarCampoInsumoAoFormulario = (insumoSelecionado = null) => {
        const div = document.createElement('div');
        div.className = 'form-row align-items-center mb-2 insumo-item-row';
        
        // Clonar o select de insumos
        const selectInsumo = selectInsumoTemplate.cloneNode(true);
        selectInsumo.removeAttribute('id'); // Remove ID para não duplicar
        selectInsumo.classList.remove('d-none'); // Torna visível
        selectInsumo.required = true;
        
        // Popular o select clonado
        App.populateSelect(selectInsumo, todosInsumos, 'id', (insumo) => `${insumo.nome} (${insumo.unidade}) - ${App.formatCurrency(insumo.custo)}`);
        
        if (insumoSelecionado && insumoSelecionado.insumoId) {
            selectInsumo.value = insumoSelecionado.insumoId;
        }

        const inputQuantidade = document.createElement('input');
        inputQuantidade.type = 'number';
        inputQuantidade.className = 'form-control';
        inputQuantidade.placeholder = 'Qtd.';
        inputQuantidade.step = '0.01';
        inputQuantidade.min = '0.01';
        inputQuantidade.required = true;
        inputQuantidade.value = (insumoSelecionado && insumoSelecionado.quantidade) ? App.formatCurrency(insumoSelecionado.quantidade, false).replace('.',',') : '';

        const btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.className = 'btn btn-sm btn-danger btn-remover-insumo-do-modelo';
        btnRemover.innerHTML = '<i class="fas fa-times"></i>';
        btnRemover.title = 'Remover Insumo';
        btnRemover.onclick = () => div.remove();

        div.innerHTML = `
            <div class="form-group" style="flex: 3;"></div>
            <div class="form-group" style="flex: 1;"></div>
            <div class="form-group" style="flex: 0 0 40px; text-align: right;"></div>
        `;
        div.children[0].appendChild(selectInsumo);
        div.children[1].appendChild(inputQuantidade);
        div.children[2].appendChild(btnRemover);
        
        insumosContainer.appendChild(div);
    };
    
    // Popula o select template uma vez para ser clonado
    if (selectInsumoTemplate) {
         App.populateSelect(selectInsumoTemplate, todosInsumos, 'id', (insumo) => `${insumo.nome} (${insumo.unidade}) - ${App.formatCurrency(insumo.custo)}`);
    }


    // Event listener para o botão "Adicionar Insumo ao Modelo"
    btnAdicionarInsumoAoModelo.addEventListener('click', () => adicionarCampoInsumoAoFormulario());

    // Lidar com submissão do formulário (Adicionar/Editar Modelo)
    formModelo.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = modeloIdInput.value;
        const nome = nomeModeloInput.value.trim();
        
        if (!nome) {
            App.showNotification('O nome do modelo é obrigatório.', 'error');
            return;
        }

        const insumosDoModelo = [];
        const insumoRows = insumosContainer.querySelectorAll('.insumo-item-row');
        let formValido = true;
        let insumosDuplicados = false;
        const insumosAdicionados = new Set();

        insumoRows.forEach(row => {
            const select = row.querySelector('select');
            const inputQtd = row.querySelector('input[type="number"]');
            const insumoId = select.value;
            const quantidade = App.parseFloatStrict(inputQtd.value);

            if (!insumoId || isNaN(quantidade) || quantidade <= 0) {
                formValido = false;
                return;
            }
            if (insumosAdicionados.has(insumoId)) {
                insumosDuplicados = true;
                return;
            }
            insumosAdicionados.add(insumoId);
            insumosDoModelo.push({ insumoId, quantidade });
        });

        if (!formValido) {
            App.showNotification('Verifique os insumos. Todos devem ser selecionados e ter quantidade válida.', 'error');
            return;
        }
        if (insumosDuplicados) {
            App.showNotification('Não é permitido adicionar o mesmo insumo mais de uma vez ao modelo.', 'error');
            return;
        }
        if (insumosDoModelo.length === 0) {
            App.showNotification('Um modelo deve ter pelo menos um insumo.', 'error');
            return;
        }

        const custoTotalInsumos = Calculadora.calcularCustoInsumosModelo({ insumos: insumosDoModelo }, todosInsumos);

        if (id) { // Editando
            const index = modelos.findIndex(m => m.id === id);
            if (index > -1) {
                modelos[index] = { ...modelos[index], nome, insumos: insumosDoModelo, custoInsumos: custoTotalInsumos };
                App.showNotification('Modelo atualizado com sucesso!', 'success');
            }
        } else { // Adicionando
            const novoModelo = {
                id: Storage.generateUUID(),
                nome,
                insumos: insumosDoModelo,
                custoInsumos: custoTotalInsumos
            };
            modelos.push(novoModelo);
            App.showNotification('Modelo adicionado com sucesso!', 'success');
        }

        Storage.saveItems('modelos', modelos);
        resetFormModelo();
        renderModelos();
    });

    // Função para resetar o formulário de modelo
    const resetFormModelo = () => {
        formModelo.reset();
        modeloIdInput.value = '';
        insumosContainer.innerHTML = ''; // Limpa os campos de insumos dinâmicos
        adicionarCampoInsumoAoFormulario(); // Adiciona um campo inicial
        formModelo.querySelector('button[type="submit"]').textContent = 'Adicionar Modelo';
        btnCancelarEdicaoModelo.style.display = 'none';
    };

    // Função para carregar dados de um modelo para edição
    const handleEditarModelo = (id) => {
        const modeloParaEditar = modelos.find(m => m.id === id);
        if (modeloParaEditar) {
            modeloIdInput.value = modeloParaEditar.id;
            nomeModeloInput.value = modeloParaEditar.nome;
            insumosContainer.innerHTML = ''; // Limpa campos existentes
            modeloParaEditar.insumos.forEach(insumoItem => {
                adicionarCampoInsumoAoFormulario(insumoItem);
            });
            if (modeloParaEditar.insumos.length === 0) { // Garante ao menos um campo se não houver insumos
                adicionarCampoInsumoAoFormulario();
            }
            formModelo.querySelector('button[type="submit"]').textContent = 'Salvar Alterações';
            btnCancelarEdicaoModelo.style.display = 'inline-block';
            nomeModeloInput.focus();
            window.scrollTo(0,0);
        }
    };

    // Função para excluir um modelo
    const handleExcluirModelo = (id) => {
        const producoes = Storage.getItems('producoes') || [];
        const isUsedInProduction = producoes.some(p => p.modeloId === id);

        if (isUsedInProduction) {
            App.showNotification('Este modelo está registrado em produções e não pode ser excluído.', 'error');
            return;
        }

        if (confirm(`Tem certeza que deseja excluir o modelo "${modelos.find(m=>m.id===id)?.nome || id}"?`)) {
            modelos = modelos.filter(m => m.id !== id);
            Storage.saveItems('modelos', modelos);
            renderModelos();
            App.showNotification('Modelo excluído com sucesso!', 'success');
            if (modeloIdInput.value === id) resetFormModelo();
        }
    };
    
    btnCancelarEdicaoModelo.addEventListener('click', resetFormModelo);

    // Adicionar event listeners aos botões de ação da tabela
    const addEventListenersAcoesModelo = () => {
        document.querySelectorAll('.btn-editar-modelo').forEach(button => {
            button.addEventListener('click', (e) => handleEditarModelo(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-excluir-modelo').forEach(button => {
            button.addEventListener('click', (e) => handleExcluirModelo(e.currentTarget.dataset.id));
        });
    };
    
    // Inicialização
    if (todosInsumos.length === 0) {
        App.showNotification('Cadastre insumos antes de criar modelos.', 'warning');
        btnAdicionarInsumoAoModelo.disabled = true;
        formModelo.querySelector('button[type="submit"]').disabled = true;
    } else {
         adicionarCampoInsumoAoFormulario(); // Adiciona o primeiro campo de insumo ao carregar
    }
    renderModelos();
});
