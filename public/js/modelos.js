// js/modelos.js

document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('#modelos-page')) { // Adicione um ID ao body do modelos.html
        loadModelos();
        loadInsumosForSelection(); // Carrega insumos para o dropdown
        document.getElementById('modeloForm').addEventListener('submit', handleModeloSubmit);
        document.getElementById('modeloModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('close-button') || e.target.classList.contains('modal')) {
                closeModal('modeloModal');
            }
        });
        document.getElementById('openAddModeloModal').addEventListener('click', () => openModal('modeloModal'));

        document.getElementById('modeloImagem').addEventListener('change', handleImageUpload);
        document.getElementById('addInsumoToModelo').addEventListener('click', addInsumoToModeloComposition);
        document.getElementById('modeloInsumosComposicao').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-insumo')) {
                e.target.closest('.insumo-item').remove();
                updateModeloCosts();
            }
        });

        // Event listeners para recalcular ao mudar inputs de custo/margem
        document.getElementById('margemLucro').addEventListener('input', updateModeloCosts);
        // Os campos de insumo serão atualizados ao adicionar/remover

    }
});

function loadModelos() {
    const modelos = Storage.load('modelos');
    const modelosList = document.getElementById('modelosList');
    modelosList.innerHTML = ''; // Limpa a lista existente

    if (modelos.length === 0) {
        modelosList.innerHTML = '<div class="card"><p class="text-center">Nenhum modelo cadastrado.</p></div>';
        return;
    }

    modelos.forEach(modelo => {
        const calculo = Calculadora.calculateModelCost(modelo.id);
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
            document.getElementById('modeloImagemBase64').value = e.target.result; // Armazena em base64
        };
        reader.readAsDataURL(file);
    } else {
        document.getElementById('imagePreview').innerHTML = '<span>Pré-visualização da Imagem</span>';
        document.getElementById('modeloImagemBase64').value = '';
    }
}

function addInsumoToModeloComposition() {
    const insumoSelect = document.getElementById('insumoSelect');
    const quantidadeInsumo = document.getElementById('quantidadeInsumo').value;

    const insumoId = insumoSelect.value;
    const insumoText = insumoSelect.options[insumoSelect.selectedIndex].text;

    if (!insumoId || !quantidadeInsumo || parseFloat(quantidadeInsumo) <= 0) {
        alert('Selecione um insumo e informe uma quantidade válida.');
        return;
    }

    const insumosComposicaoList = document.getElementById('modeloInsumosComposicao');

    // Verifica se o insumo já foi adicionado
    const existingItem = insumosComposicaoList.querySelector(`li[data-id="${insumoId}"]`);
    if (existingItem) {
        alert('Este insumo já foi adicionado. Edite a quantidade diretamente ou remova e adicione novamente.');
        return;
    }

    const listItem = document.createElement('li');
    listItem.classList.add('insumo-item');
    listItem.dataset.id = insumoId;
    listItem.innerHTML = `
        <span>${insumoText.split('(')[0].trim()} - Qtd: ${quantidadeInsumo}</span>
        <input type="hidden" name="insumoId" value="${insumoId}">
        <input type="hidden" name="quantidade" value="${quantidadeInsumo}">
        <button type="button" class="btn btn-danger btn-sm remove-insumo">Remover</button>
    `;
    insumosComposicaoList.appendChild(listItem);

    // Limpa os campos após adicionar
    insumoSelect.value = '';
    document.getElementById('quantidadeInsumo').value = '';

    updateModeloCosts(); // Recalcula os custos ao adicionar um insumo
}

