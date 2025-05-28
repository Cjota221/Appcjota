// js/modelos.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#modelos-page')) {
        loadModelos();
        loadInsumosForSelection();
        document.getElementById('modeloForm').addEventListener('submit', handleModeloSubmit);
        document.getElementById('modeloModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || e.target.classList.contains('modal')) {
                closeModal('modeloModal', clearModeloForm);
            }
        });
        document.getElementById('openAddModeloModal').addEventListener('click', () => {
            clearModeloForm();
            document.getElementById('modalTitle').textContent = 'Cadastrar Novo Modelo';
            openModal('modeloModal');
        });

        document.getElementById('modeloImagem').addEventListener('change', handleImageUpload);
        document.getElementById('addInsumoToModelo').addEventListener('click', addInsumoToModeloComposition);
        document.getElementById('modeloInsumosComposicao').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-insumo')) {
                e.target.closest('.insumo-item').remove();
                updateModeloCosts();
            }
        });

        document.getElementById('margemLucro').addEventListener('input', updateModeloCosts);
        document.getElementById('modeloNome').addEventListener('input', updateModeloCosts);
    }
});

function loadModelos() {
    const modelos = Storage.load('modelos');
    const modelosList = document.getElementById('modelosList');
    modelosList.innerHTML = '';

    if (modelos.length === 0) {
        modelosList.innerHTML = '<div class="card"><p class="text-center">Nenhum modelo cadastrado.</p></div>';
        return;
    }

    modelos.forEach(modelo => {
        const calculo = Calculadora.calculateModelCostFromObject(modelo);
        const { precoVendaSugerido, lucroEstimado } = Calculadora.suggestSellingPrice(calculo ? calculo.custoTotalUnitario : 0, modelo.margemLucro);

        const card = document.createElement('div');
        card.classList.add('card', 'modelo-card');
        card.innerHTML = `
            <div class="modelo-card-header">
                <img src="${modelo.imagem || 'assets/img/placeholder.png'}" alt="${modelo.nome}" class="modelo-thumb">
                <h3>${modelo.nome}</h3>
            </div>
            <div class="modelo-card-body">
                <p><strong>Custo Unitário Total:</strong> ${((calculo ? calculo.custoTotalUnitario : 0) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Margem de Lucro:</strong> ${modelo.margemLucro}%</p>
                <p><strong>Preço de Venda Sugerido:</strong> ${precoVendaSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p><strong>Lucro Estimado por Par:</strong> ${lucroEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            </div>
            <div class="modelo-card-actions">
                <button class="btn btn-info edit-btn" data-id="${modelo.id}">Editar</button>
                <button class="btn btn-danger delete-btn" data-id="${modelo.id}">Excluir</button>
            </div>
        `;
        modelosList.appendChild(card);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editModelo(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteModelo(e.target.dataset.id));
    });
}

