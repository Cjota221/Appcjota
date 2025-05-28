// js/producao.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#producao-page')) { // Adicione um ID ao body do producao.html
        loadProducoes();
        loadModelosForProducao();
        document.getElementById('producaoForm').addEventListener('submit', handleProducaoSubmit);
        document.getElementById('addModeloToProducao').addEventListener('click', addModeloToProducaoComposition);
        document.getElementById('producaoModelosComposicao').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-modelo-producao')) {
                e.target.closest('.modelo-producao-item').remove();
                updateProducaoSummary();
            }
        });

        document.getElementById('producaoModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || e.target.classList.contains('modal')) {
                closeModal('producaoModal');
            }
        });
        document.getElementById('openAddProducaoModal').addEventListener('click', () => openModal('producaoModal'));
    }
});

function loadProducoes() {
    const producoes = Storage.load('producoes');
    const producoesList = document.getElementById('producoesList');
    producoesList.innerHTML = '';

    if (producoes.length === 0) {
        producoesList.innerHTML = '<tr><td colspan="6" class="text-center">Nenhuma produção registrada.</td></tr>';
        return;
    }

    producoes.forEach(producao => {
        const summary = Calculadora.calculateProductionSummary(producao.id);
        const totalPares = producao.modelosProduzidos.reduce((acc, item) => acc + item.quantidade, 0);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(producao.data).toLocaleDateString('pt-BR')}</td>
            <td>${producao.nomeProducao}</td>
            <td>${totalPares} Pares</td>
            <td>${(summary ? summary.custoTotalProducao : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td>${(summary ? summary.lucroTotalProducao : 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            <td class="actions">
                <button class="btn btn-info edit-btn" data-id="${producao.id}">Detalhes/Editar</button>
                <button class="btn btn-danger delete-btn" data-id="${producao.id}">Excluir</button>
            </td>
        `;
        producoesList.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editProducao(e.target.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteProducao(e.target.dataset.id));
    });
}

function loadModelosForProducao() {
    const modelos = Storage.load('modelos');
    const modeloSelect = document.getElementById('modeloProducaoSelect');
    modeloSelect.innerHTML = '<option value="">Selecione um Modelo</option>';
    modelos.forEach(modelo => {
        const option = document.createElement('option');
        option.value = modelo.id;
        option.textContent = modelo.nome;
        modeloSelect.appendChild(option);
    });
}

function addModeloToProducaoComposition() {
    const modeloSelect = document.getElementById('modeloProducaoSelect');
    const quantidadeProducao = document.getElementById('quantidadeProducaoModelo').value;
    const margemLucroProducao = parseFloat(document.getElementById('margemLucroProducaoModelo').value);

    const modeloId = modeloSelect.value;
    const modeloText = modeloSelect.options[modeloSelect.selectedIndex].text;

    if (!modeloId || !quantidadeProducao || parseFloat(quantidadeProducao) <= 0 || isNaN(margemLucroProducao)) {
        alert('Selecione um modelo, informe a quantidade e a margem de lucro.');
        return;
    }

    const producaoModelosComposicaoList = document.getElementById('producaoModelosComposicao');

    // Verifica se o modelo já foi adicionado
    const existingItem = producaoModelosComposicaoList.querySelector(`li[data-id="${modeloId}"]`);
    if (existingItem) {
        alert('Este modelo já foi adicionado para esta produção. Edite a quantidade diretamente ou remova e adicione novamente.');
        return;
    }

    const listItem = document.createElement('li');
    listItem.classList.add('modelo-producao-item');
    listItem.dataset.id = modeloId;
    listItem.innerHTML = `
        <span>${modeloText} - Qtd: ${quantidadeProducao} - Margem: ${margemLucroProducao}%</span>
        <input type="hidden" name="modeloId" value="${modeloId}">
        <input type="hidden" name="quantidade" value="${quantidadeProducao}">
        <input type="hidden" name="margemLucro" value="${margemLucroProducao}">
        <button type="button" class="btn btn-danger btn-sm remove-modelo-producao">Remover</button>
    `;
    producaoModelosComposicaoList.appendChild(listItem);

    // Limpa os campos após adicionar
    modeloSelect.value = '';
    document.getElementById('quantidadeProducaoModelo').value = '';
    document.getElementById('margemLucroProducaoModelo').value = '';

    updateProducaoSummary();
}

function updateProducaoSummary() {
    const modelosProduzidos = [];
    document.querySelectorAll('#producaoModelosComposicao .modelo-producao-item').forEach(item => {
        modelosProduzidos.push({
            modeloId: item.querySelector('input[name="modeloId"]').value,
            quantidade: parseFloat(item.querySelector('input[name="quantidade"]').value),
            margemLucro: parseFloat(item.querySelector('input[name="margemLucro"]').value)
        });
    });

    // Crie um objeto de produção temporário para usar na calculadora
    const tempProducao = {
        id: 'temp',
        modelosProduzidos: modelosProduzidos,
        data: new Date().toISOString().split('T')[0], // A data não é crucial para o resumo
        nomeProducao: 'Resumo Temporário'
    };

    // Salva a produção temporariamente para que a Calculadora possa acessá-la
    // (Similar ao hack para Modelos, será melhor refatorar a Calculadora para aceitar objetos diretos)
    // Para o MVP, vamos salvá-lo e imediatamente buscar.

    // A maneira correta seria:
    // const summary = Calculadora.calculateProductionSummaryFromObject(tempProducao);
    // Para fins de demonstração, vamos simular que funciona com o Storage.

    // Simulação do cálculo (se a Calculadora.calculateProductionSummary aceitasse um objeto direto)
    let totalCustoProducao = 0;
    let totalLucroProducao = 0;
    let totalParesProduzidos = 0;

    modelosProduzidos.forEach(prodItem => {
        const modelo = Storage.getById('modelos', prodItem.modeloId);
        if (modelo) {
            const modeloCalculo = Calculadora.calculateModelCostFromObject(modelo);
            if (modeloCalculo) {
                const precoVendaSugerido = Calculadora.suggestSellingPrice(modeloCalculo.custoTotalUnitario, prodItem.margemLucro);
                totalCustoProducao += modeloCalculo.custoTotalUnitario * prodItem.quantidade;
                totalLucroProducao += precoVendaSugerido.lucroEstimado * prodItem.quantidade;
                totalParesProduzidos += prodItem.quantidade;
            }
        }
    });

    document.getElementById('custoTotalProducao').textContent = totalCustoProducao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('lucroTotalProducao').textContent = totalLucroProducao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('totalParesProduzidos').textContent = `${totalParesProduzidos} Pares`;
    document.getElementById('precoMinimoVenda').textContent = totalParesProduzidos > 0 ? (totalCustoProducao / totalParesProduzidos).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
}


function handleProducaoSubmit(event) {
    event.preventDefault();

    const producaoId = document.getElementById('producaoId').value;
    const nomeProducao = document.getElementById('nomeProducao').value;
    const dataProducao = document.getElementById('dataProducao').value;

    const modelosProduzidos = [];
    document.querySelectorAll('#producaoModelosComposicao .modelo-producao-item').forEach(item => {
        modelosProduzidos.push({
            modeloId: item.querySelector('input[name="modeloId"]').value,
            quantidade: parseFloat(item.querySelector('input[name="quantidade"]').value),
            margemLucro: parseFloat(item.querySelector('input[name="margemLucro"]').value)
        });
    });

    if (!nomeProducao || !dataProducao || modelosProduzidos.length === 0) {
        alert('Por favor, preencha todos os campos e adicione pelo menos um modelo produzido.');
        return;
    }

    const newProducao = {
        id: producaoId || Storage.generateId(),
        nomeProducao: nomeProducao,
        data: dataProducao,
        modelosProduzidos: modelosProduzidos
    };

    let success;
    if (producaoId) {
        success = Storage.update('producoes', producaoId, newProducao);
    } else {
        success = Storage.add('producoes', newProducao);
    }

    if (success) {
        alert(`Produção ${producaoId ? 'atualizada' : 'registrada'} com sucesso!`);
        closeModal('producaoModal');
        clearProducaoForm();
        loadProducoes();
    } else {
        alert('Falha ao salvar a produção.');
    }
}

function editProducao(id) {
    const producao = Storage.getById('producoes', id);
    if (producao) {
        document.getElementById('producaoId').value = producao.id;
        document.getElementById('nomeProducao').value = producao.nomeProducao;
        document.getElementById('dataProducao').value = producao.data;

        const producaoModelosComposicaoList = document.getElementById('producaoModelosComposicao');
        producaoModelosComposicaoList.innerHTML = '';
        producao.modelosProduzidos.forEach(prodItem => {
            const modelo = Storage.getById('modelos', prodItem.modeloId);
            if (modelo) {
                const listItem = document.createElement('li');
                listItem.classList.add('modelo-producao-item');
                listItem.dataset.id = prodItem.modeloId;
                listItem.innerHTML = `
                    <span>${modelo.nome} - Qtd: ${prodItem.quantidade} - Margem: ${prodItem.margemLucro}%</span>
                    <input type="hidden" name="modeloId" value="${prodItem.modeloId}">
                    <input type="hidden" name="quantidade" value="${prodItem.quantidade}">
                    <input type="hidden" name="margemLucro" value="${prodItem.margemLucro}">
                    <button type="button" class="btn btn-danger btn-sm remove-modelo-producao">Remover</button>
                `;
                producaoModelosComposicaoList.appendChild(listItem);
            }
        });

        document.getElementById('modalTitle').textContent = 'Editar Produção';
        openModal('producaoModal');
        updateProducaoSummary();
    }
}

function deleteProducao(id) {
    if (confirm('Tem certeza que deseja excluir este registro de produção?')) {
        if (Storage.remove('producoes', id)) {
            alert('Produção excluída com sucesso!');
            loadProducoes();
        } else {
            alert('Falha ao excluir a produção.');
        }
    }
}

function clearProducaoForm() {
    document.getElementById('producaoForm').reset();
    document.getElementById('producaoId').value = '';
    document.getElementById('producaoModelosComposicao').innerHTML = '';
    document.getElementById('custoTotalProducao').textContent = 'R$ 0,00';
    document.getElementById('lucroTotalProducao').textContent = 'R$ 0,00';
    document.getElementById('totalParesProduzidos').textContent = '0 Pares';
    document.getElementById('precoMinimoVenda').textContent = 'R$ 0,00';
    document.getElementById('modalTitle').textContent = 'Registrar Nova Produção';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    clearProducaoForm();
}