function updateModeloCosts() {
    const modeloId = document.getElementById('modeloId').value;
    const modeloNome = document.getElementById('modeloNome').value;
    const margemLucro = parseFloat(document.getElementById('margemLucro').value) || 0;

    const insumosComposicao = [];
    document.querySelectorAll('#modeloInsumosComposicao .insumo-item').forEach(item => {
        insumosComposicao.push({
            insumoId: item.dataset.id,
            quantidade: parseFloat(item.querySelector('input[name="quantidade"]').value)
        });
    });

    // Simula o objeto modelo para cálculo temporário
    const tempModelo = {
        id: modeloId || 'temp', // Usa um ID temporário para cálculo
        nome: modeloNome,
        insumosComposicao: insumosComposicao,
        margemLucro: margemLucro
    };

    // Salva o modelo temporariamente para que o calculador possa acessá-lo
    // Isso é uma simplificação. Em um cenário real, você passaria os dados diretamente para a função de cálculo.
    // Para fins de demonstração, vamos simular como se o modelo estivesse salvo.
    // Uma alternativa seria modificar `calculateModelCost` para aceitar um objeto de modelo diretamente, sem depender do Storage.
    // Para o MVP, vamos salvá-lo e imediatamente buscar.

    // Isso é um hack: para que Calculadora.calculateModelCost possa encontrar o modelo,
    // ele precisa estar no storage. Para evitar salvar modelos incompletos,
    // vamos passar os dados brutos para o cálculo, se possível.
    // Vamos ajustar `Calculadora.calculateModelCost` para aceitar um objeto de modelo.

    const calculo = Calculadora.calculateModelCostFromObject(tempModelo);
    if (calculo) {
        const { precoVendaSugerido, lucroEstimado } = Calculadora.suggestSellingPrice(calculo.custoTotalUnitario, margemLucro);

        document.getElementById('custoUnitarioTotal').textContent = calculo.custoTotalUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('precoVendaSugerido').textContent = precoVendaSugerido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('lucroEstimadoPorPar').textContent = lucroEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else {
        document.getElementById('custoUnitarioTotal').textContent = 'R$ 0,00';
        document.getElementById('precoVendaSugerido').textContent = 'R$ 0,00';
        document.getElementById('lucroEstimadoPorPar').textContent = 'R$ 0,00';
    }
}

// Adaptação de Calculadora.calculateModelCost para aceitar um objeto de modelo
// (Isso seria feito no js/calculadora.js)
// Para o propósito deste rascunho, vamos simular que esta função existe
// Temporariamente, vou colocar a versão adaptada aqui para ilustração

const Calculadora = (function() {
    function calculateModelCost(modelId) {
        const modelo = Storage.getById('modelos', modelId);
        if (!modelo) {
            console.error('Modelo não encontrado para cálculo:', modelId);
            return null;
        }
        return calculateModelCostFromObject(modelo);
    }

    function calculateModelCostFromObject(modeloObj) {
        const insumos = Storage.load('insumos');
        const custosFixos = Storage.load('custosFixos');
        const custosVariaveis = Storage.load('custosVariaveis');
        const producoes = Storage.load('producoes');

        let custoInsumos = 0;
        modeloObj.insumosComposicao.forEach(comp => {
            const insumo = insumos.find(i => i.id === comp.insumoId);
            if (insumo) {
                custoInsumos += parseFloat(insumo.custoUnidade) * parseFloat(comp.quantidade);
            }
        });

        const totalProducaoMensal = producoes.reduce((acc, prod) => acc + parseFloat(prod.quantidade), 0);
        let custoFixoRateadoPorUnidade = 0;
        if (totalProducaoMensal > 0) {
            const totalCustosFixos = custosFixos.reduce((acc, custo) => acc + parseFloat(custo.valorMensal), 0);
            custoFixoRateadoPorUnidade = totalCustosFixos / totalProducaoMensal;
        }

        const totalCustosVariaveisPorUnidade = custosVariaveis.reduce((acc, custo) => acc + parseFloat(custo.valor), 0);

        const custoTotalUnitario = custoInsumos + custoFixoRateadoPorUnidade + totalCustosVariaveisPorUnidade;

        return {
            custoInsumos: custoInsumos,
            custoFixoRateado: custoFixoRateadoPorUnidade,
            custoVariavel: totalCustosVariaveisPorUnidade,
            custoTotalUnitario: custoTotalUnitario
        };
    }

    function suggestSellingPrice(custoTotalUnitario, margemLucroPercentual) {
        if (margemLucroPercentual < 0) {
            return { precoVendaSugerido: 0, lucroEstimado: 0 };
        }
        const margemDecimal = margemLucroPercentual / 100;
        // Evita divisão por zero ou negativo se a margem for 100% ou mais
        if (1 - margemDecimal <= 0) return { precoVendaSugerido: Infinity, lucroEstimado: Infinity };
        const precoVendaSugerido = custoTotalUnitario / (1 - margemDecimal);
        const lucroEstimado = precoVendaSugerido - custoTotalUnitario;

        return {
            precoVendaSugerido: precoVendaSugerido,
            lucroEstimado: lucroEstimado
        };
    }

    function calculateProductionSummary(producaoId) {
        const producao = Storage.getById('producoes', producaoId);
        if (!producao) {
            return null;
        }

        let custoTotalProducao = 0;
        let lucroTotalProducao = 0;
        let insumosConsumidos = {}; // { insumoId: quantidadeConsumida }

        producao.modelosProduzidos.forEach(prodItem => {
            const modelo = Storage.getById('modelos', prodItem.modeloId);
            if (modelo) {
                const modeloCalculo = calculateModelCostFromObject(modelo); // Use a função adaptada
                if (modeloCalculo) {
                    const precoVendaSugerido = suggestSellingPrice(modeloCalculo.custoTotalUnitario, prodItem.margemLucro);
                    custoTotalProducao += modeloCalculo.custoTotalUnitario * prodItem.quantidade;
                    lucroTotalProducao += precoVendaSugerido.lucroEstimado * prodItem.quantidade;

                    modelo.insumosComposicao.forEach(comp => {
                        const insumoId = comp.insumoId;
                        const quantidadeConsumida = parseFloat(comp.quantidade) * prodItem.quantidade;
                        insumosConsumidos[insumoId] = (insumosConsumidos[insumoId] || 0) + quantidadeConsumida;
                    });
                }
            }
        });

        return {
            custoTotalProducao: custoTotalProducao,
            lucroTotalProducao: lucroTotalProducao,
            insumosConsumidos: insumosConsumidos
        };
    }

    return {
        calculateModelCost,
        calculateModelCostFromObject, // Exponha a função adaptada
        suggestSellingPrice,
        calculateProductionSummary
    };
})();
// Fim da adaptação temporária

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
        closeModal('modeloModal');
        clearModeloForm();
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

        // Carregar imagem de volta
        const preview = document.getElementById('imagePreview');
        if (modelo.imagem) {
            preview.innerHTML = `<img src="${modelo.imagem}" alt="Pré-visualização da imagem">`;
            document.getElementById('modeloImagemBase64').value = modelo.imagem;
        } else {
            preview.innerHTML = '<span>Pré-visualização da Imagem</span>';
            document.getElementById('modeloImagemBase64').value = '';
        }

        // Carregar insumos da composição
        const insumosComposicaoList = document.getElementById('modeloInsumosComposicao');
        insumosComposicaoList.innerHTML = '';
        modelo.insumosComposicao.forEach(comp => {
            const insumo = Storage.getById('insumos', comp.insumoId);
            if (insumo) {
                const listItem = document.createElement('li');
                listItem.classList.add('insumo-item');
                listItem.dataset.id = comp.insumoId;
                listItem.innerHTML = `
                    <span>${insumo.nome} - Qtd: ${comp.quantidade}</span>
                    <input type="hidden" name="insumoId" value="${comp.insumoId}">
                    <input type="hidden" name="quantidade" value="${comp.quantidade}">
                    <button type="button" class="btn btn-danger btn-sm remove-insumo">Remover</button>
                `;
                insumosComposicaoList.appendChild(listItem);
            }
        });

        document.getElementById('modalTitle').textContent = 'Editar Modelo';
        openModal('modeloModal');
        updateModeloCosts(); // Recalcula os custos ao carregar para edição
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
    document.getElementById('imagePreview').innerHTML = '<span>Pré-visualização da Imagem</span>';
    document.getElementById('modeloImagemBase64').value = '';
    document.getElementById('modeloInsumosComposicao').innerHTML = '';
    document.getElementById('custoUnitarioTotal').textContent = 'R$ 0,00';
    document.getElementById('precoVendaSugerido').textContent = 'R$ 0,00';
    document.getElementById('lucroEstimadoPorPar').textContent = 'R$ 0,00';
    document.getElementById('modalTitle').textContent = 'Adicionar Novo Modelo';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    clearModeloForm();
}