function loadInsumosForSelection() {
    const insumos = Storage.load('insumos');
    const insumoSelect = document.getElementById('insumoSelect');
    insumoSelect.innerHTML = '<option value="">Selecione um Insumo</option>';
    insumos.forEach(insumo => {
        const option = document.createElement('option');
        option.value = insumo.id;
        option.textContent = `${insumo.nome} (${insumo.unidadeMedida} - ${parseFloat(insumo.custoUnidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
        insumoSelect.appendChild(option);
    });
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${e.target.result}" alt="Pré-visualização da imagem">`;
            document.getElementById('modeloImagemBase64').value = e.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('imagePreview').innerHTML = '<span>Clique ou arraste para adicionar imagem</span>';
        document.getElementById('modeloImagemBase64').value = '';
    }
}

function addInsumoToModeloComposition() {
    const insumoSelect = document.getElementById('insumoSelect');
    const quantidadeInsumo = document.getElementById('quantidadeInsumo').value;

    const insumoId = insumoSelect.value;
    const insumoText = insumoSelect.options[insumoSelect.selectedIndex].text;
    const insumoUnitCost = Storage.getById('insumos', insumoId).custoUnidade;

    if (!insumoId || !quantidadeInsumo || parseFloat(quantidadeInsumo) <= 0) {
        alert('Selecione um insumo e informe uma quantidade válida.');
        return;
    }

    const insumosComposicaoList = document.getElementById('modeloInsumosComposicao');

    const existingItem = insumosComposicaoList.querySelector(`li[data-id="${insumoId}"]`);
    if (existingItem) {
        alert('Este insumo já foi adicionado. Edite a quantidade diretamente ou remova e adicione novamente.');
        return;
    }

    const listItem = document.createElement('li');
    listItem.classList.add('insumo-item');
    listItem.dataset.id = insumoId;
    listItem.innerHTML = `
        <span>${insumoText.split('(')[0].trim()} - Qtd: ${quantidadeInsumo} - Custo: ${(parseFloat(quantidadeInsumo) * parseFloat(insumoUnitCost)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        <input type="hidden" name="insumoId" value="${insumoId}">
        <input type="hidden" name="quantidade" value="${quantidadeInsumo}">
        <button type="button" class="btn btn-danger btn-sm remove-insumo">Remover</button>
    `;
    insumosComposicaoList.appendChild(listItem);

    insumoSelect.value = '';
    document.getElementById('quantidadeInsumo').value = '';

    updateModeloCosts();
}

function updateModeloCosts() {
    const modeloNome = document.getElementById('modeloNome').value;
    const margemLucro = parseFloat(document.getElementById('margemLucro').value) || 0;

    const insumosComposicao = [];
    document.querySelectorAll('#modeloInsumosComposicao .insumo-item').forEach(item => {
        insumosComposicao.push({
            insumoId: item.querySelector('input[name="insumoId"]').value,
            quantidade: parseFloat(item.querySelector('input[name="quantidade"]').value)
        });
    });

    const tempModelo = {
        id: 'temp_calculation_id',
        nome: modeloNome,
        insumosComposicao: insumosComposicao,
        margemLucro: margemLucro
    };

    const calculo = Calculadora.calculateModelCostFromObject(tempModelo);
    if (calculo) {
        const { precoVendaSugerido, lucroEstimado } = Calculadora.suggestSellingPrice(calculo.custoTotalUnitario, margemLucro);

        document.getElementById('custoUnitarioTotal').textContent = calculo.custoTotalUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('precoVendaSugerido').textContent = precoVendaSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('lucroEstimadoPorPar').textContent = lucroEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('margemLucroDisplay').textContent = `${margemLucro}%`;
    } else {
        document.getElementById('custoUnitarioTotal').textContent = 'R$ 0,00';
        document.getElementById('precoVendaSugerido').textContent = 'R$ 0,00';
        document.getElementById('lucroEstimadoPorPar').textContent = 'R$ 0,00';
        document.getElementById('margemLucroDisplay').textContent = '0%';
    }
}


function handleModeloSubmit(event) {
    event.preventDefault();

    const modeloId = document.getElementById('modeloId').value;
    const nome = document.getElementById('modeloNome').value;
    const imagem = document.getElementById('modeloImagemBase64').value;
    const margemLucro = parseFloat(document.getElementById('margemLucro').value);

    const insumosComposicao = [];
    document.querySelectorAll('#modeloInsumosComposicao .insumo-item').forEach(item => {
        insumosComposicao.push({
            insumoId: item.querySelector('input[name="insumoId"]').value,
            quantidade: parseFloat(item.querySelector('input[name="quantidade"]').value)
        });
    });

    if (!nome || insumosComposicao.length === 0 || isNaN(margemLucro)) {
        alert('Por favor, preencha todos os campos obrigatórios e adicione pelo menos um insumo.');
        return;
    }

    const newModelo = {
        id: modeloId || Storage.generateId(),
        nome: nome,
        imagem: imagem,
        insumosComposicao: insumosComposicao,
        margemLucro: margemLucro
    };

    let success;
    if (modeloId) {
        success = Storage.update('modelos', modeloId, newModelo);
    } else {
        success = Storage.add('modelos', newModelo);
    }

    if (success) {
        alert(`Modelo ${modeloId ? 'atualizado' : 'cadastrado'} com sucesso!`);
        closeModal('modeloModal', clearModeloForm);
        loadModelos();
    } else {
        alert('Falha ao salvar o modelo.');
    }
}

function editModelo(id) {
    const modelo = Storage.getById('modelos', id);
    if (modelo) {
        document.getElementById('modeloId').value = modelo.id;
        document.getElementById('modeloNome').value = modelo.nome;
        document.getElementById('margemLucro').value = modelo.margemLucro;

        const preview = document.getElementById('imagePreview');
        if (modelo.imagem) {
            preview.innerHTML = `<img src="${modelo.imagem}" alt="Pré-visualização da imagem">`;
            document.getElementById('modeloImagemBase64').value = modelo.imagem;
        } else {
            preview.innerHTML = '<span>Clique ou arraste para adicionar imagem</span>';
            document.getElementById('modeloImagemBase64').value = '';
        }

        const insumosComposicaoList = document.getElementById('modeloInsumosComposicao');
        insumosComposicaoList.innerHTML = '';
        modelo.insumosComposicao.forEach(comp => {
            const insumo = Storage.getById('insumos', comp.insumoId);
            if (insumo) {
                const listItem = document.createElement('li');
                listItem.classList.add('insumo-item');
                listItem.dataset.id = comp.insumoId;
                listItem.innerHTML = `
                    <span>${insumo.nome} - Qtd: ${comp.quantidade} - Custo: ${(parseFloat(comp.quantidade) * parseFloat(insumo.custoUnidade)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <input type="hidden" name="insumoId" value="${comp.insumoId}">
                    <input type="hidden" name="quantidade" value="${comp.quantidade}">
                    <button type="button" class="btn btn-danger btn-sm remove-insumo">Remover</button>
                `;
                insumosComposicaoList.appendChild(listItem);
            }
        });

        document.getElementById('modalTitle').textContent = 'Editar Modelo';
        openModal('modeloModal');
        updateModeloCosts();
    }
}

function deleteModelo(id) {
    if (confirm('Tem certeza que deseja excluir este modelo? Isso também afetará produções relacionadas.')) {
        if (Storage.remove('modelos', id)) {
            alert('Modelo excluído com sucesso!');
            loadModelos();
        } else {
            alert('Falha ao excluir o modelo.');
        }
    }
}

function clearModeloForm() {
    document.getElementById('modeloForm').reset();
    document.getElementById('modeloId').value = '';
    document.getElementById('imagePreview').innerHTML = '<span>Clique ou arraste para adicionar imagem</span>';
    document.getElementById('modeloImagemBase64').value = '';
    document.getElementById('modeloInsumosComposicao').innerHTML = '';
    document.getElementById('custoUnitarioTotal').textContent = 'R$ 0,00';
    document.getElementById('precoVendaSugerido').textContent = 'R$ 0,00';
    document.getElementById('lucroEstimadoPorPar').textContent = 'R$ 0,00';
    document.getElementById('margemLucroDisplay').textContent = '0%';
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('open');
    }, 10);
}

function closeModal(modalId, callback = null) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('open');
    modal.addEventListener('transitionend', function handler() {
        modal.style.display = 'none';
        if (callback) {
            callback();
        }
        modal.removeEventListener('transitionend', handler);
    }, { once: true });
}
